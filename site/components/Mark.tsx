/* The Ex monogram (E + lowercase italic x carrying the arrow), recoloured for
   this palette: ink on paper, paper on ink; the arrow is always saffron. */
export default function Mark({ size = 32, onInk = false, title = "Elyoxe" }: { size?: number; onInk?: boolean; title?: string }) {
  const ink = onInk ? "var(--paper)" : "var(--ink)";
  const arrow = onInk ? "var(--saffron-lit)" : "var(--saffron)";
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={title} style={{ display: "block", overflow: "visible" }}>
      <path fill={ink} d="M8 26 h30 v11 H19 v9 h16 v11 H19 v9 h19 v11 H8 z" />
      <g transform="translate(12 0) skewX(-12)">
        <path fill={ink} d="M44 46 h11 L80 77 h-11 z" opacity=".92" />
        <path fill={ink} d="M44 77 h11 L80 46 h-11 z" />
        <path d="M50 76 L84 34" stroke={arrow} strokeWidth="3.6" strokeLinecap="round" fill="none" />
        <path fill={arrow} d="M90 27 L88.6 37.5 L80 30.5 z" />
      </g>
    </svg>
  );
}
