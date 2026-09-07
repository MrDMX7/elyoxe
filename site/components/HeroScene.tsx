"use client";
/* ─────────────────────────────────────────────────────────────────────────────
 * «المجال» / The Field — the hero scene of elyoxe.com
 *
 * A shallow measured surface, seen almost edge-on, drawn only as ink contour
 * lines on paper. It arrives unresolved — wide, soft, low-contrast contours
 * wandering under a slow uncertainty term — and a band of clarity crosses it in
 * the reading direction. Everything the band passes snaps into focus: the pen
 * narrows to a hairline, a fine term fades in, the wander fades out, and where
 * the field has a genuine local maximum the contours close into sharp saffron
 * rings. The sweep is the picture of a computation finishing.
 *
 * HOW IT IS DRAWN (and why it is cheap)
 * ─────────────────────────────────────
 * One mesh, one draw call, one custom ShaderMaterial. The height field is a
 * closed-form sum of directional sines, so both h and ∇h are exact in every
 * stage — contour anti-aliasing uses the analytic gradient and never touches
 * fwidth/OES_standard_derivatives.
 *
 * The camera is bypassed entirely: the vertex stage writes clip space itself,
 * as a hand-built 1D projective map. Row t of the grid lands at a screen height
 * that is *linear* in t, and the surface depth it samples is
 *
 *      vv = t / ((1 + P) · svd),      svd = 1 − (1 − 1/(1+P))·t
 *
 * which is the perspective-correct inverse. Two consequences: every mesh row is
 * evenly spaced on screen (no wasted tessellation crowded at the horizon), and
 * the Jacobian d(pixel)/d(field) is available in closed form at the vertex —
 * so the fragment stage gets a real device-pixel gradient for free.
 *
 * Nothing is re-keyed on resize. Geometry and material are built once; every
 * resize, scroll, pointer move and animation frame writes uniforms only.
 * ────────────────────────────────────────────────────────────────────────── */

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/* ── TUNE ───────────────────────────────────────────────────────────────────
 * Everything the director changes lives here. Nothing below this block needs
 * editing to re-time the sweep, re-weight the pen or re-pitch the plate. */

/* the plate ---------------------------------------------------------------- */
const PERSP_V = 4.2; // depth compression. higher = more edge-on, denser horizon
const SFAR_X = 0.66; // horizontal convergence at the far edge (1.0 = none)
const PLATE_W = 3.4; // plate width in NDC at the near edge (>2 = overscans)
const NEAR_Y = -1.12; // NDC y of the near edge — below the frame, so no cut edge
const FAR_Y = 1.1; // NDC y of the far edge — above the frame, so no horizon line
const ROLL = 0.052; // plate roll. SIGN COMES FROM THE READING DIRECTION
const RELIEF = 0.055; // NDC displacement per unit of field height. keep shallow
const RELIEF_SCROLL = 0.85; // how much of the relief scroll flattens away
const PLATE_LU = 1.0; // plate extent across the reading axis
const PLATE_LV = 3.4; // plate extent along depth — long and shallow

/* the resolve sweep -------------------------------------------------------- */
const SWEEP_DELAY = 0.3; // s of stillness before the band starts
const SWEEP_DUR = 2.95; // s for the band to cross the frame
const BAND_W = 0.34; // width of the resolve ramp, in reading-x units (0..1)
const EDGE_W = 0.085; // width of the leading highlight
const EDGE_GAIN = 1.1; // how much brighter the leading edge burns
const EDGE_LAG = 0.35; // where the highlight sits inside the band (0 = its lip)

/* the pen ------------------------------------------------------------------ */
const INTERVAL = 0.115; // contour interval, in field-height units. ONE value —
//                         resolve never moves a line, it only re-weights it
const W_WIDE = 1.45; // unresolved half-width, device px
const W_FINE = 0.52; // resolved half-width, device px (hairline)
const SOFT_WIDE = 1.9; // unresolved edge softness, device px
const SOFT_FINE = 0.55; // resolved edge softness, device px
const A_WIDE = 0.16; // unresolved ink alpha
const A_FINE = 0.6; // resolved ink alpha
const DENS_LO = 2.2; // device px: contours closer than this are gone
const DENS_HI = 5.6; // device px: contours wider than this are at full weight
const RING_W = 0.8; // ring pen relative to the ink pen (finer)
const FOOT_0 = 0.94; // canvas y where the plate starts fading into paper
const FOOT_1 = 1.0;

