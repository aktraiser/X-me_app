import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';

// Configuration pour l'environnement Edge
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Vérification des variables d'environnement requises
const requiredEnvVars = {
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

// Vérifier que toutes les variables d'environnement sont définies
Object.entries(requiredEnvVars).forEach(([name, value]) => {
  if (!value) {
    throw new Error(`La variable d'environnement ${name} n'est pas définie`);
  }
});

// Configuration de Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
  httpClient: Stripe.createFetchHttpClient(),
});

// Configuration du crypto provider pour l'environnement Edge
const cryptoProvider = Stripe.createSubtleCryptoProvider();

// Configuration de Supabase avec le service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
      console.error('❌ Signature manquante dans les headers');
      return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!,
        undefined,
        cryptoProvider
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error(`❌ Erreur webhook: ${errorMessage}`);
      return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 });
    }

    console.log(`✅ Événement vérifié: ${event.type} (ID: ${event.id})`);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Session complète:', JSON.stringify(session, null, 2));

      const userId = session.client_reference_id;
      const userEmail = session.customer_details?.email;

      if (!userId && !userEmail) {
        console.error('❌ Aucun identifiant utilisateur trouvé dans la session');
        return NextResponse.json(
          { error: "Impossible d'identifier l'utilisateur" },
          { status: 400 }
        );
      }

      try {
        // D'abord, chercher l'utilisateur dans la table auth.users
        const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId!);

        if (userError) {
          console.error('❌ Erreur lors de la recherche de l\'utilisateur:', userError);
          throw userError;
        }

        if (!user) {
          throw new Error(`Utilisateur non trouvé (ID: ${userId})`);
        }

        // Ensuite, chercher ou créer le profil
        let { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, credits')
          .eq('id', user.user.id)
          .single();

        if (profileError) {
          console.error('❌ Erreur lors de la recherche du profil:', profileError);
          throw profileError;
        }

        // Si le profil n'existe pas, le créer
        if (!profile) {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([
              {
                id: user.user.id,
                email: user.user.email,
                credits: 0,
                updated_at: new Date().toISOString()
              }
            ])
            .select()
            .single();

          if (createError) {
            console.error('❌ Erreur lors de la création du profil:', createError);
            throw createError;
          }

          profile = newProfile;
        }

        // Mise à jour des crédits
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            credits: ((profile?.credits || 0) + 1),
            updated_at: new Date().toISOString()
          })
          .eq('id', profile?.id);

        if (updateError) {
          console.error('❌ Erreur lors de la mise à jour des crédits:', updateError);
          throw updateError;
        }

        console.log(`✅ Crédits mis à jour pour l'utilisateur ${profile?.id}`);
        return NextResponse.json({ success: true });

      } catch (error) {
        console.error('❌ Erreur lors du traitement:', error);
        return NextResponse.json(
          { error: "Erreur lors de la mise à jour des crédits" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('❌ Erreur générale:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 