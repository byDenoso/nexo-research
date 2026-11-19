'use client';
import {useEffect, useLayoutEffect, useMemo, useRef} from 'react';
import {Canvas, useThree, type ThreeEvent} from '@react-three/fiber';
import {BufferAttribute, BufferGeometry, CanvasTexture, Color, DoubleSide, InstancedMesh, Object3D, Spherical, Vector3} from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import type {SurfacePoint} from '@/lib/bao-grid';
import {comovingDistance} from '@/lib/expansion';
import {BAO_LEVEL} from '@/lib/live-result-bao';
import {downloadBlob} from './download';
import type {SceneData, SceneProps} from './scene-types';

const rad = Math.PI / 180;
const skyScale = 3500; // scene units per 3500 comoving Mpc
const shellZ = [.1,.5,1,2];
const shellRadii = shellZ.map(z=>comovingDistance(z)/skyScale);
const baoX = (m:number) => (m-.302)/.026;
const baoZ = (h:number) => (h-68.75)/2.65;
const baoY = (d:number) => d*.15;

function Label({text,at}: {text:string; at:[number,number,number]}) {
  const map = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 64;
    const c = canvas.getContext('2d')!;
    c.font = 'bold 32px sans-serif'; c.textAlign='center'; c.textBaseline='middle';
    c.strokeStyle='#061121'; c.lineWidth=6; c.strokeText(text,128,32);
    c.fillStyle='#eef5ff'; c.fillText(text,128,32);
    return new CanvasTexture(canvas);
  },[text]);
  useEffect(()=>()=>map.dispose(),[map]);
  return <sprite position={at} scale={[.88,.22,1]}><spriteMaterial map={map} depthTest={false} transparent/></sprite>;
}

