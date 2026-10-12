/* Sweden City Service · skiss v1 · main.js */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---------- Lenis ---------- */
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    window.lenis = lenis;
  }

  const header = $('.site-header');
  const headerH = () => (header ? header.offsetHeight : 0);
  const toast = $('.toast');
  let toastTimer = 0;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
  }

  /* ---------- HERO slideshow ---------- */
  const hero = $('.hero');
  const slides = $$('.hero-media .slide');
  const tabs = $$('.hero-tab');
  const titleLines = $$('.hero-title .line > span');
  const heroSub = $('.hero-sub');
  const SLIDE_MS = 7600;
  const copy = [
    { l0: 'Rent hem.', l1: '<em>Mer tid över.</em>', sub: 'Hemstädning, flyttstädning, storstädning, visningsstädning och fönsterputs i hela Stockholmsområdet. Med RUT-avdrag.' },
    { l0: 'Kontor som', l1: '<em>välkomnar.</em>', sub: 'Kontorsstädning, lokalstädning och trappstädning med tydliga rutiner och utbildad personal. För företag, fastighetsägare och bostadsrättsföreningar.' },
    { l0: 'Flytta utan', l1: '<em>tunga lyft.</em>', sub: 'Flytthjälp, kontorsflyttning, packning och magasinering. En enda kontakt som tar hand om hela flytten.' }
  ];
  let current = 0;
  let slideStart = performance.now();
  let swapping = false;

  function playSlide(i) {
    slides.forEach((s, k) => {
      const v = s.querySelector('video');
      if (k === i) {
        s.classList.add('active');
        if (v) { v.currentTime = v.currentTime || 0; const p = v.play(); if (p && p.catch) p.catch(() => {}); }
      } else {
        s.classList.remove('active');
        if (v) setTimeout(() => { if (!s.classList.contains('active')) v.pause(); }, 1500);
      }
    });
    tabs.forEach((t, k) => { t.classList.toggle('active', k === i); t.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
  }

  function goTo(i, user) {
    if (i === current && !user) return;
    if (swapping) return;
    swapping = true;
    hero.classList.add('swapping');
    setTimeout(() => {
      current = i;
      const c = copy[i];
      titleLines[0].textContent = c.l0;
      titleLines[1].innerHTML = c.l1;
      if (heroSub) heroSub.textContent = c.sub;
      playSlide(i);
      slideStart = performance.now();
      hero.classList.remove('swapping');
      swapping = false;
    }, 520);
  }
  tabs.forEach(t => t.addEventListener('click', () => goTo(+t.dataset.tab, true)));
  playSlide(0);

  // entrance after fonts are ready (so the letterforms don't jump)
  const arm = () => { hero.classList.add('ready'); slideStart = performance.now(); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => setTimeout(arm, 120)); else setTimeout(arm, 300);

  /* ---------- central rAF loop ---------- */
  const progressBar = $('.progress span');
  const band = $('[data-parallax]');
  let lastW = innerWidth;

  function frame(t) {
    if (lenis) lenis.raf(t);
    const sy = window.scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    if (progressBar) progressBar.style.transform = `scaleX(${max > 0 ? sy / max : 0})`;
    if (header) header.classList.toggle('scrolled', sy > 30 || document.body.classList.contains('menu-open'));

    // hero: slow drift on the active video + tab progress + auto-advance
    if (hero && sy < innerHeight * 1.3) {
      const elapsed = t - slideStart;
      const p = Math.min(1, elapsed / SLIDE_MS);
      const bar = tabs[current] && tabs[current].querySelector('.bar');
      if (bar) bar.style.transform = `scaleX(${p})`;
      tabs.forEach((tb, k) => { if (k !== current) tb.querySelector('.bar').style.transform = 'scaleX(0)'; });
      const act = slides[current];
      if (act) {
        const s = 1 + 0.045 * (elapsed / SLIDE_MS);
        act.style.transform = `scale(${s}) translateY(${sy * 0.12}px)`;
      }
      if (hero.classList.contains('ready') && elapsed >= SLIDE_MS && !swapping && !document.hidden) goTo((current + 1) % slides.length);
    }

    if (band) {
      const r = band.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight) {
        const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        band.style.transform = `translateY(${p * -6}%)`;
      }
    }
    if (innerWidth !== lastW) { lastW = innerWidth; }
    requestAnimationFrame(frame);
  }
  window.__scsFrame = frame;
  requestAnimationFrame(frame);

  /* ---------- reveal ---------- */
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
  $$('.reveal, .reveal-clip').forEach(el => io.observe(el));

  /* ---------- header mega menu ---------- */
  $$('.nav .has-sub > button').forEach(btn => {
    const li = btn.parentElement;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = li.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
  document.addEventListener('click', () => $$('.nav .has-sub.open').forEach(li => { li.classList.remove('open'); li.querySelector('button').setAttribute('aria-expanded', 'false'); }));

  /* ---------- mobile menu ---------- */
  const burger = $('.burger');
  const mobileMenu = $('.mobile-menu');
  function closeMenu() {
    document.body.classList.remove('menu-open');
    if (burger) burger.setAttribute('aria-expanded', 'false');
    if (mobileMenu) mobileMenu.setAttribute('aria-hidden', 'true');
    if (lenis) lenis.start();
  }
  if (burger) burger.addEventListener('click', () => {
    const open = document.body.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (mobileMenu) mobileMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (lenis) { open ? lenis.stop() : lenis.start(); }
  });

  /* ---------- anchor links + service highlight ---------- */
  let litTimer = 0;
  function highlightService(key) {
    const row = document.getElementById('svc-' + key);
    if (!row) return;
    $$('.svc-list li.lit').forEach(r => r.classList.remove('lit'));
    row.classList.add('lit');
    clearTimeout(litTimer);
    litTimer = setTimeout(() => row.classList.remove('lit'), 3500);
  }
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      $$('.nav .has-sub.open').forEach(li => li.classList.remove('open'));
      const svc = a.dataset.svc;
      const pre = a.dataset.pre;
      const page = a.dataset.page;
      let dest = target;
      if (svc) { const row = document.getElementById('svc-' + svc); if (row) dest = row; }
      const offset = svc ? -(headerH() + 120) : -(headerH() - 8);
      if (lenis) lenis.scrollTo(dest, { offset, duration: 1.4 });
      else dest.scrollIntoView({ behavior: 'smooth' });
      if (svc) setTimeout(() => highlightService(svc), 700);
      if (pre && window.__scsPreselect) window.__scsPreselect(pre);
      if (page) showToast(lang === 'en' ? (EN[page] || page) + ': its own page is built in the full build.' : page + ': egen undersida byggs i det färdiga bygget.');
    });
  });

  /* ---------- language switch: full SV/EN translation of the page ---------- */
  const EN = window.SCS_EN || {};
  const heroSv = copy.map(c => ({ ...c }));
  const heroEn = window.SCS_HERO_EN || heroSv;
  const textNodes = [];   // { node, sv }
  const attrNodes = [];   // { el, attr, sv }
  (function collect() {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) {
      const p = n.parentNode;
      if (!p || ['SCRIPT', 'STYLE'].includes(p.tagName)) continue;
      if (p.closest && p.closest('.hero-title, .hero-sub, .toast')) continue;
      const key = n.nodeValue.replace(/\s+/g, ' ').trim();
      if (key && EN[key]) textNodes.push({ node: n, sv: n.nodeValue, en: n.nodeValue.replace(key, EN[key]) });
    }
    ['placeholder', 'aria-label', 'title', 'alt', 'label'].forEach(attr => {
      $$('[' + attr + ']').forEach(el => {
        const v = el.getAttribute(attr);
        if (v && EN[v]) attrNodes.push({ el, attr, sv: v, en: EN[v] });
      });
    });
  })();
  let lang = 'sv';
  function setLang(next) {
    lang = next;
    const en = next === 'en';
    textNodes.forEach(t => { t.node.nodeValue = en ? t.en : t.sv; });
    attrNodes.forEach(a => a.el.setAttribute(a.attr, en ? a.en : a.sv));
    document.documentElement.lang = en ? 'en' : 'sv';
    document.title = en ? (EN['Sweden City Service · Städ och flytt i Stockholm'] || document.title) : 'Sweden City Service · Städ och flytt i Stockholm';
    const src = en ? heroEn : heroSv;
    src.forEach((c, i) => Object.assign(copy[i], c));
    const c = copy[current];
    titleLines[0].textContent = c.l0;
    titleLines[1].innerHTML = c.l1;
    if (heroSub) heroSub.textContent = c.sub;
    $$('.lang button').forEach(x => x.classList.toggle('active', x.dataset.lang === next));
    try { localStorage.setItem('scsLang', next); } catch (e) {}
  }
  const t = (sv, en) => (lang === 'en' ? en : sv);
  $$('.lang button').forEach(b => b.addEventListener('click', () => { if (b.dataset.lang !== lang) setLang(b.dataset.lang); }));
  try { if (localStorage.getItem('scsLang') === 'en') setLang('en'); } catch (e) {}

  /* ---------- booking wizard ---------- */
  const form = $('#bokaform');
  const tr = (sv) => (lang === 'en' && EN[sv] ? EN[sv] : sv);
  if (form) {
    let step = 1;
    const panes = $$('.bk-pane', form);
    const stepsEls = $$('.bk-steps li', form);
    const back = $('.bk-back', form), next = $('.bk-next', form), send = $('.bk-send', form);
    const liveSvc = $('#bk-live-svc'), liveMeta = $('#bk-live-meta');
    const catOf = { 'Hemstädning': 'privat', 'Flyttstädning': 'privat', 'Storstädning': 'privat', 'Visningsstädning': 'privat', 'Fönsterputs': 'privat', 'Kontorsstädning': 'foretag', 'Lokalstädning': 'foretag', 'Trappstädning': 'foretag', 'Bostadsrättsförening': 'foretag', 'Flytthjälp': 'flytt', 'Kontorsflyttning': 'flytt', 'Packning': 'flytt', 'Magasinering': 'flytt' };

    function showCat(cat) {
      $$('.bk-cat', form).forEach(b => b.classList.toggle('active', b.dataset.cat === cat));
      $$('.bk-svc', form).forEach(l => l.classList.toggle('show', l.dataset.cat === cat));
      const checked = form.querySelector('input[name="tjanst"]:checked');
      if (!checked || checked.closest('.bk-svc').dataset.cat !== cat) {
        const first = form.querySelector(`.bk-svc[data-cat="${cat}"] input`);
        if (first) first.checked = true;
      }
      syncService();
    }
    function selected() { return form.querySelector('input[name="tjanst"]:checked'); }
    function syncService() {
      const inp = selected(); if (!inp) return;
      const rut = inp.dataset.rut === '1', freq = inp.dataset.freq === '1';
      form.querySelector('.bk-freq').style.display = freq ? '' : 'none';
      form.querySelector('.bk-rut-row').style.display = rut ? '' : 'none';
      if (!freq) $('#b-freq').value = t('En gång', 'One time');
      updateLive();
    }
    function val(id) { const el = $(id); return el ? el.value.trim() : ''; }
    function tidVal() { const r = form.querySelector('input[name="tid"]:checked'); return r ? r.value : ''; }
    function fmtDate(d) { if (!d) return ''; try { return new Date(d + 'T12:00:00').toLocaleDateString(lang === 'en' ? 'en-GB' : 'sv-SE', { weekday: 'short', day: 'numeric', month: 'short' }); } catch (e) { return d; } }
    function updateLive() {
      const inp = selected(); if (!inp || !liveSvc) return;
      liveSvc.textContent = tr(inp.value);
      const bits = [];
      if (val('#b-yta')) bits.push(val('#b-yta') + ' m²');
      if (inp.dataset.freq === '1' && val('#b-freq')) bits.push(tr(val('#b-freq')));
      if (val('#b-datum')) bits.push(fmtDate(val('#b-datum')) + (tidVal() ? ', ' + tr(tidVal()).toLowerCase() : ''));
      if (val('#b-postnr')) bits.push(val('#b-postnr'));
      liveMeta.textContent = bits.length ? bits.join(' · ') : t('Välj tjänst och fortsätt.', 'Pick a service and continue.');
    }
    function buildSummary() {
      const inp = selected();
      const rows = [
        [t('Tjänst', 'Service'), tr(inp.value)],
        [t('Adress', 'Address'), [val('#b-adress'), val('#b-postnr')].filter(Boolean).join(', ') || t('Ej angivet', 'Not given')],
        [t('Storlek', 'Size'), val('#b-yta') ? val('#b-yta') + ' m²' : t('Ej angivet', 'Not given')],
        inp.dataset.freq === '1' ? [t('Hur ofta', 'How often'), tr(val('#b-freq'))] : null,
        [t('När', 'When'), (fmtDate(val('#b-datum')) || t('Snarast', 'As soon as possible')) + ', ' + tr(tidVal()).toLowerCase()],
        [t('Kontakt', 'Contact'), [val('#f-namn'), val('#f-tel'), val('#f-epost')].filter(Boolean).join(' · ')],
        inp.dataset.rut === '1' ? [t('RUT-avdrag', 'RUT deduction'), form.querySelector('input[name="rut"]').checked ? t('Ja', 'Yes') : t('Nej', 'No')] : null,
        val('#b-msg') ? [t('Övrigt', 'Other'), val('#b-msg')] : null
      ].filter(Boolean);
      $('#bk-summary').innerHTML = rows.map(r => `<div><dt>${r[0]}</dt><dd>${r[1].replace(/</g, '&lt;')}</dd></div>`).join('');
    }
    function goStep(n) {
      step = n;
      panes.forEach(p => p.classList.toggle('active', +p.dataset.pane === n));
      stepsEls.forEach(s => { const k = +s.dataset.step; s.classList.toggle('active', k === n); s.classList.toggle('done', k < n); });
      back.hidden = n === 1;
      next.hidden = n === 4;
      send.hidden = n !== 4;
      if (n === 4) buildSummary();
      const top = form.getBoundingClientRect().top + scrollY - headerH() - 16;
      if (scrollY > top + 40 && lenis) lenis.scrollTo(top, { duration: 0.8 });
    }
    function validate(n) {
      if (n === 3) {
        if (!val('#f-namn') || !val('#f-tel')) {
          showToast(t('Fyll i namn och telefon så vi kan bekräfta tiden.', 'Please fill in your name and phone so we can confirm the time.'));
          (val('#f-namn') ? $('#f-tel') : $('#f-namn')).focus();
          return false;
        }
      }
      return true;
    }
    $$('.bk-cat', form).forEach(b => b.addEventListener('click', () => showCat(b.dataset.cat)));
    form.addEventListener('change', e => { if (e.target.name === 'tjanst') syncService(); else updateLive(); });
    form.addEventListener('input', updateLive);
    next.addEventListener('click', () => { if (validate(step)) goStep(step + 1); });
    back.addEventListener('click', () => goStep(step - 1));
    stepsEls.forEach(s => s.addEventListener('click', () => { const k = +s.dataset.step; if (k < step) goStep(k); }));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validate(3)) { goStep(3); return; }
      const inp = selected();
      const lines = [...$('#bk-summary').querySelectorAll('div')].map(d => d.querySelector('dt').textContent + ': ' + d.querySelector('dd').textContent);
      const href = `mailto:info@swedencityservice.se?subject=${encodeURIComponent(t('Bokning: ', 'Booking: ') + tr(inp.value))}&body=${encodeURIComponent(lines.join('\n'))}`;
      form.classList.add('sent');
      window.location.href = href;
    });
    // external entry: "Boka nu" buttons and service rows preselect a service
    window.__scsPreselect = function (name) {
      const cat = catOf[name]; if (!cat) return;
      showCat(cat);
      const inp = form.querySelector(`input[name="tjanst"][value="${name}"]`);
      if (inp) { inp.checked = true; syncService(); }
      if (step !== 1) goStep(1);
    };
    showCat('privat');
    goStep(1);
    // clickable service rows
    $$('.svc-list li[data-pre]').forEach(li => li.addEventListener('click', () => {
      window.__scsPreselect(li.dataset.pre);
      const target = $('#boka');
      if (lenis) lenis.scrollTo(target, { offset: -(headerH() - 8), duration: 1.4 }); else target.scrollIntoView({ behavior: 'smooth' });
    }));
  }

  /* ---------- hidden tab: keep videos in sync when we come back ---------- */
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { slideStart = performance.now(); playSlide(current); } });
})();
