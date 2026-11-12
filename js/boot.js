/* ═══════════════════════════════════════════════════════
   BOOT · Short intro sequence
   - ~1.2 s, skipped on repeat visits in the same session,
     and skippable at any time (click, tap or any key).
   ═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const LINES = [
    { tag: 'LOAD',  text: 'Abdulrahman Al-Gharbi — Full Stack Developer' },
    { tag: 'WEB',   text: 'Nashiit — multi-tenant Arabic SaaS (Next.js · PostgreSQL)' },
    { tag: 'APP',   text: 'HatKart — Android (Kotlin) + FastAPI platform' },
    { tag: 'DFIR',  text: 'win-ir-triage · forensic-evidence-toolkit · smart-audit' },
    { tag: 'OSS',   text: '5 pull requests merged upstream' },
    { tag: 'READY', text: 'Open to opportunities' },
  ];

  const BOOT_EL  = document.getElementById('boot');
  const LINES_EL = document.getElementById('boot-lines');
  const FILL_EL  = document.getElementById('boot-fill');
  const PCT_EL   = document.getElementById('boot-pct');
  if (!BOOT_EL) return;

  const SEEN_KEY = 'ag-boot-seen';
  const timers = [];
  let finished = false;

  function seenBefore() {
    try { return sessionStorage.getItem(SEEN_KEY) === '1'; } catch (e) { return false; }
  }
  function markSeen() {
    try { sessionStorage.setItem(SEEN_KEY, '1'); } catch (e) { /* storage may be blocked */ }
  }

  function later(fn, ms) { const t = setTimeout(fn, ms); timers.push(t); return t; }

  function setProgress(val) {
    const pct = Math.min(val, 100);
    FILL_EL.style.width = pct + '%';
    PCT_EL.textContent = Math.round(pct) + '%';
  }

  function addLine(cfg) {
    const el = document.createElement('div');
    el.className = 'boot-line';
    const tag = document.createElement('span');
    tag.className = 'boot-tag';
    tag.textContent = '[' + cfg.tag + ']';
    const ok = document.createElement('span');
    ok.className = 'boot-ok';
    ok.textContent = '[ OK ]';
    el.append(tag, document.createTextNode(cfg.text), ok);
    LINES_EL.appendChild(el);
    later(() => el.classList.add('show'), 20);
  }

  function finish(immediate) {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    markSeen();
    document.removeEventListener('keydown', skip);
    BOOT_EL.removeEventListener('click', skip);
    BOOT_EL.removeEventListener('touchstart', skip);
    const done = () => {
      BOOT_EL.style.display = 'none';
      document.body.dispatchEvent(new CustomEvent('boot-complete'));
    };
    if (immediate) { done(); return; }
    BOOT_EL.classList.add('fade');
    setTimeout(done, 450);
  }

  function skip() { finish(true); }

  function runBoot() {
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || seenBefore()) { finish(true); return; }

    document.addEventListener('keydown', skip);
    BOOT_EL.addEventListener('click', skip);
    BOOT_EL.addEventListener('touchstart', skip, { passive: true });

    const delay = 90; // ms per line
    LINES.forEach((cfg, i) => {
      later(() => { addLine(cfg); setProgress(((i + 1) / LINES.length) * 96); }, i * delay);
    });
    later(() => { setProgress(100); later(() => finish(false), 250); }, LINES.length * delay + 150);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runBoot);
  } else {
    runBoot();
  }
})();