/* the local maxima that become rings --------------------------------------- */
const PEAK_G0 = 0.49; // |∇h|² below this is flat enough to be a summit
const PEAK_G1 = 5.8; // |∇h|² above this is not a summit at all
const PEAK_H0 = 0.85; // height above which a flat spot counts as a maximum
const PEAK_H1 = 1.5; //  (excludes minima and saddles, which are also flat)

/* the attention probe ------------------------------------------------------ */
const PROBE_R = 0.3; // radius in canvas heights
const PROBE_ATTACK = 0.3; // s
const PROBE_RELAX = 1.2; // s — the brief's relax time
const RULE_PITCH = 0.3; // cross-rule period, in plate units

/* scroll ------------------------------------------------------------------- */
const TILT_SCROLL = 1.65; // how far scroll pushes PERSP_V toward edge-on
const RES_SCROLL = 0.9; // how much of the resolve scroll takes back
const FADE_SCROLL = 0.72; // how much of the ink scroll takes back

/* the headline mask (desktop only) ----------------------------------------- */
/* the field's amplitude AND its ink go to zero over the reading-start column's
 * lower half, so bare paper sits exactly where the headline is. Measured in
 * canvas fractions with x running from the READING START. */
const MASK_X0 = 0.38; // fully masked at/below this x …
const MASK_X1 = 0.56; // … fully open at/above it (0.47 midpoint: the brief's
//                       0.45, widened just enough to clear a 7/12 copy column)
const MASK_Y0 = 0.28; // fully open at/above this y …
const MASK_Y1 = 0.44; // … fully masked at/below it (the brief's 0.35, softened)

/* the field ---------------------------------------------------------------- */
/* Six directional sines. 0–3 are the body of the field, 4 is the fine term
 * that fades IN with resolve, 5 is the low-frequency uncertainty that fades
 * OUT — so the resolved field is a different function, not a sharpened one.
 * Angles are deliberately asymmetric about the vertical so that mirroring the
 * reading axis produces a genuinely different set (see buildK). Temporal rates
 * are non-commensurate, so the phase state never returns. */
const F_ANG = [11, 43, 76, 116, 154, 172]; // degrees, in the anisotropy frame
const F_MAG = [5.2, 8.9, 13.7, 21.3, 34.0, 3.1]; // rad per plate unit
const F_AMP = [1.0, 0.58, 0.34, 0.2, 0.26, 0.62];
const F_SPD = [0.073, 0.0517, 0.1131, 0.0891, 0.1447, 0.0389]; // rad/s
const F_PHI = [0.31, 2.17, 4.02, 5.51, 1.13, 3.44];
const ANI_R = 1.7; // compressed along the reading axis
const ANI_N = 0.55; // stretched across it
const READ_TILT = 0.22; // the reading axis is tipped off horizontal by this much,
//                         which is what makes RTL a different field, not a flip

const FREQ_REF = 820; // CSS px of canvas height the field is tuned against
const FREQ_MIN = 0.42;
const FREQ_MAX = 1.25;
const SEED_STILL = 41.7; // the frozen phase state of the reduced-motion plate

/* mesh --------------------------------------------------------------------- */
const SEG_U = 256;
const SEG_V = 128;
const SEG_U_SMALL = 128;
const SEG_V_SMALL = 64;
const DPR: [number, number] = [1, 1.5]; // desktop; phones are pinned to 1

/* ── end TUNE ───────────────────────────────────────────────────────────── */

const DEG = Math.PI / 180;
const TAU = Math.PI * 2;

const INK = new THREE.Color().setStyle("#141A17", THREE.LinearSRGBColorSpace);
const ACCENT = new THREE.Color().setStyle("#8F5400", THREE.LinearSRGBColorSpace);

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const sstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/* ── the field's wave vectors ────────────────────────────────────────────────
 * RTL is re-derived here, not mirrored. The reading unit vector r is tipped by
 * READ_TILT, so for LTR it points at +12.4° and for RTL at 167.6°. The
 * anisotropy frame (r, n) is built from it, the six base directions are then
 * resolved into plate space through that frame, and the asymmetric F_ANG set
 * means the RTL wave vectors are not the mirror images of the LTR ones — the
 * measured relative difference between the RTL field and a mirrored LTR field
 * is ~1.0, i.e. they are effectively decorrelated. Same instrument, different
 * measurement. */
