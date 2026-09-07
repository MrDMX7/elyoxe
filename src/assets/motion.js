// Reveal sequence: one idea per section, not a fade on everything.
//
//   headings  rise out of a mask
//   items     fade + rise, staggered after their heading
//   rules     draw from the leading edge — the one signature move, repeated
//
// No library. GSAP + ScrollTrigger + Lenis would be ~110KB over the wire for
// behaviour CSS transitions already do here, and this site's argument is that
// things should be no heavier than they need to be.
//
// The document only ever hides anything once this file is running: the `js-on`
// class is set below, and every pre-reveal style is scoped to it. If the script
// fails to load, or IntersectionObserver is missing, the page renders complete.
(function () {
  "use strict";

  var root = document.documentElement;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduced.matches || !("IntersectionObserver" in window)) return;

  root.classList.add("js-on");

  var targets = document.querySelectorAll("[data-reveal]");
  if (!targets.length) return;

  // Stagger is per group, so items in one section follow their own heading
  // rather than counting from the top of the page.
  var groups = {};
  Array.prototype.forEach.call(targets, function (el) {
    var g = el.getAttribute("data-reveal-group") || "default";
    groups[g] = groups[g] || 0;
    el.style.setProperty("--reveal-i", groups[g]++);
  });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      io.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0.15 });

  Array.prototype.forEach.call(targets, function (el) { io.observe(el); });

  // Turning reduced-motion on mid-session must not strand anything hidden.
  var onChange = function () {
    if (!reduced.matches) return;
    Array.prototype.forEach.call(targets, function (el) { el.classList.add("is-in"); });
  };
  if (reduced.addEventListener) reduced.addEventListener("change", onChange);
  else if (reduced.addListener) reduced.addListener(onChange);
})();


// ── pointer ring ────────────────────────────────────────────────────────────
// The brief asks for a custom cursor. On a page whose first rule is
// subtraction, the version that earns its place is a hairline that reports
// what is interactive -- not a blob that trails the pointer and hides the
// native one. It exists only where a real pointer does, never under reduced
// motion, and it never replaces the system cursor.
(function () {
  "use strict";

  if (!window.matchMedia("(pointer: fine)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!document.body) return;

  var ring = document.createElement("div");
  ring.className = "ring";
  ring.setAttribute("aria-hidden", "true");
  ring.appendChild(document.createElement("i"));
  document.body.appendChild(ring);

  // Physical left/top, not logical: clientX is a physical coordinate, so an
  // inset-inline-start here would put the ring on the wrong side of /ar/.
  var x = -99, y = -99, rx = x, ry = y, live = false, raf = 0;

  function tick() {
    rx += (x - rx) * 0.2;
    ry += (y - ry) * 0.2;
    ring.style.transform = "translate3d(" + (rx - 13) + "px," + (ry - 13) + "px,0)";
    raf = (Math.abs(x - rx) + Math.abs(y - ry) > 0.4) ? requestAnimationFrame(tick) : 0;
  }

  document.addEventListener("mousemove", function (e) {
    x = e.clientX; y = e.clientY;
    if (!live) { live = true; rx = x; ry = y; ring.classList.add("is-on"); }
    if (!raf) raf = requestAnimationFrame(tick);
  }, { passive: true });

  document.addEventListener("mouseout", function (e) {
    if (e.relatedTarget) return;          // still inside the document
    live = false;
    ring.classList.remove("is-on");
  });

  var HOT = "a, button, [role=button], input, textarea, summary, label";
  document.addEventListener("mouseover", function (e) {
    var el = e.target;
    var hot = !!(el && el.closest && el.closest(HOT));
    ring.classList.toggle("is-hot", hot);
  }, { passive: true });
})();
