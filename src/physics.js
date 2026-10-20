export const KERN = 1 / 6;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export function sdof(d, e) {
  if (d >= .5) return 0;
  if (d <= KERN) return d === 0 ? (e === 0 ? 1 : 0) : 1 - e / d;
  return 13.5 * (d - e) * (1 - 2 * d) ** 2;
}
export function crushing(d, beta) {
  return d <= KERN ? beta / (1 + 6 * d) : .75 * beta * (1 - 2 * d);
}
export function failure(e, beta) {
  if (e === 0 && beta <= 1) return { d: 0, p: beta, mode: 'Uncracked crushing' };
  if (e === 0 && beta > 1) return { d: 0, p: 1, mode: 'Buckling' };
  const peak = (1 + 4 * e) / 6;
  if (beta >= 2 * (1 - 2 * e) ** 2) return { d: peak, p: (1 - 2 * e) ** 3, mode: 'Buckling' };
  let lo = e, hi = peak;
  for (let i = 0; i < 65; i++) {
    const m = (lo + hi) / 2;
    if (sdof(m, e) < crushing(m, beta)) lo = m; else hi = m;
  }
  const d = (lo + hi) / 2;
  return { d, p: sdof(d, e), mode: d <= KERN ? 'Uncracked crushing' : 'Cracked crushing' };
}
export function yokel(k) {
  if (k <= 0 || k >= 1) return 0;
  return 4 / Math.PI ** 2 * k * (Math.sqrt(1 - k) + k * Math.asinh(Math.sqrt((1 - k) / k))) ** 2;
}
// Dimensionless distance q = alpha*x from the symmetry section to a cracked section w = v/t.
export function crackedDistance(d, w) {
  const u = .5 - d, y = Math.max(0, d - w);
  return Math.sqrt(27 * u) * (Math.sqrt(y * (u + y)) + u * Math.asinh(Math.sqrt(y / u)));
}
export function alphaLength(d, e) {
  if (d >= .5) return 0;
  if (d <= KERN) return d === 0 ? Math.PI / 2 : Math.acos(clamp(e / d, 0, 1));
  if (e >= KERN) return crackedDistance(d, e);
  const r = Math.sqrt((1 - 2 * d) / (6 * d - 1 / 3));
  return crackedDistance(d, KERN) + Math.asin(clamp(r, 0, 1)) - Math.asin(clamp(6 * e * r, 0, 1));
}
export const column = (d, e) => (2 * alphaLength(d, e) / Math.PI) ** 2;
export function maximum(fn, lo, hi = .5 - 1e-9) {
  // Unimodal equilibrium branches; golden-section maximization.
  for (let i = 0; i < 90; i++) {
    const a = hi - (hi - lo) / 1.61803398875, b = lo + (hi - lo) / 1.61803398875;
    if (fn(a) < fn(b)) lo = a; else hi = b;
  }
  const d = (lo + hi) / 2;
  return { d, p: fn(d) };
}
export function profile(d, e, fraction) {
  const q = alphaLength(d, e) * fraction;
  if (d <= KERN) return d * Math.cos(q);
  const qh = e >= KERN ? Infinity : crackedDistance(d, KERN);
  if (q > qh) {
    const slope = -Math.sqrt((1 / (.5 - d) - 3) / 27);
    return KERN * Math.cos(q - qh) + slope * Math.sin(q - qh);
  }
  let lo = e >= KERN ? e : KERN, hi = d;
  for (let i = 0; i < 50; i++) {
    const m = (lo + hi) / 2;
    if (crackedDistance(d, m) > q) lo = m; else hi = m;
  }
  return (lo + hi) / 2;
}
export function dimensional({ E, t, b, H, a }) {
  // E in MPa, all dimensions in mm; forces returned in kN.
  const J = b * t ** 3 / 12;
  return { sdofEuler: E * J / (a * H) / 1000, columnEuler: Math.PI ** 2 * E * J / H ** 2 / 1000 };
}
export const wytheRatio = n => 1 / n ** 2;
