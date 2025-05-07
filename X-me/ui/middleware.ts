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

// Fonction pour ajouter les headers CSP pour Clerk
function addClerkCSPHeaders(response: NextResponse): NextResponse {
  // Obtenir les headers existants
  const headers = new Headers(response.headers);
  
  // Définir la politique CSP qui autorise Clerk et eval()
  const cspContent = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://clerk.xandme.fr https://*.clerk.accounts.dev;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https://clerk.xandme.fr https://*.clerk.accounts.dev;
    font-src 'self';
    object-src 'none';
    connect-src 'self' https://clerk.xandme.fr https://*.clerk.accounts.dev;
    frame-src 'self' https://clerk.xandme.fr https://*.clerk.accounts.dev;
  `.replace(/\s+/g, ' ').trim();
  
  headers.set('Content-Security-Policy', cspContent);
  
  // Créer une nouvelle réponse avec les headers
  return NextResponse.next({ headers });
}

// Utiliser le middleware officiel de Clerk
export default clerkMiddleware(async (auth, req) => {
  // Pour les routes publiques ou d'authentification, ne pas protéger
  if (publicRoutes(req) || authRoutes(req)) {
    // Ajouter les headers CSP à la réponse
    return addClerkCSPHeaders(NextResponse.next());
  }
  
  // Pour toutes les autres routes, protéger
  const isAuthenticated = await auth.protect();
  
  // Si la protection réussit, l'utilisateur est authentifié
  // Ajouter également les headers CSP
  return addClerkCSPHeaders(NextResponse.next());
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