import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Créer un matcher pour les routes publiques qui ne nécessitent pas d'authentification
const publicRoutes = createRouteMatcher([
  "/",
  "/politique-confidentialite(.*)",
  "/conditions-utilisation(.*)",
  "/privacy(.*)",
  "/terms(.*)",
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

// Utiliser le middleware officiel de Clerk
export default clerkMiddleware(async (auth, req) => {
  // Pour les routes publiques ou d'authentification, ne pas protéger
  if (publicRoutes(req) || authRoutes(req)) {
    return NextResponse.next();
  }
  
  // Pour toutes les autres routes, protéger
  const isAuthenticated = await auth.protect();
  
  // Si la protection réussit, l'utilisateur est authentifié
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};