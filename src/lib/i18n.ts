export const LOCALES = ['pt', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'pt';
export const isLocale = (value: string): value is Locale => (LOCALES as readonly string[]).includes(value);
export const HTML_LANG: Record<Locale, string> = {pt: 'pt-BR', en: 'en'};
export const OG_LOCALE: Record<Locale, string> = {pt: 'pt_BR', en: 'en_US'};

export type Localized = {'pt-BR': string; en: string};
export const pick = (text: Localized, locale: Locale): string => (locale === 'pt' ? text['pt-BR'] : text.en) || text.en || text['pt-BR'];

export const ROUTES = ['research', 'results', 'publications', 'projects', 'methods', 'data', 'code', 'updates', 'about', 'contact'] as const;
export type Route = (typeof ROUTES)[number];

export const fmtDate = (iso: string, locale: Locale): string =>
  new Intl.DateTimeFormat(locale === 'pt' ? 'pt-BR' : 'en-GB', {day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC'}).format(new Date(iso));
