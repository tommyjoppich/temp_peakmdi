/* ═══════════════════════════════════════════════════════════════
   PEAK — site-wide search
   • Turns the "Search" link in the top navigation into a search panel that
     drops down directly under the nav bar (all desktop + tablet pages).
   • Searches products, product categories, every resource type, and the
     text of the Home / About / Contact pages.
   • Clicking a result goes straight to it; "Show results for …" opens
     search.html?q=…  (also powered by window.PeakSearch below).
   Include at the end of every page, after cart.js.
═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ───────────────────────── text helpers ───────────────────────── */
  function norm(s) {
    return String(s || '').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[’'`]/g, '')
      .replace(/[^a-z0-9]+/g, ' ').trim();
  }
  function stem(t) { return t.length > 3 && t.endsWith('s') ? t.slice(0, -1) : t; }
  function tokens(q) { return norm(q).split(' ').filter(Boolean).map(stem); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function reEsc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function highlight(text, q) {
    var raw = String(text == null ? '' : text);
    var parts = String(q || '').split(/[^A-Za-z0-9À-ɏ]+/).filter(function (p) { return p.length > 0; }).map(stem);
    if (!parts.length) return esc(raw);
    var re = new RegExp('(' + parts.map(reEsc).join('|') + ')', 'ig');
    var out = '', last = 0, m;
    while ((m = re.exec(raw))) {
      if (m[0].length === 0) { re.lastIndex++; continue; }
      out += esc(raw.slice(last, m.index)) + '<mark>' + esc(m[0]) + '</mark>';
      last = m.index + m[0].length;
    }
    return out + esc(raw.slice(last));
  }

  function snippet(text, q, len) {
    len = len || 150;
    var t = String(text || '').replace(/\s+/g, ' ').trim();
    if (t.length <= len) return t;
    var low = t.toLowerCase(), pos = -1;
    var parts = String(q || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).map(stem);
    for (var i = 0; i < parts.length; i++) { var p = low.indexOf(parts[i]); if (p > -1 && (pos === -1 || p < pos)) pos = p; }
    if (pos === -1) return t.slice(0, len).replace(/\s+\S*$/, '') + '…';
    var start = Math.max(0, pos - 45), end = Math.min(t.length, start + len);
    var s = t.slice(start, end);
    if (start > 0) s = '…' + s.replace(/^\S*\s/, '');
    if (end < t.length) s = s.replace(/\s\S*$/, '') + '…';
    return s;
  }

  /* ───────────────────────── data ───────────────────────── */
  var RES_LABEL = { video: 'Video', pdf: 'Catalog', article: 'Educational Material', ifu: 'Product IFU' };
  var RES_KEYWORDS = { video: 'video videos library', pdf: 'catalog catalogs catalogue pdf brochure', article: 'educational material materials article education', ifu: 'ifu ifus instructions for use product ifu' };
  var NAV_PAGES = [
    { title: 'Products', meta: 'All product categories', url: 'products.html', kw: 'products instruments shop catalog browse all' },
    { title: 'Catalogs', meta: 'Resources', url: 'resources.html?type=pdf', kw: 'catalogs catalogues brochures pdf' },
    { title: 'Educational Materials', meta: 'Resources', url: 'resources.html?type=article', kw: 'educational materials articles education learning' },
    { title: 'Product IFUs', meta: 'Resources', url: 'resources.html?type=ifu', kw: 'ifu ifus instructions for use' },
    { title: 'Video Library', meta: 'Resources', url: 'resources.html?type=video', kw: 'video videos library technique' },
    { title: 'About PEAK Medical', meta: 'Company', url: 'about.html', kw: 'about us story company peak medical' },
    { title: 'Contact Us', meta: 'Company', url: 'contact.html', kw: 'contact us phone email fax address help' },
    { title: 'Get Expert Help', meta: 'Talk to a product specialist', url: 'products.html?help=1', kw: 'expert help product specialist representative' }
  ];
  var CONTENT_PAGES = [
    { title: 'Home', url: 'index.html' },
    { title: 'About', url: 'about.html' },
    { title: 'Contact', url: 'contact.html' }
  ];

  var DATA = null, loading = null;

  function getJSON(url) {
    return fetch(url + '?v=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.json(); }).catch(function () { return []; });
  }

  function extractChunks(html, page) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('header,footer,nav,script,style,noscript,#mobileMenu,.mnav,.mega-menu,.footer__watermark,.modal-overlay,svg').forEach(function (e) { e.remove(); });
    var chunks = [], cur = { heading: '', parts: [] };
    function flush() {
      var text = cur.parts.join(' ').replace(/\s+/g, ' ').trim();
      if (text.length > 2 || cur.heading) chunks.push({ heading: cur.heading, text: text });
    }
    var seen = {};
    doc.body.querySelectorAll('h1,h2,h3,h4,p,li,div,span,a,strong,label,td,img[alt]').forEach(function (el) {
      var isHeading = /^H[1-4]$/.test(el.tagName);
      var t;
      if (el.tagName === 'IMG') t = el.getAttribute('alt') || '';
      else {
        // only leaf-ish elements so text isn't counted several times
        if (el.querySelector('h1,h2,h3,h4,p,li,div')) return;
        t = el.textContent;
      }
      t = t.replace(/\s+/g, ' ').trim();
      if (t.length < 2 || seen[t]) return;
      seen[t] = 1;
      if (isHeading) { flush(); cur = { heading: t, parts: [] }; }
      else cur.parts.push(t);
    });
    flush();
    return chunks.map(function (c) {
      var hay = norm(c.heading + ' ' + c.text);
      return { page: page.title, url: page.url, heading: c.heading, text: c.text, h: norm(c.heading), n: hay };
    });
  }

  function load() {
    if (loading) return loading;
    loading = Promise.all([
      getJSON('products.json'),
      getJSON('resources.json'),
      Promise.all(CONTENT_PAGES.map(function (pg) {
        return fetch(pg.url, { cache: 'no-cache' }).then(function (r) { return r.text(); }).then(function (h) { return extractChunks(h, pg); }).catch(function () { return []; });
      }))
    ]).then(function (res) {
      var products = res[0] || [], resources = res[1] || [], chunks = [].concat.apply([], res[2]);
      var prodRecs = products.map(function (p) {
        var desc = String(p.categoryThree || '').replace(/^[^:]*:\s*/, '');
        return {
          kind: 'product', id: p.id, title: p.title || '', sku: p.sku || '',
          meta: [p.category, p.subcategory, p.type].filter(Boolean).join(' › '),
          desc: desc, image: p.image || '', url: 'product-detail.html?id=' + encodeURIComponent(p.id),
          t: norm(p.title), s: norm(p.sku), sc: norm(p.sku).replace(/ /g, ''), c: norm([p.category, p.subcategory, p.type].join(' ')), d: norm(desc)
        };
      });
      var resRecs = resources.map(function (r) {
        return {
          kind: 'resource', id: r.id, rtype: r.type, title: r.title || '', label: RES_LABEL[r.type] || 'Resource',
          desc: r.description || '', thumb: /(^|\/)logo[^\/]*\.(jpe?g|png)$/i.test(r.thumbnail || '') ? '' : (r.thumbnail || ''), url: 'resource-detail.html?id=' + encodeURIComponent(r.id),
          t: norm(r.title), s: '', sc: '', c: norm((RES_LABEL[r.type] || '') + ' ' + (RES_KEYWORDS[r.type] || '')), d: norm(r.description)
        };
      });
      // product categories / sub-categories / types as "jump to" entries
      var catSeen = {}, catRecs = [];
      function addCat(title, meta, url) {
        var k = url; if (catSeen[k]) return; catSeen[k] = 1;
        catRecs.push({ kind: 'category', title: title, meta: meta, url: url, t: norm(title), s: '', sc: '', c: norm(meta), d: '' });
      }
      products.forEach(function (p) {
        if (!p.category) return;
        var cu = 'products.html?cat=' + encodeURIComponent(p.category);
        addCat(p.category, 'Product category', cu);
        if (p.subcategory) {
          var su = cu + '&sub=' + encodeURIComponent(p.subcategory);
          addCat(p.subcategory, p.category, su);
          if (p.type) addCat(p.type, p.category + ' › ' + p.subcategory, su + '&type=' + encodeURIComponent(p.type));
        }
      });
      var pageRecs = NAV_PAGES.map(function (n) {
        return { kind: 'page', title: n.title, meta: n.meta, url: n.url, t: norm(n.title), s: '', sc: '', c: norm(n.kw + ' ' + n.meta), d: '' };
      });
      var chunkRecs = chunks.map(function (c) {
        return { kind: 'page', title: c.heading || c.page, meta: c.page + (c.heading ? '' : ' page'), text: c.text, url: c.url, t: c.h, s: '', sc: '', c: norm(c.page), d: norm(c.text), isChunk: true };
      });
      DATA = { products: prodRecs, resources: resRecs, categories: catRecs, pages: pageRecs.concat(chunkRecs) };
      return DATA;
    });
    return loading;
  }

  /* ───────────────────────── scoring ───────────────────────── */
  function hasWordStart(hay, tok) { return hay.indexOf(' ' + tok) > -1 || hay.indexOf(tok) === 0; }

  function score(rec, toks, fullq) {
    var total = 0, t = ' ' + rec.t, c = ' ' + rec.c, d = ' ' + rec.d;
    for (var i = 0; i < toks.length; i++) {
      var tok = toks[i], best = 0;
      if (rec.s) {
        if (rec.s.indexOf(tok) === 0 || rec.sc.indexOf(tok) === 0) best = Math.max(best, 12);
        else if (rec.sc.indexOf(tok) > -1) best = Math.max(best, 7);
      }
      if (hasWordStart(t, tok) || t.indexOf(' ' + tok) > -1) best = Math.max(best, 10);
      else if (t.indexOf(tok) > -1) best = Math.max(best, 6);
      if (hasWordStart(c, tok)) best = Math.max(best, 5);
      else if (c.indexOf(tok) > -1) best = Math.max(best, 3);
      if (hasWordStart(d, tok)) best = Math.max(best, 2);
      else if (d.indexOf(tok) > -1) best = Math.max(best, 1);
      if (!best) return 0;               // every word must match somewhere
      total += best;
    }
    var nq = norm(fullq);
    if (nq && rec.t.indexOf(nq) > -1) total += 8;
    if (nq && rec.t.indexOf(nq) === 0) total += 4;
    if (nq && rec.d && rec.d.indexOf(nq) > -1) total += 2;
    return total - Math.min(rec.t.length, 120) * 0.01;
  }

  function rank(list, toks, q) {
    var out = [];
    for (var i = 0; i < list.length; i++) { var s = score(list[i], toks, q); if (s > 0) out.push({ r: list[i], s: s }); }
    out.sort(function (a, b) { return b.s - a.s; });
    return out.map(function (x) { return x.r; });
  }

  function run(q) {
    var toks = tokens(q);
    if (!DATA || !toks.length) return { products: [], resources: [], categories: [], pages: [], total: 0 };
    var products = rank(DATA.products, toks, q);
    var resources = rank(DATA.resources, toks, q);
    var categories = rank(DATA.categories, toks, q);
    // Pages: nav entries first, then at most 2 content passages per page
    var pageHits = rank(DATA.pages, toks, q), per = {}, pages = [];
    pageHits.forEach(function (p) {
      if (p.isChunk) { per[p.url] = (per[p.url] || 0) + 1; if (per[p.url] > 2) return; }
      pages.push(p);
    });
    return { products: products, resources: resources, categories: categories, pages: pages, total: products.length + resources.length + categories.length + pages.length };
  }

  /* ───────────────────────── rendering helpers (shared) ───────────────────────── */
  var CHEV = '<svg class="ss-chev" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><polyline points="9 6 15 12 9 18"/></svg>';
  var ICONS = {
    category: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h6l2 2h10v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/></svg>',
    page: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><polyline points="14 3 14 8 19 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="14" y2="17"/></svg>',
    video: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="1"/><polygon points="10 9 16 12 10 15"/></svg>',
    pdf: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><polyline points="14 3 14 8 19 8"/></svg>',
    article: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5z"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>',
    ifu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><polyline points="14 3 14 8 19 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="12" y1="10" x2="12" y2="16"/></svg>'
  };
  function productImg(rec) {
    var src = rec.image ? 'Product_Pictures/' + rec.image.replace('Product_Pictures/', '') : 'Coming_Soon-01.svg';
    return '<img src="' + esc(src) + '" alt="" loading="lazy" onerror="this.onerror=null;this.src=\'Coming_Soon-01.svg\';this.classList.add(\'is-placeholder\')" />';
  }
  function resThumb(rec) {
    if (rec.thumb) {
      var src = rec.thumb.indexOf('Resource_Thumbnails/') === 0 ? rec.thumb : 'Resource_Thumbnails/' + rec.thumb;
      return '<img src="' + esc(src) + '" alt="" loading="lazy" data-rt="' + esc(rec.rtype) + '" />';
    }
    return '<img src="Coming_Soon-Resource.svg" alt="" loading="lazy" class="is-placeholder" />';
  }
  // If a resource thumbnail can't load, fall back to the type icon.
  document.addEventListener('error', function (e) {
    var t = e.target;
    if (t && t.tagName === 'IMG' && t.hasAttribute('data-rt') && t.parentNode) {
      t.parentNode.innerHTML = '<img src="Coming_Soon-Resource.svg" alt="" class="is-placeholder" />';
    }
  }, true);

  // One result row (used in the dropdown and on the results page)
  function rowHTML(rec, q, big) {
    var media, title = highlight(rec.title, q), meta = '', body = '';
    if (rec.kind === 'product') {
      media = '<span class="ss-media ss-media--img">' + productImg(rec) + '</span>';
      meta = (rec.sku ? '<span class="ss-sku">' + highlight(rec.sku, q) + '</span>' : '') + (rec.meta ? '<span>' + esc(rec.meta) + '</span>' : '');
      if (big && rec.desc) body = '<div class="ss-snippet">' + highlight(snippet(rec.desc, q, 160), q) + '</div>';
    } else if (rec.kind === 'resource') {
      media = '<span class="ss-media ss-media--img">' + resThumb(rec) + '</span>';
      meta = '<span class="ss-tag">' + esc(rec.label) + '</span>';
      if (rec.desc) body = '<div class="ss-snippet">' + highlight(snippet(rec.desc, q, big ? 160 : 90), q) + '</div>';
    } else if (rec.kind === 'category') {
      media = '<span class="ss-media ss-media--icon">' + ICONS.category + '</span>';
      meta = '<span>' + esc(rec.meta) + '</span>';
    } else {
      media = '<span class="ss-media ss-media--icon">' + ICONS.page + '</span>';
      meta = '<span>' + esc(rec.meta) + '</span>';
      if (rec.text) body = '<div class="ss-snippet">' + highlight(snippet(rec.text, q, big ? 190 : 110), q) + '</div>';
    }
    return '<a class="ss-item" href="' + esc(rec.url) + '" role="option">' + media +
      '<span class="ss-text"><span class="ss-title">' + title + '</span>' +
      (meta ? '<span class="ss-meta">' + meta + '</span>' : '') + body + '</span>' + CHEV + '</a>';
  }

  /* ───────────────────────── shared CSS ───────────────────────── */
  var CSS = '' +
  '.ss-chev{flex:none;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;color:#9aa3bd}' +
  '.ss-item{display:flex;align-items:center;gap:14px;padding:10px 12px;border-radius:4px;color:#1F2E5C;text-decoration:none;font-family:Montserrat,Arial,sans-serif}' +
  '.ss-item:hover,.ss-item.is-active{background:#F2F4F8}.ss-item.is-active .ss-chev,.ss-item:hover .ss-chev{color:#1F2E5C}' +
  '.ss-media{flex:none;width:52px;height:52px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(0,0,0,.12);background:#fff;overflow:hidden}' +
  '.ss-media img{max-width:100%;max-height:100%;object-fit:contain;display:block}.ss-media img.is-placeholder{opacity:.7;max-width:62%;max-height:62%}' +
  '.ss-media--icon{background:#F2F4F8;border-color:transparent;color:#1F2E5C}' +
  '.ss-media svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}' +
  '.ss-text{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}' +
  '.ss-title{font-size:15px;font-weight:600;line-height:1.3;color:#1F2E5C}' +
  '.ss-meta{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:12px;font-weight:500;color:#667085;line-height:1.4}' +
  '.ss-meta .ss-sku{font-weight:600;color:#1F2E5C}' +
  '.ss-tag{color:#247294;font-weight:600}' +
  '.ss-snippet{font-size:13px;line-height:1.5;color:#555}' +
  '.ss-item mark{background:rgba(242,195,0,.38);color:inherit;padding:0 1px;border-radius:2px}' +
  /* dropdown panel */
  '.ss-backdrop{position:fixed;left:0;right:0;bottom:0;background:rgba(31,46,92,.38);z-index:198;opacity:0;pointer-events:none;transition:opacity .18s}' +
  '.ss-backdrop.open{opacity:1;pointer-events:auto}' +
  '.ss-panel{position:fixed;left:0;right:0;z-index:199;background:#fff;box-shadow:0 18px 40px rgba(0,0,0,.22);transform:translateY(-12px);opacity:0;pointer-events:none;transition:transform .18s,opacity .18s;font-family:Montserrat,Arial,sans-serif;border-top:1px solid rgba(0,0,0,.08)}' +
  '.ss-panel.open{transform:none;opacity:1;pointer-events:auto}' +
  '.ss-panel__inner{max-width:900px;margin:0 auto;padding:22px 24px 8px}' +
  '.ss-form{display:flex;align-items:center;gap:12px;border:1px solid #1F2E5C;background:#fff;padding:0 6px 0 16px;height:56px}' +
  '.ss-form:focus-within{box-shadow:0 0 0 3px rgba(31,46,92,.15)}' +
  '.ss-form svg.ss-mag{width:22px;height:22px;flex:none;fill:none;stroke:#1F2E5C;stroke-width:2;stroke-linecap:round}' +
  '.ss-form input{flex:1;min-width:0;border:none;outline:none;background:transparent;font:500 18px Montserrat,Arial,sans-serif;color:#1a1a1a;height:100%}' +
  '.ss-form input::placeholder{color:rgba(0,0,0,.45);font-weight:400}' +
  '.ss-clear,.ss-close{border:none;background:none;color:#1F2E5C;display:flex;align-items:center;justify-content:center;width:40px;height:40px;cursor:pointer;border-radius:50%}' +
  '.ss-clear:hover,.ss-close:hover{background:#F2F4F8}.ss-clear[hidden]{display:none}' +
  '.ss-close svg,.ss-clear svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}' +
  '.ss-results{max-height:calc(100vh - var(--ss-top,72px) - 150px);overflow-y:auto;padding:6px 0 8px;margin:0 -6px}' +
  '.ss-group{padding:6px 6px 2px}' +
  '.ss-group__head{display:flex;align-items:baseline;justify-content:space-between;padding:10px 12px 4px;font:600 12px Montserrat,Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#667085}' +
  '.ss-group__head a{font-size:12px;letter-spacing:0;text-transform:none;font-weight:600;color:#247294;text-decoration:none}.ss-group__head a:hover{text-decoration:underline}' +
  '.ss-showall{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:8px 6px 6px;padding:14px 16px;background:#1F2E5C;color:#fff;text-decoration:none;font:600 15px Montserrat,Arial,sans-serif}' +
  '.ss-showall:hover,.ss-showall.is-active{background:#2a3d78}.ss-showall .ss-chev{color:#fff}.ss-showall em{font-style:normal;color:#F2C300}' +
  '.ss-empty{padding:26px 12px 18px;color:#555;font:500 14px/1.6 Montserrat,Arial,sans-serif}.ss-empty strong{color:#1F2E5C}' +
  '.ss-empty a{color:#247294;font-weight:600}' +
  '.ss-chips{display:flex;flex-wrap:wrap;gap:8px;padding:6px 12px 10px}' +
  '.ss-chip{display:inline-block;padding:8px 14px;border:1px solid rgba(0,0,0,.25);border-radius:999px;color:#1F2E5C;text-decoration:none;font:500 13px Montserrat,Arial,sans-serif;background:#fff}' +
  '.ss-chip:hover,.ss-chip.is-active{background:#1F2E5C;color:#fff;border-color:#1F2E5C}' +
  '.ss-hint{display:flex;gap:16px;justify-content:flex-end;padding:8px 12px 12px;font:500 11px Montserrat,Arial,sans-serif;color:#98a2b3}' +
  '.ss-hint kbd{font:600 11px Montserrat,Arial,sans-serif;border:1px solid #d0d5dd;border-bottom-width:2px;border-radius:3px;padding:1px 5px;color:#667085;background:#fff}' +
  '.nav-search-link[aria-expanded="true"]{color:#F15A45}' +
  '@media (max-width:768px){.ss-panel,.ss-backdrop{display:none!important}}' +
  '@media (max-width:1023px){.ss-panel__inner{padding:16px 16px 4px}.ss-hint{display:none}.ss-form{height:50px}.ss-form input{font-size:16px}}';

  /* ───────────────────────── dropdown panel ───────────────────────── */
  var panel, backdrop, input, results, clearBtn, openBtns = [], activeIdx = -1, lastFocus = null, debounce;

  var MAG = '<svg class="ss-mag" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7.5"/><line x1="21" y1="21" x2="16.7" y2="16.7"/></svg>';
  var X = '<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  function buildPanel() {
    if (panel) return;
    var st = document.createElement('style'); st.id = 'ss-styles'; st.textContent = CSS; document.head.appendChild(st);
    backdrop = document.createElement('div'); backdrop.className = 'ss-backdrop';
    panel = document.createElement('div'); panel.className = 'ss-panel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Search the PEAK site');
    panel.innerHTML =
      '<div class="ss-panel__inner">' +
        '<form class="ss-form" role="search" autocomplete="off">' + MAG +
          '<input type="text" id="ss-input" placeholder="Search products, resources, and pages" aria-label="Search" aria-autocomplete="list" aria-controls="ss-results" autocomplete="off" />' +
          '<button type="button" class="ss-clear" hidden aria-label="Clear search">' + X + '</button>' +
          '<button type="button" class="ss-close" aria-label="Close search">' + X + '</button>' +
        '</form>' +
        '<div class="ss-results" id="ss-results" role="listbox"></div>' +
        '<div class="ss-hint"><span><kbd>↑</kbd> <kbd>↓</kbd> to move</span><span><kbd>Enter</kbd> to open</span><span><kbd>Esc</kbd> to close</span></div>' +
      '</div>';
    document.body.appendChild(backdrop); document.body.appendChild(panel);
    input = panel.querySelector('#ss-input'); results = panel.querySelector('#ss-results'); clearBtn = panel.querySelector('.ss-clear');

    backdrop.addEventListener('click', closePanel);
    panel.querySelector('.ss-close').addEventListener('click', closePanel);
    clearBtn.addEventListener('click', function () { input.value = ''; update(); input.focus(); });
    panel.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault();
      var act = results.querySelector('.is-active');
      if (act) { window.location.href = act.getAttribute('href'); return; }
      goResults();
    });
    input.addEventListener('input', function () { clearTimeout(debounce); debounce = setTimeout(update, 90); clearBtn.hidden = !input.value; });
    input.addEventListener('keydown', function (e) {
      var items = Array.prototype.slice.call(results.querySelectorAll('.ss-item,.ss-showall,.ss-chip'));
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (!items.length) return;
        e.preventDefault();
        activeIdx = e.key === 'ArrowDown' ? Math.min(activeIdx + 1, items.length - 1) : Math.max(activeIdx - 1, -1);
        markActive(items);
      }
    });
    results.addEventListener('mousemove', function (e) {
      var it = e.target.closest('.ss-item,.ss-showall'); if (!it) return;
      var items = Array.prototype.slice.call(results.querySelectorAll('.ss-item,.ss-showall,.ss-chip'));
      activeIdx = items.indexOf(it); markActive(items);
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.classList.contains('open')) closePanel(); });
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, { passive: true });
  }

  function markActive(items) {
    items.forEach(function (el, i) { el.classList.toggle('is-active', i === activeIdx); });
    if (activeIdx > -1 && items[activeIdx]) items[activeIdx].scrollIntoView({ block: 'nearest' });
  }

  function position() {
    if (!panel) return;
    var hdr = document.querySelector('header.navbar, .navbar');
    var top = hdr ? Math.max(0, Math.round(hdr.getBoundingClientRect().bottom)) : 72;
    panel.style.top = top + 'px'; backdrop.style.top = top + 'px';
    panel.style.setProperty('--ss-top', top + 'px');
  }

  function goResults() {
    var q = input.value.trim();
    window.location.href = 'search.html' + (q ? '?q=' + encodeURIComponent(q) : '');
  }

  function openPanel() {
    buildPanel(); position();
    lastFocus = document.activeElement;
    panel.classList.add('open'); backdrop.classList.add('open');
    openBtns.forEach(function (b) { b.setAttribute('aria-expanded', 'true'); });
    document.documentElement.style.overflow = 'hidden';
    load().then(update);
    update();
    setTimeout(function () { input.focus(); input.select(); }, 30);
  }

  function closePanel() {
    if (!panel) return;
    panel.classList.remove('open'); backdrop.classList.remove('open');
    openBtns.forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    document.documentElement.style.overflow = '';
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
  }

  function section(title, items, q, cap, moreHref) {
    if (!items.length) return '';
    return '<div class="ss-group"><div class="ss-group__head"><span>' + title + '</span>' +
      (items.length > cap ? '<a href="' + esc(moreHref) + '">See all ' + items.length + '</a>' : '') + '</div>' +
      items.slice(0, cap).map(function (r) { return rowHTML(r, q, false); }).join('') + '</div>';
  }

  function update() {
    if (!panel) return;
    var q = input.value; activeIdx = -1;
    clearBtn.hidden = !q;
    var trimmed = q.trim();
    if (!DATA) { results.innerHTML = '<div class="ss-empty">' + (trimmed ? 'Searching…' : '') + '</div>'; if (!trimmed) results.innerHTML = quickLinksHTML(); return; }
    if (!trimmed) { results.innerHTML = quickLinksHTML(); return; }
    var r = run(trimmed);
    var enc = encodeURIComponent(trimmed);
    if (!r.total) {
      results.innerHTML = '<div class="ss-empty">No results for <strong>“' + esc(trimmed) + '”</strong>.<br>Check the spelling, try fewer words, or <a href="products.html">browse all products</a>. ' +
        'Can’t find it? <a href="products.html?help=1">Ask a product specialist</a>.</div>' +
        '<a class="ss-showall" href="search.html?q=' + enc + '"><span>Show results for <em>“' + esc(trimmed) + '”</em></span>' + CHEV + '</a>';
      return;
    }
    var html = '';
    html += section('Products', r.products, trimmed, 5, 'search.html?q=' + enc + '&tab=products');
    html += section('Resources', r.resources, trimmed, 4, 'search.html?q=' + enc + '&tab=resources');
    html += section('Categories', r.categories, trimmed, 3, 'search.html?q=' + enc + '&tab=pages');
    html += section('Pages', r.pages, trimmed, 3, 'search.html?q=' + enc + '&tab=pages');
    html += '<a class="ss-showall" href="search.html?q=' + enc + '"><span>Show results for <em>“' + esc(trimmed) + '”</em> <span style="opacity:.7;font-weight:500">(' + r.total + ')</span></span>' + CHEV + '</a>';
    results.innerHTML = html;
  }

  function quickLinksHTML() {
    var cats = DATA ? DATA.categories.filter(function (c) { return c.meta === 'Product category'; }).map(function (c) { return c; }) : [];
    cats.sort(function (a, b) { if (a.title === 'Scissors') return -1; if (b.title === 'Scissors') return 1; return a.title.localeCompare(b.title); });
    return '<div class="ss-group"><div class="ss-group__head"><span>Quick links</span></div><div class="ss-chips">' +
      ['resources.html?type=pdf|Catalogs', 'resources.html?type=ifu|Product IFUs', 'resources.html?type=video|Video Library', 'resources.html?type=article|Educational Materials', 'contact.html|Contact Us'].map(function (s) {
        var p = s.split('|'); return '<a class="ss-chip" href="' + p[0] + '">' + p[1] + '</a>';
      }).join('') + '</div></div>' +
      (cats.length ? '<div class="ss-group"><div class="ss-group__head"><span>Product categories</span><a href="products.html">Browse all</a></div><div class="ss-chips">' +
        cats.slice(0, 12).map(function (c) { return '<a class="ss-chip" href="' + esc(c.url) + '">' + esc(c.title) + '</a>'; }).join('') + '</div></div>' : '');
  }

  /* ───────────────────────── wire up the nav button(s) ───────────────────────── */
  function wireNav() {
    var searchSVG = '<img class="nav-search-icon" src="Magnify.png" alt="" />';
    // Tablet nav doesn't have a Search button on every page — add one.
    document.querySelectorAll('.navbar__tablet').forEach(function (nav) {
      if (nav.querySelector('.nav-search-link')) return;
      var b = document.createElement('button'); b.className = 'nav-search-link'; b.setAttribute('aria-label', 'Search'); b.innerHTML = searchSVG + 'Search';
      nav.appendChild(b);
    });
    document.querySelectorAll('.nav-search-link').forEach(function (b) {
      b.removeAttribute('onclick');
      b.setAttribute('type', 'button'); b.setAttribute('aria-haspopup', 'dialog'); b.setAttribute('aria-expanded', 'false');
      b.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        if (panel && panel.classList.contains('open')) closePanel(); else openPanel();
      });
      openBtns.push(b);
    });
    // "/" opens search (when not typing in a field)
    document.addEventListener('keydown', function (e) {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      var t = e.target, tag = (t && t.tagName) || '';
      if (/INPUT|TEXTAREA|SELECT/.test(tag) || (t && t.isContentEditable)) return;
      if (window.innerWidth <= 768 || !openBtns.length) return;
      e.preventDefault(); openPanel();
    });
    // prefetch data when idle so the first search feels instant
    (window.requestIdleCallback || function (f) { setTimeout(f, 1200); })(function () { load(); });
  }

  /* ───────────────────────── public API (used by search.html) ───────────────────────── */
  window.PeakSearch = {
    load: load, run: run, rowHTML: rowHTML, highlight: highlight, tokens: tokens, esc: esc,
    css: CSS, inject: function () { if (!document.getElementById('ss-styles')) { var st = document.createElement('style'); st.id = 'ss-styles'; st.textContent = CSS; document.head.appendChild(st); } },
    open: openPanel, close: closePanel
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireNav); else wireNav();
})();