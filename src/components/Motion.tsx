'use client';

import {usePathname} from 'next/navigation';
import {useEffect} from 'react';

// The site shows every element in its final state. Components that still carry data-inview are
// marked as shown on mount, and published numbers are rendered as they are, without counting.
export function MotionObserver() {
  const pathname = usePathname();
  useEffect(() => {
    for (const node of document.querySelectorAll<HTMLElement>('[data-inview=""]')) node.dataset.inview = 'in';
  }, [pathname]);
  return null;
}

export function CountUp({value, locale, digits = 0}: {value: number; locale: string; digits?: number; duration?: number}) {
  const format = new Intl.NumberFormat(locale, {minimumFractionDigits: digits, maximumFractionDigits: digits});
  return <span className="count-up">{format.format(value)}</span>;
}
