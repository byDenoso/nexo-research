'use client';

import {useEffect, useState} from 'react';
import type {Locale} from '@/lib/i18n';

const entries = [
  ['em-foco', 'Expansão', 'Expansion'], ['galaxias', 'Galáxias', 'Galaxies'],
  ['perguntas', 'Perguntas', 'Questions'], ['fontes', 'Fontes', 'Sources'],
] as const;

export function ChapterNav({locale}: {locale: Locale}) {
  const [active, setActive] = useState<string>('em-foco');
  const livingPath = '/' + locale + '/resultado-vivo';
  useEffect(() => {
    function forwardOldBookmark() {
      if (location.hash === '#expansao-em-etapas') location.replace(livingPath + location.search + location.hash);
    }
    forwardOldBookmark();
    window.addEventListener('hashchange', forwardOldBookmark);
    const observer = new IntersectionObserver(items => {
      const hit = items.filter(item => item.isIntersecting).sort((a,b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (hit) setActive(hit.target.id);
    }, {rootMargin: '0px 0px -55% 0px'});
    for (const [id] of entries) {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    }
    return () => {window.removeEventListener('hashchange', forwardOldBookmark); observer.disconnect();};
  }, [livingPath]);
  return <nav className="chapter-nav wrap" aria-label={locale === 'pt' ? 'Capítulos' : 'Chapters'}>
    {entries.map(([id,pt,en]) => <a key={id} href={'#' + id} aria-current={id === active ? 'location' : undefined} onClick={() => setActive(id)}>
      {locale === 'pt' ? pt : en}<svg aria-hidden="true" viewBox="0 0 100 2" preserveAspectRatio="none"><path d="M0 1H100"/></svg>
    </a>)}
    <a className="chapter-experiment" href={livingPath + '#expansao-em-etapas'}>{locale === 'pt' ? 'Experimento de expansão' : 'Expansion experiment'} <span aria-hidden="true">→</span></a>
  </nav>;
}
