import {notFound} from 'next/navigation';
import {PageHead} from '@/components/ui';
import {D, tr} from '@/lib/dict';
import {isLocale} from '@/lib/i18n';
import {pageMeta} from '@/lib/seo';

export async function generateMetadata({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) return {};
  return pageMeta(locale, '/methods', tr(D.methods.title, locale), tr(D.methods.lead, locale));
}

export default async function MethodsPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  const Content = locale === 'pt' ? (await import('@/content/methods.pt.mdx')).default : (await import('@/content/methods.en.mdx')).default;
  return (
    <>
      <PageHead kicker={tr(D.nav.methods, locale)} title={tr(D.methods.title, locale)} lead={tr(D.methods.lead, locale)} />
      <article className="wrap prose-nx mt-10"><Content /></article>
    </>
  );
}
