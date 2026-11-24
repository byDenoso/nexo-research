import Link from 'next/link';
import type {Locale} from '@/lib/i18n';
import {href} from '@/lib/seo';

export function BrandWordmark({locale}: {locale: Locale}) {
  return (
    <Link href={href(locale)} prefetch={false} className="wordmark institutional-wordmark" lang="en">
      <span className="brand-lockup">
        <span className="brand-main">
          <span className="brand-nexo">NEXO</span>
          <span className="brand-descriptor">Research<span className="brand-institute"> Institute</span></span>
        </span>
        <span className="brand-signature" lang="en"><strong>N</strong>ature, <strong>Ex</strong>ploration &amp; <strong>O</strong>rigins</span>
      </span>
    </Link>
  );
}
