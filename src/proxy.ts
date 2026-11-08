import {NextResponse, type NextRequest} from 'next/server';

const LOCALES = ['pt', 'en'];

// Unprefixed URLs go to the visitor's language; every canonical URL keeps its /pt or /en prefix.
export function proxy(request: NextRequest) {
  const {pathname, search} = request.nextUrl;
  if (LOCALES.some(code => pathname === `/${code}` || pathname.startsWith(`/${code}/`))) return NextResponse.next();
  const preferred = (request.headers.get('accept-language') ?? '').toLowerCase();
  const locale = /^(en|[a-z-]*,\s*en)/.test(preferred) && !preferred.startsWith('pt') ? 'en' : 'pt';
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  url.search = search;
  return NextResponse.redirect(url, 307);
}

export const config = {matcher: ['/((?!_next|api|.*\\..*).*)']};
