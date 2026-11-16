import {notFound} from 'next/navigation';
import {LiveResult} from '@/components/LiveResult';
import {PageHead} from '@/components/ui';
import {isLocale, type Locale} from '@/lib/i18n';
import {pageMeta} from '@/lib/seo';

const copy: Record<Locale, {title:string; lead:string; section:string}> = {
  pt: {
    title:'Resultado vivo',
    lead:'O que muda quando você troca uma hipótese sobre a expansão do Universo? Compare o Planck, as distâncias do DESI, as supernovas e a escada de distâncias no mesmo plano.',
    section:'Expansão do Universo',
  },
  en: {
    title:'Living result',
    lead:'What changes when you switch an assumption about cosmic expansion? Compare Planck, DESI distances, supernovae and the distance ladder on the same plane.',
    section:'Cosmic expansion',
  },
};

export async function generateMetadata({params}: {params: Promise<{locale:string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) return {};
  return pageMeta(locale,'/resultado-vivo',copy[locale].title,copy[locale].lead);
}

export default async function LivingResultPage({params}: {params: Promise<{locale:string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  const {title,lead,section} = copy[locale];
  return <>
    <PageHead kicker={section} title={title} lead={lead} />
    <div className="wrap page-body"><LiveResult locale={locale}/></div>
  </>;
}
