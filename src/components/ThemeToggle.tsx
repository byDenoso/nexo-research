'use client';

export function ThemeToggle({label}: {label: string}) {
  const toggle = () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('nexo-theme', next);
    } catch {
      /* storage unavailable: the theme still changes for this visit */
    }
  };
  return (
    <button type="button" onClick={toggle} aria-label={label} title={label} className="btn header-control theme-toggle">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <g className="theme-sun">
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </g>
        <path className="theme-moon" d="M20.5 15.1A8.8 8.8 0 0 1 8.9 3.5a8.8 8.8 0 1 0 11.6 11.6Z" />
      </svg>
    </button>
  );
}
