import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

const protectedRoutes = ['/entry_list', '/import_errors']
const publicRoutes = ['/login', '/register', '/reset-password']
const adminRoutes = ['/admin/users']

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  
  console.log('[Middleware] Request path:', path)

  const accessToken = request.cookies.get('accessToken')?.value
  console.log('[Middleware] accessToken found:', !!accessToken)

  if (publicRoutes.includes(path)) {
    console.log('[Middleware] Public route:', path)
    if (accessToken) {
      try {
        jwt.verify(accessToken, JWT_SECRET)
        console.log('[Middleware] Token valid, redirecting to entry_list')
        return NextResponse.redirect(new URL('/entry_list', request.url))
      } catch {
        console.log('[Middleware] Token invalid, clearing cookies')
        const response = NextResponse.next()
        response.cookies.delete('accessToken')
        response.cookies.delete('refreshToken')
        return response
      }
    }
    return NextResponse.next()
  }

  if (protectedRoutes.includes(path) || path === '/') {
    console.log('[Middleware] Protected route:', path)
    if (!accessToken) {
      console.log('[Middleware] No accessToken, redirecting to login')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
      jwt.verify(accessToken, JWT_SECRET)
      console.log('[Middleware] Token valid, allowing access')
      return NextResponse.next()
    } catch {
      console.log('[Middleware] Token invalid, redirecting to login')
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('accessToken')
      response.cookies.delete('refreshToken')
      return response
    }
  }

  if (adminRoutes.includes(path)) {
    console.log('[Middleware] Admin route:', path)
    if (!accessToken) {
      console.log('[Middleware] No accessToken, redirecting to login')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
      const decoded = jwt.verify(accessToken, JWT_SECRET) as { role?: string }
      if (decoded.role !== 'super_admin') {
        console.log('[Middleware] Not super admin, redirecting to entry_list')
        return NextResponse.redirect(new URL('/entry_list', request.url))
      }
      console.log('[Middleware] Super admin access granted')
      return NextResponse.next()
    } catch {
      console.log('[Middleware] Token invalid, redirecting to login')
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('accessToken')
      response.cookies.delete('refreshToken')
      return response
    }
  }

  return NextResponse.next()
}

export const runtime = 'nodejs'

export const config = {
  matcher: ['/login', '/register', '/entry_list', '/import_errors', '/admin/users', '/'],
}