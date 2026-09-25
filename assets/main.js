/* ==========================================================================
   PODHIGAI COLLEGE OF ENGINEERING & TECHNOLOGY
   Main JavaScript Layer — Navigation, Gallery, Alive AI Robot, Reviews & FAQ
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* --------------------------------------------------------------------------
     0. UNIFIED API BASE RESOLVER (Local Development & Production)
     -------------------------------------------------------------------------- */
  const API_BASE = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? 'http://localhost:3001/api'
    : 'https://podhigai-backend.onrender.com/api';

  /* --------------------------------------------------------------------------
     1. STICKY NAVIGATION & MOBILE DRAWER
     -------------------------------------------------------------------------- */
  const navHeader = document.querySelector('header.nav');
  const mobileToggle = document.getElementById('mobileToggle');
  const mobileDrawer = document.getElementById('mobileDrawer');

  const handleScroll = () => {
    if (window.scrollY > 20) {
      navHeader?.classList.add('scrolled');
    } else {
      navHeader?.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  if (mobileToggle && mobileDrawer) {
    // Ensure mobile drawer backdrop exists
    let drawerBackdrop = document.querySelector('.mobile-drawer-backdrop');
    if (!drawerBackdrop) {
      drawerBackdrop = document.createElement('div');
      drawerBackdrop.className = 'mobile-drawer-backdrop';
      document.body.appendChild(drawerBackdrop);
    }

    const openDrawer = () => {
      const navH = navHeader ? navHeader.offsetHeight : 80;
      mobileDrawer.style.top = `${navH}px`;
      mobileDrawer.style.maxHeight = `calc(100vh - ${navH}px)`;
      mobileDrawer.style.overflowY = 'auto';
      mobileDrawer.classList.add('open');
      mobileToggle.setAttribute('aria-expanded', 'true');
      drawerBackdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
    };

    const closeDrawer = () => {
      mobileDrawer.classList.remove('open');
      mobileToggle.setAttribute('aria-expanded', 'false');
      drawerBackdrop.classList.remove('active');
      document.body.style.overflow = '';
    };

    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = mobileDrawer.classList.contains('open');
      if (isOpen) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });

    drawerBackdrop.addEventListener('click', closeDrawer);

    // Close when clicking outside drawer or toggle
    document.addEventListener('click', (e) => {
      if (mobileDrawer.classList.contains('open')) {
        if (!mobileDrawer.contains(e.target) && !mobileToggle.contains(e.target)) {
          closeDrawer();
        }
      }
    });

    // Close when clicking any link inside drawer
    mobileDrawer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        closeDrawer();
      });
    });

    // Restore scroll and close drawer if resized above tablet breakpoint (> 1024px)
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1024 && mobileDrawer.classList.contains('open')) {
        closeDrawer();
      }
    });
  }

  /* --------------------------------------------------------------------------
     1.1 SEARCH FUNCTIONALITY
     -------------------------------------------------------------------------- */
  const searchIndex = [
    { title: 'B.E. Computer Science & Engineering (CSE)', sub: 'Academic Program, Labs & Careers', url: 'departments/cse.html', keywords: 'computer cse software coding ai labs b.e. programming algorithms cloud linux java python' },
    { title: 'B.Tech Information Technology (IT)', sub: 'Full-Stack, Cloud Hub & Cybersecurity', url: 'departments/it.html', keywords: 'information technology it cloud web development deepakaran full-stack cybersecurity react node' },
    { title: 'B.Tech AI & Data Science (AI & DS)', sub: 'Machine Learning & Big Data Labs', url: 'departments/aids.html', keywords: 'ai ds data science machine learning python ai&ds deep learning artificial intelligence neural' },
    { title: 'B.E. Electronics & Communication (ECE)', sub: 'Embedded Systems & VLSI Design', url: 'departments/ece.html', keywords: 'electronics ece communication vlsi embedded microcontrollers 5g iot signal processing' },
    { title: 'B.E. Electrical & Electronics (EEE)', sub: 'Power Systems, EV & Renewable Energy', url: 'departments/eee.html', keywords: 'electrical eee power grid circuits solar electric vehicle renewable energy automation plc' },
    { title: 'B.E. Mechanical Engineering', sub: 'CAD/CAM & Industrial Robotics Workshop', url: 'departments/mech.html', keywords: 'mechanical mech workshop cad cam robotics automation cnc thermal solidworks ansys' },
    { title: 'Admissions 2025–2026 & TNEA Counselling', sub: 'TNEA Code 1525, Cutoff & Eligibility', url: 'contact.html', keywords: 'admission admissions tnea 1525 apply eligibility cutoff documents lateral entry quota counselling 12th marks' },
    { title: 'Fees Structure & Government Scholarships', sub: 'First Graduate, SC/ST, BC/MBC & 7.5% Quota', url: 'contact.html', keywords: 'fees tuition fee structure scholarship first graduate post matric 7.5 concession cost financial aid' },
    { title: 'Training & Placements Cell', sub: '100% Placement Support, Recruiters & Training', url: 'placements.html', keywords: 'placement placements job package salary tcs wipro infosys recruit careers interview internship zoho' },
    { title: 'Residential Hostels & Dining Mess', sub: 'Separate Boys & Girls Hostels, Wi-Fi & Food', url: 'campus.html', keywords: 'hostel hostels mess food residential dining rooms boys girls warden stay accommodation' },
    { title: 'College Bus Fleet & Transit Routes', sub: 'Tirupattur, Vaniyambadi, Jolarpettai & Nearby', url: 'campus.html', keywords: 'bus transport fleet routes commute travel vaniyambadi jolarpettai tirupattur pickup transit natrampalli' },
    { title: 'Campus Life, Library & Facilities', sub: 'Central Digital Library, Wi-Fi, Sports & Canteen', url: 'campus.html', keywords: 'campus facilities library digital library wifi classrooms cafeteria sports canteen clinic smart class' },
    { title: 'Student Clubs & Student Activities', sub: 'Coding Club, Robotics, NSS, YRC & Sports', url: 'campus.html', keywords: 'clubs coding club robotics nss rotaract yrc activities sports student life societies' },
    { title: 'Campus Events & Technical Symposia', sub: 'TechNova, Hackathons, Workshops & Cultural Fest', url: 'index.html#events', keywords: 'events upcoming technova symposium hackathon workshop cultural sangamam expo competition' },
    { title: 'About Podhigai College', sub: 'Vision, Mission, Leadership & Chairman KC Ezhilarasan', url: 'about.html', keywords: 'about history principal chairman leadership ezhilarasan trust vision mission aicte anna university' },
    { title: 'Frequently Asked Questions (FAQ)', sub: 'Anna University Regulations, Cutoffs & Rules', url: 'faq.html', keywords: 'faq questions anna university cutoffs timing rules eligibility counselling' },
    { title: 'Student Services, Exams & Academic Cell', sub: 'Certificates, Attendance (75%), Results & ID Card', url: 'faq.html', keywords: 'student services bonafide transfer certificate tc conduct id card attendance exam marks results hall ticket' },
    { title: 'Contact & Campus Location', sub: 'Salem Main Road, Tirupattur — 635 601', url: 'contact.html', keywords: 'contact phone email address location tirupattur map directions helpline whatsapp timing' }
  ];

  const searchInput = document.getElementById('siteSearchInput');
  const searchDropdown = document.getElementById('searchResultsDropdown');
  const mobileSearchInput = document.getElementById('mobileSearchInput');

  const escapeHtml = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const performSearch = (query, dropdownEl) => {
    if (!dropdownEl) return;
    const q = query.trim().toLowerCase();
    if (!q) {
      dropdownEl.classList.remove('active');
      dropdownEl.innerHTML = '';
      return;
    }

    const matches = searchIndex.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.sub.toLowerCase().includes(q) ||
      item.keywords.toLowerCase().includes(q)
    );

    if (matches.length === 0) {
      dropdownEl.innerHTML = `
        <div style="padding: 12px 16px; font-size: 0.8125rem; color: #64748B; text-align: center;">
          No matching programs or pages found for "<strong>${escapeHtml(query)}</strong>"
        </div>
      `;
      dropdownEl.classList.add('active');
      return;
    }

    dropdownEl.innerHTML = matches.slice(0, 6).map(item => `
      <a href="${item.url}" class="search-result-item">
        <div class="search-result-title">${escapeHtml(item.title)}</div>
        <div class="search-result-sub">${escapeHtml(item.sub)}</div>
      </a>
    `).join('');
    dropdownEl.classList.add('active');
  };

  searchInput?.addEventListener('input', (e) => performSearch(e.target.value, searchDropdown));
  searchInput?.addEventListener('focus', (e) => {
    if (e.target.value.trim()) performSearch(e.target.value, searchDropdown);
  });

  mobileSearchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = e.target.value.trim().toLowerCase();
      if (!q) return;
      const match = searchIndex.find(item =>
        item.title.toLowerCase().includes(q) ||
        item.keywords.toLowerCase().includes(q) ||
        item.sub.toLowerCase().includes(q)
      );
      if (match) window.location.href = match.url;
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#navSearchBox')) {
      searchDropdown?.classList.remove('active');
    }
  });

  /* --------------------------------------------------------------------------
     2. FAQ ACCORDION
     -------------------------------------------------------------------------- */
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question, .faq-q');
    const answer = item.querySelector('.faq-answer, .faq-a');
    if (!question || !answer) return;
    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      faqItems.forEach(fi => {
        fi.classList.remove('open');
        const qBtn = fi.querySelector('.faq-question, .faq-q');
        if (qBtn) qBtn.setAttribute('aria-expanded', 'false');
        const fa = fi.querySelector('.faq-answer, .faq-a');
        if (fa) fa.style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add('open');
        question.setAttribute('aria-expanded', 'true');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  /* --------------------------------------------------------------------------
     3. ANIMATED STAT COUNTERS (IntersectionObserver)
     -------------------------------------------------------------------------- */
  const animateCounter = (el) => {
    if (el.getAttribute('data-animated')) return;
    el.setAttribute('data-animated', 'true');
    const target = parseFloat(el.getAttribute('data-target')) || 0;
    let suffix = el.getAttribute('data-suffix') || '';
    const prefix = el.getAttribute('data-prefix') || '';
    if (!suffix && el.textContent.includes('+')) suffix = '+';
    if (!suffix && el.textContent.includes('%')) suffix = '%';
    const duration = 1600;
    const startTime = performance.now();
    const easeOutQuart = t => 1 - Math.pow(1 - t, 4);

    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = Math.floor(easeOutQuart(progress) * target);
      el.textContent = prefix + current + suffix;
      if (progress < 1) requestAnimationFrame(update);
      else el.textContent = prefix + target + suffix;
    };
    requestAnimationFrame(update);
  };

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.counter[data-target], .count-up[data-target]').forEach(el => {
    let suffix = el.getAttribute('data-suffix') || '';
    if (!suffix && el.textContent.includes('+')) suffix = '+';
    if (!suffix && el.textContent.includes('%')) suffix = '%';
    el.textContent = (el.getAttribute('data-prefix') || '') + '0' + suffix;
    counterObserver.observe(el);
  });

  /* --------------------------------------------------------------------------
     4. SCROLL REVEALS
     -------------------------------------------------------------------------- */
  const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach(el => revealObserver.observe(el));

  /* --------------------------------------------------------------------------
     5. DYNAMIC ADMIN-MANAGED CAMPUS GALLERY & LIGHTBOX SYSTEM
     -------------------------------------------------------------------------- */
  const GALLERY_STORAGE_KEY = 'podhigai_gallery';
  const API_GALLERY_ENDPOINT = `${API_BASE}/gallery`;

  const DEFAULT_CAMPUS_GALLERY = [
    {
      id: 'photo_1',
      title: 'Main Academic Complex',
      caption: 'Smart Lecture Halls & Central Quadrangle',
      category: 'campus',
      imageUrl: 'images/gallery-academic-complex.png',
      size: 'large',
      order: 1
    },
    {
      id: 'photo_2',
      title: 'Computing Center',
      caption: 'High-Speed AI & Software Workstations',
      category: 'labs',
      imageUrl: 'images/gallery-computing-lab.png',
      size: 'normal',
      order: 2
    },
    {
      id: 'photo_3',
      title: 'AI Research Lab',
      caption: 'GPU Accelerated Deep Learning Cluster',
      category: 'labs',
      imageUrl: 'images/gallery-ai-research-lab.png',
      size: 'normal',
      order: 3
    },
    {
      id: 'photo_4',
      title: 'Campus Aerial View',
      caption: 'Scenic Landscape along Salem Main Road',
      category: 'campus',
      imageUrl: 'images/gallery-campus-landscape.png',
      size: 'normal',
      order: 4
    },
    {
      id: 'photo_5',
      title: 'IT Innovation Hub',
      caption: 'Cloud Computing & Hackathon Workspace',
      category: 'life',
      imageUrl: 'images/gallery-it-innovation-hub.png',
      size: 'normal',
      order: 5
    },
    {
      id: 'photo_6',
      title: 'Mechanical Workshops',
      caption: 'CNC Machines, CAD/CAM & Robotics Arenas',
      category: 'labs',
      imageUrl: 'images/gallery-mech-workshop.png',
      size: 'normal',
      order: 6
    },
    {
      id: 'photo_7',
      title: 'TechNova National Symposium',
      caption: 'Inter-Collegiate Technical Convergence & Paper Presentations',
      category: 'events',
      imageUrl: 'images/event-technova-symposium.png',
      size: 'large',
      order: 7
    },
    {
      id: 'photo_8',
      title: 'Podhigai Sangamam Cultural Fest',
      caption: 'Music, Arts, Dance & Theatrical Celebrations',
      category: 'life',
      imageUrl: 'images/event-cultural-fest.png',
      size: 'normal',
      order: 8
    },
    {
      id: 'photo_9',
      title: 'Administrative Block & Admissions Office',
      caption: 'Student Support, Academic Counselling & Enquiries',
      category: 'campus',
      imageUrl: 'images/about-aerial-campus.png',
      size: 'normal',
      order: 9
    },
    {
      id: 'photo_10',
      title: 'Annual Placement Felicitation Day',
      caption: 'Honoring Tier-1 IT & Core Recruiters Placements',
      category: 'events',
      imageUrl: 'images/event-placement-drive.png',
      size: 'normal',
      order: 10
    },
    {
      id: 'photo_11',
      title: 'University Sports Complex & Grounds',
      caption: 'Cricket, Volleyball, Athletic Tracks & Indoor Games',
      category: 'life',
      imageUrl: 'images/hero-student-life.png',
      size: 'normal',
      order: 11
    },
    {
      id: 'photo_12',
      title: 'Robotics & Automation Arena',
      caption: 'Autonomous Drone Obstacle & Robo-Wars Arena',
      category: 'labs',
      imageUrl: 'images/event-robowar-mech-expo.png',
      size: 'normal',
      order: 12
    },
    {
      id: 'photo_13',
      title: 'B.Tech IT Innovation Studio',
      caption: 'Full-Stack Web, Mobile Apps & Cloud Architecture Labs',
      category: 'programs',
      imageUrl: 'images/dept-it.png',
      size: 'normal',
      order: 13
    },
    {
      id: 'photo_14',
      title: 'Central Digital Library & Reading Hall',
      caption: 'Over 25,000+ Engineering Volumes & IEEE E-Journals',
      category: 'campus',
      imageUrl: 'images/hero-campus-entrance.png',
      size: 'normal',
      order: 14
    },
    {
      id: 'photo_15',
      title: 'Electrical & Electronics Engineering Lab',
      caption: 'Power Systems, Renewable Energy & EV Technology Labs',
      category: 'labs',
      imageUrl: 'images/dept-eee.png',
      size: 'normal',
      order: 15
    },
    {
      id: 'photo_16',
      title: 'Annual Graduation & Degree Convocation',
      caption: 'Anna University Degree Awarding & Distinguished Alumni Felicitations',
      category: 'graduation',
      imageUrl: 'images/gallery-academic-complex.png',
      size: 'large',
      order: 16
    },
    {
      id: 'photo_17',
      title: 'B.Tech AI & Data Science Workstations',
      caption: 'Python, Neural Networks, PyTorch & GPU Workstations',
      category: 'programs',
      imageUrl: 'images/dept-aids.png',
      size: 'normal',
      order: 17
    }
  ];

  const DELETED_PHOTOS_KEY = 'podhigai_deleted_photos';

  const getDeletedPhotoIds = () => {
    try {
      const raw = localStorage.getItem(DELETED_PHOTOS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const getCampusGalleryPhotos = () => {
    let result = [];
    try {
      const stored = localStorage.getItem(GALLERY_STORAGE_KEY);
      if (stored) {
        let parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          result = parsed;
        } else {
          result = DEFAULT_CAMPUS_GALLERY;
        }
      } else {
        result = DEFAULT_CAMPUS_GALLERY;
      }
    } catch {
      result = DEFAULT_CAMPUS_GALLERY;
    }
    // Sort strictly by admin sequence order (1, 2, 3...)
    result.sort((a, b) => (Number(a.order) || 999) - (Number(b.order) || 999));
    return result;
  };

  const galleryGrid = document.getElementById('campusGalleryGrid');
  const galleryTabs = document.querySelectorAll('.gallery-tab');
  const galleryMoreWrap = document.getElementById('galleryMoreWrap');
  const galleryMoreBtn = document.getElementById('galleryMoreBtn');
  const lightbox = document.getElementById('galleryLightbox');

  const INITIAL_VISIBLE_PHOTOS = 18;
  let isGalleryExpanded = false;
  let activeGallerySubset = [];
  let currentLbIndex = 0;

  // Background fetch to keep local storage in sync with MongoDB server
  const syncGalleryFromApi = async () => {
    try {
      const res = await fetch(API_GALLERY_ENDPOINT, {
        headers: { 'Cache-Control': 'no-cache, no-store' },
        cache: 'no-store',
        signal: AbortSignal.timeout ? AbortSignal.timeout(15000) : undefined
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.photos)) {
          localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(data.photos));
          renderCampusGallery();
        }
      }
    } catch (e) {
      // Offline or network timeout, gracefully stays with localStorage
    }
  };

  // Cross-tab auto-sync: when admin adds or deletes a photo in another tab, update immediately
  window.addEventListener('storage', (e) => {
    if (e.key === GALLERY_STORAGE_KEY || e.key === DELETED_PHOTOS_KEY) {
      renderCampusGallery();
    }
  });

  // In-tab event listener from admin mutations
  window.addEventListener('podhigai:galleryUpdated', () => {
    syncGalleryFromApi();
  });

  const renderCampusGallery = () => {
    if (!galleryGrid) return;

    const activeTab = document.querySelector('.gallery-tab.active');
    const filterCat = activeTab ? (activeTab.getAttribute('data-gallery-filter') || activeTab.getAttribute('data-cat') || 'all').toLowerCase() : 'all';

    const allPhotos = getCampusGalleryPhotos();
    const matching = (filterCat === 'all')
      ? allPhotos
      : allPhotos.filter(p => (p.category || '').toLowerCase() === filterCat);

    activeGallerySubset = matching;

    // View More Button Handling (5-photo initial limit)
    if (galleryMoreWrap && galleryMoreBtn) {
      const moreText = galleryMoreBtn.querySelector('.gallery-more-text');
      if (matching.length <= INITIAL_VISIBLE_PHOTOS) {
        galleryMoreWrap.style.display = 'none';
      } else {
        galleryMoreWrap.style.display = 'flex';
        if (isGalleryExpanded) {
          galleryMoreBtn.classList.add('is-expanded');
          galleryMoreBtn.setAttribute('aria-expanded', 'true');
          if (moreText) moreText.textContent = 'Show Less';
        } else {
          galleryMoreBtn.classList.remove('is-expanded');
          galleryMoreBtn.setAttribute('aria-expanded', 'false');
          if (moreText) moreText.textContent = 'View More Photos';
        }
      }
    }

    if (matching.length === 0) {
      galleryGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 48px 20px; color: var(--text-muted);">
          <div style="font-size: 2.5rem; margin-bottom: 12px;">🖼️</div>
          <p style="font-size: 1rem; font-weight: 600; color: var(--navy-900); margin-bottom: 4px;">No photos available in this category yet.</p>
          <p style="font-size: 0.875rem;">Photos uploaded through the Admin Portal will appear here instantly.</p>
        </div>
      `;
      return;
    }

    const visiblePhotos = isGalleryExpanded ? matching : matching.slice(0, INITIAL_VISIBLE_PHOTOS);

    galleryGrid.innerHTML = visiblePhotos.map((photo, idx) => {
      const isLarge = photo.size === 'large';
      const isNewlyExpanded = isGalleryExpanded && idx >= INITIAL_VISIBLE_PHOTOS;
      return `
        <div class="gallery-item ${isLarge ? 'large' : ''} ${isNewlyExpanded ? 'gallery-fade-in' : ''}" data-category="${escapeHtml(photo.category || 'campus')}" data-index="${idx}" tabindex="0" role="button" aria-label="View photo: ${escapeHtml(photo.title)}">
          <img src="${escapeHtml(photo.imageUrl || 'images/gallery-academic-complex.png')}" alt="${escapeHtml(photo.title)}" loading="lazy" class="gallery-img">
          <div class="gallery-caption">
            <h5>${escapeHtml(photo.title)}</h5>
            ${photo.caption ? `<span>${escapeHtml(photo.caption)}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');

    // Attach click listeners to open lightbox
    galleryGrid.querySelectorAll('.gallery-item').forEach((item, idx) => {
      item.addEventListener('click', () => openPhotoLightbox(idx));
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openPhotoLightbox(idx);
        }
      });
    });
  };

  // Lightbox Implementation
  const openPhotoLightbox = (index) => {
    if (!lightbox || !activeGallerySubset.length) return;
    currentLbIndex = (index >= 0 && index < activeGallerySubset.length) ? index : 0;
    updateLightboxUI();
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closePhotoLightbox = () => {
    if (!lightbox) return;
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  };

  const updateLightboxUI = () => {
    if (!lightbox || !activeGallerySubset.length) return;
    const photo = activeGallerySubset[currentLbIndex];
    const lbImg = lightbox.querySelector('.lightbox-img');
    const lbTitle = lightbox.querySelector('.lightbox-title');
    const lbCounter = lightbox.querySelector('.lightbox-counter');

    if (lbImg) {
      lbImg.src = photo.imageUrl || 'images/gallery-academic-complex.png';
      lbImg.alt = photo.title || 'Campus photo preview';
    }
    if (lbTitle) {
      lbTitle.textContent = photo.title + (photo.caption ? ` — ${photo.caption}` : '');
    }
    if (lbCounter) {
      lbCounter.textContent = `${currentLbIndex + 1} of ${activeGallerySubset.length}`;
    }
  };

  const lbGoNext = () => {
    if (!activeGallerySubset.length) return;
    currentLbIndex = (currentLbIndex + 1) % activeGallerySubset.length;
    updateLightboxUI();
  };

  const lbGoPrev = () => {
    if (!activeGallerySubset.length) return;
    currentLbIndex = (currentLbIndex - 1 + activeGallerySubset.length) % activeGallerySubset.length;
    updateLightboxUI();
  };

  if (lightbox) {
    const lbCloseBtn = lightbox.querySelector('.lightbox-close');
    const lbPrevBtn = lightbox.querySelector('.lightbox-prev');
    const lbNextBtn = lightbox.querySelector('.lightbox-next');

    lbCloseBtn?.addEventListener('click', closePhotoLightbox);
    lbPrevBtn?.addEventListener('click', lbGoPrev);
    lbNextBtn?.addEventListener('click', lbGoNext);

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closePhotoLightbox();
    });

    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') closePhotoLightbox();
      if (e.key === 'ArrowRight') lbGoNext();
      if (e.key === 'ArrowLeft') lbGoPrev();
    });
  }

  // Category Tab Click Handlers
  if (galleryTabs.length) {
    galleryTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        galleryTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        isGalleryExpanded = false;
        renderCampusGallery();
        const scrollContainer = document.getElementById('galleryScrollContainer');
        if (scrollContainer) scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  // View More Photos Button Handler
  if (galleryMoreBtn) {
    galleryMoreBtn.addEventListener('click', () => {
      isGalleryExpanded = !isGalleryExpanded;
      const scrollContainer = document.getElementById('galleryScrollContainer');
      if (scrollContainer) {
        scrollContainer.classList.toggle('expanded', isGalleryExpanded);
        if (!isGalleryExpanded) {
          scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
      renderCampusGallery();

      if (!isGalleryExpanded) {
        const gallerySec = document.getElementById('gallery');
        if (gallerySec) {
          gallerySec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  }

  // Initial gallery render & background API sync
  renderCampusGallery();
  syncGalleryFromApi();

  /* --------------------------------------------------------------------------
     SHARED EVENT DATA STORE & RETRIEVER (Dynamic Chatbot & Event Grid)
     -------------------------------------------------------------------------- */
  const EVENTS_STORAGE_KEY = 'podhigai_events';

  const DEFAULT_EVENTS = [
    {
      id: 'evt_1',
      title: 'TechNova 2026: National Level Technical Symposium & Project Expo',
      date: 'October 15, 2026',
      time: '09:30 AM – 04:30 PM',
      venue: 'Main Academic Block & APJ Auditorium',
      category: 'Symposium',
      description: 'A prestigious inter-collegiate technical convergence featuring paper presentations, AI hackathons, robotics challenges, code-debugging showdowns, and cash awards for engineering innovators.',
      featured: true,
      published: true,
      coverImage: 'images/event-technova-symposium.png',
      gallery: ['images/event-technova-symposium.png', 'images/gallery-computing-lab.png', 'images/gallery-ai-research-lab.png', 'images/gallery-it-innovation-hub.png']
    },
    {
      id: 'evt_2',
      title: 'Annual Placement Day & Corporate Recruiters Felicitation 2026',
      date: 'November 04, 2026',
      time: '10:00 AM – 02:00 PM',
      venue: 'Central Seminar Hall',
      category: 'Placement',
      description: 'Honoring placed graduates across Tier-1 Tech Giants including TCS, Wipro, Infosys, Zoho, Cognizant, and HCL with corporate appointment orders.',
      featured: false,
      published: true,
      coverImage: 'images/event-placement-drive.png',
      gallery: ['images/event-placement-drive.png', 'images/hero-student-life.png', 'images/about-aerial-campus.png']
    },
    {
      id: 'evt_3',
      title: 'National Workshop on Edge Computing & Generative AI Systems',
      date: 'December 12, 2026',
      time: '09:00 AM – 04:00 PM',
      venue: 'Advanced Computing Lab (IT Block)',
      category: 'Workshop',
      description: 'Hands-on industrial masterclass on training large language models on edge devices, real-time IoT computer vision pipelines, and full-stack cloud AI deployment.',
      featured: false,
      published: true,
      coverImage: 'images/event-ai-cloud-workshop.png',
      gallery: ['images/event-ai-cloud-workshop.png', 'images/dept-it.png', 'images/dept-aids.png']
    }
    // Add new upcoming events here when confirmed by the Events / Student Affairs Office.
  ];

  const getEvents = () => {
    try {
      const stored = localStorage.getItem(EVENTS_STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(DEFAULT_EVENTS));
        return DEFAULT_EVENTS;
      }
      let parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.filter(e => e.published !== false);
      }
      return DEFAULT_EVENTS;
    } catch {
      return DEFAULT_EVENTS;
    }
  };

  let currentEvents = getEvents();
  const INITIAL_EVENT_COUNT = 4;

  /* --------------------------------------------------------------------------
     6. SIGNATURE ALIVE ROBOT AI CAMPUS ASSISTANT (INTELLIGENT KNOWLEDGE ENGINE)
     -------------------------------------------------------------------------- */
  const robotDock = document.getElementById('robotDock');
  const chatWindow = document.getElementById('chatWindow');
  const chatClose = document.getElementById('chatClose');
  const chatInput = document.getElementById('chatInputField');
  const chatSend = document.getElementById('chatSendBtn');
  const chatBody = document.getElementById('chatBody');
  const robotTooltip = document.getElementById('robotTooltip');
  const tooltipTitle = document.getElementById('tooltipTitle');
  const tooltipSub = document.getElementById('tooltipSub');
  const robotPing = document.getElementById('robotPing');
  const chatBackdrop = document.getElementById('chatBackdrop');

  // Dynamic Page Link Helper
  const isDeptPage = window.location.pathname.includes('/departments/') ||
    window.location.pathname.endsWith('/cse.html') ||
    window.location.pathname.endsWith('/it.html') ||
    window.location.pathname.endsWith('/aids.html') ||
    window.location.pathname.endsWith('/ece.html') ||
    window.location.pathname.endsWith('/eee.html') ||
    window.location.pathname.endsWith('/mech.html');

  const getPageLink = (relativePath) => {
    if (!isDeptPage) return relativePath;
    if (relativePath.startsWith('departments/')) {
      return relativePath.replace('departments/', '');
    }
    return '../' + relativePath;
  };

  const tooltipPrompts = [
    { title: '✦ Podhigai AI', sub: 'Hi! How can I help you today?' },
    { title: '🎓 Admissions Open', sub: 'TNEA Counselling Code: 1525' },
    { title: '🎯 100% Placements', sub: 'Ask about recruiters & packages' },
    { title: '💡 Explore Programs', sub: '6 B.E. & B.Tech Degrees' }
  ];

  let promptIdx = 0;
  let tipTimer = null;

  const showTooltip = (title, sub) => {
    if (!robotTooltip || chatWindow?.classList.contains('open')) return;
    if (tooltipTitle) tooltipTitle.textContent = title;
    if (tooltipSub) tooltipSub.textContent = sub;
    robotTooltip.classList.remove('robot-tooltip--hidden');
  };

  const hideTooltip = () => {
    robotTooltip?.classList.add('robot-tooltip--hidden');
  };

  const cyclePrompts = () => {
    if (chatWindow?.classList.contains('open')) return;
    const current = tooltipPrompts[promptIdx];
    showTooltip(current.title, current.sub);
    promptIdx = (promptIdx + 1) % tooltipPrompts.length;

    tipTimer = setTimeout(() => {
      hideTooltip();
      tipTimer = setTimeout(cyclePrompts, 6500);
    }, 4000);
  };

  // Start prompt cycle after 3.5s
  setTimeout(() => cyclePrompts(), 3500);

  // Hover reactions
  robotDock?.addEventListener('mouseenter', () => {
    clearTimeout(tipTimer);
    showTooltip('✦ Podhigai AI', 'Click to open Campus Assistant →');
  });

  robotDock?.addEventListener('mouseleave', () => {
    hideTooltip();
    tipTimer = setTimeout(cyclePrompts, 5000);
  });

  // Cursor Proximity Eye Tracking & 3D Parallax Tilt
  document.addEventListener('mousemove', (e) => {
    if (!robotDock) return;
    const rect = robotDock.getBoundingClientRect();
    const dockCenterX = rect.left + rect.width / 2;
    const dockCenterY = rect.top + rect.height / 2;
    const dx = e.clientX - dockCenterX;
    const dy = e.clientY - dockCenterY;
    const distance = Math.hypot(dx, dy);

    const pupils = document.querySelectorAll('.robot-pupil');
    const bodyGroup = document.querySelector('.robot-body-group');

    if (distance < 380) {
      const maxShift = 3.0;
      const shiftX = (dx / distance) * maxShift;
      const shiftY = (dy / distance) * maxShift;
      pupils.forEach(p => {
        p.style.transform = `translate(${shiftX.toFixed(2)}px, ${shiftY.toFixed(2)}px)`;
      });

      if (bodyGroup) {
        bodyGroup.style.transformOrigin = '50px 50px';
      }
    } else {
      pupils.forEach(p => {
        p.style.transform = 'translate(0px, 0px)';
      });
    }
  });

  // Chat window open/close
  const openChat = () => {
    chatWindow?.classList.add('open');
    chatBackdrop?.classList.add('visible');
    robotPing?.classList.add('hidden');
    clearTimeout(tipTimer);
    hideTooltip();
    chatInput?.focus();
    // Lock background page scroll so chatbot scroll doesn't bleed through to the website
    document.body.style.overflow = 'hidden';
  };

  const closeChat = () => {
    chatWindow?.classList.remove('open');
    chatBackdrop?.classList.remove('visible');
    // Restore background page scroll
    document.body.style.overflow = '';
    setTimeout(() => cyclePrompts(), 4000);
  };

  robotDock?.addEventListener('click', () => {
    if (chatWindow?.classList.contains('open')) {
      closeChat();
    } else {
      openChat();
    }
  });

  chatClose?.addEventListener('click', closeChat);
  chatBackdrop?.addEventListener('click', closeChat);

  /* --------------------------------------------------------------------------
     STRUCTURED VERIFIED COLLEGE KNOWLEDGE DATA STORE
     -------------------------------------------------------------------------- */
  const PODHIGAI_DATA = {
    college: {
      name: 'Podhigai College of Engineering & Technology',
      shortName: 'Podhigai College',
      // PART 2-B: Trust/founder corrected to official name per podhigaitech.ac.in (verified 2026-09-22)
      history: 'Founded in 2009 by the Kamaraj Educational Charitable Trust, Tirupattur, carrying 15+ years of engineering excellence and placement-driven education in Tirupattur, Tamil Nadu.',
      established: '2009 (15+ Years of Engineering Excellence)',
      founder: 'Kamaraj Educational Charitable Trust, Tirupattur',
      trust: 'Kamaraj Educational Charitable Trust, Tirupattur',
      // PART 2-A: chairman field — official site lists "Rtr. KC Ezhilarasan"; prefix "Rtr." added per source
      chairman: 'Rtr. KC Ezhilarasan',
      principal: 'Headed by the Principal & Academic Council (Office: +91 4179 292228 / podhigaitech@gmail.com)',
      // PART 2-B: leadership text updated to reflect corrected trust name
      leadership: 'Administered under the Kamaraj Educational Charitable Trust, Tirupattur, led by Chairman Rtr. KC Ezhilarasan, the Principal, distinguished academic leaders, seasoned professors, and industry-oriented faculty.',
      affiliation: 'Affiliated to Anna University, Chennai — adhering strictly to its curriculum, academic regulations, and examination standards.',
      aicte: 'Approved by the All India Council for Technical Education (AICTE), New Delhi for all 6 undergraduate engineering degree programs.',
      accreditation: 'AICTE Approved & Anna University Affiliated Institution, with statutory Mandatory Disclosures published transparently.',
      autonomy: 'Affiliated Non-Autonomous Institution under Anna University, Chennai.',
      tneaCode: '1525',
      collegeCode: '1525',
      // PART 2-D: TODO — Pincode conflict on official site itself:
      //   Page footer uses "635 601" (spaced); Contact Us page body text uses "635601" (no space).
      //   Both sources agree on the rest of the address. Please confirm the correct pincode format
      //   with the admissions office before shipping, then remove this comment.
      address: 'Salem Main Road, Adiyur, Tirupattur, Tirupattur District, Tamil Nadu — 635 601.',
      // PART 2-E: directions corrected — NH 179A and station travel times not verified on official site.
      //   TODO (Deepakaran): re-add railway-station distances only after confirming with the college.
      directions: 'Located at Adiyur, about 3 km from Tirupattur and 80 km from Vellore, on the Tirupattur–Salem road. Frequent buses stop directly in front of the college entrance.',
      mapsUrl: 'https://maps.google.com/?q=Podhigai+College+of+Engineering+and+Technology+Tirupattur',
      // PART 2-C: website corrected from podhigaitech.com to official domain podhigaitech.ac.in
      website: 'https://podhigaitech.ac.in',
      phones: {
        landline: '+91 4179 292228',
        mobile: '+91 94880 01525 / +91 94432 64228',
        email: 'podhigaitech@gmail.com'
      },
      // PART 2-F: Business hours conflict on official site —
      //   Footer (every page):  Mon–Sat  9:00 AM – 4:15 PM
      //   Placements page:      Mon–Fri  9:00 AM – 4:00 PM, Sat 10:00 AM – 2:00 PM, Sun Closed
      //   TODO (Deepakaran): Confirm the definitive office hours with the administration and update
      //   the 'office' field below before shipping. The classes/library lines are left unchanged.
      timings: {
        classes: '9:00 AM to 4:40 PM (Monday through Saturday)',
        office: 'TODO: Confirm — official site shows conflicting hours (Mon–Sat 9 AM–4:15 PM vs Mon–Fri 9 AM–4 PM, Sat 10 AM–2 PM). Verify with administration.',
        library: '8:30 AM to 5:30 PM (Monday through Saturday)'
      },
      vision: 'To deliver high-quality technical education, empowering youth with technical acumen, problem-solving mindset, and ethical leadership to excel in modern engineering industries.',
      mission: 'To provide state-of-the-art laboratory infrastructure, foster industry partnerships, deliver rigorous academic mentorship, and develop socially responsible, industry-ready engineering professionals.',
      values: 'Technical Rigor, Innovation, Professional Integrity, Inclusivity, and Societal Responsibility.'
    },
    departments: {
      it: {
        id: 'it',
        name: 'B.Tech Information Technology (IT)',
        short: 'B.Tech IT',
        degree: '4-Year B.Tech Degree (8 Semesters)',
        overview: 'Focuses on modern enterprise cloud software, full-stack web applications, cybersecurity protocols, data networks, distributed databases, and IoT implementations.',
        pillars: ['Enterprise Software & Cloud (AWS/Azure concepts)', 'Cybersecurity & Information Protection', 'Data Engineering, SQL & Analytics'],
        subjects: ['Cloud Computing Principles', 'Full-Stack Web Technology', 'Data Structures & Algorithms', 'Database Systems & SQL', 'Information Security & Cryptography', 'Big Data Analytics', 'Mobile Application Engineering'],
        technologies: ['Cloud Platforms (AWS, Azure, GCP)', 'Full-Stack Web (React, Node.js, Express)', 'SQL & NoSQL Databases (MySQL, MongoDB)', 'Docker & DevOps CI/CD', 'Cybersecurity Tools (Wireshark, Cryptography suites)', 'REST APIs & Microservices'],
        labs: 'Advanced Cloud Computing Labs, Full-Stack Innovation Hub, High-Speed Programming Suites, Software Testing Sandbox.',
        careers: ['Software Development Engineer (SDE)', 'Cloud Solutions Architect', 'Full Stack Developer', 'Cybersecurity Analyst', 'Database Engineer'],
        higherStudies: 'M.Tech / M.E. in Information Technology or Software Engineering, MS in Computer Science abroad, MBA in Technology Management.',
        url: 'departments/it.html'
      },
      aids: {
        id: 'aids',
        name: 'B.Tech Artificial Intelligence & Data Science (AI & DS)',
        short: 'B.Tech AI & DS',
        degree: '4-Year B.Tech Degree (8 Semesters)',
        overview: 'Provides deep mathematical and algorithmic foundations in machine learning, deep neural networks, computer vision, natural language processing, and big data engineering.',
        pillars: ['Machine Learning & Deep Neural Models', 'Statistical Analytics & Data Visualization', 'Computer Vision, NLP & LLM Integration'],
        subjects: ['Machine Learning Techniques', 'Deep Learning Architectures', 'Python for Data Science', 'Natural Language Processing (NLP)', 'Computer Vision & Image Analytics', 'Big Data Frameworks (Spark/Hadoop)', 'AI Ethics & Responsible Deployment'],
        technologies: ['Python & PyData Stack (NumPy, Pandas, Scipy)', 'Machine Learning (Scikit-Learn, XGBoost)', 'Deep Learning (TensorFlow, PyTorch, Keras)', 'Computer Vision (OpenCV)', 'NLP & LLM Architectures (HuggingFace, NLTK)', 'Big Data Tools (Apache Spark, Hadoop)'],
        labs: 'Specialized High-Performance GPU AI Research Laboratory, Data Analytics Workstations, Python Development Cluster.',
        careers: ['AI / Machine Learning Engineer', 'Data Scientist', 'Business Intelligence Analyst', 'Computer Vision Specialist', 'Data Solutions Architect'],
        higherStudies: 'M.Tech in Artificial Intelligence / Data Science, MS in Data Science & Machine Learning abroad.',
        url: 'departments/aids.html'
      },
      cse: {
        id: 'cse',
        name: 'B.E. Computer Science & Engineering (CSE)',
        short: 'B.E. CSE',
        degree: '4-Year B.E. Degree (8 Semesters)',
        overview: 'Builds foundational mastery in programming languages, data structures, algorithm complexity, operating systems, database architectures, network security, and distributed computing.',
        pillars: ['Programming & Algorithms (Java/C++)', 'Systems Architecture, OS & Networks', 'Project-Based Practical Sprints & Hackathons'],
        subjects: ['Data Structures & Algorithms', 'Object-Oriented Programming (Java/C++)', 'Database Management Systems (DBMS)', 'Operating Systems Design', 'Computer Networks & Security', 'Cloud Computing & Virtualization', 'Software Engineering & Agile'],
        technologies: ['Programming (Java, C++, Python, C)', 'Data Structures & Algorithms Complexity', 'Relational Databases (MySQL, PostgreSQL, Oracle)', 'Operating Systems (Linux/Unix, Shell Scripting)', 'Network Simulation (Cisco Packet Tracer)', 'Cloud Computing & Agile Frameworks'],
        labs: 'High-Performance Computing Laboratories, Open-Source Software Studio, Network Simulation & Security Lab.',
        careers: ['Software Development Engineer (SDE)', 'Full Stack Web Developer', 'Systems / Cloud Architect', 'Database Administrator', 'DevOps & Security Analyst'],
        higherStudies: 'M.E. / M.Tech in Computer Science & Engineering, MS in Computer Science abroad.',
        url: 'departments/cse.html'
      },
      ece: {
        id: 'ece',
        name: 'B.E. Electronics & Communication Engineering (ECE)',
        short: 'B.E. ECE',
        degree: '4-Year B.E. Degree (8 Semesters)',
        overview: 'Covers semiconductor devices, integrated circuit (VLSI) design, digital signal processing, 5G/6G wireless communications, microwave propagation, and embedded IoT architectures.',
        pillars: ['Analog & Digital VLSI Circuits', 'Wireless, RF, Microwave & Optical Networks', 'Embedded Microcontrollers & Edge IoT'],
        subjects: ['VLSI System Design & Verilog', 'Microprocessors & Microcontrollers', 'Digital Signal Processing (DSP)', 'Analog & Digital Communications', 'Embedded Systems & IoT', 'Optical & Microwave Engineering', 'Circuit Theory'],
        technologies: ['VLSI & FPGA Design (Verilog, Cadence, Xilinx Vivado)', 'Microcontrollers & Embedded C (ARM, 8051, PIC, Arduino)', 'Signal & Image Processing (MATLAB & Simulink)', 'RF, Microwave & Optical Simulation Tools', 'IoT Protocols (MQTT, Zigbee, BLE, LoRa)'],
        labs: 'Microwave & Optical Lab, Microprocessors & Embedded Systems Lab, VLSI Design Lab, Digital Signal Processing Lab.',
        careers: ['VLSI Design Engineer', 'Embedded Systems & IoT Engineer', 'Telecom & Network Specialist', 'Hardware Design Engineer', 'Robotics Systems Integrator'],
        higherStudies: 'M.E. in VLSI Design / Embedded Systems, MS in Electrical & Computer Engineering.',
        url: 'departments/ece.html'
      },
      eee: {
        id: 'eee',
        name: 'B.E. Electrical & Electronics Engineering (EEE)',
        short: 'B.E. EEE',
        degree: '4-Year B.E. Degree (8 Semesters)',
        overview: 'Focuses on high-voltage power transmission, smart grids, Electric Vehicle (EV) powertrains, green renewable energy (solar/wind), power electronic converters, and industrial automation.',
        pillars: ['Power Systems & Smart Grid Automation', 'Electrical Machines & Variable Speed Drives', 'Renewable Energy & Power Electronics'],
        subjects: ['Power Systems & Smart Grids', 'Electric Vehicles (EV) Technology', 'Power Electronics & Drives', 'Renewable Energy Systems (Solar/Wind)', 'Electrical Machines & Transformers', 'Control Systems Engineering', 'Microcontrollers & Embedded C'],
        technologies: ['Power Systems Simulation (MATLAB/Simulink, PSCAD, ETAP)', 'Electric Vehicle (EV) Powertrains & Battery Systems', 'Industrial Automation (PLC, SCADA, HMI Programming)', 'Power Electronics Converters & Inverters', 'Renewable Energy Modeling (Solar PV & Wind Grids)'],
        labs: 'Power Electronics Lab, Electrical Machines Testing Lab, Control Systems Lab, Renewable Energy Simulation Lab.',
        careers: ['Power Systems Engineer', 'Electric Vehicle (EV) Specialist', 'Industrial Automation & PLC Engineer', 'Renewable Energy Consultant', 'Substation & Grid Maintenance Lead'],
        higherStudies: 'M.E. in Power Systems Engineering / Power Electronics & Drives.',
        url: 'departments/eee.html'
      },
      mech: {
        id: 'mech',
        name: 'B.E. Mechanical Engineering',
        short: 'B.E. Mechanical',
        degree: '4-Year B.E. Degree (8 Semesters)',
        overview: 'Combines solid mechanics, 3D CAD/CAM drafting, finite element analysis, thermal fluids engineering, materials science, CNC automated fabrication, and industrial robotics.',
        pillars: ['Design, 3D CAD/CAM & Finite Element Modeling', 'Applied Thermal & Fluids Engineering', 'Manufacturing Automation, CNC & Mechatronics'],
        subjects: ['CAD / CAM & Finite Element Analysis', 'Applied Thermodynamics & Thermal Power', 'Fluid Mechanics & Machinery', 'Manufacturing Technology & CNC Machining', 'Design of Machine Elements', 'Mechatronics & Industrial Robotics', 'Automotive Systems'],
        technologies: ['3D CAD/CAM (AutoCAD, SolidWorks, CATIA)', 'Finite Element Analysis (ANSYS Workbench)', 'Computer-Aided Manufacturing (Mastercam, EdgeCAM)', 'CNC Machine Programming (G-Codes & M-Codes)', 'Mechatronics, Pneumatics & Industrial Robotics'],
        labs: 'Advanced CNC Machining Workshop, Thermal Fluids Engineering Lab, Strength of Materials Lab, CAD/CAM Simulation Lab.',
        careers: ['Mechanical Design Engineer', 'Automotive Product Development Engineer', 'Production & Plant Manager', 'Robotics & Automation Specialist', 'Thermal & Energy Systems Analyst'],
        higherStudies: 'M.E. in CAD/CAM / Thermal Engineering, MS in Automotive / Robotics Engineering abroad.',
        url: 'departments/mech.html'
      }
    },
    studentServices: {
      idCard: 'Student ID cards are issued to all enrolled students by the Administrative Office during the first week of orientation. Replacement/duplicate cards can be requested at the office with an application.',
      certificates: 'Bonafide Certificates, Conduct Certificates, Transfer Certificates (TC), and Course Completion Certificates are issued by the College Administrative Office / Principal\'s Office. Students submit a request form endorsed by their Head of Department (HOD). Processing takes 1–2 working days.',
      attendance: 'As per strict Anna University regulations, students must maintain a minimum of 75% overall attendance in each semester to qualify for University Semester Examinations. Condonation (between 65% and 74%) is granted only on verified medical grounds with University approval. Attendance below 65% results in detention.',
      examCell: 'The on-campus Central Examination Cell coordinates Anna University semester examinations, distributes hall tickets, conducts internal cycle tests and model exams, and facilitates result processing.',
      results: 'Official semester exam results and grade sheets are declared by Anna University Controller of Examinations (COE) and accessible at coe1.annauniv.edu. Internal assessment scores are published on department notice boards by class advisors.',
      regulations: 'Under Anna University Affiliation (Regulation 2021), the 4-year B.E. / B.Tech degrees consist of 8 semesters with continuous internal assessments (tests, assignments, lab evaluations) and end-semester university examinations.',
      examsSchedule: 'Anna University semester examinations are conducted twice per academic year: Odd Semester (November / December) and Even Semester (April / May). Internal cycle tests and model exams precede the university exams.',
      academicCalendar: 'Class timetables and academic calendars follow Anna University semester schedules. Daily academic classes run from 9:00 AM to 4:40 PM (Monday through Saturday).',
      grievance: 'Podhigai College maintains an active Student Grievance Redressal Cell and a statutory Anti-Ragging Committee adhering to strict zero-tolerance norms under AICTE and Anna University guidelines.',
      advisors: 'Each class is mentored by a dedicated Faculty Class Advisor and Student Counselor who monitors academic progress, attendance, and student welfare.'
    },
    admissions: {
      tneaCode: '1525',
      eligibility: 'Pass in 10+2 / Higher Secondary Examination (HSC) with Physics, Chemistry, and Mathematics (PCM) as prescribed by Anna University and the Government of Tamil Nadu.',
      cutoffCalculation: 'Engineering Cutoff is calculated out of 200 marks: Mathematics (100) + Physics (50) + Chemistry (50) — formula: <code>Maths + (Physics ÷ 2) + (Chemistry ÷ 2)</code>.',
      lateralEntry: 'Direct admission into the 2nd Year (3rd Semester) for candidates holding a 3-year Polytechnic Diploma in Engineering/Technology or B.Sc Mathematics degree.',
      quotas: 'Admissions are conducted through two streams: 1) <strong>Government Quota:</strong> Single-window Anna University TNEA counselling using <strong>Code 1525</strong>; 2) <strong>Management Quota:</strong> Direct institutional admission at the campus admissions desk.',
      managementQuota: 'Direct institutional admission at the campus admissions desk for eligible candidates who passed 10+2 with PCM. Direct seat reservation with immediate counselling is available.',
      firstGraduate: 'Full tuition fee waiver supported by the Government of Tamil Nadu for candidates who are the first graduate in their family, upon submission of the Tahsildar First Graduate Certificate.',
      govtSchoolQuota: '100% free technical education covering tuition, hostel accommodation, and college bus transport under the Tamil Nadu Government 7.5% preferential reservation quota for students who studied classes 6 to 12 in Government Schools.',
      documents: [
        '10th & 12th / HSC Mark Sheets (Original & Copies)',
        'Transfer Certificate (TC) and Conduct Certificate',
        'Community Certificate (for BC / BCM / MBC / DNC / SC / SCA / ST reservations)',
        'Nativity & Income Certificate (if applying for scholarships/fee concessions)',
        'First Graduate Certificate & Joint Declaration (if eligible)',
        'TNEA Allotment Order (for counselling students)',
        'Passport-size photographs & Aadhaar Card copy',
        'Polytechnic Diploma Certificate & semester marksheets (for Lateral Entry candidates)'
      ],
      helpline: '+91 4179 292228 / +91 94880 01525',
      officeHours: 'Monday to Saturday, 9:00 AM – 5:00 PM'
    },
    fees: {
      policy: 'Tuition fees at Podhigai College are regulated transparently in accordance with the Tamil Nadu State Government Fee Fixation Committee and Anna University guidelines.',
      scholarships: [
        '<strong>First Graduate Concession:</strong> Full tuition fee discount supported by Tamil Nadu Government for eligible first-generation degree holders.',
        '<strong>Post-Matric Scholarship:</strong> Full tuition fee waiver and government support for SC, ST, SCA, and SCC students.',
        '<strong>BC / MBC Welfare Scholarship:</strong> State Government financial assistance for eligible backward class candidates.',
        '<strong>7.5% Govt School Quota:</strong> 100% free technical education (tuition, hostel, transport) for eligible Tamil Nadu Government School students.',
        '<strong>Institutional Merit Scholarships:</strong> Fee awards and incentives for high-scoring +2 meritorious students.'
      ],
      disclaimer: 'For the verified official fee schedule for your specific department and quota, please contact our campus Accounts & Admissions Office directly at <strong>+91 4179 292228</strong> or <strong>+91 94880 01525</strong>.'
    },
    placements: {
      record: '100% Placement Support with a 15+ year institutional track record and 2000+ alumni successfully placed across leading multinational corporations and core engineering sectors.',
      // PART 2-H: TODO (Deepakaran) — The recruiter names below are NOT verified against the official
      //   Placements page (podhigaitech.ac.in/placements). That page only states companies from
      //   "IT, core engineering, manufacturing, banking, fintech, logistics, and consulting" visit
      //   campus WITHOUT naming any specific company. This list may be accurate from firsthand
      //   knowledge, but must be confirmed with the Training & Placement Cell before the chatbot
      //   states it as fact to prospective students.
      //   Same applies to any placement percentage or package figures — the site's stat counters
      //   currently render as "0" placeholders (not real published numbers). Do NOT add those
      //   until Deepakaran supplies verified figures from the T&P Cell.
      recruiters: ['Tata Consultancy Services (TCS)', 'Infosys', 'Wipro', 'Zoho Corporation', 'Cognizant (CTS)', 'TVS Group', 'Accenture', 'HCL Technologies', 'Mindtree', 'Tech Mahindra'],
      trainingStages: [
        '<strong>Stage 1 — Technical & Aptitude Foundations:</strong> Quantitative aptitude, logical reasoning, data structures, and core engineering problem solving.',
        '<strong>Stage 2 — Resume & Portfolio Optimization:</strong> One-on-one resume auditing, GitHub repository reviews, and project showcase.',
        '<strong>Stage 3 — Mock Technical & HR Interviews:</strong> Simulated interview rounds with detailed performance feedback scorecards.',
        '<strong>Stage 4 — Recruiter Drives & Internships:</strong> On-campus recruitment drives hosting Tier-1 IT consulting and core manufacturing firms.'
      ]
    },
    campus: {
      // PART 3-2: campus.size added — verified on official Facilities page (2026-09-22)
      size: '45-acre green campus',
      // PART 3-2: library updated with verified volume count from official Facilities page.
      //   NOTE: "IEEE digital access" is NOT explicitly named on the Facilities page — the page
      //   mentions "national/international journals and digital learning resources" generally.
      //   TODO (Deepakaran): Confirm whether IEEE specifically is subscribed before re-adding that claim.
      library: 'Central Digital Library with 12,000+ volumes including textbooks, reference materials, and competitive-exam guides, plus national and international engineering journals, digital learning resources, and quiet study cubicles (Open: 09:30 AM – 04:00 PM).',
      wifi: 'Campus-wide high-speed Wi-Fi network accessible across all academic departments, digital laboratories, and hostels.',
      classrooms: 'Acoustically treated smart classrooms equipped with digital interactive boards, high-resolution multimedia projectors, and modern seating.',
      labs: 'Department-specific state-of-the-art engineering laboratories featuring industry-grade test equipment, GPU workstations, and licensed software suites.',
      auditorium: 'Spacious APJ Abdul Kalam multi-purpose auditorium and seminar halls equipped with professional acoustic and projection systems for conferences, symposiums, and cultural fests.',
      cafeteria: 'Hygienic campus cafeteria and food court providing wholesome meals, snacks, and refreshments in a clean, sanitized dining environment.',
      sports: 'Extensive sports facilities including cricket grounds, football field, volleyball court, basketball, badminton courts, athletics track, and gym.',
      clinic: '24/7 on-campus first-aid health clinic staffed with trained medical attendants and tie-ups with nearby multi-specialty hospitals.',
      security: 'Round-the-clock security personnel, automated entrance gates, and 24/7 CCTV surveillance throughout campus.',
      water: 'Centralized Reverse Osmosis (RO) drinking water plants supplying pure water across all floors and hostels, alongside 100% generator power backup.'
    },
    hostel: {
      details: 'Separate, secure on-campus residential hostel blocks for Boys and Girls with furnished rooms, continuous power backup, and resident wardens.',
      boysHostel: 'Dedicated on-campus residential block for male students with furnished rooms, continuous power backup, Wi-Fi, resident warden supervision, and 24/7 security.',
      girlsHostel: 'Secure on-campus residential block for female students with furnished rooms, round-the-clock female warden, Wi-Fi, CCTV monitoring, and strict security.',
      // PART 2-G: mess corrected — official Facilities page states "quality vegetarian food" only;
      //   no mention of non-vegetarian options on the official site (verified 2026-09-22).
      mess: 'Hygienic in-house dining mess serving balanced, nutritious vegetarian meals prepared in steam-operated kitchens.',
      amenities: '24/7 High-speed Wi-Fi, RO purified drinking water, dedicated study halls, round-the-clock security, and CCTV monitoring.',
      fees: 'Hostel fees depend on the room sharing type (2-share / 4-share) and dining plan. Please contact the Hostel Office at +91 4179 292228 for current semester hostel fees.',
      contact: 'For hostel accommodation details and room allotments, please contact the campus office at <strong>+91 4179 292228</strong>.'
    },
    transport: {
      fleet: 'Extensive college bus fleet providing safe, reliable, and punctual daily transportation for students and faculty.',
      routes: ['Tirupattur', 'Vaniyambadi', 'Jolarpettai', 'Natrampalli', 'Alangayam', 'Bargur', 'Kandhili', 'Uthangarai'],
      timings: 'Buses arrive at campus before 8:45 AM and depart for all return routes at 4:50 PM following academic hours.',
      fees: 'Transport fees are calculated on a transparent zonal distance basis according to pickup point. Please contact the Transport In-charge at the campus office for exact route fee details.',
      features: 'Experienced drivers, designated pickup points across all routes, and direct drop-off inside the college campus on Salem Main Road.'
    },
    studentLife: {
      clubs: [
        '<strong>Coding & Innovation Club:</strong> Weekly hackathons, web development sprints, and competitive coding.',
        '<strong>Robotics & IoT Society:</strong> Microcontroller fabrication, sensor networks, and autonomous drone building.',
        '<strong>National Service Scheme (NSS):</strong> Community outreach, blood donation camps, and rural development drives.',
        '<strong>Youth Red Cross (YRC) & Rotaract:</strong> Health awareness, leadership building, and social service projects.',
        '<strong>Sports Club:</strong> University sports tournaments, track events, and team championships.'
      ],
      events: 'Annual National Level Technical Symposium (TechNova), 24-Hour Code Marathons, Annual Cultural Extravaganza (Podhigai Sangamam), National Science Day, and Sports Day.'
    },
    // PART 3-1: NEW — Institutional Cells (separate from studentLife.clubs which are student societies).
    //   Source: official "Cells" page on podhigaitech.ac.in (verified 2026-09-22).
    //   These are distinct from clubs: clubs = student-run societies; cells = institutional bodies.
    cells: {
      careerGuidance: {
        name: 'Career Guidance Cell',
        description: 'Provides aptitude training, group discussions, resume-building workshops, interview preparation, and end-to-end placement support for all students.'
      },
      edc: {
        name: 'Entrepreneurship Development Cell (EDC)',
        description: 'Promotes startup awareness programs, business model competitions, and guest talks by industry entrepreneurs to foster an entrepreneurial mindset.'
      },
      womenEmpowerment: {
        name: 'Women Empowerment Cell',
        description: 'Conducts educational seminars, legal awareness campaigns, and skill-based workshops promoting women\'s safety, rights, and leadership development.'
      },
      iqac: {
        name: 'IQAC (Internal Quality Assurance Cell)',
        description: 'Responsible for internal academic audits, feedback systems, and quality benchmarks aligned with NAAC guidelines to sustain institutional excellence.'
      },
      nss: {
        name: 'NSS (National Service Scheme)',
        description: 'Engages students in blood donation drives, health camps, village outreach programs, tree plantation initiatives, and public awareness rallies.'
      },
      yrc: {
        name: 'YRC (Youth Red Cross)',
        description: 'Trains students in emergency response, first-aid techniques, disaster preparedness, and organises medical camps for community welfare.'
      }
    }
  };

  /* --------------------------------------------------------------------------
     SESSION CONTEXT STATE
     -------------------------------------------------------------------------- */
  const chatSession = {
    lastDept: null,    // 'it' | 'cse' | 'aids' | 'ece' | 'eee' | 'mech'
    lastTopic: null,   // 'admission' | 'fees' | 'placement' | 'hostel' | 'transport' | 'facilities' | 'events' | 'studentServices' | 'exams'
    lastIntent: null
  };

  /* --------------------------------------------------------------------------
     QUERY NORMALIZATION & SPELLING TOLERANCE
     -------------------------------------------------------------------------- */
  const normalizeQuery = (raw) => {
    let q = (raw || '').toLowerCase().trim();
    // Normalize punctuation but keep alphanumerics
    q = q.replace(/[?!.,;:"'’`()\[\]{}\\/<>@#$%^&*_+=~|-]+/g, ' ');
    q = q.replace(/\s+/g, ' ').trim();

    // Misspelling & Abbreviation normalization
    const spellMap = [
      [/\b(admision|admisson|admisn|addmission|admis|admission process|admission procedure|admishen|addmision)\b/g, 'admission'],
      [/\b(collge|colleg|clg|colege|colg|collage)\b/g, 'college'],
      [/\b(hostal|hostle|hostler|hostels|hostals)\b/g, 'hostel'],
      [/\b(place ment|plcmnt|placements|placmnt|placemnt|placment|placemnts)\b/g, 'placement'],
      [/\b(departmnt|dept|deprtment|depts|departmnet|deprtmnt)\b/g, 'department'],
      [/\b(scholar ship|scholarshpm|scholership|scholar ships|scholor ship|scolarship|scholorship)\b/g, 'scholarship'],
      [/\b(transprt|trnsport|transportation|commute|buses|trnsprt)\b/g, 'transport'],
      [/\b(facilty|facilites|infrastucture|infras|facilties)\b/g, 'facility'],
      [/\b(counselling|counseling|counsling|counceling)\b/g, 'counselling'],
      [/\b(cut off|cut-off|cutoff mark|cutoffs|cut off mark)\b/g, 'cutoff'],
      [/\b(eligibilty|eligiblity|eligble|eligibal)\b/g, 'eligibility'],
      [/\b(documnts|documets|documnets|documants|certficates|certificate|certificates|cetificate)\b/g, 'documents'],
      [/\b(deploma|diplomo|diplama)\b/g, 'diploma'],
      [/\b(anna univ|annauniversity|annauniv)\b/g, 'anna university'],
      [/\b(ai & ds|ai and ds|ai&ds|ai-ds|aids)\b/g, 'aids'],
      [/\b(symposm|simposium|symposia|symposum)\b/g, 'symposium'],
      [/\b(hackthon|hckathon|hackton|hckthon)\b/g, 'hackathon'],
      [/\b(culturals|cultral|culturals fest)\b/g, 'cultural'],
      [/\b(fee|fees structure|tuition fees|tuition fee)\b/g, 'fees'],
      [/\b(recruiter|recruiters|companies|company|recruit)\b/g, 'recruiters'],
      [/\b(canteen|foodcourt|food court|cafeteria|caffeteria|cantine)\b/g, 'cafeteria'],
      [/\b(atendance|attendence|attandance|atendence)\b/g, 'attendance'],
      [/\b(bonafide|bonafied|bonafid)\b/g, 'bonafide'],
      [/\b(auditorum|audutorium)\b/g, 'auditorium'],
      [/\b(libray|librery)\b/g, 'library'],
      [/\b(cirriculum|curriculam|curiculum)\b/g, 'curriculum'],
      [/\b(sylabus|syllubus|syllabous)\b/g, 'syllabus'],
      [/\b(technologys|techology|tecnology)\b/g, 'technology'],
      [/\b(subjet|subjets|subjetcs)\b/g, 'subjects'],
      [/\b(princpal|princple|princi)\b/g, 'principal'],
      [/\b(chaiman|chair man|ezhilarasan)\b/g, 'chairman']
    ];

    for (const [re, rep] of spellMap) {
      q = q.replace(re, rep);
    }
    return q.trim();
  };

  /* --------------------------------------------------------------------------
     CHATBOT MESSAGE BUILDER & RENDERER
     -------------------------------------------------------------------------- */
  const appendMsg = (text, role, followUps = []) => {
    if (!chatBody) return;
    const wrap = document.createElement('div');
    if (role === 'bot') {
      wrap.className = 'msg-bot-wrap';
      let chipsHtml = '';
      if (Array.isArray(followUps) && followUps.length > 0) {
        chipsHtml = `
          <div class="bot-followups" aria-label="Suggested Follow-ups">
            ${followUps.map(f => `<button class="bot-chip" type="button" data-q="${escapeHtml(f)}"><span class="bot-chip-icon">✦</span> ${escapeHtml(f)}</button>`).join('')}
          </div>
        `;
      }
      wrap.innerHTML = `
        <div class="msg-avatar">✦</div>
        <div class="msg bot">
          <div class="bot-text">${text}</div>
          ${chipsHtml}
        </div>
      `;
      // Attach click listeners to follow-up chips
      wrap.querySelectorAll('.bot-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          const q = chip.getAttribute('data-q');
          if (chatInput && q) {
            chatInput.value = q;
            handleSend();
          }
        });
      });
    } else {
      const el = document.createElement('div');
      el.className = 'msg user';
      el.textContent = text;
      chatBody.appendChild(el);
      chatBody.scrollTop = chatBody.scrollHeight;
      return;
    }
    chatBody.appendChild(wrap);
    chatBody.scrollTop = chatBody.scrollHeight;
  };

  /* --------------------------------------------------------------------------
     INTELLIGENT SCORED INTENT ENGINE & MULTI-INTENT RESOLVER
     -------------------------------------------------------------------------- */
  const detectDepartment = (q) => {
    if (/\b(it|information technology|b\s*tech\s*it|btech\s*it)\b/i.test(q)) return 'it';
    if (/\b(aids|ai\s*ds|ai\s*&\s*ds|ai\s+and\s+ds|artificial intelligence|data science|b\s*tech\s*ai|btech\s*aids)\b/i.test(q)) return 'aids';
    if (/\b(cse|computer science|computer science and engineering|b\s*e\s*cse|be\s*cse)\b/i.test(q)) return 'cse';
    if (/\b(ece|electronics|communication engineering|b\s*e\s*ece|be\s*ece|vlsi)\b/i.test(q)) return 'ece';
    if (/\b(eee|electrical|electrical and electronics|b\s*e\s*eee|be\s*eee|power systems|electric vehicle)\b/i.test(q)) return 'eee';
    if (/\b(mech|mechanical|mechanical engineering|b\s*e\s*mech|be\s*mech|cad cam|manufacturing|thermodynamics)\b/i.test(q)) return 'mech';
    return null;
  };

  const parseEventTimestamp = (dateStr) => {
    if (!dateStr) return 0;
    const t = Date.parse(dateStr);
    return isNaN(t) ? 0 : t;
  };

  const getDynamicEventsReply = (filterType, rawQuery = '') => {
    const events = (typeof getEvents === 'function') ? getEvents() : DEFAULT_EVENTS;
    const published = events.filter(e => e.published !== false);

    if (!published.length) {
      return {
        text: `📅 <strong>College Events &amp; Symposia:</strong><br>We regularly host national technical symposia, hackathons, guest lectures, and cultural fests! Please check back shortly or visit our <a href="${getPageLink('index.html#events')}">Events Section &rarr;</a>`,
        followUps: ['TechNova Symposium', 'Hackathons', 'Academic Programs', 'Contact Us']
      };
    }

    // Chronological date-aware sorting
    const sorted = published.slice().sort((a, b) => parseEventTimestamp(a.date) - parseEventTimestamp(b.date));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();
    const upcoming = sorted.filter(e => parseEventTimestamp(e.date) >= todayMs);
    const activeList = upcoming.length ? upcoming : sorted;

    // Next event or specific upcoming query
    if (filterType === 'next' || /\b(next event|next upcoming|what is the next event)\b/i.test(rawQuery)) {
      const nextEvt = activeList[0];
      return {
        text: `📅 <strong>Next Upcoming Campus Event:</strong><br><strong>${escapeHtml(nextEvt.title)}</strong><br>• <strong>Date &amp; Time:</strong> ${escapeHtml(nextEvt.date)} (${escapeHtml(nextEvt.time || 'Full Day')})<br>• <strong>Venue:</strong> ${escapeHtml(nextEvt.venue)}<br>• <strong>Category:</strong> ${escapeHtml(nextEvt.category)}<br>• <strong>Highlights:</strong> ${escapeHtml(nextEvt.description)}<br><a href="${getPageLink('index.html#events')}" style="color:var(--gold-500); font-weight:700;">Explore Events Gallery &rarr;</a>`,
        followUps: ['All Upcoming Events', 'TechNova Symposium', 'Hackathons', 'Cultural Fest']
      };
    }

    if (filterType === 'symposium') {
      const symp = activeList.filter(e => e.category?.toLowerCase() === 'symposium' || /symposium|technova/i.test(e.title));
      if (symp.length) {
        const e = symp[0];
        return {
          text: `🏆 <strong>National Technical Symposium:</strong><br><strong>${escapeHtml(e.title)}</strong><br>• <strong>Date:</strong> ${escapeHtml(e.date)} (${escapeHtml(e.time || 'Full Day')})<br>• <strong>Venue:</strong> ${escapeHtml(e.venue)}<br>• <strong>Highlights:</strong> ${escapeHtml(e.description)}<br><a href="${getPageLink('index.html#events')}" style="color:var(--gold-500); font-weight:700;">View Symposium Gallery &amp; Details &rarr;</a>`,
          followUps: ['Next Event', 'Smart India Hackathon', 'CSE Department', 'IT Department']
        };
      }
    }

    if (filterType === 'hackathon') {
      const hack = activeList.filter(e => e.category?.toLowerCase() === 'hackathon' || /hackathon|code marathon/i.test(e.title));
      if (hack.length) {
        const e = hack[0];
        return {
          text: `⚡ <strong>24-Hour Code Marathon &amp; Hackathon:</strong><br><strong>${escapeHtml(e.title)}</strong><br>• <strong>Date:</strong> ${escapeHtml(e.date)} (${escapeHtml(e.time || '24 Hours Non-Stop')})<br>• <strong>Venue:</strong> ${escapeHtml(e.venue)}<br>• <strong>Overview:</strong> ${escapeHtml(e.description)}<br><a href="${getPageLink('index.html#events')}" style="color:var(--gold-500); font-weight:700;">Explore Hackathon Hub &rarr;</a>`,
          followUps: ['TechNova Symposium', 'IT Innovation Labs', 'Coding Club', 'All Events']
        };
      }
    }

    if (filterType === 'workshop') {
      const ws = activeList.filter(e => e.category?.toLowerCase() === 'workshop' || /workshop|masterclass/i.test(e.title));
      if (ws.length) {
        const e = ws[0];
        return {
          text: `💡 <strong>Technical Workshop &amp; Masterclass:</strong><br><strong>${escapeHtml(e.title)}</strong><br>• <strong>Date:</strong> ${escapeHtml(e.date)} (${escapeHtml(e.time || 'Full Day')})<br>• <strong>Venue:</strong> ${escapeHtml(e.venue)}<br>• <strong>Topic:</strong> ${escapeHtml(e.description)}<br><a href="${getPageLink('index.html#events')}">View Event Details &rarr;</a>`,
          followUps: ['Next Event', 'AI & DS Department', 'Hackathons', 'All Events']
        };
      }
    }

    if (filterType === 'cultural') {
      const cult = activeList.filter(e => e.category?.toLowerCase().includes('cultural') || /cultural|sangamam/i.test(e.title));
      if (cult.length) {
        const e = cult[0];
        return {
          text: `🎭 <strong>Annual Cultural Grand Fest:</strong><br><strong>${escapeHtml(e.title)}</strong><br>• <strong>Date:</strong> ${escapeHtml(e.date)} (${escapeHtml(e.time)})<br>• <strong>Venue:</strong> ${escapeHtml(e.venue)}<br>• <strong>Celebration:</strong> ${escapeHtml(e.description)}<br><a href="${getPageLink('index.html#events')}">View Cultural Highlights &rarr;</a>`,
          followUps: ['Student Clubs', 'Sports Championship', 'Upcoming Events']
        };
      }
    }

    if (filterType === 'sports') {
      const sp = activeList.filter(e => e.category?.toLowerCase().includes('sport') || /sports|athletic|championship/i.test(e.title));
      if (sp.length) {
        const e = sp[0];
        return {
          text: `🏆 <strong>Campus Athletic &amp; Sports Meet:</strong><br><strong>${escapeHtml(e.title)}</strong><br>• <strong>Date:</strong> ${escapeHtml(e.date)} (${escapeHtml(e.time)})<br>• <strong>Venue:</strong> ${escapeHtml(e.venue)}<br>• <strong>Details:</strong> ${escapeHtml(e.description)}<br><a href="${getPageLink('index.html#events')}">View Sports Calendar &rarr;</a>`,
          followUps: ['Sports Facilities', 'Student Clubs', 'Upcoming Events']
        };
      }
    }

    if (filterType === 'placement') {
      const pl = activeList.filter(e => e.category?.toLowerCase().includes('placement') || /placement|felicitation|recruit/i.test(e.title));
      if (pl.length) {
        const e = pl[0];
        return {
          text: `💼 <strong>Corporate Placement Day &amp; Recruiter Felicitation:</strong><br><strong>${escapeHtml(e.title)}</strong><br>• <strong>Date:</strong> ${escapeHtml(e.date)} (${escapeHtml(e.time)})<br>• <strong>Venue:</strong> ${escapeHtml(e.venue)}<br>• <strong>Highlights:</strong> ${escapeHtml(e.description)}<br><a href="${getPageLink('placements.html')}">Explore Placements Page &rarr;</a>`,
          followUps: ['Top Recruiters', 'Placement Training', 'Next Event']
        };
      }
    }

    // Default chronological upcoming events list
    const displayList = activeList.slice(0, 3);
    const listHtml = displayList.map((e, idx) => `
      ${idx + 1}. <strong>${escapeHtml(e.title)}</strong><br>
      &nbsp;&nbsp;&nbsp;📅 <em>${escapeHtml(e.date)} &middot; ${escapeHtml(e.venue)}</em> (${escapeHtml(e.category)})
    `).join('<br>');

    return {
      text: `📅 <strong>Chronological Upcoming Campus Events &amp; Symposia:</strong><br>${listHtml}<br><br><a href="${getPageLink('index.html#events')}" style="color:var(--gold-500); font-weight:700;">Explore Full Events Calendar &amp; Live Gallery &rarr;</a>`,
      followUps: ['Next Event', 'TechNova Symposium', 'Smart India Hackathon', 'Cultural Fest', 'Clubs & Sports']
    };
  };

  const getBotEngineReply = (rawInput) => {
    const q = normalizeQuery(rawInput);
    if (!q) {
      return {
        text: "How can I assist you with Podhigai College today? Ask me about courses, admissions, fees, placements, or facilities!",
        followUps: ['Courses', 'Admissions', 'Placements', 'Hostel']
      };
    }

    // ── 1. DEVELOPER / CREATOR INFORMATION ──
    if (/(developer|creator|who made you|who created you|who developed you|who built you|who programmed you|who is your creator|who coded you|deepakaran|deepak|author|credits|developed by|made by)\b/i.test(q)) {
      return {
        text: `👨‍💻 <strong>Developer Information:</strong><br>I was proudly designed and developed by <strong>Deepakaran M</strong> from the department of <strong>B.Tech Information Technology (IT)</strong> at Podhigai College of Engineering &amp; Technology!`,
        followUps: ['B.Tech IT Department', 'IT Career Roles', 'Admissions 1525', 'Explore Programs']
      };
    }

    // ── 2. CASUAL GREETINGS & SOCIAL INTENTS ──
    if (/^(gm|good morning|gmorning|morning)\b/i.test(q)) {
      return {
        text: `🌅 <strong>Good Morning!</strong> ☀️ Welcome to Podhigai College of Engineering &amp; Technology. How can I assist you with your campus queries today?`,
        followUps: ['What programs are offered?', 'Admissions 2025', 'TNEA Code 1525', 'Placements Support']
      };
    }
    if (/^(ga|good afternoon|good noon|afternoon)\b/i.test(q)) {
      return {
        text: `☀️ <strong>Good Afternoon!</strong> Hope you're having a productive day. How can I help you explore Podhigai College today?`,
        followUps: ['What programs are offered?', 'Admissions Process', 'Fees & Scholarships', 'Placements']
      };
    }
    if (/^(ge|good evening|evening)\b/i.test(q)) {
      return {
        text: `🌆 <strong>Good Evening!</strong> 🌇 How can I assist you today? Feel free to ask about our engineering courses, admissions, or campus facilities!`,
        followUps: ['Engineering Degrees', 'Admissions 1525', 'Hostel Facilities', 'College Contact']
      };
    }
    if (/^(gn|good night|goodnight|night|sweet dreams)\b/i.test(q)) {
      return {
        text: `🌙 <strong>Good Night!</strong> 🌟 Feel free to drop your questions anytime. Have a restful night and visit back whenever you need campus guidance!`,
        followUps: ['Admissions 2025', 'Courses List', 'College Address']
      };
    }
    if (/^(how are you|how r u|how are you doing|how do you do|how is it going|hows it going|epdi irukinga)\b/i.test(q)) {
      return {
        text: `I'm doing fantastic and ready to help! 😊 How can I assist your college journey today?`,
        followUps: ['What programs are offered?', 'How to apply?', 'Fee structure', 'Placement record']
      };
    }
    if (/^(thank you|thanks|tq|thx|thank u|thankyou|appreciate it|many thanks|nandri|romba nandri)\b/i.test(q)) {
      return {
        text: `You're very welcome! 😊 Always happy to help. Let me know if you have any more questions about Podhigai College!`,
        followUps: ['Admissions Desk', 'Campus Location', 'Explore Programs']
      };
    }
    if (/^(bye|goodbye|cya|see you|tata|see ya|bye bye)\b/i.test(q)) {
      return {
        text: `Goodbye! 👋 Have a wonderful day ahead. Reach out anytime you need campus information!`,
        followUps: ['Admissions 2025', 'Explore Programs']
      };
    }
    if (/^(hi|hello|hey|hola|namaste|vanakkam|sup|yo|hiya|howdy|greetings|welcome)\b/i.test(q)) {
      return {
        text: `Hi! 👋 I'm <strong>Podhigai AI</strong>, your digital campus assistant. How can I help you today? You can ask me about admissions (TNEA 1525), our 6 engineering degrees, placements, fees, hostel, transport, or campus events!`,
        followUps: ['What programs are offered?', 'Admissions Process', 'Placement Support', 'TNEA Code 1525']
      };
    }

    // ── 3. WHO ARE YOU / BOT IDENTITY ──
    if (/(who are you|what is your name|podhigai ai|what can you do|about you|your role|introduce yourself)\b/i.test(q)) {
      return {
        text: `I am <strong>Podhigai AI</strong>, the official digital campus assistant for Podhigai College of Engineering &amp; Technology. I'm here to provide instant A-Z information about our 6 engineering degrees, admissions (TNEA 1525), fees, scholarships, placements, hostels, transport, student services, and campus events!`,
        followUps: ['Academic Degrees', 'TNEA 1525 Admissions', 'Placements & Training', 'Campus Amenities']
      };
    }

    // ── 4. AMBIGUOUS QUERIES (DISAMBIGUATION PROMPT) ──
    // PART 1-3: Removed alternates containing literal '?' (e.g. fees\?, fee\?, fees evlo\?, fees evalo\?,
    //   admission epdi\?, hostel irukka\?) — normalizeQuery() strips '?' before these run, so those
    //   alternates were dead code that could never match. Plain-word alternates already cover real input.
    if (/^(fees|fee|college fees|fees details|fees evlo|fees evalo)$/i.test(q)) {
      chatSession.lastTopic = 'fees';
      return {
        text: `💰 <strong>Which fee information are you looking for?</strong><br>• <strong>Tuition Fees:</strong> Transparently regulated per State Committee &amp; Anna University.<br>• <strong>Hostel Fees:</strong> Residential rooms &amp; dining mess charges.<br>• <strong>Transport Bus Fees:</strong> Distance-based route fees across nearby towns.<br>• <strong>Scholarships &amp; Concessions:</strong> Full fee support under First Graduate, SC/ST, BC/MBC, and 7.5% Govt School Quota.<br><br><em>Please choose a specific category below, or ask directly about a department (e.g. "IT fees"):</em>`,
        followUps: ['Tuition Fee Policy', 'Hostel Fees', 'Transport Bus Fees', 'Scholarships & Concessions']
      };
    }

    if (/^(admission|admissions|apply|how to join|how can i join|how to apply|admission epdi|admission eppadi)$/i.test(q)) {
      chatSession.lastTopic = 'admission';
      return {
        text: `📋 <strong>What would you like to know regarding Admissions 2025–2026?</strong><br>• <strong>Eligibility Criteria:</strong> 10+2 PCM pass standards.<br>• <strong>TNEA Counselling Code:</strong> Code 1525 for single-window allocation.<br>• <strong>Cutoff Calculation:</strong> Formula out of 200 marks.<br>• <strong>Required Documents:</strong> Marksheets, TC, and community certificates.<br>• <strong>Lateral Entry:</strong> Direct 2nd year for Polytechnic Diploma holders.<br>• <strong>Management Quota:</strong> Direct campus admission desk.<br><br><em>Please choose an option below:</em>`,
        followUps: ['Eligibility Criteria', 'TNEA Code 1525', 'Cutoff Calculation', 'Required Documents', 'Lateral Entry Diploma', 'Management Quota']
      };
    }

    if (/^(hostel|hostels|hostel facility|hostel irukka)$/i.test(q)) {
      chatSession.lastTopic = 'hostel';
      return {
        // PART 2-G: updated mess line to reflect vegetarian-only per official site
        text: `🏠 <strong>What would you like to know about our Residential Hostels?</strong><br>• <strong>Accommodation:</strong> Separate blocks for Boys &amp; Girls.<br>• <strong>Dining Mess:</strong> Hygienic vegetarian meals prepared in steam-operated kitchens.<br>• <strong>Amenities:</strong> Wi-Fi, RO water, 24/7 security &amp; study halls.<br>• <strong>Hostel Contact:</strong> Room allotment &amp; fee schedule.<br><br><em>Please select an option below:</em>`,
        followUps: ['Hostel Amenities', 'Food & Mess', 'Boys & Girls Blocks', 'Hostel Fees & Contact']
      };
    }

    // ── 5. INTENT DETECTION & ATTRIBUTE FLAGS ──
    const explicitDept = detectDepartment(q);
    const isAskingCampusLabsExplicit = /\b(computer lab|computer labs|campus lab|campus labs|central lab|labs in college|all labs)\b/i.test(q);
    const isStandaloneGeneralQuery = /^(training|internship|internships|placement|placements|companies|recruiters|computer lab|computer labs|sports|bus|transport|fees|admission)$/i.test(q);
    const activeDeptKey = explicitDept || (!isStandaloneGeneralQuery && !isAskingCampusLabsExplicit && chatSession.lastDept && /(career|careers|job|jobs|roles|scope|lab|labs|subject|subjects|syllabus|curriculum|technology|technologies|tools|higher studies|placement|fee|fees|admission|eligibility)\b/i.test(q) ? chatSession.lastDept : null);
    const activeDept = activeDeptKey ? PODHIGAI_DATA.departments[activeDeptKey] : null;

    if (explicitDept) {
      chatSession.lastDept = explicitDept;
    }

    const isAskingCareers = /\b(career|careers|job|jobs|roles|opportunities|scope|future|placement roles|after graduation|industry roles)\b/i.test(q);
    const isAskingHigherStudies = /\b(higher studies|higher study|m\.tech|m\.e|ms abroad|mba|post graduation|pg courses|after cse|after it)\b/i.test(q);
    const isAskingTechnologies = /\b(technology|technologies|tools|software|stack|languages|frameworks|programming|what technologies)\b/i.test(q);
    const isAskingLabs = /\b(lab|labs|facilities|equipment|workstation|workshop|software|infrastructure)\b/i.test(q);
    const isAskingSyllabus = /\b(subject|subjects|syllabus|curriculum|what will i study|study|course details|topics|semester|core subjects)\b/i.test(q);
    const isAskingFees = /\b(fee|fees|cost|tuition|charge|charges|payment|fees evlo|fees evalo|fees eppadi|fees details|college fee)\b/i.test(q);
    // PART 1-1: Fixed post-normalisation regex for "7.5%" — normalizeQuery() strips "." and "%",
    //   so "7.5%" becomes "7 5" after normalisation. Changed 7\.5 / 7\.5% → 7\s*5\s*%? to match
    //   the post-processed text. Added "75 percent" as an additional alias.
    const isAskingScholarship = /\b(scholarship|scholarships|first graduate|post matric|sc st scholarship|bc mbc|7\s*5\s*%?|75\s*percent|government school quota|govt school quota|fee concession|financial aid|free seat|pmsss|concession)\b/i.test(q);
    const isAskingFirstGraduate = /\b(first graduate|first generation|first graduate concession|first graduate scholarship|first graduate irukka)\b/i.test(q);
    // PART 1-1 (continued): Same fix for isAskingGovtSchoolQuota
    const isAskingGovtSchoolQuota = /\b(7\s*5\s*%?|75\s*percent|government school quota|govt school quota|free seat|free education)\b/i.test(q);
    const isAskingHostel = /\b(hostel|hostels|accommodation|stay|residential|mess|food|dining|room|rooms|hostel irukka|hostel iruka|hostel facility|boys hostel|girls hostel|warden)\b/i.test(q);
    const isAskingHostelMess = /\b(mess|food|dining|menu|veg|non veg|meals|hygienic food|canteen food)\b/i.test(q);
    const isAskingHostelBoys = /\b(boys hostel|boy hostel|men hostel)\b/i.test(q);
    const isAskingHostelGirls = /\b(girls hostel|girl hostel|women hostel|ladies hostel)\b/i.test(q);
    const isAskingTransport = /\b(transport|bus|buses|route|routes|travel|commute|pickup|driver|bus facility|bus irukka|bus route|transport timing|bus fee)\b/i.test(q);
    const isAskingTransportTown = /\b(tirupattur bus|vaniyambadi|jolarpettai|natrampalli|alangayam|bargur|kandhili|uthangarai)\b/i.test(q);
    const isAskingDocuments = /\b(document|documents|certificate|certificates|tc|mark sheet|mark sheets|what documents|documents needed|documents required|proof|community certificate|income certificate|nativity certificate|allotment order)\b/i.test(q);
    const isAskingLateral = /\b(lateral entry|lateral|diploma|polytechnic|direct second year|direct 2nd year|b\.sc lateral|diploma mudichitu join panna mudiyuma|diploma admission)\b/i.test(q);
    const isAskingManagementQuota = /\b(management quota|management seat|direct admission|direct seat|seat booking|management quota irukka)\b/i.test(q);
    const isAskingTneaCode = /\b(tnea code|college code|counselling code|counseling code|code|1525|tnea code enna)\b/i.test(q);
    const isAskingAdmission = /\b(admission|admissions|apply|application|join|joining|enroll|enrolment|how to apply|how to join|how can i join|eligibility|eligibility criteria|eligible|counselling|counseling|management quota|government quota|admission epdi|admission eppadi|college join panna|join panna enna|admission edukkurathu)\b/i.test(q);
    const isAskingPlacement = /\b(placement|placements|career|careers|recruit|recruiter|recruiters|company|companies|salary|package|highest package|average package|training|internship|internships|aptitude|soft skills|mock interview|placement eppadi|placement epdi|job offer|vela kedaikuma)\b/i.test(q);
    const isAskingEvents = /\b(event|events|upcoming events|next event|college events|calendar|happening|functions|schedule|symposium|technova|expo|hackathon|code marathon|workshop|masterclass|cultural|culturals|sangamam|arts fest|today's event|tomorrow's event|this week)\b/i.test(q);
    const isAskingLocation = /\b(location|where|address|place|map|directions|direction|reach|how to reach|tirupattur|adiyur|distance|route to college|college enga irukku|enga irukku|college address|google maps)\b/i.test(q);
    const isAskingContact = /\b(contact|phone|mobile|call|email|number|helpline|whatsapp|timing|timings|hours|working hours|opening hours|office timing|office hours|principal office)\b/i.test(q);
    const isAskingAbout = /\b(about|about college|about podhigai|history|established|founder|trust|principal|chairman|management|leadership|vision|mission|values|anna university|aicte|approval|affiliation|accreditation|autonomous|overview|college pathi|college pathi sollu|college pathi sollunga)\b/i.test(q);
    const isAskingCoursesAll = /\b(program|programs|course|courses|degree|degrees|branch|branches|department|departments|engineering|academics|entha courses|courses irukku|what courses|courses enna irukku)\b/i.test(q);
    const isAskingLibrary = /\b(library|digital library|books|journals|ieee|reading room|library timing)\b/i.test(q);
    const isAskingSportsScore = /\b(score|scores|live score|match score|won the match|who won|ipl|world cup|cricket match)\b/i.test(q);
    const isAskingSports = !isAskingSportsScore && /\b(sport|sports|cricket|football|volleyball|basketball|badminton|ground|games|athletics|athletic|gym)\b/i.test(q);
    // PART 1-2: Fixed "score" in isAskingCutoff causing sports-score queries (e.g. "cricket score",
    //   "match score") to incorrectly return the Admissions Cutoff answer. Moved declaration to after
    //   isAskingSportsScore (which it depends on) and added the same exclusion condition used by isAskingSports.
    const isAskingCutoff = !isAskingSportsScore && /\b(cutoff|cut off|mark|marks|calculate cutoff|how cutoff is calculated|cutoff calculation|12th mark|required marks|minimum marks|score|evlo mark|12th mark eligibility)\b/i.test(q);
    const isAskingClubs = /\b(club|clubs|nss|yrc|rotaract|coding club|robotics club|student activities|society|societies)\b/i.test(q);
    const isAskingAuditorium = /\b(auditorium|seminar hall|hall|conference hall|apj auditorium|apj abdulkalam auditorium)\b/i.test(q);
    const isAskingWifi = /\b(wifi|wi-fi|wi\s*fi|internet|broadband|network speed)\b/i.test(q);
    const isAskingCafeteria = /\b(canteen|cafeteria|food court|snacks|tea|coffee)\b/i.test(q);
    const isAskingClinic = /\b(medical|clinic|first aid|health center|doctor|hospital)\b/i.test(q);
    const isAskingSecurity = /\b(security|cctv|safety|surveillance|guards|ro water|power backup|generator)\b/i.test(q);
    const isAskingFacilities = /\b(facility|facilities|infrastructure|smart classroom|classrooms)\b/i.test(q);

    // Student Services & Academic Exams Intents
    const isAskingAttendance = /\b(attendance|attendance percentage|how much attendance required|attendance rule|attendance requirement|75%|condonation)\b/i.test(q);
    const isAskingExams = /\b(exam|exams|university exam|semester exam|internal exam|cycle test|model exam|exam cell|hall ticket|academic calendar|timetable|when are exams|anna university exam)\b/i.test(q);
    const isAskingResults = /\b(result|results|semester result|mark sheet|mark sheets|internal marks|coe portal|coe1)\b/i.test(q);
    const isAskingRegulations = /\b(regulation|regulations|anna university regulation|regulation 2021|academic regulation)\b/i.test(q);
    const isAskingCertificates = /\b(bonafide|bonafide certificate|transfer certificate|tc|conduct certificate|course completion|certificate apply)\b/i.test(q);
    const isAskingIDCard = /\b(id card|student id|identity card|id card lost|id card apply)\b/i.test(q);
    const isAskingGrievance = /\b(grievance|complaint|anti ragging|ragging|discipline|student welfare|class advisor|counselor)\b/i.test(q);

    // ── 6. MULTI-INTENT RESOLUTION (Highest Specificity First) ──

    // 6.0 Explicit Campus Laboratories
    if (isAskingCampusLabsExplicit) {
      chatSession.lastTopic = 'facilities';
      return {
        text: `🔬 <strong>Campus Engineering &amp; Computer Laboratories:</strong><br>• ${PODHIGAI_DATA.campus.labs}<br>• High-speed fiber-optic connectivity and uninterrupted UPS/generator power backup across all departmental laboratories.<br><a href="${getPageLink('campus.html')}">Explore Campus Infrastructure &rarr;</a>`,
        followUps: ['Campus Wi-Fi', 'Central Digital Library', 'Smart Classrooms', 'Take a Campus Tour']
      };
    }

    // 6.0b Department + Subjects AND Careers
    if (activeDept && isAskingSyllabus && (isAskingCareers || isAskingHigherStudies)) {
      chatSession.lastTopic = 'courses';
      return {
        text: `📚 <strong>${activeDept.name} — Curriculum &amp; Career Pathways:</strong><br><br><strong>Core Curriculum &amp; Subjects:</strong><br>• ${activeDept.subjects.join('<br>• ')}<br><br>💼 <strong>Career Opportunities &amp; Roles:</strong><br>• ${activeDept.careers.join('<br>• ')}<br><br>🎓 <strong>Higher Studies:</strong> ${activeDept.higherStudies}<br><a href="${getPageLink(activeDept.url)}" style="color:var(--gold-500); font-weight:700;">Explore Full ${activeDept.short} Department Page &rarr;</a>`,
        followUps: [`${activeDept.short} Tech Stack`, `${activeDept.short} Labs`, `${activeDept.short} Admissions`, 'Top Recruiters']
      };
    }

    // 6.1 Department + Careers / Higher Studies
    if (activeDept && (isAskingCareers || isAskingHigherStudies)) {
      chatSession.lastTopic = 'careers';
      return {
        text: `🎯 <strong>${activeDept.name} &amp; Career Pathways:</strong><br>• <strong>Program Focus:</strong> ${activeDept.overview}<br><br>💼 <strong>Key Industry Career Roles:</strong><br>• ${activeDept.careers.join('<br>• ')}<br><br>🎓 <strong>Higher Studies Opportunities:</strong><br>${activeDept.higherStudies}<br><a href="${getPageLink(activeDept.url)}" style="color:var(--gold-500); font-weight:700;">Explore Full ${activeDept.short} Department Page &rarr;</a>`,
        followUps: [`${activeDept.short} Labs & Syllabus`, `${activeDept.short} Admissions`, 'Top Recruiters', 'All 6 Programs']
      };
    }

    // 6.2 Department + Technologies
    if (activeDept && isAskingTechnologies) {
      chatSession.lastTopic = 'courses';
      return {
        text: `💻 <strong>Modern Technologies &amp; Tools Taught in ${activeDept.name}:</strong><br>Students gain hands-on training with industry-standard stacks:<br>• ${activeDept.technologies.join('<br>• ')}<br><br>🔬 <strong>Equipped Labs:</strong> ${activeDept.labs}<br><a href="${getPageLink(activeDept.url)}" style="color:var(--gold-500); font-weight:700;">View Department Tech Lab Facilities &rarr;</a>`,
        followUps: [`${activeDept.short} Core Subjects`, `${activeDept.short} Career Roles`, `${activeDept.short} Admissions`, 'All 6 Programs']
      };
    }

    // 6.3 Department + Fees + Hostel / Fees for Dept
    if (activeDept && isAskingFees && isAskingHostel) {
      chatSession.lastTopic = 'fees';
      return {
        text: `💰 <strong>${activeDept.name} — Fees &amp; Hostel Facilities:</strong><br>• <strong>Tuition Fee Policy:</strong> ${PODHIGAI_DATA.fees.policy}<br>• <strong>Scholarships &amp; Waivers:</strong> Full concessions available under First Graduate, Post-Matric SC/ST, and 7.5% Govt School Quota.<br>• <strong>Hostel Accommodation:</strong> ${PODHIGAI_DATA.hostel.details}<br>• <strong>Hostel Mess:</strong> ${PODHIGAI_DATA.hostel.mess}<br><br>📞 <em>For official fee schedules and room allotment, call <strong>${PODHIGAI_DATA.admissions.helpline}</strong>.</em>`,
        followUps: [`${activeDept.short} Admissions`, 'First Graduate Concession', 'Hostel Mess & Food', 'Contact Office']
      };
    }

    if (activeDept && isAskingFees) {
      chatSession.lastTopic = 'fees';
      return {
        text: `💰 <strong>Fee Structure for ${activeDept.name}:</strong><br>• ${PODHIGAI_DATA.fees.policy}<br>• <strong>Available Concessions:</strong> First Graduate discount, Post-Matric SC/ST waiver, BC/MBC scholarship, and 7.5% Government School free seat quota.<br>• ${PODHIGAI_DATA.fees.disclaimer}`,
        followUps: [`${activeDept.short} Admissions`, 'Scholarship Schemes', 'Hostel Facilities', 'Contact Office']
      };
    }

    // 6.4 Department + Labs
    if (activeDept && isAskingLabs) {
      chatSession.lastTopic = 'labs';
      return {
        text: `🔬 <strong>Laboratory Facilities for ${activeDept.name}:</strong><br>• ${activeDept.labs}<br>Equipped with industry-grade testing hardware, GPU workstations, and licensed software suites.<br><a href="${getPageLink(activeDept.url)}">View Detailed Lab Showcase &rarr;</a>`,
        followUps: [`${activeDept.short} Core Subjects`, `${activeDept.short} Careers`, 'Campus Wi-Fi & Library', 'Admissions 1525']
      };
    }

    // 6.5 Department + Syllabus / Subjects
    if (activeDept && isAskingSyllabus) {
      chatSession.lastTopic = 'syllabus';
      return {
        text: `📚 <strong>Core Curriculum for ${activeDept.name}:</strong><br>• ${activeDept.subjects.join('<br>• ')}<br><br>💡 <strong>Key Focus Areas:</strong><br>• ${activeDept.pillars.join('<br>• ')}<br><a href="${getPageLink(activeDept.url)}">View Complete Syllabus &rarr;</a>`,
        followUps: [`${activeDept.short} Career Roles`, `${activeDept.short} Labs`, 'Admissions Process', 'Fees & Scholarships']
      };
    }

    // 6.6 Courses + How to apply
    if (isAskingCoursesAll && isAskingAdmission) {
      chatSession.lastTopic = 'courses';
      return {
        text: `🎓 <strong>Academic Programs &amp; How to Apply:</strong><br>Podhigai College offers 6 undergraduate AICTE-approved B.E. / B.Tech degree programs:<br>1. <strong>B.Tech IT</strong> &nbsp;&bull;&nbsp; 2. <strong>B.Tech AI &amp; DS</strong><br>3. <strong>B.E. CSE</strong> &nbsp;&bull;&nbsp; 4. <strong>B.E. ECE</strong><br>5. <strong>B.E. EEE</strong> &nbsp;&bull;&nbsp; 6. <strong>B.E. Mechanical</strong><br><br>📋 <strong>Admission Pathways:</strong><br>• <strong>TNEA Counselling:</strong> Choice code <strong>1525</strong>.<br>• <strong>Management Quota:</strong> Direct enrollment at campus admissions desk.<br>• <strong>Lateral Entry:</strong> Direct 2nd year for Polytechnic Diploma holders.<br><a href="${getPageLink('contact.html')}" style="color:var(--gold-500); font-weight:700;">Submit Online Admission Enquiry &rarr;</a>`,
        followUps: ['Cutoff Calculation', 'Required Documents', 'Scholarships Available', 'Hostel Facilities']
      };
    }

    // 6.7 Admission + Scholarship
    if (isAskingAdmission && isAskingScholarship) {
      chatSession.lastTopic = 'admission';
      return {
        text: `📋 <strong>Admissions &amp; Scholarship Schemes 2025–2026:</strong><br>• <strong>TNEA Code:</strong> <strong>${PODHIGAI_DATA.admissions.tneaCode}</strong><br>• <strong>Eligibility:</strong> ${PODHIGAI_DATA.admissions.eligibility}<br><br>💰 <strong>Government &amp; Merit Scholarships:</strong><br>• ${PODHIGAI_DATA.fees.scholarships.join('<br>• ')}<br><br>📞 <em>Admissions Helpline: ${PODHIGAI_DATA.admissions.helpline}</em>`,
        followUps: ['Cutoff Calculation', 'Required Documents', 'Fee Structure', '6 Degree Programs']
      };
    }

    // 6.8 Admission + Cutoff
    if (isAskingAdmission && isAskingCutoff) {
      chatSession.lastTopic = 'admission';
      return {
        text: `📊 <strong>Admissions &amp; Cutoff Calculation:</strong><br>• <strong>TNEA Counselling Code:</strong> <strong>${PODHIGAI_DATA.admissions.tneaCode}</strong><br>• <strong>Cutoff Formula:</strong> ${PODHIGAI_DATA.admissions.cutoffCalculation}<br>• <strong>Eligibility:</strong> ${PODHIGAI_DATA.admissions.eligibility}<br>• <strong>Admissions Streams:</strong> Anna University TNEA Counselling + Direct Management Quota.`,
        followUps: ['Required Documents', 'Scholarships Available', '6 Degree Programs', 'Contact Office']
      };
    }

    // 6.9 Fees + Hostel
    if (isAskingFees && isAskingHostel) {
      chatSession.lastTopic = 'fees';
      return {
        text: `💰 <strong>College Fees &amp; Hostel Facilities:</strong><br>• <strong>Tuition Fees:</strong> ${PODHIGAI_DATA.fees.policy}<br>• <strong>Scholarships:</strong> Full support for First Graduate, SC/ST, and 7.5% Govt School Quota.<br>• <strong>Hostel:</strong> ${PODHIGAI_DATA.hostel.details}<br>• <strong>Mess:</strong> ${PODHIGAI_DATA.hostel.mess}<br><br>📞 <em>Contact our campus office at <strong>${PODHIGAI_DATA.admissions.helpline}</strong> for official details.</em>`,
        followUps: ['Scholarship Schemes', 'Hostel Mess & Food', 'College Transport', 'Admissions 1525']
      };
    }

    // 6.10 Hostel + Transport
    if (isAskingHostel && isAskingTransport) {
      chatSession.lastTopic = 'hostel';
      return {
        text: `🏠 <strong>Hostel &amp; Transport Transit Amenities:</strong><br>• <strong>Hostel:</strong> ${PODHIGAI_DATA.hostel.details} (${PODHIGAI_DATA.hostel.mess})<br>• <strong>Transport Fleet:</strong> Daily bus services covering <strong>${PODHIGAI_DATA.transport.routes.join(', ')}</strong> and nearby towns.<br><a href="${getPageLink('campus.html')}" style="color:var(--gold-500); font-weight:700;">Explore Campus Facilities &rarr;</a>`,
        followUps: ['Hostel Details', 'Transport Routes', 'Campus Wi-Fi', 'Admissions 1525']
      };
    }

    // 6.11 Context-Aware Placement Query
    if (isAskingPlacement) {
      chatSession.lastTopic = 'placement';
      if (activeDept) {
        return {
          text: `🎯 <strong>Placements &amp; Career Opportunities for ${activeDept.name}:</strong><br>Graduates from this department are placed in top companies as <strong>${activeDept.careers.slice(0, 3).join(', ')}</strong>!<br><br>• <strong>Institutional Track Record:</strong> ${PODHIGAI_DATA.placements.record}<br>• <strong>Top Recruiting Partners:</strong><br>&nbsp;&nbsp;${PODHIGAI_DATA.placements.recruiters.join(', ')}.<br>• <strong>4-Tier Training:</strong> Technical foundations, resume auditing, mock interviews, and recruiter drives.<br><a href="${getPageLink('placements.html')}" style="color:var(--gold-500); font-weight:700;">Explore Placements &amp; Recruiters &rarr;</a>`,
          followUps: [`${activeDept.short} Career Roles`, 'Top Recruiters List', 'Admissions 1525', 'All 6 Programs']
        };
      }
      return {
        text: `🎯 <strong>Placements &amp; Career Training Cell:</strong><br>• <strong>Track Record:</strong> ${PODHIGAI_DATA.placements.record}<br>• <strong>Top Recruiting Partners:</strong><br>&nbsp;&nbsp;${PODHIGAI_DATA.placements.recruiters.join(', ')}.<br><br>📈 <strong>4-Tier Progressive Training Framework:</strong><br>• ${PODHIGAI_DATA.placements.trainingStages.join('<br>• ')}<br><a href="${getPageLink('placements.html')}" style="color:var(--gold-500); font-weight:700;">Explore Placements &amp; Recruiters &rarr;</a>`,
        followUps: ['Top Recruiters List', 'B.Tech IT Placements', 'B.E. CSE Placements', 'Admissions 1525']
      };
    }

    // ── 7. SINGLE INTENT RESOLUTION ──

    // 7.1 Explicit Department Overview
    if (explicitDept) {
      chatSession.lastTopic = 'courses';
      return {
        text: `💻 <strong>${activeDept.name}:</strong><br>• <strong>Degree &amp; Duration:</strong> ${activeDept.degree}<br>• <strong>Program Focus:</strong> ${activeDept.overview}<br>• <strong>Key Learning Pillars:</strong><br>&nbsp;&nbsp;1. ${activeDept.pillars.join('<br>&nbsp;&nbsp;2. ')}<br>• <strong>Top Career Roles:</strong> ${activeDept.careers.slice(0, 3).join(', ')}.<br><a href="${getPageLink(activeDept.url)}" style="color:var(--gold-500); font-weight:700;">Explore ${activeDept.short} Department Page &rarr;</a>`,
        followUps: [`${activeDept.short} Career Roles`, `${activeDept.short} Labs & Subjects`, 'Admissions 2025', 'All 6 Programs']
      };
    }

    // 7.2 Student Services & Academic Exams
    if (isAskingAttendance) {
      chatSession.lastTopic = 'studentServices';
      return {
        text: `📊 <strong>Attendance Rules &amp; Regulations:</strong><br>• ${PODHIGAI_DATA.studentServices.attendance}<br>• Daily attendance is marked period-wise and recorded in department registers.<br>• Class advisors notify parents regarding student attendance regularly.`,
        followUps: ['Academic Calendar', 'Internal Exams', 'Class Advisors', 'Student Services']
      };
    }

    if (isAskingExams || isAskingRegulations) {
      chatSession.lastTopic = 'exams';
      return {
        text: `📝 <strong>Exams, Timetable &amp; Anna University Regulations:</strong><br>• <strong>Affiliation Standard:</strong> ${PODHIGAI_DATA.studentServices.regulations}<br>• <strong>Semester Exams:</strong> ${PODHIGAI_DATA.studentServices.examsSchedule}<br>• <strong>Exam Cell:</strong> ${PODHIGAI_DATA.studentServices.examCell}<br>• <strong>Class Timetable:</strong> ${PODHIGAI_DATA.studentServices.academicCalendar}`,
        followUps: ['Semester Results', 'Attendance Requirements', 'Certificates & TC', 'Academic Calendar']
      };
    }

    if (isAskingResults) {
      chatSession.lastTopic = 'exams';
      return {
        text: `🎓 <strong>Semester Results &amp; Marks:</strong><br>• ${PODHIGAI_DATA.studentServices.results}<br>• Official mark sheets and provisional certificates are issued by Anna University Chennai upon completion of semester cycles.<br><a href="https://coe1.annauniv.edu" target="_blank" rel="noopener noreferrer" style="color:var(--gold-500); font-weight:700;">Open Anna University COE Portal &rarr;</a>`,
        followUps: ['Exam Timetable', 'Attendance Requirements', 'Certificates & TC', 'Contact Office']
      };
    }

    if (isAskingCertificates) {
      chatSession.lastTopic = 'studentServices';
      return {
        text: `📄 <strong>Student Certificates (Bonafide, TC, Conduct):</strong><br>• ${PODHIGAI_DATA.studentServices.certificates}<br>• <strong>Available Certificates:</strong> Bonafide (for bank loans/scholarships), Transfer Certificate (TC), Conduct Certificate, and Course Completion Certificate.<br>• Contact Administrative Office: <strong>${PODHIGAI_DATA.college.phones.landline}</strong>`,
        followUps: ['Student ID Card', 'Attendance Policy', 'Administrative Office Timings', 'Contact Office']
      };
    }

    if (isAskingIDCard) {
      chatSession.lastTopic = 'studentServices';
      return {
        text: `🪪 <strong>Student Identity (ID) Card:</strong><br>• ${PODHIGAI_DATA.studentServices.idCard}<br>• Students must wear their ID card at all times inside academic blocks, laboratories, and during campus transit.`,
        followUps: ['Certificates & TC', 'Attendance Requirements', 'Office Working Hours', 'Contact Office']
      };
    }

    if (isAskingGrievance) {
      chatSession.lastTopic = 'studentServices';
      return {
        text: `🛡️ <strong>Student Grievance Redressal &amp; Anti-Ragging Cell:</strong><br>• ${PODHIGAI_DATA.studentServices.grievance}<br>• <strong>Mentorship:</strong> ${PODHIGAI_DATA.studentServices.advisors}<br><a href="${getPageLink('contact.html')}" style="color:var(--gold-500); font-weight:700;">Contact Grievance Committee &rarr;</a>`,
        followUps: ['Principal Office', 'Class Advisors', 'Administrative Timings', 'Contact Office']
      };
    }

    // 7.3 Dynamic Events Queries (Date-Aware)
    if (isAskingEvents) {
      chatSession.lastTopic = 'events';
      if (/\b(symposium|technova|expo|paper presentation|tech fest)\b/i.test(q)) {
        return getDynamicEventsReply('symposium', q);
      }
      if (/\b(hackathon|code marathon|coding marathon|hack)\b/i.test(q)) {
        return getDynamicEventsReply('hackathon', q);
      }
      if (/\b(workshop|masterclass|hands on)\b/i.test(q)) {
        return getDynamicEventsReply('workshop', q);
      }
      if (/\b(cultural|culturals|sangamam|arts fest|annual day|dance|music)\b/i.test(q)) {
        return getDynamicEventsReply('cultural', q);
      }
      if (/\b(sport|sports|athletic|championship)\b/i.test(q)) {
        return getDynamicEventsReply('sports', q);
      }
      if (/\b(placement event|placement day|recruiter felicitation)\b/i.test(q)) {
        return getDynamicEventsReply('placement', q);
      }
      if (/\b(next|upcoming|today|tomorrow)\b/i.test(q)) {
        return getDynamicEventsReply('next', q);
      }
      return getDynamicEventsReply('all', q);
    }

    // 7.4 Admissions Coverage (Cutoff, Documents, Lateral, Code, Quotas, General)
    if (isAskingCutoff) {
      chatSession.lastTopic = 'admission';
      return {
        text: `📊 <strong>Cutoff &amp; Eligibility Calculation:</strong><br>• <strong>Cutoff Formula:</strong> ${PODHIGAI_DATA.admissions.cutoffCalculation}<br>• <strong>TNEA Counselling Code:</strong> <strong>${PODHIGAI_DATA.admissions.tneaCode}</strong><br>• <strong>Eligibility:</strong> ${PODHIGAI_DATA.admissions.eligibility}<br><br>💡 <em>Both Single-Window TNEA Counselling and Direct Management Quota seats are available for eligible candidates.</em>`,
        followUps: ['Admissions Process', 'Required Documents', 'Scholarships Available', 'Fee Structure']
      };
    }

    if (isAskingDocuments) {
      chatSession.lastTopic = 'admission';
      return {
        text: `📋 <strong>Required Documents for Admission:</strong><br>Please bring original and photocopies of the following certificates:<br>• ${PODHIGAI_DATA.admissions.documents.join('<br>• ')}<br><br>📞 <em>Admissions Helpline: ${PODHIGAI_DATA.admissions.helpline}</em>`,
        followUps: ['Admissions Process', 'Cutoff Calculation', 'Scholarships Available', 'TNEA Code 1525']
      };
    }

    if (isAskingLateral) {
      chatSession.lastTopic = 'admission';
      return {
        text: `🎓 <strong>Lateral Entry Admissions (Direct 2nd Year):</strong><br>• ${PODHIGAI_DATA.admissions.lateralEntry}<br>• Available across all 6 B.E. &amp; B.Tech departments.<br>• <strong>Documents Required:</strong> 10th Marksheet, 3-Year Polytechnic Diploma Certificate &amp; all semester marksheets, Transfer Certificate (TC), and Community Certificate.<br><a href="${getPageLink('contact.html')}" style="color:var(--gold-500); font-weight:700;">Apply for Lateral Entry &rarr;</a>`,
        followUps: ['Required Documents', 'Fees & Scholarships', 'Courses Available', 'Contact Admissions']
      };
    }

    if (isAskingManagementQuota) {
      chatSession.lastTopic = 'admission';
      return {
        text: `🏛️ <strong>Management Quota Admissions 2025–2026:</strong><br>• ${PODHIGAI_DATA.admissions.managementQuota}<br>• <strong>Eligibility:</strong> Pass in 10+2 / HSC with Physics, Chemistry, and Mathematics (PCM).<br>• <strong>Desk Location:</strong> Admissions Block, Salem Main Road, Adiyur, Tirupattur.<br>📞 <em>Direct Admission Helpline: <strong>${PODHIGAI_DATA.admissions.helpline}</strong> (${PODHIGAI_DATA.admissions.officeHours})</em>`,
        followUps: ['Required Documents', 'Eligibility Criteria', 'Fee Structure', '6 Degree Programs']
      };
    }

    if (isAskingTneaCode) {
      chatSession.lastTopic = 'admission';
      return {
        text: `🏛️ <strong>TNEA Counselling Code:</strong><br>Podhigai College of Engineering &amp; Technology's official TNEA Counselling Code is <strong>1525</strong>.<br>• Select <strong>Code 1525</strong> during Anna University single-window counselling choice filling.<br>• <strong>Location:</strong> Tirupattur, Tamil Nadu.`,
        followUps: ['How to apply?', 'Cutoff Calculation', '6 Degree Programs', 'Contact Office']
      };
    }

    if (isAskingFirstGraduate) {
      chatSession.lastTopic = 'fees';
      return {
        text: `🎓 <strong>First Graduate Tuition Fee Concession:</strong><br>• ${PODHIGAI_DATA.admissions.firstGraduate}<br>• Applicable for students whose parents or siblings have not obtained a degree.<br>• <strong>Documents Needed:</strong> First Graduate Certificate from Tahsildar &amp; Joint Declaration form signed by parents.<br>📞 <em>Admissions Helpline: ${PODHIGAI_DATA.admissions.helpline}</em>`,
        followUps: ['7.5% Govt School Quota', 'General Fee Policy', 'Admission Process', 'Required Documents']
      };
    }

    if (isAskingGovtSchoolQuota) {
      chatSession.lastTopic = 'fees';
      return {
        text: `🏫 <strong>7.5% Government School Quota (Free Education):</strong><br>• ${PODHIGAI_DATA.admissions.govtSchoolQuota}<br>• 100% free engineering seat allocated via Anna University TNEA single-window counselling.<br>• <strong>Counselling Code:</strong> <strong>${PODHIGAI_DATA.admissions.tneaCode}</strong>`,
        followUps: ['First Graduate Concession', 'TNEA Code 1525', 'Cutoff Calculation', 'Required Documents']
      };
    }

    if (isAskingAdmission) {
      chatSession.lastTopic = 'admission';
      return {
        text: `📋 <strong>Admissions 2025–2026:</strong><br>• <strong>TNEA Counselling Code:</strong> <strong>${PODHIGAI_DATA.admissions.tneaCode}</strong><br>• <strong>Admission Pathways:</strong><br>&nbsp;&nbsp;1. <strong>TNEA Government Quota:</strong> Anna University single-window counselling (Code 1525).<br>&nbsp;&nbsp;2. <strong>Management Quota:</strong> Direct seat reservation at campus admissions desk.<br>&nbsp;&nbsp;3. <strong>Lateral Entry:</strong> Direct 2nd year admission for Polytechnic Diploma holders.<br>• <strong>Eligibility:</strong> ${PODHIGAI_DATA.admissions.eligibility}<br>• <strong>Admissions Desk:</strong> ${PODHIGAI_DATA.admissions.helpline} (${PODHIGAI_DATA.admissions.officeHours})<br><a href="${getPageLink('contact.html')}" style="color:var(--gold-500); font-weight:700;">Online Admissions Enquiry &rarr;</a>`,
        followUps: ['Cutoff Calculation', 'Required Documents', 'Scholarships Available', 'Fee Structure']
      };
    }

    // 7.5 Fees & Scholarships
    if (isAskingScholarship) {
      chatSession.lastTopic = 'fees';
      return {
        text: `💰 <strong>Scholarships &amp; Government Fee Concessions:</strong><br>Podhigai College fully supports all government and institutional scholarship schemes:<br>• ${PODHIGAI_DATA.fees.scholarships.join('<br>• ')}<br><br><em>Our admissions staff provides complete assistance with scholarship application paperwork during enrollment!</em>`,
        followUps: ['General Fee Policy', 'First Graduate Concession', 'Admission Process', 'Contact Accounts']
      };
    }

    if (isAskingFees) {
      chatSession.lastTopic = 'fees';
      return {
        text: `💰 <strong>Fee Structure &amp; Regulations:</strong><br>• ${PODHIGAI_DATA.fees.policy}<br>• Full financial support available under <strong>First Graduate concession, Post-Matric SC/ST scholarship, BC/MBC welfare, and 7.5% Govt School Quota</strong>.<br>• ${PODHIGAI_DATA.fees.disclaimer}`,
        followUps: ['Scholarship Schemes', 'First Graduate Concession', 'Hostel Accommodation', 'Contact Admissions']
      };
    }

    // 7.6 Specific Hostel Intents
    if (isAskingHostelBoys) {
      chatSession.lastTopic = 'hostel';
      return {
        text: `🏠 <strong>Boys Residential Hostel:</strong><br>• ${PODHIGAI_DATA.hostel.boysHostel}<br>• <strong>Mess:</strong> ${PODHIGAI_DATA.hostel.mess}<br>• Contact Hostel Office: <strong>${PODHIGAI_DATA.hostel.contact}</strong>`,
        followUps: ['Hostel Mess & Food', 'Girls Residential Hostel', 'Hostel Fees', 'Campus Facilities']
      };
    }

    if (isAskingHostelGirls) {
      chatSession.lastTopic = 'hostel';
      return {
        text: `🏠 <strong>Girls Residential Hostel:</strong><br>• ${PODHIGAI_DATA.hostel.girlsHostel}<br>• <strong>Mess:</strong> ${PODHIGAI_DATA.hostel.mess}<br>• Contact Hostel Office: <strong>${PODHIGAI_DATA.hostel.contact}</strong>`,
        followUps: ['Hostel Mess & Food', 'Boys Residential Hostel', 'Hostel Fees', 'Campus Facilities']
      };
    }

    if (isAskingHostelMess) {
      chatSession.lastTopic = 'hostel';
      return {
        text: `🍽️ <strong>Hostel Dining &amp; Mess:</strong><br>• ${PODHIGAI_DATA.hostel.mess}<br>• Modern steam-operated kitchen ensuring utmost hygiene, regular nutritional inspections, and purified RO drinking water.`,
        followUps: ['Hostel Amenities', 'Boys & Girls Blocks', 'Hostel Fees', 'Contact Office']
      };
    }

    if (isAskingHostel) {
      chatSession.lastTopic = 'hostel';
      return {
        text: `🏠 <strong>Hostel &amp; Dining Facilities:</strong><br>• <strong>Accommodation:</strong> ${PODHIGAI_DATA.hostel.details}<br>• <strong>Food &amp; Mess:</strong> ${PODHIGAI_DATA.hostel.mess}<br>• <strong>Amenities:</strong> ${PODHIGAI_DATA.hostel.amenities}<br>• ${PODHIGAI_DATA.hostel.contact}<br><a href="${getPageLink('campus.html')}" style="color:var(--gold-500); font-weight:700;">Campus &amp; Hostel Life &rarr;</a>`,
        followUps: ['Hostel Mess & Food', 'Boys & Girls Blocks', 'College Transport Fleet', 'Contact Office']
      };
    }

    // 7.7 Transport Fleet & Specific Towns
    if (isAskingTransportTown) {
      chatSession.lastTopic = 'transport';
      return {
        text: `🚌 <strong>College Bus Route Coverage:</strong><br>Yes! Podhigai College buses run daily on dedicated routes connecting <strong>Tirupattur, Vaniyambadi, Jolarpettai, Natrampalli, Alangayam, Bargur, Kandhili, Uthangarai</strong>, and neighboring localities.<br>• <strong>Timings:</strong> ${PODHIGAI_DATA.transport.timings}<br>• <strong>Fee Schedule:</strong> ${PODHIGAI_DATA.transport.fees}<br>📞 <em>Transport Helpline: <strong>${PODHIGAI_DATA.college.phones.landline}</strong></em>`,
        followUps: ['All Bus Routes', 'Hostel Facilities', 'Campus Location', 'Office Timings']
      };
    }

    if (isAskingTransport) {
      chatSession.lastTopic = 'transport';
      return {
        text: `🚌 <strong>College Transport Fleet &amp; Bus Routes:</strong><br>• ${PODHIGAI_DATA.transport.fleet}<br>• <strong>Key Covered Routes &amp; Towns:</strong><br>&nbsp;&nbsp;<strong>${PODHIGAI_DATA.transport.routes.join(' &bull; ')}</strong> and surrounding localities.<br>• <strong>Timings:</strong> ${PODHIGAI_DATA.transport.timings}<br>• ${PODHIGAI_DATA.transport.features}<br><a href="${getPageLink('campus.html')}">Explore Campus &amp; Transit &rarr;</a>`,
        followUps: ['Campus Location', 'Hostel Facilities', 'Admissions 2025', 'Contact Office']
      };
    }

    // 7.8 Specific Facilities Intents
    if (isAskingLibrary) {
      chatSession.lastTopic = 'facilities';
      return {
        text: `📖 <strong>Central Digital Library:</strong><br>• ${PODHIGAI_DATA.campus.library}<br>• Extensive collection of curriculum textbooks, reference manuals, and online IEEE e-journals.<br><a href="${getPageLink('campus.html')}">Explore Campus Facilities &rarr;</a>`,
        followUps: ['Smart Classrooms', 'High-Speed Wi-Fi', 'Engineering Labs', 'Hostel Facilities']
      };
    }

    if (isAskingAuditorium) {
      chatSession.lastTopic = 'facilities';
      return {
        text: `🏛️ <strong>Auditorium &amp; Seminar Halls:</strong><br>• ${PODHIGAI_DATA.campus.auditorium}<br>• Regularly hosts national technical symposia, hackathons, guest lectures, cultural extravaganzas, and corporate placement days.`,
        followUps: ['Central Digital Library', 'Campus Wi-Fi', 'Upcoming Events', 'All Facilities']
      };
    }

    if (isAskingWifi) {
      chatSession.lastTopic = 'facilities';
      return {
        text: `📶 <strong>Campus Wi-Fi &amp; Internet Connectivity:</strong><br>• ${PODHIGAI_DATA.campus.wifi}<br>• Seamless high-speed connectivity supporting cloud software laboratories, student coding sprints, and digital research.`,
        followUps: ['Central Digital Library', 'Smart Classrooms', 'Engineering Labs', 'Campus Tour']
      };
    }

    if (isAskingCafeteria) {
      chatSession.lastTopic = 'facilities';
      return {
        text: `☕ <strong>Cafeteria &amp; Campus Food Court:</strong><br>• ${PODHIGAI_DATA.campus.cafeteria}<br>• Serves freshly prepared vegetarian and non-vegetarian meals, snacks, and beverages throughout working hours.`,
        followUps: ['Hostel Mess & Dining', 'Campus Life', 'Sports Facilities', 'All Facilities']
      };
    }

    if (isAskingSports) {
      chatSession.lastTopic = 'facilities';
      return {
        text: `🏆 <strong>Sports &amp; Athletics Facilities:</strong><br>• ${PODHIGAI_DATA.campus.sports}<br>• Active participation in Anna University Zonal tournaments and state engineering sports meets.`,
        followUps: ['Student Clubs', 'Campus Life', 'Cultural Fest', 'All Facilities']
      };
    }

    if (isAskingClinic) {
      chatSession.lastTopic = 'facilities';
      return {
        text: `🏥 <strong>Health &amp; Medical First-Aid Clinic:</strong><br>• ${PODHIGAI_DATA.campus.clinic}<br>• Immediate emergency care, first-aid kits, and ambulance tie-ups ensure round-the-clock student and staff health security.`,
        followUps: ['Campus Security', 'Hostel Amenities', 'Campus Tour', 'Contact Office']
      };
    }

    if (isAskingSecurity) {
      chatSession.lastTopic = 'facilities';
      return {
        text: `🛡️ <strong>Campus Security, Water &amp; Power Utilities:</strong><br>• <strong>Security:</strong> ${PODHIGAI_DATA.campus.security}<br>• <strong>Water &amp; Power:</strong> ${PODHIGAI_DATA.campus.water}`,
        followUps: ['Health Clinic', 'Hostel Facilities', 'Take a Campus Tour', 'Contact Office']
      };
    }

    if (isAskingFacilities) {
      chatSession.lastTopic = 'facilities';
      return {
        text: `🏛️ <strong>Campus Infrastructure &amp; Amenities:</strong><br>• <strong>Laboratories:</strong> ${PODHIGAI_DATA.campus.labs}<br>• <strong>Smart Classrooms:</strong> ${PODHIGAI_DATA.campus.classrooms}<br>• <strong>Digital Library:</strong> ${PODHIGAI_DATA.campus.library}<br>• <strong>Cafeteria:</strong> ${PODHIGAI_DATA.campus.cafeteria}<br>• <strong>Connectivity &amp; Utilities:</strong> ${PODHIGAI_DATA.campus.wifi}, ${PODHIGAI_DATA.campus.water}<br>• <strong>Health &amp; Security:</strong> ${PODHIGAI_DATA.campus.clinic}, ${PODHIGAI_DATA.campus.security}<br><a href="${getPageLink('campus.html')}" style="color:var(--gold-500); font-weight:700;">Take a Campus Tour &rarr;</a>`,
        followUps: ['Central Digital Library', 'Hostel Facilities', 'College Transport', 'Sports Grounds']
      };
    }

    // 7.9 Student Clubs
    if (isAskingClubs) {
      chatSession.lastTopic = 'studentLife';
      return {
        text: `🌟 <strong>Student Clubs &amp; Technical Societies:</strong><br>• ${PODHIGAI_DATA.studentLife.clubs.join('<br>• ')}<br><br>🎉 <strong>Events &amp; Outreach:</strong> ${PODHIGAI_DATA.studentLife.events}`,
        followUps: ['Upcoming Events', 'TechNova Symposium', 'Sports Facilities', 'Campus Life']
      };
    }

    // PART 3-1: NEW — 7.9b Institutional Cells (distinct from clubs — these are official bodies, not student societies)
    // Trigger keywords: career guidance cell | entrepreneurship cell / edc / startup cell |
    //   women empowerment cell / women safety cell | iqac / quality cell / naac cell |
    //   nss activities | yrc activities
    const isAskingCareerGuidanceCell = /\b(career guidance cell|career cell|career guidance)\b/i.test(q);
    const isAskingEDC = /\b(edc|entrepreneurship cell|entrepreneurship development cell|startup cell|startup awareness)\b/i.test(q);
    const isAskingWomenCell = /\b(women empowerment cell|women cell|women safety cell|women leadership)\b/i.test(q);
    const isAskingIQAC = /\b(iqac|quality cell|naac cell|internal quality assurance|quality assurance cell)\b/i.test(q);
    const isAskingNSSActivities = /\b(nss activities|nss cell|national service scheme activities)\b/i.test(q);
    const isAskingYRCActivities = /\b(yrc activities|yrc cell|youth red cross activities)\b/i.test(q);
    const isAskingAnyCells = isAskingCareerGuidanceCell || isAskingEDC || isAskingWomenCell || isAskingIQAC || isAskingNSSActivities || isAskingYRCActivities || /\b(institutional cell|student cells|college cells|cells in college|all cells)\b/i.test(q);

    if (isAskingCareerGuidanceCell) {
      chatSession.lastTopic = 'studentLife';
      return {
        text: `🎯 <strong>${PODHIGAI_DATA.cells.careerGuidance.name}:</strong><br>${PODHIGAI_DATA.cells.careerGuidance.description}<br><br><em>Distinct from student clubs — this is an official institutional cell providing structured placement support.</em>`,
        followUps: ['Placement Support', 'EDC Cell', 'Student Clubs', 'Upcoming Events']
      };
    }
    if (isAskingEDC) {
      chatSession.lastTopic = 'studentLife';
      return {
        text: `🚀 <strong>${PODHIGAI_DATA.cells.edc.name}:</strong><br>${PODHIGAI_DATA.cells.edc.description}<br><br><em>The EDC nurtures the next generation of student entrepreneurs through real-world business exposure.</em>`,
        followUps: ['Career Guidance Cell', 'Women Empowerment Cell', 'Student Clubs', 'Upcoming Events']
      };
    }
    if (isAskingWomenCell) {
      chatSession.lastTopic = 'studentLife';
      return {
        text: `🌸 <strong>${PODHIGAI_DATA.cells.womenEmpowerment.name}:</strong><br>${PODHIGAI_DATA.cells.womenEmpowerment.description}`,
        followUps: ['IQAC Cell', 'NSS Activities', 'Student Grievance Cell', 'Campus Safety']
      };
    }
    if (isAskingIQAC) {
      chatSession.lastTopic = 'studentLife';
      return {
        text: `📊 <strong>${PODHIGAI_DATA.cells.iqac.name}:</strong><br>${PODHIGAI_DATA.cells.iqac.description}`,
        followUps: ['Women Empowerment Cell', 'Career Guidance Cell', 'About College', 'Accreditation']
      };
    }
    if (isAskingNSSActivities) {
      chatSession.lastTopic = 'studentLife';
      return {
        text: `🌿 <strong>${PODHIGAI_DATA.cells.nss.name}:</strong><br>${PODHIGAI_DATA.cells.nss.description}<br><br><em>NSS is an institutional cell with dedicated faculty coordinators — distinct from the student-run Clubs.</em>`,
        followUps: ['YRC Activities', 'Student Clubs', 'Upcoming Events', 'Campus Life']
      };
    }
    if (isAskingYRCActivities) {
      chatSession.lastTopic = 'studentLife';
      return {
        text: `🏥 <strong>${PODHIGAI_DATA.cells.yrc.name}:</strong><br>${PODHIGAI_DATA.cells.yrc.description}<br><br><em>YRC is an institutional cell with dedicated faculty coordinators — distinct from the student-run Clubs.</em>`,
        followUps: ['NSS Activities', 'Student Clubs', 'Campus Health Clinic', 'Upcoming Events']
      };
    }
    if (isAskingAnyCells) {
      chatSession.lastTopic = 'studentLife';
      const c = PODHIGAI_DATA.cells;
      return {
        text: `🏛️ <strong>Official Institutional Cells at Podhigai College:</strong><br>These are distinct from student clubs — each cell is an officially constituted body with faculty coordinators:<br>• <strong>${c.careerGuidance.name}:</strong> ${c.careerGuidance.description}<br>• <strong>${c.edc.name}:</strong> ${c.edc.description}<br>• <strong>${c.womenEmpowerment.name}:</strong> ${c.womenEmpowerment.description}<br>• <strong>${c.iqac.name}:</strong> ${c.iqac.description}<br>• <strong>${c.nss.name}:</strong> ${c.nss.description}<br>• <strong>${c.yrc.name}:</strong> ${c.yrc.description}`,
        followUps: ['Career Guidance Cell', 'EDC Cell', 'IQAC Cell', 'Student Clubs']
      };
    }

    // 7.10 Location & Directions
    if (isAskingLocation) {
      chatSession.lastTopic = 'location';
      return {
        text: `📍 <strong>Campus Address &amp; Directions:</strong><br><strong>${PODHIGAI_DATA.college.name}</strong><br>${PODHIGAI_DATA.college.address}<br><br>🚗 <strong>How to Reach:</strong><br>• ${PODHIGAI_DATA.college.directions}<br><br>🗺️ <a href="${PODHIGAI_DATA.college.mapsUrl}" target="_blank" rel="noopener noreferrer" style="color:var(--gold-500); font-weight:700;">Open in Google Maps &amp; Get Directions &rarr;</a>`,
        followUps: ['College Transport Fleet', 'Admissions Helpline', 'Hostel Facilities', 'Office Timings']
      };
    }

    // 7.11 Contact & Office Timings
    if (isAskingContact) {
      chatSession.lastTopic = 'contact';
      return {
        text: `📞 <strong>Official Contact Coordinates &amp; Timings:</strong><br>• <strong>Landline:</strong> ${PODHIGAI_DATA.college.phones.landline}<br>• <strong>Admissions Mobile / WhatsApp:</strong> ${PODHIGAI_DATA.college.phones.mobile}<br>• <strong>Official Email:</strong> ${PODHIGAI_DATA.college.phones.email}<br><br>⏰ <strong>Working Hours:</strong><br>• <strong>Academic Classes:</strong> ${PODHIGAI_DATA.college.timings.classes}<br>• <strong>Administrative Office:</strong> ${PODHIGAI_DATA.college.timings.office}<br>• <strong>Central Library:</strong> ${PODHIGAI_DATA.college.timings.library}<br><a href="${getPageLink('contact.html')}" style="color:var(--gold-500); font-weight:700;">Contact Form &amp; Map &rarr;</a>`,
        followUps: ['Campus Location', 'Admissions 2025', 'TNEA Code 1525', '6 Degree Programs']
      };
    }

    // 7.12 About College, Leadership & Affiliations
    if (isAskingAbout) {
      chatSession.lastTopic = 'about';
      return {
        text: `🏛️ <strong>About Podhigai College of Engineering &amp; Technology:</strong><br>• <strong>Legacy &amp; Established:</strong> ${PODHIGAI_DATA.college.history}<br>• <strong>Trust &amp; Founder:</strong> Administered under the ${PODHIGAI_DATA.college.trust}.<br>• <strong>Leadership:</strong> Headed by Chairman <strong>${PODHIGAI_DATA.college.chairman}</strong> and the Principal &amp; Academic Council.<br>• <strong>Affiliation &amp; Approval:</strong> ${PODHIGAI_DATA.college.affiliation}, ${PODHIGAI_DATA.college.aicte}.<br>• <strong>Autonomy Status:</strong> ${PODHIGAI_DATA.college.autonomy}<br>• <strong>TNEA Code:</strong> <strong>${PODHIGAI_DATA.college.tneaCode}</strong><br><br>🎯 <strong>Vision:</strong> ${PODHIGAI_DATA.college.vision}<br>🚀 <strong>Mission:</strong> ${PODHIGAI_DATA.college.mission}<br>💎 <strong>Core Values:</strong> ${PODHIGAI_DATA.college.values}<br><a href="${getPageLink('about.html')}" style="color:var(--gold-500); font-weight:700;">Read Detailed Institution History &rarr;</a>`,
        followUps: ['What programs are offered?', 'TNEA 1525 Admissions', '100% Placement Support', 'Campus Facilities']
      };
    }

    // 7.13 All Programs List
    if (isAskingCoursesAll) {
      chatSession.lastTopic = 'courses';
      return {
        text: `🎓 <strong>Undergraduate Engineering Programs Offered:</strong><br>Podhigai College offers 6 undergraduate Anna University affiliated degrees:<br>1. <strong><a href="${getPageLink('departments/it.html')}">B.Tech Information Technology (IT)</a></strong><br>2. <strong><a href="${getPageLink('departments/aids.html')}">B.Tech Artificial Intelligence &amp; Data Science (AI &amp; DS)</a></strong><br>3. <strong><a href="${getPageLink('departments/cse.html')}">B.E. Computer Science &amp; Engineering (CSE)</a></strong><br>4. <strong><a href="${getPageLink('departments/ece.html')}">B.E. Electronics &amp; Communication Engineering (ECE)</a></strong><br>5. <strong><a href="${getPageLink('departments/eee.html')}">B.E. Electrical &amp; Electronics Engineering (EEE)</a></strong><br>6. <strong><a href="${getPageLink('departments/mech.html')}">B.E. Mechanical Engineering</a></strong><br><br>💡 <em>All programs are 4-Year Full-Time Degrees approved by AICTE.</em>`,
        followUps: ['Tell me about IT', 'Tell me about CSE', 'Tell me about AI & DS', 'Admissions 2025']
      };
    }

    // 7.14 General FAQ
    if (/\b(faq|faqs|question|questions|enquiry|query|clarification)\b/i.test(q)) {
      chatSession.lastTopic = 'faq';
      return {
        text: `❓ <strong>Frequently Asked Questions &amp; Support:</strong><br>• <strong>TNEA Code:</strong> 1525<br>• <strong>Degrees:</strong> 6 B.E. &amp; B.Tech programs<br>• <strong>Admissions:</strong> TNEA single-window counselling + Direct Management quota.<br>• <strong>Scholarships:</strong> Full support for First Graduate, SC/ST, BC/MBC, and 7.5% Govt School quota.<br><a href="${getPageLink('faq.html')}" style="color:var(--gold-500); font-weight:700;">Visit Full Admissions FAQ Page &rarr;</a>`,
        followUps: ['Cutoff Calculation', 'Admissions Process', 'Fees & Scholarships', 'Placements']
      };
    }

    // ── 8. INTELLIGENT FALLBACK FOR UNKNOWN QUESTIONS ──
    return {
      text: `I am specialized in answering questions about <strong>Podhigai College of Engineering &amp; Technology</strong>. While I don't have information on that specific non-campus topic, I can instantly assist you with:<br>• <strong>Academic Programs:</strong> 6 B.E. &amp; B.Tech Degrees<br>• <strong>Admissions 2025:</strong> TNEA Code 1525, Cutoff &amp; Documents<br>• <strong>Fees &amp; Scholarships:</strong> Concessions &amp; First Graduate support<br>• <strong>Placements:</strong> 100% Support &amp; Top Recruiters<br>• <strong>Campus Amenities:</strong> Hostels, Transport Fleet &amp; Facilities<br>• <strong>Student Services:</strong> Certificates, Attendance (75%) &amp; Exam Cell<br><br><em>For administrative questions, contact the college office directly at <strong>${PODHIGAI_DATA.college.phones.landline}</strong> or <strong>${PODHIGAI_DATA.college.phones.email}</strong>!</em>`,
      followUps: ['Explore Programs', 'Admissions 2025', 'Fees & Scholarships', 'Placements Support', 'Events Calendar', 'Campus Address']
    };
  };

  const botReply = (question) => {
    return getBotEngineReply(question);
  };

  const handleSend = () => {
    const text = chatInput?.value.trim();
    if (!text) return;
    appendMsg(text, 'user');
    chatInput.value = '';

    // Animated Typing Indicator
    const typingWrap = document.createElement('div');
    typingWrap.className = 'typing-wrap';
    typingWrap.innerHTML = `
      <div class="msg-avatar">✦</div>
      <div class="typing"><span></span><span></span><span></span></div>
    `;
    chatBody?.appendChild(typingWrap);
    chatBody.scrollTop = chatBody.scrollHeight;

    setTimeout(() => {
      typingWrap.remove();
      const replyData = getBotEngineReply(text);
      if (typeof replyData === 'object' && replyData.text) {
        appendMsg(replyData.text, 'bot', replyData.followUps || []);
      } else {
        appendMsg(String(replyData), 'bot');
      }
    }, 450 + Math.random() * 250);
  };

  chatSend?.addEventListener('click', handleSend);
  chatInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  // Quick reply buttons
  document.querySelectorAll('.qr-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const q = btn.getAttribute('data-q') || btn.textContent;
      if (chatInput && q) {
        chatInput.value = q;
        handleSend();
      }
    });
  });

  /* --------------------------------------------------------------------------
     7. ADMIN-MANAGED EVENTS & EVENT GALLERY LIGHTBOX SYSTEM
     -------------------------------------------------------------------------- */
  let isEventsExpanded = false;

  // Event Gallery Lightbox Elements
  const eventModal = document.getElementById('eventGalleryModal');
  const eventModalClose = document.getElementById('eventModalClose');
  const eventModalImg = document.getElementById('eventModalImg');
  const eventModalTitle = document.getElementById('eventModalTitle');
  const eventModalMeta = document.getElementById('eventModalMeta');
  const eventModalDesc = document.getElementById('eventModalDesc');
  const eventModalThumbnails = document.getElementById('eventModalThumbnails');
  const eventModalPrev = document.getElementById('eventModalPrev');
  const eventModalNext = document.getElementById('eventModalNext');

  let activeEventGallery = [];
  let currentPhotoIndex = 0;

  const openEventGallery = (eventId) => {
    const event = currentEvents.find(e => e.id === eventId) || DEFAULT_EVENTS.find(e => e.id === eventId);
    if (!event || !eventModal) return;

    activeEventGallery = Array.isArray(event.gallery) && event.gallery.length ? event.gallery : [event.coverImage || 'images/event-technova-symposium.png'];
    currentPhotoIndex = 0;

    if (eventModalTitle) eventModalTitle.textContent = event.title;
    if (eventModalMeta) eventModalMeta.textContent = `📅 ${event.date} • 📍 ${event.venue} • 🏷️ ${event.category}`;
    if (eventModalDesc) eventModalDesc.textContent = event.description;

    updateModalPhoto();
    renderModalThumbnails();

    eventModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeEventGallery = () => {
    if (!eventModal) return;
    eventModal.classList.remove('active');
    document.body.style.overflow = '';
  };

  const updateModalPhoto = () => {
    if (!eventModalImg || !activeEventGallery.length) return;
    eventModalImg.src = activeEventGallery[currentPhotoIndex];
    if (eventModalThumbnails) {
      eventModalThumbnails.querySelectorAll('.em-thumb').forEach((thumb, idx) => {
        thumb.classList.toggle('active', idx === currentPhotoIndex);
      });
    }
  };

  const renderModalThumbnails = () => {
    if (!eventModalThumbnails) return;
    eventModalThumbnails.innerHTML = activeEventGallery.map((src, idx) => `
      <div class="em-thumb ${idx === 0 ? 'active' : ''}" data-idx="${idx}">
        <img src="${src}" alt="Event thumbnail ${idx + 1}" loading="lazy">
      </div>
    `).join('');

    eventModalThumbnails.querySelectorAll('.em-thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        currentPhotoIndex = parseInt(thumb.getAttribute('data-idx')) || 0;
        updateModalPhoto();
      });
    });
  };

  eventModalPrev?.addEventListener('click', () => {
    if (!activeEventGallery.length) return;
    currentPhotoIndex = (currentPhotoIndex - 1 + activeEventGallery.length) % activeEventGallery.length;
    updateModalPhoto();
  });

  eventModalNext?.addEventListener('click', () => {
    if (!activeEventGallery.length) return;
    currentPhotoIndex = (currentPhotoIndex + 1) % activeEventGallery.length;
    updateModalPhoto();
  });

  eventModalClose?.addEventListener('click', closeEventGallery);
  eventModal?.addEventListener('click', (e) => {
    if (e.target === eventModal) closeEventGallery();
  });

  // Keyboard navigation for Event Gallery Lightbox
  document.addEventListener('keydown', (e) => {
    if (!eventModal || !eventModal.classList.contains('active')) return;
    if (e.key === 'Escape') closeEventGallery();
    if (e.key === 'ArrowRight' && activeEventGallery.length) {
      currentPhotoIndex = (currentPhotoIndex + 1) % activeEventGallery.length;
      updateModalPhoto();
    }
    if (e.key === 'ArrowLeft' && activeEventGallery.length) {
      currentPhotoIndex = (currentPhotoIndex - 1 + activeEventGallery.length) % activeEventGallery.length;
      updateModalPhoto();
    }
  });

  const renderEvents = () => {
    const featuredContainer = document.getElementById('featuredEventCard');
    const gridContainer = document.getElementById('eventsGrid');
    const actionsContainer = document.getElementById('eventsActionsContainer');
    if (!gridContainer) return;

    currentEvents = getEvents();
    const featured = currentEvents.find(e => e.featured) || currentEvents[0];
    const regularEvents = currentEvents.filter(e => e.id !== featured?.id);

    // 1. Render Featured / Flagship Event
    if (featuredContainer && featured) {
      featuredContainer.innerHTML = `
        <div class="featured-event-card reveal">
          <div class="featured-event-media" data-event-id="${featured.id}" role="button" tabindex="0" aria-label="Click to preview gallery for ${featured.title}">
            <img src="${featured.coverImage || 'images/event-technova-symposium.png'}" alt="${featured.title}" class="fe-img" loading="lazy">
            <span class="fe-badge">★ Featured Flagship Event</span>
            <span class="fe-category-badge">${featured.category}</span>
            <div class="event-hover-preview">
              <span class="ehp-text">Click to preview</span>
            </div>
          </div>
          <div class="featured-event-content">
            <div class="fe-meta">
              <span>📅 ${featured.date}</span>
              <span>⏰ ${featured.time}</span>
              <span>📍 ${featured.venue}</span>
            </div>
            <h3 class="fe-title">${featured.title}</h3>
            <p class="fe-desc">${featured.description}</p>
            <div class="fe-actions">
              <button type="button" class="cta-btn fe-btn" data-event-id="${featured.id}">
                <span>Explore Event &amp; Gallery</span>
                <span class="arrow">&rarr;</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }

    // 2. Determine visible regular events (4 at a time by default)
    const displayedEvents = isEventsExpanded ? regularEvents : regularEvents.slice(0, INITIAL_EVENT_COUNT);

    gridContainer.innerHTML = displayedEvents.map(evt => `
      <div class="event-card reveal">
        <div class="event-card-media" data-event-id="${evt.id}" role="button" tabindex="0" aria-label="Click to preview gallery for ${evt.title}">
          <img src="${evt.coverImage || 'images/event-placement-drive.png'}" alt="${evt.title}" class="ec-img" loading="lazy">
          <span class="ec-category">${evt.category}</span>
          <div class="event-hover-preview">
            <span class="ehp-text">Click to preview</span>
          </div>
        </div>
        <div class="event-card-body">
          <div class="ec-meta">
            <span>📅 ${evt.date}</span>
            <span>📍 ${evt.venue}</span>
          </div>
          <h4 class="ec-title">${evt.title}</h4>
          <p class="ec-desc">${evt.description}</p>
          <div class="ec-footer">
            <button type="button" class="ec-gallery-btn" data-event-id="${evt.id}">
              <span>View Gallery</span>
              <span class="arrow">&rarr;</span>
            </button>
          </div>
        </div>
      </div>
    `).join('');

    // 3. Render View More / Show Less Button
    if (actionsContainer) {
      if (regularEvents.length > INITIAL_EVENT_COUNT) {
        actionsContainer.style.display = 'flex';
        const remainingCount = regularEvents.length - INITIAL_EVENT_COUNT;
        actionsContainer.innerHTML = `
          <button type="button" class="events-view-more-btn" id="eventsToggleBtn" aria-expanded="${isEventsExpanded}">
            <span>${isEventsExpanded ? 'Show Less Events' : `View More Events (+${remainingCount})`}</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="transform: ${isEventsExpanded ? 'rotate(180deg)' : 'none'}; transition: transform 0.25s ease;">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        `;

        const toggleBtn = document.getElementById('eventsToggleBtn');
        toggleBtn?.addEventListener('click', () => {
          isEventsExpanded = !isEventsExpanded;
          renderEvents();
          const scrollCont = document.getElementById('eventsScrollContainer');
          if (scrollCont) {
            if (isEventsExpanded) {
              scrollCont.classList.add('expanded');
            } else {
              scrollCont.classList.remove('expanded');
              scrollCont.scrollTop = 0;
            }
          }
          if (!isEventsExpanded) {
            const eventsSec = document.getElementById('events');
            if (eventsSec) {
              const yOffset = -80;
              const y = eventsSec.getBoundingClientRect().top + window.pageYOffset + yOffset;
              window.scrollTo({ top: y, behavior: 'smooth' });
            }
          }
        });
      } else {
        actionsContainer.style.display = 'none';
        actionsContainer.innerHTML = '';
      }
    }

    // 4. Attach click listeners to all gallery buttons & media elements (featured + regular)
    document.querySelectorAll('[data-event-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-event-id');
        if (id) openEventGallery(id);
      });
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const id = btn.getAttribute('data-event-id');
          if (id) openEventGallery(id);
        }
      });
    });

    // 5. Trigger intersection observer for smooth reveal animations
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => {
      revealObserver.observe(el);
    });
  };

  const fetchLiveEvents = async () => {
    try {
      const res = await fetch(`${API_BASE}/events`, {
        headers: { 'Cache-Control': 'no-cache, no-store' },
        cache: 'no-store',
        signal: AbortSignal.timeout ? AbortSignal.timeout(15000) : undefined
      });
      if (res.ok) {
        const data = await res.json();
        const eventsList = Array.isArray(data) ? data : (data.events || []);
        if (Array.isArray(eventsList)) {
          localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(eventsList));
          currentEvents = eventsList.filter(e => e.published !== false);
          renderEvents();
          window.dispatchEvent(new CustomEvent('podhigai:eventsUpdated', { detail: { events: currentEvents } }));
        }
      }
    } catch {
      // Backend offline: seamless fallback to localStorage/defaults
    }
  };

  // Cross-tab and in-tab auto-sync: when admin creates/updates/deletes an event
  window.addEventListener('storage', (e) => {
    if (e.key === EVENTS_STORAGE_KEY) {
      currentEvents = getEvents();
      renderEvents();
    }
  });

  window.addEventListener('podhigai:eventsUpdated', () => {
    currentEvents = getEvents();
    renderEvents();
  });

  window.addEventListener('podhigai:openEventGallery', (e) => {
    const eventId = e.detail && e.detail.id;
    if (eventId) {
      openEventGallery(eventId);
    }
  });

  renderEvents();
  fetchLiveEvents();

  /* --------------------------------------------------------------------------
     8. ADMISSION ENQUIRY FORM HANDLER (Unified LocalStorage & API Dispatch)
     -------------------------------------------------------------------------- */
  const contactForm = document.getElementById('contactForm');
  const contactStatus = document.getElementById('contactFormStatus');

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      // If form has inline onsubmit (like in contact.html), let that handle it
      if (contactForm.getAttribute('onsubmit')) return;
      e.preventDefault();

      const nameInput = document.getElementById('cName');
      const emailInput = document.getElementById('cEmail');
      const phoneInput = document.getElementById('cPhone');
      const subjectInput = document.getElementById('cSubject');
      const messageInput = document.getElementById('cMessage');
      const submitBtn = document.getElementById('contactSubmitBtn');

      const name = nameInput?.value?.trim();
      const email = emailInput?.value?.trim();
      const phone = phoneInput?.value?.trim();
      const subject = subjectInput?.value?.trim() || 'General Admission Enquiry';
      const message = messageInput?.value?.trim() || `Admission enquiry submitted for ${subject}`;

      if (!name) {
        if (contactStatus) {
          contactStatus.className = 'contact-form-status error';
          contactStatus.innerHTML = '⚠️ Please enter your Full Name.';
          contactStatus.style.display = 'block';
        }
        nameInput?.focus();
        return;
      }

      if (!email) {
        if (contactStatus) {
          contactStatus.className = 'contact-form-status error';
          contactStatus.innerHTML = '⚠️ Please enter a valid Email Address.';
          contactStatus.style.display = 'block';
        }
        emailInput?.focus();
        return;
      }

      if (!phone) {
        if (contactStatus) {
          contactStatus.className = 'contact-form-status error';
          contactStatus.innerHTML = '⚠️ Please enter your Contact Phone Number.';
          contactStatus.style.display = 'block';
        }
        phoneInput?.focus();
        return;
      }

      // Show submitting spinner
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span style="display:inline-block; width:15px; height:15px; border:2px solid #ffffff; border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite; margin-right:8px; vertical-align:middle;"></span> Submitting Enquiry…';
      }

      // 1. Guaranteed Local Persistence for Admin Panel
      const contactItem = {
        _id: 'c_' + Date.now(),
        name,
        email,
        phone,
        subject,
        message,
        createdAt: new Date().toISOString(),
        isRead: false
      };

      try {
        const stored = JSON.parse(localStorage.getItem('podhigai_contacts') || '[]');
        stored.unshift(contactItem);
        localStorage.setItem('podhigai_contacts', JSON.stringify(stored));
      } catch (err) {
        console.warn('LocalStorage save error:', err);
      }

      // 2. Dispatch to Backend API if running
      let apiSuccess = true;
      let apiMsg = '';
      try {
        const res = await fetch(`${API_BASE}/contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone, subject, message }),
          signal: AbortSignal.timeout ? AbortSignal.timeout(3000) : undefined
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok && data.message) {
          apiSuccess = false;
          apiMsg = data.message;
        }
      } catch (apiErr) {
        // Backend offline or timeout — fine since saved in localStorage
      }

      if (!apiSuccess) {
        if (contactStatus) {
          contactStatus.className = 'contact-form-status error';
          contactStatus.innerHTML = `⚠️ <strong>Notice:</strong> ${apiMsg}`;
          contactStatus.style.display = 'block';
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Submit Admission Enquiry</span><span class="arrow">&rarr;</span>';
        }
        return;
      }

      // 3. UI Success Confirmation
      if (contactStatus) {
        contactStatus.className = 'contact-form-status success';
        contactStatus.innerHTML = `✅ <strong>Thank you, ${name}!</strong> Your admission enquiry for <em>${subject}</em> has been received successfully. Our Admissions Officer will contact you within 24 hours at <strong>${phone}</strong>.`;
        contactStatus.style.display = 'block';
      }

      contactForm.reset();

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>✓ Enquiry Submitted Successfully</span>';
        setTimeout(() => {
          submitBtn.innerHTML = '<span>Submit Admission Enquiry</span><span class="arrow">&rarr;</span>';
        }, 4000);
      }
    });
  }

  /* --------------------------------------------------------------------------
     9. HERO CHAIRMAN DYNAMIC SYNC SYSTEM (Admin-Managed)
     -------------------------------------------------------------------------- */
  const CHAIRMAN_STORAGE_KEY = 'podhigai_chairman_settings';

  const applyChairmanSettings = (settings) => {
    if (!settings) return;
    const imgEl = document.getElementById('heroChairmanImg');
    const nameEl = document.getElementById('heroChairmanName');
    const roleEl = document.getElementById('heroChairmanRole');

    if (imgEl && settings.image) {
      imgEl.src = settings.image;
      if (settings.name) imgEl.alt = `${settings.name}, ${settings.role || 'College Chairman'}`;
    }
    if (nameEl && settings.name) {
      nameEl.textContent = settings.name;
    }
    if (roleEl && settings.role) {
      roleEl.textContent = settings.role;
    }
  };

  const initHeroChairman = async () => {
    // 1. Initial render from LocalStorage
    try {
      const stored = localStorage.getItem(CHAIRMAN_STORAGE_KEY);
      if (stored) {
        applyChairmanSettings(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Error reading chairman settings from localStorage:', e);
    }

    // 2. Fetch from Backend API with cache: 'no-store'
    try {
      const res = await fetch(`${API_BASE}/chairman`, {
        headers: { 'Cache-Control': 'no-cache, no-store' },
        cache: 'no-store',
        signal: AbortSignal.timeout ? AbortSignal.timeout(15000) : undefined
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.chairman) {
          applyChairmanSettings(data.chairman);
          localStorage.setItem(CHAIRMAN_STORAGE_KEY, JSON.stringify(data.chairman));
        }
      }
    } catch (e) {
      // Backend offline, fallback to localStorage
    }

    // 3. Listen for changes from Admin panel in other tabs
    window.addEventListener('storage', (e) => {
      if (e.key === CHAIRMAN_STORAGE_KEY && e.newValue) {
        try {
          applyChairmanSettings(JSON.parse(e.newValue));
        } catch (err) { }
      }
    });

    // 4. Listen for in-window broadcast events
    window.addEventListener('podhigai:chairmanUpdated', (e) => {
      if (e.detail) applyChairmanSettings(e.detail);
    });
  };

  initHeroChairman();

  /* --------------------------------------------------------------------------
     TRUE CROSS-DEVICE REAL-TIME SYNCHRONIZATION (Socket.IO Push + REST Pull)
     -------------------------------------------------------------------------- */
  const SOCKET_SERVER_URL = API_BASE.replace(/\/api$/, '');
  let publicRealTimeSocket = null;
  let isReconnection = false;

  function createDebouncedSync(fn, waitMs = 250) {
    let timeout = null;
    return function (...args) {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        timeout = null;
        fn(...args);
      }, waitMs);
    };
  }

  const syncEvents = createDebouncedSync(async () => {
    console.log('📡 [RealTime Sync] Fetching latest events from MongoDB Atlas...');
    await fetchLiveEvents();
  }, 200);

  const syncGallery = createDebouncedSync(async () => {
    console.log('📡 [RealTime Sync] Fetching latest gallery from MongoDB Atlas...');
    await syncGalleryFromApi();
  }, 200);

  const syncChairman = createDebouncedSync(async () => {
    console.log('📡 [RealTime Sync] Fetching latest chairman from MongoDB Atlas...');
    await initHeroChairman();
  }, 200);

  function initPublicRealTimeSync() {
    if (typeof io === 'undefined') {
      // Resilient fallback if CDN script tag is still loading
      const script = document.createElement('script');
      script.src = 'https://cdn.socket.io/4.7.5/socket.io.min.js';
      script.async = true;
      script.onload = () => initPublicRealTimeSync();
      document.head.appendChild(script);
      return;
    }

    if (publicRealTimeSocket) return; // Exactly ONE active connection

    try {
      publicRealTimeSocket = io(SOCKET_SERVER_URL, {
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        transports: ['websocket', 'polling']
      });

      publicRealTimeSocket.on('connect', () => {
        console.log(`🔌 [RealTime Sync] Connected to server push: ${publicRealTimeSocket.id}`);
        if (isReconnection) {
          console.log('🔄 [RealTime Sync] Reconnection established. Catching up with latest MongoDB state...');
          syncEvents();
          syncGallery();
          syncChairman();
        }
        isReconnection = true;
      });

      publicRealTimeSocket.on('disconnect', (reason) => {
        console.warn(`🔌 [RealTime Sync] Disconnected: ${reason}`);
      });

      publicRealTimeSocket.on('reconnect', () => {
        console.log('🟢 [RealTime Sync] Reconnected to server.');
        syncEvents();
        syncGallery();
        syncChairman();
      });

      publicRealTimeSocket.on('connect_error', (err) => {
        console.warn(`🔌 [RealTime Sync] Connection error: ${err.message}`);
      });

      // Server push notifications (lightweight alerts: MongoDB is the source of truth)
      publicRealTimeSocket.on('events:updated', () => {
        syncEvents();
      });

      publicRealTimeSocket.on('gallery:updated', () => {
        syncGallery();
      });

      publicRealTimeSocket.on('chairman:updated', () => {
        syncChairman();
      });

      // Browser online event (e.g. WiFi reconnected)
      window.addEventListener('online', () => {
        console.log('🌐 [RealTime Sync] Device network online. Synchronizing latest state...');
        if (!publicRealTimeSocket.connected) {
          publicRealTimeSocket.connect();
        }
        syncEvents();
        syncGallery();
        syncChairman();
      });

    } catch (err) {
      console.error('Real-time sync initialization failed:', err);
    }
  }

  initPublicRealTimeSync();
});