function buildK(sign: number, freq: number, out: THREE.Vector2[], ruleA: THREE.Vector2, ruleB: THREE.Vector2) {
  const rl = Math.hypot(1, READ_TILT);
  const rx = sign / rl;
  const ry = READ_TILT / rl;
  const nx = -ry;
  const ny = rx;
  for (let i = 0; i < 6; i++) {
    const th = F_ANG[i] * DEG;
    const m = F_MAG[i] * freq;
    const kx = m * Math.cos(th);
    const ky = m * Math.sin(th);
    // anisotropy: compressed along r, stretched across n, then into plate space
    const px = ANI_R * kx * rx + ANI_N * ky * nx;
    const pz = ANI_R * kx * ry + ANI_N * ky * ny;
    // …and finally into the mesh's own (u0−0.5, vv) parameters, so the shader's
    // gradient comes out directly in the units the Jacobian expects.
    out[i].set(px * PLATE_LU, pz * PLATE_LV);
  }
  const p = freq / RULE_PITCH;
  ruleA.set(PLATE_LU * rx * p, PLATE_LV * ry * p);
  ruleB.set(PLATE_LU * nx * p, PLATE_LV * ny * p);
}

/* ── shaders ─────────────────────────────────────────────────────────────── */

const VERT = /* glsl */ `
uniform vec2  uK[6];
uniform float uAmp[6];
uniform float uPhase[6];
uniform vec2  uPersp;    // x: depth compression P   y: horizontal far scale
uniform vec2  uPlate;    // x: NDC width at the near edge   y: NDC screen span
uniform vec2  uOrigin;   // NDC position of the near edge
uniform float uRoll;
uniform vec2  uHalfPx;   // device pixels / 2
uniform float uRelief;
uniform float uReadX;    // +1 ltr, -1 rtl
uniform vec4  uMask;     // x0, x1, y0, y1
uniform float uMaskOn;
uniform vec2  uSweep;    // x: band position (reading-x)   y: band width
uniform float uResGain;

varying vec2 vFP;   // field parameters (u0 - 0.5, vv)
varying vec4 vJ;    // d(device px)/d(field parameters), columns packed
varying vec2 vScr;  // canvas fractions: x from the READING START, y from the top
varying vec2 vMR;   // x: headline mask   y: resolve

void main() {
  float t  = uv.y;   // 0 = the near edge (bottom of frame), 1 = the far edge
  float u0 = uv.x;

  float sx  = 1.0 - (1.0 - uPersp.y) * t;                     // width convergence
  float svd = 1.0 - (1.0 - 1.0 / (1.0 + uPersp.x)) * t;       // depth scale
  float vv  = t / ((1.0 + uPersp.x) * svd);                   // surface depth

  vFP = vec2(u0 - 0.5, vv);

  float qx = uPlate.x * (u0 - 0.5) * sx;
  vec2  p0 = vec2(uOrigin.x + qx, uOrigin.y + uPlate.y * t + uRoll * qx);

  vScr = vec2(p0.x * uReadX * 0.5 + 0.5, 0.5 - p0.y * 0.5);

  // headline clearance by construction: computed from the UNDISPLACED position
  // and handed to the fragment stage, so relief and ink use the same number.
  float inX = 1.0 - smoothstep(uMask.x, uMask.y, vScr.x);
  float inY = smoothstep(uMask.z, uMask.w, vScr.y);
  float m   = 1.0 - uMaskOn * inX * inY;

  // the band of clarity, running in the reading direction
  float r = clamp((uSweep.x - vScr.x) / uSweep.y, 0.0, 1.0);
  r = r * r * (3.0 - 2.0 * r) * uResGain;
  vMR = vec2(m, r);

  float h = 0.0;
  for (int i = 0; i < CORE; i++) h += uAmp[i] * sin(dot(uK[i], vFP) + uPhase[i]);
  h += uAmp[4] * r * sin(dot(uK[4], vFP) + uPhase[4]);            // fine, fades in
  h += uAmp[5] * (1.0 - r) * sin(dot(uK[5], vFP) + uPhase[5]);    // wander, out

  // analytic Jacobian of (u0, vv) -> device pixels. The relief term perturbs it
  // by ~10% at mid frame and is deliberately ignored: the surface is shallow.
  float dsx = -(1.0 - uPersp.y);
  float dtv = (1.0 + uPersp.x) * svd * svd;                       // dt/dvv
  vec2  du  = vec2(uPlate.x * sx, uRoll * uPlate.x * sx);
  vec2  dtt = vec2(uPlate.x * (u0 - 0.5) * dsx,
                   uPlate.y + uRoll * uPlate.x * (u0 - 0.5) * dsx);
  vJ = vec4(du * uHalfPx, dtt * dtv * uHalfPx);

  gl_Position = vec4(p0.x, p0.y + h * uRelief * svd * m, 0.0, 1.0);
}
`;

