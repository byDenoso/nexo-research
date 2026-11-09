'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import type {Locale} from '@/lib/i18n';

export function LanguageSwitch({locale}:{locale:Locale}) {
  const target=locale==='pt'?'en':'pt';
  const current=usePathname();
  const path=current.replace(/^\/(?:pt|en)(?=\/|$)/,'/'+target);
  return <Link href={path} hrefLang={target==='pt'?'pt-BR':'en'} lang={target==='pt'?'pt-BR':'en'}
    className="btn header-control language-switch" aria-label={(locale==='pt'?'Idioma':'Language')+': '+target.toUpperCase()}
    onClick={event=>{
      if(window.location.search||window.location.hash){
        event.preventDefault();
        window.location.assign(path+window.location.search+window.location.hash);
      }
    }}>{target.toUpperCase()}</Link>;
}
