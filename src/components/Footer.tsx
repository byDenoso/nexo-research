import Link from 'next/link';
import {D, tr} from '@/lib/dict';
import {ROUTES, type Locale} from '@/lib/i18n';
import {href} from '@/lib/seo';

export function Footer({locale}: {locale: Locale}) {
  return (
    <footer className="site-footer">
      <div className="wrap footer-inner">
        <div>
          <Link href={href(locale)} prefetch={false} className="wordmark" aria-label={tr(D.site, locale)}>NEXO<span aria-hidden="true">/</span>Research</Link>
          <p className="footer-summary">{tr(D.footer.line, locale)}</p>
        </div>
        <nav aria-label={tr(D.footer.navigation, locale)}>
          <ul className="footer-links" role="list">
            {ROUTES.map(route => (
              <li key={route}><Link href={href(locale, `/${route}`)} prefetch={false}>{tr(D.nav[route], locale)}</Link></li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="wrap footer-meta">
        <span>© {new Date().getUTCFullYear()} Dener Pereira</span>
        <Link href={href(locale, '/data')} prefetch={false} className="text-link">{tr(D.footer.data, locale)}</Link>
        <a href={href(locale, '/privado')} rel="nofollow" className="text-link">{tr(D.footer.private, locale)}</a>
      </div>
    </footer>
  );
}
