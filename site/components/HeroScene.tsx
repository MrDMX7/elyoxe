"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { nodes, edges } from "@/content/systems";
import { heroBus } from "@/lib/heroBus";

/* The systems field. Node positions are integrated on the CPU (16 nodes, 22
   edges — trivial) so the same numbers drive the points, the lines and the
   HTML labels. The shaders only do the look: soft discs, and a packet that
   travels along each edge in the page's reading direction. */

const PAPER = new THREE.Color("#F4F2ED");
const STONE = new THREE.Color("#8E8B82");
const SAFFRON = new THREE.Color("#8F5400");
const VERDIGRIS = new THREE.Color("#1B6F5A");
const INK = new THREE.Color("#141A17");

const pointsVert = /* glsl */ `
  attribute float aSize; attribute vec3 aColor; attribute float aGlow;
  uniform float uDpr; uniform float uFade;
  varying vec3 vColor; varying float vGlow; varying float vFade;
  void main() {
    vColor = aColor; vGlow = aGlow; vFade = uFade;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uDpr * (26.0 / -mv.z) * 10.0;
    gl_Position = projectionMatrix * mv;
  }`;
const pointsFrag = /* glsl */ `
  varying vec3 vColor; varying float vGlow; varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float core = smoothstep(0.30, 0.22, d);
    float halo = smoothstep(0.5, 0.25, d) * 0.22 * vGlow;
    float a = (core + halo) * vFade;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor, a);
  }`;
