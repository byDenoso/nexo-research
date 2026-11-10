/// <reference types="react/canary" />

import {ViewTransition, type ReactNode} from 'react';

export const catalogueTitleTransition = 'nx-catalogue-title';

export function CatalogueTitle({slug, children}: {slug: string; children: ReactNode}) {
  return (
    <ViewTransition
      name={`nx-catalogue-${slug}`}
      default="none"
      share={{default: 'none', [catalogueTitleTransition]: catalogueTitleTransition}}
    >
      {children}
    </ViewTransition>
  );
}
