'use client';
import {Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode} from 'react';
import type {Locale} from '@/lib/i18n';
import {captureSvg} from './download';
import {initialCamera, type SceneData} from './scene-types';

const OrbitScene = lazy(() => import('./OrbitScene'));
class SceneBoundary extends Component<{children:ReactNode; onFail:()=>void}, {failed:boolean}> {
  state = {failed:false};
  static getDerivedStateFromError() { return {failed:true}; }
  componentDidCatch() { this.props.onFail(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export function ExperimentFrame({locale, name, label, active, scene, children, dataError = false, onExport}: {
  locale:Locale; name:string; label:string; active:boolean; scene?:SceneData; children:ReactNode; dataError?:boolean; onExport?:()=>void;
}) {
  const pt = locale === 'pt';
  const [status, setStatus] = useState<'loading'|'ready'|'unavailable'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [view, setView] = useState(initialCamera);
  const [captureError, setCaptureError] = useState(false);
  const staticView = useRef<HTMLDivElement>(null);
  const capture = useRef<(()=>void)|null>(null);
  const keepCapture = useCallback((fn:(()=>void)|null) => {capture.current = fn;}, []);
  const onReady = useCallback(() => setStatus('ready'), []);
  const onFail = useCallback(() => setStatus('unavailable'), []);
  useEffect(() => {
    if (!active) { setStatus('loading'); setView(initialCamera); setCaptureError(false); }
    if (!active || status !== 'loading') return;
    const id = setTimeout(onFail, 16000);
    return () => clearTimeout(id);
  }, [active, status, attempt, onFail]);
  const ready = active && status === 'ready' && !dataError;
  const failed = active && (status === 'unavailable' || dataError);
  async function save() {
    setCaptureError(false);
    try {
      if (ready && capture.current) capture.current();
      else if (staticView.current?.querySelector('svg')) await captureSvg(staticView.current.querySelector('svg')!, name);
    } catch { setCaptureError(true); }
  }
  return <div className="experiment-frame">
    <div className="experiment-viewport" data-scene-state={!active ? '2d' : failed ? 'fallback' : status}>
      <div ref={staticView} className="experiment-static" aria-hidden={ready || undefined}>{children}</div>
      {active && scene && !failed && <div className="experiment-canvas" style={{visibility:ready?'visible':'hidden'}} role="img" aria-label={label}>
        <SceneBoundary key={attempt} onFail={onFail}><Suspense fallback={null}>
          <OrbitScene data={scene} view={view} onView={setView} onReady={onReady} onFail={onFail} onCapture={keepCapture}/>
        </Suspense></SceneBoundary>
      </div>}
      {active && !ready && <span role="status" className="experiment-status">{failed ?
        (pt?'Vista estática · 3D indisponível':'Static view · 3D unavailable') :
        (pt?'Carregando cena 3D…':'Loading 3D scene…')}</span>}
    </div>
    {active && !dataError && <div className="experiment-camera">
      {failed ? <button type="button" onClick={()=>{setStatus('loading');setAttempt(n=>n+1);}}>{pt?'Tentar 3D novamente':'Retry 3D'}</button> : <>
        <label>{pt?'Rotação':'Rotation'} <input type="range" min="-180" max="180" value={view.azimuth} onChange={e=>setView({...view,azimuth:Number(e.target.value)})}/></label>
        <label>{pt?'Inclinação':'Tilt'} <input type="range" min="-75" max="75" value={view.elevation} onChange={e=>setView({...view,elevation:Number(e.target.value)})}/></label>
        <label>Zoom <input type="range" min=".65" max="3.5" step=".05" value={view.zoom} onChange={e=>setView({...view,zoom:Number(e.target.value)})}/></label>
        <button type="button" onClick={()=>setView({...initialCamera})}>{pt?'Recentrar':'Recenter'}</button>
      </>}
    </div>}
    <div className="experiment-tools">
      <button type="button" onClick={save}>{pt?'Capturar figura':'Save figure'}</button>
      {onExport && <button type="button" onClick={onExport}>{pt?'Exportar dados (CSV)':'Export data (CSV)'}</button>}
      {captureError && <span role="status">{pt?'Falha na captura. Tente novamente.':'Capture failed. Please retry.'}</span>}
    </div>
  </div>;
}
