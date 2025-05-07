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
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/login(.*)",
  "/register(.*)",
  "/auth(.*)",
  "/forgot-password(.*)"
]);

// Récupérer la clé publique de l'environnement ou utiliser une valeur fixe si non disponible
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_live_Y2xlcmsueGFuZG1lLmZyJA';

// Utiliser le middleware officiel de Clerk
export default clerkMiddleware(async (auth, req) => {
  // Pour les routes publiques ou d'authentification, ne pas protéger
  if (publicRoutes(req) || authRoutes(req)) {
    return NextResponse.next();
  }
  
  // Pour toutes les autres routes, protéger
  const isAuthenticated = await auth.protect();
  
  // Créer la réponse
  const response = NextResponse.next();
  
  // Ajouter l'en-tête CSP pour permettre l'utilisation de eval() par Clerk
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://clerk.xandme.fr;
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://*.clerk.accounts.dev https://clerk.xandme.fr;
    font-src 'self' data:;
    object-src 'none';
    connect-src 'self' https://*.clerk.accounts.dev https://clerk.xandme.fr https://api.xandme.fr;
    frame-src 'self' https://*.clerk.accounts.dev https://clerk.xandme.fr;
  `.replace(/\s{2,}/g, ' ').trim();
  
  response.headers.set('Content-Security-Policy', cspHeader);
  
  // Si la protection réussit, l'utilisateur est authentifié
  return response;
}, {
  // Fournir explicitement la clé publique
  publishableKey: publishableKey,
  // Activer le debug en développement
  debug: process.env.NODE_ENV === 'development'
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};