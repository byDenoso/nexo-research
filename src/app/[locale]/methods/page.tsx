import {notFound} from 'next/navigation';
import type {ComponentProps} from 'react';
import {MethodsSequence} from '@/components/EditorialFigures';
import {Tex} from '@/components/Math';
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
  const contents = tr(D.methods.contents, locale);
  const equationLabel = tr(D.methods.equation, locale);
  const Equation = (props: ComponentProps<typeof Tex>) => <Tex {...props} label={equationLabel} />;
  return (
    <>
      <PageHead kicker={tr(D.nav.methods, locale)} title={tr(D.methods.title, locale)} lead={tr(D.methods.lead, locale)} />
      <div className="wrap page-body"><MethodsSequence locale={locale} /></div>
      <div className="wrap page-body methods-layout">
        <nav className="card methods-index" aria-labelledby="methods-index-title">
          <p className="kicker" id="methods-index-title">{contents}</p>
          <ol role="list">
            {D.how.steps.map(step => <li key={step.k}><a href={`#${step.k}`}>{tr(step.n, locale)}</a></li>)}
            <li><a href="#repro">{tr(D.lines.items.reproducibility.n, locale)}</a></li>
          </ol>
        </nav>
        <article className="prose-nx methods-article"><Content components={{Tex: Equation}} /></article>
      </div>
    </>
  );
}
