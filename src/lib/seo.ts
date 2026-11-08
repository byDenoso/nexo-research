import type {Metadata} from 'next';
import {HTML_LANG, LOCALES, OG_LOCALE, type Locale} from './i18n.ts';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nexoresearch.org';
export const href = (locale: Locale, path = ''): string => `/${locale}${path}`;

export function pageMeta(locale: Locale, path: string, title: string, description: string): Metadata {
  const languages = Object.fromEntries(LOCALES.map(code => [HTML_LANG[code], `${SITE_URL}${href(code, path)}`]));
  return {
    title, description,
    alternates: {canonical: `${SITE_URL}${href(locale, path)}`, languages: {...languages, 'x-default': `${SITE_URL}${href('pt', path)}`}},
    openGraph: {title, description, url: `${SITE_URL}${href(locale, path)}`, siteName: 'NEXO Research', locale: OG_LOCALE[locale], type: 'website'},
    twitter: {card: 'summary', title, description}
  };
}
