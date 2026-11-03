/* ═══════════════════════════════════════════════════════════════
   PEAK — shared mobile navigation (≤768px)
   Full-screen menu: Home · Products ▸ · Resources ▸ · About · Contact
   Included at the end of every page, after cart.js.
═══════════════════════════════════════════════════════════════ */
(function () {
  var CSS = `
  /* closed header: plain cart icon (no circle) + count badge */
  .navbar__mobile .cart-btn { border: none !important; width: auto !important; height: auto !important; padding: 4px !important; position: relative; background: none !important; }
  .navbar__mobile .cart-btn .cart-badge { top: -2px !important; right: -4px !important; }

  .mnav { display: none; }
  @media (max-width: 768px) {
    .mnav { position: fixed; inset: 0; z-index: 1000; background: #fff; flex-direction: column; overflow-y: auto; -webkit-overflow-scrolling: touch; font-family: 'Montserrat', Arial, sans-serif; }
    .mnav.open { display: flex; }
  }
  @media (min-width: 769px) { .mnav, .mnav.open { display: none !important; } }
  .mnav__header { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; flex: none; }
  .mnav__logo img { height: 48px; width: auto; display: block; }
  .mnav__actions { display: flex; align-items: center; gap: 12px; }
  .mnav__cart { position: relative; width: 42px; height: 42px; border-radius: 50%; border: 2px solid #1F2E5C; background: none; display: flex; align-items: center; justify-content: center; padding: 0; cursor: pointer; }
  .mnav__cart img { width: 24px; height: 24px; display: block; }
  .mnav__cart .cart-badge { top: -6px !important; right: -6px !important; }
  .mnav__close { background: none; border: none; color: #1F2E5C; display: flex; align-items: center; padding: 4px; cursor: pointer; }
  .mnav__nav { padding: 28px 20px 40px; display: flex; flex-direction: column; }
  .mnav__row { display: flex; align-items: center; justify-content: space-between; }
  .mnav__link { flex: 1; display: block; padding: 11px 0; font-size: 16px; font-weight: 500; line-height: 22px; color: #1F2E5C; text-decoration: none; }
  .mnav__chev { background: none; border: none; padding: 11px 6px 11px 16px; display: flex; align-items: center; color: #1F2E5C; cursor: pointer; }
  .mnav__chev svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; transition: transform 0.18s; }
  .mnav__chev[aria-expanded="true"] svg { transform: rotate(-90deg); }
  .mnav__item.is-open > .mnav__row > .mnav__link,
  .mnav__item.is-open > .mnav__row > .mnav__chev { color: #F15A45; }
  .mnav__sub { display: none; flex-direction: column; padding: 0 0 4px 12px; max-width: 86%; }
  .mnav__item.is-open > .mnav__sub { display: flex; }
  .mnav__sub .mnav__link { font-size: 14px; line-height: 20px; padding: 9px 0; }
  .mnav__sub .mnav__sub { padding-left: 14px; max-width: 100%; }
  .mnav__sub .mnav__sub .mnav__link { font-size: 13px; }
  `;

  var CHEV = '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="9 6 15 12 9 18"/></svg>';

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }

  function row(href, label, targetId, extraClass) {
    return '<div class="mnav__row"><a class="mnav__link" href="' + href + '">' + esc(label) + '</a>' +
      (targetId ? '<button class="mnav__chev" type="button" aria-expanded="false" aria-label="Show ' + esc(label) + ' menu" data-mnav-toggle="' + targetId + '">' + CHEV + '</button>' : '') + '</div>';
  }

  var RESOURCE_LINKS = [
    ['Catalogs', 'resources.html?type=pdf'],
    ['Educational Materials', 'resources.html?type=article'],
    ['Product IFUs', 'resources.html?type=ifu'],
    ['Video Library', 'resources.html?type=video']
  ];

  function shell() {
    var cartImg = '<img src="cart-icon.png?v=2" alt="" />';
    return '' +
      '<div class="mnav__header">' +
        '<a class="mnav__logo" href="index.html"><img src="peak-logo.png" alt="PEAK – Built for the Surgeon" /></a>' +
        '<div class="mnav__actions">' +
          '<button class="mnav__cart" type="button" aria-label="Quote cart" data-mnav-cart>' + cartImg + '<span class="cart-badge" style="display:none;position:absolute;background:#F15A45;color:#fff;border-radius:999px;font-size:10px;font-weight:800;min-width:18px;height:18px;align-items:center;justify-content:center;padding:0 4px;pointer-events:none;border:2px solid #fff;"></span></button>' +
          '<button class="mnav__close" type="button" aria-label="Close menu" data-mnav-close><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
        '</div>' +
      '</div>' +
      '<nav class="mnav__nav" aria-label="Mobile">' +
        '<div class="mnav__item"><div class="mnav__row"><a class="mnav__link" href="index.html">Home</a></div></div>' +
        '<div class="mnav__item" id="mnav-products-item">' + row('products.html', 'Products', 'mnav-products') + '<div class="mnav__sub" id="mnav-products"></div></div>' +
        '<div class="mnav__item" id="mnav-resources-item">' + row('resources.html', 'Resources', 'mnav-resources') +
          '<div class="mnav__sub" id="mnav-resources">' + RESOURCE_LINKS.map(function (r) { return '<div class="mnav__item"><div class="mnav__row"><a class="mnav__link" href="' + r[1] + '">' + r[0] + '</a></div></div>'; }).join('') + '</div></div>' +
        '<div class="mnav__item"><div class="mnav__row"><a class="mnav__link" href="about.html">About</a></div></div>' +
        '<div class="mnav__item"><div class="mnav__row"><a class="mnav__link" href="contact.html">Contact</a></div></div>' +
      '</nav>';
  }

  function alphaSort(arr, key) {
    return arr.slice().sort(function (a, b) { return String(key ? key(a) : a).localeCompare(String(key ? key(b) : b), undefined, { sensitivity: 'base', numeric: true }); });
  }

  function buildProducts(products) {
    var tree = {};
    products.forEach(function (p) {
      if (!p.category) return;
      tree[p.category] = tree[p.category] || {};
      if (p.subcategory) tree[p.category][p.subcategory] = true;
    });
    var cats = Object.keys(tree);
    cats = (typeof window.peakOrderCategories === 'function') ? window.peakOrderCategories(cats)
      : (cats.indexOf('Scissors') > -1 ? ['Scissors'].concat(alphaSort(cats.filter(function (c) { return c !== 'Scissors'; }))) : alphaSort(cats));
    var n = 0;
    return cats.map(function (cat) {
      var subs = Object.keys(tree[cat]);
      subs = (typeof window.peakSortSubs === 'function') ? window.peakSortSubs(subs, cat) : alphaSort(subs);
      var url = 'products.html?cat=' + encodeURIComponent(cat);
      if (!subs.length) return '<div class="mnav__item"><div class="mnav__row"><a class="mnav__link" href="' + url + '">' + esc(cat) + '</a></div></div>';
      var id = 'mnav-cat-' + (n++);
      return '<div class="mnav__item">' + row(url, cat, id) +
        '<div class="mnav__sub" id="' + id + '">' + subs.map(function (s) {
          return '<div class="mnav__item"><div class="mnav__row"><a class="mnav__link" href="' + url + '&sub=' + encodeURIComponent(s) + '">' + esc(s) + '</a></div></div>';
        }).join('') + '</div></div>';
    }).join('');
  }

  function init() {
    if (!document.getElementById('mnav-styles')) {
      var st = document.createElement('style'); st.id = 'mnav-styles'; st.textContent = CSS; document.head.appendChild(st);
    }
    var menu = document.getElementById('mobileMenu');
    if (!menu) { menu = document.createElement('div'); menu.id = 'mobileMenu'; document.body.appendChild(menu); }
    menu.className = 'mnav';
    menu.setAttribute('role', 'dialog');
    menu.setAttribute('aria-label', 'Menu');
    menu.innerHTML = shell();

    // Replace the old openMenu/closeMenu defined in each page
    window.openMenu = function () { menu.classList.add('open'); document.body.style.overflow = 'hidden'; };
    window.closeMenu = function () { menu.classList.remove('open'); document.body.style.overflow = ''; };
    window.toggleMobileSubmenu = function () {};

    function setOpen(item, open) {
      item.classList.toggle('is-open', open);
      var b = item.querySelector(':scope > .mnav__row > .mnav__chev');
      if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    menu.addEventListener('click', function (e) {
      var t = e.target;
      if (t.closest('[data-mnav-close]')) { window.closeMenu(); return; }
      if (t.closest('[data-mnav-cart]')) { window.closeMenu(); if (typeof cartOpenModal === 'function') cartOpenModal(); return; }
      var tog = t.closest('[data-mnav-toggle]');
      if (tog) {
        var item = tog.closest('.mnav__item');
        var willOpen = !item.classList.contains('is-open');
        // accordion: close siblings at the same level
        Array.prototype.forEach.call(item.parentNode.children, function (sib) {
          if (sib !== item && sib.classList.contains('mnav__item')) { setOpen(sib, false); }
        });
        setOpen(item, willOpen);
        return;
      }
      if (t.closest('a')) window.closeMenu();   // navigating within the same page should still dismiss the menu
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') window.closeMenu(); });
    window.addEventListener('resize', function () { if (window.innerWidth > 768) window.closeMenu(); });

    // Plain cart icon in the closed header gets the count badge too
    document.querySelectorAll('.navbar__mobile .cart-btn').forEach(function (btn) {
      if (btn.querySelector('.cart-badge')) return;
      var badge = document.createElement('span');
      badge.className = 'cart-badge';
      badge.style.cssText = 'display:none;position:absolute;background:#F15A45;color:#fff;border-radius:999px;font-size:10px;font-weight:800;min-width:18px;height:18px;align-items:center;justify-content:center;padding:0 4px;pointer-events:none;border:2px solid #fff;';
      btn.appendChild(badge);
    });
    if (typeof cartUpdateBadge === 'function') cartUpdateBadge();

    fetch('products.json?v=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (products) { document.getElementById('mnav-products').innerHTML = buildProducts(products); })
      .catch(function () {});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();


/* ════════════════════════════════════════════════════════════
   PEAK — mobile footer accordion (phones, ≤640px)
   Products / Resources / About / Support collapse into tappable rows.
   Desktop and tablet footers are untouched.
═════════════════════════════════════════════════════════════ */
(function () {
  var NAVY = '#1F2E5C';
  var CSS = '' +
  '.footer__all-products,.footer__contact-mobile{display:none}' +
  '@media (max-width:640px){' +
  'footer .footer__top{padding:0 8px 0}' +
  'footer .footer__columns{display:block}' +
  'footer .footer__col{display:flex;flex-direction:column;gap:0;max-width:none;border-bottom:1px solid rgba(255,255,255,.3)}' +
  'footer .footer__col:not(.is-open)>*:not(.footer__col-title){display:none!important}' +
  'footer .footer__col.is-open{padding-bottom:8px}' +
  'footer .footer__col .footer__col-title{order:-2;display:flex;align-items:center;justify-content:space-between;height:55px;margin:0 -3px;padding:0 15px 0 15px;font-size:15px;font-weight:600;letter-spacing:.03em;color:#fff;cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent;transition:none}' +
  'footer .footer__col .footer__col-title::after{content:"";flex:none;width:9px;height:9px;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(45deg);margin-top:-5px}' +
  'footer .footer__col.is-open .footer__col-title::after{transform:rotate(-135deg);margin-top:5px}' +
  'footer .footer__col .footer__col-title:active{background:#F7F7F7;color:' + NAVY + '}' +
  'footer .footer__col .footer__col-title:focus-visible{outline:2px solid #fff;outline-offset:-2px}' +
  'footer .footer__col a,footer .footer__col button{display:flex;align-items:center;width:100%;height:40px;padding:0 12px 0 24px;font-size:14px;font-weight:400;color:rgba(255,255,255,.82);text-align:left;text-decoration:none;opacity:1;cursor:pointer;-webkit-tap-highlight-color:transparent}' +
  'footer .footer__col a:hover,footer .footer__col button:hover{opacity:1;text-decoration:none}' +
  'footer .footer__col a:active,footer .footer__col button:active{background:#F7F7F7;color:' + NAVY + '}' +
  'footer .footer__col a.is-current{font-weight:700;color:#fff}' +
  'footer .footer__col a.is-current:active{color:' + NAVY + '}' +
  'footer .footer__col a[href$="type=video"]{order:-1}' +
  'footer .footer__col .footer__rule,footer .footer__col>span:not(.footer__col-title){display:none!important}' +
  'footer .footer__all-products{display:flex}' +
  'footer .footer__contact-mobile{display:block;padding:24px 12px 4px}' +
  'footer .footer__contact-mobile span{display:block;font-size:14px;line-height:1.5;color:#fff;margin-bottom:10px}' +
  'footer .footer__watermark{margin-top:22px}' +
  'footer .footer__bottom{flex-direction:column-reverse;align-items:flex-start;justify-content:flex-start;gap:10px;margin:0 20px;max-width:none;padding:18px 0 28px;font-size:12px}' +
  'footer .footer__policy-link{font-size:12px}' +
  '}';

  var mq = window.matchMedia('(max-width:640px)');

  function setupMarkup() {
    var cols = document.querySelector('footer .footer__columns');
    if (!cols || cols.getAttribute('data-mf')) return null;
    cols.setAttribute('data-mf', '1');
    // "All Products" row at the top of the Products list
    var holder = document.getElementById('footer-products-col');
    if (holder) {
      var all = document.createElement('a'); all.href = 'products.html'; all.className = 'footer__all-products'; all.textContent = 'All Products';
      holder.parentNode.insertBefore(all, holder);
    }
    // Contact details live below the accordion on phones
    var rule = cols.querySelector('.footer__rule');
    if (rule) {
      var box = document.createElement('div'); box.className = 'footer__contact-mobile';
      var n = rule.nextElementSibling;
      while (n && n.tagName === 'SPAN') { var s = document.createElement('span'); s.textContent = n.textContent; box.appendChild(s); n = n.nextElementSibling; }
      cols.parentNode.insertBefore(box, cols.nextSibling);
    }
    return cols;
  }

  function markCurrent() {
    var here = new URL(location.href), file = here.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('footer .footer__col a[href]').forEach(function (a) {
      var u = new URL(a.getAttribute('href'), location.href), f = u.pathname.split('/').pop();
      var cur = f === file;
      if (cur && f === 'products.html') cur = (u.searchParams.get('cat') || '') === (here.searchParams.get('cat') || '');
      if (cur && f === 'resources.html') cur = (u.searchParams.get('type') || '') === (here.searchParams.get('type') || '');
      a.classList.toggle('is-current', cur);
    });
  }

  function syncA11y() {
    document.querySelectorAll('footer .footer__col-title').forEach(function (t) {
      if (mq.matches) {
        t.setAttribute('role', 'button'); t.setAttribute('tabindex', '0');
        t.setAttribute('aria-expanded', t.parentNode.classList.contains('is-open') ? 'true' : 'false');
      } else { t.removeAttribute('role'); t.removeAttribute('tabindex'); t.removeAttribute('aria-expanded'); }
    });
  }

  function toggle(title) {
    var col = title.parentNode;
    col.classList.toggle('is-open');
    title.setAttribute('aria-expanded', col.classList.contains('is-open') ? 'true' : 'false');
    markCurrent();
  }

  function init() {
    var st = document.createElement('style'); st.id = 'mf-styles'; st.textContent = CSS; document.head.appendChild(st);
    if (!setupMarkup()) return;
    syncA11y(); markCurrent();
    var foot = document.querySelector('footer');
    foot.addEventListener('click', function (e) {
      var t = e.target.closest('.footer__col-title'); if (t && mq.matches) toggle(t);
    });
    foot.addEventListener('keydown', function (e) {
      var t = e.target.closest && e.target.closest('.footer__col-title');
      if (t && mq.matches && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggle(t); }
    });
    if (mq.addEventListener) mq.addEventListener('change', syncA11y);
    var holder = document.getElementById('footer-products-col');
    if (holder && window.MutationObserver) new MutationObserver(markCurrent).observe(holder, { childList: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();