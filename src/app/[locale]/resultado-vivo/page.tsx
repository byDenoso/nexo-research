import {notFound} from 'next/navigation';
import {LivingSections} from '@/components/LivingSections';
import {ExpansionStory} from '@/components/experiments/ExpansionStory';
import {LiveResult} from '@/components/LiveResult';
import {PageHead} from '@/components/ui';
import {isLocale, type Locale} from '@/lib/i18n';
import {pageMeta} from '@/lib/seo';

const copy: Record<Locale, {title:string; lead:string; section:string}> = {
  pt: {
    title:'Resultado vivo',
    lead:'Compare, no mesmo plano de parâmetros cosmológicos, as medidas do Planck, do DESI, das supernovas e da escada de distâncias. Os cenários mostram o efeito de diferentes hipóteses.',
    section:'Expansão do Universo',
  },
  en: {
    title:'Living result',
    lead:'Compare measurements from Planck, DESI, supernovae and the distance ladder on a common cosmological parameter plane. The scenarios illustrate the effects of different assumptions.',
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
    <LivingSections locale={locale} comparison={<div className="wrap page-body"><LiveResult locale={locale}/></div>} experiment={<ExpansionStory locale={locale}/>}/>
  </>;
}
