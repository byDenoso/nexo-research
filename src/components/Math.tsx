import katex from 'katex';
import 'katex/dist/katex.min.css';

// KaTeX runs on the server; only the rendered markup and its stylesheet reach the browser.
// A display equation can be wider than a phone screen, so it sits in a focusable, labelled scroll region.
export function Tex({tex, display = false}: {tex: string; display?: boolean}) {
  const html = katex.renderToString(tex, {displayMode: display, throwOnError: true, output: 'htmlAndMathml', strict: 'error'});
  if (!display) return <span dangerouslySetInnerHTML={{__html: html}} />;
  return <span role="group" aria-label="Equation" tabIndex={0} className="tex-scroll" dangerouslySetInnerHTML={{__html: html}} />;
}
