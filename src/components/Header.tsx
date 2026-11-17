import Link from 'next/link';
import {D, tr} from '@/lib/dict';
import {NAV_ROUTES, type Locale} from '@/lib/i18n';
import {href} from '@/lib/seo';
import {ThemeToggle} from './ThemeToggle';
import {LanguageSwitch} from './LanguageSwitch';

const primary = ['research', 'publications', 'results', 'data', 'about'] as const;
function label(route: typeof NAV_ROUTES[number], locale: Locale) {
  if (route === 'data') return locale === 'pt' ? 'Dados e métodos' : 'Data & Methods';
  if (route === 'results') return locale === 'pt' ? 'Descobertas' : 'Discoveries';
  if (route === 'about') return locale === 'pt' ? 'Instituto' : 'Institute';
  return tr(D.nav[route], locale);
}

export function Header({locale}: {locale: Locale}) {
  const living = locale === 'pt' ? 'Resultado vivo' : 'Living result';
  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <Link href={href(locale)} prefetch={false} className="wordmark" aria-label={tr(D.site, locale)}>
          NEXO<span className="wordmark-rest">Research Institute</span>
        </Link>
        <nav aria-label={tr(D.navigation, locale)} className="primary-nav">
          <ul role="list">
            {primary.map(route => <li key={route}><Link href={href(locale, '/' + route)} prefetch={false}>{label(route, locale)}</Link></li>)}
          </ul>
        </nav>
        <div className="header-controls">
          <Link className="header-living" href={href(locale, '/resultado-vivo')} prefetch={false}>{living} <span aria-hidden="true">→</span></Link>
          <LanguageSwitch locale={locale} />
          <ThemeToggle label={tr(D.theme, locale)} />
          <details className="site-menu">
            <summary className="btn header-control" aria-label={tr(D.menu, locale)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
              <span className="site-menu-label">{tr(D.menu, locale)}</span>
            </summary>
            <nav className="card site-menu-panel" aria-label={tr(D.moreNavigation, locale)}>
              <ul role="list">
                <li className="menu-living"><a href={href(locale, '/resultado-vivo')}>{living}</a></li>
                {NAV_ROUTES.map(route => (
                  <li key={route} className={primary.some(item => item === route) ? 'site-menu-primary' : undefined}>
                    <a href={href(locale, '/' + route)}>{label(route, locale)}</a>
                  </li>
                ))}
                <li><a href="https://cosmos-do-zero.vercel.app/">Cosmos do Zero <span aria-hidden="true">→</span></a></li>
              </ul>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
