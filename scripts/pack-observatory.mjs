// Lossless byte-plane shuffle + gzip. Source files and their scientific hashes remain canonical.
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {gzipSync, gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const root = new URL('../public/observatory/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('provenance.json', root), 'utf8'));
mkdirSync(new URL('packed-v1/', root), {recursive: true});
let original = 0, packed = 0;
for (const [layer, parts] of manifest.parts.entries()) {
  const hash = createHash('sha256');
  for (const part of parts) {
    const raw = readFileSync(new URL(part, root));
    if (raw.length % 16) throw Error('Invalid observation record length');
    hash.update(raw);
    const records = raw.length / 16, shuffled = Buffer.alloc(raw.length);
    for (let byte = 0; byte < 16; byte++) for (let i = 0; i < records; i++) shuffled[byte * records + i] = raw[i * 16 + byte];
    const payload = gzipSync(shuffled, {level: 9});
    const decoded = gunzipSync(payload);
    for (let byte = 0; byte < 16; byte++) for (let i = 0; i < records; i++) if (decoded[byte * records + i] !== raw[i * 16 + byte]) throw Error('Observation packing round-trip failed');
    writeFileSync(new URL('packed-v1/' + part, root), payload);
    original += raw.length; packed += payload.length;
  }
  if (hash.digest('hex') !== manifest.payload_sha256[layer]) throw Error('Canonical observation hash mismatch');
}
console.log(`Observatory packed losslessly: ${original} -> ${packed} bytes (${(100*(1-packed/original)).toFixed(1)}% smaller than raw)`);
