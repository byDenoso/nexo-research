import type {Line} from './schemas.ts';

// Deterministic keyword mapping from a public test question to research lines.
// It is an editorial aid: an approval record can override it, and it never sets a status.
const RULES: ReadonlyArray<[Line, RegExp]> = [
  ['expansion', /dark energy|\bw0\b|\bwa\b|CPL|quintessence|H0|H₀|Hubble|SH0ES|TRGB|Cepheid|expansion|early dark|DESI|DES-SN|Union3|Pantheon|supernova|\bSN\b/i],
  ['models', /model|modified gravity|holograph|scalar|de Sitter|effective theory|Lagrangian|perturbation|coupling|theor/i],
  ['probes', /CMB|cosmic microwave|Planck|\bACT\b|\bSPT\b|BAO|acoustic|growth|\bS8\b|fσ8|lensing|gravitational[- ]wave|\bGW\b|LIGO|redshift-space/i],
  ['galaxies', /JWST|little red dot|\bLRD\b|galax|quasar|\bAGN\b|black hole|exotic|high-redshift|Euclid|eROSITA/i],
  ['local-group', /Local Group|Milky Way|M31|Andromeda|timing argument|Gaia/i],
  ['anomalies', /anomal|outlier|catalog|survey|cross-match|candidate|detection/i],
  ['reproducibility', /reproduc|literature|prior art|novelty|replicat|audit|numerical|convergence|pipeline/i]
];

export function classify(text: string): Line[] {
  const found = RULES.filter(([, pattern]) => pattern.test(text)).map(([name]) => name);
  return found.length ? found : ['reproducibility'];
}