const FRAG = /* glsl */ `
uniform vec2  uK[6];
uniform float uAmp[6];
uniform float uPhase[6];
uniform vec3  uInk;
uniform vec3  uAccent;
uniform float uInterval;
uniform vec2  uPen;      // wide, fine half-widths in device px
uniform vec2  uSoft;
uniform vec2  uAlpha;
uniform vec2  uDens;
uniform vec4  uPeak;     // g0², g1², h0, h1
uniform vec3  uEdge;     // position, width, gain
uniform vec2  uProbe;    // position in the vScr frame
uniform vec3  uProbeK;   // aspect/R, 1/R, amount
uniform vec2  uRuleA;
uniform vec2  uRuleB;
uniform vec2  uFoot;
uniform float uGlobal;
uniform float uRing;

varying vec2 vFP;
varying vec4 vJ;
varying vec2 vScr;
varying vec2 vMR;

void main() {
  float m = vMR.x;
  // the headline's column: bare paper, and roughly a fifth of the pixels saved
  if (m < 0.004 || uGlobal < 0.004) { gl_FragColor = vec4(0.0); return; }
  float res = vMR.y;

  float h = 0.0;
  vec2  g = vec2(0.0);
  for (int i = 0; i < CORE; i++) {
    float a = dot(uK[i], vFP) + uPhase[i];
    h += uAmp[i] * sin(a);
    g += (uAmp[i] * cos(a)) * uK[i];
  }
  if (res > 0.004) {                      // the fine term arrives with the band
    float a = dot(uK[4], vFP) + uPhase[4];
    float w = uAmp[4] * res;
    h += w * sin(a);
    g += (w * cos(a)) * uK[4];
  }
  if (res < 0.995) {                      // the uncertainty leaves with it
    float a = dot(uK[5], vFP) + uPhase[5];
    float w = uAmp[5] * (1.0 - res);
    h += w * sin(a);
    g += (w * cos(a)) * uK[5];
  }

  // gradient in device pixels: J^-T · ∇h, no derivatives extension in sight.
  // Only the LENGTH of the result is ever used, so dropping det's sign is free.
  float dta = max(abs(vJ.x * vJ.w - vJ.z * vJ.y), 1e-5);
  vec2  gp  = vec2(vJ.w * g.x - vJ.y * g.y, vJ.x * g.y - vJ.z * g.x) / dta;
  float spacing = uInterval * inversesqrt(max(dot(gp, gp), 1e-12));  // px/level

  float hn  = h / uInterval;
  float pxd = abs(fract(hn) - 0.5) * spacing;

  // a genuine local maximum: the gradient vanishes and the height is high.
  // The rings are the field's own contours there, not drawn objects.
  float pk = 0.0;
  if (res > 0.5 && h > uPeak.z) {
    pk  = 1.0 - smoothstep(uPeak.x, uPeak.y, dot(g, g));
    pk *= smoothstep(uPeak.z, uPeak.w, h) * smoothstep(0.55, 1.0, res);
  }

  float probe = 0.0;
  if (uProbeK.z > 0.004) {
    vec2 d = (vScr - uProbe) * uProbeK.xy;
    probe = uProbeK.z * (1.0 - smoothstep(0.30, 1.0, length(d)));
  }
  pk = min(pk * (1.0 + 0.85 * probe), 1.0);

  float w  = mix(uPen.x, uPen.y, res) * mix(1.0, uRing, pk);
  float sf = mix(uSoft.x, uSoft.y, res);
  float a  = mix(uAlpha.x, uAlpha.y, res) * smoothstep(uDens.x, uDens.y, spacing);

  float line = 1.0 - smoothstep(w - sf, w + sf, pxd);

  if (probe > 0.004) {
    // the interval halves: an interleaved set fades in BETWEEN the standing
    // lines, so nothing already drawn ever moves.
    float pxd2 = abs(fract(hn + 0.5) - 0.5) * spacing;
    line = max(line, (1.0 - smoothstep(w - sf, w + sf, pxd2)) * probe);

    // a fine cross-rule on the field's own axes, foreshortened by the same J
    vec2 ra = vec2(vJ.w * uRuleA.x - vJ.y * uRuleA.y, vJ.x * uRuleA.y - vJ.z * uRuleA.x);
    vec2 rb = vec2(vJ.w * uRuleB.x - vJ.y * uRuleB.y, vJ.x * uRuleB.y - vJ.z * uRuleB.x);
    float da = abs(fract(dot(uRuleA, vFP)) - 0.5) * dta * inversesqrt(max(dot(ra, ra), 1e-12));
    float db = abs(fract(dot(uRuleB, vFP)) - 0.5) * dta * inversesqrt(max(dot(rb, rb), 1e-12));
    float rl = max(1.0 - smoothstep(0.25, 1.0, da), 1.0 - smoothstep(0.25, 1.0, db));
    line = max(line, rl * probe * 0.40 * res);
  }

  // the leading edge of the band burns a little brighter as it passes.
  // uEdge.z is driven to 0 the moment the sweep lands, so this costs nothing
  // for the whole life of the page afterwards.
  if (uEdge.z > 0.004) {
    float e = max(0.0, 1.0 - abs(vScr.x - uEdge.x) / uEdge.y);
    a *= 1.0 + uEdge.z * e * e;
  }

  vec3 col = uInk;
  if (pk > 0.004) col = mix(uInk, uAccent, pk * 0.92);
  float alpha = clamp(line * a, 0.0, 1.0) * m * uGlobal
              * (1.0 - smoothstep(uFoot.x, uFoot.y, vScr.y));
  gl_FragColor = vec4(col * alpha, alpha);   // premultiplied, over the paper
}
`;

