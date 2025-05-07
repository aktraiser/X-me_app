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
  "/forgot-password(.*)",
  "/reset-password(.*)"
]);

// Fonction pour ajouter les headers CSP nécessaires pour Clerk
function addClerkCSPHeaders(response: NextResponse): NextResponse {
  // Obtenir les headers existants
  const headers = new Headers(response.headers);
  
  // Définir la politique CSP qui autorise Clerk et eval()
  const cspContent = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://clerk.xandme.fr https://*.clerk.accounts.dev;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https://clerk.xandme.fr https://*.clerk.accounts.dev https://i.imgur.com;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://clerk.xandme.fr https://*.clerk.accounts.dev;
    frame-src 'self' https://clerk.xandme.fr https://*.clerk.accounts.dev;
  `.replace(/\s+/g, ' ').trim();
  
  headers.set('Content-Security-Policy', cspContent);
  
  // Créer une nouvelle réponse avec les headers
  return NextResponse.next({ headers });
}

// Récupérer la clé publique depuis les variables d'environnement
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_live_Y2xlcmsueGFuZG1lLmZyJA';

// Utiliser le middleware officiel de Clerk
export default clerkMiddleware(async (auth, req) => {
  // Pour les routes publiques ou d'authentification, ne pas protéger
  if (publicRoutes(req) || authRoutes(req)) {
    return addClerkCSPHeaders(NextResponse.next());
  }
  
  // Pour toutes les autres routes, protéger
  await auth.protect();
  
  // Ajouter les headers CSP à la réponse
  return addClerkCSPHeaders(NextResponse.next());
}, {
  // Fournir explicitement la clé publique
  publishableKey: publishableKey,
  // Activer le mode debug en développement
  debug: process.env.NODE_ENV === 'development'
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files except in search params
    '/((?!_next|api|trpc|[\\w-]+\\.\\w+).*)',
    // Include API and tRPC routes
    '/(api|trpc)(.*)'
  ],
};