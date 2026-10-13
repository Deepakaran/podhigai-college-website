/* ==========================================================================
   Podhigai — motion and accessibility orchestration

   Additive layer: main.js retains ownership of application behaviour.
   ========================================================================== */
(function (window, document) {
  "use strict";

  if (!window || !document) return;

  var STATE_KEY = "__podhigaiMotionLayer";
  if (window[STATE_KEY] && window[STATE_KEY].initialized) return;

  var state = {
    initialized: true,
    cleanups: [],
    scrollFrame: null,
    parallaxFrame: null,
    reduced: Boolean(window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches)
  };
  window[STATE_KEY] = state;

  var revealSelector = ".reveal, .reveal-left, .reveal-right, .reveal-scale";

  function listen(target, type, handler, options) {
    if (!target || !target.addEventListener) return;
    target.addEventListener(type, handler, options || false);
    state.cleanups.push(function () {
      target.removeEventListener(type, handler, options || false);
    });
  }

  function hasMainRuntime() {
    return Array.prototype.some.call(document.scripts || [], function (script) {
      return /(?:^|\/)main\.js(?:[?#]|$)/i.test(script.getAttribute("src") || "");
    });
  }

  function addMotionReadyClass() {
    document.documentElement.classList.add("pcet-motion-ready");
    if (document.body) document.body.classList.add("pcet-motion-ready");
  }

  function initMotionPreference() {
    if (!window.matchMedia) return;
    var preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    var onChange = function (event) {
      state.reduced = event.matches;
      if (!state.reduced) return;
      if (state.parallaxFrame !== null && window.cancelAnimationFrame) {
        window.cancelAnimationFrame(state.parallaxFrame);
        state.parallaxFrame = null;
      }
      var hero = document.querySelector(".uv-hero");
      if (hero) {
        hero.style.setProperty("--px", "0");
        hero.style.setProperty("--py", "0");
      }
    };
    if (preference.addEventListener) {
      preference.addEventListener("change", onChange);
      state.cleanups.push(function () { preference.removeEventListener("change", onChange); });
    } else if (preference.addListener) {
      preference.addListener(onChange);
      state.cleanups.push(function () { preference.removeListener(onChange); });
    }
  }

  function applyRevealDelays(elements) {
    elements.forEach(function (element) {
      if (element.style.transitionDelay || /\bdelay-\d+\b/.test(element.className)) return;
      var siblings = Array.prototype.filter.call(element.parentElement ? element.parentElement.children : [], function (candidate) {
        return candidate.matches && candidate.matches(revealSelector);
      });
      var index = siblings.indexOf(element);
      element.style.transitionDelay = state.reduced ? "0ms" : Math.min(Math.max(index, 0) * 80, 480) + "ms";
    });
  }

  function initReveal() {
    var elements = Array.prototype.slice.call(document.querySelectorAll(revealSelector));
    if (!elements.length) return;
    applyRevealDelays(elements);
    // main.js already installs the canonical observer in the live site.
    if (hasMainRuntime()) return;

    if (state.reduced || !("IntersectionObserver" in window)) {
      elements.forEach(function (element) { element.classList.add("pcet-in", "visible"); });
      return;
    }

    var observer = new window.IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("pcet-in", "visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    elements.forEach(function (element) { observer.observe(element); });
    state.cleanups.push(function () { observer.disconnect(); });
  }

  function setActive(link, active) {
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "page");
    else if (link.getAttribute("aria-current") === "page") link.removeAttribute("aria-current");
  }

  function initNavigation() {
    var nav = document.querySelector("header.nav, .nav");
    if (!nav) return;
    var desktopLinks = Array.prototype.slice.call(nav.querySelectorAll(".inst-links .nav-item"));
    var mobileLinks = Array.prototype.slice.call(nav.querySelectorAll(".mobile-drawer nav a"));
    var sectionLinks = desktopLinks.map(function (link) {
      var href = link.getAttribute("href") || "";
      if (href.indexOf("#") === -1) return null;
      var url = new URL(href, window.location.href);
      var section = url.pathname === window.location.pathname ? document.getElementById(url.hash.slice(1)) : null;
      return section ? { link: link, section: section } : null;
    }).filter(Boolean);

    function syncSectionActive() {
      if (!sectionLinks.length) return;
      var best = null;
      var activationLine = Math.min(window.innerHeight * 0.34, 300);
      sectionLinks.forEach(function (item) {
        var top = item.section.getBoundingClientRect().top;
        if (top <= activationLine && (!best || top > best.top)) best = { item: item, top: top };
      });
      desktopLinks.forEach(function (link) {
        var isSection = best && best.item.link === link;
        var href = link.getAttribute("href") || "";
        var isCurrentPage = href.indexOf("#") === -1 && new URL(href, window.location.href).pathname === window.location.pathname;
        if (isSection || (!best && isCurrentPage)) setActive(link, true);
        else if (sectionLinks.some(function (item) { return item.link === link; }) || isCurrentPage) setActive(link, false);
      });
      desktopLinks.forEach(function (desktopLink) {
        mobileLinks.forEach(function (mobileLink) {
          if (mobileLink.getAttribute("href") === desktopLink.getAttribute("href")) {
            setActive(mobileLink, desktopLink.classList.contains("active"));
          }
        });
      });
    }

    function updateScrollState() {
      nav.classList.toggle("pcet-scrolled", window.scrollY > 12);
      nav.classList.toggle("pcet-at-top", window.scrollY <= 12);
      syncSectionActive();
      state.scrollFrame = null;
    }
    function scheduleScrollState() {
      if (state.scrollFrame !== null || typeof window.requestAnimationFrame !== "function") return;
      state.scrollFrame = window.requestAnimationFrame(updateScrollState);
    }
    updateScrollState();
    listen(window, "scroll", scheduleScrollState, { passive: true });
    listen(window, "resize", scheduleScrollState, { passive: true });
  }

  function getFocusable(container) {
    return Array.prototype.slice.call(container.querySelectorAll(
      "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-1\"])"
    )).filter(function (element) { return element.getClientRects().length > 0; });
  }

  function initDrawerKeyboardSupport() {
    var toggle = document.getElementById("mobileToggle");
    var drawer = document.getElementById("mobileDrawer");
    if (!toggle || !drawer) return;
    toggle.setAttribute("aria-controls", drawer.id || "mobileDrawer");
    drawer.setAttribute("aria-hidden", drawer.classList.contains("open") ? "false" : "true");
    var returnFocus = toggle;

    function syncDrawerState() {
      var open = drawer.classList.contains("open");
      drawer.setAttribute("aria-hidden", open ? "false" : "true");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) {
        var focusable = getFocusable(drawer);
        if (focusable.length && !drawer.contains(document.activeElement)) focusable[0].focus();
      } else if (returnFocus && drawer.contains(document.activeElement)) {
        returnFocus.focus();
      }
    }

    listen(toggle, "click", function () {
      if (!drawer.classList.contains("open")) returnFocus = document.activeElement || toggle;
      window.setTimeout(syncDrawerState, 0);
    }, true);
    listen(document, "keydown", function (event) {
      if (!drawer.classList.contains("open")) return;
      if (event.key === "Escape") {
        event.preventDefault();
        toggle.click();
        return;
      }
      if (event.key !== "Tab") return;
      var focusable = getFocusable(drawer);
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    if ("MutationObserver" in window) {
      var drawerObserver = new window.MutationObserver(syncDrawerState);
      drawerObserver.observe(drawer, { attributes: true, attributeFilter: ["class"] });
      state.cleanups.push(function () { drawerObserver.disconnect(); });
    }
    syncDrawerState();
  }

  function initHeroParallax() {
    var hero = document.querySelector(".uv-hero");
    if (!hero || state.reduced || typeof window.requestAnimationFrame !== "function") return;
    var targetX = 0;
    var targetY = 0;
    var currentX = 0;
    var currentY = 0;
    var pointerX = 0;
    var pointerY = 0;
    var pointerActive = false;

    function update() {
      state.parallaxFrame = null;
      if (window.innerWidth < 1024 || state.reduced) {
        currentX = 0;
        currentY = 0;
        hero.style.setProperty("--px", "0");
        hero.style.setProperty("--py", "0");
        return;
      }
      var rect = hero.getBoundingClientRect();
      targetX = pointerActive ? ((pointerX - rect.left) / Math.max(rect.width, 1) - 0.5) * 2 : 0;
      targetY = pointerActive ? ((pointerY - rect.top) / Math.max(rect.height, 1) - 0.5) * 2 : 0;
      currentX += (targetX - currentX) * 0.1;
      currentY += (targetY - currentY) * 0.1;
      hero.style.setProperty("--px", currentX.toFixed(3));
      hero.style.setProperty("--py", currentY.toFixed(3));
      if (Math.abs(targetX - currentX) > 0.005 || Math.abs(targetY - currentY) > 0.005) {
        state.parallaxFrame = window.requestAnimationFrame(update);
      }
    }
    function scheduleUpdate() {
      if (state.parallaxFrame === null) state.parallaxFrame = window.requestAnimationFrame(update);
    }
    function onPointerMove(event) {
      if (window.innerWidth < 1024) return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      pointerActive = true;
      scheduleUpdate();
    }
    function reset() {
      pointerActive = false;
      targetX = 0;
      targetY = 0;
      scheduleUpdate();
    }
    listen(hero, "pointermove", onPointerMove, { passive: true });
    listen(hero, "pointerleave", reset, { passive: true });
    listen(window, "resize", reset, { passive: true });
  }

  function initStandaloneCountersAndFaq() {
    if (hasMainRuntime()) return;
    var counters = Array.prototype.slice.call(document.querySelectorAll(".counter[data-target], .count-up[data-target]"));
    if (counters.length && (state.reduced || !("IntersectionObserver" in window))) {
      counters.forEach(function (element) {
        element.textContent = (element.getAttribute("data-prefix") || "") +
          (element.getAttribute("data-target") || "0") + (element.getAttribute("data-suffix") || "");
      });
    } else if (counters.length) {
      var counterObserver = new window.IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting || entry.target.getAttribute("data-animated")) return;
          entry.target.setAttribute("data-animated", "true");
          entry.target.textContent = (entry.target.getAttribute("data-prefix") || "") +
            (entry.target.getAttribute("data-target") || "0") + (entry.target.getAttribute("data-suffix") || "");
          counterObserver.unobserve(entry.target);
        });
      }, { threshold: 0.3 });
      counters.forEach(function (element) { counterObserver.observe(element); });
      state.cleanups.push(function () { counterObserver.disconnect(); });
    }
    document.querySelectorAll(".faq-item").forEach(function (item) {
      var question = item.querySelector(".faq-question, .faq-q");
      if (!question || question.getAttribute("data-pcet-faq-bound")) return;
      question.setAttribute("data-pcet-faq-bound", "true");
      listen(question, "click", function () {
        item.classList.toggle("pcet-open", item.classList.contains("open"));
      });
    });
  }

  function init() {
    addMotionReadyClass();
    initMotionPreference();
    initReveal();
    initNavigation();
    initDrawerKeyboardSupport();
    initHeroParallax();
    initStandaloneCountersAndFaq();
  }

  if (document.readyState === "loading") listen(document, "DOMContentLoaded", init, { once: true });
  else init();
})(window, document);
