import Link from 'next/link';
import {D, tr} from '@/lib/dict';
import {ROUTES, type Locale} from '@/lib/i18n';
import {href} from '@/lib/seo';

export function Footer({locale}: {locale: Locale}) {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="wrap grid gap-8 py-10 md:grid-cols-[1.3fr_2fr]">
        <div>
          <p className="font-mono">NEXO<span className="text-accent"> / Research</span></p>
          <p className="mt-2 max-w-sm text-sm text-muted">{tr(D.footer.line, locale)}</p>
        </div>
        <nav aria-label="Rodapé">
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            {ROUTES.map(route => (
              <li key={route}><Link href={href(locale, `/${route}`)} className="text-muted hover:text-ink">{tr(D.nav[route], locale)}</Link></li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="wrap border-t border-line py-4 text-xs text-muted">© {new Date().getUTCFullYear()} Dener Pereira · {tr(D.footer.data, locale)} · <a href={href(locale, '/privado')} rel="nofollow" className="hover:text-ink">{tr(D.footer.private, locale)}</a></div>
    </footer>
  );
}
