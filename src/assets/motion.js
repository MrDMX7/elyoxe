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
