'use client';

import {usePathname} from 'next/navigation';
import {useEffect} from 'react';

export function MotionObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const main = document.querySelector('main');
    const isPublication = pathname.split('/')[2] === 'publications';
    root.dataset.labMotion = '';
    const nav = document.querySelectorAll<HTMLAnchorElement>('.primary-nav a, .header-living');
    for (const link of nav) {
      const url = new URL(link.href);
      if (url.pathname === pathname) link.setAttribute('aria-current', 'page');
      else if (pathname.startsWith(url.pathname + '/')) link.setAttribute('aria-current', 'location');
    }

    const toc = Array.from(main?.querySelectorAll<HTMLAnchorElement>('.methods-index a[href^="#"], .research-index a[href^="#"], .about-layout nav a[href^="#"]') ?? [])
      .flatMap(link => {
        const target = document.getElementById(link.hash.slice(1));
        return target ? [{link, target}] : [];
      });
    let frame = 0;
    function markSection() {
      frame = 0;
      const top = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
      let current = toc[0];
      for (const item of toc) {
        if (!item.target.isConnected) continue;
        const margin = parseFloat(getComputedStyle(item.target).scrollMarginTop) || 0;
        if (item.target.getBoundingClientRect().top <= top + margin + 8) current = item;
      }
      for (const item of toc) {
        if (item === current) item.link.setAttribute('aria-current', 'location');
        else item.link.removeAttribute('aria-current');
      }
    }
    function onScroll() {if (!frame) frame = requestAnimationFrame(markSection);}
    if (toc.length) {
      markSection();
      window.addEventListener('scroll', onScroll, {passive: true});
      window.addEventListener('resize', onScroll);
      window.addEventListener('hashchange', onScroll);
    }

    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const running = new Set<{stop: () => void}>();
    let observer: IntersectionObserver | undefined;
    let generation = 0;
    main?.querySelectorAll<HTMLElement>('[data-inview=""]').forEach(el => {el.dataset.inview = 'in';});
    async function observe() {
      const version = ++generation;
      observer?.disconnect();
      running.forEach(a => a.stop());
      running.clear();
      if (isPublication || motion.matches || !main || !('IntersectionObserver' in window)) return;
      const {animate} = await import('motion/mini');
      if (version !== generation) return;
      observer = new IntersectionObserver(entries => {
        entries.filter(entry => entry.isIntersecting).forEach((entry, i) => {
          observer?.unobserve(entry.target);
          const result = animate(entry.target as HTMLElement, {transform: ['translateY(7px)', 'translateY(0)']},
            {duration: .32, delay: Math.min(i, 2) * .035, ease: [.22, .72, .25, 1]});
          running.add(result);
          void result.then(() => running.delete(result));
        });
      }, {threshold: .08});
      const selector = '.section-masthead, .nx-observation > div, .nx-lead-copy, .section-heading, .model-lab > header, .research-question h2, .prose-nx h2, .record-block h2, .nx-index-title, .source-access-section h2, .inst-log h2, .inst-projects h2, .family-section-title, .atlas-intro h2';
      main.querySelectorAll(selector).forEach(element => observer?.observe(element));
    }
    void observe();
    motion.addEventListener('change', observe);
    return () => {
      generation++;
      motion.removeEventListener('change', observe);
      observer?.disconnect();
      running.forEach(a => a.stop());
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('hashchange', onScroll);
      for (const {link} of toc) link.removeAttribute('aria-current');
      nav.forEach(link => link.removeAttribute('aria-current'));
      delete root.dataset.labMotion;
    };
  }, [pathname]);
  return null;
}

export function CountUp({value, locale, digits=0}: {value:number; locale:string; digits?:number; duration?:number}) {
  return <span className="count-up">{new Intl.NumberFormat(locale,{minimumFractionDigits:digits,maximumFractionDigits:digits}).format(value)}</span>;
}
