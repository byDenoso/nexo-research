'use client';

import {usePathname} from 'next/navigation';
import {useEffect, useRef, useState} from 'react';

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// One observer for the whole page. An element marked data-inview="" becomes data-inview="in" the
// first time it is on screen, and the stylesheet plays its entrance from there. Elements marked
// data-pointer receive the pointer position as --mx/--my in [-1, 1] for a small parallax.
// Without scripts, or with reduced motion, every element simply shows its final state.
export function MotionObserver() {
  const pathname = usePathname();
  useEffect(() => {
    const targets = [...document.querySelectorAll<HTMLElement>('[data-inview=""]')];
    if (reduced() || !('IntersectionObserver' in window)) {
      for (const node of targets) node.dataset.inview = 'in';
      return;
    }
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        (entry.target as HTMLElement).dataset.inview = 'in';
        observer.unobserve(entry.target);
      }
    }, {threshold: 0.18});
    for (const node of targets) observer.observe(node);

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
