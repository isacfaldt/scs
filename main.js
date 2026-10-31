/* Sweden City Service · skiss v4 · main.js */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  let lenis = null;
  if (window.Lenis) { lenis = new Lenis({ duration: 1.1, smoothWheel: true }); window.lenis = lenis; }
  const header = $('.site-header');
  const headerH = () => (header ? header.offsetHeight : 0);
  const toast = $('.toast');
  let toastTimer = 0;
  function showToast(msg) { if (!toast) return; toast.textContent = msg; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 3200); }
  function scrollToEl(el, extra) { if (!el) return; const offset = -(headerH() + (extra || 16)); if (lenis) lenis.scrollTo(el, { offset, duration: 1.3 }); else el.scrollIntoView({ behavior: 'smooth' }); }

  /* ---------- language ---------- */
  const EN = window.SCS_EN || {};
  let lang = 'sv';
  const t = (sv, en) => (lang === 'en' ? en : sv);
  const tr = (sv) => (lang === 'en' && EN[sv] ? EN[sv] : sv);

  /* ---------- HERO slideshow ---------- */
  const hero = $('.hero');
  const slides = $$('.hero-media .slide');
  const dots = $$('.hero-dots button');
  const titleLines = $$('.hero-title .line > span');
  const heroSub = $('.hero-sub');
  const SLIDE_MS = 13000; /* klippen loopar sömlöst (makeLoop), så texten hinner läsas */
  const copySv = [
    { l0: 'Professionell städning', l1: 'för hem och företag', sub: 'Hemstädning, flyttstädning, storstädning, visningsstädning och fönsterputs i hela Stockholmsområdet. Med RUT-avdrag direkt på fakturan.' },
    { l0: 'Städning med fokus', l1: 'på kvalitet', sub: 'Varje vecka, varannan vecka eller när det passar dig. Samma städare varje gång, tydlig checklista och RUT-avdrag direkt på fakturan.' },
    { l0: 'Professionell kontorsstädning', l1: 'i Stockholm', sub: 'Kontorsstädning, lokalstädning och trappstädning med tydliga rutiner och utbildad personal. För företag, fastighetsägare och bostadsrättsföreningar.' },
    { l0: 'Nöjd kund-garanti', l1: 'på varje uppdrag', sub: 'Grundlig städning av hela bostaden inför överlämning, med tydlig checklista och fast pris. Blir något anmärkt vid besiktningen åtgärdar vi det utan kostnad.' },
    { l0: 'Trygg, säker och punktlig', l1: 'flytthjälp', sub: 'Flytthjälp, kontorsflyttning, packning och magasinering. En enda kontakt som tar hand om hela flytten.' }
  ];
  const copyEn = window.SCS_HERO_EN || copySv;
  let current = 0, slideStart = performance.now(), swapping = false;
  function heroCopy() { return lang === 'en' ? copyEn : copySv; }
  const heroTitle = $('.hero-title');
  /* krymp rubriken så att varje rad får plats på en rad (ingen radbrytning på desktop) */
  function fitTitle() {
    if (!heroTitle || innerWidth <= 640) { if (heroTitle) heroTitle.style.fontSize = ''; return; }
    heroTitle.style.fontSize = ''; titleLines.forEach(sp => sp.style.whiteSpace = '');
    const base = parseFloat(getComputedStyle(heroTitle).fontSize); let s = 1;
    titleLines.forEach(sp => { const w = sp.parentElement.clientWidth; const r = document.createRange(); r.selectNodeContents(sp); const need = r.getBoundingClientRect().width; if (need > w) s = Math.min(s, w / need); });
    /* så stor som möjligt utan radbrytning: krymp exakt så mycket som behövs (Isac 2026-10-25) */
    if (s < 1) heroTitle.style.fontSize = (base * s * 0.985) + 'px';
  }
  function applyCopy(i) { const c = heroCopy()[i]; if (!titleLines.length) return; titleLines[0].textContent = c.l0; titleLines[1].textContent = c.l1; if (heroSub) heroSub.textContent = c.sub; fitTitle(); }
  addEventListener('resize', fitTitle);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitTitle);
  function playSlide(i) {
    slides.forEach((s, k) => { const v = s.querySelector('video'); if (k === i) { s.style.transform = 'scale(1)'; if (s._loop) s._loop.restart(); else if (v) { try { v.currentTime = 0; } catch (e) {} const p = v.play(); if (p && p.catch) p.catch(() => {}); } s.classList.add('active'); } else { s.classList.remove('active'); setTimeout(() => { if (!s.classList.contains('active')) { if (s._loop) s._loop.stop(); else if (v) v.pause(); } }, 1800); } });
    dots.forEach((d, k) => d.classList.toggle('active', k === i));
  }
  function goTo(i, user) {
    if (!hero || (i === current && !user) || swapping) return;
    swapping = true; hero.classList.add('swapping');
    setTimeout(() => { current = i; applyCopy(i); playSlide(i); slideStart = performance.now(); hero.classList.remove('swapping'); swapping = false; }, 480);
  }
  dots.forEach(d => d.addEventListener('click', () => goTo(+d.dataset.slide, true)));
  if (hero) { applyCopy(0); playSlide(0); const arm = () => { hero.classList.add('ready'); slideStart = performance.now(); }; if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => setTimeout(arm, 100)); else setTimeout(arm, 300); }

  /* ---------- rAF loop ---------- */
  function frame(tm) {
    if (lenis) lenis.raf(tm);
    const sy = window.scrollY;
    if (header) header.classList.toggle('scrolled', sy > 10);
    if (hero && sy < innerHeight * 1.3) {
      const act = slides[current]; const actV = act && act.querySelector('video');
      /* varje bild visas så länge dess klipp räcker (minus tonings-marginal), max SLIDE_MS */
      /* data-loops="2": bilden visas tills klippet spelats två gånger, annars SLIDE_MS */
      const loops = act && +act.dataset.loops; const chainV = act && act.dataset.chain ? act.querySelectorAll('video') : null;
      const limit = (chainV && chainV[1] && chainV[0].duration && chainV[1].duration) ? (chainV[0].duration + chainV[1].duration) * 1000 - 400 : (loops && actV && actV.duration) ? Math.max(4000, actV.duration * loops * 1000 - 400) : SLIDE_MS;
      const el = tm - slideStart; const p = Math.min(1, el / limit);
      dots.forEach((d, k) => { const i = d.querySelector('i'); if (i) i.style.transform = `scaleX(${k === current ? p : (k < current ? 1 : 0)})`; });
      if (act) act.style.transform = `scale(${1 + 0.04 * (el / limit)})`;
      if (hero.classList.contains('ready') && el >= limit && !swapping && !document.hidden) goTo((current + 1) % slides.length);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ---------- reveal ---------- */
  const io = new IntersectionObserver((entries) => { for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  /* ---------- menus ---------- */
  $$('.nav .has-sub > button').forEach(btn => { const li = btn.parentElement; btn.addEventListener('click', (e) => { e.stopPropagation(); const open = li.classList.toggle('open'); btn.setAttribute('aria-expanded', open ? 'true' : 'false'); }); });
  document.addEventListener('click', () => $$('.nav .has-sub.open').forEach(li => { li.classList.remove('open'); li.querySelector('button').setAttribute('aria-expanded', 'false'); }));
  const burger = $('.burger'), mobileMenu = $('.mobile-menu');
  function closeMenu() { document.body.classList.remove('menu-open'); if (burger) burger.setAttribute('aria-expanded', 'false'); if (mobileMenu) mobileMenu.setAttribute('aria-hidden', 'true'); if (lenis) lenis.start(); }
  if (burger) burger.addEventListener('click', () => { const open = document.body.classList.toggle('menu-open'); burger.setAttribute('aria-expanded', open ? 'true' : 'false'); if (mobileMenu) mobileMenu.setAttribute('aria-hidden', open ? 'false' : 'true'); if (lenis) { open ? lenis.stop() : lenis.start(); } });

  /* ---------- service tabs ---------- */
  function showSvcCat(cat) { $$('.svc-tab').forEach(b => b.classList.toggle('active', b.dataset.cat === cat)); $$('.svc-row[data-cat]').forEach(r => r.classList.toggle('active', r.dataset.cat === cat)); }
  $$('.svc-tab').forEach(b => b.addEventListener('click', () => showSvcCat(b.dataset.cat)));

  /* ---------- booking wizard ---------- */
  const form = $('#bokaform');
  let preselect = () => {};
  if (form) {
    let step = 1;
    const panes = $$('.bk-pane', form), stepsEls = $$('.bk-steps li', form);
    const back = $('.bk-back', form), next = $('.bk-next', form), send = $('.bk-send', form);
    const liveSvc = $('#bk-live-svc'), liveMeta = $('#bk-live-meta');
    const catOf = { 'Hemstädning': 'privat', 'Flyttstädning': 'privat', 'Storstädning': 'privat', 'Visningsstädning': 'privat', 'Fönsterputs': 'privat', 'Kontorsstädning': 'foretag', 'Lokalstädning': 'foretag', 'Trappstädning': 'foretag', 'Bostadsrättsförening': 'foretag', 'Flytthjälp': 'flytt', 'Kontorsflyttning': 'flytt', 'Packning': 'flytt', 'Magasinering': 'flytt' };
    const selected = () => form.querySelector('input[name="tjanst"]:checked');
    const val = (id) => { const el = form.querySelector(id); return el ? el.value.trim() : ''; };
    const inModal = !!form.closest('.modal');
    const radioVal = (name) => { const r = form.querySelector(`input[name="${name}"]:checked`); return r ? r.value : ''; };
    function showCat(cat) {
      $$('.bk-cat', form).forEach(b => b.classList.toggle('active', b.dataset.cat === cat));
      $$('.bk-svc', form).forEach(l => l.classList.toggle('show', l.dataset.cat === cat));
      const c = selected(); if (!c || c.closest('.bk-svc').dataset.cat !== cat) { const first = form.querySelector(`.bk-svc[data-cat="${cat}"] input`); if (first) first.checked = true; }
      syncService();
    }
    function syncService() {
      const inp = selected(); if (!inp) return;
      const rut = inp.dataset.rut === '1', freq = inp.dataset.freq === '1';
      $('.bk-freq', form).style.display = freq ? '' : 'none';
      $('.bk-rut-row', form).style.display = rut ? '' : 'none';
      updateLive();
    }
    function fmtDate(d) { if (!d) return ''; try { return new Date(d + 'T12:00:00').toLocaleDateString(lang === 'en' ? 'en-GB' : 'sv-SE', { weekday: 'short', day: 'numeric', month: 'short' }); } catch (e) { return d; } }
    /* prisuppskattning (riktpriser, efter RUT där det gäller) */
    const fmt = (n) => Math.round(n / 10) * 10;
    const kr = (n) => fmt(n).toLocaleString('sv-SE') + ' kr';
    function estimate(svc, m2, freq) {
      if (svc === 'Hemstädning') { if (!m2) return null; const h = m2 <= 30 ? 3 : m2 <= 50 ? 4 : 4 + Math.ceil((m2 - 50) / 10) * 0.5; const p = h * 289; return { val: t('ca ', 'approx. ') + kr(p), note: t(`${h} timmar à 289 kr efter RUT, per tillfälle`, `${h} hours at 289 kr after RUT, per visit`) }; }
      /* flyttstädning: fasta priser upp till 50 m² (Farzin 2026-10-24), därefter 2 490 kr + 41 kr per m² över 50 */
      if (svc === 'Flyttstädning') {
        if (!m2) return null;
        if (m2 <= 30) return { val: '2 190 kr', note: t('fast pris upp till 30 m² efter RUT, allt material ingår', 'fixed price up to 30 m² after RUT, all supplies included') };
        if (m2 <= 50) return { val: '2 490 kr', note: t('fast pris 31 till 50 m² efter RUT, allt material ingår', 'fixed price 31 to 50 m² after RUT, all supplies included') };
        const p = 2490 + (m2 - 50) * 41;
        return { val: p.toLocaleString('sv-SE') + ' kr', note: t(`2 490 kr plus 41 kr per m² över 50 m², efter RUT, allt material ingår`, `2,490 kr plus 41 kr per m² above 50 m², after RUT, all supplies included`) };
      }
      /* storstädning: fasta priser upp till 50 m² (Farzin 2026-10-25), därefter 1 990 + 30 kr per m² över 50 */
      if (svc === 'Storstädning') {
        if (!m2) return null;
        if (m2 <= 30) return { val: '1 790 kr', note: t('fast pris upp till 30 m² efter RUT, allt material ingår', 'fixed price up to 30 m² after RUT, all supplies included') };
        if (m2 <= 50) return { val: '1 990 kr', note: t('fast pris 31 till 50 m² efter RUT, allt material ingår', 'fixed price 31 to 50 m² after RUT, all supplies included') };
        const p = 1990 + (m2 - 50) * 30;
        return { val: p.toLocaleString('sv-SE') + ' kr', note: t('1 990 kr plus 30 kr per m² över 50 m², efter RUT, allt material ingår', '1,990 kr plus 30 kr per m² above 50 m², after RUT, all supplies included') };
      }
      /* visningsstädning: samma fasta modell som storstädning, fönster invändigt ingår */
      if (svc === 'Visningsstädning') {
        if (!m2) return null;
        if (m2 <= 30) return { val: '1 790 kr', note: t('fast pris upp till 30 m² efter RUT, fönster invändigt ingår', 'fixed price up to 30 m² after RUT, windows inside included') };
        if (m2 <= 50) return { val: '1 990 kr', note: t('fast pris 31 till 50 m² efter RUT, fönster invändigt ingår', 'fixed price 31 to 50 m² after RUT, windows inside included') };
        const p = 1990 + (m2 - 50) * 30;
        return { val: p.toLocaleString('sv-SE') + ' kr', note: t('1 990 kr plus 30 kr per m² över 50 m², efter RUT, fönster invändigt ingår', '1,990 kr plus 30 kr per m² above 50 m², after RUT, windows inside included') };
      }
      if (svc === 'Kontorsstädning' || svc === 'Lokalstädning') return { val: t('från 395 kr/h', 'from 395 kr/h'), note: t('exklusive moms, fast pris efter kostnadsfritt platsbesök', 'excluding VAT, fixed price after a free site visit') };
      if (svc === 'Fönsterputs') return { val: t('från 995 kr', 'from 995 kr'), note: t('per tillfälle efter RUT, beror på antal fönster', 'per visit after RUT, depends on the number of windows') };
      if (svc === 'Flytthjälp') { if (!m2) return null; const h = Math.max(3, Math.round(m2 / 15)); return { val: t('ca ', 'approx. ') + kr(h * 599), note: t(`${h} timmar, två flyttare och bil, efter RUT`, `${h} hours, two movers and a van, after RUT`) }; }
      if (svc === 'Packning') { if (!m2) return null; const h = Math.max(2, Math.round(m2 / 25)); return { val: t('ca ', 'approx. ') + kr(h * 299), note: t(`${h} timmar à 299 kr per person efter RUT`, `${h} hours at 299 kr per person after RUT`) }; }
      if (svc === 'Magasinering') return { val: t('från 495 kr/mån', 'from 495 kr/month'), note: t('per kubikmeter, hämtning bokas som flytthjälp', 'per cubic metre, collection booked as moving help') };
      return { val: t('Offert', 'Quote'), note: t('fast pris efter kostnadsfritt platsbesök', 'fixed price after a free site visit') };
    }
    const priceBox = $('#bk-price'), priceVal = $('#bk-price-val'), priceNote = $('#bk-price-note');
    function updatePrice() {
      const inp = selected(); if (!inp || !priceBox) return;
      const est = estimate(inp.value, parseInt(val('#b-yta'), 10) || 0, radioVal('frekvens'));
      if (!est) { priceBox.hidden = true; return; }
      priceBox.hidden = false; priceVal.textContent = est.val; priceNote.textContent = est.note + '. ' + t('Riktpris, vi bekräftar.', 'Guide price, we confirm.');
      const b2b = catOf[inp.value] === 'foretag'; $$('.bk-perk-rut').forEach(el => el.hidden = b2b); $$('.bk-perk-b2b').forEach(el => el.hidden = !b2b);
      return est;
    }
    function updateLive() {
      const inp = selected(); if (!inp || !liveSvc) return;
      liveSvc.textContent = tr(inp.value);
      updatePrice();
      const bits = [];
      if (val('#b-yta')) bits.push(val('#b-yta') + ' m²');
      if (inp.dataset.freq === '1' && radioVal('frekvens')) bits.push(tr(radioVal('frekvens')));
      if (val('#b-datum')) bits.push(fmtDate(val('#b-datum')) + (radioVal('tid') ? ', ' + tr(radioVal('tid')).toLowerCase() : ''));
      if (val('#b-postnr')) bits.push(val('#b-postnr'));
      liveMeta.textContent = bits.length ? bits.join(' · ') : t('Välj tjänst och fortsätt.', 'Pick a service and continue.');
    }
    function buildSummary() {
      const inp = selected();
      const rows = [
        [t('Tjänst', 'Service'), tr(inp.value)],
        [t('Adress', 'Address'), [val('#b-adress'), val('#b-postnr')].filter(Boolean).join(', ') || t('Ej angivet', 'Not given')],
        [t('Storlek', 'Size'), val('#b-yta') ? val('#b-yta') + ' m²' : t('Ej angivet', 'Not given')],
        inp.dataset.freq === '1' ? [t('Hur ofta', 'How often'), tr(radioVal('frekvens'))] : null,
        [t('När', 'When'), (fmtDate(val('#b-datum')) || t('Snarast', 'As soon as possible')) + ', ' + tr(radioVal('tid')).toLowerCase()],
        [t('Kontakt', 'Contact'), [val('#f-namn'), val('#f-tel'), val('#f-epost')].filter(Boolean).join(' · ')],
        inp.dataset.rut === '1' ? [t('RUT-avdrag', 'RUT deduction'), form.querySelector('input[name="rut"]').checked ? t('Ja', 'Yes') : t('Nej', 'No')] : null,
        (function () { const e = updatePrice(); return e ? [t('Uppskattat pris', 'Estimated price'), e.val + ' (' + t('riktpris', 'guide price') + ')'] : null; })(),
        val('#b-msg') ? [t('Övrigt', 'Other'), val('#b-msg')] : null
      ].filter(Boolean);
      $('#bk-summary').innerHTML = rows.map(r => `<div><dt>${r[0]}</dt><dd>${String(r[1]).replace(/</g, '&lt;')}</dd></div>`).join('');
    }
    function goStep(n, noScroll) {
      step = n;
      panes.forEach(p => p.classList.toggle('active', +p.dataset.pane === n));
      stepsEls.forEach(s => { const k = +s.dataset.step; s.classList.toggle('active', k === n); s.classList.toggle('done', k < n); });
      const act = stepsEls.find(s => +s.dataset.step === n), row = act && act.parentElement;
      const slideSteps = () => { if (!row || row.scrollWidth <= row.clientWidth) return; const need = row.scrollLeft + act.getBoundingClientRect().right - row.getBoundingClientRect().right + 6; row.scrollLeft = Math.max(0, Math.min(need, row.scrollWidth - row.clientWidth)); };
      slideSteps(); requestAnimationFrame(() => requestAnimationFrame(slideSteps)); setTimeout(slideSteps, 500);
      back.hidden = n === 1; next.hidden = n === 4; send.hidden = n !== 4;
      if (n === 4) buildSummary();
      if (inModal) { const dlg = form.closest('.modal-dialog'); if (dlg) dlg.scrollTo({ top: 0, behavior: 'smooth' }); }
      else if (!noScroll) { const top = form.getBoundingClientRect().top + scrollY - headerH() - 16; if (Math.abs(scrollY - top) > 60 && lenis) lenis.scrollTo(top, { duration: 0.8 }); }
    }
    function validate(n) {
      if (n === 3 && (!val('#f-namn') || !val('#f-tel'))) { showToast(t('Fyll i namn och telefon så vi kan bekräfta tiden.', 'Please fill in your name and phone so we can confirm the time.')); (val('#f-namn') ? $('#f-tel') : $('#f-namn')).focus(); return false; }
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
      const lines = [...form.querySelectorAll('#bk-summary div')].map(d => d.querySelector('dt').textContent + ': ' + d.querySelector('dd').textContent);
      const href = `mailto:info@swedencityservice.se?subject=${encodeURIComponent(t('Bokning: ', 'Booking: ') + tr(inp.value))}&body=${encodeURIComponent(lines.join('\n'))}`;
      const th = form.querySelector('.th-text'); const name = (val('#f-namn') || '').trim().split(' ')[0]; const tel = (val('#f-tel') || '').trim();
      if (th) th.textContent = t(`${name ? name + ', din' : 'Din'} bokning av ${tr(inp.value).toLowerCase()} är mottagen. Vi hör av oss${tel ? ' på ' + tel : ''} inom kort och bekräftar tid och pris.`, `${name ? name + ', your' : 'Your'} booking for ${tr(inp.value).toLowerCase()} has been received. We will get back to you${tel ? ' on ' + tel : ''} shortly to confirm the time and price.`);
      form.classList.add('sent'); try { form.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
      setTimeout(() => { window.location.href = href; }, 400);
    });
    preselect = function (name, extra) {
      const cat = catOf[name]; if (cat) { showCat(cat); const inp = form.querySelector(`input[name="tjanst"][value="${name}"]`); if (inp) { inp.checked = true; syncService(); } }
      if (extra) { if (extra.postnr) form.querySelector('#b-postnr').value = extra.postnr; if (extra.tel) form.querySelector('#f-tel').value = extra.tel; if (extra.yta) form.querySelector('#b-yta').value = extra.yta; updateLive(); }
      goStep(extra && extra.step ? extra.step : 1, true);
    };
    showCat('privat'); goStep(1, true);
    window.__scsPreselect = preselect;
  }

  /* ---------- booking modal (undersidor) ---------- */
  const modal = $('#bokamodal');
  function openModal() { if (!modal) return; modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); document.body.classList.add('modal-open'); if (lenis) lenis.stop(); const dlg = $('.modal-dialog', modal); if (dlg) { dlg.setAttribute('data-lenis-prevent', ''); dlg.scrollTop = 0; } }
  function closeModal() { if (!modal) return; modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); document.body.classList.remove('modal-open'); if (lenis) lenis.start(); }
  if (modal) { $$('[data-close]', modal).forEach(b => b.addEventListener('click', closeModal)); document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); }); }
  function goBooking(extra) { if (modal) openModal(); else { const sec = $('#boka'); if (sec) scrollToEl(sec, 16); } }

  /* ---------- anchor links + prefill ---------- */
  $$('a[href^="#"], button[data-pre]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href'); const pre = a.dataset.pre; const cat = a.dataset.cat;
      const isBook = id === '#boka' || (!id && pre);
      if (isBook) { e.preventDefault(); closeMenu(); $$('.nav .has-sub.open').forEach(li => li.classList.remove('open')); if (pre) preselect(pre); goBooking(); return; }
      const target = id && id.length > 1 ? $(id) : null;
      if (!target) return;
      e.preventDefault(); closeMenu(); $$('.nav .has-sub.open').forEach(li => li.classList.remove('open'));
      if (cat && id === '#tjanster') showSvcCat(cat);
      scrollToEl(target, 16);
    });
  });
  /* hero quick form */
  const hf = $('#heroform');
  if (hf) hf.addEventListener('submit', (e) => { e.preventDefault(); const svc = $('#h-tjanst').value; preselect(svc, { postnr: $('#h-postnr').value.trim(), tel: $('#h-tel').value.trim(), step: 2 }); goBooking(); });
  /* footer mini form + quick forms on service pages */
  const ff = $('#footform');
  if (ff) ff.addEventListener('submit', (e) => { e.preventDefault(); preselect('Hemstädning', { postnr: $('#ff-postnr').value.trim(), yta: $('#ff-yta').value.trim(), step: 2 }); goBooking(); });
  $$('.quick-form[data-pre]').forEach(qf => qf.addEventListener('submit', (e) => { e.preventDefault(); const yta = qf.querySelector('[data-yta]'), pn = qf.querySelector('[data-postnr]'); preselect(qf.dataset.pre, { yta: yta ? yta.value.trim() : '', postnr: pn ? pn.value.trim() : '', step: 2 }); goBooking(); }));
  /* contact form: mailto in the sketch */
  const kf = $('#kontaktform');
  if (kf) kf.addEventListener('submit', (e) => {
    e.preventDefault();
    const namn = $('#k-namn').value.trim(); if (!namn) { showToast(t('Fyll i ditt namn.', 'Please fill in your name.')); $('#k-namn').focus(); return; }
    const body = [t('Namn', 'Name') + ': ' + namn, t('Telefon', 'Phone') + ': ' + $('#k-tel').value.trim(), t('E-post', 'Email') + ': ' + $('#k-epost').value.trim(), t('Ärende', 'Subject') + ': ' + $('#k-arende').value, '', $('#k-msg').value.trim()].join('\n');
    kf.classList.add('sent'); window.location.href = `mailto:info@swedencityservice.se?subject=${encodeURIComponent($('#k-arende').value)}&body=${encodeURIComponent(body)}`;
  });

  /* ---------- translation engine ---------- */
  const textNodes = [], attrNodes = [];
  (function collect() {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) { const p = n.parentNode; if (!p || ['SCRIPT', 'STYLE'].includes(p.tagName)) continue; if (p.closest && p.closest('.hero-title, .hero-sub, .toast, #bk-live-meta, #bk-summary')) continue; const key = n.nodeValue.replace(/\s+/g, ' ').trim(); if (key && EN[key]) textNodes.push({ node: n, sv: n.nodeValue, en: n.nodeValue.replace(key, EN[key]) }); }
    ['placeholder', 'aria-label', 'title', 'alt', 'label'].forEach(attr => { $$('[' + attr + ']').forEach(el => { const v = el.getAttribute(attr); if (v && EN[v]) attrNodes.push({ el, attr, sv: v, en: EN[v] }); }); });
  })();
  function setLang(next) {
    lang = next; const en = next === 'en';
    textNodes.forEach(x => { x.node.nodeValue = en ? x.en : x.sv; });
    attrNodes.forEach(a => a.el.setAttribute(a.attr, en ? a.en : a.sv));
    document.documentElement.lang = en ? 'en' : 'sv';
    document.title = en ? 'Sweden City Service · Cleaning and moving in Stockholm' : 'Sweden City Service · Städ och flytt i Stockholm';
    applyCopy(current);
    $$('.lang button').forEach(x => x.classList.toggle('active', x.dataset.lang === next));
    if (form) form.dispatchEvent(new Event('input', { bubbles: true }));
    try { localStorage.setItem('scsLang', next); } catch (e) {}
  }
  $$('.lang button').forEach(b => b.addEventListener('click', () => { if (b.dataset.lang !== lang) setLang(b.dataset.lang); }));
  try { if (localStorage.getItem('scsLang') === 'en') setLang('en'); } catch (e) {}

  document.addEventListener('visibilitychange', () => { if (!document.hidden) { slideStart = performance.now(); playSlide(current); } });
})();

