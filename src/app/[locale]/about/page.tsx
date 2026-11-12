import {notFound} from 'next/navigation';
import {PageHead} from '@/components/ui';
import {D,tr} from '@/lib/dict';
import {isLocale} from '@/lib/i18n';
import {pageMeta} from '@/lib/seo';

export async function generateMetadata({params}:{params:Promise<{locale:string}>}) {
  const {locale}=await params;
  return isLocale(locale)?pageMeta(locale,'/about',tr(D.about.title,locale),tr(D.about.lead,locale)):{};
}
export default async function AboutPage({params}:{params:Promise<{locale:string}>}){
  const {locale}=await params;
  if(!isLocale(locale))notFound();
  const Content=locale==='pt'?(await import('@/content/about.pt.mdx')).default:(await import('@/content/about.en.mdx')).default;
  return <>
    <PageHead kicker={tr(D.nav.about,locale)} title="NEXO Research Institute" lead={tr(D.about.lead,locale)}/>
    <article className="wrap prose-nx mt-10"><Content/></article>
  </>;
}
