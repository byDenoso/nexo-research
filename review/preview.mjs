// Local review only. The managed preview owns this process and the Next child.
// Production applications and their headers are untouched.
import {createServer, request} from 'node:http';
import {spawn} from 'node:child_process';
import {createReadStream, existsSync, statSync} from 'node:fs';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const here=path.dirname(fileURLToPath(import.meta.url));
const nexo=path.resolve(here,'..');
const cosmos=path.resolve(process.env.COSMOS_REVIEW_ROOT || path.join(nexo,'../cosmos-project/cosmos-do-zero'));
const args=process.argv.slice(2), option=(key,fallback)=>args.includes(key)?args[args.indexOf(key)+1]:fallback;
const port=Number(option('--port','4173')), host=option('--host','127.0.0.1'), upstream=port+1;
if(!existsSync(path.join(nexo,'.next/BUILD_ID')) || !existsSync(path.join(cosmos,'dist/index.html')))throw new Error('Build both projects before starting review.');
const child=spawn(process.execPath,[path.join(nexo,'node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.1','--port',String(upstream)],{cwd:nexo,stdio:'inherit',env:{...process.env,NEXT_TELEMETRY_DISABLED:'1'}});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.woff2':'font/woff2','.mp4':'video/mp4','.vtt':'text/vtt','.txt':'text/plain'};
const server=createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/__review') {res.setHeader('Content-Type','text/html; charset=utf-8');res.end(await readFile(path.join(here,'index.html')));return;}
 const candidate=path.join(nexo,'public',url.pathname);
 const nexoAsset=existsSync(candidate)&&statSync(candidate).isFile();
 if(/^\/(pt|en|_next)(\/|$)/.test(url.pathname)||nexoAsset||['/icon.svg','/opengraph-image'].includes(url.pathname)) {
  const proxy=request({hostname:'127.0.0.1',port:upstream,path:req.url,method:req.method,headers:{...req.headers,host:`127.0.0.1:${upstream}`}},up=>{
   const headers={...up.headers};
   // Same-origin review frames contain only the public site, on this local server.
   if(headers['content-security-policy'])headers['content-security-policy']=headers['content-security-policy'].replace("frame-ancestors 'none'","frame-ancestors 'self'");
   res.writeHead(up.statusCode??502,headers);up.pipe(res);
  });proxy.on('error',()=>{res.writeHead(503);res.end('Preview starting. Reload in a moment.');});req.pipe(proxy);return;
 }
 const root=path.join(cosmos,'dist');let file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
 if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(400);res.end();return;}
 if(existsSync(file)&&statSync(file).isDirectory())file=path.join(file,'index.html');
 if(!existsSync(file)){res.writeHead(404);res.end('Not found');return;}
 const size=statSync(file).size;res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
 const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
 if(range){const start=Number(range[1]),end=range[2]?Math.min(Number(range[2]),size-1):size-1;res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${size}`,'Content-Length':end-start+1,'Accept-Ranges':'bytes'});createReadStream(file,{start,end}).pipe(res);}
 else{res.setHeader('Content-Length',size);createReadStream(file).pipe(res);}
});
server.listen(port,host,()=>console.log(`Review: http://${host}:${port}/__review`));
function stop(){child.kill('SIGTERM');server.close(()=>process.exit());}
process.on('SIGTERM',stop);process.on('SIGINT',stop);child.on('exit',()=>server.close());
