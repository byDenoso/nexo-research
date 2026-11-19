'use client';

import {useEffect, useRef, useState, type KeyboardEvent, type ReactNode} from 'react';
import type {Locale} from '@/lib/i18n';

const panels = ['comparar-sondas', 'expansao-em-etapas'] as const;
type Panel = typeof panels[number];

export function LivingSections({locale, comparison, experiment}: {locale: Locale; comparison: ReactNode; experiment: ReactNode}) {
  const [active, setActive] = useState<Panel>(panels[0]);
  const [enhanced, setEnhanced] = useState(false);
  const nav = useRef<HTMLElement>(null);
  const pt = locale === 'pt';
  const labels = [pt ? 'Comparar sondas' : 'Compare probes', pt ? 'Experimento de expansão' : 'Expansion experiment'];

  useEffect(() => {
    function readLocation() {
      setActive(location.hash === '#' + panels[1] ? panels[1] : panels[0]);
    }
    readLocation();
    setEnhanced(true);
    window.addEventListener('hashchange', readLocation);
    window.addEventListener('popstate', readLocation);
    return () => {
      window.removeEventListener('hashchange', readLocation);
      window.removeEventListener('popstate', readLocation);
    };
  }, []);

  function select(id: Panel) {
    if (id === active) return;
    const url = new URL(location.href);
    url.hash = id;
    history.pushState(history.state, '', url);
    setActive(id);
  }

  function onKey(event: KeyboardEvent<HTMLAnchorElement>, index: number) {
    let next: number;
    switch (event.key) {
      case 'Home': next = 0; break;
      case 'End': next = panels.length - 1; break;
      case 'ArrowLeft': case 'ArrowRight': next = 1 - index; break;
      case ' ': next = index; break;
      default: return;
    }
    event.preventDefault();
    select(panels[next]!);
    nav.current?.querySelectorAll('a')[next]?.focus();
  }

  return <div className="living-sections" data-enhanced={enhanced || undefined}>
    <nav ref={nav} className="wrap living-tabs" aria-label={pt ? 'Vistas do Resultado vivo' : 'Living result views'} role={enhanced ? 'tablist' : undefined}>
      {panels.map((id, i) => <a key={id} id={'tab-' + id} href={'#' + id}
        role={enhanced ? 'tab' : undefined} aria-controls={enhanced ? id : undefined}
        aria-selected={enhanced ? active === id : undefined} tabIndex={enhanced && active !== id ? -1 : undefined}
        onKeyDown={event => onKey(event, i)} onClick={event => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault(); select(id);
        }}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          {i === 0 ? <><path d="M3 3v17h18"/><ellipse cx="12" cy="11" rx="7" ry="2.6" transform="rotate(-35 12 11)"/></> :
            <><path d="m12 2 8 5v10l-8 5-8-5V7Zm0 10v10M4 7l8 5 8-5"/></>}
        </svg>{labels[i]}
      </a>)}
    </nav>
    {panels.map((id, i) => <div key={id} id={id} className="living-panel" role={enhanced ? 'tabpanel' : 'region'}
      aria-labelledby={'tab-' + id} tabIndex={enhanced ? 0 : undefined} hidden={enhanced && active !== id}>
      {i === 0 ? comparison : experiment}
    </div>)}
  </div>;
}
