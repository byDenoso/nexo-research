export const LIGHT_KM_S = 299792.458;
const MPC_KM = 3.085677581491367e19;
const GYR_S = 365.25 * 86400 * 1e9;
export type Cosmology = {omegaM: number; h0: number; w0: number; wa: number};
export const referenceModel: Cosmology = {omegaM: .3, h0: 70, w0: -1, wa: 0};

// Flat matter + CPL dark energy. Radiation is neglected over the displayed late-time interval.
export function hubble(z: number, model: Cosmology) {
  const {omegaM, h0, w0, wa} = model;
  const dark = (1 + z) ** (3 * (1 + w0 + wa)) * Math.exp(-3 * wa * z / (1 + z));
  return h0 * Math.sqrt(omegaM * (1 + z) ** 3 + (1 - omegaM) * dark);
}

function integrate(z: number, integrand: (at: number) => number) {
  const steps = 64, step = z / steps;
  let sum = integrand(0) + integrand(z);
  for (let i = 1; i < steps; i++) sum += (i % 2 ? 4 : 2) * integrand(i * step);
  return sum * step / 3;
}

export function comovingDistance(z: number, model = referenceModel) {
  return LIGHT_KM_S * integrate(z, at => 1 / hubble(at, model));
}

export function expansionPoint(z: number, model: Cosmology) {
  const distance = comovingDistance(z, model);
  const lookback = MPC_KM / GYR_S * integrate(z, at => 1 / ((1 + at) * hubble(at, model)));
  return {z, h: hubble(z, model), distance, lookback, a: 1 / (1 + z)};
}

// Closed-form age for the reference flat matter + Λ model, in Gyr.
const ageScale = 2 * MPC_KM / (3 * GYR_S * referenceModel.h0 * Math.sqrt(1 - referenceModel.omegaM));
const ageRatio = Math.sqrt((1 - referenceModel.omegaM) / referenceModel.omegaM);
export const ageAtScale = (a: number) => ageScale * Math.asinh(ageRatio * a ** 1.5);
export const scaleAtAge = (gyr: number) => (Math.sinh(gyr / ageScale) / ageRatio) ** (2 / 3);

export type SkyObject = {cid: string; ra: number; dec: number; z: number; distance: number; xyz: [number,number,number]};
export function skyPositions(csv: string): SkyObject[] {
  return csv.trim().split(/\r?\n/).slice(1).map(line => {
    const [cid, ra, dec, z] = line.split(',');
    const lon = Number(ra) * Math.PI / 180, lat = Number(dec) * Math.PI / 180;
    const distance = comovingDistance(Number(z));
    return {cid: cid!, ra: Number(ra), dec: Number(dec), z: Number(z), distance,
      xyz: [distance * Math.cos(lat) * Math.cos(lon), distance * Math.sin(lat), distance * Math.cos(lat) * Math.sin(lon)]};
  });
}
