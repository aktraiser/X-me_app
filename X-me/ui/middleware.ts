import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

// Créer un matcher pour les routes d'API
const apiRoutes = createRouteMatcher(["/api(.*)"])

// Créer un matcher pour les routes d'authentification Clerk
const authRoutes = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/login(.*)",
  "/register(.*)",
  "/auth(.*)",
  "/forgot-password(.*)",
  "/terms(.*)",
  "/privacy(.*)"
]);

// Middleware temporaire pendant la migration
const temporaryMiddleware = (request: NextRequest) => {
  // Pour les routes API, on laisse passer
  if (apiRoutes(request)) {
    return NextResponse.next();
  }

  // Pour les routes d'authentification, on ajoute un en-tête personnalisé
  // qui sera utilisé côté client pour masquer la navigation
  if (authRoutes(request)) {
    const response = NextResponse.next();
    response.headers.set("x-auth-route", "true");
    return response;
  }
  
  // Vérifier si l'utilisateur est authentifié via un cookie ou un JWT
  // Pour le moment, on redirige vers la page de login si non connecté
  // À remplacer par une vérification d'authentification complète
  const authToken = request.cookies.get('__session');
  
  if (!authToken) {
    // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  return NextResponse.next();
}

// Utiliser temporaryMiddleware pendant la migration, puis on remettra clerkMiddleware
export default temporaryMiddleware;

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};