const lineVert = /* glsl */ `
  attribute float aT; attribute float aPhase;
  varying float vT; varying float vPhase;
  void main() { vT = aT; vPhase = aPhase; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const lineFrag = /* glsl */ `
  uniform float uTime; uniform float uDir; uniform float uFade; uniform float uSettle;
  uniform vec3 uLine; uniform vec3 uPacket;
  varying float vT; varying float vPhase;
  void main() {
    float t = uDir > 0.0 ? vT : 1.0 - vT;
    float head = fract(uTime * 0.16 + vPhase);
    float packet = smoothstep(0.10, 0.0, abs(t - head)) ;
    float base = mix(0.16, 0.24, uSettle);
    vec3 c = mix(uLine, uPacket, packet);
    float a = (base + packet * 0.85) * uFade;
    gl_FragColor = vec4(c, a);
  }`;

type Sim = { base: Float32Array; phase: Float32Array; cur: Float32Array };

function Field({ dir, mobile }: { dir: "rtl" | "ltr"; mobile: boolean }) {
  const { size, camera, viewport } = useThree();
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const pointer = useRef(new THREE.Vector2(99, 99));
  const pointerTarget = useRef(new THREE.Vector2(99, 99));
  const settle = useRef(0);
  const labelEls = useRef<Map<string, HTMLElement>>(new Map());
  const v3 = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => heroBus.onSettle(() => { /* eased in useFrame */ }), []);

  // world-space layout from the normalised positions, re-derived on resize
  const sim = useMemo<Sim>(() => {
    const w = viewport.width, h = viewport.height;
    const base = new Float32Array(nodes.length * 3);
    const phase = new Float32Array(nodes.length);
    nodes.forEach((n, i) => {
      let nx = dir === "rtl" ? 1 - n.x : n.x;
      let ny = n.y;
      if (mobile) { ny = 0.04 + n.y * 0.55; nx = 0.06 + nx * 0.88; }
      base[i * 3] = (nx - 0.5) * w;
      base[i * 3 + 1] = (0.5 - ny) * h;
      base[i * 3 + 2] = 0;
      phase[i] = (i * 2.399) % 6.283;
    });
    return { base, phase, cur: base.slice() };
  }, [viewport.width, viewport.height, dir, mobile]);

  const pointsGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(sim.cur, 3));
    const sizes = new Float32Array(nodes.map((n) => (n.size ?? 0.9) * (mobile ? 0.8 : 1)));
    const glow = new Float32Array(nodes.map((n) => (n.kind === "anchor" ? 1 : 0.3)));
    const colors = new Float32Array(nodes.length * 3);
    nodes.forEach((n, i) => {
      const c = n.kind === "anchor" ? (n.live ? VERDIGRIS : SAFFRON) : INK;
      colors.set([c.r, c.g, c.b], i * 3);
    });
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    g.setAttribute("aGlow", new THREE.BufferAttribute(glow, 1));
    g.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    return g;
  }, [sim, mobile]);

  const edgeIdx = useMemo(() => {
    const idx = new Map(nodes.map((n, i) => [n.id, i]));
    return edges.map(([a, b]) => [idx.get(a)!, idx.get(b)!] as [number, number]);
  }, []);

  const linesGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(edgeIdx.length * 6);
    const t = new Float32Array(edgeIdx.length * 2);
    const ph = new Float32Array(edgeIdx.length * 2);
    edgeIdx.forEach((_, i) => { t[i * 2] = 0; t[i * 2 + 1] = 1; ph[i * 2] = ph[i * 2 + 1] = (i * 0.618) % 1; });
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aT", new THREE.BufferAttribute(t, 1));
    g.setAttribute("aPhase", new THREE.BufferAttribute(ph, 1));
    return g;
  }, [edgeIdx]);

  const pointsMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: pointsVert, fragmentShader: pointsFrag, transparent: true, depthWrite: false,
    uniforms: { uDpr: { value: 1 }, uFade: { value: 0 } },
  }), []);
  const linesMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: lineVert, fragmentShader: lineFrag, transparent: true, depthWrite: false,
    uniforms: {
      uTime: { value: 0 }, uDir: { value: dir === "rtl" ? -1 : 1 }, uFade: { value: 0 }, uSettle: { value: 0 },
      uLine: { value: STONE }, uPacket: { value: new THREE.Color("#B8781A") },
    },
  }), [dir]);

  useEffect(() => {
    const el = heroBus.labels;
    if (!el) return;
    labelEls.current = new Map(Array.from(el.querySelectorAll<HTMLElement>("[data-node]")).map((e) => [e.dataset.node!, e]));
  }, []);

  useEffect(() => {
    const canvasEl = document.querySelector<HTMLElement>(".hero-canvas");
    if (!canvasEl || !window.matchMedia("(pointer: fine)").matches) return;
    const move = (e: PointerEvent) => {
      const r = canvasEl.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - 0.5) * viewport.width;
      const y = (0.5 - (e.clientY - r.top) / r.height) * viewport.height;
      pointerTarget.current.set(x, y);
    };
    const leave = () => pointerTarget.current.set(99, 99);
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    return () => { window.removeEventListener("pointermove", move); document.removeEventListener("pointerleave", leave); };
  }, [viewport.width, viewport.height]);

  const fade = useRef(0);
  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const d = Math.min(dt, 0.05);
    fade.current = Math.min(1, fade.current + d * 0.9);
    settle.current += ((heroBus.settled ? 1 : 0) - settle.current) * Math.min(1, d * 1.6);
    pointer.current.lerp(pointerTarget.current, Math.min(1, d * 5));
    const amp = THREE.MathUtils.lerp(0.34, 0.09, settle.current) * (mobile ? 0.7 : 1);
    const scroll = Math.min(1, Math.max(0, window.scrollY / Math.max(1, size.height)));
    const { base, phase, cur } = sim;
    const px = pointer.current.x, py = pointer.current.y;
    for (let i = 0; i < nodes.length; i++) {
      const p = phase[i];
      let x = base[i * 3] + Math.sin(t * 0.55 + p) * amp + Math.sin(t * 0.21 + p * 2.1) * amp * 0.5;
      let y = base[i * 3 + 1] + Math.cos(t * 0.47 + p * 1.3) * amp * 0.8;
      const dx = x - px, dy = y - py;
      const dist2 = dx * dx + dy * dy;
      if (dist2 < 9) { const f = Math.exp(-dist2 * 0.55) * 0.9; const l = Math.sqrt(dist2) || 1; x += (dx / l) * f; y += (dy / l) * f; }
      y += scroll * viewport.height * 0.25;
      cur[i * 3] = x; cur[i * 3 + 1] = y;
    }
    pointsGeo.attributes.position.needsUpdate = true;
    const lp = linesGeo.attributes.position.array as Float32Array;
    edgeIdx.forEach(([a, b], i) => { lp.set([cur[a * 3], cur[a * 3 + 1], 0, cur[b * 3], cur[b * 3 + 1], 0], i * 6); });
    linesGeo.attributes.position.needsUpdate = true;
    const f = fade.current * (1 - scroll * 0.9);
    pointsMat.uniforms.uFade.value = f;
    pointsMat.uniforms.uDpr.value = state.viewport.dpr;
    linesMat.uniforms.uFade.value = f;
    linesMat.uniforms.uTime.value = t;
    linesMat.uniforms.uSettle.value = settle.current;
    // publish screen positions + move the HTML labels
    const w = size.width, h = size.height;
    for (let i = 0; i < nodes.length; i++) {
      v3.set(cur[i * 3], cur[i * 3 + 1], 0).project(camera);
      const sx = (v3.x * 0.5 + 0.5) * w, sy = (0.5 - v3.y * 0.5) * h;
      heroBus.nodes.set(nodes[i].id, { x: sx, y: sy });
      const el = labelEls.current.get(nodes[i].id);
      if (el) {
        el.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) translate(-50%, 0)`;
        el.style.opacity = String(settle.current * (1 - scroll * 1.4) * (nodes[i].kind === "anchor" ? 1 : 0.75));
      }
    }
    heroBus.ready = true;
  });

  return (
    <>
      <lineSegments ref={linesRef} geometry={linesGeo} material={linesMat} />
      <points ref={pointsRef} geometry={pointsGeo} material={pointsMat} />
    </>
  );
}

export default function HeroScene({ dir }: { dir: "rtl" | "ltr" }) {
  const [visible, setVisible] = useState(true);
  const [mobile, setMobile] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const on = () => setMobile(mq.matches);
    on(); mq.addEventListener("change", on);
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0 });
    if (hostRef.current) io.observe(hostRef.current);
    return () => { mq.removeEventListener("change", on); io.disconnect(); };
  }, []);
  return (
    <div ref={hostRef} style={{ position: "absolute", inset: 0 }}>
      <Canvas
        frameloop={visible ? "always" : "never"}
        dpr={[1, mobile ? 1 : 1.5]}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance", stencil: false, depth: false }}
        camera={{ position: [0, 0, 12], fov: 38, near: 1, far: 40 }}
        style={{ background: "transparent" }}
      >
        <Field dir={dir} mobile={mobile} />
      </Canvas>
    </div>
  );
}
