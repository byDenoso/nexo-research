import Link from 'next/link';
import {D,tr} from '@/lib/dict';
import {NAV_ROUTES,type Locale} from '@/lib/i18n';
import {href} from '@/lib/seo';
import {ThemeToggle} from './ThemeToggle';
import {LanguageSwitch} from './LanguageSwitch';

const primary=['research','results','data','about','updates'] as const;
const label=(route:string,locale:Locale)=>route==='data'?(locale==='pt'?'Dados e código':'Data & Software'):tr(D.nav[route as keyof typeof D.nav],locale);
export function Header({locale}:{locale:Locale}) {
  return <header className="site-header"><div className="wrap header-inner">
    <Link href={href(locale)} prefetch={false} className="wordmark" aria-label={tr(D.site,locale)}>NEXO<span aria-hidden="true">/</span>Research</Link>
    <nav aria-label={tr(D.navigation,locale)} className="primary-nav"><ul role="list">
      {primary.map(route=><li key={route}><Link href={href(locale,'/'+route)} prefetch={false}>{label(route,locale)}</Link></li>)}
    </ul></nav>
    <div className="header-controls">
      <LanguageSwitch locale={locale}/>
      <ThemeToggle label={tr(D.theme,locale)}/>
      <details className="site-menu">
        <summary className="btn header-control" aria-label={tr(D.menu,locale)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
          <span className="site-menu-label">{tr(D.menu,locale)}</span>
        </summary>
        <nav className="card site-menu-panel" aria-label={tr(D.moreNavigation,locale)}>
          <ul role="list">{NAV_ROUTES.map(route=><li key={route} className={(primary as readonly string[]).includes(route)?'site-menu-primary':undefined}><a href={href(locale,'/'+route)}>{label(route,locale)}</a></li>)}</ul>
        </nav>
      </details>
    </div>
  </div></header>;
}
