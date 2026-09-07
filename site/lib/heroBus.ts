/* A tiny shared store between the hero timeline (DOM) and the WebGL scene.
   The scene publishes node screen positions each frame; the timeline reads
   them to launch the number fragments from the right node, and tells the
   scene when to settle into the systems map. */
export type Pos = { x: number; y: number };
type Listener = () => void;

export const heroBus = {
  nodes: new Map<string, Pos>(),
  ready: false,
  settled: false,
  settleListeners: new Set<Listener>(),
  labels: null as HTMLElement | null,
  settle() {
    if (this.settled) return;
    this.settled = true;
    this.settleListeners.forEach((l) => l());
  },
  onSettle(l: Listener) {
    this.settleListeners.add(l);
    if (this.settled) l();
    return () => { this.settleListeners.delete(l); };
  },
};
