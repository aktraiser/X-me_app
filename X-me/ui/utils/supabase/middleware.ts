import { NextResponse, type NextRequest } from "next/server";

// Fonction temporaire en attendant la migration complète vers Clerk
export async function updateSession(request: NextRequest) {
  // Rediriger vers le nouvel auth middleware (Clerk)
  return NextResponse.next();
} 