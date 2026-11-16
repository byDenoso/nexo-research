import Image from 'next/image';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {PairChart} from '@/components/PairChart';
import {SensitivityChart} from '@/components/SensitivityChart';
import {StatusBadge} from '@/components/ui';
import {getManifest, getResults} from '@/lib/data';
import {D, tr} from '@/lib/dict';
import {getFamilies} from '@/lib/families';
import {readResult, selectedIds, isNegative} from '@/lib/editorial';
import {fmtDate, isLocale} from '@/lib/i18n';
import {goodsSouth} from '@/lib/observations';
import {compilations, sensitivityPoints, sensitivityRows} from '@/lib/sensitivity';
import {href} from '@/lib/seo';

const researchLinks = [
  {id: 'expansion', label: ['Expansão e energia escura', 'Expansion and dark energy']},
  {id: 'probes', label: ['Medidas do Universo', 'Probes of the Universe']},
  {id: 'galaxies', label: ['Primeiras galáxias', 'First galaxies']},
] as const;

export default async function Home({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  const pt = locale === 'pt';
  const results = getResults();
  const families = getFamilies(results);
  const latest = getManifest().generatedFrom.latestUpdate;
  const [featuredId, ...storyIds] = selectedIds;
  const lead = results.find(item => item.id === featuredId);
  const stories = storyIds.flatMap(id => {
    const item = results.find(result => result.id === id);
    return item ? [item] : [];
  });
  const reading = lead ? readResult(lead, locale) : undefined;
  const sensitivity = sensitivityPoints(results);

  return (
    <>
      <section className="research-hero dark-chapter" aria-labelledby="cover-title">
        <div className="wrap research-hero-copy">
          <p className="kicker">{pt ? 'Instituto independente de cosmologia' : 'Independent institute of cosmology'}</p>
          <h1 id="cover-title">{pt ? <>Como medimos a expansão <em>do Universo?</em></> : <>How do we measure the expansion <em>of the Universe?</em></>}</h1>
          <p>{pt ? 'A luz de supernovas e galáxias registra a expansão. O NEXO confronta essas observações com modelos cosmológicos e mostra até onde os dados sustentam cada conclusão.' : 'Light from supernovae and galaxies records cosmic expansion. NEXO tests cosmological models against these observations and shows how far the data support each conclusion.'}</p>
          <div className="research-hero-actions">
            <Link className="journal-button" href={href(locale, '/research')}>{pt ? 'Explorar a pesquisa' : 'Explore the research'} <span aria-hidden="true">→</span></Link>
            <Link className="journal-button journal-button-quiet" href={href(locale, '/resultado-vivo')}>{pt ? 'Ver resultado em 3D' : 'See the 3D result'} <span aria-hidden="true">→</span></Link>
          </div>
        </div>
        <figure className="research-hero-image">
          <div className="research-hero-art">
            <Image
              src={goodsSouth.image}
              alt={pt ? 'Galáxias de cores e formas diversas no campo GOODS-Sul observado pelo Webb' : 'Galaxies of different colours and shapes in the GOODS-South field observed by Webb'}
              fill
              sizes="(min-width: 56rem) 80vw, 100vw"
              loading="eager"
              fetchPriority="high"
            />
          </div>
          <figcaption className="wrap research-hero-credit">
            <span>{pt ? 'Campo GOODS-Sul · Webb / JADES' : 'GOODS-South field · Webb / JADES'}</span>
            <a href={goodsSouth.source}>{goodsSouth.credit} <span aria-hidden="true">→</span></a>
          </figcaption>
        </figure>
      </section>
      <nav className="research-shortcuts" aria-label={pt ? 'Linhas de pesquisa em destaque' : 'Featured research areas'}>
        <ul className="wrap" role="list">
          {researchLinks.map(({id, label}) => (
            <li key={id}>
              <Link href={href(locale, '/research') + '#' + id}>{label[pt ? 0 : 1]} <span aria-hidden="true">→</span></Link>
            </li>
          ))}
        </ul>
      </nav>

      {lead && reading && (
        <section id="em-foco" className="wrap journal-section inst-feature" aria-labelledby="featured-title">
          <div className="inst-feature-main">
            <div className="showcase-meta">
              <p className="kicker">{pt ? 'Resultado em destaque' : 'Featured result'}</p>
              <StatusBadge status={lead.status} locale={locale} />
            </div>
            <h2 id="featured-title">{reading.question}</h2>
            <p className="feature-finding">{reading.finding}</p>
            <p>{reading.why}</p>
            <div className="visible-limit">
              <strong>{pt ? 'Alcance do resultado' : 'Scope of the result'}</strong>
              <p>{reading.limit} {tr(D.status[lead.status].d, locale)}</p>
            </div>
            <p><Link className="text-link arrow-link" href={href(locale, '/results/' + lead.slug)}>{pt ? 'Conferir o teste de exclusão por redshift' : 'Inspect the redshift exclusion test'}</Link></p>
          </div>
          <div className="feature-comparison">
            <SensitivityChart
              rows={sensitivityRows(sensitivity)}
              series={compilations(sensitivity)}
              locale={locale}
              highlight={lead.id}
              title={pt ? 'Quanto a preferência muda sem as supernovas próximas?' : 'How much does the preference change without nearby supernovae?'}
              lead={pt ? 'Cada ponto mostra uma execução pública com uma faixa de redshift removida.' : 'Each point shows a public run with a redshift interval removed.'}
            />
            <Link className="text-link arrow-link" href={href(locale, '/results/families/redshift-exclusion')}>
              {pt ? 'Comparar as execuções da família' : 'Compare the runs in this family'}
            </Link>
          </div>
        </section>
      )}

      <section className="dark-chapter observation-chapter" aria-labelledby="live-title">
        <div className="wrap observation-grid">
          <div>
            <p className="kicker">{pt ? 'Visualização científica' : 'Scientific visualisation'}</p>
            <h2 id="live-title">{pt ? 'O Universo em diferentes medidas.' : 'The Universe through different measurements.'}</h2>
            <p>{pt ? 'Mude o modelo de expansão e compare as restrições de Planck, DESI, supernovas e da escada de distâncias no Resultado vivo.' : 'Switch the expansion model and compare constraints from Planck, DESI, supernovae and the distance ladder in Living result.'}</p>
            <Link className="journal-button" href={href(locale, '/resultado-vivo')}>{pt ? 'Abrir o Resultado vivo' : 'Open Living result'} <span aria-hidden="true">→</span></Link>
          </div>
          <figure className="observation-figure">
            <Image
              src="/images/pantheon-volume.jpg"
              width={2560}
              height={1440}
              sizes="(min-width: 56rem) 53vw, 92vw"
              alt={pt ? 'Visualização das 1.543 supernovas do Pantheon+ em suas posições no céu, em cascas de redshift' : 'Visualisation of the 1,543 Pantheon+ supernovae at their sky positions in redshift shells'}
            />
            <figcaption>
              <strong>Pantheon+</strong>
              {pt ? '1.543 supernovas em cascas de redshift. As distâncias usam ΛCDM plano (Ωm = 0,3, H₀ = 70 km/s/Mpc).' : '1,543 supernovae in redshift shells. Distances use flat ΛCDM (Ωm = 0.3, H₀ = 70 km/s/Mpc).'}
              {' '}<a href="https://arxiv.org/abs/2112.03863">Scolnic et al. (2022) <span aria-hidden="true">→</span></a>
            </figcaption>
          </figure>
        </div>
      </section>

      {stories.length > 0 && (
        <section className="wrap journal-section" aria-labelledby="readings-title">
          <div className="section-masthead">
            <h2 id="readings-title">{pt ? 'Do catálogo de resultados' : 'From the results catalogue'}</h2>
            <Link className="text-link arrow-link" href={href(locale, '/results')}>{pt ? 'Abrir catálogo' : 'Open the catalogue'}</Link>
          </div>
          <div className="journal-stories">
            {stories.map((item, index) => {
              const story = readResult(item, locale);
              return (
                <article key={item.id}>
                  <div className="showcase-meta">
                    <StatusBadge status={item.status} locale={locale} />
                    {isNegative(item.id) && <span className="outcome-tag">{pt ? 'Resultado negativo' : 'Negative result'}</span>}
                  </div>
                  <h3><Link href={href(locale, '/results/' + item.slug)}>{story.question}</Link></h3>
                  <p>{story.finding}</p>
                  {index === 0 && <PairChart item={item} locale={locale} compact />}
                  <p className="story-limit">{story.limit}</p>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="catalogue-chapter" aria-labelledby="access-title">
        <div className="wrap catalogue-note">
          <div>
            <h2 id="access-title">{pt ? 'Dos resultados às fontes.' : 'From results back to sources.'}</h2>
            <p>{pt ? 'Cada família reúne execuções de uma pergunta. Nos registros, você encontra os dados, as condições do ajuste e o estado de evidência de cada teste.' : 'Each family groups runs that address one question. Each record includes the data, fitting conditions and evidence status for the test.'}</p>
            <div className="inst-actions">
              <Link className="text-link arrow-link" href={href(locale, '/methods')}>{pt ? 'Métodos e evidência' : 'Methods and evidence'}</Link>
              <Link className="text-link arrow-link" href={href(locale, '/data')}>{pt ? 'Dados e código' : 'Data and software'}</Link>
            </div>
          </div>
          <dl className="inst-facts">
            <div><dt>{pt ? 'Famílias no catálogo' : 'Families in the catalogue'}</dt><dd>{families.length}</dd></div>
            <div><dt>{pt ? 'Execuções documentadas' : 'Documented runs'}</dt><dd>{results.length}</dd></div>
            <div><dt>{pt ? 'Catálogo atualizado em' : 'Catalogue updated on'}</dt><dd><time dateTime={latest}>{fmtDate(latest, locale)}</time></dd></div>
          </dl>
        </div>
      </section>
    </>
  );
}