/* ---------- seamless loop: mjuk överbländning när korta klipp börjar om (stories + hero) ---------- */
function makeLoop(box) {
  const FADE = 0.6;
  const a = box.querySelector('video'); if (!a) return null;
  a.removeAttribute('loop'); a.loop = false; a.preload = 'auto';
  /* kedja: finns redan en andra video i rutan (annat klipp) används den, annars klonas den första */
  let b = a.nextElementSibling && a.nextElementSibling.tagName === 'VIDEO' ? a.nextElementSibling : null;
  if (!b) { b = a.cloneNode(true); b.classList.add('is-out'); b.removeAttribute('autoplay'); b.setAttribute('aria-hidden', 'true'); b.preload = 'auto'; box.insertBefore(b, a.nextSibling); }
  b.removeAttribute('loop'); b.loop = false;
  try { b.load(); } catch (e) {}
  let cur = a, nxt = b, switching = false, running = false;
  const safePlay = v => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };
  function check() {
    if (!running) return;
    const v = cur;
    if (!switching && v.duration && v.currentTime >= v.duration - FADE && nxt.readyState >= 2) {
      switching = true;
      try { nxt.currentTime = 0; } catch (e) {}
      safePlay(nxt);
      nxt.classList.remove('is-out'); cur.classList.add('is-out');
      setTimeout(() => { const old = cur; cur = nxt; nxt = old; old.pause(); switching = false; }, FADE * 1000 + 50);
    }
  }
  function tick() { check(); requestAnimationFrame(tick); }
  /* timeupdate som reserv: rAF pausas i bakgrundsflikar, medieevent fortsätter */
  [a, b].forEach(v => v.addEventListener('timeupdate', check));
  [a, b].forEach(v => v.addEventListener('ended', () => { if (running && !switching && v === cur) { try { v.currentTime = 0; } catch (e) {} safePlay(v); } }));
  requestAnimationFrame(tick);
  const ctl = {
    start() { running = true; safePlay(cur); },
    restart() { running = true; switching = false; b.classList.add('is-out'); a.classList.remove('is-out'); b.pause(); cur = a; nxt = b; try { a.currentTime = 0; } catch (e) {} safePlay(a); },
    stop() { running = false; a.pause(); b.pause(); }
  };
  box._loop = ctl; return ctl;
}
document.querySelectorAll('.story').forEach(box => {
  const ctl = makeLoop(box); if (!ctl) return;
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) ctl.start(); else ctl.stop(); }), { threshold: 0.1 });
  io.observe(box);
});
document.querySelectorAll('.hero-media .slide').forEach(box => { const ctl = makeLoop(box); if (ctl && box.classList.contains('active')) ctl.start(); });
