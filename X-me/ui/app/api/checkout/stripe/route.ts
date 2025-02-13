import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from "next/server";
import { cookies } from 'next/headers';
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('La variable d\'environnement STRIPE_SECRET_KEY n\'est pas définie');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-01-27.acacia'
});

export async function POST(req: NextRequest) {
  try {
    // Créer le client Supabase et attendre sa résolution
    const supabase = await createClient();

    // Vérifier l'authentification
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json(
        {
          error: {
            code: "no-access",
            message: "Vous n'êtes pas connecté.",
          },
        },
        { status: 401 }
      );
    }

    // Créer ou récupérer le client Stripe
    let stripeCustomer = await stripe.customers.list({
      email: session.user.email,
      limit: 1,
    });

    let customerId: string;

    if (stripeCustomer.data.length === 0) {
      // Créer un nouveau client Stripe
      const customer = await stripe.customers.create({
        email: session.user.email,
        metadata: {
          supabaseUserId: session.user.id,
        },
      });
      customerId = customer.id;
    } else {
      customerId = stripeCustomer.data[0].id;
    }

    // Créer la session de checkout
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      line_items: [
        {
          price: 'price_1QrDjWHFhbg7l1Zn0eTfFXLq', // Remplacer par votre price_id
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_WEBSITE_URL}/settings?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_WEBSITE_URL}/settings?canceled=true`,
      client_reference_id: session.user.id,
      metadata: {
        userId: session.user.id,
      },
    });

    if (!checkoutSession.url) {
      return NextResponse.json(
        {
          error: {
            code: "stripe-error",
            message: "Impossible de créer la session de paiement",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ session: checkoutSession }, { status: 200 });
  } catch (err) {
    console.error('Erreur lors de la création de la session:', err);
    return NextResponse.json(
      {
        error: {
          code: "server-error",
          message: "Une erreur est survenue lors de la création de la session",
        },
      },
      { status: 500 }
    );
  }
} 