const CARDS = /*__CARDS_JSON__*/[];
/* Card lightbox (every page that shows Tarot cards) and the full-deck gallery filters.
   - A click on a Commons link that wraps a self-hosted card image, or on a.deck-card[data-slug],
     opens a native modal <dialog> instead of leaving the page. Modified clicks keep the default.
   - Without JS (or without <dialog> support) every link keeps working as before.
   - Widgets (tarot-pairs, tarot-triples, spread-grammar, court-relations, pathways) register no
     click handlers on their card anchors; this handler is delegated on document, runs last,
     and ignores events a widget has already handled (defaultPrevented). */
(function () {
  'use strict';
  const doc = document;
  const script = doc.currentScript || doc.querySelector('script[src*="tarot-view.js"]');
  let ROOT;
  try { ROOT = new URL('../../', script ? script.src : location.href).href; } catch (err) { return; }

  const SUITS = { wands: 'Жезлы', cups: 'Кубки', swords: 'Мечи', pentacles: 'Пентакли' };
  const GROUP = { major: '', wands: 'w', cups: 'c', swords: 's', pentacles: 'p' };
  const SLUG_RE = /^([a-z]+)-(\d\d)$/;
  const IMG_RE = /assets\/tarot\/([a-z]+-\d\d)-\d+\.webp/;
  const ID_RE = /^card-[wcsp]?\d{1,2}$/;
  const COMMONS = 'commons.wikimedia.org/wiki/File:';
  const SELECTOR = 'a[href*="commons.wikimedia.org/wiki/File:"], a.deck-card[data-slug]';
  /* Rendered width of the large picture (see tarot-view.css). On phones the value is kept a few
     per cent under the real width so that a 2x screen takes the 480 file instead of the 960 one. */
  const SIZES = '(max-width: 720px) and (max-height: 700px) min(26vh, calc(100vw - 62px)), ' +
    '(max-width: 720px) min(28.5vh, calc(100vw - 62px)), min(calc((100vh - 128px) / 1.72), 440px)';
  const bySlug = new Map();
  for (const c of Array.isArray(CARDS) ? CARDS : []) if (c && typeof c.slug === 'string') bySlug.set(c.slug, c);

  const plural = (n, one, few, many) => {
    const a = n % 10, b = n % 100;
    return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many;
  };
  const samePath = (a, b) => a.replace(/index\.html$/, '') === b.replace(/index\.html$/, '');

  /* ---------- card data ---------- */
  function cardFor(slug, img) {
    const known = bySlug.get(slug);
    if (known) return known;
    const m = SLUG_RE.exec(slug);
    if (!m || !Object.prototype.hasOwnProperty.call(GROUP, m[1])) return null;
    const rank = Number(m[2]);
    const alt = (img && img.getAttribute('alt')) || '';
    return { slug, suit: m[1], rank, id: 'card-' + GROUP[m[1]] + rank, file: '', name: alt.split(' — ')[0].trim() || slug };
  }
  function eyebrowOf(c) {
    if (c.suit === 'major') return 'Старший аркан · ' + c.rank;
    const suit = SUITS[c.suit] || '';
    return c.rank > 10 ? suit : suit + ' · ' + c.rank;
  }
  function entryOf(a) {
    const img = a.querySelector('img');
    let slug = null;
    if (a.classList.contains('deck-card') && a.hasAttribute('data-slug')) slug = a.getAttribute('data-slug');
    else if (a.href.indexOf(COMMONS) !== -1 && img && !img.hidden) {
      const m = IMG_RE.exec(img.getAttribute('src') || '') || IMG_RE.exec(img.currentSrc || '');
      slug = m && m[1];
    }
    if (!slug || !SLUG_RE.test(slug)) return null;
    const card = cardFor(slug, img);
    if (!card) return null;
    const rev = !!img && (img.classList.contains('is-reversed') || img.classList.contains('sg-reversed'));
    const commons = a.href.indexOf(COMMONS) !== -1 ? a.href
      : card.file ? 'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(card.file) : 'https://commons.wikimedia.org/';
    return { el: a, card, rev, commons };
  }
  function shown(a) {
    if (typeof a.checkVisibility === 'function') { if (!a.checkVisibility()) return false; }
    else if (!a.getClientRects().length) return false;
    for (let d = a.closest('details'); d; d = d.parentElement ? d.parentElement.closest('details') : null) {
      const summary = d.querySelector(':scope > summary');
      if (!d.open && !(summary && summary.contains(a))) return false;
    }
    return true;
  }
  /* Every visible trigger in DOM order. The same card (and orientation) shown twice — e.g. the
     compare block and the catalogue on the tarot page — is kept once: the clicked element, or
     otherwise its last occurrence. */
  function collect(active) {
    const all = [];
    for (const a of doc.querySelectorAll(SELECTOR)) {
      if (!(a instanceof HTMLAnchorElement) || a.closest('dialog') || (a !== active && !shown(a))) continue;
      const e = entryOf(a);
      if (e) all.push(e);
    }
    const key = e => e.card.slug + (e.rev ? ':r' : '');
    const activeEntry = all.find(e => e.el === active);
    const activeKey = activeEntry ? key(activeEntry) : '';
    const pick = new Map();
    for (const e of all) {
      const k = key(e);
      if (k !== activeKey || e.el === active) pick.set(k, e);
    }
    const keep = new Set(pick.values());
    return all.filter(e => keep.has(e));
  }

  /* ---------- lightbox ---------- */
  const canDialog = typeof HTMLDialogElement === 'function' && typeof HTMLDialogElement.prototype.showModal === 'function';
  let dialog = null, ui = null, list = [], index = 0, opener = null, isOpen = false, downOnBackdrop = false;

  const ICON_CLOSE = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  const ICON_PREV = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14.5 6 8.5 12l6 6"/></svg>';
  const ICON_NEXT = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m9.5 6 6 6-6 6"/></svg>';

  function build() {
    if (dialog) return;
    dialog = doc.createElement('dialog');
    dialog.className = 'tv-dialog';
    dialog.setAttribute('aria-labelledby', 'tv-title');
    dialog.innerHTML =
      '<button type="button" class="tv-close" aria-label="Закрыть" autofocus>' + ICON_CLOSE + '</button>' +
      '<div class="tv-inner">' +
        '<figure class="tv-figure"><span class="tv-frame" data-tv="frame"></span></figure>' +
        '<div class="tv-panel">' +
          '<p class="tv-eyebrow" data-tv="eyebrow"></p>' +
          '<h2 class="tv-title" id="tv-title" data-tv="title"></h2>' +
          '<p class="tv-orient" data-tv="orient" hidden>перевёрнутое положение</p>' +
          '<span class="tv-rule" aria-hidden="true"></span>' +
          '<p class="tv-more"><a data-tv="more" href="' + ROOT + 'course/tarot/">Разбор карты <span aria-hidden="true">→</span></a></p>' +
          '<div class="tv-nav" data-tv="nav">' +
            '<button type="button" class="tv-btn" data-tv="prev" aria-label="Предыдущая карта">' + ICON_PREV + '</button>' +
            '<span class="tv-pos" data-tv="pos"></span>' +
            '<button type="button" class="tv-btn" data-tv="next" aria-label="Следующая карта">' + ICON_NEXT + '</button>' +
          '</div>' +
          '<p class="tv-credit">Рисунок Памелы Колман Смит, 1909 · общественное достояние · ' +
            '<a data-tv="credit" href="https://commons.wikimedia.org/" target="_blank" rel="noopener">Wikimedia Commons <span aria-hidden="true">↗</span>' +
            '<span class="tv-sr"> (страница файла, откроется в новой вкладке)</span></a></p>' +
          '<p class="tv-sr" aria-live="polite" data-tv="live"></p>' +
        '</div>' +
      '</div>';
    ui = {};
    dialog.querySelectorAll('[data-tv]').forEach(n => { ui[n.getAttribute('data-tv')] = n; });
    doc.body.append(dialog);
    ensureCss();

    dialog.querySelector('.tv-close').addEventListener('click', () => hide(true));
    ui.prev.addEventListener('click', () => step(-1));
    ui.next.addEventListener('click', () => step(1));
    dialog.addEventListener('keydown', e => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.isComposing) return;
      if (e.key === 'Escape') { e.preventDefault(); hide(true); } // same as the native cancel, but cleans up at once
      else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    });
    // Touch: a horizontal swipe on the picture turns to the previous / next card.
    let sx = 0, sy = 0, sid = null;
    ui.frame.parentNode.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') { sid = e.pointerId; sx = e.clientX; sy = e.clientY; } });
    ui.frame.parentNode.addEventListener('pointerup', e => {
      if (e.pointerId !== sid) return;
      sid = null;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
    });
    ui.frame.parentNode.addEventListener('pointercancel', () => { sid = null; });
    // Close on a click on the backdrop only (a text selection dragged out of the panel must not close it).
    dialog.addEventListener('pointerdown', e => { downOnBackdrop = e.target === dialog; });
    dialog.addEventListener('click', e => {
      if (e.target === dialog && downOnBackdrop) hide(true);
      downOnBackdrop = false;
    });
    ui.more.addEventListener('click', e => {
      if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      const url = new URL(ui.more.href);
      if (!samePath(url.pathname, location.pathname)) return;
      e.preventDefault();
      goToAnchor(url.hash.slice(1));
    });
    // A 'close' queued by an earlier closing can arrive after a quick re-open: ignore it then.
    dialog.addEventListener('close', () => { if (!dialog.open) cleanup(true); });
  }

  function ensureCss() {
    // tarot-view.css is appended to course.css; pages without course.css get it on demand.
    try {
      if (getComputedStyle(dialog).getPropertyValue('--tv-css').trim() === '1') return;
      const link = doc.createElement('link');
      link.rel = 'stylesheet';
      link.href = ROOT + 'assets/course/tarot-view.css';
      doc.head.append(link);
    } catch (err) { /* purely cosmetic */ }
  }

  /* A picture of the same card that is already on screen (the trigger's own thumbnail, when it
     has loaded) stands in while the large file arrives; otherwise the small 240 file. */
  function placeholderOf(e) {
    const t = e.el.querySelector('img');
    if (t && t.complete && t.naturalWidth > 0) {
      const src = t.currentSrc || t.src;
      const m = IMG_RE.exec(src);
      if (m && m[1] === e.card.slug) return src;
    }
    return ROOT + 'assets/tarot/' + e.card.slug + '-240.webp';
  }
  const cssUrl = u => 'url("' + String(u).replace(/["\\\n\r]/g, ch => encodeURIComponent(ch)) + '")';

  function render(announce) {
    const e = list[index], c = e.card, base = ROOT + 'assets/tarot/' + c.slug;
    const frame = ui.frame, ph = placeholderOf(e);
    const img = doc.createElement('img');
    img.className = 'tv-img' + (e.rev ? ' is-flipped' : '');
    img.width = 240; img.height = 413;
    img.decoding = 'async';
    img.alt = c.name + (e.rev ? ' — перевёрнутое положение' : '');
    img.style.backgroundImage = cssUrl(ph);
    // Until the large file is in, the frame shows the placeholder, or a quiet star if even that is not there yet.
    let fellBack = false;
    const settle = () => { if (frame.firstChild === img) frame.classList.remove('is-loading'); };
    img.addEventListener('load', () => { img.style.backgroundImage = ''; settle(); });
    img.addEventListener('error', () => {
      if (!fellBack) { fellBack = true; img.removeAttribute('srcset'); img.src = ph; return; }
      settle();
    });
    img.sizes = SIZES;
    img.srcset = base + '-480.webp 480w, ' + base + '-960.webp 960w';
    img.src = base + '-480.webp';
    frame.classList.add('is-loading');
    frame.replaceChildren(img);
    if (img.complete && img.naturalWidth > 0) { img.style.backgroundImage = ''; settle(); }

    ui.eyebrow.textContent = eyebrowOf(c);
    ui.title.textContent = c.name;
    ui.orient.hidden = !e.rev;
    ui.more.href = ROOT + 'course/tarot/' + (ID_RE.test(c.id) ? '#' + c.id : '');
    ui.credit.href = e.commons;
    const many = list.length > 1;
    ui.nav.hidden = !many;
    ui.pos.textContent = (index + 1) + ' из ' + list.length;
    ui.live.textContent = announce ? c.name + (e.rev ? ', перевёрнутое положение' : '') + '. ' + (index + 1) + ' из ' + list.length : '';
    if (many) [index + 1, index - 1].forEach(i => preload(list[(i + list.length) % list.length]));
  }
  function preload(e) {
    if (!e) return;
    const base = ROOT + 'assets/tarot/' + e.card.slug, im = new Image();
    im.decoding = 'async';
    im.sizes = SIZES;
    im.srcset = base + '-480.webp 480w, ' + base + '-960.webp 960w';
  }
  function step(d) {
    if (!dialog || !dialog.open || list.length < 2) return;
    index = (index + d + list.length) % list.length;
    render(true);
  }

  function lock() {
    const root = doc.documentElement;
    const gutter = window.innerWidth - root.clientWidth > 0;
    root.classList.add('tv-locked');
    root.classList.toggle('tv-gutter', gutter);
  }
  function unlock() { doc.documentElement.classList.remove('tv-locked', 'tv-gutter'); }

  function open(a) {
    build();
    list = collect(a);
    index = list.findIndex(e => e.el === a);
    if (index < 0) { const e = entryOf(a); if (!e) return false; list = [e]; index = 0; }
    opener = a;
    render(false);
    lock();
    try { dialog.showModal(); } catch (err) { unlock(); return false; }
    isOpen = true;
    return true;
  }
  // Our own close paths clean up at once; Esc (native cancel) and any other close arrive via the
  // 'close' event (Chrome delivers it on the next animation frame). cleanup() runs once per opening.
  function hide(restore) {
    if (dialog.open) dialog.close();
    cleanup(restore);
  }
  function cleanup(restore) {
    if (!isOpen) return;
    isOpen = false;
    unlock();
    ui.frame.replaceChildren();
    ui.frame.classList.remove('is-loading');
    ui.live.textContent = '';
    const current = list[index];
    list = [];
    if (!restore) return;
    // Return focus to the card that was on screen last (it is where the reader "is"), else to the opener.
    const target = current && current.el.isConnected && shown(current.el) ? current.el : opener && opener.isConnected ? opener : null;
    if (target) try { target.focus(); } catch (err) { /* ignore */ }
  }
  // On the tarot page itself «Разбор карты» closes the dialog and scrolls to the card entry.
  function goToAnchor(id) {
    hide(false);
    const target = id && doc.getElementById(id);
    if (!target) return;
    if (location.hash !== '#' + id) location.hash = id; // extensions.js resets the catalogue filters on hashchange
    else { window.dispatchEvent(new HashChangeEvent('hashchange')); target.scrollIntoView({ block: 'start' }); }
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    try { target.focus({ preventScroll: true }); } catch (err) { /* ignore */ }
  }

  if (canDialog) {
    doc.documentElement.classList.add('tv-ready');
    doc.addEventListener('click', e => {
      if (e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      const t = e.target;
      if (!(t instanceof Element)) return;
      const a = t.closest(SELECTOR);
      if (!(a instanceof HTMLAnchorElement) || a.closest('dialog') || !entryOf(a)) return;
      if (dialog && dialog.open) return;
      e.preventDefault();
      if (!open(a)) window.open(a.href, a.target || '_self', 'noopener');
    });
  }

  /* ---------- full-deck page: filters ---------- */
  const grid = doc.getElementById('deck-grid');
  if (grid) {
    const FILTERS = ['all', 'major', 'wands', 'cups', 'swords', 'pentacles'];
    const bar = doc.querySelector('[data-deck-filter]');
    const status = doc.querySelector('[data-deck-count]');
    const sections = Array.from(grid.querySelectorAll('[data-deck-suit]'));
    const buttons = bar ? Array.from(bar.querySelectorAll('button[data-filter]')) : [];
    const fromHash = () => { const h = location.hash.slice(1); return FILTERS.indexOf(h) > 0 ? h : null; };
    const apply = (f, writeHash) => {
      if (FILTERS.indexOf(f) < 0) f = 'all';
      let n = 0;
      sections.forEach(s => {
        const on = f === 'all' || s.getAttribute('data-deck-suit') === f;
        s.hidden = !on;
        if (on) n += s.querySelectorAll('.deck-card').length;
      });
      buttons.forEach(b => b.setAttribute('aria-pressed', String(b.getAttribute('data-filter') === f)));
      const text = 'Показано: ' + n + ' ' + plural(n, 'карта', 'карты', 'карт');
      if (status && status.textContent !== text) status.textContent = text;
      if (writeHash) {
        try { history.replaceState(history.state, '', f === 'all' ? location.pathname + location.search : '#' + f); } catch (err) { /* file:// or sandbox */ }
      }
    };
    buttons.forEach(b => b.addEventListener('click', () => apply(b.getAttribute('data-filter'), true)));
    if (bar) bar.hidden = false;
    apply(fromHash() || 'all', false);
    window.addEventListener('hashchange', () => { const h = fromHash(); if (h) apply(h, false); });
  }
})();
