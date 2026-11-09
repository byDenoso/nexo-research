import {ImageResponse} from 'next/og';

export const alt = 'NEXO Research · Computational and observational cosmology';
export const size = {width: 1200, height: 630};
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    <div style={{width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      justifyContent: 'space-between', padding: 72, background: '#030408', color: '#fff',
      borderTop: '20px solid #0033a0', fontFamily: 'sans-serif'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 26}}>
        <div style={{width: 85, height: 85, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #8fb1ff', borderRadius: 43, fontSize: 48, color: '#8fb1ff'}}>N</div>
        <div style={{fontSize: 54, fontWeight: 600, display: 'flex', gap: 13}}>NEXO <span style={{color: '#8fb1ff'}}>Research</span></div>
      </div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 18}}>
        <div style={{fontSize: 68, fontWeight: 600, letterSpacing: -3}}>Cosmology under test</div>
        <div style={{fontSize: 32, color: '#b8c9e8'}}>Computational and observational cosmology</div>
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 18, fontSize: 24, color: '#9bb9ff'}}>
        <div style={{height: 3, width: 70, background: '#0033a0'}} /> nexoresearch.org
      </div>
    </div>,
    size
  );
}
