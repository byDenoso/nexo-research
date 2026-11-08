import {notFound} from 'next/navigation';
import {PageHead} from '@/components/ui';
import {getProfile} from '@/lib/data';
import {D, tr} from '@/lib/dict';
import {isLocale} from '@/lib/i18n';
import {pageMeta} from '@/lib/seo';

export async function generateMetadata({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) return {};
  return pageMeta(locale, '/about', tr(D.about.title, locale), tr(D.about.lead, locale));
}

export default async function AboutPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  const profile = getProfile();
  const Content = locale === 'pt' ? (await import('@/content/about.pt.mdx')).default : (await import('@/content/about.en.mdx')).default;
  return (
    <>
      <PageHead kicker={tr(D.nav.about, locale)} title={profile.name} lead={`${tr(D.who.role, locale)} · ${tr(D.who.affiliation, locale)}`} />
      <article className="wrap prose-nx mt-10"><Content /></article>
    </>
  );
}
