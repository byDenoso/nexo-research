import Image from 'next/image';
import {D, tr} from '@/lib/dict';
import type {Locale} from '@/lib/i18n';
import styles from './EditorialFigures.module.css';

export function ResearchObservation({locale}: {locale: Locale}) {
  const pt = locale === 'pt';
  const title = pt ? 'Campo GOODS-Sul' : 'GOODS-South field';
  return (
    <figure className={styles.observation} aria-labelledby="research-observation-title">
      <div className={styles.photo}>
        <Image src="/images/jades-goods-south.jpg" alt={pt ? 'Campo GOODS-Sul, com galáxias de diferentes cores e formas' : 'GOODS-South field, with galaxies of different colours and shapes'} fill sizes="(min-width: 64rem) 56vw, 92vw" />
      </div>
      <figcaption className={styles.photoCaption}>
        <span className="kicker">{pt ? 'Observação externa · JWST / NIRCam' : 'External observation · JWST / NIRCam'}</span>
        <strong className={styles.title} id="research-observation-title">{title}</strong>
        <p>{pt ? 'Recorte do levantamento JADES que ilustra a observação de galáxias distantes.' : 'Crop from the JADES survey illustrating observations of distant galaxies.'}</p>
        <a className="text-link" href="https://esawebb.org/images/JADES2/">
          NASA, ESA, CSA, B. Robertson (UC Santa Cruz), B. Johnson (Center for Astrophysics, Harvard & Smithsonian), S. Tacchella (University of Cambridge), M. Rieke (Univ. of Arizona), D. Eisenstein (Center for Astrophysics, Harvard & Smithsonian), A. Pagan (STScI)
        </a>
      </figcaption>
    </figure>
  );
}

type Stage = {label: string; detail?: string};

function SequenceFigure({id, title, stages, source, sourceLabel, locale}: {
  id: string;
  title: string;
  stages: Stage[];
  source: string;
  sourceLabel: string;
  locale: Locale;
}) {
  return (
    <figure className={styles.sequence} aria-labelledby={id}>
      <p className={styles.title} id={id}>{title}</p>
      <ol className={styles.steps} role="list">
        {stages.map(({label, detail}, index) => (
          <li key={label}>
            <span className={styles.stepIndex} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <span className={styles.stepLabel}>{label}{detail && <span className={styles.detail}>{detail}</span>}</span>
          </li>
        ))}
      </ol>
      <figcaption>
        {locale === 'pt' ? 'Diagrama editorial do NEXO Research Institute · ' : 'NEXO Research Institute editorial diagram · '}
        <a className="text-link" href={source}>{sourceLabel}</a>
      </figcaption>
    </figure>
  );
}

export function MethodsSequence({locale}: {locale: Locale}) {
  const pt = locale === 'pt';
  const stages = D.how.steps.map(step => ({
    label: step.k === 'publication' ? (pt ? 'Publicação autorizada' : 'Authorised publication') : tr(step.n, locale)
  }));
  return <SequenceFigure id="methods-sequence-title" title={pt ? 'Percurso de um teste' : 'How a test proceeds'} stages={stages} source="#hypothesis" sourceLabel={pt ? 'Metodologia do NEXO' : 'NEXO methods'} locale={locale} />;
}

export function DataSequence({locale}: {locale: Locale}) {
  const pt = locale === 'pt';
  const stages = [
    {label: pt ? 'Manifesto público da Tower' : 'Tower public manifest', detail: 'ATLAS_PUBLIC_V1'},
    {label: pt ? 'Snapshot validado' : 'Validated snapshot', detail: 'atlas-public.json'},
    {label: pt ? 'Manifesto do portal' : 'Portal manifest', detail: 'NEXO_RESEARCH_MANIFEST_V1'},
    {label: pt ? 'Páginas estáticas' : 'Static pages', detail: pt ? 'Catálogo e proveniência' : 'Catalogue and provenance'}
  ];
  return <SequenceFigure id="data-sequence-title" title={pt ? 'Como o arquivo público chega ao portal' : 'How the public archive reaches the portal'} stages={stages} source="https://github.com/byDenoso/nexo-research#data-flow" sourceLabel={pt ? 'Fluxo de dados documentado' : 'Documented data flow'} locale={locale} />;
}
