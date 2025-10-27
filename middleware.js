import { NextResponse } from 'next/server';

// Root-level middleware required for Next.js 15+ (App Router + Turbopack)
// KISS: minimal request logging only for /api/*
export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api')) {
    // Minimal log shape – easy to grep & pipe
    console.log(JSON.stringify({
      t: Date.now(), // epoch ms for compact logs
      method: request.method,
      path: pathname,
      ip: request.ip || request.headers.get('x-forwarded-for') || null,
      ua: request.headers.get('user-agent')?.slice(0, 80) || null,
    }));
  }

  return NextResponse.next();
}

// Limit to API routes only (adjust if you later want edge logging for pages)
export const config = {
  matcher: ['/api/:path*'],
};
