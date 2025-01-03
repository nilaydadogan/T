import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirectTo = requestUrl.searchParams.get('redirectTo') || '/dashboard' // Default olarak dashboard'a yönlendir

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Auth işlemi tamamlandıktan sonra dashboard'a yönlendir
  return NextResponse.redirect(new URL('/dashboard', request.url))
}

export const dynamic = 'force-dynamic' 