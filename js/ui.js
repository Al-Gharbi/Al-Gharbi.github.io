/* ═══════════════════════════════════════════════════════
   UI · Navigation · Cursor · Scroll reveal · Hire float
      · Footer session timer · Availability clock
   ═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const PAGE_START = Date.now();
  const REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (id) => document.getElementById(id);

  /* ═══ 1. CUSTOM CURSOR (fine pointers only) ══════════════ */
  const FINE = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (FINE && !REDUCED) {
    const ring = document.createElement('div'); ring.className = 'c-ring';
    const dot  = document.createElement('div'); dot.className  = 'c-dot';
    document.body.append(ring, dot);

    let curX = 0, curY = 0, ringX = 0, ringY = 0, raf = 0;

    // The ring only animates while it is catching up with the pointer.
    function animRing() {
      ringX += (curX - ringX) * 0.12;
      ringY += (curY - ringY) * 0.12;
      ring.style.left = ringX + 'px'; ring.style.top = ringY + 'px';
      raf = (Math.abs(curX - ringX) > 0.1 || Math.abs(curY - ringY) > 0.1) ? requestAnimationFrame(animRing) : 0;
    }

    window.addEventListener('mousemove', e => {
      curX = e.clientX; curY = e.clientY;
      dot.style.left = curX + 'px'; dot.style.top = curY + 'px';
      if (!raf) raf = requestAnimationFrame(animRing);
    }, { passive: true });

    const hoverTarget = e => e.target.closest && e.target.closest('a, button');
    document.addEventListener('mouseover', e => { if (hoverTarget(e)) ring.classList.add('hot'); });
    document.addEventListener('mouseout',  e => { if (hoverTarget(e)) ring.classList.remove('hot'); });
  }

  /* ═══ 2. NAVIGATION + SCROLL PROGRESS ════════════════════ */
  const nav = $('nav');
  const bar = $('scroll-bar');
  let ticking = false;
  function onScroll() {
    ticking = false;
    nav.classList.toggle('on', window.scrollY > 40);
    if (bar) {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      bar.style.width = (max > 0 ? window.scrollY / max * 100 : 0) + '%';
    }
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ═══ 3. SCROLL REVEAL ═══════════════════════════════════ */
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach((ent, i) => {
      if (ent.isIntersecting) {
        setTimeout(() => ent.target.classList.add('in'), i * 65);
        revealObs.unobserve(ent.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.r').forEach(el => revealObs.observe(el));

  /* ── Section title "decrypt" effect ───────────────────── */
  function scrambleText(el) {
    if (REDUCED) return;
    const original = el.textContent;
    el.setAttribute('aria-label', original);          // keep a stable name for assistive tech
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    const total = 18;
    let frame = 0;
    const timer = setInterval(() => {
      el.textContent = original.split('').map((c, i) => {
        if (c === ' ') return ' ';
        if (frame / total > i / original.length) return c;
        return chars[Math.floor(Math.random() * chars.length)];
      }).join('');
      if (++frame >= total) { el.textContent = original; el.removeAttribute('aria-label'); clearInterval(timer); }
    }, 38);
  }
  const ttlObs = new IntersectionObserver(entries => {
    entries.forEach(ent => {
      if (ent.isIntersecting) { scrambleText(ent.target); ttlObs.unobserve(ent.target); }
    });
  }, { threshold: 0.8 });
  document.querySelectorAll('.sec-ttl').forEach(el => ttlObs.observe(el));

  /* ═══ 4. HIRE FLOAT ══════════════════════════════════════ */
  const hireBtn  = $('hf-btn');
  const hireOpts = $('hf-opts');
  const hireBox  = $('hire-float');

  function setHire(open) {
    if (hireOpts) hireOpts.classList.toggle('open', open);
    if (hireBtn)  hireBtn.setAttribute('aria-expanded', String(open));
  }
  if (hireBtn) hireBtn.addEventListener('click', () => setHire(!hireOpts.classList.contains('open')));
  document.addEventListener('click', e => { if (hireBox && !hireBox.contains(e.target)) setHire(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setHire(false); });

  // Show the floating button only while hero, contact and footer are all off screen.
  if (hireBox) {
    const covered = new Set();
    const hideObs = new IntersectionObserver(entries => {
      entries.forEach(ent => { ent.isIntersecting ? covered.add(ent.target) : covered.delete(ent.target); });
      const hide = covered.size > 0;
      hireBox.classList.toggle('is-hidden', hide);
      if (hide) setHire(false);
    }, { threshold: 0.15 });
    ['hero', 'contact'].forEach(id => { const el = $(id); if (el) hideObs.observe(el); });
    const foot = document.querySelector('footer');
    if (foot) hideObs.observe(foot);
  }

  /* ═══ 5. MOBILE MENU ═════════════════════════════════════ */
  const burger = $('nav-burger');
  function setMenu(open) {
    nav.classList.toggle('menu-open', open);
    if (burger) {
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }
  }
  if (burger) {
    burger.addEventListener('click', () => setMenu(!nav.classList.contains('menu-open')));
    document.querySelectorAll('#nav-links a').forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('click', e => { if (!nav.contains(e.target)) setMenu(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { setMenu(false); } });
    window.addEventListener('resize', () => { if (window.innerWidth > 768) setMenu(false); });
  }

  /* ═══ 6. ACTIVE NAV LINK ═════════════════════════════════ */
  const navLinks = Array.from(document.querySelectorAll('.nav-links a'));
  const byHash = new Map(navLinks.map(a => [a.getAttribute('href'), a]));
  const secObs = new IntersectionObserver(entries => {
    entries.forEach(ent => {
      if (!ent.isIntersecting) return;
      navLinks.forEach(a => { a.classList.remove('active'); a.removeAttribute('aria-current'); });
      const link = byHash.get('#' + ent.target.id);
      if (link) { link.classList.add('active'); link.setAttribute('aria-current', 'true'); }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });          // a section is "current" when it crosses the viewport middle
  document.querySelectorAll('main section[id]').forEach(s => secObs.observe(s));

  /* ═══ 7. FOOTER SESSION TIMER ════════════════════════════ */
  const footUp = $('foot-up');
  if (footUp) {
    const pad = n => String(n).padStart(2, '0');
    const tick = () => {
      const s = Math.floor((Date.now() - PAGE_START) / 1000);
      footUp.textContent = pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s % 3600 / 60)) + ':' + pad(s % 60);
    };
    setInterval(() => { if (!document.hidden) tick(); }, 1000);
    tick();
  }

  /* ═══ 8. BACKGROUND HEX FLOATS ═══════════════════════════ */
  if (!REDUCED && FINE) {
    const strs = ['0x4147', '0xFF', '01001100', '10110100', '0xCAFE', '0xDEAD', '0xBEEF', '01101001', '10010001'];
    const spawnFloat = () => {
      if (document.hidden || document.querySelectorAll('.bin-float').length > 10) return;
      const el = document.createElement('div');
      el.className = 'bin-float';
      el.textContent = strs[Math.floor(Math.random() * strs.length)];
      el.style.left = Math.random() * 95 + 'vw';
      const dur = 14 + Math.random() * 14;
      el.style.animationDuration = dur + 's';
      el.style.animationDelay = '-' + (Math.random() * dur) + 's';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), (dur + 2) * 1000);
    };
    for (let i = 0; i < 8; i++) setTimeout(spawnFloat, i * 350);
    setInterval(spawnFloat, 3500);
  }

  /* ═══ 9. AVAILABILITY CLOCK (Yemen, UTC+3, no DST) ═══════ */
  (function initAvailClock() {
    const timeEl = $('avail-time');
    const dayEl  = $('avail-day');
    if (!timeEl) return;
    let fmtTime, fmtDay;
    try {
      fmtTime = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Aden', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      fmtDay  = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Aden', weekday: 'long' });
    } catch (e) { return; }
    const update = () => {
      const now = new Date();
      timeEl.textContent = fmtTime.format(now);
      if (dayEl) dayEl.textContent = fmtDay.format(now);
    };
    update();
    setInterval(() => { if (!document.hidden) update(); }, 1000);
  })();

  /* ═══ 10. CARD HOVER GLOW ════════════════════════════════ */
  document.querySelectorAll('.svc-card, .sk-card, .case-card').forEach(card => {
    card.addEventListener('mouseenter', () => card.style.setProperty('--glow-line-op', '1'));
    card.addEventListener('mouseleave', () => card.style.setProperty('--glow-line-op', '0'));
  });
})();
