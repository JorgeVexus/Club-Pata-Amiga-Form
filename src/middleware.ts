import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Only apply to API routes
  if (!pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  const origin = request.headers.get('origin') || ''
  const allowedOrigins = [
    'https://www.pataamiga.mx',
    'https://pataamiga.mx',
    'https://app.pataamiga.mx',
    'http://localhost:3000'
  ]

  // Allow Vercel staging/preview URLs dynamically
  const isAllowedOrigin = allowedOrigins.includes(origin) || 
                         (origin.endsWith('.vercel.app') && origin.includes('club-pata-amiga'));

  // Define headers
  const headers = new Headers()
  if (isAllowedOrigin) {
    headers.set('Access-Control-Allow-Origin', origin)
    headers.set('Access-Control-Allow-Credentials', 'true')
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, sentry-trace, baggage')
  }

  // Early response for OPTIONS (Preflight)
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers })
  }

  // For other methods, proceed and append headers
  const response = NextResponse.next()
  if (isAllowedOrigin) {
    headers.forEach((value, key) => {
      response.headers.set(key, value)
    })
  }

  return response
}

export const config = {
  matcher: '/api/:path*',
}
