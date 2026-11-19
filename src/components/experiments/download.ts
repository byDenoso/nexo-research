export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function csvDownload(name: string, rows: (string | number)[][]) {
  const cell = (v: string | number) => '"' + String(v).replaceAll('"', '""') + '"';
  downloadBlob(new Blob([rows.map(row => row.map(cell).join(',')).join('\n') + '\n'], {type:'text/csv;charset=utf-8'}), name + '.csv');
}

export async function captureSvg(svg: SVGSVGElement, name: string) {
  const copy = svg.cloneNode(true) as SVGSVGElement;
  const nodes = [svg, ...svg.querySelectorAll('*')];
  const clones = [copy, ...copy.querySelectorAll('*')];
  const props = ['color','background-color','fill','fill-opacity','stroke','stroke-width','stroke-dasharray','opacity','font-family','font-size','font-weight','text-anchor'];
  nodes.forEach((node, i) => {
    const style = getComputedStyle(node);
    clones[i]!.setAttribute('style', props.map(k => k + ':' + style.getPropertyValue(k)).join(';'));
  });
  for (const img of copy.querySelectorAll('image')) {
    const href = img.getAttribute('href');
    if (!href || !href.startsWith('/')) continue;
    const response = await fetch(href);
    if (!response.ok) throw Error('Image unavailable');
    img.setAttribute('href', 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(await response.text()));
  }
  copy.setAttribute('xmlns','http://www.w3.org/2000/svg');
  downloadBlob(new Blob([new XMLSerializer().serializeToString(copy)], {type:'image/svg+xml'}), name + '.svg');
}
