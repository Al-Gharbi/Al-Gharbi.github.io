/* ═══════════════════════════════════════════════════════
   GALLERY · Tabs + accessible lightbox
   - Galleries are read from the DOM (.ps-strip > .ps-thumb-wrap), so the
     HTML is the single source of truth.
   - Lightbox: role="dialog", focus moves in and is restored on close,
     Tab is trapped inside, Esc closes, arrows / swipe navigate.
   ═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const lb         = document.getElementById('lightbox');
  const lbImg      = document.getElementById('lb-img');
  const lbCap      = document.getElementById('lb-caption');
  const lbCounter  = document.getElementById('lb-counter');
  const lbThumbsEl = document.getElementById('lb-thumbs');
  if (!lb || !lbImg) return;

  /* ── Gallery data, built from the markup ─────────────── */
  const GALLERIES = {};
  document.querySelectorAll('.ps-strip').forEach(strip => {
    GALLERIES[strip.id] = Array.from(strip.querySelectorAll('.ps-thumb-wrap')).map(btn => ({
      src: btn.querySelector('img').getAttribute('src'),
      cap: btn.dataset.cap || '',
    }));
  });

  let lbGallery = null;
  let lbIdx = 0;
  let lastFocus = null;
  let touchStartX = 0;

  /* ── Lightbox thumbnails ─────────────────────────────── */
  function buildLbThumbs(galleryId) {
    lbThumbsEl.textContent = '';
    GALLERIES[galleryId].forEach((item, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'lb-thumb-btn';
      b.setAttribute('aria-label', 'Show screenshot ' + (i + 1) + ': ' + item.cap);
      const img = document.createElement('img');
      img.src = item.src;
      img.alt = '';
      img.className = 'lb-thumb';
      b.appendChild(img);
      b.addEventListener('click', e => { e.stopPropagation(); setSlide(i); });
      lbThumbsEl.appendChild(b);
    });
  }

  function setSlide(idx) {
    const gallery = GALLERIES[lbGallery];
    lbIdx = (idx + gallery.length) % gallery.length;
    const item = gallery[lbIdx];

    lbImg.classList.add('loading');
    lbImg.onload = () => lbImg.classList.remove('loading');
    lbImg.src = item.src;
    lbImg.alt = item.cap;
    lbCap.textContent = item.cap;
    lbCounter.textContent = (lbIdx + 1) + ' / ' + gallery.length;

    const thumbs = lbThumbsEl.querySelectorAll('.lb-thumb');
    thumbs.forEach((t, i) => t.classList.toggle('active', i === lbIdx));
    const active = thumbs[lbIdx];
    if (active) active.scrollIntoView({ block: 'nearest', inline: 'center' });
  }

  /* ── Open / close ────────────────────────────────────── */
  function open(galleryId, idx, opener) {
    lbGallery = galleryId;
    lastFocus = opener || document.activeElement;
    buildLbThumbs(galleryId);
    setSlide(idx);
    lb.removeAttribute('inert');
    lb.setAttribute('aria-hidden', 'false');
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    const close = lb.querySelector('.lb-x');
    if (close) close.focus();
  }

  function close() {
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    lb.setAttribute('inert', '');
    document.body.style.overflow = '';
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  const isOpen = () => lb.classList.contains('open');

  /* ── Events ──────────────────────────────────────────── */
  document.querySelectorAll('.ps-strip').forEach(strip => {
    strip.addEventListener('click', e => {
      const btn = e.target.closest('.ps-thumb-wrap');
      if (!btn) return;
      const idx = Array.from(strip.querySelectorAll('.ps-thumb-wrap')).indexOf(btn);
      open(strip.id, idx, btn);
    });
  });

  lb.querySelector('.lb-x').addEventListener('click', close);
  lb.querySelector('.lb-prev').addEventListener('click', e => { e.stopPropagation(); setSlide(lbIdx - 1); });
  lb.querySelector('.lb-next').addEventListener('click', e => { e.stopPropagation(); setSlide(lbIdx + 1); });
  lb.addEventListener('click', e => { if (e.target === lb) close(); });

  document.addEventListener('keydown', e => {
    if (!isOpen()) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'ArrowRight') { setSlide(lbIdx + 1); return; }
    if (e.key === 'ArrowLeft')  { setSlide(lbIdx - 1); return; }
    if (e.key === 'Tab') {                       // focus trap
      const f = Array.from(lb.querySelectorAll('button')).filter(el => el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  lb.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) setSlide(lbIdx + (dx < 0 ? 1 : -1));
  }, { passive: true });

  /* ── Tabs (Public UI / 6-Role Dashboards) ────────────── */
  document.querySelectorAll('.ps-tabs').forEach(tabs => {
    const buttons = Array.from(tabs.querySelectorAll('[role="tab"]'));
    const root = tabs.closest('.proj-screenshots');

    function select(btn, focus) {
      buttons.forEach(t => {
        const on = t === btn;
        t.classList.toggle('active', on);
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      root.querySelectorAll('.ps-strip').forEach(s => s.classList.toggle('hidden', s.id !== btn.dataset.target));
      if (focus) btn.focus();
    }

    buttons.forEach((btn, i) => {
      btn.addEventListener('click', () => select(btn, false));
      btn.addEventListener('keydown', e => {
        let n = -1;
        if (e.key === 'ArrowRight') n = (i + 1) % buttons.length;
        else if (e.key === 'ArrowLeft') n = (i - 1 + buttons.length) % buttons.length;
        else if (e.key === 'Home') n = 0;
        else if (e.key === 'End') n = buttons.length - 1;
        if (n >= 0) { e.preventDefault(); select(buttons[n], true); }
      });
    });
  });
})();
