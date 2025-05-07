import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Créer un matcher pour les routes publiques qui ne nécessitent pas d'authentification
const publicRoutes = createRouteMatcher([
  // La route principale "/" n'est plus publique
  "/politique-confidentialite(.*)",
  "/conditions-utilisation(.*)",
  "/a-propos(.*)"
]);

// Créer un matcher pour les routes d'authentification Clerk
const authRoutes = createRouteMatcher([
  // Routes standards de Clerk
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/login(.*)",
  "/register(.*)",
  "/auth(.*)",
  "/forgot-password(.*)",
  // Routes personnalisées en français
  "/connexion(.*)",
  "/inscription(.*)",
  "/mot-de-passe-oublie(.*)"
]);

// Récupérer la clé publique de l'environnement ou utiliser une valeur fixe si non disponible
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_live_Y2xlcmsueGFuZG1lLmZyJA';

// Utiliser le middleware officiel de Clerk
export default clerkMiddleware(async (auth, req) => {
  // Pour les routes publiques ou d'authentification, ne pas protéger
  if (publicRoutes(req) || authRoutes(req)) {
    // Rediriger les chemins personnalisés vers les chemins standards de Clerk
    const url = req.nextUrl.clone();
    const path = url.pathname;
    
    // Redirection des routes personnalisées
    if (path.startsWith('/connexion')) {
      url.pathname = path.replace('/connexion', '/sign-in');
      return NextResponse.redirect(url);
    }
    else if (path.startsWith('/inscription')) {
      url.pathname = path.replace('/inscription', '/sign-up');
      return NextResponse.redirect(url);
    }
    else if (path.startsWith('/mot-de-passe-oublie')) {
      url.pathname = path.replace('/mot-de-passe-oublie', '/forgot-password');
      return NextResponse.redirect(url);
    }
    
    return NextResponse.next();
  }
  
  // Pour toutes les autres routes, protéger
  const isAuthenticated = await auth.protect();
  
  // Si la protection réussit, l'utilisateur est authentifié
  return NextResponse.next();
}, {
  // Fournir explicitement la clé publique
  publishableKey: publishableKey
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};