// Copied from the front door (_sandbox/mts-fresh-start/ball.js), 8 Nov 2026: Mike wants the same ball on every page. Keep the two the same.
// The ball (see ball.css). Its words are the top bar's own name in the name's own type, laid exactly
// over it from the start, so as the bar scrolls away nothing appears or jumps: the name just stays.
// Its menu is copied from the top bar when the page loads, so the two can never disagree:
// Home, the bar's links, Sign in, back to the top, Start here.
(() => {
  const nav = document.querySelector('nav.nav[aria-label="Main"]');
  const brand = nav && nav.querySelector('.brand');
  if (!brand) return;
  const quiet = matchMedia('(prefers-reduced-motion: reduce)');
  const canHover = matchMedia('(hover: hover) and (pointer: fine)');
  const root = document.documentElement;

  const ball = document.createElement('div');
  ball.className = 'mts-ball';
  ball.inert = true;
  ball.innerHTML = '<button class="mts-ball-btn" type="button" aria-expanded="false" aria-controls="mts-ball-menu">'
    + '<span class="clip"><span class="word" aria-hidden="true">Music Tech Studio</span></span>'
    + '<svg class="mark" viewBox="0 0 40 40" aria-hidden="true" focusable="false"><path d="M4 28 C10 28 10 12 16 12 S22 28 28 28 S34 12 38 12" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/></svg></button>'
    + '<div class="mts-ball-menu" id="mts-ball-menu" role="group" aria-label="Menu"></div>';
  const btn = ball.querySelector('button'), menu = ball.querySelector('.mts-ball-menu'), word = ball.querySelector('.word');
  btn.setAttribute('aria-label', 'Music Tech Studio menu');

  const copy = (a, cls) => {
    const c = document.createElement('a');
    c.href = a.getAttribute('href');
    c.textContent = a.textContent.trim();
    if (a.target) { c.target = a.target; c.rel = 'noopener'; }
    if (a.hasAttribute('aria-current')) c.setAttribute('aria-current', 'page');
    if (a.hasAttribute('data-soon')) c.setAttribute('data-soon', a.getAttribute('data-soon'));
    if (cls) c.className = cls;
    menu.append(c);
    return c;
  };
  if (!brand.getAttribute('href').startsWith('#')) copy(brand).textContent = 'Home';
  nav.querySelectorAll('a.l').forEach((a) => copy(a));
  menu.append(document.createElement('hr'));
  const signIn = nav.querySelector('a.in');
  if (signIn) copy(signIn);
  const top = document.createElement('a');
  top.href = '#';
  top.textContent = 'Back to the top';
  menu.append(top);
  const go = nav.querySelector('a.go');
  if (go) copy(go, 'go');
  document.body.prepend(ball);

  // open and close: hover opens it on a computer, a click or tap keeps it open
  let pinned = false, openT, closeT;
  const open = (pin) => {
    clearTimeout(closeT);
    ball.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
    if (pin) pinned = true;
  };
  const close = () => {
    clearTimeout(openT);
    ball.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
    pinned = false;
  };
  ball.addEventListener('mouseenter', () => {
    if (!canHover.matches) return;
    clearTimeout(closeT);
    openT = setTimeout(() => open(false), 90);
  });
  ball.addEventListener('mouseleave', () => {
    if (!canHover.matches) return;
    clearTimeout(openT);
    if (!pinned) closeT = setTimeout(close, 320);
  });
  btn.addEventListener('click', () => (ball.classList.contains('is-open') && pinned ? close() : open(true)));
  menu.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    if (a === top) {
      e.preventDefault();
      scrollTo({ top: 0, behavior: quiet.matches ? 'auto' : 'smooth' });
      brand.focus({ preventScroll: true });
    }
    close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && ball.classList.contains('is-open')) { close(); btn.focus(); }
  });
  document.addEventListener('pointerdown', (e) => {
    if (ball.classList.contains('is-open') && !ball.contains(e.target)) close();
  });
  ball.addEventListener('focusout', (e) => {
    if (e.relatedTarget && !ball.contains(e.relatedTarget)) close();
  });

  // Measure: the words take the name's exact type; --dx/--dy carry them from their place in
  // the pill back to the name's place in the bar; navEnd is how far the bar reaches down.
  let navEnd = 1;
  const fit = () => {
    const cs = getComputedStyle(brand);
    for (const k of ['fontFamily', 'fontSize', 'fontWeight', 'letterSpacing', 'lineHeight']) word.style[k] = cs[k];
    word.style.top = (44 - word.offsetHeight) / 2 + 'px';
    ball.style.setProperty('--pill-w', Math.ceil(word.offsetWidth) + 32 + 'px');
    const was = word.style.transform;
    word.style.transform = 'none';
    const rest = word.getBoundingClientRect(), at = brand.getBoundingClientRect();
    word.style.transform = was;
    ball.style.setProperty('--dx', at.left - rest.left + 'px');
    ball.style.setProperty('--dy', at.top + scrollY - rest.top + 'px');
    navEnd = Math.max(1, nav.getBoundingClientRect().bottom + scrollY);
  };

  // Scrolling: in the first 32px the backing comes up and the words settle into it (--p, 0 to 1),
  // before anything below can slide under them (on a phone the bar's second row comes next);
  // the ball can be used once the bar has gone, and folds 80px further down or as soon as a bar sticks.
  const bars = [...document.querySelectorAll('header.ways-bar, header.bar, header.parts-bar')];
  let frame = 0;
  const update = () => {
    frame = 0;
    const y = Math.max(0, scrollY), p = Math.min(1, y / 32), rest = y >= navEnd;
    ball.style.setProperty('--p', p.toFixed(4));
    ball.classList.toggle('is-rest', rest);
    ball.inert = !rest;
    if (!rest) close();
    let stuck = false;
    bars.forEach((b) => {
      const s = rest && b.getBoundingClientRect().top <= 1;
      b.classList.toggle('ball-room', s);
      stuck ||= s;
    });
    const folded = ball.classList.contains('is-ball');
    ball.classList.toggle('is-ball', rest && (stuck || y > navEnd + (folded ? 24 : 80)));
  };
  const soon = () => { if (!frame) frame = requestAnimationFrame(update); };
  addEventListener('scroll', soon, { passive: true });
  addEventListener('resize', () => { fit(); soon(); });

  // first paint: opened part-way down, it starts folded without playing the fold
  root.classList.add('mts-ball-still');
  fit();
  brand.classList.add('mts-ball-held');
  update();
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('mts-ball-still')));
  document.fonts?.ready.then(() => { fit(); soon(); });
})();
