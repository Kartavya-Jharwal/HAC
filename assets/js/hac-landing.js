/**
 * HAC Landing Page – JavaScript (v3.0)
 * Custom cursor, smooth scroll, nav, mobile menu, fade-in with stagger,
 * WhatsApp QR modal (desktop), dynamic year, prefers-reduced-motion awareness
 */
(function () {
    'use strict';

    // ============================
    // Reduced Motion Check
    // ============================
    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ============================
    // DOM References
    // ============================
    var nav         = document.querySelector('.nav');
    var navToggle   = document.querySelector('.nav-toggle');
    var navLinks    = document.querySelector('.nav-links');
    var allNavLinks = document.querySelectorAll('.nav-links a');
    var sections    = document.querySelectorAll('section[id]');
    var fadeEls     = document.querySelectorAll('.fade-in');
    var cursorDot   = document.querySelector('.cursor-dot');
    var cursorRing  = document.querySelector('.cursor-ring');
    var waBtn       = document.querySelector('.js-whatsapp-cta');
    var waModal     = document.querySelector('.js-wa-modal');
    var waModalClose = document.querySelector('.js-wa-modal-close');

    // ============================
    // Custom Cursor (desktop only)
    // ============================
    var isTouchDevice = ('ontouchstart' in window) ||
                        (navigator.maxTouchPoints > 0) ||
                        window.matchMedia('(hover: none)').matches;

    if (isTouchDevice || prefersReducedMotion) {
        document.body.classList.add('no-custom-cursor');
        if (cursorDot) cursorDot.style.display = 'none';
        if (cursorRing) cursorRing.style.display = 'none';
    }

    if (!isTouchDevice && !prefersReducedMotion && cursorDot && cursorRing) {
        var mouseX = 0, mouseY = 0;
        var ringX = 0, ringY = 0;

        document.addEventListener('mousemove', function (e) {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursorDot.style.left = mouseX + 'px';
            cursorDot.style.top = mouseY + 'px';
        });

        // Ring follows with 120ms lag via requestAnimationFrame
        function animateRing() {
            var lag = 0.12;
            ringX += (mouseX - ringX) * lag;
            ringY += (mouseY - ringY) * lag;
            cursorRing.style.left = ringX + 'px';
            cursorRing.style.top = ringY + 'px';
            requestAnimationFrame(animateRing);
        }
        requestAnimationFrame(animateRing);

        // Hover state on interactive elements
        var interactiveEls = document.querySelectorAll('a, button, .btn, .build-card, .gallery-item, .timeline-step, input, textarea');
        interactiveEls.forEach(function (el) {
            el.addEventListener('mouseenter', function () {
                cursorDot.classList.add('is-hover');
                cursorRing.classList.add('is-hover');
            });
            el.addEventListener('mouseleave', function () {
                cursorDot.classList.remove('is-hover');
                cursorRing.classList.remove('is-hover');
            });
        });
    }

    // ============================
    // Smooth Scroll
    // ============================
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
        link.addEventListener('click', function (e) {
            var href = this.getAttribute('href');
            if (href === '#') return;
            e.preventDefault();
            var target = document.getElementById(href.substring(1));
            if (!target) return;
            var offset = nav ? nav.offsetHeight : 0;
            window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
            // Close mobile menu if open
            if (navLinks && navLinks.classList.contains('is-open')) {
                closeMobileMenu();
            }
        });
    });

    // ============================
    // Nav Scroll Shadow
    // ============================
    function handleNavScroll() {
        if (!nav) return;
        if (window.scrollY > 80) {
            nav.classList.add('nav--scrolled');
        } else {
            nav.classList.remove('nav--scrolled');
        }
    }
    window.addEventListener('scroll', handleNavScroll, { passive: true });
    handleNavScroll();

    // ============================
    // Active Section Highlighting
    // ============================
    function highlightActiveSection() {
        var scrollPos = window.scrollY + 160;
        sections.forEach(function (section) {
            var top    = section.offsetTop;
            var height = section.offsetHeight;
            var id     = section.getAttribute('id');
            if (scrollPos >= top && scrollPos < top + height) {
                allNavLinks.forEach(function (link) {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === '#' + id) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }
    window.addEventListener('scroll', highlightActiveSection, { passive: true });
    highlightActiveSection();

    // ============================
    // Mobile Menu Toggle
    // ============================
    function closeMobileMenu() {
        if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
        if (navLinks)  navLinks.classList.remove('is-open');
        document.body.style.overflow = '';
    }

    function openMobileMenu() {
        if (navToggle) navToggle.setAttribute('aria-expanded', 'true');
        if (navLinks)  navLinks.classList.add('is-open');
        document.body.style.overflow = 'hidden';
    }

    if (navToggle) {
        navToggle.addEventListener('click', function () {
            var isOpen = navToggle.getAttribute('aria-expanded') === 'true';
            if (isOpen) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        });
    }

    // Close menu on link click
    allNavLinks.forEach(function (link) {
        link.addEventListener('click', function () {
            closeMobileMenu();
        });
    });

    // Close menu on Escape
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeMobileMenu();
            // Also close WA modal
            if (waModal && waModal.classList.contains('is-active')) {
                closeWaModal();
            }
        }
    });

    // ============================
    // Intersection Observer – Fade-In with Stagger
    // ============================
    if ('IntersectionObserver' in window && !prefersReducedMotion) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -60px 0px'
        });

        fadeEls.forEach(function (el, index) {
            observer.observe(el);
        });

        // Add stagger attributes to grouped elements
        var buildCards = document.querySelectorAll('.build-card.fade-in');
        buildCards.forEach(function (card, i) {
            card.setAttribute('data-stagger', String(i + 1));
        });

        var timelineSteps = document.querySelectorAll('.timeline-step.fade-in');
        timelineSteps.forEach(function (step, i) {
            step.setAttribute('data-stagger', String(i + 1));
        });
    } else {
        // Reduced motion or no IntersectionObserver: show everything
        fadeEls.forEach(function (el) {
            el.classList.add('is-visible');
        });
    }

    // ============================
    // WhatsApp CTA — QR Modal on Desktop, Deep Link on Mobile
    // ============================
    function closeWaModal() {
        if (!waModal) return;
        waModal.classList.remove('is-active');
        setTimeout(function () {
            waModal.setAttribute('hidden', '');
        }, 300);
    }

    function openWaModal() {
        if (!waModal) return;
        waModal.removeAttribute('hidden');
        // Force reflow so transition fires
        waModal.offsetHeight;
        waModal.classList.add('is-active');
    }

    if (waBtn) {
        waBtn.addEventListener('click', function (e) {
            // Check if the link is a placeholder
            var href = waBtn.getAttribute('href') || '';
            var isPlaceholder = href.indexOf('your-invite-link') !== -1;

            if (isPlaceholder) {
                e.preventDefault();
                if (isTouchDevice) {
                    alert('WhatsApp community link coming soon! Contact us at hultaicollective@gmail.com in the meantime.');
                } else {
                    openWaModal();
                }
                return;
            }

            // If real link + desktop → show QR modal
            if (!isTouchDevice) {
                e.preventDefault();
                openWaModal();
            }
            // On mobile with real link, let it open naturally (deep link)
        });
    }

    if (waModalClose) {
        waModalClose.addEventListener('click', closeWaModal);
    }

    if (waModal) {
        waModal.addEventListener('click', function (e) {
            if (e.target === waModal) {
                closeWaModal();
            }
        });
    }

    // ============================
    // Dynamic Year
    // ============================
    var yearEl = document.querySelector('.js-year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

    // ============================
    // Console Branding
    // ============================
    console.log(
        '%cHAC %c– Hult AI Collective',
        'font-size:24px;font-weight:bold;color:#0F2340;font-family:Georgia,serif;',
        'font-size:16px;color:#374151;'
    );
    console.log(
        '%cBuild. Automate. Ship.',
        'font-size:14px;color:#FF6B6B;font-style:italic;'
    );
    console.log(
        '%c→ kartavya.tech',
        'font-size:12px;color:#20C997;'
    );

})();