function BaoMesh({data}:{data:Extract<SceneData,{kind:'bao'}>}) {
  const geometry = useMemo(() => {
    const coords:number[] = [], chi:number[] = [], indices:number[] = [];
    const stride = data.rows[0]!.length;
    data.rows.forEach((row,i)=>row.forEach((p,j)=>{
      coords.push(baoX(p.omegaM),baoY(p.delta),baoZ(p.h0)); chi.push(p.delta);
      const n = i*stride+j;
      if (i && j) indices.push(n-stride-1,n-stride,n,n-stride-1,n,n-1);
    }));
    const g = new BufferGeometry();
    g.setAttribute('position',new BufferAttribute(new Float32Array(coords),3));
    g.setAttribute('chi',new BufferAttribute(new Float32Array(chi),1));
    g.setIndex(indices);
    return g;
  },[data.rows]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  const click = (event:ThreeEvent<MouseEvent>) => {
    if (event.delta > 4 || event.point.y+.55>baoY(10)) return;
    data.onSelect(event.point.x*.026+.302,event.point.z*2.65+68.75);
  };
  const p:SurfacePoint = data.selected;
  return <group position={[0,-.55,0]}>
    <mesh geometry={geometry} onClick={click}>
      <shaderMaterial side={DoubleSide}
        vertexShader={'attribute float chi; varying float d; varying vec2 grid; void main(){d=chi;grid=position.xz*5.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}'}
        fragmentShader={`varying float d; varying vec2 grid; void main(){if(d>10.0)discard;
          vec3 c=mix(vec3(.09,.28,.61),vec3(.46,.81,.89),sqrt(clamp(d/10.0,0.0,1.0)));
          vec2 dist=abs(fract(grid-.5)-.5)/max(fwidth(grid),vec2(.0001));
          c*=mix(.69,1.,clamp(min(dist.x,dist.y),0.,1.));
          float edge=min(abs(d-${BAO_LEVEL[68].toFixed(6)}),abs(d-${BAO_LEVEL[95].toFixed(6)}));
          c=mix(vec3(.91,.98,1.),c,smoothstep(.0,max(.06,fwidth(d)*1.3),edge));gl_FragColor=vec4(c,1.0);}`}/>
    </mesh>
    <gridHelper args={[3,12,0x6084ac,0x203855]}/>
    {p.delta <= 10 && <mesh position={[baoX(p.omegaM),baoY(p.delta)+.035,baoZ(p.h0)]}><sphereGeometry args={[.044,14,10]}/><meshBasicMaterial color="#ffc571"/></mesh>}
    <Label text="Ωₘ 0.338" at={[1.38,.04,-1.45]}/><Label text="H₀ 72.5" at={[-1.38,.05,1.46]}/><Label text="Δχ² 10" at={[-1.38,1.5,-1.38]}/>
  </group>;
}

const flowPoints = Array.from({length:75},(_,i)=>new Vector3((i%5-2)*.55,(Math.floor(i/25)-1)*.55,(Math.floor(i/5)%5-2)*.55));
function Points({data}:{data:Extract<SceneData,{kind:'sky'|'flow'}>}) {
  const mesh = useRef<InstancedMesh>(null);
  const invalidate = useThree(s=>s.invalidate);
  const indices = useMemo(()=>data.kind==='sky' ? data.objects.map((_,i)=>i).filter(i=>data.objects[i]!.z<=data.maxZ) : [],[data]);
  useLayoutEffect(()=>{
    if (!mesh.current) return;
    const obj=new Object3D(), color=new Color();
    const count=data.kind==='sky'?indices.length:flowPoints.length;
    for(let i=0;i<count;i++) {
      if(data.kind==='sky') {
        const index=indices[i]!, p=data.objects[index]!;
        obj.position.fromArray(p.xyz).divideScalar(skyScale);
        obj.scale.setScalar(index===data.selected ? .032 : .011);
        color.set(index===data.selected ? '#ffbf70' : p.z<.25 ? '#8db9eb' : p.z<1 ? '#d7ecff' : '#fae4b2');
      } else {obj.position.copy(flowPoints[i]!).multiplyScalar(data.scale);obj.scale.setScalar(.024);color.set('#a7cfff');}
      obj.updateMatrix();mesh.current.setMatrixAt(i,obj.matrix);mesh.current.setColorAt(i,color);
    }
    mesh.current.count=count;mesh.current.instanceMatrix.needsUpdate=true;
    if(mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate=true;
    mesh.current.computeBoundingSphere();invalidate();
  },[data,indices,invalidate]);
  return <>
    <instancedMesh ref={mesh} args={[undefined,undefined,data.kind==='sky'?data.objects.length:flowPoints.length]} onClick={e=>{
      if (data.kind==='sky' && e.delta<5 && e.instanceId!==undefined) data.onSelect(indices[e.instanceId]!);
    }}><icosahedronGeometry args={[1,0]}/><meshBasicMaterial/></instancedMesh>
    {data.kind==='sky' ? <>
      {shellRadii.map((r,i)=><mesh key={r} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[Math.max(.001,r-.0025),r+.0025,96]}/><meshBasicMaterial side={DoubleSide} color={i%2?'#6c839f':'#7c96b3'}/></mesh>)}
      <Label text="δ +90°" at={[0,1.48,0]}/><Label text="α 0°" at={[1.6,0,0]}/><Label text="α 90°" at={[0,0,1.6]}/>
    </> : <><gridHelper args={[2.8,10,0x567394,0x213650]}/><Label text="10 Mpc" at={[1.1,.09,0]}/></>}
  </>;
}

function Scene({data,view,onView,onReady,onFail,onCapture}:SceneProps) {
  const {gl,camera,invalidate,scene} = useThree();
  const orbit = useRef<OrbitControls|null>(null);
  const base = data.kind==='flow'?4.1:5.1;
  useEffect(()=>{
    const controls = new OrbitControls(camera,gl.domElement);
    controls.enablePan=false;controls.enableDamping=false;
    controls.minDistance=base/3.5;controls.maxDistance=base/.65;
    controls.minPolarAngle=15*rad;controls.maxPolarAngle=165*rad;
    const end=()=>onView({azimuth:Math.round(controls.getAzimuthalAngle()/rad),elevation:Math.round(90-controls.getPolarAngle()/rad),zoom:Number((base/controls.getDistance()).toFixed(2))});
    const redraw=()=>invalidate();
    controls.addEventListener('change',redraw);controls.addEventListener('end',end);orbit.current=controls;
    return ()=>{controls.dispose();controls.removeEventListener('change',redraw);controls.removeEventListener('end',end);orbit.current=null;};
  },[camera,gl,base,invalidate,onView]);
  useEffect(()=>{
    camera.position.setFromSpherical(new Spherical(base/view.zoom,(90-view.elevation)*rad,view.azimuth*rad));
    camera.lookAt(0,0,0);orbit.current?.update();invalidate();
  },[camera,view,base,invalidate]);
  useEffect(()=>{
    const canvas=gl.domElement;
    const lost=(e:Event)=>{e.preventDefault();onFail();};
    canvas.addEventListener('webglcontextlost',lost);
    onCapture(()=>{gl.render(scene,camera);canvas.toBlob(blob=>{if(blob) downloadBlob(blob,'nexo-'+data.kind+'.png');},'image/png');});
    const frame=requestAnimationFrame(()=>{gl.render(scene,camera);onReady();});
    return ()=>{cancelAnimationFrame(frame);onCapture(null);canvas.removeEventListener('webglcontextlost',lost);};
  },[gl,camera,scene,data.kind,onCapture,onFail,onReady]);
  return <><color attach="background" args={['#081426']}/>{data.kind==='bao'?<BaoMesh data={data}/>:<Points data={data}/>}</>;
}

export default function OrbitScene(props:SceneProps) {
  return <Canvas frameloop="demand" dpr={[1,1.5]} camera={{fov:42,near:.03,far:100}}
    gl={{antialias:true,powerPreference:'low-power'}}>
    <Scene {...props}/>
  </Canvas>;
}
