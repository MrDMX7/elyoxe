"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { nodes, edges } from "@/content/systems";
import { heroBus } from "@/lib/heroBus";

/* ════════════════════════════════════════════════════════════════════════════
   THE SYSTEMS FIELD — the hero's single signature moment.

   What it draws, and why it is three draw calls and not thirty:

   1. THE SHEET (1 quad, 4 verts). A screen-space blueprint lattice in paper
      tones. It never moves with the camera; it is offset by its own, smaller
      parallax so it reads as "far". Alpha peaks at ~5%, breathes on a slow
      value-noise, and is faded out over the bottom of the frame so it hands the
      page over to the headline instead of competing with it.

   2. THE WIRES (1 indexed mesh, 440 verts / 1188 indices). Every edge is a
      quadratic Bézier sampled at 10 stations and expanded into a ribbon in the
      VERTEX shader, along the screen-space normal, to an exact CSS-pixel width.
      That buys three things a THREE.Line cannot: a constant hair-line weight at
      any depth, analytic antialiasing without MSAA, and a bow + z-arc so the
      graph reads as lines in space rather than a flat diagram. Packets of light
      travel along them in the page's reading direction, and a ripple runs out
      along a node's edges when the pointer finds it.

   3. THE ANCHORS (1 points draw, 16 verts). Point sprites, drawn as an
      instrument mark rather than a dot: a dense core, a punched paper gap that
      occludes the wires passing underneath, a thin outline ring, and a soft
      halo. Live anchors emit a slow verdigris pulse ring — the same gesture as
      the ledger's live dot in CSS.

   Everything per-frame is a write into a pre-allocated Float32Array or a
   uniform. Nothing is allocated inside useFrame, and no geometry, material or
   attribute buffer is ever rebuilt after mount (mobile browsers fire `resize`
   when the URL bar collapses — i.e. while scrolling — so a size-keyed useMemo
   would rebuild the whole scene mid-scroll).

   COLOUR. three's ColorManagement is on by default, so `new Color("#8F5400")`
   would hand the shader LINEAR values while a raw ShaderMaterial writes straight
   into an sRGB framebuffer with no colorspace_fragment include — every token
   would land far darker and more saturated than designed, which on paper is
   exactly the mud the palette forbids. So every colour here is parsed with
   LinearSRGBColorSpace, i.e. the raw sRGB fractions are kept verbatim.

   BLENDING. three's default premultipliedAlpha:true means the blend func is
   (ONE, ONE_MINUS_SRC_ALPHA). Every fragment therefore outputs
   vec4(colour * alpha, alpha) — premultiplied — so the marks composite exactly
   over the paper page instead of washing out.

   DERIVATIVES. No fwidth() anywhere: in the sheet a pixel is exactly 1/dpr of
   the px-space coordinate, and inside a point sprite it is exactly
   1/gl_PointSize of gl_PointCoord. Analytic, cheaper, and it sidesteps the
   ESSL1-on-WebGL2 derivatives extension question entirely.
   ════════════════════════════════════════════════════════════════════════════ */

const CAM_Z = 12;
const FOV = 38;
const STATIONS = 10;              // Bézier samples per edge
const SEGS = STATIONS - 1;
const N = nodes.length;           // 16 — five anchors, eleven infra
const E = edges.length;           // 22

/* Raw sRGB fractions — see the COLOUR note above. */
const sRGB = (hex: string) => new THREE.Color().setStyle(hex, THREE.LinearSRGBColorSpace);
const C_PAPER = sRGB("#F4F2ED");
const C_INK = sRGB("#141A17");
const C_STONE = sRGB("#5F5E57");
const C_SAFFRON = sRGB("#8F5400");
const C_VERDIGRIS = sRGB("#1B6F5A");
const C_RULE = sRGB("#8C887C");    // the sheet's hairline, between rule and stone

