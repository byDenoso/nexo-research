import Link from 'next/link';
import {D, tr} from '@/lib/dict';
import {LOCALES, NAV_ROUTES, type Locale} from '@/lib/i18n';
import {href} from '@/lib/seo';
import {ThemeToggle} from './ThemeToggle';

const primaryRoutes = NAV_ROUTES.slice(0, 5);

export function Header({locale}: {locale: Locale}) {
  const other = LOCALES.find(code => code !== locale) ?? 'en';
  const otherLang = other === 'pt' ? 'pt-BR' : 'en';
  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <Link href={href(locale)} prefetch={false} className="wordmark" aria-label={tr(D.site, locale)}>
          NEXO<span aria-hidden="true">/</span>Research
        </Link>
        <nav aria-label={tr(D.navigation, locale)} className="primary-nav">
          <ul role="list">
            {primaryRoutes.map(route => (
              <li key={route}><Link href={href(locale, `/${route}`)} prefetch={false}>{tr(D.nav[route], locale)}</Link></li>
            ))}
          </ul>
        </nav>
        <div className="header-controls">
          <Link href={href(other)} prefetch={false} hrefLang={otherLang} lang={otherLang} className="btn header-control language-switch" aria-label={`${tr(D.language, locale)}: ${other.toUpperCase()}`}>{other.toUpperCase()}</Link>
          <ThemeToggle label={tr(D.theme, locale)} />
          <details className="site-menu">
            <summary className="btn header-control" aria-label={tr(D.menu, locale)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
              <span className="site-menu-label">{tr(D.menu, locale)}</span>
            </summary>
            <nav className="card site-menu-panel" aria-label={tr(D.moreNavigation, locale)}>
              <ul role="list">
                {NAV_ROUTES.map(route => (
                  <li key={route} className={primaryRoutes.includes(route) ? 'site-menu-primary' : undefined}>
                    <a href={href(locale, `/${route}`)}>{tr(D.nav[route], locale)}</a>
                  </li>
                ))}
              </ul>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
