import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Example: Logging
  console.log('Request path:', request.nextUrl.pathname);
  
  // Example: Redirect old URLs
  if (request.nextUrl.pathname.startsWith('/old-path')) {
    return NextResponse.redirect(new URL('/new-path', request.url));
  }

  return NextResponse.next();
} 