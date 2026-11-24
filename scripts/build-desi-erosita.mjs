// Exact data from the supplied integration package, no network or catalogue substitution.
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {inflateRawSync} from 'node:zlib';
import sharp from 'sharp';
const root=new URL('../public/data/desi-erosita/',import.meta.url);
const read=name=>readFileSync(new URL(name,root));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const meta=JSON.parse(read('provenance.json').toString('utf8'));
for(const [i,name,n] of [[0,'galaxies.bin',143633],[1,'clusters.bin',941]]){
  const data=read(name);
  if(data.length!==16*n||sha(data)!==meta.payload_sha256[i])throw Error('NEXO survey payload integrity: '+name);
  for(let j=0;j<data.length;j+=16){
    const z=data.readFloatLE(j+12);
    if(!Number.isFinite(data.readFloatLE(j)+data.readFloatLE(j+4)+data.readFloatLE(j+8)+z)||z<.1-1e-7||z>.4+1e-7)throw Error('Invalid coordinate');
  }
}
const poster=inflateRawSync(read('poster.webp.deflate'));
if(sha(poster)!=='aaba12998089824e9adaa7bd2544d99c595ebaebff9af44366f682ba3829d75d')throw Error('NEXO supplied poster integrity');
writeFileSync(new URL('poster.webp',root),poster);
for(const width of [480,640,1280]){
  const small=await sharp(poster).resize({width}).webp({quality:width===480?65:76}).toBuffer();
  writeFileSync(new URL('poster-'+width+'.webp',root),small);
  console.log('DESI × eROSITA poster',width,small.length,'bytes');
}
console.log('DESI × eROSITA: 144574 exact points and original poster verified');
