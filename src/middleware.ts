import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Korumalı rotalar
const protectedRoutes = ['/studio', '/dashboard', '/checkout']

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Session kontrolü
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Korumalı rotalara erişim kontrolü
  if (protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route))) {
    if (!session) {
      // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
      const redirectUrl = new URL('/auth/sign-in', req.url)
      redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return res
}

// Middleware'in çalışacağı rotaları belirt
export const config = {
  matcher: [
    '/studio/:path*',
    '/dashboard/:path*',
    '/checkout/:path*',
  ]
} 