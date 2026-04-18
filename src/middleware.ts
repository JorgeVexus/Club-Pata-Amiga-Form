import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Only apply to API routes
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  const origin = request.headers.get('origin')
  const allowedOrigins = [
    'https://www.pataamiga.mx',
    'https://pataamiga.mx',
    'http://localhost:3000'
  ]

  // Allow Vercel preview/staging URLs
  if (origin && (origin.includes('vercel.app') || allowedOrigins.some(o => o === origin))) {
    const response = request.method === 'OPTIONS' 
      ? new NextResponse(null, { status: 204 })
      : NextResponse.next()

    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT,OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization')
    
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
