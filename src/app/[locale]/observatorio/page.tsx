import {notFound} from 'next/navigation';
import {CmbSphere} from '@/components/CmbSphere';
import {HubbleLive, type Frame} from '@/components/HubbleLive';
import {PageHead} from '@/components/ui';
import {isLocale} from '@/lib/i18n';
import {pageMeta} from '@/lib/seo';
import hubble from '../../../../data/curated/hubble-live.json';

// Only the published and the measured fits travel with the page; the rest loads on first use.
const hubbleDeltas = hubble.frames.map(frame => frame.delta);
const hubbleMeasured = hubbleDeltas.reduce((best, d, k) => Math.abs(d - hubble.measured.delta) < Math.abs(hubbleDeltas[best]! - hubble.measured.delta) ? k : best, 0);
const hubbleZero = hubbleDeltas.findIndex(d => Math.abs(d) < 1e-9);
const hubbleMeta = {n_sn: hubble.n_sn, n_des: hubble.n_des, zcurve: hubble.zcurve, measured: hubble.measured, deltas: hubbleDeltas};
const hubbleSeed: Record<number, Frame> = {[hubbleZero]: hubble.frames[hubbleZero] as Frame, [hubbleMeasured]: hubble.frames[hubbleMeasured] as Frame};

const head = {
  title: {pt: 'Observatórios', en: 'Observatories'},
  lead: {
    pt: 'Dados públicos que você pode girar e ajustar: o céu de micro-ondas do Planck e o diagrama de Hubble com o ponto zero das supernovas do DES sob seu controle.',
    en: 'Public data you can rotate and adjust: the Planck microwave sky and the Hubble diagram with the zero point of the DES supernovae under your control.',
  },
};

export async function generateMetadata({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  return isLocale(locale) ? pageMeta(locale, '/observatorio', head.title[locale], head.lead[locale]) : {};
}

export default async function ObservatoryPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  const pt = locale === 'pt';
  return <>
    <PageHead kicker={pt ? 'Instituto' : 'Institute'} title={head.title[locale]} lead={head.lead[locale]} />
    <div className="nexo-editorial nx-home observatory-room">
      <section id="cmb" className="wrap cmb-section" aria-labelledby="cmb-title">
        <div className="cmb-copy">
          <p className="nx-eyebrow">{pt ? 'Radiação cósmica de fundo' : 'Cosmic microwave background'}</p>
          <h2 id="cmb-title">{pt ? 'O céu de 380 mil anos depois do Big Bang' : 'The sky 380,000 years after the Big Bang'}</h2>
          <p>{pt
            ? 'Cada mancha é uma região do plasma primordial um pouco mais quente ou mais fria que a média, por algumas partes em cem mil. O tamanho típico dessas manchas, cerca de um grau, é a mesma régua acústica que o DESI mede nas galáxias bilhões de anos depois.'
            : 'Each patch is a region of the primordial plasma slightly warmer or colder than average, by a few parts in a hundred thousand. Their typical size, about one degree, is the same acoustic ruler that DESI measures in galaxies billions of years later.'}</p>
          <p className="cmb-hint">{pt ? 'Arraste para girar; setas e +/− pelo teclado.' : 'Drag to rotate; arrows and +/− on the keyboard.'}</p>
        </div>
        <CmbSphere locale={locale} />
      </section>

      <section id="hubble" className="wrap hl-section" aria-labelledby="hl-title">
        <div className="hl-head">
          <p className="nx-eyebrow">{pt ? 'Diagrama de Hubble' : 'Hubble diagram'}</p>
          <h2 id="hl-title">{pt ? 'Mova o ponto zero do DES e veja a energia escura responder' : 'Move the DES zero point and watch dark energy respond'}</h2>
          <p>{pt
            ? 'Cada posição do controle é um ajuste completo de ΛCDM e de w0wa às supernovas do Pantheon+, ao BAO do DESI e à radiação cósmica de fundo, com as supernovas do DES deslocadas pelo valor escolhido. Os pontos são médias por faixa de redshift, em relação ao ΛCDM do mesmo ajuste.'
            : 'Every position of the control is a full fit of ΛCDM and w0wa to the Pantheon+ supernovae, DESI BAO and the cosmic microwave background, with the DES supernovae shifted by the chosen value. Points are averages per redshift range, relative to the ΛCDM of the same fit.'}</p>
        </div>
        <HubbleLive locale={locale} meta={hubbleMeta} seed={hubbleSeed} />
      </section>
    </div>
  </>;
}
