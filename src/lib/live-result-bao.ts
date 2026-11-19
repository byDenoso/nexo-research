import type {PlanePoint} from './live-result';

// DESI DR2 ALL_GCcomb mean and covariance from the cited CobayaSampler/bao_data release.
// Preserve the independent blocks of the full covariance and its final DH, DM ordering.
const isotropic = {z: 0.295, value: 7.94167639, variance: 5.78998687e-3};
type BaoPair = {
  z: number;
  dm: number;
  dh: number;
  varianceDm: number;
  covariance: number;
  varianceDh: number;
  lrg2?: true;
};
const pairs: readonly BaoPair[] = [
  {z: 0.510, dm: 13.58758434, dh: 21.86294686, varianceDm: 2.83473742e-2, covariance: -3.26062007e-2, varianceDh: 1.83928040e-1},
  {z: 0.706, dm: 17.35069094, dh: 19.45534918, varianceDm: 3.23752442e-2, covariance: -2.37445646e-2, varianceDh: 1.11469198e-1, lrg2: true},
  {z: 0.934, dm: 21.57563956, dh: 17.64149464, varianceDm: 2.61732816e-2, covariance: -1.12938006e-2, varianceDh: 4.04183878e-2},
  {z: 1.321, dm: 27.60085612, dh: 14.17602155, varianceDm: 1.05336516e-1, covariance: -2.90308418e-2, varianceDh: 5.04233092e-2},
  {z: 1.484, dm: 30.51190063, dh: 12.81699964, varianceDm: 5.83020277e-1, covariance: -1.95215562e-1, varianceDh: 2.68336193e-1},
  {z: 2.330, dm: 38.988973961958784, dh: 8.631545674846294, varianceDm: 2.82685779e-1, covariance: -2.31395216e-2, varianceDh: 1.02136194e-2},
];
const LIGHT_SPEED_KM_S = 299792.458;
export const BAO_LEVEL = {68: -2 * Math.log(0.32), 95: -2 * Math.log(0.05)};
const CONTOUR_HALF_SEGMENTS = 24;

function inverseExpansion(z: number, omegaM: number): number {
  return 1 / Math.sqrt(1 + omegaM * ((1 + z) ** 3 - 1));
}

function transverseIntegral(z: number, omegaM: number): number {
  const intervals = 96;
  const step = z / intervals;
  let sum = 1 + inverseExpansion(z, omegaM);
  for (let i = 1; i < intervals; i++) {
    sum += (i % 2 === 0 ? 2 : 4) * inverseExpansion(i * step, omegaM);
  }
  return sum * step / 3;
}

type Profile = PlanePoint & {chiSquared: number; inverseH0Curvature: number};

export function evaluateProfile(omegaM: number, ruler: number, withoutLrg2: boolean): Profile {
  const scale = LIGHT_SPEED_KM_S / ruler;
  const dm = scale * transverseIntegral(isotropic.z, omegaM);
  const dh = scale * inverseExpansion(isotropic.z, omegaM);
  const dv = Math.cbrt(isotropic.z * dm ** 2 * dh);
  let dataData = isotropic.value ** 2 / isotropic.variance;
  let modelData = dv * isotropic.value / isotropic.variance;
  let modelModel = dv ** 2 / isotropic.variance;
  for (const pair of pairs) {
    if (withoutLrg2 && pair.lrg2) continue;
    const modelDm = scale * transverseIntegral(pair.z, omegaM);
    const modelDh = scale * inverseExpansion(pair.z, omegaM);
    const det = pair.varianceDm * pair.varianceDh - pair.covariance ** 2;
    const dmDm = pair.varianceDh / det;
    const dmDh = -pair.covariance / det;
    const dhDh = pair.varianceDm / det;
    const dataDmWeighted = dmDm * pair.dm + dmDh * pair.dh;
    const dataDhWeighted = dmDh * pair.dm + dhDh * pair.dh;
    dataData += pair.dm * dataDmWeighted + pair.dh * dataDhWeighted;
    modelData += modelDm * dataDmWeighted + modelDh * dataDhWeighted;
    modelModel += dmDm * modelDm ** 2 + 2 * dmDh * modelDm * modelDh + dhDh * modelDh ** 2;
  }

  // At fixed Ωₘ and ruler length, distances are linear in 1/H₀.
  // Profile χ² in that variable analytically and retain its quadratic coefficient.
  return {
    omegaM,
    h0: modelModel / modelData,
    chiSquared: dataData - modelData ** 2 / modelModel,
    inverseH0Curvature: modelModel,
  };
}

