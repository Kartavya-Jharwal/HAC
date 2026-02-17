/**
 * HAC Landing Page – Minimal JS
 * Only essential interactions: smooth scroll, mobile menu, dynamic year
 */
(function () {
    'use strict';

    // DOM
    const nav = document.querySelector('.nav');
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');

    // ============================
    // Smooth Scroll
    // ============================
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
        link.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            e.preventDefault();
            const target = document.getElementById(href.substring(1));
            if (!target) return;

            const offset = nav ? nav.offsetHeight : 0;
            window.scrollTo({
                top: target.offsetTop - offset,
                behavior: 'smooth'
            });

            // Close mobile menu
            closeMobileMenu();
        });
    });

    // ============================
    // Mobile Menu
    // ============================
    function closeMobileMenu() {
        if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
        if (navLinks) navLinks.classList.remove('is-open');
        document.body.style.overflow = '';
    }

    function openMobileMenu() {
        if (navToggle) navToggle.setAttribute('aria-expanded', 'true');
        if (navLinks) navLinks.classList.add('is-open');
        document.body.style.overflow = 'hidden';
    }

    if (navToggle) {
        navToggle.addEventListener('click', function () {
            const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
            isOpen ? closeMobileMenu() : openMobileMenu();
        });
    }

    // Close on Escape
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeMobileMenu();
    });

    // ============================
    // Dynamic Year
    // ============================
    const yearEl = document.querySelector('.js-year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

    // ============================
    // WhatsApp Placeholder
    // ============================
    const waLink = document.querySelector('a[href*="whatsapp.com/your-invite-link"]');
    if (waLink) {
        waLink.addEventListener('click', function (e) {
            e.preventDefault();
            alert('WhatsApp community link coming soon! Contact hultaicollective@gmail.com in the meantime.');
        });
    }

})();
