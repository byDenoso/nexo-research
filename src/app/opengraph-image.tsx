import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {ImageResponse} from 'next/og';

export const alt = 'NEXO Research · Computational and observational cosmology';
export const size = {width: 1200, height: 630};
export const contentType = 'image/png';

// Same observation as the home page hero, with its credit printed on the card.
export default async function Image() {
  const field = await readFile(join(process.cwd(), 'public/images/jades-gs-z14-0-field.jpg'));
  const background = `data:image/jpeg;base64,${field.toString('base64')}`;
  return new ImageResponse(
    <div style={{position: 'relative', width: '100%', height: '100%', display: 'flex', background: '#02050b', color: '#fff', fontFamily: 'sans-serif'}}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={background} alt="" width={1200} height={800} style={{position: 'absolute', top: -120, left: 0, objectFit: 'cover'}} />
      <div style={{position: 'absolute', top: 0, left: 0, width: 1200, height: 630, display: 'flex', background: 'linear-gradient(to top, #02050b 0%, rgba(2,5,11,0.86) 36%, rgba(2,5,11,0.35) 100%)'}} />
      <div style={{position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%', padding: '64px 72px 44px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 20, fontSize: 24, fontWeight: 600, letterSpacing: 7}}>
          <div style={{width: 40, height: 40, display: 'flex', border: '2px solid #fff', borderRadius: 20}} />
          NEXO <span style={{opacity: 0.5, fontWeight: 400}}>/</span> RESEARCH
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 22}}>
          <div style={{fontSize: 18, letterSpacing: 5, color: '#cfdcff'}}>INDEPENDENT COSMOLOGY RESEARCH</div>
          <div style={{fontSize: 84, fontWeight: 400, letterSpacing: -3, lineHeight: 1}}>The physics of an evolving universe</div>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 18, fontSize: 15, color: '#b7bdca'}}>
            <span style={{fontSize: 24, color: '#fff'}}>nexoresearch.org</span>
            <span>Image: NASA, ESA, CSA, J. Olmsted (STScI), S. Carniani (Scuola Normale Superiore), JADES Collaboration</span>
          </div>
        </div>
      </div>
    </div>,
    size
  );
}