/* ── the field ───────────────────────────────────────────────────────────── */

function Field({ dir, small, reduced }: { dir: "rtl" | "ltr"; small: boolean; reduced: boolean }) {
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const sign = dir === "rtl" ? -1 : 1;

  /* built once. A resize never re-keys either of these. */
  const geo = useMemo(
    // PlaneGeometry emits rows from uv.y = 1 downward and indexes them in that
    // order, so the FAR rows are drawn first — painter's order without a depth
    // buffer. (The `normal` attribute is unused but kept: three's ShaderMaterial
    // prefix declares it unconditionally, and a missing attribute is the kind of
    // thing that goes quietly wrong on one mobile driver and blanks the hero.)
    () => new THREE.PlaneGeometry(1, 1, small ? SEG_U_SMALL : SEG_U, small ? SEG_V_SMALL : SEG_V),
    [small],
  );

  const uni = useMemo(
    () => ({
      uK: { value: Array.from({ length: 6 }, () => new THREE.Vector2()) },
      uAmp: { value: new Float32Array(F_AMP) },
      uPhase: { value: new Float32Array(6) },
      uPersp: { value: new THREE.Vector2(PERSP_V, SFAR_X) },
      uPlate: { value: new THREE.Vector2(PLATE_W, FAR_Y - NEAR_Y) },
      uOrigin: { value: new THREE.Vector2(0, NEAR_Y) },
      uRoll: { value: ROLL * sign },
      uHalfPx: { value: new THREE.Vector2(1, 1) },
      uRelief: { value: RELIEF },
      uReadX: { value: sign },
      uMask: { value: new THREE.Vector4(MASK_X0, MASK_X1, MASK_Y0, MASK_Y1) },
      uMaskOn: { value: small ? 0 : 1 },
      uSweep: { value: new THREE.Vector2(-BAND_W, BAND_W) },
      uResGain: { value: 1 },
      uInk: { value: INK },
      uAccent: { value: ACCENT },
      uInterval: { value: INTERVAL },
      uPen: { value: new THREE.Vector2(W_WIDE, W_FINE) },
      uSoft: { value: new THREE.Vector2(SOFT_WIDE, SOFT_FINE) },
      uAlpha: { value: new THREE.Vector2(A_WIDE, A_FINE) },
      uDens: { value: new THREE.Vector2(DENS_LO, DENS_HI) },
      uPeak: { value: new THREE.Vector4(PEAK_G0, PEAK_G1, PEAK_H0, PEAK_H1) },
      uEdge: { value: new THREE.Vector3(-BAND_W, EDGE_W, 0) },
      uProbe: { value: new THREE.Vector2(0.5, 0.5) },
      uProbeK: { value: new THREE.Vector3(1 / PROBE_R, 1 / PROBE_R, 0) },
      uRuleA: { value: new THREE.Vector2() },
      uRuleB: { value: new THREE.Vector2() },
      uFoot: { value: new THREE.Vector2(FOOT_0, FOOT_1) },
      uGlobal: { value: 1 },
      uRing: { value: RING_W },
    }),
    [sign, small],
  );

  const mat = useMemo(() => {
    // reduced motion: the still plate is fully resolved before the first frame
    if (reduced) {
      uni.uSweep.value.set(1 + BAND_W, BAND_W);
      uni.uEdge.value.set(2, EDGE_W, 0);
      for (let i = 0; i < 6; i++) uni.uPhase.value[i] = (F_PHI[i] + F_SPD[i] * SEED_STILL) % TAU;
    }
    return new THREE.ShaderMaterial({
      uniforms: uni as unknown as { [k: string]: THREE.IUniform },
      vertexShader: VERT,
      fragmentShader: FRAG,
      // core terms; the fine and wander terms are always present on top,
      // so the field is 4+2 = 6 sines on desktop and 2+2 = 4 on phones.
      defines: { CORE: small ? 2 : 4 },
      transparent: true,
      premultipliedAlpha: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.NormalBlending,
      toneMapped: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uni, small, reduced]);

  useEffect(() => () => { geo.dispose(); mat.dispose(); }, [geo, mat]);

  /* ── layout: resize writes uniforms, never geometry ───────────────────── */
  const box = useRef({ top: 0, left: 0, w: 1, h: 1, hero: 1 });
  useEffect(() => {
    const el = gl.domElement;
    const r = el.getBoundingClientRect();
    const hero = el.closest(".hero") as HTMLElement | null;
    box.current = {
      top: r.top + window.scrollY,
      left: r.left,
      w: r.width || 1,
      h: r.height || 1,
      hero: (hero ? hero.offsetHeight : window.innerHeight) || 1,
    };
    // R3F can report a zero size before useMeasure lands. Painting then would
    // divide by a degenerate Jacobian; skip it and wait for the real size.
    if (size.width < 2 || size.height < 2) return;
    // the field's own scale follows the canvas, so contour spacing stays
    // roughly constant in CSS pixels from a 48svh phone band to a 27" desktop
    const freq = Math.min(Math.max(size.height / FREQ_REF, FREQ_MIN), FREQ_MAX);
    buildK(sign, freq, uni.uK.value, uni.uRuleA.value, uni.uRuleB.value);
    uni.uHalfPx.value.set((size.width * dpr) / 2, (size.height * dpr) / 2);
    uni.uMaskOn.value = window.matchMedia("(max-width: 1023px)").matches ? 0 : 1;
    uni.uProbeK.value.x = (size.width / Math.max(size.height, 1)) / PROBE_R;
    uni.uProbeK.value.y = 1 / PROBE_R;
    if (!reduced) return;
    // reduced motion draws one still frame, so it needs explicit kicks: now, on
    // the next paint, and once more after fonts and layout have settled.
    invalidate();
    const raf = requestAnimationFrame(() => invalidate());
    const late = window.setTimeout(() => invalidate(), 260);
    return () => { cancelAnimationFrame(raf); window.clearTimeout(late); };
  }, [gl, size, dpr, sign, uni, reduced, invalidate]);

  /* The hero grows when the Arabic display face swaps in, and on desktop that
   * reflow does not change the canvas size — so the scroll term would keep
   * dividing by the pre-font height. Re-read it once fonts settle. */
  useEffect(() => {
    let alive = true;
    const reread = () => {
      const hero = gl.domElement.closest(".hero") as HTMLElement | null;
      if (alive && hero) box.current.hero = hero.offsetHeight || box.current.hero;
    };
    document.fonts?.ready.then(reread).catch(() => {});
    return () => { alive = false; };
  }, [gl]);

  /* ── the attention probe: window pointer, fine pointers only ──────────── */
  const probe = useRef({ x: 0.5, y: 0.5, want: 0, amt: 0 });
  useEffect(() => {
    if (reduced) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const onMove = (e: PointerEvent) => {
      const b = box.current;
      const top = b.top - window.scrollY; // the cached rect, re-based each move
      const x = (e.clientX - b.left) / b.w;
      const y = (e.clientY - top) / b.h;
      const inside = x > -0.12 && x < 1.12 && y > -0.12 && y < 1.12;
      if (inside) {
        probe.current.x = sign > 0 ? clamp01(x) : 1 - clamp01(x);
        probe.current.y = clamp01(y);
      }
      probe.current.want = inside ? 1 : 0;
    };
    const onLeave = () => { probe.current.want = 0; };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave, { passive: true });
    window.addEventListener("blur", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
    };
  }, [reduced, sign]);

  /* ── the frame ────────────────────────────────────────────────────────── */
  const clock = useRef({ t: 0, sweep: 0 });
  useFrame((_, delta) => {
    if (reduced) return; // one still frame; useFrame runs only on invalidate()
    const dt = delta > 0.05 ? 0.05 : delta;
    const c = clock.current;
    c.t += dt;
    c.sweep += dt;

    // phases advance on the CPU, wrapped, so sin() never sees a large argument
    for (let i = 0; i < 6; i++) uni.uPhase.value[i] = (F_PHI[i] + F_SPD[i] * c.t) % TAU;

    // the sweep
    const p = clamp01((c.sweep - SWEEP_DELAY) / SWEEP_DUR);
    const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(2 - 2 * p, 3) / 2;
    const pos = -BAND_W + e * (1 + 2 * BAND_W);
    uni.uSweep.value.set(pos, BAND_W);
    uni.uEdge.value.set(pos - BAND_W * EDGE_LAG, EDGE_W, EDGE_GAIN * (1 - sstep(0.82, 1, p)));

    // scroll: read position, tilt toward edge-on, drop resolution, close
    const sc = clamp01(window.scrollY / box.current.hero);
    uni.uPersp.value.x = PERSP_V * (1 + TILT_SCROLL * sc);
    uni.uResGain.value = 1 - RES_SCROLL * sc;
    uni.uRelief.value = RELIEF * (1 - RELIEF_SCROLL * sc);
    uni.uGlobal.value = 1 - FADE_SCROLL * sc;

    // the probe eases in fast and relaxes over PROBE_RELAX
    const pr = probe.current;
    const tau = pr.want > pr.amt ? PROBE_ATTACK : PROBE_RELAX;
    pr.amt += (pr.want - pr.amt) * (1 - Math.exp(-dt / tau));
    uni.uProbe.value.set(pr.x, pr.y);
    uni.uProbeK.value.z = pr.amt < 0.002 ? 0 : pr.amt;
  });

  return <mesh geometry={geo} material={mat} frustumCulled={false} />;
}

/* ── mount ───────────────────────────────────────────────────────────────── */

export default function HeroScene({ dir }: { dir: "rtl" | "ltr" }) {
  const [reduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [small] = useState(() => window.matchMedia("(max-width: 1023px)").matches);
  const [onScreen, setOnScreen] = useState(true);
  const host = useRef<HTMLDivElement>(null);

  // off-screen heroes cost nothing: the loop stops entirely
  useEffect(() => {
    const el = host.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((es) => setOnScreen(es[0].isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="hs-root" ref={host}>
      <Canvas
        dpr={small ? 1 : DPR}
        gl={{
          antialias: false,
          depth: false,
          stencil: false,
          alpha: true,
          premultipliedAlpha: true,
          powerPreference: "low-power",
        }}
        frameloop={reduced ? "demand" : onScreen ? "always" : "never"}
        flat
      >
        <Field dir={dir} small={small} reduced={reduced} />
      </Canvas>
    </div>
  );
}
