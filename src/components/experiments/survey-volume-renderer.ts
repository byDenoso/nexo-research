// Direct point-cloud renderer. Input is the exact little-endian Float32 x,y,z,z_redshift
// payload from the validated standalone NEXO observatory, not a reconstructed density field.
export const volume = {"count":[143633,941],"center":[-0.6148681640625,-10.98931884765625,0.826904296875],"yaw":0.06977550044982518,"pitch":1.0471975511965976} as const;
export type View = {yaw:number; pitch:number; zoom:number; lo:number; hi:number; desi:boolean; ero:boolean};
export const initialView = ():View => ({yaw:volume.yaw,pitch:volume.pitch,zoom:1,lo:.1,hi:.4,desi:true,ero:true});
const vertex = `attribute vec4 p; uniform vec3 center;uniform vec3 right;uniform vec3 up;
uniform vec2 scale;uniform vec2 zr;uniform float size;varying float v;
void main(){vec3 q=p.xyz-center;v=step(zr.x-0.0000001,p.w)*step(p.w,zr.y+0.0000001);
gl_Position=vec4(dot(q,right)*scale.x,dot(q,up)*scale.y,0.0,1.0);
if(v<0.5)gl_Position=vec4(2.0,2.0,0.,1.);gl_PointSize=size;}`;
const fragment = `precision mediump float;uniform vec3 color;uniform float cluster;varying float v;
void main(){if(v<0.5)discard;float r=length(gl_PointCoord*2.0-1.0);if(r>1.0)discard;
float a=cluster>0.5?0.82*exp(-23.0*r*r)+0.65*exp(-160.0*(r-0.66)*(r-0.66)):0.62*exp(-5.0*r*r);
gl_FragColor=vec4(color,a);}`;

export type VolumeRenderer = { draw:(v:View)=>void; count:(v:View)=>[number,number]; dispose:()=>void };
export async function createVolume(canvas:HTMLCanvasElement, signal:AbortSignal):Promise<VolumeRenderer>{
  const gl=canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
  if(!gl)throw Error('WebGL unavailable');
  const path='/data/desi-erosita/';
  const data=await Promise.all(['galaxies.bin','clusters.bin'].map(async (name,i)=>{
    const response=await fetch(path+name,{signal});
    if(!response.ok)throw Error('Survey payload unavailable');
    const bytes=await response.arrayBuffer();
    if(bytes.byteLength!==volume.count[i]!*16)throw Error('Survey payload size mismatch');
    return new Float32Array(bytes);
  }));
  if(signal.aborted)throw Error('Aborted');
  const program=gl.createProgram();
  if(!program)throw Error('WebGL program unavailable');
  const compile=(type:number,src:string)=>{
    const shader=gl.createShader(type);if(!shader)throw Error('WebGL shader unavailable');
    gl.shaderSource(shader,src);gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const msg=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw Error(msg??'Shader compilation failed');}
    gl.attachShader(program,shader);gl.deleteShader(shader);
  };
  compile(gl.VERTEX_SHADER,vertex);compile(gl.FRAGMENT_SHADER,fragment);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program)??'WebGL link failed');
  gl.useProgram(program);
  const p=gl.getAttribLocation(program,'p');
  const u=(name:string)=>gl.getUniformLocation(program,name);
  const loc={center:u('center'),right:u('right'),up:u('up'),scale:u('scale'),zr:u('zr'),size:u('size'),color:u('color'),cluster:u('cluster')};
  const buffers=data.map(a=>{const b=gl.createBuffer();if(!b)throw Error('WebGL buffer unavailable');gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,a,gl.STATIC_DRAW);return b;});
  gl.enableVertexAttribArray(p);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.disable(gl.DEPTH_TEST);
  const center=new Float32Array(volume.center);
  let radius=0,vertical=0;
  for(const a of data)for(let j=0;j<a.length;j+=4){radius=Math.max(radius,Math.hypot(a[j]!-center[0]!,a[j+1]!-center[1]!));vertical=Math.max(vertical,Math.abs(a[j+2]!-center[2]!));}
  function draw(v:View){
    if(gl.isContextLost())return;
    const rect=canvas.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    const budget=rect.width<550?300000:720000;
    const dpr=Math.min(devicePixelRatio||1,1.75,Math.sqrt(budget/(rect.width*rect.height)));
    const w=Math.max(1,Math.round(rect.width*dpr)),h=Math.max(1,Math.round(rect.height*dpr));
    if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h;
    const c=Math.cos(v.yaw),s=Math.sin(v.yaw),cp=Math.cos(v.pitch),sp=Math.sin(v.pitch);
    const px=Math.min(w*.92/(2*radius),h*.90/(2*(Math.abs(cp)*radius+Math.abs(sp)*vertical)))*v.zoom;
    gl.viewport(0,0,w,h);gl.clearColor(5/255,7/255,13/255,1);gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform3fv(loc.center,center);gl.uniform3f(loc.right,c,s,0);gl.uniform3f(loc.up,-s*cp,c*cp,sp);
    gl.uniform2f(loc.scale,px*2/w,px*2/h);gl.uniform2f(loc.zr,v.lo,v.hi);
    for(let i=0;i<2;i++){
      if(i===0?!v.desi:!v.ero)continue;
      gl.bindBuffer(gl.ARRAY_BUFFER,buffers[i]!);gl.vertexAttribPointer(p,4,gl.FLOAT,false,0,0);
      gl.uniform3fv(loc.color,i?[.99,.68,.31]:[.22,.71,.89]);gl.uniform1f(loc.cluster,i);
      gl.uniform1f(loc.size,(i?5.2:1.65)*dpr*Math.min(1.8,Math.sqrt(v.zoom)));gl.drawArrays(gl.POINTS,0,data[i]!.length/4);
    }
  }
  const count=(v:View):[number,number]=>data.map((a,i)=>{if(i===0?!v.desi:!v.ero)return 0;let n=0;for(let j=3;j<a.length;j+=4)if(a[j]!>=v.lo-1e-7&&a[j]!<=v.hi+1e-7)n++;return n;}) as [number,number];
  if(gl.getError()!==gl.NO_ERROR)throw Error('WebGL initialization failed');
  return {draw,count,dispose:()=>{for(const b of buffers)gl.deleteBuffer(b);gl.deleteProgram(program);}};
}
