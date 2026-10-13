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
