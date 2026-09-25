/* ==========================================================================
   PODHIGAI COLLEGE — MOBILE CAROUSEL LAYER
   Events auto-slide carousel + Department horizontal scroll-snap
   MOBILE ONLY (max-width: 767px)
   ========================================================================== */

(function () {
  'use strict';

  const isMobile = () => window.innerWidth <= 767;

  const esc = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  /* ==========================================================================
     1. MOBILE EVENTS CAROUSEL
     ========================================================================== */

  const EVENTS_STORAGE_KEY = 'podhigai_events';

  const DEFAULT_EVENTS = [
    {
      id: 'evt_1',
      title: 'TechNova 2026: National Level Technical Symposium & Project Expo',
      date: 'October 15, 2026',
      time: '09:30 AM - 04:30 PM',
      venue: 'Main Academic Block & APJ Auditorium',
      category: 'Symposium',
      description: 'A prestigious inter-collegiate technical convergence featuring paper presentations, AI hackathons, robotics challenges, and cash awards.',
      featured: true,
      published: true,
      coverImage: 'images/event-technova-symposium.png',
      gallery: ['images/event-technova-symposium.png', 'images/gallery-computing-lab.png']
    },
    {
      id: 'evt_2',
      title: 'Annual Placement Day & Corporate Recruiters Felicitation 2026',
      date: 'November 04, 2026',
      time: '10:00 AM - 02:00 PM',
      venue: 'Central Seminar Hall',
      category: 'Placement',
      description: 'Honoring placed graduates across Tier-1 Tech Giants including TCS, Wipro, Infosys, Zoho, Cognizant, and HCL.',
      featured: false,
      published: true,
      coverImage: 'images/event-placement-drive.png',
      gallery: ['images/event-placement-drive.png']
    },
    {
      id: 'evt_3',
      title: 'National Workshop on Edge Computing & Generative AI Systems',
      date: 'December 12, 2026',
      time: '09:00 AM - 04:00 PM',
      venue: 'Advanced Computing Lab (IT Block)',
      category: 'Workshop',
      description: 'Hands-on industrial masterclass on training LLMs on edge devices, real-time IoT computer vision pipelines, and full-stack cloud AI.',
      featured: false,
      published: true,
      coverImage: 'images/event-ai-cloud-workshop.png',
      gallery: ['images/event-ai-cloud-workshop.png']
    }
  ];

  const getLocalEvents = () => {
    try {
      const stored = localStorage.getItem(EVENTS_STORAGE_KEY);
      if (!stored) return DEFAULT_EVENTS;
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length) {
        return parsed.filter(e => e.published !== false);
      }
      return DEFAULT_EVENTS;
    } catch (ex) {
      return DEFAULT_EVENTS;
    }
  };

  let carouselIndex = 0;
  let carouselTimer = null;
  let regularEvents = [];
  let isTouching = false;
  let touchStartX = 0;
  let touchStartY = 0;
  let carouselTrack = null;
  let dotContainer = null;
  let carouselInitialized = false;
  const SLIDE_INTERVAL = 3000;

  /* Open event gallery via existing main.js modal */
  const openGallery = (eventId) => {
    // main.js renders [data-event-id] buttons inside #featuredEventCard and #eventsGrid
    // We click those to trigger the existing gallery modal
    const existingBtn = document.querySelector(
      '#featuredEventCard [data-event-id="' + eventId + '"], ' +
      '#eventsGrid [data-event-id="' + eventId + '"]'
    );
    if (existingBtn) {
      existingBtn.click();
      return;
    }
    // Fallback: dispatch custom event for main.js to handle
    window.dispatchEvent(new CustomEvent('podhigai:openEventGallery', { detail: { id: eventId } }));
  };

  const renderFeaturedMobile = (event) => {
    return '<div class="mob-featured-card">' +
      '<div class="mob-featured-media" data-event-id="' + esc(event.id) + '" role="button" tabindex="0" aria-label="Preview gallery for ' + esc(event.title) + '">' +
        '<img src="' + esc(event.coverImage || 'images/event-technova-symposium.png') + '" alt="' + esc(event.title) + '" class="mob-featured-img" loading="lazy">' +
        '<span class="mob-featured-badge">&#9733; Flagship Event</span>' +
        '<span class="mob-featured-cat">' + esc(event.category) + '</span>' +
      '</div>' +
      '<div class="mob-featured-body">' +
        '<div class="mob-event-meta"><span>&#128197; ' + esc(event.date) + '</span><span>&#128205; ' + esc(event.venue) + '</span></div>' +
        '<h3 class="mob-event-title">' + esc(event.title) + '</h3>' +
        '<p class="mob-event-desc">' + esc(event.description) + '</p>' +
        '<button type="button" class="mob-event-btn" data-event-id="' + esc(event.id) + '"><span>Explore Gallery</span><span class="mob-arrow">&#8594;</span></button>' +
      '</div>' +
    '</div>';
  };

  const renderRegularSlide = (event) => {
    return '<div class="mob-carousel-slide" role="group" aria-label="' + esc(event.title) + '">' +
      '<div class="mob-event-card">' +
        '<div class="mob-event-media" data-event-id="' + esc(event.id) + '" role="button" tabindex="0" aria-label="Preview gallery for ' + esc(event.title) + '">' +
          '<img src="' + esc(event.coverImage || 'images/event-placement-drive.png') + '" alt="' + esc(event.title) + '" class="mob-event-img" loading="lazy">' +
          '<span class="mob-event-cat-badge">' + esc(event.category) + '</span>' +
        '</div>' +
        '<div class="mob-event-card-body">' +
          '<div class="mob-event-meta"><span>&#128197; ' + esc(event.date) + '</span><span>&#128205; ' + esc(event.venue) + '</span></div>' +
          '<h4 class="mob-event-title">' + esc(event.title) + '</h4>' +
          '<p class="mob-event-desc">' + esc(event.description) + '</p>' +
          '<button type="button" class="mob-event-btn" data-event-id="' + esc(event.id) + '"><span>View Gallery</span><span class="mob-arrow">&#8594;</span></button>' +
        '</div>' +
      '</div>' +
    '</div>';
  };

  const updateDots = () => {
    if (!dotContainer) return;
    var dots = dotContainer.querySelectorAll('.mob-carousel-dot');
    for (var i = 0; i < dots.length; i++) {
      dots[i].classList.toggle('active', i === carouselIndex);
      dots[i].setAttribute('aria-current', i === carouselIndex ? 'true' : 'false');
    }
  };

  const goToSlide = (index, animate) => {
    if (animate === undefined) animate = true;
    if (!carouselTrack || !regularEvents.length) return;
    carouselIndex = ((index % regularEvents.length) + regularEvents.length) % regularEvents.length;
    var offset = carouselIndex * 100;
    carouselTrack.style.transition = animate ? 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)' : 'none';
    carouselTrack.style.transform = 'translateX(-' + offset + '%)';
    updateDots();
  };

  const startTimer = () => {
    stopTimer();
    if (regularEvents.length <= 1) return;
    carouselTimer = setInterval(function () {
      if (!isTouching) goToSlide(carouselIndex + 1);
    }, SLIDE_INTERVAL);
  };

  const stopTimer = () => {
    if (carouselTimer) {
      clearInterval(carouselTimer);
      carouselTimer = null;
    }
  };

  const attachSwipe = (track) => {
    var deltaX = 0;
    var deltaY = 0;
    var isScrolling = null;

    track.addEventListener('touchstart', function (e) {
      isTouching = true;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      deltaX = 0;
      deltaY = 0;
      isScrolling = null;
      stopTimer();
    }, { passive: true });

    track.addEventListener('touchmove', function (e) {
      if (!isTouching) return;
      deltaX = e.touches[0].clientX - touchStartX;
      deltaY = e.touches[0].clientY - touchStartY;

      if (isScrolling === null && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
        isScrolling = Math.abs(deltaY) > Math.abs(deltaX);
      }

      if (isScrolling === false) {
        e.preventDefault();
        var baseOffset = carouselIndex * 100;
        track.style.transition = 'none';
        track.style.transform = 'translateX(calc(-' + baseOffset + '% + ' + deltaX + 'px))';
      }
    }, { passive: false });

    track.addEventListener('touchend', function () {
      if (!isTouching) return;
      isTouching = false;

      if (isScrolling === false) {
        if (deltaX < -40) {
          goToSlide(carouselIndex + 1);
        } else if (deltaX > 40) {
          goToSlide(carouselIndex - 1);
        } else {
          goToSlide(carouselIndex);
        }
      }
      setTimeout(startTimer, 1000);
    }, { passive: true });

    track.addEventListener('touchcancel', function () {
      isTouching = false;
      goToSlide(carouselIndex);
      setTimeout(startTimer, 1000);
    }, { passive: true });
  };

  const buildMobileEvents = () => {
    var section = document.getElementById('events');
    if (!section) return;

    var events = getLocalEvents();
    var featured = null;
    for (var i = 0; i < events.length; i++) {
      if (events[i].featured) { featured = events[i]; break; }
    }
    if (!featured) featured = events[0] || null;

    regularEvents = events.filter(function (e) { return !featured || e.id !== featured.id; });

    var mobileEventsRoot = section.querySelector('.mob-events-root');
    if (!mobileEventsRoot) {
      mobileEventsRoot = document.createElement('div');
      mobileEventsRoot.className = 'mob-events-root';
      var wrap = section.querySelector('.wrap');
      var scrollCont = section.querySelector('.events-scroll-container');
      if (wrap) {
        if (scrollCont) {
          wrap.insertBefore(mobileEventsRoot, scrollCont);
        } else {
          wrap.appendChild(mobileEventsRoot);
        }
      }
    }

    var html = '';

    if (featured) {
      html += '<div class="mob-featured-wrap">' + renderFeaturedMobile(featured) + '</div>';
    }

    if (regularEvents.length === 1) {
      var evt = regularEvents[0];
      html += '<div class="mob-regular-wrap">' +
        '<div class="mob-section-label">Upcoming Events</div>' +
        '<div class="mob-event-card">' +
          '<div class="mob-event-media" data-event-id="' + esc(evt.id) + '" role="button" tabindex="0" aria-label="Preview gallery for ' + esc(evt.title) + '">' +
            '<img src="' + esc(evt.coverImage || 'images/event-placement-drive.png') + '" alt="' + esc(evt.title) + '" class="mob-event-img" loading="lazy">' +
            '<span class="mob-event-cat-badge">' + esc(evt.category) + '</span>' +
          '</div>' +
          '<div class="mob-event-card-body">' +
            '<div class="mob-event-meta"><span>&#128197; ' + esc(evt.date) + '</span><span>&#128205; ' + esc(evt.venue) + '</span></div>' +
            '<h4 class="mob-event-title">' + esc(evt.title) + '</h4>' +
            '<p class="mob-event-desc">' + esc(evt.description) + '</p>' +
            '<button type="button" class="mob-event-btn" data-event-id="' + esc(evt.id) + '"><span>View Gallery</span><span class="mob-arrow">&#8594;</span></button>' +
          '</div>' +
        '</div>' +
      '</div>';
    } else if (regularEvents.length > 1) {
      var slidesHtml = regularEvents.map(renderRegularSlide).join('');
      var dotsHtml = regularEvents.map(function (_, idx) {
        return '<button class="mob-carousel-dot' + (idx === 0 ? ' active' : '') + '" data-slide="' + idx + '" aria-label="Go to event ' + (idx + 1) + '" aria-current="' + (idx === 0 ? 'true' : 'false') + '"></button>';
      }).join('');

      html += '<div class="mob-regular-wrap">' +
        '<div class="mob-section-label">Upcoming Events</div>' +
        '<div class="mob-carousel" role="region" aria-label="Upcoming events carousel" aria-live="polite">' +
          '<div class="mob-carousel-viewport">' +
            '<div class="mob-carousel-track" id="mobEventsTrack">' + slidesHtml + '</div>' +
          '</div>' +
          '<div class="mob-carousel-dots" id="mobEventsDots" role="tablist">' + dotsHtml + '</div>' +
        '</div>' +
      '</div>';
    }

    mobileEventsRoot.innerHTML = html;

    /* Attach gallery open on all [data-event-id] inside this root */
    var btns = mobileEventsRoot.querySelectorAll('[data-event-id]');
    for (var b = 0; b < btns.length; b++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-event-id');
          if (id) openGallery(id);
        });
        btn.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            var id = btn.getAttribute('data-event-id');
            if (id) openGallery(id);
          }
        });
      })(btns[b]);
    }

    if (regularEvents.length > 1) {
      carouselTrack = document.getElementById('mobEventsTrack');
      dotContainer = document.getElementById('mobEventsDots');
      carouselIndex = 0;
      if (carouselTrack) attachSwipe(carouselTrack);

      var dots = dotContainer ? dotContainer.querySelectorAll('.mob-carousel-dot') : [];
      for (var d = 0; d < dots.length; d++) {
        (function (dot) {
          dot.addEventListener('click', function () {
            var idx = parseInt(dot.getAttribute('data-slide')) || 0;
            stopTimer();
            goToSlide(idx);
            setTimeout(startTimer, 1000);
          });
        })(dots[d]);
      }
      startTimer();
    }

    carouselInitialized = true;
  };

  const destroyMobileEvents = () => {
    stopTimer();
    var root = document.querySelector('.mob-events-root');
    if (root) root.innerHTML = '';
    carouselInitialized = false;
    carouselIndex = 0;
    regularEvents = [];
    carouselTrack = null;
    dotContainer = null;
  };

  /* ==========================================================================
     2. DEPARTMENT HORIZONTAL SCROLL-SNAP
     ========================================================================== */

  const initDeptScrollCarousel = () => {
    var grid = document.querySelector('.programs-grid');
    if (!grid) return;
    if (grid.classList.contains('mob-dept-scroll')) return;

    var scrollWrap = document.createElement('div');
    scrollWrap.className = 'mob-dept-scroll-wrap';
    grid.parentNode.insertBefore(scrollWrap, grid);
    grid.classList.add('mob-dept-scroll');
    scrollWrap.appendChild(grid);
  };

  const destroyDeptScrollCarousel = () => {
    var grid = document.querySelector('.programs-grid.mob-dept-scroll');
    var wrap = document.querySelector('.mob-dept-scroll-wrap');
    if (!grid || !wrap) return;
    wrap.parentNode.insertBefore(grid, wrap);
    wrap.remove();
    grid.classList.remove('mob-dept-scroll');
  };

  /* ==========================================================================
     3. RESPONSIVE LIFECYCLE
     ========================================================================== */

  var lastIsMobile = null;

  const syncCarousels = () => {
    var mobile = isMobile();
    if (mobile === lastIsMobile) return;
    lastIsMobile = mobile;

    if (mobile) {
      setTimeout(function () {
        buildMobileEvents();
        initDeptScrollCarousel();
      }, 120);
    } else {
      destroyMobileEvents();
      destroyDeptScrollCarousel();
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    syncCarousels();

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(syncCarousels, 150);
    });

    window.addEventListener('storage', function (e) {
      if (e.key === 'podhigai_events' && isMobile()) {
        destroyMobileEvents();
        setTimeout(buildMobileEvents, 80);
      }
    });

    window.addEventListener('podhigai:eventsUpdated', function () {
      if (isMobile()) {
        destroyMobileEvents();
        setTimeout(buildMobileEvents, 80);
      }
    });
  });

  window.addEventListener('pagehide', stopTimer);
  window.addEventListener('beforeunload', stopTimer);

})();
