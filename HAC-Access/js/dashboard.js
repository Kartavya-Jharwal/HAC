/**
 * ══════════════════════════════════════════════════════════════════════════════
 * HAC Dashboard - Logic & State Management
 * ══════════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const STORAGE_KEY = 'hac_profile';

    // ═══════════════════════════════════════════════════════════════════════════
    // EVENT DATA (SP26)
    // ═══════════════════════════════════════════════════════════════════════════
    const EVENTS = [
        {
            id: 'opening-night',
            title: 'HAC Launch Event — Opening Night',
            date: '2026-02-26',
            time: '18:00',
            desc: 'Hult AI Collective is hosting its first ever event. We will introduce the board, share our mission, and explain what HAC will focus on this year.',
            location: 'Classroom 1A, Hult London',
            type: 'LAUNCH EVENT',
            status: 'upcoming',
            registered: false,
            pageUrl: '../events/opening-night.html'
        },
        {
            id: 'excalidraw-workshop',
            title: 'AI + Excalidraw Workshop',
            date: '2026-02-26',
            time: '18:00',
            desc: 'Hands-on session: Build AI-powered diagrams using Mermaid & Excalidraw. The highest-leverage skill you can learn this semester.',
            location: 'Classroom 1A, Hult London',
            type: 'WORKSHOP',
            status: 'upcoming',
            registered: false,
            pageUrl: '../events/opening-night.html'
        },
        {
            id: 'fin-trading',
            title: 'Financial Technical Analysis for Traders',
            date: '2026-03-05',
            time: null,
            desc: 'Master chart patterns, indicators, and AI-powered trading analysis. Build your own technical analysis dashboards.',
            location: 'Hult London Campus',
            type: 'WORKSHOP',
            status: 'upcoming',
            registered: false,
            pageUrl: '../events/financial-trading.html'
        },
        {
            id: 'event-3',
            title: 'Workshop 3 – Late March',
            date: '2026-03-24',
            time: null,
            desc: 'Coming soon. Details to be announced.',
            location: 'Hult London',
            type: 'WORKSHOP',
            status: 'upcoming',
            registered: false,
            pageUrl: '../events/workshop-3.html'
        },
        {
            id: 'event-4',
            title: 'Workshop 4 – Early April',
            date: '2026-04-07',
            time: null,
            desc: 'Coming soon. Details to be announced.',
            location: 'Hult London',
            type: 'WORKSHOP',
            status: 'upcoming',
            registered: false,
            pageUrl: '../events/workshop-4.html'
        }
    ];

    // ═══════════════════════════════════════════════════════════════════════════
    // EVENT UTILITIES
    // ═══════════════════════════════════════════════════════════════════════════
    function getDaysUntil(dateStr) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const eventDate = new Date(dateStr);
        eventDate.setHours(0, 0, 0, 0);
        const diffTime = eventDate - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    function getEventStatus(dateStr) {
        const days = getDaysUntil(dateStr);
        if (days < 0) return { label: 'PAST', class: 'past' };
        if (days === 0) return { label: 'TODAY', class: 'today' };
        if (days === 1) return { label: 'TOMORROW', class: 'tomorrow' };
        if (days > 1 && days <= 30) return { label: `IN ${days} DAYS`, class: 'soon' };
        return { label: 'COMING SOON', class: 'soon' };
    }

    function formatDate(dateStr) {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
    }

    function formatTime(timeStr) {
        if (!timeStr) return null;
        const [h, m] = timeStr.split(':');
        const hour = parseInt(h);
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${m} ${period}`;
    }

    function isPastEvent(dateStr) {
        return getDaysUntil(dateStr) < 0;
    }

    function renderEventCard(event) {
        const isPast = isPastEvent(event.date);
        const status = getEventStatus(event.date);
        const displayDate = formatDate(event.date);
        const displayTime = formatTime(event.time);
        const timeStr = displayTime ? `${displayDate} • ${displayTime}` : displayDate;

        let html = `
            <button class="event-card" data-event-id="${event.id}">
                <div class="event-card__tag event-card__tag--${isPast ? 'past' : 'upcoming'}">
                    ◈ ${isPast ? 'PAST' : 'UPCOMING'} — ${event.type}
                </div>
                <h2 class="event-card__title">${event.title}</h2>
                <p class="event-card__desc">${event.desc}</p>
                <div class="event-card__time">
                    <span class="event-card__detail-icon">◷</span> ${timeStr}
                </div>`;
        
        if (!isPast) {
            const countdownStatus = status;
            html += `
                <div class="event-card__countdown event-card__countdown--${countdownStatus.class}">
                    ${countdownStatus.label}
                </div>`;
        }

        html += `
                <div class="event-card__details">
                    <span class="event-card__detail">
                        <span class="event-card__detail-icon">◎</span> ${event.location}
                    </span>
                    <span class="event-card__detail">
                        <span class="event-card__detail-icon">◈</span> ${event.type}
                    </span>
                </div>
                <div class="event-card__footer">
                    <span class="event-card__cta">
                        ${isPast ? 'EVENT PAST' : 'REGISTER'} <span class="event-card__cta-arrow">${isPast ? '✓' : '→'}</span>
                    </span>
                    <span class="event-card__spots">${event.registered ? 'REGISTERED' : 'OPEN'}</span>
                </div>
            </button>`;

        return html;
    }

    function renderEvents() {
        const upcoming = EVENTS.filter(e => !isPastEvent(e.date));
        const past = EVENTS.filter(e => isPastEvent(e.date));

        // Render upcoming
        const upcomingContainer = document.getElementById('upcoming-events-container');
        const upcomingCount = document.getElementById('upcoming-event-count');
        if (upcomingContainer) {
            upcomingContainer.innerHTML = upcoming.map(e => renderEventCard(e)).join('');
            if (upcomingCount) upcomingCount.textContent = `${upcoming.length} EVENT${upcoming.length !== 1 ? 'S' : ''}`;
        }

        // Render past
        if (past.length > 0) {
            const pastSection = document.getElementById('past-events');
            const pastContainer = document.getElementById('past-events-container');
            const pastCount = document.getElementById('past-event-count');
            if (pastSection && pastContainer) {
                pastSection.classList.add('visible');
                pastSection.style.display = 'block';
                pastContainer.innerHTML = past.map(e => renderEventCard(e)).join('');
                if (pastCount) pastCount.textContent = `${past.length} EVENT${past.length !== 1 ? 'S' : ''}`;
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PROFILE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════
    function loadProfile() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) { return null; }
    }

    function populateDashboard() {
        const profile = loadProfile();
        if (!profile) {
            window.location.href = './index.html';
            return;
        }

        const name = profile.name || 'Member';
        const firstName = name.split(' ')[0];

        // Welcome section
        const welcomeName = document.getElementById('welcome-name');
        if (welcomeName) welcomeName.textContent = firstName;

        // Member card
        const memberName = document.getElementById('member-name');
        if (memberName) memberName.textContent = name;

        const memberId = document.getElementById('member-id');
        if (memberId) memberId.textContent = profile.memberId || 'HAC-2025-0001';

        const memberClearance = document.getElementById('member-clearance');
        if (memberClearance) memberClearance.textContent = profile.clearance || 'BUILDER';

        const memberDesignation = document.getElementById('member-designation');
        if (memberDesignation) memberDesignation.textContent = profile.designation || 'AI COLLECTIVE MEMBER';

        const memberStudentId = document.getElementById('member-studentid');
        if (memberStudentId) memberStudentId.textContent = profile.studentId || '—';

        // Avatar
        if (profile.avatar) {
            const avatarEl = document.getElementById('member-avatar');
            if (avatarEl) {
                avatarEl.innerHTML = '';
                const img = document.createElement('img');
                img.src = profile.avatar;
                img.alt = 'Profile';
                avatarEl.appendChild(img);
            }
        }

        // Last login
        if (profile.lastLogin) {
            const sub = document.getElementById('welcome-subtitle');
            const d = new Date(profile.lastLogin);
            const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
            if (sub) sub.textContent = `LAST LOGIN ${dateStr} // HAC-OS v2.0.0`;
        }

        // Footer year
        const yearEl = document.getElementById('footer-year');
        if (yearEl) yearEl.textContent = new Date().getFullYear();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MODAL/DIALOG SYSTEM
    // ═══════════════════════════════════════════════════════════════════════════
    function showDialog(title, message, buttons = []) {
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';

        const modal = document.createElement('div');
        modal.className = 'modal';

        const header = document.createElement('div');
        header.className = 'modal__header';
        header.innerHTML = `<h2 class="modal__title">${title}</h2>`;

        const content = document.createElement('div');
        content.className = 'modal__content';
        content.innerHTML = message;

        const footer = document.createElement('div');
        footer.className = 'modal__footer';

        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.className = `modal__btn modal__btn--${btn.type || 'default'}`;
            button.textContent = btn.text;
            button.addEventListener('click', () => {
                if (btn.action) btn.action();
                backdrop.remove();
            });
            footer.appendChild(button);
        });

        modal.appendChild(header);
        modal.appendChild(content);
        modal.appendChild(footer);
        backdrop.appendChild(modal);

        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) backdrop.remove();
        });

        document.body.appendChild(backdrop);
    }

    function showEditProfileDialog() {
        const profile = loadProfile();
        const message = `
            <div class="dialog-content">
                <p><strong>Edit Your Profile</strong></p>
                <p>Your profile data is <strong>persisted locally</strong> in your browser's storage.</p>
                <div class="data-info">
                    <p><strong>Current Data:</strong></p>
                    <ul>
                        <li>Name: ${profile?.name || '—'}</li>
                        <li>Email: ${profile?.email || '—'}</li>
                        <li>Clearance: ${profile?.clearance || '—'}</li>
                        <li>Designation: ${profile?.designation || '—'}</li>
                        <li>Student ID: ${profile?.studentId || '—'}</li>
                    </ul>
                </div>
                <p>Changes will be <strong>saved to your session</strong> when you edit through the Access Portal.</p>
            </div>
        `;

        showDialog('EDIT PROFILE', message, [
            {
                text: 'CANCEL',
                type: 'secondary',
                action: () => { }
            },
            {
                text: 'GO TO PORTAL',
                type: 'primary',
                action: () => {
                    window.location.href = './index.html';
                }
            }
        ]);
    }

    function showReturnLoginDialog() {
        const message = `
            <div class="dialog-content">
                <p><strong>Return to Login</strong></p>
                <p>You will be logged out. Your profile data is <strong>saved locally</strong> and will be available the next time you log in.</p>
                <div class="data-info">
                    <p><strong>What happens:</strong></p>
                    <ul>
                        <li>✓ Profile remains in storage</li>
                        <li>✓ Next login loads saved profile</li>
                        <li>✓ Auto-fills your information</li>
                    </ul>
                </div>
                <p><strong>To clear data:</strong> Use "Clear Cache" in settings.</p>
            </div>
        `;

        showDialog('RETURN TO LOGIN', message, [
            {
                text: 'STAY ON DASHBOARD',
                type: 'secondary',
                action: () => { }
            },
            {
                text: 'LOG OUT',
                type: 'primary',
                action: () => {
                    window.location.href = './index.html?logout=true';
                }
            }
        ]);
    }

    function showClearCacheDialog() {
        const message = `
            <div class="dialog-content">
                <p><strong>Clear Cache & History</strong></p>
                <p>This will <strong>permanently delete</strong> your stored profile data.</p>
                <div class="data-info warning">
                    <p><strong>⚠ Warning:</strong></p>
                    <ul>
                        <li>✗ Profile data will be erased</li>
                        <li>✗ Avatar image will be removed</li>
                        <li>✗ Cannot be undone</li>
                    </ul>
                </div>
                <p>You can log in again anytime to create a new profile.</p>
            </div>
        `;

        showDialog('CLEAR CACHE', message, [
            {
                text: 'CANCEL',
                type: 'secondary',
                action: () => { }
            },
            {
                text: 'CLEAR ALL DATA',
                type: 'danger',
                action: () => {
                    localStorage.removeItem(STORAGE_KEY);
                    showDialog('CACHE CLEARED', '<p>Your data has been deleted. Redirecting...</p>', [
                        {
                            text: 'OK',
                            type: 'primary',
                            action: () => {
                                window.location.href = './index.html';
                            }
                        }
                    ]);
                }
            }
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EVENT DETAIL DIALOGS
    // ═══════════════════════════════════════════════════════════════════════════
    function showEventDialog(event) {
        if (!event) return;

        const displayDate = formatDate(event.date);
        const displayTime = formatTime(event.time);
        const dateInfo = displayTime ? `${displayDate} at ${displayTime}` : displayDate;

        const eventDetails = {
            'opening-night': {
                details: `
                    <h3>HAC Launch Event</h3>
                    <p>Hult AI Collective is hosting its first ever event and we would love to see you there.</p>
                    <h3>What to Expect:</h3>
                    <ul>
                        <li>We will introduce the board and share our mission</li>
                        <li>Explain what HAC will focus on this year</li>
                        <li>Preview of future events and how you can be involved</li>
                        <li>Collaborations and project opportunities</li>
                    </ul>
                    <h3>🎨 AI + Excalidraw Workshop</h3>
                    <p>Hands-on session: Build AI-powered diagrams using Mermaid & Excalidraw.</p>
                    <p><em>AI + Excalidraw is the highest-leverage skill you can learn this semester.</em></p>
                    <h3>This is the beginning of something new. Come and be part of it.</h3>
                    <h3>Location:</h3>
                    <ul>
                        <li>Classroom 1A</li>
                        <li>Hult London Campus</li>
                    </ul>`
            },
            'excalidraw-workshop': {
                details: `
                    <h3>AI + Excalidraw Workshop</h3>
                    <p>Hands-on session: Build AI-powered diagrams using Mermaid & Excalidraw.</p>
                    <h3>What You'll Learn:</h3>
                    <ul>
                        <li>Create AI-powered diagrams with Excalidraw</li>
                        <li>Use Mermaid syntax for rapid diagram generation</li>
                        <li>Integrate AI tools into your visual workflow</li>
                        <li>Build reusable diagram templates</li>
                    </ul>
                    <p><strong>AI + Excalidraw is the highest-leverage skill you can learn this semester.</strong></p>
                    <h3>Location:</h3>
                    <ul>
                        <li>Classroom 1A</li>
                        <li>Hult London Campus</li>
                    </ul>`
            },
            'fin-trading': {
                details: `
                    <h3>What You'll Learn:</h3>
                    <ul>
                        <li>Technical analysis fundamentals</li>
                        <li>Chart patterns & indicators</li>
                        <li>AI in trading strategy</li>
                        <li>Building trading dashboards</li>
                        <li>Backtesting & risk management</li>
                    </ul>
                    <h3>Design Thinking Focus:</h3>
                    <p>Apply systems thinking to market dynamics. Design data-driven trading systems with feedback loops.</p>
                    <h3>Location:</h3>
                    <p>Hult London Campus</p>`
            },
            'event-3': {
                details: `
                    <p>Details coming soon. Check back for updates!</p>
                    <h3>Location:</h3>
                    <p>Hult London</p>`
            },
            'event-4': {
                details: `
                    <p>Details coming soon. Check back for updates!</p>
                    <h3>Location:</h3>
                    <p>Hult London</p>`
            }
        };

        const detail = eventDetails[event.id] || { details: '<p>Details coming soon.</p>' };
        const message = `
            <div class="event-detail">
                <p>${event.desc}</p>
                <p><strong>📅 ${dateInfo}</strong></p>
                <p><strong>📍 ${event.location}</strong></p>
                ${detail.details}
            </div>
        `;

        showDialog(`${event.title.toUpperCase()}`, message, [
            {
                text: 'LEARN MORE',
                type: 'primary',
                action: () => {
                    if (event.pageUrl) {
                        window.location.href = event.pageUrl;
                    }
                }
            },
            {
                text: 'CLOSE',
                type: 'secondary',
                action: () => { }
            }
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // NAMECARD EXPORT (same as main.js but standalone)
    // ═══════════════════════════════════════════════════════════════════════════
    function generateNamecard(callback) {
        const profile = loadProfile();
        if (!profile) return;

        const canvas = document.getElementById('card-export-canvas');
        if (!canvas) return;

        const DPR = 2;
        const W = 1050 * DPR, H = 600 * DPR;
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');
        ctx.scale(DPR, DPR);

        const w = 1050, h = 600;
        const r = 0, g = 212, b = 212;
        const accent = `rgb(${r}, ${g}, ${b})`;
        const bg = '#0E0E0E';
        const darkPanel = '#111111';
        const textPrimary = '#E8E8E8';
        const textSecondary = '#888888';
        const textDim = '#555555';

        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        // Grid
        ctx.strokeStyle = 'rgba(255,255,255,0.02)';
        ctx.lineWidth = 0.5;
        for (let x = 0; x < w; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
        for (let y = 0; y < h; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

        // Top stripe
        ctx.fillStyle = accent;
        ctx.fillRect(0, 0, w, 5);

        // Header
        const headerY = 16;
        ctx.font = 'bold 40px "Bai Jamjuree", sans-serif';
        ctx.fillStyle = accent;
        ctx.fillText('HAC', 36, headerY + 36);

        ctx.font = '300 14px "Bai Jamjuree", sans-serif';
        ctx.fillStyle = textSecondary;
        ctx.fillText('HULT AI COLLECTIVE', 120, headerY + 24);

        ctx.font = '500 11px "Bai Jamjuree", sans-serif';
        ctx.fillStyle = textDim;
        ctx.fillText('MEMBER IDENTIFICATION', 120, headerY + 40);

        // Member ID
        const memberId = profile.memberId || 'HAC-2025-0001';
        ctx.font = '500 12px "Fira Mono", monospace';
        ctx.fillStyle = textDim;
        ctx.textAlign = 'right';
        ctx.fillText(memberId, w - 36, headerY + 18);

        // Issue date
        const now = new Date();
        const dateStr = `${String(now.getDate()).padStart(2,'0')}.${String(now.getMonth()+1).padStart(2,'0')}.${now.getFullYear()}`;
        ctx.font = '400 10px "Fira Mono", monospace';
        ctx.fillText(`ISSUED ${dateStr}`, w - 36, headerY + 36);
        ctx.textAlign = 'left';

        // Separator
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(36, 68, w - 72, 1);

        // Avatar area
        const colX = 36, colW = 190;
        const avatarX = colX, avatarY = 84, avatarW = colW, avatarH = 186;
        ctx.fillStyle = darkPanel;
        ctx.fillRect(avatarX, avatarY, avatarW, avatarH);
        ctx.strokeStyle = 'rgba(0,212,212,0.3)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(avatarX, avatarY, avatarW, avatarH);

        // Draw avatar or placeholder
        if (profile.avatar) {
            try {
                const img = new Image();
                img.onload = () => {
                    ctx.drawImage(img, avatarX, avatarY, avatarW, avatarH);
                    ctx.fillStyle = accent;
                    ctx.fillRect(avatarX, avatarY + avatarH, avatarW, 3);
                    ctx.font = '500 9px "Bai Jamjuree", sans-serif';
                    ctx.fillStyle = textDim;
                    ctx.textAlign = 'center';
                    ctx.fillText('PHOTO ID', avatarX + avatarW / 2, avatarY + avatarH + 18);
                    ctx.textAlign = 'left';
                    finishCanvas();
                };
                img.src = profile.avatar;
            } catch (e) {
                drawPlaceholder();
            }
        } else {
            drawPlaceholder();
        }

        function drawPlaceholder() {
            // Draw person silhouette
            const cx = avatarX + avatarW / 2;
            const cy = avatarY + 50;
            ctx.fillStyle = accent;
            ctx.globalAlpha = 0.2;
            ctx.beginPath();
            ctx.arc(cx, cy, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(cx, cy + 50, 35, 45, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            finishCanvas();
        }

        function finishCanvas() {
            // Accent bar under avatar
            ctx.fillStyle = accent;
            ctx.fillRect(avatarX, avatarY + avatarH, avatarW, 3);

            // "PHOTO ID" label
            ctx.font = '500 9px "Bai Jamjuree", sans-serif';
            ctx.fillStyle = textDim;
            ctx.textAlign = 'center';
            ctx.fillText('PHOTO ID', avatarX + avatarW / 2, avatarY + avatarH + 18);
            ctx.textAlign = 'left';

            // Field data (right side)
            const fields = [
                { label: 'NAME', value: profile.name || 'HAC MEMBER' },
                { label: 'EMAIL', value: profile.email || 'member@hac.edu' },
                { label: 'CLEARANCE', value: profile.clearance || 'BUILDER' },
                { label: 'DESIGNATION', value: profile.designation || 'AI COLLECTIVE MEMBER' },
                { label: 'STUDENT ID', value: profile.studentId || '—' }
            ];

            const fieldX = avatarX + avatarW + 32;
            let fieldY = 94;
            const fieldSpacing = 50;
            fields.forEach((f) => {
                ctx.font = '600 10px "Bai Jamjuree", sans-serif';
                ctx.fillStyle = accent;
                ctx.globalAlpha = 0.7;
                ctx.fillText(f.label, fieldX, fieldY);
                ctx.globalAlpha = 1;

                ctx.font = '500 20px "Bai Jamjuree", sans-serif';
                ctx.fillStyle = textPrimary;
                let val = f.value;
                while (ctx.measureText(val).width > (w - fieldX - 48) && val.length > 3) {
                    val = val.slice(0, -1);
                }
                if (val !== f.value) val += '…';
                ctx.fillText(val, fieldX, fieldY + 22);

                ctx.fillStyle = 'rgba(255,255,255,0.04)';
                ctx.fillRect(fieldX, fieldY + 30, w - fieldX - 48, 1);
                fieldY += fieldSpacing;
            });

            // Footer
            ctx.fillStyle = 'rgba(255,255,255,0.03)';
            ctx.fillRect(0, h - 62, w, 62);
            ctx.fillStyle = 'rgba(255,255,255,0.06)';
            ctx.fillRect(0, h - 62, w, 1);

            ctx.font = '20px monospace';
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fillText('▌▐▌▌▐▐▌▐▌▐▌▌▐▐▌▐▌▐▌▌▐▐▌', 36, h - 26);

            ctx.font = '600 12px "Bai Jamjuree", sans-serif';
            ctx.fillStyle = accent;
            ctx.textAlign = 'right';
            ctx.fillText('HULT AI COLLECTIVE', w - 36, h - 38);
            ctx.font = '400 10px "Fira Mono", monospace';
            ctx.fillStyle = textDim;
            ctx.fillText('hultaicollective.com', w - 36, h - 22);
            ctx.textAlign = 'left';

            // Border & corners
            ctx.strokeStyle = 'rgba(0,212,212,0.2)';
            ctx.lineWidth = 2;
            ctx.strokeRect(1, 1, w - 2, h - 2);

            const cornerLen = 18;
            ctx.strokeStyle = accent;
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(0, cornerLen); ctx.lineTo(0, 0); ctx.lineTo(cornerLen, 0); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(w - cornerLen, 0); ctx.lineTo(w, 0); ctx.lineTo(w, cornerLen); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, h - cornerLen); ctx.lineTo(0, h); ctx.lineTo(cornerLen, h); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(w - cornerLen, h); ctx.lineTo(w, h); ctx.lineTo(w, h - cornerLen); ctx.stroke();

            if (callback) callback();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EVENT LISTENERS
    // ═══════════════════════════════════════════════════════════════════════════
    document.addEventListener('DOMContentLoaded', () => {
        populateDashboard();
        renderEvents();

        // Event card event delegation
        document.addEventListener('click', (e) => {
            const eventCard = e.target.closest('.event-card[data-event-id]');
            if (eventCard) {
                e.preventDefault();
                const eventId = eventCard.dataset.eventId;
                const event = EVENTS.find(ev => ev.id === eventId);
                if (event && !isPastEvent(event.date)) {
                    showEventDialog(event);
                }
            }
        });

        // Navigation logout button
        const navLogoutBtn = document.getElementById('nav-logout-btn');
        if (navLogoutBtn) {
            navLogoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                showReturnLoginDialog();
            });
        }

        // Edit profile button
        const editBtn = document.getElementById('edit-profile-btn');
        if (editBtn) {
            editBtn.addEventListener('click', showEditProfileDialog);
        }

        // Return to login button (member card)
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', showReturnLoginDialog);
        }

        // Clear cache button
        const clearBtn = document.getElementById('clear-cache-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', showClearCacheDialog);
        }

        // Share card button (member card)
        const shareBtn = document.getElementById('share-card-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                generateNamecard(() => {
                    const canvas = document.getElementById('card-export-canvas');
                    canvas.toBlob((blob) => {
                        const file = new File([blob], 'hac_namecard.png', { type: 'image/png' });
                        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                            navigator.share({
                                title: 'My HAC Namecard',
                                text: 'Check out my HAC Member Card',
                                files: [file]
                            });
                        } else {
                            // Fallback to download
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'hac_namecard.png';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                        }
                    });
                });
            });
        }

        // Download card button (member card)
        const downloadBtn = document.getElementById('download-card-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                generateNamecard(() => {
                    const canvas = document.getElementById('card-export-canvas');
                    canvas.toBlob((blob) => {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        const profile = loadProfile();
                        const name = (profile?.name || 'HAC_MEMBER').replace(/\s+/g, '_').toUpperCase();
                        a.download = `HAC_NAMECARD_${name}.png`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                    });
                });
            });
        }

        // Button map - Logout
        const buttonmapLogout = document.getElementById('buttonmap-logout');
        if (buttonmapLogout) {
            buttonmapLogout.addEventListener('click', () => {
                window.location.href = './index.html?logout=true';
            });
        }

        // Button map - Share
        const buttonmapShare = document.getElementById('buttonmap-share');
        if (buttonmapShare) {
            buttonmapShare.addEventListener('click', () => {
                generateNamecard(() => {
                    const canvas = document.getElementById('card-export-canvas');
                    canvas.toBlob((blob) => {
                        const file = new File([blob], 'hac_namecard.png', { type: 'image/png' });
                        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                            navigator.share({
                                title: 'My HAC Namecard',
                                text: 'Check out my HAC Member Card',
                                files: [file]
                            });
                        } else {
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'hac_namecard.png';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                        }
                    });
                });
            });
        }

        // Button map - Download
        const buttonmapDownload = document.getElementById('buttonmap-download');
        if (buttonmapDownload) {
            buttonmapDownload.addEventListener('click', () => {
                generateNamecard(() => {
                    const canvas = document.getElementById('card-export-canvas');
                    canvas.toBlob((blob) => {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        const profile = loadProfile();
                        const name = (profile?.name || 'HAC_MEMBER').replace(/\s+/g, '_').toUpperCase();
                        a.download = `HAC_NAMECARD_${name}.png`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                    });
                });
            });
        }

        // Resource cards - CodePen support (future)
        document.querySelectorAll('.resource-card__expand').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const card = btn.closest('.resource-card');
                card.classList.toggle('expanded');
            });
        });
    });

    // Expose for external use
    window.DashboardUI = {
        showDialog,
        showEventDialog,
        generateNamecard,
        loadProfile
    };

})();
