/* ============================================================
   Podhigai — Professional Animation Layer (behavior)
   Additive only: works alongside main.js without needing to
   modify it. Handles scroll-reveal staggering, nav shadow on
   scroll, animated stat counters, and FAQ open-state class.
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Staggered scroll reveal ---------- */
  function initReveal() {
    var revealSelector = ".reveal, .reveal-left, .reveal-right, .reveal-scale";
    var parentIndex = new Map();
    document.querySelectorAll(revealSelector).forEach(function (el) {
      var parent = el.parentElement;
      if (!parentIndex.has(parent)) parentIndex.set(parent, 0);
      var idx = parentIndex.get(parent);
      parentIndex.set(parent, idx + 1);
      el.style.transitionDelay = reduceMotion ? "0ms" : Math.min(idx * 80, 480) + "ms";
    });

    if (reduceMotion || !("IntersectionObserver" in window)) {
      document.querySelectorAll(revealSelector).forEach(function (el) {
        el.classList.add("pcet-in", "visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("pcet-in", "visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    document.querySelectorAll(revealSelector).forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ---------- Nav shadow on scroll ---------- */
  function initNavShadow() {
    var nav = document.querySelector(".nav");
    if (!nav) return;
    function onScroll() {
      if (window.scrollY > 12) nav.classList.add("pcet-scrolled");
      else nav.classList.remove("pcet-scrolled");
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Animated stat counters ---------- */
  function initCounters() {
    var counters = document.querySelectorAll(".counter[data-target]");
    if (!counters.length) return;

    function animate(el) {
      var target = parseFloat(el.getAttribute("data-target")) || 0;
      var suffix = el.getAttribute("data-suffix") || "";
      var duration = reduceMotion ? 0 : 1400;
      var start = null;

      if (duration === 0) {
        el.textContent = target + suffix;
        return;
      }

      function step(ts) {
        if (start === null) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        var value = Math.round(target * eased);
        el.textContent = value + suffix;
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target + suffix;
      }
      requestAnimationFrame(step);
    }

    if (!("IntersectionObserver" in window)) {
      counters.forEach(animate);
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animate(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- FAQ open-state class (visual only, pairs with any existing toggle logic) ---------- */
  function initFaq() {
    document.querySelectorAll(".faq-item").forEach(function (item) {
      var q = item.querySelector(".faq-question, .faq-q");
      var a = item.querySelector(".faq-answer, .faq-a");
      if (!q) return;
      q.addEventListener("click", function () {
        var isOpen = item.classList.contains("open");
        // Close all items
        document.querySelectorAll(".faq-item").forEach(function (fi) {
          fi.classList.remove("open", "pcet-open");
          var qBtn = fi.querySelector(".faq-question, .faq-q");
          if (qBtn) qBtn.setAttribute("aria-expanded", "false");
          var fa = fi.querySelector(".faq-answer, .faq-a");
          if (fa) fa.style.maxHeight = null;
        });
        // Open clicked item if it was closed
        if (!isOpen) {
          item.classList.add("open", "pcet-open");
          q.setAttribute("aria-expanded", "true");
          if (a) a.style.maxHeight = a.scrollHeight + "px";
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initReveal();
    initNavShadow();
    initCounters();
    initFaq();
  });
})();
