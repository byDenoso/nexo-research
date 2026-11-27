'use client';

import {usePathname} from 'next/navigation';
import {useEffect} from 'react';

export function MotionObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const main = document.querySelector('main');
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
    let observer: IntersectionObserver | undefined;
    const visited = new Set<HTMLElement>();
    const selector = '.section-masthead, .nx-observation > div, .nx-lead-copy, .section-heading, .model-lab > header, .research-question h2, .prose-nx h2, .record-block h2, .nx-index-title, .motion-reveal, .inst-log h2, .inst-projects h2, .family-section-title, .atlas-intro h2, .publication-strip, .bibliography > li, .external-references > header, .project-row, .story-steps article, .journal-stories > article, .page-body > section > h2';

    function observe() {
      observer?.disconnect();
      if (motion.matches) {
        for (const element of visited) delete element.dataset.scrollEnter;
        return;
      }
      if (!main || !('IntersectionObserver' in window)) return;
      // The first callback reports every observed element asynchronously. Elements already on screen or
      // above it are settled without an entrance; only those that arrive later from below animate.
      // This replaces a getBoundingClientRect() per element at mount, which forced a synchronous layout of
      // the whole page, including sections that content-visibility would otherwise skip.
      const settled = new Set<Element>();
      observer = new IntersectionObserver(entries => {
        let stagger = 0;
        for (const entry of entries) {
          const element = entry.target as HTMLElement;
          if (!settled.has(element)) {
            settled.add(element);
            if (entry.isIntersecting || entry.boundingClientRect.top < window.innerHeight) {
              observer?.unobserve(element);
              continue;
            }
          }
          if (!entry.isIntersecting) continue;
          observer?.unobserve(element);
          visited.add(element);
          element.dataset.scrollEnter = String(Math.min(stagger++, 2));
        }
      }, {threshold: 0, rootMargin: '0px 0px -3% 0px'});
      for (const element of main.querySelectorAll<HTMLElement>(selector)) {
        if (!visited.has(element)) observer.observe(element);
      }
    }

    observe();
    motion.addEventListener('change', observe);
    return () => {
      motion.removeEventListener('change', observe);
      observer?.disconnect();
      for (const element of visited) delete element.dataset.scrollEnter;
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
