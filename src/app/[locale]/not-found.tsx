'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';

export default function NotFound() {
  const locale = usePathname()?.startsWith('/en') ? 'en' : 'pt';
  return (
    <section className="wrap not-found-copy py-24">
      <p className="kicker">404</p>
      <h1 className="mt-3 text-4xl font-semibold">{locale === 'pt' ? 'Página não encontrada' : 'Page not found'}</h1>
      <p className="mt-3 text-muted">{locale === 'pt' ? 'O endereço solicitado não existe neste portal.' : 'The requested address does not exist on this site.'}</p>
      <div className="home-actions">
        <Link className="btn btn-primary" href={'/' + locale}>{locale === 'pt' ? 'Início' : 'Home'}</Link>
        <Link className="btn" href={'/' + locale + '/results'}>{locale === 'pt' ? 'Resultados científicos' : 'Scientific results'}</Link>
      </div>
    </section>
  );
}
