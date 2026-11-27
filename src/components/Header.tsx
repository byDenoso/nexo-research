import Link from 'next/link';
import {D, tr} from '@/lib/dict';
import {NAV_ROUTES, type Locale} from '@/lib/i18n';
import {href} from '@/lib/seo';
import {SiteMenu} from './SiteMenu';
import {BrandWordmark} from './BrandWordmark';
import {ThemeToggle} from './ThemeToggle';
import {LanguageSwitch} from './LanguageSwitch';

const primary = ['research', 'results', 'data', 'about'] as const;
function label(route: typeof NAV_ROUTES[number], locale: Locale) {
  if (route === 'data') return locale === 'pt' ? 'Dados e métodos' : 'Data & Methods';
  if (route === 'results') return locale === 'pt' ? 'Explorar resultados' : 'Explore results';
  if (route === 'about') return locale === 'pt' ? 'Instituto' : 'Institute';
  return tr(D.nav[route], locale);
}

export function Header({locale}: {locale: Locale}) {
  const living = locale === 'pt' ? 'Resultado vivo' : 'Living result';
  const pt = locale === 'pt';
  const sections = [
    {href: href(locale), label: pt ? 'Início' : 'Home'},
    {href: href(locale, '/resultado-vivo'), label: living},
    ...NAV_ROUTES.map(route => ({href: href(locale, '/' + route), label: label(route, locale)})),
  ];
  const shortcuts = [
    {href: href(locale, '/observatorio'), label: pt ? 'Observatórios' : 'Observatories'},
    {href: href(locale, '/resultado-vivo#expansao-em-etapas'), label: pt ? 'Experimento de expansão' : 'Expansion experiment'},
    {href: href(locale, '/data#atlas'), label: pt ? 'Atlas de supernovas' : 'Supernova atlas'},
    {href: 'https://cosmos-do-zero.vercel.app/', label: 'Cosmos do Zero'},
  ];
  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <BrandWordmark locale={locale} />
        <nav aria-label={tr(D.navigation, locale)} className="primary-nav">
          <ul role="list">
            {primary.map(route => <li key={route}><Link href={href(locale, '/' + route)} prefetch={false}>{label(route, locale)}</Link></li>)}
          </ul>
        </nav>
        <div className="header-controls">
          <Link className="header-living" href={href(locale, '/resultado-vivo')} prefetch={false}>{living} <span aria-hidden="true">→</span></Link>
          <LanguageSwitch locale={locale} />
          <ThemeToggle label={tr(D.theme, locale)} />
          <SiteMenu locale={locale} sections={sections} tools={shortcuts} />
        </div>
      </div>
    </header>
  );
}