function minimum(profile: (omegaM: number) => Profile, lower: number, upper: number): Profile {
  for (let i = 0; i < 38; i++) {
    const oneThird = lower + (upper - lower) / 3;
    const twoThirds = upper - (upper - lower) / 3;
    if (profile(oneThird).chiSquared < profile(twoThirds).chiSquared) upper = twoThirds;
    else lower = oneThird;
  }
  return profile((lower + upper) / 2);
}

function contourEdge(profile: (omegaM: number) => Profile, best: Profile, outside: number, level: number): number {
  let inside = best.omegaM;
  for (let i = 0; i < 36; i++) {
    const mid = (inside + outside) / 2;
    if (profile(mid).chiSquared - best.chiSquared > level) outside = mid;
    else inside = mid;
  }
  return inside;
}

export function makeBaoFootprint(ruler: number, withoutLrg2: boolean, level: number): readonly PlanePoint[] {
  const lower = 0.15;
  const upper = 0.5;
  const profile = (omegaM: number) => evaluateProfile(omegaM, ruler, withoutLrg2);
  const best = minimum(profile, lower, upper);
  const left = contourEdge(profile, best, lower, level);
  const right = contourEdge(profile, best, upper, level);
  const lowerSide: PlanePoint[] = [];
  const upperSide: PlanePoint[] = [];
  for (let i = 0; i <= CONTOUR_HALF_SEGMENTS; i++) {
    const fraction = (1 - Math.cos(Math.PI * i / CONTOUR_HALF_SEGMENTS)) / 2;
    const omegaM = left + (right - left) * fraction;
    const row = profile(omegaM);
    const remaining = level - (row.chiSquared - best.chiSquared);
    const delta = Math.sqrt(Math.max(0, remaining) / row.inverseH0Curvature);
    const inverseH0 = 1 / row.h0;
    lowerSide.push({omegaM, h0: 1 / (inverseH0 + delta)});
    if (i > 0 && i < CONTOUR_HALF_SEGMENTS) {
      upperSide.push({omegaM, h0: 1 / (inverseH0 - delta)});
    }
  }
  const first = lowerSide[0];
  return first ? [...lowerSide, ...upperSide.reverse(), first] : [];
}

// Linearized nested GLS estimates share every retained observation. Evaluate
// both Fisher matrices at one common point, including DM–DH covariance.
function fisher(omegaM:number, h0:number, cut:boolean) {
  let mm=0, mh=0, hh=0;
  const scale=LIGHT_SPEED_KM_S/(147.5*h0);
  const gradient=(distance:(m:number)=>number)=>{
    const step=1e-5;
    return [scale*(distance(omegaM+step)-distance(omegaM-step))/(2*step),-scale*distance(omegaM)/h0] as const;
  };
  const accumulate=(a:readonly [number,number],b:readonly [number,number],weight:number)=>{
    mm+=a[0]*b[0]*weight; mh+=a[0]*b[1]*weight; hh+=a[1]*b[1]*weight;
  };
  const dv=gradient(m=>Math.cbrt(isotropic.z*transverseIntegral(isotropic.z,m)**2*inverseExpansion(isotropic.z,m)));
  accumulate(dv,dv,1/isotropic.variance);
  for(const pair of pairs){
    if(cut && pair.lrg2) continue;
    const dm=gradient(m=>transverseIntegral(pair.z,m)), dh=gradient(m=>inverseExpansion(pair.z,m));
    const det=pair.varianceDm*pair.varianceDh-pair.covariance**2;
    accumulate(dm,dm,pair.varianceDh/det); accumulate(dh,dh,pair.varianceDm/det);
    accumulate(dm,dh,-pair.covariance/det); accumulate(dh,dm,-pair.covariance/det);
  }
  const det=mm*hh-mh*mh;
  return {omegaM:hh/det,h0:mm/det};
}
export function pairedLrg2Shift() {
  const best=(cut:boolean)=>minimum(m=>evaluateProfile(m,147.5,cut),.15,.5);
  const full=best(false),cut=best(true);
  const fc=fisher(full.omegaM,full.h0,true), ff=fisher(full.omegaM,full.h0,false);
  return {omegaM:cut.omegaM-full.omegaM,h0:cut.h0-full.h0,sigmaOmegaM:Math.sqrt(fc.omegaM-ff.omegaM),sigmaH0:Math.sqrt(fc.h0-ff.h0)};
}

export function baoMinimum(cut: boolean) {
  return minimum(m => evaluateProfile(m, 147.5, cut), .15, .5);
}

export function baoDelta(profile: ReturnType<typeof evaluateProfile>, h0: number, bestChi2: number) {
  return profile.chiSquared - bestChi2 + profile.inverseH0Curvature * (1 / h0 - 1 / profile.h0) ** 2;
}
