import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            // Strip expiry → session-only cookie, cleared when browser closes
            const { maxAge: _m, expires: _e, ...opts } = options ?? {}
            supabaseResponse.cookies.set(name, value, opts)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Routes only for guests (redirect logged-in users to dashboard)
  const isGuestOnlyPage =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password')

  // Routes that require authentication
  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/select-topics') ||
    pathname.startsWith('/complete-profile')

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Google sign-up users skip the registration form → send them to complete their profile
  // Admin routes are excluded: admins may not have a seminary set
  const needsProfile =
    user &&
    !user.user_metadata?.seminary &&
    isProtected &&
    !pathname.startsWith('/complete-profile') &&
    !pathname.startsWith('/admin')

  if (needsProfile) {
    const url = request.nextUrl.clone()
    url.pathname = '/complete-profile'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (user && isGuestOnlyPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  if (user && pathname.startsWith('/admin')) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // Redirect only if we got a clear non-admin answer (not a network error)
    if (!profileError && profile?.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
    // If profileError exists (DB unreachable etc.), let the layout handle it
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
