'use client';

import {usePathname} from 'next/navigation';
import {useEffect, useRef, useState} from 'react';
import type {Locale} from '@/lib/i18n';
import {fold, matches} from '@/lib/search';

type Destination = {href: string; label: string};

export function SiteMenu({locale, sections, tools}: {locale: Locale; sections: Destination[]; tools: Destination[]}) {
  const pt = locale === 'pt';
  const pathname = usePathname();
  const details = useRef<HTMLDetailsElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const knowledge = {href: `/${locale}/conhecimento`, label: pt ? 'Atlas de conhecimento' : 'Knowledge atlas'};
  const groups = [
    {title: pt ? 'Acessos diretos' : 'Shortcuts', links: tools},
    {title: pt ? 'Páginas' : 'Pages', links: [...sections, knowledge]},
  ].map(group => ({...group, links: group.links.filter(item => matches(fold(item.label), query))}));
  const total = groups.reduce((n, group) => n + group.links.length, 0);

  useEffect(() => {
    if (!details.current) return;
    const menu = details.current;
    function keydown(event: globalThis.KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (!menu.open) setQuery('');
        menu.open = true;
        input.current?.focus();
        input.current?.select();
      } else if (event.key === 'Escape' && menu.open) {
        event.preventDefault();
        menu.open = false;
        setQuery('');
        menu.querySelector('summary')?.focus();
      }
    }
    function dismiss(event: Event) {
      if (event.target instanceof Node && menu.open && !menu.contains(event.target)) menu.open = false;
    }
    document.addEventListener('keydown', keydown);
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('focusin', dismiss);
    return () => {
      document.removeEventListener('keydown', keydown);
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('focusin', dismiss);
    };
  }, []);
  return <details ref={details} className="site-menu">
    <summary className="btn header-control" aria-label="Menu" aria-keyshortcuts="Control+K Meta+K"
      onClick={() => {if (!details.current?.open) setQuery('');}}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path className="menu-stroke top" d="M3 6L21 6"/><path className="menu-stroke middle" d="M3 12L21 12"/><path className="menu-stroke bottom" d="M3 18L21 18"/></svg>
      <span className="site-menu-label">Menu</span>
    </summary>
    <nav className="card site-menu-panel" aria-label={pt ? 'Todas as páginas' : 'All pages'}>
      <label className="menu-search"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/></svg>
        <span className="sr-only">{pt ? 'Filtrar páginas do menu' : 'Filter menu pages'}</span>
        <input ref={input} type="search" value={query} placeholder={pt ? 'Filtrar páginas' : 'Filter pages'} onChange={e => setQuery(e.target.value)} onKeyDown={e => {
          if (e.key === 'ArrowDown') {e.preventDefault(); details.current?.querySelector<HTMLAnchorElement>('nav a')?.focus();}
          if (e.key === 'Enter' && total === 1) {e.preventDefault(); details.current?.querySelector<HTMLAnchorElement>('nav a')?.click();}
        }}/>
        <kbd>Ctrl / ⌘ K</kbd>
      </label>
      <div className="menu-groups">
        {groups.filter(group => group.links.length).map(group => <div key={group.title}>
          <p>{group.title}</p>
          <ul>{group.links.map(item => <li key={item.href}>
            <a href={item.href} aria-current={item.href === pathname ? 'page' : undefined}
              onClick={() => {if (details.current) details.current.open = false;}}>{item.label}</a>
          </li>)}</ul>
        </div>)}
      </div>
      <p className={total ? 'sr-only' : 'menu-empty'} role="status">{query.trim() && (total ? (pt ? 'Destinos encontrados' : 'Matching destinations') + ' · ' + total : (pt ? 'Nenhuma página encontrada.' : 'No matching pages.'))}</p>
    </nav>
  </details>;
}
