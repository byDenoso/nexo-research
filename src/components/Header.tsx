import Link from 'next/link';
import {D, tr} from '@/lib/dict';
import {LOCALES, ROUTES, type Locale} from '@/lib/i18n';
import {href} from '@/lib/seo';
import {ThemeToggle} from './ThemeToggle';

export function Header({locale}: {locale: Locale}) {
  const other = LOCALES.find(code => code !== locale) ?? 'en';
  const otherLang = other === 'pt' ? 'pt-BR' : 'en';
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
      <div className="wrap flex items-center justify-between gap-4 py-3">
        <Link href={href(locale)} className="font-mono text-base font-medium tracking-wide" aria-label="NEXO Research">
          NEXO<span className="text-accent"> / Research</span>
        </Link>
        <nav aria-label="Principal" className="hidden xl:block">
          <ul className="flex gap-5 text-[.95rem]">
            {ROUTES.map(route => (
              <li key={route}><Link href={href(locale, `/${route}`)} className="text-muted hover:text-ink">{tr(D.nav[route], locale)}</Link></li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <Link href={href(other)} hrefLang={otherLang} lang={otherLang} className="btn !px-3 !py-2 font-mono text-sm" aria-label={`${tr(D.language, locale)}: ${other.toUpperCase()}`}>{other.toUpperCase()}</Link>
          <ThemeToggle label={tr(D.theme, locale)} />
          <details className="relative xl:hidden">
            <summary className="btn !px-3 !py-2" aria-label={tr(D.menu, locale)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
            </summary>
            <ul className="card absolute right-0 mt-2 w-56 p-2 shadow-xl">
              {ROUTES.map(route => (
                <li key={route}><Link href={href(locale, `/${route}`)} className="block rounded-md px-3 py-2 hover:bg-raised">{tr(D.nav[route], locale)}</Link></li>
              ))}
            </ul>
          </details>
        </div>
      </div>
    </header>
  );
}
