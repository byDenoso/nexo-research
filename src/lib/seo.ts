import type {Metadata} from 'next';
import {HTML_LANG, LOCALES, OG_LOCALE, type Locale} from './i18n.ts';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nexoresearch.org';
export const href = (locale: Locale, path = ''): string => `/${locale}${path}`;
export const datasetMentionId = (name: string): string => `dataset-${name.toLowerCase().replaceAll(' ', '-').replaceAll('+', '-plus')}`;

export function pageMeta(locale: Locale, path: string, title: string, description: string): Metadata {
  const languages = Object.fromEntries(LOCALES.map(code => [HTML_LANG[code], `${SITE_URL}${href(code, path)}`]));
  return {
    title, description,
    alternates: {canonical: `${SITE_URL}${href(locale, path)}`, languages: {...languages, 'x-default': `${SITE_URL}${href('pt', path)}`}},
    openGraph: {title, description, url: `${SITE_URL}${href(locale, path)}`, siteName: 'NEXO Research', locale: OG_LOCALE[locale], type: 'website', images: [{url: SITE_URL + '/opengraph-image', width: 1200, height: 630, alt: 'NEXO Research'}]},
    twitter: {card: 'summary_large_image', title, description, images: [SITE_URL + '/opengraph-image']}
  };
}
