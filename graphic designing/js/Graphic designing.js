/* ============================================================
  web-script.js
  --------------------------------------------------------------
  Extracted from web-design-course-vadodara-combined.html
  (the inlined <script> block, lines 1745-2883 of the source).
  Contains Fix #1 (snappier lerp), Fix #3 (throttled ScrollTrigger.update),
  Fix #4 (cached modal state).
  ============================================================ */

        /* ============================================================
           BULLETPROOF READ MORE LOGIC (PRIORITY 1 - UNBREAKABLE)
           ============================================================ */
        document.addEventListener('click', function(e) {
            const btn = e.target.closest('.read-more-btn');
            if (!btn) return;

            e.preventDefault();
            e.stopPropagation();

            const infoSide = btn.closest('.info-side');
            if (!infoSide) return;

            const paragraph = infoSide.querySelector('p');
            if (!paragraph) return;

            const isExpanded = paragraph.classList.toggle('show-full-text');

            const textSpan = btn.querySelector('.btn-text');
            const icon = btn.querySelector('i');

            if (textSpan) {
                textSpan.textContent = isExpanded ? 'Read less' : 'Read more';
            }

            if (icon) {
                icon.className = isExpanded ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down';
            }

            btn.setAttribute('aria-expanded', isExpanded);
        }, false);


        document.addEventListener('DOMContentLoaded', function () {

            // ---------- CONFIGURATION ----------
            const WHATSAPP_URL = 'https://wa.me/917990752290';
            const FAQ_HOVER_THRESHOLD = 350;

            // ---------- UTILITY: DEBOUNCE ----------
            function debounce(func, wait = 150) {
                let timeout;
                return function (...args) {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => func.apply(this, args), wait);
                };
            }

            let cachedIsMobile = window.innerWidth <= 1024;
            function isMobile() { return cachedIsMobile; }

            // ---------- UTILITY: HTML-SAFE TEXT SPLITTING ----------
            function splitTextIntoWords(element, wordClassName, maskClassName = null) {
                Array.from(element.childNodes).forEach(node => {
                    if (node.nodeType === 3) {
                        const text = node.textContent;
                        if (!text.trim()) return;
                        const parts = text.split(/(\s+)/);
                        const fragment = document.createDocumentFragment();
                        parts.forEach(part => {
                            if (/^\s+$/.test(part)) {
                                fragment.appendChild(document.createTextNode(part));
                            } else if (part.trim().length > 0) {
                                if (maskClassName) {
                                    const mask = document.createElement('span');
                                    mask.className = maskClassName;
                                    const wordSpan = document.createElement('span');
                                    wordSpan.className = wordClassName;
                                    wordSpan.textContent = part;
                                    mask.appendChild(wordSpan);
                                    fragment.appendChild(mask);
                                } else {
                                    const wordSpan = document.createElement('span');
                                    wordSpan.className = wordClassName;
                                    wordSpan.textContent = part;
                                    fragment.appendChild(wordSpan);
                                }
                            }
                        });
                        node.replaceWith(fragment);
                    } else if (node.nodeType === 1) {
                        const unsafeTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'SVG', 'IFRAME'];
                        if (unsafeTags.includes(node.tagName)) return;
                        splitTextIntoWords(node, wordClassName, maskClassName);
                    }
                });
            }

            // ---------- PREMIUM MAGNETIC BUTTONS ----------
            if (window.matchMedia("(pointer: fine)").matches) {
                document.querySelectorAll('.magnetic').forEach(btn => {
                    btn.addEventListener('mousemove', (e) => {
                        const rect = btn.getBoundingClientRect();
                        const x = e.clientX - rect.left - rect.width / 2;
                        const y = e.clientY - rect.top - rect.height / 2;
                        btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
                    });
                    btn.addEventListener('mouseleave', () => {
                        btn.style.transform = 'translate(0px, 0px)';
                    });
                });
            }

            // ---------- LIGHTWEIGHT VANILLA JS SMOOTH SCROLL ----------
            const waFab = document.getElementById('whatsappFab');
            const scrollTopBtn = document.getElementById('scrollToTop');
            const scrollProgress = document.getElementById('scroll-progress');

            let targetScroll = window.scrollY;
            let currentScroll = window.scrollY;
            /* ============================================================
               FIX #1: Snappier lerp easing.
               Was 0.1 (floaty trailing feel). 0.14 keeps the smooth
               glide but reduces perceived scroll lag noticeably.
               ============================================================ */
            const lerpEase = 0.14;
            let rafId = null;
            let isSmoothScrolling = false;

            /* ============================================================
               FIX #4: Cached modal state.
               Instead of reading body classes + inline overflow on every
               wheel event and every animation frame (multiple DOM queries),
               we track a single boolean flag updated only when a sheet
               actually opens/closes. Removes per-frame DOM reads.
               ============================================================ */
            let anyModalOpen = false;
            function markModalOpen(open) { anyModalOpen = !!open; }

            function isModalOpen() {
                // Fast path: cached boolean (updated by open/close handlers)
                if (anyModalOpen) return true;
                // Fallback: belt-and-braces check in case flag drifts
                return document.body.style.overflow === 'hidden'
                    || document.documentElement.style.overflow === 'hidden'
                    || document.body.classList.contains('modal-open')
                    || document.body.classList.contains('snapshot-sheet-open')
                    || document.body.classList.contains('whatsapp-sheet-open');
            }

            /* ============================================================
               FIX #3: Throttle ScrollTrigger.update() during smooth scroll.
               Updating every frame recalculates ALL triggers' geometry
               each frame (~60/sec) on top of the JS-driven scrollTo + the
               header's backdrop-filter. We throttle to once per ~33ms and
               do a final update when scrolling settles.
               ============================================================ */
            let lastSTUpdate = 0;
            const ST_UPDATE_INTERVAL = 33; // ~30 updates/sec (was 60)

            function smoothScrollLoop(now) {
                if (isModalOpen()) {
                    rafId = null;
                    isSmoothScrolling = false;
                    return;
                }
                currentScroll += (targetScroll - currentScroll) * lerpEase;

                if (Math.abs(targetScroll - currentScroll) < 0.5) {
                    window.scrollTo(0, targetScroll);
                    // Final settle: push one last ScrollTrigger sync so
                    // triggers are perfectly aligned when motion stops.
                    if (window.ScrollTrigger) ScrollTrigger.update();
                    rafId = null;
                    isSmoothScrolling = false;
                    return;
                }

                window.scrollTo(0, currentScroll);

                // Throttled update instead of every-frame update
                if (window.ScrollTrigger && (now - lastSTUpdate) > ST_UPDATE_INTERVAL) {
                    ScrollTrigger.update();
                    lastSTUpdate = now;
                }

                rafId = requestAnimationFrame(smoothScrollLoop);
            }

            // MAP JITTER PERFECT SOLUTION
            const mapWrapper = document.querySelector('.map-card');
            let isOverMap = false;
            if (mapWrapper) {
                mapWrapper.addEventListener('mouseenter', () => { isOverMap = true; });
                mapWrapper.addEventListener('mouseleave', () => { isOverMap = false; });
            }

            window.addEventListener('wheel', (e) => {
                if (isModalOpen() || isOverMap) return; // Let the map scroll natively

                if (e.target.closest('.mobile-nav-panel.open') || e.target.closest('.snapshot-sheet.open') || e.target.closest('.whatsapp-sheet.open')) {
                    return;
                }

                e.preventDefault();
                isSmoothScrolling = true;

                const dynamicScrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;

                targetScroll += e.deltaY;
                targetScroll = Math.max(0, Math.min(targetScroll, dynamicScrollHeight));

                if (!rafId) {
                    lastSTUpdate = 0;
                    rafId = requestAnimationFrame(smoothScrollLoop);
                }
            }, { passive: false });

            window.addEventListener('scroll', () => {
                if (!isSmoothScrolling) {
                    targetScroll = window.scrollY;
                    currentScroll = window.scrollY;
                }
            }, { passive: true });

            function handleScroll() {
                const ws = window.scrollY || document.documentElement.scrollTop;
                const dynamicScrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
                if (dynamicScrollHeight > 0 && scrollProgress) {
                    scrollProgress.style.transform = `scaleX(${ws / dynamicScrollHeight})`;
                }
                if (ws > 300) {
                    if (scrollTopBtn) scrollTopBtn.classList.add('visible');
                    if (!isMobile() && waFab) waFab.classList.add('shifted');
                } else {
                    if (scrollTopBtn) scrollTopBtn.classList.remove('visible');
                    if (!isMobile() && waFab) waFab.classList.remove('shifted');
                }
            }
            window.addEventListener('scroll', handleScroll, { passive: true });

            document.querySelectorAll('a[href^="#"]').forEach(a => {
                a.addEventListener('click', function (e) {
                    const t = this.getAttribute('href');
                    if (t && t.startsWith('#') && t !== '#' && !this.classList.contains('mobile-toggle')) {
                        e.preventDefault();
                        const targetEl = document.querySelector(t);
                        if (targetEl) {
                            const rect = targetEl.getBoundingClientRect();
                            targetScroll = window.scrollY + rect.top - 70;
                            isSmoothScrolling = true;
                            if (!rafId) {
                                lastSTUpdate = 0;
                                rafId = requestAnimationFrame(smoothScrollLoop);
                            }
                        }
                    }
                });
            });

            if (scrollTopBtn) {
                scrollTopBtn.addEventListener('click', () => {
                    targetScroll = 0;
                    isSmoothScrolling = true;
                    if (!rafId) {
                        lastSTUpdate = 0;
                        rafId = requestAnimationFrame(smoothScrollLoop);
                    }
                });
            }

            window.addEventListener('resize', debounce(() => {
                cachedIsMobile = window.innerWidth <= 1024;
                if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
            }, 150));

            // ---------- MOBILE NAVIGATION ----------
            document.querySelectorAll('.mobile-toggle').forEach(toggle => {
                toggle.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const parent = this.closest('.has-sub');
                    if (parent) parent.classList.toggle('open');
                });
            });

            const navToggle = document.getElementById('navToggle');
            const mobileNavPanel = document.getElementById('mobileNavPanel');
            let closeNav;

            if (navToggle && mobileNavPanel) {
                closeNav = () => {
                    navToggle.classList.remove('open');
                    mobileNavPanel.classList.remove('open');
                    navToggle.setAttribute('aria-expanded', 'false');
                    navToggle.setAttribute('aria-label', 'Open menu');
                    markModalOpen(false);
                };

                const openNav = () => {
                    navToggle.classList.add('open');
                    mobileNavPanel.classList.add('open');
                    navToggle.setAttribute('aria-expanded', 'true');
                    navToggle.setAttribute('aria-label', 'Close menu');
                    markModalOpen(true);
                };

                navToggle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    navToggle.classList.contains('open') ? closeNav() : openNav();
                });

                // ---- MOBILE PANEL: event delegation for ALL clicks inside it ----
                mobileNavPanel.addEventListener('click', function (e) {
                    // 1) Click on (or inside) a .mobile-toggle icon → toggle that submenu only.
                    const toggleEl = e.target.closest('.mobile-toggle');
                    if (toggleEl) {
                        e.preventDefault();
                        e.stopPropagation();
                        const parent = toggleEl.closest('.has-sub');
                        if (parent) parent.classList.toggle('open');
                        return;
                    }

                    // 2) Click on a parent link (Courses, Basic Computer Training, etc.)
                    //    that has a sub-menu → toggle submenu instead of navigating away.
                    const parentLink = e.target.closest('.mnp-links li.has-sub > a');
                    if (parentLink) {
                        const href = parentLink.getAttribute('href') || '';
                        const isDropdownParent =
                            href.indexOf('courses.html') !== -1 ||
                            href.indexOf('basic-computer-training') !== -1 ||
                            href.indexOf('computer-programming') !== -1 ||
                            href.indexOf('web-development') !== -1 ||
                            href.indexOf('account-finance') !== -1;
                        if (isDropdownParent) {
                            e.preventDefault();
                            e.stopPropagation();
                            const parent = parentLink.closest('.has-sub');
                            if (parent) parent.classList.toggle('open');
                            return;
                        }
                    }

                    // 3) Otherwise it's a real leaf navigation link → close the panel.
                    const anchor = e.target.closest('a');
                    if (anchor) {
                        closeNav();
                    }
                });

                // ---- DESKTOP NAV: tap-to-open support for touch devices ----
                const desktopDropdownParents = document.querySelectorAll('.nav-links > li');
                desktopDropdownParents.forEach(function (li) {
                    const hasSub = li.querySelector(':scope > .sub-menu');
                    if (!hasSub) return;
                    const triggerLink = li.querySelector(':scope > a');
                    if (!triggerLink) return;
                    triggerLink.addEventListener('click', function (e) {
                        if (window.matchMedia('(hover: none)').matches || window.innerWidth <= 1024) {
                            e.preventDefault();
                            desktopDropdownParents.forEach(function (other) {
                                if (other !== li) other.classList.remove('tap-open');
                            });
                            li.classList.toggle('tap-open');
                        }
                    });
                });
                // Close desktop dropdowns when clicking outside
                document.addEventListener('click', function (e) {
                    if (!e.target.closest('.nav-links')) {
                        desktopDropdownParents.forEach(function (li) { li.classList.remove('tap-open'); });
                    }
                });

                document.addEventListener('click', (e) => {
                    if (!mobileNavPanel.contains(e.target) && !navToggle.contains(e.target)) closeNav();
                });

                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        closeNav();
                        closeSnapshot();
                        closeWhatsapp();
                    }
                });

                window.addEventListener('resize', debounce(() => {
                    if (!isMobile()) closeNav();
                }, 150));
            }

            // ---------- CUSTOM GOOGLE REVIEWS CAROUSEL ----------
            (function initReviewsCarousel() {
                const carouselTrack = document.getElementById('carouselTrack');
                const prevBtn = document.getElementById('prevBtn');
                const nextBtn = document.getElementById('nextBtn');
                const pagination = document.getElementById('pagination');

                if (!carouselTrack || !prevBtn || !nextBtn || !pagination) return;

                const reviewsData = [
                    { name: "Niyati Parmar", initials: "N", color: "#009688", time: "3 years ago", text: "Very good computer Institute." },
                    { name: "Jignesh Padhiyar", initials: "J", color: "#795548", time: "3 years ago", text: "Very good and excellent teaching by this institute...Thanks.." },
                    { name: "Rehana H. Ashrafi", initials: "R", color: "#607D8B", time: "3 years ago", text: "Awesome institute of spoken English course and basic computer course near our sun Pharma area.. Arjun sir helps alot to my career build." },
                    { name: "Bhardwaj Madhuri", initials: "B", color: "#FF9800", time: "3 years ago", text: "Excellent coaching for Tally+ GST course." },
                    { name: "Bhardwaj Rupesh", initials: "B", color: "#FF9800", time: "3 years ago", text: "Nice institute ... my career is growing with Tally + GST course. Here faculty is very humble and very experienced. Fees also reasonable." },
                    { name: "Hetvi Panchal", initials: "H", color: "#9E9E9E", time: "4 years ago", text: "Nice environments to learn here.. my career is grown up .. nice learning institute.. best institute in vadodara." },
                    { name: "Deval Tandel", initials: "D", color: "#673AB7", time: "4 years ago", text: "I am here to develop my carrier and Martian Institute give me that chance to grow in my profession and guide me to take correct decision." },
                    { name: "NP Creations", initials: "N", color: "#3F51B5", time: "4 years ago", text: "THANKS TO MARTIAN INSTITUTE SPECILY FOR KAJAL MAM. SHE TEACHED VERY DEEPLY TOPICS REGARDING TALLY AND GST." },
                    { name: "Charmi Patel", initials: "C", color: "#E91E63", time: "4 years ago", text: "Good institute for advanced excel course here. Very supportive faculties. I would recommend to you. And one more thing Fees are also affordable." },
                    { name: "Sapna Panchal", initials: "S", color: "#9C27B0", time: "4 years ago", text: "It's my privilege to be a part of MARTIAN INSTITUTE.. I personally found it to be an amazing institute." },
                    { name: "Janki Patel", initials: "J", color: "#4CAF50", time: "4 years ago", text: "Thanks for my career growth in Tally+gst course.. specially for faculties who teaches me right direction of my career." },
                    { name: "Hp Solanki", initials: "H", color: "#8BC34A", time: "5 years ago", text: "Nice computer institute.. thanks arjun sir to help my career grow.." }
                ];

                const googleMapsLink = "https://www.google.com/maps/place/Martian+Institute+-+Computer+Education+%26+IT+Training+Institute/@22.2825223,73.1601555,17.75z/data=!4m6!3m5!1s0x395fc5def656c70d:0xa49e4042da6a38b1!8m2!3d22.2809406!4d73.1591812!16s%2Fg%2F11ggz6dyt0?hl=en&entry=ttu&g_ep=EgoyMDI2MDYyOS4wIKXMDSoASAFQAw%3D%3D";

                let currentIndex = 0;
                let cardsVisible = 3;
                let autoSlideInterval;

                function generateCardHTML(review) {
                    return '<article class="review-card" onclick="window.open(\'' + googleMapsLink + '\', \'_blank\')">' +
                        '<div class="card-header">' +
                            '<div class="avatar" style="background-color: ' + review.color + '">' + review.initials + '</div>' +
                            '<div class="user-info">' +
                                '<h4>' + review.name + ' <span class="verified-icon" aria-hidden="true">&#10003;</span></h4>' +
                                '<span class="time-ago">' + review.time + ' on Google</span>' +
                            '</div>' +
                        '</div>' +
                        '<div class="card-stars" aria-label="5 out of 5 stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>' +
                        '<p class="review-text">' + review.text + '</p>' +
                        '<a href="' + googleMapsLink + '" target="_blank" rel="noopener noreferrer" class="read-more" onclick="event.stopPropagation()">Read more</a>' +
                    '</article>';
                }

                function updateCarouselConfig() {
                    var width = window.innerWidth;
                    if (width <= 778) cardsVisible = 1;
                    else if (width <= 1024) cardsVisible = 2;
                    else if (width <= 1400) cardsVisible = 3;
                    else cardsVisible = 3;

                    currentIndex = Math.floor(currentIndex / cardsVisible) * cardsVisible;
                    if (currentIndex > reviewsData.length - cardsVisible) {
                        currentIndex = Math.max(0, reviewsData.length - cardsVisible);
                    }
                    generateDots();
                    updateUI();
                }

                function updateUI() {
                    var card = carouselTrack.querySelector('.review-card');
                    if (card) {
                        var cardWidthWithGap = card.offsetWidth + 24;
                        carouselTrack.style.transform = 'translateX(-' + (currentIndex * cardWidthWithGap) + 'px)';
                    }
                    var activePageIndex = Math.ceil(currentIndex / cardsVisible);
                    var dots = document.querySelectorAll('.reviews-section .dot');
                    dots.forEach(function(dot, index) {
                        dot.classList.toggle('active', index === activePageIndex);
                    });
                }

                function nextSlide() {
                    if (currentIndex + cardsVisible < reviewsData.length) {
                        currentIndex += cardsVisible;
                        var maxIndex = reviewsData.length - cardsVisible;
                        if (currentIndex > maxIndex) currentIndex = maxIndex;
                    } else {
                        currentIndex = 0;
                    }
                    updateUI();
                }

                function prevSlide() {
                    if (currentIndex - cardsVisible >= 0) {
                        currentIndex -= cardsVisible;
                    } else {
                        currentIndex = Math.max(0, reviewsData.length - cardsVisible);
                    }
                    updateUI();
                }

                function generateDots() {
                    var totalPages = Math.ceil(reviewsData.length / cardsVisible);
                    var dotsHTML = '';
                    for (var i = 0; i < totalPages; i++) {
                        dotsHTML += '<div class="dot" aria-label="Go to slide page ' + (i + 1) + '" data-page="' + i + '"></div>';
                    }
                    pagination.innerHTML = totalPages > 1 ? dotsHTML : '';
                }

                function startAutoSlide() {
                    clearInterval(autoSlideInterval);
                    autoSlideInterval = setInterval(nextSlide, 4000);
                }

                // Build cards
                carouselTrack.innerHTML = reviewsData.map(generateCardHTML).join('');
                updateCarouselConfig();
                startAutoSlide();

                // Navigation buttons
                prevBtn.addEventListener('click', function() { prevSlide(); startAutoSlide(); });
                nextBtn.addEventListener('click', function() { nextSlide(); startAutoSlide(); });

                // Pagination dot clicks (event delegation)
                pagination.addEventListener('click', function(e) {
                    var dot = e.target.closest('.dot');
                    if (!dot) return;
                    var pageIndex = parseInt(dot.getAttribute('data-page'), 10);
                    currentIndex = pageIndex * cardsVisible;
                    if (currentIndex > reviewsData.length - cardsVisible) {
                        currentIndex = Math.max(0, reviewsData.length - cardsVisible);
                    }
                    updateUI();
                    startAutoSlide();
                });

                // Touch swipe support
                var touchStartX = 0;
                var touchEndX = 0;
                carouselTrack.addEventListener('touchstart', function(e) {
                    touchStartX = e.changedTouches[0].screenX;
                }, { passive: true });
                carouselTrack.addEventListener('touchend', function(e) {
                    touchEndX = e.changedTouches[0].screenX;
                    var swipeThreshold = 50;
                    if (touchStartX - touchEndX > swipeThreshold) nextSlide();
                    if (touchEndX - touchStartX > swipeThreshold) prevSlide();
                    startAutoSlide();
                }, { passive: true });

                // Responsive update
                window.addEventListener('resize', debounce(function() { updateCarouselConfig(); }, 150));
            })();

            // ---------- AOS INIT (deferred to rAF to avoid forced reflow) ----------
            requestAnimationFrame(() => {
                if (typeof AOS !== 'undefined') {
                    AOS.init({
                        duration: 1000,
                        once: true,
                        mirror: false,
                        offset: 120,
                        easing: 'ease-in-out'
                    });
                }
            });

            // ---------- BULLETPROOF HEADING ANIMATION (IntersectionObserver) ----------
            const headingObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        headingObserver.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });

            document.querySelectorAll('.gsap-reveal-heading').forEach(h => {
                if (!h.closest('.hero-scene')) {
                    headingObserver.observe(h);
                }
            });

            // ---------- GSAP ANIMATIONS (deferred to rAF to avoid forced reflow) ----------
            requestAnimationFrame(() => {
                if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
                    gsap.registerPlugin(ScrollTrigger);

                    let ctx = gsap.context(() => {
                        let mm = gsap.matchMedia();

                        mm.add("(min-width: 1025px)", () => {
                            const readText = document.querySelector('.read-along-text');
                            if (readText && readText.textContent.trim()) {
                                splitTextIntoWords(readText, 'read-along-word', null);
                            }
                        });

                        requestAnimationFrame(() => {
                            mm.add("(min-width: 1025px)", () => {
                                if (document.querySelector('.read-along-word')) {
                                    gsap.to(".read-along-word", {
                                        scrollTrigger: {
                                            trigger: ".read-along-text",
                                            start: "top 85%",
                                            end: "top 35%",
                                            scrub: 1
                                        },
                                        opacity: 1,
                                        color: "var(--text-dark)",
                                        stagger: 0.05,
                                        ease: "power2.out"
                                    });
                                }

                                gsap.to(".content-image-wrapper", {
                                    clipPath: "inset(0% 0% 0% 0%)",
                                    duration: 1.2,
                                    ease: "power3.out",
                                    scrollTrigger: {
                                        trigger: ".content-image-wrapper",
                                        start: "top 85%",
                                        toggleActions: "play none none reverse"
                                    }
                                });

                                gsap.to(".content-image", {
                                    scale: 1,
                                    duration: 1.5,
                                    ease: "power3.out",
                                    scrollTrigger: {
                                        trigger: ".content-image-wrapper",
                                        start: "top 85%",
                                        toggleActions: "play none none reverse"
                                    }
                                });

                                const careerWrappers = document.querySelectorAll('.career-scroll-anim');
                                if (careerWrappers.length) {
                                    gsap.fromTo(careerWrappers, { y: 80, opacity: 0, scale: 0.95 }, {
                                        y: 0, opacity: 1, scale: 1, stagger: 0.08, duration: 1.5, ease: "power2.out",
                                        scrollTrigger: { trigger: ".career-panels-p1", start: "top 88%", end: "top 40%", scrub: 1 }
                                    });
                                }

                                const salaryWrappers = document.querySelectorAll('.salary-scroll-anim');
                                if (salaryWrappers.length) {
                                    gsap.fromTo(salaryWrappers, { y: 100, opacity: 0, scale: 0.9, rotationX: 4 }, {
                                        y: 0, opacity: 1, scale: 1, rotationX: 0, stagger: 0.1, duration: 1.8, ease: "power2.out",
                                        scrollTrigger: { trigger: ".salary-grid", start: "top 92%", end: "top 35%", scrub: 1 }
                                    });
                                }

                                gsap.set(".sidebar .alive-card-wrapper", { opacity: 0, x: 40 });
                                gsap.set(".sidebar .alive-card-header, .sidebar .alive-card-footer", { opacity: 0, y: 10 });
                                gsap.set(".sidebar .timeline-row", { opacity: 0, x: 15 });
                                gsap.set(".sidebar .icon-node", { scale: 0 });

                                const stl = gsap.timeline({
                                    scrollTrigger: { trigger: ".page-layout", start: "top 75%", toggleActions: "play none none none" }
                                });

                                stl.to(".sidebar .alive-card-wrapper", { opacity: 1, x: 0, duration: 2.0, ease: "power3.out" })
                                   .to(".sidebar .alive-card-header, .sidebar .alive-card-footer", { opacity: 1, y: 0, duration: 1.0, ease: "power2.out" }, "-=1.5")
                                   .to(".sidebar .timeline-row", { opacity: 1, x: 0, duration: 1.0, stagger: 0.15, ease: "power2.out" }, "-=1.2")
                                   .to(".sidebar .icon-node", { scale: 1, duration: 1.5, ease: "elastic.out(1,0.5)", stagger: 0.1 }, "-=1.0");

                                gsap.fromTo(".footer-anim", { y: 40, opacity: 0 }, {
                                    y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: "power2.out",
                                    scrollTrigger: { trigger: ".site-footer", start: "top 85%", toggleActions: "play none none reverse" }
                                });

                                gsap.fromTo(".footer-anim-bottom", { opacity: 0 }, {
                                    opacity: 1, duration: 1, ease: "power2.out", delay: 0.4,
                                    scrollTrigger: { trigger: ".site-footer", start: "top 85%", toggleActions: "play none none reverse" }
                                });
                            });
                        });

                        mm.add("(max-width: 1024px)", () => {
                            gsap.to(".content-image-wrapper", {
                                clipPath: "inset(0% 0% 0% 0%)",
                                duration: 1.2,
                                ease: "power3.out",
                                scrollTrigger: {
                                    trigger: ".content-image-wrapper",
                                    start: "top 85%",
                                    toggleActions: "play none none reverse"
                                }
                            });

                            const careerWrappers = document.querySelectorAll('.career-scroll-anim');
                            careerWrappers.forEach((card, i) => {
                                gsap.set(card, { y: 80, opacity: 0, scale: 0.9 });
                                gsap.to(card, {
                                    y: 0, opacity: 1, scale: 1, duration: 1.2, delay: i * 0.1, ease: "power2.out",
                                    scrollTrigger: { trigger: card, start: "top 92%", toggleActions: "play none none none" }
                                });
                            });

                            const salaryWrappers = document.querySelectorAll('.salary-scroll-anim');
                            salaryWrappers.forEach((card, i) => {
                                gsap.set(card, { y: 100, opacity: 0, scale: 0.8 });
                                gsap.to(card, {
                                    y: 0, opacity: 1, scale: 1, duration: 1.2, delay: i * 0.12, ease: "power2.out",
                                    scrollTrigger: { trigger: card, start: "top 93%", toggleActions: "play none none none" }
                                });
                            });

                            gsap.set("#course-snapshot-dom .alive-card-wrapper, #course-snapshot-dom .alive-card-header, #course-snapshot-dom .alive-card-footer, #course-snapshot-dom .timeline-row, #course-snapshot-dom .icon-node", {
                                clearProps: "all", opacity: 1, x: 0, y: 0, scale: 1
                            });

                            gsap.set(".footer-anim", { y: 0, opacity: 1 });
                            gsap.set(".footer-anim-bottom", { opacity: 1 });
                        });
                    });
                }
            });

            // ---------- SCROLLTRIGGER REFRESH ON FULL LOAD ----------
            // Images/fonts/layout settle AFTER the initial ScrollTrigger measurement,
            // which can leave the Course Snapshot sidebar content stuck at opacity:0
            // (its entrance scroll-trigger never fires with stale positions).
            // A refresh on window.load re-measures all triggers safely without
            // changing any working animation. Belt-and-suspenders safety net below
            // guarantees the snapshot content is visible even if a trigger still mis-fires.
            window.addEventListener('load', () => {
                if (typeof ScrollTrigger !== 'undefined') {
                    ScrollTrigger.refresh();
                }
                // Scoped safety net: ONLY the desktop Course Snapshot sidebar.
                // If the entrance animation never played (content still hidden),
                // reveal it. Does not touch any other section.
                if (!isMobile()) {
                    const snapDom = document.getElementById('course-snapshot-dom');
                    if (snapDom && snapDom.closest('.sidebar')) {
                        const hidden = snapDom.querySelector('.alive-card-wrapper, .timeline-row, .icon-node, .alive-card-header, .alive-card-footer');
                        const isStuck = hidden && (parseFloat(getComputedStyle(hidden).opacity) === 0);
                        if (isStuck && typeof gsap !== 'undefined') {
                            gsap.set('#course-snapshot-dom .alive-card-wrapper, #course-snapshot-dom .alive-card-header, #course-snapshot-dom .alive-card-footer, #course-snapshot-dom .timeline-row, #course-snapshot-dom .icon-node', {
                                clearProps: 'opacity,transform,x,y,scale', opacity: 1, x: 0, y: 0, scale: 1
                            });
                        }
                    }
                }
            });

            // ---------- HERO PARALLAX ANIMATION ----------
            (function initSmoothHero() {
                const heroScene = document.getElementById('heroScene');
                if (!heroScene) return;

                const glassCard = document.getElementById('heroGlassCard');
                const cardGlare = document.getElementById('cardGlare');
                const cardContainer = document.getElementById('heroCardContainer');
                const techGrid = document.getElementById('techGrid');
                const marsHorizon = document.getElementById('marsHorizon');
                const orb1 = document.getElementById('orb1');
                const orb2 = document.getElementById('orb2');
                const mouseGlow = document.getElementById('mouseGlow');
                const particlesContainer = document.getElementById('particles');

                let isHeroVisible = false;
                let animFrameId = null;
                let lastTime = 0;
                let time = 0;
                let mouseInScene = false;
                let idleTimer = 0;

                if (isMobile()) {
                    if (mouseGlow) mouseGlow.style.display = 'none';
                    if (particlesContainer) particlesContainer.style.display = 'none';
                    return;
                }

                function createParticles() {
                    if (!particlesContainer) return;
                    for (let i = 0; i < 25; i++) {
                        const p = document.createElement('div');
                        p.className = 'particle';
                        p.style.left = Math.random() * 100 + '%';
                        p.style.animationDuration = (Math.random() * 15 + 12) + 's';
                        p.style.animationDelay = Math.random() * 10 + 's';
                        p.style.opacity = Math.random() * 0.4 + 0.2;
                        particlesContainer.appendChild(p);
                    }
                }
                requestAnimationFrame(createParticles);

                const heroObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        isHeroVisible = entry.isIntersecting;
                        if (isHeroVisible && !animFrameId && !isMobile()) {
                            lastTime = performance.now();
                            animFrameId = requestAnimationFrame(animate);
                        } else if (!isHeroVisible && animFrameId) {
                            cancelAnimationFrame(animFrameId);
                            animFrameId = null;
                        }
                    });
                }, { threshold: 0.2 });

                heroObserver.observe(heroScene);

                function createSpring(stiffness) {
                    const damping = 2 * Math.sqrt(stiffness);
                    let value = 0;
                    let velocity = 0;
                    return {
                        get value() { return value; },
                        update(target, dt) {
                            const force = stiffness * (target - value) - damping * velocity;
                            velocity += force * dt;
                            value += velocity * dt;
                            return value;
                        }
                    };
                }

                const springRotX = createSpring(60);
                const springRotY = createSpring(60);
                const springBgX = createSpring(40);
                const springBgY = createSpring(40);
                const springGlareX = createSpring(30);
                const springGlareY = createSpring(30);
                const springGlowX = createSpring(50);
                const springGlowY = createSpring(50);

                let targetRotX = 0, targetRotY = 0;
                let targetBgX = 0, targetBgY = 0;
                let targetGlareX = 50, targetGlareY = 50;
                let targetGlowX = 0, targetGlowY = 0;

                function getIdleOffset(t) {
                    return {
                        x: Math.sin(t * 0.3) * 0.5 + Math.sin(t * 0.6) * 0.3,
                        y: Math.cos(t * 0.25) * 0.4 + Math.cos(t * 0.55) * 0.2,
                        scale: 1 + Math.sin(t * 0.4) * 0.001,
                        z: Math.sin(t * 0.2) * 0.1
                    };
                }

                heroScene.addEventListener('mousemove', (e) => {
                    if (isMobile()) return;
                    mouseInScene = true;
                    idleTimer = 0;
                    if (mouseGlow) mouseGlow.classList.add('active');

                    const rect = heroScene.getBoundingClientRect();
                    const cx = rect.left + rect.width / 2;
                    const cy = rect.top + rect.height / 2;
                    const nx = (e.clientX - cx) / (rect.width / 2);
                    const ny = (e.clientY - cy) / (rect.height / 2);

                    targetRotX = ny * -6;
                    targetRotY = nx * 6;
                    targetBgX = nx * 25;
                    targetBgY = ny * 25;
                    targetGlareX = 50 + nx * 15;
                    targetGlareY = 50 + ny * 15;
                    targetGlowX = e.clientX - rect.left;
                    targetGlowY = e.clientY - rect.top;
                });

                heroScene.addEventListener('mouseleave', () => {
                    mouseInScene = false;
                    idleTimer = 0;
                    if (mouseGlow) mouseGlow.classList.remove('active');
                });

                function animate(now) {
                    if (!isHeroVisible || isMobile()) {
                        animFrameId = null;
                        return;
                    }

                    const rawDt = (now - lastTime) / 1000;
                    const dt = Math.min(rawDt, 0.05);
                    lastTime = now;
                    time += dt;

                    if (!mouseInScene) {
                        idleTimer += dt;
                        targetRotX *= 0.96;
                        targetRotY *= 0.96;
                        targetBgX *= 0.96;
                        targetBgY *= 0.96;
                        targetGlareX += (50 - targetGlareX) * 0.02;
                        targetGlareY += (50 - targetGlareY) * 0.02;
                    } else {
                        idleTimer += dt * 0.3;
                    }

                    const isIdle = idleTimer > 1.8;
                    let frx = targetRotX, fry = targetRotY;
                    let fbx = targetBgX, fby = targetBgY;
                    let idleScale = 1, idleRotZ = 0;

                    if (isIdle) {
                        const idle = getIdleOffset(time);
                        const str = Math.min((idleTimer - 1.8) / 2.5, 1);
                        frx += idle.y * str;
                        fry += idle.x * str;
                        fbx += idle.x * 3 * str;
                        fby += idle.y * 3 * str;
                        idleScale = idle.scale;
                        idleRotZ = idle.z * str;
                    }

                    springRotX.update(frx, dt);
                    springRotY.update(fry, dt);
                    springBgX.update(fbx, dt);
                    springBgY.update(fby, dt);

                    const gx = springGlareX.update(targetGlareX, dt);
                    const gy = springGlareY.update(targetGlareY, dt);
                    const glx = springGlowX.update(targetGlowX, dt);
                    const gly = springGlowY.update(targetGlowY, dt);

                    const rx = springRotX.value;
                    const ry = springRotY.value;
                    const bx = springBgX.value;
                    const by = springBgY.value;

                    if (glassCard) glassCard.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${idleRotZ}deg) scale(${idleScale})`;
                    if (cardContainer) cardContainer.style.transform = `translate(${by * 0.1}px, ${-bx * 0.1}px)`;
                    if (techGrid) techGrid.style.transform = `translate(${by * 0.3}px, ${-bx * 0.3}px) scale(${1 + Math.sin(time * 0.15) * 0.003})`;
                    if (marsHorizon) marsHorizon.style.transform = `translate(${-by * 0.4}px, ${bx * 0.4}px) rotate(${Math.sin(time * 0.1) * 0.2}deg)`;
                    if (orb1) orb1.style.transform = `translate(${by * 0.5 + Math.sin(time * 0.2) * 3}px, ${-bx * 0.5 + Math.cos(time * 0.2) * 3}px)`;
                    if (orb2) orb2.style.transform = `translate(${-by * 0.4 + Math.cos(time * 0.25) * 4}px, ${bx * 0.4 + Math.sin(time * 0.2) * 4}px)`;
                    if (cardGlare) cardGlare.style.background = `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.12) 0%, transparent 55%)`;
                    if (mouseGlow) mouseGlow.style.transform = `translate(${glx}px, ${gly}px) translate(-50%, -50%)`;

                    animFrameId = requestAnimationFrame(animate);
                }

                window.addEventListener('resize', debounce(() => {
                    if (isMobile()) {
                        if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
                        if (glassCard) glassCard.style.transform = '';
                        if (cardContainer) cardContainer.style.transform = '';
                        if (techGrid) techGrid.style.transform = '';
                        if (marsHorizon) marsHorizon.style.transform = '';
                        if (orb1) orb1.style.transform = '';
                        if (orb2) orb2.style.transform = '';
                        if (mouseGlow) mouseGlow.style.display = 'none';
                        if (particlesContainer) particlesContainer.style.display = 'none';
                    } else {
                        if (!animFrameId && isHeroVisible) {
                            lastTime = performance.now();
                            animFrameId = requestAnimationFrame(animate);
                        }
                        if (mouseGlow) mouseGlow.style.display = '';
                        if (particlesContainer) particlesContainer.style.display = '';
                    }
                }, 200));
            })();

            // ---------- ACCORDION LOGIC ----------
            document.querySelectorAll('.accordion-item').forEach(item => {
                const h = item.querySelector('.accordion-header');
                if (!h) return;

                const toggleAccordion = (forceOpen = false) => {
                    const isCurrentlyActive = item.classList.contains('active');
                    const cont = item.closest('.accordion');
                    if (!cont) return;

                    if (forceOpen && isCurrentlyActive) return;

                    cont.querySelectorAll('.accordion-item').forEach(oi => {
                        oi.classList.remove('active');
                        const header = oi.querySelector('.accordion-header');
                        if (header) header.setAttribute('aria-expanded', 'false');
                    });

                    if (!isCurrentlyActive || forceOpen) {
                        item.classList.add('active');
                        h.setAttribute('aria-expanded', 'true');
                    }
                };

                h.addEventListener('click', () => toggleAccordion(false));

                item.addEventListener('mouseenter', () => {
                    if (!isMobile()) toggleAccordion(true);
                });

                item.addEventListener('mouseleave', () => {
                    if (!isMobile()) {
                        item.classList.remove('active');
                        h.setAttribute('aria-expanded', 'false');
                    }
                });
            });

            // ---------- EXPAND TOGGLE (Curriculum & Why Choose) ----------
            function initMovingToggle({ btnId, groupId, hiddenId }) {
                const btn = document.getElementById(btnId);
                const hidden = document.getElementById(hiddenId);
                const group = document.getElementById(groupId);
                if (!btn || !hidden || !group) return;

                let isExpanded = false;
                let isAnimating = false;

                btn.addEventListener('click', () => {
                    if (isAnimating) return;
                    isAnimating = true;
                    isExpanded = !isExpanded;
                    group.classList.add('moving');

                    setTimeout(() => {
                        if (isExpanded) {
                            hidden.parentNode.insertBefore(group, hidden.nextSibling);
                            hidden.classList.add('expanded');
                            hidden.setAttribute('aria-hidden', 'false');
                            btn.classList.add('active');
                            btn.setAttribute('aria-expanded', 'true');
                        } else {
                            hidden.parentNode.insertBefore(group, hidden);
                            hidden.classList.remove('expanded');
                            hidden.setAttribute('aria-hidden', 'true');
                            btn.classList.remove('active');
                            btn.setAttribute('aria-expanded', 'false');
                        }

                        btn.classList.add('pulse-once');
                        setTimeout(() => btn.classList.remove('pulse-once'), 600);

                        requestAnimationFrame(() => {
                            group.style.opacity = '0';
                            requestAnimationFrame(() => {
                                group.classList.remove('moving');
                                group.style.transition = 'opacity 0.5s ease';
                                group.style.opacity = '1';
                                setTimeout(() => {
                                    group.style.transition = '';
                                    isAnimating = false;
                                    if (typeof AOS !== 'undefined') AOS.refresh();
                                    if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
                                }, 500);
                            });
                        });
                    }, 250);
                });
            }

            initMovingToggle({ btnId: 'curExpandToggle', groupId: 'curToggleGroup', hiddenId: 'curHiddenWeeks' });
            initMovingToggle({ btnId: 'whyExpandToggle', groupId: 'whyToggleGroup', hiddenId: 'whyHiddenItems' });
            initMovingToggle({ btnId: 'aboutExpandToggle', groupId: 'aboutToggleGroup', hiddenId: 'about-more' });
            initMovingToggle({ btnId: 'industryExpandToggle', groupId: 'industryToggleGroup', hiddenId: 'moreIndustryCards' });
            initMovingToggle({ btnId: 'salaryExpandToggle', groupId: 'salaryToggleGroup', hiddenId: 'moreSalaryCards' });

            // ---------- FAQ MOBILE TOGGLE ----------
            const toggleBtnFaq = document.getElementById('faqExpandToggle');
            const hiddenWrapperFaq = document.getElementById('faqHiddenCards');

            if (toggleBtnFaq && hiddenWrapperFaq) {
                toggleBtnFaq.addEventListener('click', () => {
                    const isExpanded = hiddenWrapperFaq.classList.toggle('expanded');
                    toggleBtnFaq.classList.toggle('active');
                    toggleBtnFaq.setAttribute('aria-expanded', isExpanded);
                });
            }

            // ---------- FAQ DESKTOP PARALLAX ----------
            const faqSection = document.querySelector('.faq-section');
            const faqCards = document.querySelectorAll('.faq-card-wrapper');

            if (faqSection && faqCards.length > 0) {
                let faqAnimId = null;
                let faqActive = false;
                let selectedCard = null;
                let isFaqListenerAttached = false;

                faqCards.forEach(card => {
                    card.addEventListener('focus', () => {
                        if (!isMobile()) selectFaqCard(card);
                    });
                    card.addEventListener('click', () => {
                        if (!isMobile()) selectFaqCard(card);
                    });
                    card.addEventListener('blur', () => {
                        if (selectedCard === card) deselectFaqCard();
                    });
                });

                function selectFaqCard(card) {
                    if (selectedCard) selectedCard.classList.remove('active');
                    faqCards.forEach(c => c.classList.remove('active'));
                    card.classList.add('active');
                    selectedCard = card;
                }

                function deselectFaqCard() {
                    if (selectedCard) {
                        selectedCard.classList.remove('active');
                        selectedCard = null;
                    }
                }

                const faqObs = new IntersectionObserver((entries) => {
                    entries.forEach(e => {
                        if (e.isIntersecting) {
                            faqActive = true;
                            if (!faqAnimId && !isMobile()) startFaqParallax();
                        } else {
                            faqActive = false;
                            if (faqAnimId) { cancelAnimationFrame(faqAnimId); faqAnimId = null; }
                            if (isFaqListenerAttached && faqSection) {
                                faqSection.removeEventListener('mousemove', handleFaqMouseMove);
                                isFaqListenerAttached = false;
                            }
                        }
                    });
                }, { threshold: 0.1 });

                faqObs.observe(faqSection);

                let faqMouseX = window.innerWidth / 2;
                let faqMouseY = window.innerHeight / 2;
                let faqTargetX = 0;
                let faqTargetY = 0;

                const faqCardData = Array.from(faqCards).map(c => ({
                    el: c, depth: parseFloat(c.getAttribute('data-depth')) || 1, cX: 0, cY: 0
                }));

                function handleFaqMouseMove(e) {
                    if (!faqSection) return;
                    const rect = faqSection.getBoundingClientRect();
                    faqMouseX = e.clientX;
                    faqMouseY = e.clientY;
                    faqTargetX = (rect.width / 2 - (e.clientX - rect.left)) * 0.05;
                    faqTargetY = (rect.height / 2 - (e.clientY - rect.top)) * 0.05;
                }

                let faqFrameCount = 0;
                const faqCachedPositions = new Map();

                function updateFaqCachedPositions() {
                    faqCachedPositions.clear();
                    faqCardData.forEach(c => {
                        const r = c.el.getBoundingClientRect();
                        faqCachedPositions.set(c.el, { centerX: r.left + r.width / 2, centerY: r.top + r.height / 2 });
                    });
                }

                function startFaqParallax() {
                    if (!faqActive || isMobile()) {
                        faqCards.forEach(c => c.classList.add('active'));
                        if (isFaqListenerAttached && faqSection) {
                            faqSection.removeEventListener('mousemove', handleFaqMouseMove);
                            isFaqListenerAttached = false;
                        }
                        if (faqAnimId) { cancelAnimationFrame(faqAnimId); faqAnimId = null; }
                        return;
                    }

                    if (!isFaqListenerAttached && faqSection) {
                        faqSection.addEventListener('mousemove', handleFaqMouseMove);
                        isFaqListenerAttached = true;
                    }

                    function animateFaqCards() {
                        if (!faqActive) {
                            if (isFaqListenerAttached && faqSection) {
                                faqSection.removeEventListener('mousemove', handleFaqMouseMove);
                                isFaqListenerAttached = false;
                            }
                            faqAnimId = null;
                            return;
                        }

                        if (selectedCard) { faqAnimId = requestAnimationFrame(animateFaqCards); return; }

                        faqFrameCount++;
                        if (faqFrameCount % 3 === 0) updateFaqCachedPositions();

                        let closestCard = null;
                        let minDist = Infinity;

                        faqCardData.forEach(c => {
                            c.cX += (faqTargetX * c.depth - c.cX) * 0.04;
                            c.cY += (faqTargetY * c.depth - c.cY) * 0.04;
                            gsap.set(c.el, { x: c.cX, y: c.cY });

                            const cached = faqCachedPositions.get(c.el);
                            if (cached) {
                                const d = Math.hypot(faqMouseX - cached.centerX, faqMouseY - cached.centerY);
                                if (d < minDist) { minDist = d; closestCard = c.el; }
                            }
                        });

                        faqCardData.forEach(c => {
                            c.el.classList.toggle('active', c.el === closestCard && minDist < FAQ_HOVER_THRESHOLD);
                            c.el.style.zIndex = c.el === closestCard && minDist < FAQ_HOVER_THRESHOLD ? 20 : 1;
                        });

                        faqAnimId = requestAnimationFrame(animateFaqCards);
                    }

                    updateFaqCachedPositions();
                    faqAnimId = requestAnimationFrame(animateFaqCards);
                }

                if (isMobile()) {
                    faqCards.forEach(c => c.classList.add('active'));
                }

                window.addEventListener('resize', debounce(() => {
                    if (faqActive && !isMobile()) {
                        if (!faqAnimId) startFaqParallax();
                    } else if (isMobile()) {
                        faqCards.forEach(c => c.classList.add('active'));
                        if (faqAnimId) { cancelAnimationFrame(faqAnimId); faqAnimId = null; }
                        if (isFaqListenerAttached && faqSection) {
                            faqSection.removeEventListener('mousemove', handleFaqMouseMove);
                            isFaqListenerAttached = false;
                        }
                    }
                }, 150));
            }

            // ---------- SIDEBAR / SNAPSHOT DOM PLACEMENT ----------
            const snapshotDom = document.getElementById('course-snapshot-dom');
            const snapSidebarContainer = document.getElementById('sidebar-container');
            const snapSheetInner = document.getElementById('snapshotSheetInner');

            function handleSnapshotDomPlacement() {
                if (isMobile()) {
                    if (snapshotDom && snapSheetInner && snapshotDom.parentNode !== snapSheetInner) {
                        snapSheetInner.appendChild(snapshotDom);
                    }
                } else {
                    if (snapshotDom && snapSidebarContainer && snapshotDom.parentNode !== snapSidebarContainer) {
                        snapSidebarContainer.appendChild(snapshotDom);
                    }
                    closeSnapshot();
                    closeWhatsapp();
                }
                if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
            }

            window.addEventListener('resize', debounce(handleSnapshotDomPlacement, 150));
            requestAnimationFrame(handleSnapshotDomPlacement);

            // ---------- FOCUS TRAP HELPERS ----------
            let previousFocus = null;

            function getFocusableElements(element) {
                if (!element) return [];
                return Array.from(element.querySelectorAll(
                    'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
                )).filter(el => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true');
            }

            function createTrapFocus(container) {
                return function (e) {
                    const focusable = getFocusableElements(container);
                    if (focusable.length === 0) return;
                    const firstElement = focusable[0];
                    const lastElement = focusable[focusable.length - 1];

                    if (e.key === 'Tab') {
                        if (!container.contains(document.activeElement)) {
                            e.preventDefault();
                            (e.shiftKey ? lastElement : firstElement).focus();
                            return;
                        }
                        if (e.shiftKey) {
                            if (document.activeElement === firstElement) { e.preventDefault(); lastElement.focus(); }
                        } else {
                            if (document.activeElement === lastElement) { e.preventDefault(); firstElement.focus(); }
                        }
                    }
                };
            }

            // ---------- SNAPSHOT SHEET ----------
            const snapFab = document.getElementById('snapshotFab');
            const snapSheet = document.getElementById('snapshotSheet');
            const snapClose = document.getElementById('snapshotSheetClose');
            const snapTrapFocus = snapSheet ? createTrapFocus(snapSheet) : null;
            const SNAPSHOT_BODY_CLASS = 'snapshot-sheet-open';

            function openSnapshot() {
                if (snapSheet) {
                    closeWhatsapp();
                    previousFocus = document.activeElement;
                    snapSheet.classList.add('open');
                    document.body.classList.add(SNAPSHOT_BODY_CLASS);
                    markModalOpen(true); // FIX #4: update cached flag
                    if (snapTrapFocus) snapSheet.addEventListener('keydown', snapTrapFocus);
                    if (snapClose) setTimeout(() => snapClose.focus(), 100);
                }
            }

            function closeSnapshot() {
                if (snapSheet && snapSheet.classList.contains('open')) {
                    snapSheet.classList.remove('open');
                    document.body.classList.remove(SNAPSHOT_BODY_CLASS);
                    markModalOpen(false); // FIX #4: update cached flag
                    if (snapTrapFocus) snapSheet.removeEventListener('keydown', snapTrapFocus);
                    if (previousFocus) previousFocus.focus();
                }
            }

            if (snapFab) snapFab.addEventListener('click', openSnapshot);
            if (snapClose) snapClose.addEventListener('click', closeSnapshot);
            if (snapSheet) {
                snapSheet.addEventListener('click', (e) => {
                    if (e.target === snapSheet) closeSnapshot();
                });
            }

            // ---------- WHATSAPP SHEET ----------
            const waSheet = document.getElementById('whatsappSheet');
            const waClose = document.getElementById('whatsappSheetClose');
            const waTrapFocus = waSheet ? createTrapFocus(waSheet) : null;
            const WHATSAPP_BODY_CLASS = 'whatsapp-sheet-open';

            function openWhatsapp(e) {
                if (!isMobile()) {
                    return;
                } else {
                    if (e) e.preventDefault();
                    if (waSheet) {
                        closeSnapshot();
                        previousFocus = document.activeElement;
                        waSheet.classList.add('open');
                        document.body.classList.add(WHATSAPP_BODY_CLASS);
                        markModalOpen(true); // FIX #4: update cached flag
                        if (waTrapFocus) waSheet.addEventListener('keydown', waTrapFocus);
                        if (waClose) setTimeout(() => waClose.focus(), 100);
                    }
                }
            }

            function closeWhatsapp() {
                if (waSheet && waSheet.classList.contains('open')) {
                    waSheet.classList.remove('open');
                    document.body.classList.remove(WHATSAPP_BODY_CLASS);
                    markModalOpen(false); // FIX #4: update cached flag
                    if (waTrapFocus) waSheet.removeEventListener('keydown', waTrapFocus);
                    if (previousFocus) previousFocus.focus();
                }
            }

            if (waFab) waFab.addEventListener('click', openWhatsapp);
            if (waClose) waClose.addEventListener('click', closeWhatsapp);
            if (waSheet) {
                waSheet.addEventListener('click', (e) => {
                    if (e.target === waSheet) closeWhatsapp();
                });
            }

            // ---------- SALARY CARDS ----------
            document.querySelectorAll('.salary-card-r3').forEach(card => {
                card.addEventListener('click', function (e) {
                    if (isMobile()) {
                        document.querySelectorAll('.salary-card-r3').forEach(c => {
                            if (c !== this) c.classList.remove('active');
                        });
                        this.classList.toggle('active');
                    }
                });
                card.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.click();
                    }
                });
            });

            // ---------- ELFSIGHT LAZY LOAD ----------
            const reviewsSection = document.querySelector('.reviews-section');
            if (reviewsSection) {
                const elfsightObserver = new IntersectionObserver((entries, observer) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const script = document.createElement('script');
                            script.src = "https://elfsightcdn.com/platform.js";
                            script.async = true;
                            document.body.appendChild(script);
                            observer.disconnect();

                            script.onload = () => {
                                if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
                            };
                        }
                    });
                }, { rootMargin: "300px" });

                elfsightObserver.observe(reviewsSection);
            }

        });



/* ========================================================================
   ENHANCED UX ADDITIONS  (added by comprehensive UX upgrade)
   Self-contained IIFE — runs after DOM is ready.
   ======================================================================== */
(function() {
    function init() {

        // ----- 1. CLICK-TO-OPEN NAV DROPDOWN -----
        var navItems = document.querySelectorAll('.nav-links > li');
        navItems.forEach(function(li) {
            var link = li.querySelector(':scope > a');
            var sub  = li.querySelector(':scope > .sub-menu');
            if (!link || !sub) return;

            var lastClick = 0;
            link.addEventListener('click', function(e) {
                if (window.innerWidth <= 1024) return;
                var now = Date.now();
                var isOpen = li.classList.contains('open');

                navItems.forEach(function(other) {
                    if (other !== li) other.classList.remove('open');
                });

                if (!isOpen) {
                    e.preventDefault();
                    li.classList.add('open');
                    lastClick = now;
                } else if (now - lastClick < 700) {
                    li.classList.remove('open');
                } else {
                    e.preventDefault();
                    li.classList.toggle('open');
                    lastClick = now;
                }
            });

            li.addEventListener('mouseenter', function() {
                if (window.innerWidth <= 1024) return;
                li.classList.add('open');
            });
            li.addEventListener('mouseleave', function() {
                if (window.innerWidth <= 1024) return;
                li.classList.remove('open');
            });
        });

        document.addEventListener('click', function(e) {
            if (!e.target.closest('.nav-links > li')) {
                navItems.forEach(function(li) { li.classList.remove('open'); });
            }
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                navItems.forEach(function(li) {
                    if (li.classList.contains('open')) {
                        li.classList.remove('open');
                        var link = li.querySelector(':scope > a');
                        if (link) link.focus();
                    }
                });
            }
        });

        console.log('[Martian UX] Enhanced dropdown initialised.');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();


