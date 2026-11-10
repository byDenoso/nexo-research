'use client';

import {useLayoutEffect} from 'react';

const titleTransition = ':active-view-transition-type(nx-catalogue-title)';

export function CatalogueHeading({title}: {title: string}) {
  useLayoutEffect(() => {
    // The router can retain the catalogue's scroll offset on a narrow viewport.
    if (window.CSS?.supports(`selector(${titleTransition})`) && document.documentElement.matches(titleTransition)) {
      window.scrollTo({top: 0, behavior: 'instant'});
    }
  }, []);
  return <h1>{title}</h1>;
}
