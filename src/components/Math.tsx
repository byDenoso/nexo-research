import katex from 'katex';
import 'katex/dist/katex.min.css';

// KaTeX runs on the server; only the rendered markup and its stylesheet reach the browser.
export function Tex({tex, display = false}: {tex: string; display?: boolean}) {
  const html = katex.renderToString(tex, {displayMode: display, throwOnError: true, output: 'htmlAndMathml', strict: 'error'});
  return <span dangerouslySetInnerHTML={{__html: html}} />;
}