/* deterministic per-index noise — the layout must be identical on every load */
function hash(i: number, salt: number) {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/* ── 1. the sheet ──────────────────────────────────────────────────────────
   A full-frame quad written directly in clip space (PlaneGeometry(2,2), z=0),
   so it needs no sizing math and ignores the camera entirely. */
const sheetVert = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const sheetFrag = /* glsl */ `
  uniform vec2 uRes;    // canvas size in CSS px
  uniform float uPx;    // CSS px per device px (= 1/dpr) — our analytic AA width
  uniform float uTime;
  uniform float uFade;
  uniform float uDir;   // +1 ltr, -1 rtl: the sheet drifts the way the page reads
  uniform vec2 uPar;    // parallax offset in px (smaller than the field's: it is far)
  uniform vec3 uGrid;
  uniform vec2 uKeep;   // vertical fade window (0 = bottom of frame)
  uniform float uAmp;
  varying vec2 vUv;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    vec2 p = vUv * uRes + uPar;
    p.x += uDir * uTime * 1.7;

    // distance in px to the nearest rule of an 88px lattice, antialiased with uPx
    float cell = 88.0;
    vec2 g = abs(fract(p / cell - 0.5) - 0.5) * cell;
    float w = 0.5;
    float lx = 1.0 - smoothstep(w - uPx, w + uPx, g.x);
    float ly = 1.0 - smoothstep(w - uPx, w + uPx, g.y);
    float grid = max(lx, ly);

    // a very slow noise makes the sheet breathe so it never reads as wallpaper
    float breath = 0.22 + 0.95 * vnoise(p * 0.0032 + vec2(uTime * 0.011, 0.0));

    float keep = smoothstep(uKeep.x, uKeep.y, vUv.y);                 // clear of the headline
    float edge = smoothstep(0.0, 0.16, vUv.x) * (1.0 - smoothstep(0.84, 1.0, vUv.x));

    float a = grid * breath * keep * edge * uAmp * uFade;
    if (a < 0.0025) discard;
    gl_FragColor = vec4(uGrid * a, a);   // premultiplied
  }`;

/* ── 2. the wires ─────────────────────────────────────────────────────────
   Screen-space ribbon expansion. `position` is the station, `aNext` the station
   after it; both are projected, the direction between them is taken in pixels,
   and the vertex is pushed along its normal by aSide * uHalfPx pixels. Varyings
   are packed into vec4s: a mid-range GPU only guarantees 8 varying slots and
   ANGLE has historically padded each scalar varying to a full slot. */
const wireVert = /* glsl */ `
  attribute vec3 aNext;
  attribute float aSide;    // -1 / +1 across the ribbon
  attribute float aT;       // 0..1 along the edge, 0 at the reading-start end
  attribute float aPhase;   // packet phase offset
  attribute float aRipE;    // signed ripple energy (sign = which end it started from)
  attribute float aRipAge;  // seconds since that ripple was triggered
  attribute vec3 aColor;
  uniform vec2 uRes;
  uniform float uHalfPx;    // half the expanded ribbon width, in CSS px
  varying vec4 vA;          // t, phase, ripple energy, ripple age
  varying vec4 vB;          // side, depth fade, -, -
  varying vec3 vColor;
  void main() {
    vec4 c0 = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vec4 c1 = projectionMatrix * modelViewMatrix * vec4(aNext, 1.0);
    vec2 s0 = (c0.xy / c0.w) * uRes * 0.5;
    vec2 s1 = (c1.xy / c1.w) * uRes * 0.5;
    vec2 d = s1 - s0;
    float len = length(d);
    vec2 dir = len > 0.0001 ? d / len : vec2(1.0, 0.0);
    vec2 nrm = vec2(-dir.y, dir.x);
    // px -> ndc is (2 / uRes); ndc -> clip is (* w)
    vec2 off = nrm * aSide * uHalfPx * 2.0 / uRes;
    gl_Position = vec4(c0.xy + off * c0.w, c0.z, c0.w);

    float dist = -(modelViewMatrix * vec4(position, 1.0)).z;
    vA = vec4(aT, aPhase, aRipE, aRipAge);
    vB = vec4(aSide, mix(1.0, 0.66, smoothstep(11.0, 15.0, dist)), 0.0, 0.0);
    vColor = aColor;
  }`;

const wireFrag = /* glsl */ `
  uniform float uTime;
  uniform float uDir;        // +1 ltr, -1 rtl
  uniform float uFade;
  uniform float uSettle;
  uniform float uWidth;      // the visible hair-line width, CSS px
  uniform float uHalfPx;
  uniform float uAA;
  uniform float uSpeed;
  uniform float uPacketAmp;
  uniform float uRipSpeed;
  uniform vec3 uPacket;
  uniform vec3 uInk;
  varying vec4 vA;
  varying vec4 vB;
  varying vec3 vColor;
  void main() {
    // analytic coverage across the ribbon — this is the antialiasing
    float dpx = abs(vB.x) * uHalfPx;
    float cov = 1.0 - smoothstep(uWidth * 0.5 - uAA, uWidth * 0.5 + uAA, dpx);
    if (cov < 0.004) discard;

    float t = uDir > 0.0 ? vA.x : 1.0 - vA.x;

    // PACKET. The head sweeps -0.35 .. 1.35 so each edge is empty for part of
    // the cycle — a wire that is always lit reads as decoration, one that fires
    // now and then reads as traffic.
    float head = fract(vA.y + uTime * uSpeed) * 1.7 - 0.35;
    float dt = t - head;
    float core = exp(-pow(dt * 70.0, 2.0));
    float tail = dt < 0.0 ? exp(dt * 11.0) * 0.5 : 0.0;
    float packet = clamp(core + tail, 0.0, 1.0) * uPacketAmp;

    // RIPPLE. Travels outward from whichever end of the edge was touched.
    float rip = 0.0;
    float re = abs(vA.z);
    if (re > 0.002) {
      float rt = vA.z >= 0.0 ? vA.x : 1.0 - vA.x;
      float pos = vA.w * uRipSpeed;
      rip = exp(-pow((rt - pos) * 6.5, 2.0)) * re;
    }

    float base = mix(0.15, 0.40, uSettle);
    vec3 col = mix(vColor, uPacket, min(1.0, packet * 1.25));
    col = mix(col, uInk, rip * 0.55);
    float a = (base + packet * 0.55 + rip * 0.42) * vB.y * uFade * cov;
    if (a < 0.003) discard;
    gl_FragColor = vec4(col * a, a);   // premultiplied
  }`;

/* ── 3. the anchors ───────────────────────────────────────────────────────
   One sprite, drawn as an instrument mark. The paper gap is painted with the
   page's own background colour so the node punches a clean hole in the wires
   running underneath it (points render after the wires; there is no depth
   buffer, ordering is renderOrder). */
const nodeVert = /* glsl */ `
  attribute float aSize;    // sprite diameter in world units
  attribute float aAnchor;  // 1 = project, 0 = infrastructure
  attribute float aLive;    // 1 = live (verdigris)
  attribute float aAlpha;
  attribute float aPhase;
  attribute float aHover;   // 0..1, eased on the CPU
  attribute vec3 aColor;
  uniform float uPixScale;  // CSS px per world unit at unit distance
  uniform float uDpr;
  uniform float uMaxPoint;
  varying vec4 vA;          // anchor, live, alpha, phase
  varying vec4 vB;          // hover, depth fade, 1/pointSize, -
  varying vec3 vColor;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float dist = max(0.001, -mv.z);
    float ps = min(aSize * (1.0 + aHover * 0.14) * uPixScale / dist * uDpr, uMaxPoint);
    gl_PointSize = ps;
    gl_Position = projectionMatrix * mv;
    vA = vec4(aAnchor, aLive, aAlpha, aPhase);
    vB = vec4(aHover, mix(1.0, 0.74, smoothstep(11.0, 15.0, dist)), 1.0 / max(ps, 1.0), 0.0);
    vColor = aColor;
  }`;

const nodeFrag = /* glsl */ `
  uniform float uTime;
  uniform float uFade;
  uniform float uSettle;
  uniform vec3 uPaper;
  varying vec4 vA;
  varying vec4 vB;
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float aa = max(vB.z, 0.002);          // one device pixel, in sprite units
    float anchor = vA.x;

    float rCore = mix(0.168, 0.110, anchor);
    float core = 1.0 - smoothstep(rCore - aa, rCore + aa, d);

    // the punched paper gap and the outline ring only exist on project anchors
    float gap = smoothstep(0.150 - aa, 0.150 + aa, d) * (1.0 - smoothstep(0.232 - aa, 0.232 + aa, d)) * anchor;
    float rRo = 0.262 + vB.x * 0.022;
    float ring = smoothstep(0.232 - aa, 0.232 + aa, d) * (1.0 - smoothstep(rRo - aa, rRo + aa, d)) * anchor;

    float halo = 1.0 - smoothstep(0.15, 0.5, d);
    halo = halo * halo * (1.0 - gap);     // never muddy the paper gap

    // the live pulse: the same expanding ring the ledger's live dot draws in CSS
    float pr = fract(uTime * 0.30 + vA.w);
    float prad = mix(0.27, 0.48, pr);
    float pulse = (1.0 - smoothstep(0.0, 0.018 + aa, abs(d - prad))) * (1.0 - pr) * vA.y * uSettle;

    float aC = clamp(core + ring * 0.9 + halo * mix(0.12, 0.20, anchor) + pulse * 0.55 + vB.x * halo * 0.18, 0.0, 1.0);
    aC *= vA.z * vB.y * uFade;
    float aP = gap * uFade * 0.92;

    float outA = min(1.0, aC + aP);
    if (outA < 0.004) discard;
    gl_FragColor = vec4(vColor * aC + uPaper * aP, outA);   // premultiplied
  }`;

function Field({ dir, mobile, reduced }: { dir: "rtl" | "ltr"; mobile: boolean; reduced: boolean }) {
  const { size, camera, viewport, invalidate } = useThree();

  /* ── buffers: allocated exactly once, never re-keyed ─────────────────── */
  const buf = useMemo(() => {
    const V = E * STATIONS * 2;   // ribbon vertices
    return {
      base: new Float32Array(N * 3),      // settled world position
      scatter: new Float32Array(N * 3),   // pre-settle displacement
      phase: new Float32Array(N),
      cur: new Float32Array(N * 3),       // live world position (= points attr)
      screen: new Float32Array(N * 2).fill(-9999),
      hover: new Float32Array(N),
      ripAt: new Float32Array(N).fill(-1e4),
      order: new Int32Array(E * 2),       // endpoints, ordered by world x
      bow: new Float32Array(E),
      st: new Float32Array(STATIONS * 3), // Bézier scratch
      lpos: new Float32Array(V * 3),
      lnext: new Float32Array(V * 3),
      lside: new Float32Array(V),
      lt: new Float32Array(V),
      lphase: new Float32Array(V),
      lcol: new Float32Array(V * 3),
      lripe: new Float32Array(V),
      lripa: new Float32Array(V),
      pSize: new Float32Array(N),
      pAnchor: new Float32Array(N),
      pLive: new Float32Array(N),
      pAlpha: new Float32Array(N),
      pPhase: new Float32Array(N),
      pHover: new Float32Array(N),
      pCol: new Float32Array(N * 3),
    };
  }, []);

  /* ── geometry: allocated once ─────────────────────────────────────────── */
  const sheetGeo = useMemo(() => new THREE.PlaneGeometry(2, 2), []);

  const wireGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const dyn = (a: Float32Array, n: number) =>
      new THREE.BufferAttribute(a, n).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute("position", dyn(buf.lpos, 3));
    g.setAttribute("aNext", dyn(buf.lnext, 3));
    g.setAttribute("aSide", new THREE.BufferAttribute(buf.lside, 1));
    g.setAttribute("aT", new THREE.BufferAttribute(buf.lt, 1));
    g.setAttribute("aPhase", new THREE.BufferAttribute(buf.lphase, 1));
    g.setAttribute("aColor", new THREE.BufferAttribute(buf.lcol, 3));
    g.setAttribute("aRipE", dyn(buf.lripe, 1));
    g.setAttribute("aRipAge", dyn(buf.lripa, 1));
    // static: side, t along the edge, packet phase, and the triangle index
    const idx = new Uint16Array(E * SEGS * 6);
    for (let e = 0; e < E; e++) {
      const ph = ((e * 0.6180339887) % 1);
      for (let s = 0; s < STATIONS; s++) {
        const v = (e * STATIONS + s) * 2;
        const t = s / SEGS;
        buf.lside[v] = -1; buf.lside[v + 1] = 1;
        buf.lt[v] = t; buf.lt[v + 1] = t;
        buf.lphase[v] = ph; buf.lphase[v + 1] = ph;
      }
      for (let s = 0; s < SEGS; s++) {
        const v = (e * STATIONS + s) * 2;
        const o = (e * SEGS + s) * 6;
        idx[o] = v; idx[o + 1] = v + 1; idx[o + 2] = v + 2;
        idx[o + 3] = v + 1; idx[o + 4] = v + 3; idx[o + 5] = v + 2;
      }
    }
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    return g;
  }, [buf]);

  const nodeGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(buf.cur, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("aSize", new THREE.BufferAttribute(buf.pSize, 1));
    g.setAttribute("aAnchor", new THREE.BufferAttribute(buf.pAnchor, 1));
    g.setAttribute("aLive", new THREE.BufferAttribute(buf.pLive, 1));
    g.setAttribute("aAlpha", new THREE.BufferAttribute(buf.pAlpha, 1));
    g.setAttribute("aPhase", new THREE.BufferAttribute(buf.pPhase, 1));
    g.setAttribute("aHover", new THREE.BufferAttribute(buf.pHover, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("aColor", new THREE.BufferAttribute(buf.pCol, 3));
    return g;
  }, [buf]);

  /* ── materials: allocated once; everything variable is a uniform ──────── */
  const sheetMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: sheetVert, fragmentShader: sheetFrag,
    transparent: true, depthTest: false, depthWrite: false,
    uniforms: {
      uRes: { value: new THREE.Vector2(1, 1) },
      uPx: { value: 1 },
      uTime: { value: 0 },
      uFade: { value: 0 },
      uDir: { value: 1 },
      uPar: { value: new THREE.Vector2(0, 0) },
      uGrid: { value: C_RULE },
      uKeep: { value: new THREE.Vector2(0.18, 0.56) },
      uAmp: { value: 0.055 },
    },
  }), []);

  const wireMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: wireVert, fragmentShader: wireFrag,
    transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
    uniforms: {
      uRes: { value: new THREE.Vector2(1, 1) },
      uHalfPx: { value: 1.2 },
      uWidth: { value: 1.25 },
      uAA: { value: 0.6 },
      uTime: { value: 0 },
      uDir: { value: 1 },
      uFade: { value: 0 },
      uSettle: { value: 0 },
      uSpeed: { value: 0.085 },
      uPacketAmp: { value: 0 },
      uRipSpeed: { value: 0.85 },
      uPacket: { value: C_SAFFRON },
      uInk: { value: C_INK },
    },
  }), []);

  const nodeMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: nodeVert, fragmentShader: nodeFrag,
    transparent: true, depthTest: false, depthWrite: false,
    uniforms: {
      uPixScale: { value: 1000 },
      uDpr: { value: 1 },
      uMaxPoint: { value: 96 },
      uTime: { value: 0 },
      uFade: { value: 0 },
      uSettle: { value: 0 },
      uPaper: { value: C_PAPER },
    },
  }), []);

  useEffect(() => () => {
    sheetGeo.dispose(); wireGeo.dispose(); nodeGeo.dispose();
    sheetMat.dispose(); wireMat.dispose(); nodeMat.dispose();
  }, [sheetGeo, wireGeo, nodeGeo, sheetMat, wireMat, nodeMat]);

  /* ── layout: re-derived on resize / dir / breakpoint, written IN PLACE ───
     Node ids -> index, world positions from the normalised map, the z spread,
     the edge orientation (reading order) and every static attribute that
     depends on any of those. No allocation, no geometry rebuild. */
  const idOf = useMemo(() => new Map(nodes.map((n, i) => [n.id, i])), []);

  useMemo(() => {
    const vw = viewport.width, vh = viewport.height;
    for (let i = 0; i < N; i++) {
      const n = nodes[i];
      // RTL mirrors the map about the page's centre line, so "leading" stays leading
      let nx = dir === "rtl" ? 1 - n.x : n.x;
      let ny = n.y;
      // Under 1024px the copy sits at the bottom of the hero and a paper
      // gradient clears the canvas below ~52% of its height, so the field is
      // compressed into the top ~45%: y 0.06..0.62 maps to 0.082..0.429, which
      // keeps every anchor (and its label, which hangs ~0.55rem lower) clear of
      // both the veil and the headline.
      // on phones the canvas is a 48svh band above the copy (see globals.css),
      // so the layout fills the band instead of the top of a full-height hero
      if (mobile) { nx = 0.07 + nx * 0.86; ny = 0.10 + n.y * 1.55; }

      const anchor = n.kind === "anchor";
      const h1 = hash(i, 1);
      // projects sit in front of the plane, infrastructure behind it
      const z = anchor ? 0.85 + h1 * 0.75 : -2.55 + h1 * 1.55;
      // scale x/y by the depth ratio so the z spread does not disturb where the
      // node LANDS on the normalised map — depth changes its size and parallax,
      // never its place in the layout
      const k = (CAM_Z - z) / CAM_Z;
      buf.base[i * 3] = (nx - 0.5) * vw * k;
      buf.base[i * 3 + 1] = (0.5 - ny) * vh * k;
      buf.base[i * 3 + 2] = z;

      buf.scatter[i * 3] = (hash(i, 2) - 0.5) * 1.15;
      buf.scatter[i * 3 + 1] = (hash(i, 3) - 0.5) * 0.85;
      buf.scatter[i * 3 + 2] = (hash(i, 4) - 0.5) * 0.9;
      buf.phase[i] = h1 * 6.2831853;

      const c = anchor ? (n.live ? C_VERDIGRIS : C_SAFFRON) : C_INK;
      buf.pCol[i * 3] = c.r; buf.pCol[i * 3 + 1] = c.g; buf.pCol[i * 3 + 2] = c.b;
      buf.pSize[i] = (n.size ?? 0.9) * 0.20 * (mobile ? 0.86 : 1);
      buf.pAnchor[i] = anchor ? 1 : 0;
      buf.pLive[i] = n.live ? 1 : 0;
      buf.pAlpha[i] = anchor ? 1 : 0.72;
      buf.pPhase[i] = hash(i, 5);
      // seed the live positions so the very first published frame is sane
      buf.cur[i * 3] = buf.base[i * 3];
      buf.cur[i * 3 + 1] = buf.base[i * 3 + 1];
      buf.cur[i * 3 + 2] = z;
    }

    for (let e = 0; e < E; e++) {
      let ia = idOf.get(edges[e][0]) ?? 0;
      let ib = idOf.get(edges[e][1]) ?? 0;
      // Orient every edge so aT = 0 is the smaller world x. Combined with
      // uDir (+1 ltr / -1 rtl) that makes every packet travel in the page's
      // reading direction — and because the RTL layout is mirrored, the
      // orientation is genuinely re-derived rather than flipped in the shader.
      if (buf.base[ia * 3] > buf.base[ib * 3]) { const t = ia; ia = ib; ib = t; }
      buf.order[e * 2] = ia; buf.order[e * 2 + 1] = ib;
      buf.bow[e] = hash(e, 7) < 0.5 ? -1 : 1;

      // Wire tint: stone, warmed toward verdigris near a LIVE anchor only.
      // Verdigris' one job in this palette is the live state ("a dot, a trace");
      // a saffron-tinted wire would read as a stalled packet, so non-live
      // anchors leave their wires plain stone.
      const la = nodes[ia].live ? 1 : 0;
      const lb = nodes[ib].live ? 1 : 0;
      for (let s = 0; s < STATIONS; s++) {
        const u = s / SEGS;
        const wa = la * (1 - u) * (1 - u) * 0.42;
        const wb = lb * u * u * 0.42;
        const m = wa + wb;
        const r = C_STONE.r + (C_VERDIGRIS.r - C_STONE.r) * m;
        const g = C_STONE.g + (C_VERDIGRIS.g - C_STONE.g) * m;
        const b = C_STONE.b + (C_VERDIGRIS.b - C_STONE.b) * m;
        const v = (e * STATIONS + s) * 2;
        buf.lcol[v * 3] = r; buf.lcol[v * 3 + 1] = g; buf.lcol[v * 3 + 2] = b;
        buf.lcol[v * 3 + 3] = r; buf.lcol[v * 3 + 4] = g; buf.lcol[v * 3 + 5] = b;
      }
    }

    wireGeo.attributes.aColor.needsUpdate = true;
    wireGeo.attributes.aSide.needsUpdate = true;
    wireGeo.attributes.aT.needsUpdate = true;
    wireGeo.attributes.aPhase.needsUpdate = true;
    nodeGeo.attributes.aSize.needsUpdate = true;
    nodeGeo.attributes.aAnchor.needsUpdate = true;
    nodeGeo.attributes.aLive.needsUpdate = true;
    nodeGeo.attributes.aAlpha.needsUpdate = true;
    nodeGeo.attributes.aPhase.needsUpdate = true;
    nodeGeo.attributes.aColor.needsUpdate = true;
  }, [buf, idOf, wireGeo, nodeGeo, viewport.width, viewport.height, dir, mobile]);

  /* ── pointer: canvas-relative CSS px, fine pointers only ─────────────── */
  const ptr = useRef({ x: -9999, y: -9999, nx: 0, ny: 0, active: false });
  const ptrEase = useRef({ nx: 0, ny: 0 });
  const hostEl = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (reduced) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const host = hostEl.current ?? document.querySelector<HTMLElement>(".hs-root");
    hostEl.current = host;
    if (!host) return;
    let rect = host.getBoundingClientRect();
    let dirty = false;
    const mark = () => { dirty = true; };
    const move = (ev: PointerEvent) => {
      if (dirty) { rect = host.getBoundingClientRect(); dirty = false; }
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      const p = ptr.current;
      p.x = x; p.y = y;
      p.nx = (x / Math.max(1, rect.width)) * 2 - 1;
      p.ny = 1 - (y / Math.max(1, rect.height)) * 2;
      p.active = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
    };
    const leave = () => { ptr.current.active = false; ptr.current.x = -9999; ptr.current.y = -9999; };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("scroll", mark, { passive: true });
    window.addEventListener("resize", mark);
    document.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("scroll", mark);
      window.removeEventListener("resize", mark);
      document.removeEventListener("pointerleave", leave);
    };
  }, [reduced]);

  /* ── reduced motion renders on demand: kick a few frames so the labels get
     placed once the hero's label host exists, and again on resize ───────── */
  useEffect(() => {
    if (!reduced) return;
    const ids = [0, 80, 260, 700, 1500].map((ms) => window.setTimeout(() => invalidate(), ms));
    const on = () => invalidate();
    window.addEventListener("resize", on);
    return () => { ids.forEach((i) => window.clearTimeout(i)); window.removeEventListener("resize", on); };
  }, [reduced, invalidate, size.width, size.height]);

  /* ── per-frame state ──────────────────────────────────────────────────── */
  const fade = useRef(0);
  const settle = useRef(0);
  /* Our own clock, accumulated from the CLAMPED delta rather than
     state.clock.elapsedTime: the frameloop stops at "never" when the hero
     leaves the viewport, and elapsedTime keeps counting the paused wall time,
     so the first frame back would jump every drift sine to a new phase and
     lurch the sheet. This also keeps the sheet's px-space coordinate from
     growing with time spent scrolled away. */
  const clock = useRef(0);
  const settleFired = useRef(false);
  const labelHost = useRef<HTMLElement | null>(null);
  const labelEls = useRef(new Map<string, HTMLElement>());
  const v3 = useMemo(() => new THREE.Vector3(), []);
  const liveIdx = useMemo(() => nodes.map((n, i) => (n.live ? i : -1)).filter((i) => i >= 0), []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    if (!reduced) clock.current += dt;
    const t = reduced ? 0 : clock.current;
    const { base, scatter, phase, cur, screen, hover, ripAt, order, bow, st } = buf;

    /* fade-in, settle easing */
    if (reduced) { fade.current = 1; settle.current = 1; }
    else {
      fade.current = Math.min(1, fade.current + dt * 0.85);
      settle.current += ((heroBus.settled ? 1 : 0) - settle.current) * Math.min(1, dt * 1.7);
    }
    const set = settle.current;

    /* the settle burst: one wave leaves each live anchor as the map powers up */
    if (!reduced && heroBus.settled && !settleFired.current) {
      settleFired.current = true;
      for (let k = 0; k < liveIdx.length; k++) ripAt[liveIdx[k]] = t + k * 0.2;
    }

    /* scroll: 0 at rest, 1 once the hero has scrolled a full canvas height */
    const scroll = reduced ? 0 : Math.min(1, Math.max(0, window.scrollY / Math.max(1, size.height)));

    /* hover, resolved against the PREVIOUS frame's published screen positions —
       exact, and free (we need those numbers for the labels anyway) */
    let nearest = -1;
    if (!reduced && ptr.current.active) {
      const R2 = mobile ? 0 : 88 * 88;
      let best = R2;
      for (let i = 0; i < N; i++) {
        const dx = screen[i * 2] - ptr.current.x;
        const dy = screen[i * 2 + 1] - ptr.current.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < best) { best = d2; nearest = i; }
      }
    }
    let ripActive = false;
    for (let i = 0; i < N; i++) {
      const want = i === nearest ? 1 : 0;
      const prev = hover[i];
      hover[i] = prev + (want - prev) * Math.min(1, dt * 7);
      if (want === 1 && prev < 0.25 && hover[i] >= 0.25) ripAt[i] = t;   // ripple trigger
      buf.pHover[i] = hover[i];
      // 3.0 > the 2.6s energy cutoff below, so the frame that zeroes a
      // ripple still uploads those zeros before the buffer goes quiet
      if (t - ripAt[i] < 3.0) ripActive = true;
    }
    nodeGeo.attributes.aHover.needsUpdate = true;

    /* ── integrate the node field ──────────────────────────────────────────
       Two slow sines per axis (organic, never periodic-looking at this ratio)
       plus a pre-settle scatter that collapses as the map assembles. */
    const amp = reduced ? 0 : (0.22 + (1 - set) * 0.42) * (mobile ? 0.72 : 1);
    for (let i = 0; i < N; i++) {
      const p = phase[i];
      const sc = reduced ? 0 : (1 - set);
      cur[i * 3] = base[i * 3] + scatter[i * 3] * sc
        + (Math.sin(t * 0.31 + p) * 0.62 + Math.sin(t * 0.13 + p * 2.1) * 0.38) * amp;
      cur[i * 3 + 1] = base[i * 3 + 1] + scatter[i * 3 + 1] * sc
        + (Math.cos(t * 0.27 + p * 1.3) * 0.60 + Math.cos(t * 0.11 + p * 0.7) * 0.34) * amp;
      cur[i * 3 + 2] = base[i * 3 + 2] + scatter[i * 3 + 2] * sc
        + Math.sin(t * 0.19 + p * 1.7) * amp * 0.5;
    }
    nodeGeo.attributes.position.needsUpdate = true;

    /* ── camera: pointer parallax + a scroll lag ───────────────────────────
       Translation only (plus a fraction of a degree of look-around): near
       anchors then shift more than far infrastructure, which is what sells the
       depth. Small enough that the labelled layout stays put. */
    if (!reduced) {
      ptrEase.current.nx += ((ptr.current.active ? ptr.current.nx : 0) - ptrEase.current.nx) * Math.min(1, dt * 3.2);
      ptrEase.current.ny += ((ptr.current.active ? ptr.current.ny : 0) - ptrEase.current.ny) * Math.min(1, dt * 3.2);
    }
    const camX = ptrEase.current.nx * 0.5;
    const camY = ptrEase.current.ny * 0.3;
    camera.position.set(camX, camY + scroll * viewport.height * 0.16, CAM_Z);
    camera.rotation.set(ptrEase.current.ny * 0.010, -ptrEase.current.nx * 0.012, 0);
    // project() reads matrixWorldInverse, which Camera refreshes here — the
    // renderer would not have done it yet this frame
    camera.updateMatrixWorld();

    /* ── publish screen positions, move the HTML labels ────────────────── */
    if (labelHost.current !== heroBus.labels) {
      labelHost.current = heroBus.labels;
      labelEls.current.clear();
      if (heroBus.labels) {
        heroBus.labels.querySelectorAll<HTMLElement>("[data-node]").forEach((el) => {
          if (el.dataset.node) labelEls.current.set(el.dataset.node, el);
        });
      }
    }
    const w = size.width, h = size.height;
    const labelFade = Math.max(0, Math.min(1, set * (1 - scroll * 1.4)));
    for (let i = 0; i < N; i++) {
      v3.set(cur[i * 3], cur[i * 3 + 1], cur[i * 3 + 2]).project(camera);
      const sx = (v3.x * 0.5 + 0.5) * w;
      const sy = (0.5 - v3.y * 0.5) * h;
      screen[i * 2] = sx; screen[i * 2 + 1] = sy;
      const n = nodes[i];
      const pos = heroBus.nodes.get(n.id);
      if (pos) { pos.x = sx; pos.y = sy; }
      else heroBus.nodes.set(n.id, { x: sx, y: sy });
      // also publish under the case-study slug: Hero.tsx launches its number
      // fragments from heroBus.nodes.get(<ledger row id>), and those ids are
      // slugs ("quantitative-method"), not node ids ("quant")
      if (n.slug && n.slug !== n.id) {
        const alias = heroBus.nodes.get(n.slug);
        if (alias) { alias.x = sx; alias.y = sy; }
        else heroBus.nodes.set(n.slug, { x: sx, y: sy });
      }
      const el = labelEls.current.get(n.id);
      if (el) {
        el.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) translate(-50%, 0)`;
        const o = labelFade * ((n.kind === "anchor" ? 1 : 0.72) + hover[i] * 0.3);
        el.style.opacity = Math.min(1, o).toFixed(3);
      }
    }
    heroBus.ready = true;

    /* ── rebuild the wire ribbons ─────────────────────────────────────────
       Quadratic Bézier per edge: control point = midpoint, bowed sideways by 6%
       of the span and arced 0.5 world units toward the camera, so no two wires
       overlap as straight lines and the graph reads with depth. */
    const { lpos, lnext, lripe, lripa } = buf;
    for (let e = 0; e < E; e++) {
      const ia = order[e * 2], ib = order[e * 2 + 1];
      const ax = cur[ia * 3], ay = cur[ia * 3 + 1], az = cur[ia * 3 + 2];
      const bx = cur[ib * 3], by = cur[ib * 3 + 1], bz = cur[ib * 3 + 2];
      const dx = bx - ax, dy = by - ay;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const bw = bow[e] * len * 0.06;
      const cx = (ax + bx) * 0.5 + (-dy / len) * bw;
      const cy = (ay + by) * 0.5 + (dx / len) * bw;
      const cz = (az + bz) * 0.5 + 0.5;

      for (let s = 0; s < STATIONS; s++) {
        const u = s / SEGS, iu = 1 - u;
        const w0 = iu * iu, w1 = 2 * iu * u, w2 = u * u;
        st[s * 3] = w0 * ax + w1 * cx + w2 * bx;
        st[s * 3 + 1] = w0 * ay + w1 * cy + w2 * by;
        st[s * 3 + 2] = w0 * az + w1 * cz + w2 * bz;
      }

      /* ripple bookkeeping: the wave leaves whichever end fired most recently */
      let sign = 1, age = 1e4;
      const ageA = t - ripAt[ia], ageB = t - ripAt[ib];
      if (ageA <= ageB) { age = ageA; sign = 1; } else { age = ageB; sign = -1; }
      let energy = 0;
      if (age >= 0 && age < 2.6) energy = Math.exp(-age * 1.3);
      const re = energy * sign;
      const ra = age > 0 ? age : 0;

      for (let s = 0; s < STATIONS; s++) {
        const px = st[s * 3], py = st[s * 3 + 1], pz = st[s * 3 + 2];
        let nx: number, ny: number, nz: number;
        if (s < SEGS) { nx = st[s * 3 + 3]; ny = st[s * 3 + 4]; nz = st[s * 3 + 5]; }
        else { nx = 2 * px - st[s * 3 - 3]; ny = 2 * py - st[s * 3 - 2]; nz = 2 * pz - st[s * 3 - 1]; }
        const v = (e * STATIONS + s) * 2;
        const o = v * 3;
        lpos[o] = px; lpos[o + 1] = py; lpos[o + 2] = pz;
        lpos[o + 3] = px; lpos[o + 4] = py; lpos[o + 5] = pz;
        lnext[o] = nx; lnext[o + 1] = ny; lnext[o + 2] = nz;
        lnext[o + 3] = nx; lnext[o + 4] = ny; lnext[o + 5] = nz;
        lripe[v] = re; lripe[v + 1] = re;
        lripa[v] = ra; lripa[v + 1] = ra;
      }
    }
    wireGeo.attributes.position.needsUpdate = true;
    wireGeo.attributes.aNext.needsUpdate = true;
    if (ripActive) {
      wireGeo.attributes.aRipE.needsUpdate = true;
      wireGeo.attributes.aRipAge.needsUpdate = true;
    }

    /* ── uniforms ─────────────────────────────────────────────────────────
       One global fade: in on load, out as the hero scrolls away. */
    const dpr = state.viewport.dpr;
    const f = fade.current * (1 - scroll * 0.92);
    const pixScale = h / (2 * Math.tan((FOV * Math.PI) / 360));

    const su = sheetMat.uniforms;
    (su.uRes.value as THREE.Vector2).set(w, h);
    su.uPx.value = 1 / Math.max(1, dpr);
    su.uTime.value = t;
    su.uFade.value = f;
    su.uDir.value = dir === "rtl" ? -1 : 1;
    (su.uPar.value as THREE.Vector2).set(-ptrEase.current.nx * 14, ptrEase.current.ny * 14 + scroll * 45);
    // the sheet fades out below the field: on mobile that window rides above
    // the veil (which is solid paper up to 22% and clear by 52%)
    (su.uKeep.value as THREE.Vector2).set(mobile ? 0.30 : 0.18, mobile ? 0.80 : 0.56);
    su.uAmp.value = mobile ? 0.045 : 0.055;

    const wu = wireMat.uniforms;
    (wu.uRes.value as THREE.Vector2).set(w, h);
    wu.uWidth.value = mobile ? 1.15 : 1.25;
    wu.uHalfPx.value = (wu.uWidth.value as number) * 0.5 + 0.6;
    wu.uTime.value = t;
    wu.uDir.value = dir === "rtl" ? -1 : 1;
    wu.uFade.value = f;
    wu.uSettle.value = set;
    // packets only start once the map has settled: the field assembles first,
    // then it comes alive. Reduced motion never lights them at all.
    wu.uPacketAmp.value = reduced ? 0 : Math.max(0, Math.min(1, (set - 0.15) / 0.75));

    const nu = nodeMat.uniforms;
    nu.uPixScale.value = pixScale;
    nu.uDpr.value = dpr;
    nu.uTime.value = t;
    nu.uFade.value = f;
    nu.uSettle.value = reduced ? 0 : set;   // no live pulse under reduced motion
  });

  return (
    <>
      <mesh geometry={sheetGeo} material={sheetMat} renderOrder={-10} frustumCulled={false} />
      <mesh geometry={wireGeo} material={wireMat} renderOrder={0} frustumCulled={false} />
      <points geometry={nodeGeo} material={nodeMat} renderOrder={10} frustumCulled={false} />
    </>
  );
}

function isSoftwareGL(): boolean {
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return true;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const r = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return /swiftshader|llvmpipe|softpipe|software|mesa offscreen|basic render/i.test(r);
  } catch { return true; }
}

export default function HeroScene({ dir }: { dir: "rtl" | "ltr" }) {
  // dynamic(ssr:false) guarantees `window` here, so these are resolved on the
  // first render — an effect would paint one desktop frame on a phone, and run
  // several animated frames before honouring prefers-reduced-motion
  const [mobile, setMobile] = useState(() => window.matchMedia("(max-width: 1023px)").matches);
  // A software rasteriser (SwiftShader, llvmpipe — headless Chrome, some VMs)
  // would burn the main thread on every frame; there the field is drawn once,
  // as a static map, exactly like the reduced-motion path.
  const [reduced, setReduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches || isSoftwareGL());
  // starts true so heroBus.ready is set before Hero's timeline fires its
  // number fragments at ~1.05s
  const [visible, setVisible] = useState(true);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mqM = window.matchMedia("(max-width: 1023px)");
    const mqR = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onM = () => setMobile(mqM.matches);
    const onR = () => setReduced(mqR.matches);
    mqM.addEventListener("change", onM);
    mqR.addEventListener("change", onR);
    // stop rendering entirely once the hero has left the viewport
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0 });
    const el = hostRef.current;
    if (el) io.observe(el);
    return () => {
      mqM.removeEventListener("change", onM);
      mqR.removeEventListener("change", onR);
      io.disconnect();
    };
  }, []);

  const frameloop = reduced ? "demand" : visible ? "always" : "never";

  return (
    <div ref={hostRef} className="hs-root">
      <Canvas
        frameloop={frameloop}
        dpr={[1, mobile ? 1 : 1.5]}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance", stencil: false, depth: false }}
        camera={{ position: [0, 0, CAM_Z], fov: FOV, near: 0.1, far: 60 }}
        style={{ background: "transparent" }}
      >
        <Field dir={dir} mobile={mobile} reduced={reduced} />
      </Canvas>
      <div className="hs-veil" aria-hidden="true" />
    </div>
  );
}
