import type {SurfacePoint} from '@/lib/bao-grid';
import type {SkyObject} from '@/lib/expansion';
export type SceneData =
  | {kind:'bao'; rows:SurfacePoint[][]; selected:SurfacePoint; onSelect:(omegaM:number,h0:number)=>void}
  | {kind:'sky'; objects:SkyObject[]; maxZ:number; selected:number; onSelect:(index:number)=>void}
  | {kind:'flow'; scale:number};
export type CameraView = {azimuth:number; elevation:number; zoom:number};
export const initialCamera: CameraView = {azimuth:35, elevation:39, zoom:1};
export type SceneProps = {data:SceneData; view:CameraView; onView:(view:CameraView)=>void; onReady:()=>void; onFail:()=>void; onCapture:(fn:(()=>void)|null)=>void};
