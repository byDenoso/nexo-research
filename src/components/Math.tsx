import katex from 'katex';
import 'katex/dist/katex.min.css';
import {D} from '@/lib/dict';

// KaTeX runs on the server; only the rendered markup and its stylesheet reach the browser.
// Display equations sit in a labelled scroll region that also works with a keyboard.
export function Tex({tex, display = false, label = D.methods.equation.en}: {tex: string; display?: boolean; label?: string}) {
  const html = katex.renderToString(tex, {displayMode: display, throwOnError: true, output: 'htmlAndMathml', strict: 'error'});
  if (!display) return <span dangerouslySetInnerHTML={{__html: html}} />;
  return <span role="group" aria-label={label} tabIndex={0} className="tex-scroll" dangerouslySetInnerHTML={{__html: html}} />;
}
