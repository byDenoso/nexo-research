import {baoDelta, baoMinimum, evaluateProfile} from './live-result-bao';

export type SurfacePoint = {omegaM: number; h0: number; delta: number};
export function baoGrid(cut: boolean) {
  const best = baoMinimum(cut);
  const rows = Array.from({length: 41}, (_, i) => {
    const omegaM = .266 + i * .0018;
    const profile = evaluateProfile(omegaM, 147.5, cut);
    return Array.from({length: 51}, (_, j) => {
      const h0 = 65 + j * .15;
      return {omegaM, h0, delta: baoDelta(profile, h0, best.chiSquared)};
    });
  });
  return {best, rows};
}

// Uniform priors over the declared rectangle, fixed r_d, Gaussian DESI likelihood.
// Composite trapezoid in H0 and in Ωm. Keep this integration independent of the display crop.
export function baoMarginal(cut: boolean) {
  const best = baoMinimum(cut);
  const points = Array.from({length: 121}, (_, i) => {
    const omegaM = .18 + .002 * i;
    const row = evaluateProfile(omegaM, 147.5, cut);
    let mass = 0;
    for (let j = 0; j <= 200; j++) {
      const h0 = 55 + .15 * j;
      mass += (j === 0 || j === 200 ? .5 : 1) * Math.exp(-baoDelta(row, h0, best.chiSquared) / 2) * .15;
    }
    return {omegaM, density: mass};
  });
  const norm = points.reduce((sum,p,i) => sum + p.density * (i === 0 || i === points.length-1 ? .001 : .002), 0);
  return points.map(p => ({omegaM: p.omegaM, density: p.density / norm}));
}
