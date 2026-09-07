// Mobile navigation.
//
// The markup shipped a .nav-toggle button and the stylesheet hid .nav below
// 860px, but nothing ever handled the click. On every phone that left the site
// with no navigation at all — and, because the language switch lives inside
// .nav, no way to reach the Arabic site either.
//
// Kept deliberately small and dependency-free: it runs on a static page whose
// only other script is the contact form.
(function () {
  "use strict";

  var header = document.querySelector(".head");
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");
  if (!header || !toggle || !nav) return;

  var open = false;
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", "site-nav");
  nav.id = "site-nav";

  function set(next) {
    open = next;
    header.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    // Scroll lock, or the page scrolls behind the open panel.
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (open) {
      var first = nav.querySelector("a");
      if (first) first.focus({ preventScroll: true });
    }
  }

  toggle.addEventListener("click", function (e) {
    e.stopPropagation();
    set(!open);
  });

  // Every link closes it: they are same-page anchors, so without this the
  // panel stays over the section the reader just asked to see.
  nav.addEventListener("click", function (e) {
    if (e.target.closest("a")) set(false);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && open) { set(false); toggle.focus(); }
  });

  document.addEventListener("click", function (e) {
    if (open && !header.contains(e.target)) set(false);
  });

  // Returning to desktop width must not leave the lock or the open state on.
  var mq = window.matchMedia("(min-width: 861px)");
  (mq.addEventListener ? mq.addEventListener.bind(mq, "change") : mq.addListener.bind(mq))(
    function () { if (mq.matches && open) set(false); });
})();
