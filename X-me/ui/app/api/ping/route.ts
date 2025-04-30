import { NextResponse } from 'next/server';

/**
 * Route API simple qui répond 'pong' aux requêtes pour maintenir le serveur actif
 */
export async function GET() {
  return NextResponse.json({ status: 'pong', timestamp: new Date().toISOString() });
} 