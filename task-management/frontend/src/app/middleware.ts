import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth-token')?.value;
  const path = request.nextUrl.pathname;

  // Public paths
  const publicPaths = ['/login', '/register'];
  
  if (!authToken && !publicPaths.includes(path)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (authToken && publicPaths.includes(path)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
} 