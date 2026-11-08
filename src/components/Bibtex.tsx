'use client';

import {useState} from 'react';

export function BibtexButton({bibtex, label, done}: {bibtex: string; label: string; done: string}) {
  const [copied, setCopied] = useState(false);
  return (
    <button type="button" className="btn !py-1.5 text-sm" onClick={async () => {
      try {
        await navigator.clipboard.writeText(bibtex);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {
        window.prompt('BibTeX', bibtex);
      }
    }}>
      <span role="status">{copied ? done : label}</span>
    </button>
  );
}
