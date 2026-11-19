/// <reference types="@webgpu/types" />
// Three depth layers, on a single triangle. This field is decorative and independent of the catalogue.
const glVertex = `#version 300 es
out vec2 uv;
void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);uv=p;gl_Position=vec4(p*2.-1.,0.,1.);}`;
const glFragment = `#version 300 es
precision highp float; in vec2 uv; uniform vec4 frame; out vec4 frag;
float hash(vec2 v){return fract(sin(dot(v,vec2(127.1,311.7)))*43758.5453);}
void main(){vec2 q=vec2(uv.x*frame.x,uv.y);float stars=0.;
 for(int i=1;i<=3;i++){float k=float(i);vec2 p=q*(13.+k*6.)+frame.zw*k*.13+vec2(frame.y*.018*k,frame.y*.006*k);
 vec2 cell=floor(p);vec2 spot=vec2(hash(cell+k),hash(cell+37.+k))*.82+.09;
 vec2 d=fract(p)-spot;float r=dot(d,d);stars+=step(.78,hash(cell+83.))*exp(-r*(650.+k*170.))*(.26+.15*k);}
 float haze=.5+.5*sin(q.x*3.+q.y*4.+.42*sin(q.y*7.+frame.y*.024)+frame.y*.03);
 frag=vec4(vec3(.020,.040,.078)*haze*haze+vec3(.55,.71,.95)*min(stars,1.),1.);}`;
const wgShader = `
struct Out { @builtin(position) position: vec4f, @location(0) uv: vec2f };
@group(0) @binding(0) var<uniform> frame:vec4f;
@vertex fn vert(@builtin(vertex_index) id:u32)->Out{
 let p=vec2f(f32((id<<1u)&2u),f32(id&2u));var o:Out;o.position=vec4f(p*2.-vec2f(1.),0.,1.);o.uv=p;return o;}
fn hash(v:vec2f)->f32{return fract(sin(dot(v,vec2f(127.1,311.7)))*43758.5453);}
@fragment fn frag(input:Out)->@location(0) vec4f{
 let q=vec2f(input.uv.x*frame.x,input.uv.y);var stars=0.;
 for(var i=1;i<=3;i++){let k=f32(i);let p=q*(13.+k*6.)+frame.zw*k*.13+vec2f(frame.y*.018*k,frame.y*.006*k);
 let cell=floor(p);let spot=vec2f(hash(cell+vec2f(k)),hash(cell+vec2f(37.+k)))*.82+vec2f(.09);
 let d=fract(p)-spot;stars+=step(.78,hash(cell+vec2f(83.)))*exp(-dot(d,d)*(650.+k*170.))*(.26+.15*k);}
 let haze=.5+.5*sin(q.x*3.+q.y*4.+.42*sin(q.y*7.+frame.y*.024)+frame.y*.03);
 return vec4f(vec3f(.020,.040,.078)*haze*haze+vec3f(.55,.71,.95)*min(stars,1.),1.);}`;

export type FieldRenderer={canvas:HTMLCanvasElement; draw:(v:Float32Array<ArrayBuffer>)=>void; dispose:()=>void; backend:string};
async function webgpu():Promise<FieldRenderer|null> {
  const adapter=await navigator.gpu?.requestAdapter({powerPreference:'low-power'});
  if(!adapter) return null;
  const device=await adapter.requestDevice(), canvas=document.createElement('canvas');
  try {
    const context=canvas.getContext('webgpu');
    if(!context){device.destroy();return null;}
    const format=navigator.gpu.getPreferredCanvasFormat();
    context.configure({device,format,alphaMode:'opaque'});
    const shader=device.createShaderModule({code:wgShader});
    const pipeline=await device.createRenderPipelineAsync({layout:'auto',vertex:{module:shader,entryPoint:'vert'},fragment:{module:shader,entryPoint:'frag',targets:[{format}]}});
    const uniform=device.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
    const group=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:uniform}}]});
    return {canvas,backend:'webgpu',draw(v){
      device.queue.writeBuffer(uniform,0,v);
      const encoder=device.createCommandEncoder();
      const pass=encoder.beginRenderPass({colorAttachments:[{view:context.getCurrentTexture().createView(),clearValue:{r:0,g:0,b:0,a:1},loadOp:'clear',storeOp:'store'}]});
      pass.setPipeline(pipeline);pass.setBindGroup(0,group);pass.draw(3);pass.end();device.queue.submit([encoder.finish()]);
    },dispose(){context.unconfigure();uniform.destroy();device.destroy();}};
  } catch {device.destroy();return null;}
}
function webgl():FieldRenderer|null {
  const canvas=document.createElement('canvas'),gl=canvas.getContext('webgl2',{alpha:false,antialias:false,powerPreference:'low-power'});
  if(!gl)return null;
  const program=gl.createProgram()!;
  for(const [kind,src] of [[gl.VERTEX_SHADER,glVertex],[gl.FRAGMENT_SHADER,glFragment]] as const){
    const shader=gl.createShader(kind)!;gl.shaderSource(shader,src);gl.compileShader(shader);gl.attachShader(program,shader);gl.deleteShader(shader);
  }
  gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)){gl.deleteProgram(program);return null;}
  gl.useProgram(program);
  const uniform=gl.getUniformLocation(program,'frame');
  return {canvas,backend:'webgl2',draw(v){gl.viewport(0,0,canvas.width,canvas.height);gl.uniform4fv(uniform,v);gl.drawArrays(gl.TRIANGLES,0,3);},
    dispose(){gl.deleteProgram(program);gl.getExtension('WEBGL_lose_context')?.loseContext();}};
}
export async function createField():Promise<FieldRenderer|null> {
  return (await webgpu().catch(()=>null))??webgl();
}
