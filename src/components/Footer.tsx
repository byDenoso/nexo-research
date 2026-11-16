import Link from 'next/link';
import {D, tr} from '@/lib/dict';
import type {Locale} from '@/lib/i18n';
import {href} from '@/lib/seo';

export function Footer({locale}: {locale: Locale}) {
  const pt = locale === 'pt';
  return (
    <footer className="site-footer dark-chapter">
      <div className="wrap footer-inner">
        <div>
          <Link href={href(locale)} prefetch={false} className="wordmark" aria-label={tr(D.site, locale)}>
            NEXO<span className="wordmark-rest">Research Institute</span>
          </Link>
          <p className="footer-summary">{tr(D.footer.line, locale)}</p>
        </div>
        <nav aria-label={tr(D.footer.navigation, locale)}>
          <h2>{pt ? 'Pesquisa' : 'Research'}</h2>
          <ul className="footer-links" role="list">
            {(['research', 'results', 'methods', 'projects'] as const).map(route => (
              <li key={route}><Link href={href(locale, '/' + route)} prefetch={false}>{tr(D.nav[route], locale)}</Link></li>
            ))}
            <li><Link href={href(locale, '/resultado-vivo')}>{pt ? 'Resultado vivo' : 'Living result'}</Link></li>
          </ul>
        </nav>
        <nav aria-label={pt ? 'Instituto e recursos' : 'Institute and resources'}>
          <h2>{pt ? 'Instituto' : 'Institute'}</h2>
          <ul className="footer-links" role="list">
            {(['about', 'data', 'code', 'updates', 'contact'] as const).map(route => (
              <li key={route}><Link href={href(locale, '/' + route)} prefetch={false}>{tr(D.nav[route], locale)}</Link></li>
            ))}
            <li><a href="https://cosmos-do-zero.vercel.app/">Cosmos do Zero <span aria-hidden="true">→</span></a></li>
          </ul>
        </nav>
      </div>
      <div className="wrap footer-meta">
        <span>© {new Date().getUTCFullYear()} Dener Pereira</span>
        <Link href={href(locale, '/data')} prefetch={false} className="text-link">{tr(D.footer.data, locale)}</Link>
      </div>
    </footer>
  );
}
