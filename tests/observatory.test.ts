import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {expect, test} from 'vitest';
import manifest from '../public/observatory/provenance.json';

const path = new URL('../public/observatory/', import.meta.url);
const sha256 = (value: Buffer) => createHash('sha256').update(value).digest('hex');
const totals = [143633, 941];
const expected = [
  '923c22e3893c2173ecbdb657af441119b44c069c27834fc39cea60bda4bbcce8',
  'dd6ac6bc3e81b3ce3716c7384538544d61df5a528216d9c80b28254d4dc90c20',
];

function comoving(redshift: number) {
  const intervals = 128;
  const h = redshift / intervals;
  const integrand = (z: number) => 1 / Math.sqrt(0.3 * (1 + z) ** 3 + 0.7);
  let sum = integrand(0) + integrand(redshift);
  for (let i = 1; i < intervals; i++) sum += (i % 2 ? 4 : 2) * integrand(i * h);
  return 299792.458 / 70 * h * sum / 3;
}

test('bin shards reconstruct each exact supplied catalogue in input order', () => {
  expect(manifest.payload_sha256).toEqual(expected);
  expect(manifest.initial_pitch_deg).toBe(60);
  expect(manifest.initial_yaw_rad).toBe(0.06977550044982518);
  for (const [i, parts] of manifest.parts.entries()) {
    const shards = parts.map(name => readFileSync(new URL(name, path)));
    expect(shards.every(shard => shard.length % 16 === 0)).toBe(true);
    const bytes = Buffer.concat(shards);
    expect(bytes.length / 16).toBe(totals[i]);
    expect(sha256(bytes)).toBe(expected[i]);
    let minimum = Infinity, maximum = -Infinity, maxDeclination = 0, radiusError = 0, allFinite = true;
    for (let j = 0; j < bytes.length; j += 16) {
      const radius = Math.hypot(bytes.readFloatLE(j), bytes.readFloatLE(j + 4), bytes.readFloatLE(j + 8));
      const dec = Math.asin(bytes.readFloatLE(j + 8) / radius);
      const redshift = bytes.readFloatLE(j + 12);
      allFinite &&= [radius, dec, redshift].every(Number.isFinite);
      minimum = Math.min(minimum, redshift);
      maximum = Math.max(maximum, redshift);
      maxDeclination = Math.max(maxDeclination, Math.abs(dec * 180 / Math.PI));
      radiusError = Math.max(radiusError, Math.abs(radius - comoving(redshift)));
    }
    expect(allFinite).toBe(true);
    expect(minimum).toBeGreaterThanOrEqual(0.0999999);
    expect(maximum).toBeLessThanOrEqual(0.4000001);
    expect(maxDeclination).toBeLessThanOrEqual(10.00001);
    expect(radiusError).toBeLessThan(0.001);
  }
  for (const [file, hash] of Object.entries(manifest.poster_sha256)) {
    expect(sha256(readFileSync(new URL(file, path)))).toBe(hash);
  }
});
