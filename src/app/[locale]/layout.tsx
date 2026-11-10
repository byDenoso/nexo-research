import type {Metadata, Viewport} from 'next';
import {IBM_Plex_Mono, IBM_Plex_Sans, Source_Serif_4} from 'next/font/google';
import {notFound} from 'next/navigation';
import type {ReactNode} from 'react';
import '../globals.css';
import {Footer} from '@/components/Footer';
import {Header} from '@/components/Header';
import {MotionObserver} from '@/components/Motion';
import {D, tr} from '@/lib/dict';
import {HTML_LANG, LOCALES, isLocale} from '@/lib/i18n';
import {SITE_URL, pageMeta} from '@/lib/seo';
import {getProfile} from '@/lib/data';

const sans = IBM_Plex_Sans({subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-plex-sans', display: 'swap'});
// Display face: a variable serif with optical sizes and Greek, so titles such as "Ωm" stay in one family.
const serif = Source_Serif_4({subsets: ['latin'], style: ['normal', 'italic'], axes: ['opsz'], variable: '--font-source-serif', display: 'swap'});
const mono = IBM_Plex_Mono({subsets: ['latin'], weight: ['400', '500'], variable: '--font-plex-mono', display: 'swap'});

export const dynamicParams = false;
export const generateStaticParams = () => LOCALES.map(locale => ({locale}));
export const viewport: Viewport = {themeColor: [{media: '(prefers-color-scheme: dark)', color: '#02050b'}, {media: '(prefers-color-scheme: light)', color: '#f7f6f2'}]};

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale} = await params;
  if (!isLocale(locale)) return {};
  return {metadataBase: new URL(SITE_URL), ...pageMeta(locale, '', 'NEXO Research', tr(D.tagline, locale)), title: {default: 'NEXO Research', template: '%s · NEXO Research'}};
}

const themeScript = `document.documentElement.dataset.js='';try{var s=localStorage.getItem('nexo-theme');var t=s||(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='dark'}`;

export default async function LocaleLayout({children, params}: {children: ReactNode; params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  const profile = getProfile();
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {'@type': 'WebSite', '@id': `${SITE_URL}/#site`, name: 'NEXO Research', url: SITE_URL, inLanguage: LOCALES.map(code => HTML_LANG[code]), description: tr(D.tagline, locale)},
      {'@type': 'Person', '@id': `${SITE_URL}/#director`, name: profile.name, affiliation: {'@type': 'CollegeOrUniversity', name: profile.affiliation}, ...(profile.orcid ? {sameAs: [`https://orcid.org/${profile.orcid}`]} : {})}
    ]
  };
  return (
    <html lang={HTML_LANG[locale]} className={`${sans.variable} ${mono.variable} ${serif.variable}`} suppressHydrationWarning data-theme="dark">
      <head>
        <script dangerouslySetInnerHTML={{__html: themeScript}} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}} />
      </head>
      <body className="min-h-dvh flex flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-ink">{tr(D.skip, locale)}</a>
        <Header locale={locale} />
        <main id="main" className="flex-1" tabIndex={-1}>{children}</main>
        <Footer locale={locale} />
        <MotionObserver />
      </body>
    </html>
  );
}
