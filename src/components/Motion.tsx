'use client';

import {usePathname} from 'next/navigation';
import {useEffect, useRef, useState} from 'react';

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const viewTimeline = 'animation-timeline: view()';
const inviewTargets = '[data-inview=""]';

// These are the editorial groups with a view-timeline entrance in globals.css.
const revealGroups = [
  ['content-enter', `.motion-reveal, .section-heading, .profile-strip, .mission-links > li,
    .result-grid > li, .research-panel, .prose-nx h2, .results-filters, .empty-state,
    .contact-card > div, .record-block, .record-values > li, .record-provenance, .site-footer .wordmark`],
  ['rise', `.lead-story-copy, .lead-story > .viz, .record-reading > .viz, .editorial-featured-card,
    .research-photo-card, .editorial-question-list li, .story-steps > div, .editorial-archive-metrics > div,
    .family-record, .family-figure, .dossier-data li, .editorial-closer, .pipeline-step summary, .source-index li`],
  ['mask-up', `.editorial-section-header h2, .editorial-section-intro h2, .editorial-archive-heading h2,
    .editorial-closer h2, .source-copy h2`],
  ['wipe', '.research-photo-frame'],
  ['settle', '.research-photo-frame img'],
] as const;
const revealTargets = revealGroups.map(([, selector]) => selector).join(',');
const ambientTargets = '.cine-stage, .expansion-field';

function methodsProgress() {
  if (window.CSS?.supports(`(${viewTimeline}) and (timeline-scope: --nx-methods)`)) return;
  const article = document.querySelector('.methods-article');
  const header = document.querySelector<HTMLElement>('.site-header');
  if (!article || !header) return;

  let frame = 0;
  let previous = -1;
  const update = () => {
    frame = 0;
    if (reduced()) return;
    const {top, height} = article.getBoundingClientRect();
    const inset = header.getBoundingClientRect().height;
    const distance = Math.max(1, height - window.innerHeight + inset);
    const progress = Math.min(1, Math.max(0, (inset - top) / distance));
    if (progress === previous) return;
    previous = progress;
    header.style.setProperty('--nx-method-progress', progress.toFixed(4));
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  header.dataset.methodsProgress = '';
  update();
  window.addEventListener('scroll', schedule, {passive: true});
  window.addEventListener('resize', schedule);
  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    delete header.dataset.methodsProgress;
    header.style.removeProperty('--nx-method-progress');
  };
}

// One observer for the whole page. An element marked data-inview="" becomes data-inview="in" the
// first time it is on screen, and the stylesheet plays its entrance from there. Elements marked
// data-pointer receive the pointer position as --mx/--my in [-1, 1] for a small parallax.
// Without scripts, or with reduced motion, every element simply shows its final state.
export function MotionObserver() {
  const pathname = usePathname();
  useEffect(() => {
    const motionReduced = reduced();
    const stopProgress = motionReduced ? undefined : methodsProgress();
    if (motionReduced || !('IntersectionObserver' in window)) {
      for (const node of document.querySelectorAll<HTMLElement>(inviewTargets)) node.dataset.inview = 'in';
      return stopProgress;
    }
    const fallback = !window.CSS?.supports(viewTimeline);
    const targets = `${inviewTargets}, ${ambientTargets}${fallback ? `, ${revealTargets}` : ''}`;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const node = entry.target as HTMLElement | SVGElement;
        if (node.matches(ambientTargets)) {
          node.toggleAttribute('data-loop-visible', entry.isIntersecting);
          continue;
        }
        if (!entry.isIntersecting) continue;
        if (node.dataset.inview === '') node.dataset.inview = 'in';
        if (node.dataset.reveal === 'pending') {
          const reveal = revealGroups.find(([, selector]) => node.matches(selector));
          if (reveal) node.dataset.reveal = reveal[0];
        }
        observer.unobserve(node);
      }
    }, {threshold: 0.18});
    const observe = (node: HTMLElement | SVGElement) => {
      if (fallback && !node.dataset.reveal && node.matches(revealTargets)) node.dataset.reveal = 'pending';
      if (node.dataset.reveal === 'pending' || node.dataset.inview === '' || node.matches(ambientTargets)) observer.observe(node);
    };
    for (const node of document.querySelectorAll<HTMLElement | SVGElement>(targets)) observe(node);

    const main = document.querySelector('main');
    const added = fallback && main ? new MutationObserver(records => {
      for (const {addedNodes} of records) for (const node of addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        if (node.matches(targets)) observe(node);
        for (const child of node.querySelectorAll<HTMLElement | SVGElement>(targets)) observe(child);
      }
    }) : undefined;
    if (added && main) added.observe(main, {childList: true, subtree: true});

    const stages = [...document.querySelectorAll<HTMLElement>('[data-pointer]')];
    let frame = 0;
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      const stage = event.currentTarget as HTMLElement;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = stage.getBoundingClientRect();
        stage.style.setProperty('--mx', ((event.clientX - box.left) / box.width * 2 - 1).toFixed(3));
        stage.style.setProperty('--my', ((event.clientY - box.top) / box.height * 2 - 1).toFixed(3));
      });
    };
    for (const stage of stages) stage.addEventListener('pointermove', move);
    return () => {
      observer.disconnect();
      added?.disconnect();
      stopProgress?.();
      cancelAnimationFrame(frame);
      for (const stage of stages) stage.removeEventListener('pointermove', move);
    };
  }, [pathname]);
  return null;
}

// Counts up to a published value when it first appears. The server renders the final value, so
// the number is correct without scripts and before the animation starts.
export function CountUp({value, locale, digits = 0, duration = 1100}: {value: number; locale: string; digits?: number; duration?: number}) {
  const format = new Intl.NumberFormat(locale, {minimumFractionDigits: digits, maximumFractionDigits: digits});
  const node = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);
  useEffect(() => {
    const element = node.current;
    if (!element || reduced() || !('IntersectionObserver' in window)) return;
    let frame = 0;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / duration);
        setShown(value * (1 - (1 - progress) ** 3));
        if (progress < 1) frame = requestAnimationFrame(tick);
        else setShown(value);
      };
      frame = requestAnimationFrame(tick);
    }, {threshold: 0.6});
    observer.observe(element);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [value, duration]);
  return <span ref={node} className="count-up">{format.format(shown)}</span>;
}
