/* ═══════════════════════════════════════════════════════
   Hero role typewriter
   ═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const roleEl = document.getElementById('role-text');
  if (!roleEl) return;

  const ROLES = [
    'Full Stack Developer',
    'Web & Android Developer',
    'Backend, Networks & Systems',
    'Cybersecurity & DFIR',
  ];

  // Respect reduced-motion: keep the static first role, no animation.
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    roleEl.textContent = ROLES[0];
    return;
  }

  let roleIdx = 0;
  let roleChar = ROLES[0].length;
  let deleting = true;   // the first role is already in the HTML: hold it, then start cycling

  function typeRole() {
    const current = ROLES[roleIdx % ROLES.length];
    if (!deleting) {
      roleChar++;
      roleEl.textContent = current.slice(0, roleChar);
      if (roleChar === current.length) {
        deleting = true;
        setTimeout(typeRole, 2200);
        return;
      }
    } else {
      roleChar--;
      roleEl.textContent = current.slice(0, roleChar);
      if (roleChar === 0) {
        deleting = false;
        roleIdx++;
      }
    }
    setTimeout(typeRole, deleting ? 38 : 56 + Math.random() * 28);
  }

  setTimeout(typeRole, 2600);
})();
