import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { SUPABASE_URL, SUPABASE_PUBLIC_KEY, SUPABASE_READY } from '@/lib/supabase/keys';

// Holder Supabase-økta fersk. Sender uinnloggede bort fra Min side.
export async function middleware(req: NextRequest) {
  if (!SUPABASE_READY) return NextResponse.next();
  let res = NextResponse.next({ request: req });
  const sb = createServerClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await sb.auth.getUser();
  if (!user && req.nextUrl.pathname.startsWith('/min-side')) {
    const url = req.nextUrl.clone();
    url.pathname = '/logg-inn';
    url.search = `?neste=${encodeURIComponent('/min-side')}`;
    return NextResponse.redirect(url);
  }
  return res;
}

export const config = { matcher: ['/((?!api/|_next/|auth/|.*\\..*).*)'] };
