/* ═══════════════════════════════════════════════════════════════
   cart.js — Shared quote cart for PEAK MDI
   Uses sessionStorage so the cart persists across pages for the
   duration of the user's browser session, then clears automatically.

   Flow:
     1. Cart view        — review items, adjust quantity, remove items
     2. Quote form view  — contact details + comments
     3. Confirmation view — "Quote Request Submitted"
   (An empty-cart state is shown in place of the cart view when there
   are no items.)
═══════════════════════════════════════════════════════════════ */

const CART_KEY = 'peak_quote_cart';
let cartModalView = 'cart'; // 'cart' | 'form' | 'confirm'

/* ── Cart data helpers ────────────────────────────────────────── */
function cartGet() {
  try { return JSON.parse(sessionStorage.getItem(CART_KEY)) || []; }
  catch(e) { return []; }
}

function cartSave(items) {
  sessionStorage.setItem(CART_KEY, JSON.stringify(items));
  cartUpdateBadge();
}

function cartAdd(product) {
  const items = cartGet();
  const existing = items.find(i => i.id === product.id);
  if (existing) {
    existing.qty += 1;
  } else {
    items.push({
      id: product.id,
      title: product.title,
      sku: product.sku,
      image: product.image || '',
      qty: 1
    });
  }
  cartSave(items);
}

function cartItemCount() {
  return cartGet().reduce((sum, i) => sum + i.qty, 0);
}

function cartSetQty(id, qty) {
  qty = parseInt(qty, 10);
  if (!qty || qty < 1) qty = 1;
  let items = cartGet();
  const item = items.find(i => i.id === id);
  if (item) item.qty = qty;
  cartSave(items);
  cartRenderCartView();
}

function cartRemove(id) {
  cartSave(cartGet().filter(i => i.id !== id));
  cartRenderCartView();
}

/* ── Badge — small count indicator on the Get A Quote button ──── */
function cartUpdateBadge() {
  const total = cartItemCount();
  document.querySelectorAll('.cart-badge').forEach(el => {
    el.textContent = total;
    el.style.display = total > 0 ? 'flex' : 'none';
  });
}

/* ── Styles (injected once) ──────────────────────────────────── */
function cartInjectStyles() {
  if (document.getElementById('quote-cart-styles')) return;
  const style = document.createElement('style');
  style.id = 'quote-cart-styles';
  style.textContent = `
    #quote-modal-overlay {
      display: none !important; position: fixed !important; inset: 0 !important; z-index: 10000 !important;
      background: rgba(0,0,0,0.45) !important; align-items: center !important; justify-content: center !important;
      padding: 20px !important; margin: 0 !important;
    }
    #quote-modal-overlay[style*="flex"] { display: flex !important; }
    #quote-modal-overlay #quote-modal {
      background: #fff !important; border-radius: 0 !important; width: 100% !important; max-width: 1120px !important;
      max-height: min(720px, calc(100vh - 40px)) !important; display: flex !important; flex-direction: column !important;
      box-shadow: 0 20px 60px rgba(0,0,0,0.25) !important; overflow: hidden !important;
      font-family: 'Montserrat', sans-serif !important; margin: 0 !important; padding: 0 !important;
    }
    #quote-modal-overlay #quote-modal.quote-modal--empty {
      max-height: min(336px, calc(100vh - 40px)) !important;
    }
    #quote-modal-overlay #quote-modal.quote-modal--form {
      max-height: min(840px, calc(100vh - 40px)) !important;
    }
    #quote-modal-overlay #quote-modal.quote-modal--confirm {
      max-height: min(336px, calc(100vh - 40px)) !important;
    }
    #quote-modal-overlay .qc-header {
      display: flex !important; align-items: center !important; justify-content: space-between !important;
      gap: 16px !important; padding: 28px 34px !important; border-bottom: 1.5px solid var(--border, #e2e2e2) !important;
      background: #fff !important; flex-shrink: 0 !important; margin: 0 !important;
    }
    #quote-modal-overlay .qc-header-title { font-size: 24px !important; font-weight: 800 !important; color: var(--peak-navy, #1a2f4a) !important; line-height: 1.3 !important; }
    #quote-modal-overlay .qc-header-title span { font-weight: 600 !important; color: var(--muted, #888) !important; font-size: 17px !important; }
    #quote-modal-overlay .qc-header-sub { font-size: 14px !important; font-weight: 500 !important; color: var(--muted, #888) !important; margin-top: 4px !important; }
    #quote-modal-overlay .qc-header-right {
      display: flex !important; align-items: center !important; gap: 6px !important; flex-shrink: 0 !important;
      background: none !important; border: none !important; cursor: pointer !important; padding: 8px 12px !important; border-radius: 6px !important;
      font-family: 'Montserrat', sans-serif !important; font-size: 14px !important; font-weight: 600 !important; color: #666 !important;
      transition: background 0.15s !important;
    }
    #quote-modal-overlay .qc-header-right:hover { background: #f0f0f0 !important; }
    #quote-modal-overlay .qc-close-x {
      background: none !important; border: none !important; cursor: pointer !important; padding: 6px !important; border-radius: 6px !important;
      display: flex !important; align-items: center !important; justify-content: center !important; color: #666 !important;
      transition: background 0.15s !important;
    }
    #quote-modal-overlay .qc-close-x:hover { background: #f0f0f0 !important; }
    #quote-modal-overlay .qc-body { flex: 1 !important; overflow-y: auto !important; padding: 30px 34px 34px !important; }
    #quote-modal-overlay .qc-body.qc-body--split {
      display: flex !important; flex-direction: column !important; overflow: hidden !important; padding: 0 !important;
    }
    #quote-modal-overlay .qc-cart-scroll { flex: 1 !important; min-height: 0 !important; overflow-y: auto !important; padding: 30px 34px 10px !important; }

    /* Cart table */
    #quote-modal-overlay .qc-table { width: 100% !important; border-collapse: collapse !important; }
    #quote-modal-overlay .qc-table thead th {
      text-align: left !important; padding: 14px 8px !important; font-size: 12px !important; font-weight: 700 !important;
      color: var(--muted, #999) !important; letter-spacing: 0.08em !important; text-transform: uppercase !important;
      background-color: #F5F5F5 !important;
    }
    #quote-modal-overlay .qc-cart-scroll thead th {
      position: sticky !important; top: 0 !important; z-index: 2 !important;
    }
    #quote-modal-overlay .qc-table thead th:first-child { border-radius: 0 !important; }
    #quote-modal-overlay .qc-table thead th:last-child { border-radius: 0 !important; }
    #quote-modal-overlay .qc-table thead th.qc-col-center {
      text-align: center !important; font-size: 14px !important; font-weight: 700 !important;
      color: #000 !important; letter-spacing: normal !important; text-transform: none !important;
    }
    #quote-modal-overlay .qc-table tbody td { padding: 32px 8px !important; border-bottom: 1px solid #f0f0f0 !important; vertical-align: middle !important; }
    #quote-modal-overlay .qc-product-cell { display: flex !important; align-items: center !important; gap: 16px !important; }
    #quote-modal-overlay .qc-product-thumb {
      width: 60px !important; height: 60px !important; flex-shrink: 0 !important; background: transparent !important; border-radius: 0 !important;
      overflow: hidden !important; display: flex !important; align-items: center !important; justify-content: center !important;
      border: none !important;
    }
    #quote-modal-overlay .qc-product-thumb img { width: 100% !important; height: 100% !important; object-fit: contain !important; }
    #quote-modal-overlay .qc-product-title { font-size: 16px !important; font-weight: 700 !important; color: var(--peak-navy, #1a2f4a) !important; line-height: 1.3 !important; }
    #quote-modal-overlay .qc-product-sku { font-size: 13px !important; font-weight: 500 !important; color: var(--muted, #888) !important; margin-top: 4px !important; }
    #quote-modal-overlay .qc-qty-input {
      width: 64px !important; height: 44px !important; text-align: center !important; border: 1.5px solid var(--border, #ddd) !important;
      border-radius: 6px !important; font-family: 'Montserrat', sans-serif !important; font-size: 15px !important; font-weight: 700 !important;
      color: var(--peak-navy, #1a2f4a) !important; -moz-appearance: textfield !important; background: #fff !important;
    }
    #quote-modal-overlay .qc-qty-input::-webkit-outer-spin-button,
    #quote-modal-overlay .qc-qty-input::-webkit-inner-spin-button { -webkit-appearance: none !important; margin: 0 !important; }
    #quote-modal-overlay .qc-qty-input:focus { outline: none !important; border-color: var(--blue, #2e6da4) !important; }
    #quote-modal-overlay .qc-remove-btn {
      background: none !important; border: none !important; cursor: pointer !important; font-family: 'Montserrat', sans-serif !important;
      font-size: 14px !important; font-weight: 600 !important; color: #999 !important; transition: color 0.15s !important;
    }
    #quote-modal-overlay .qc-remove-btn:hover { color: #D6392B !important; }

    #quote-modal-overlay .qc-cart-footer {
      display: flex !important; align-items: center !important; justify-content: space-between !important; gap: 20px !important;
      flex-wrap: wrap !important; background: none !important; border-radius: 0 !important; padding: 26px 8px 4px !important; margin-top: 4px !important;
    }
    #quote-modal-overlay .qc-body.qc-body--split .qc-cart-footer {
      flex-shrink: 0 !important; padding: 20px 34px 28px !important; margin-top: 0 !important;
      border-top: 1px solid #f0f0f0 !important;
    }
    #quote-modal-overlay .qc-cart-footer__title { font-size: 16px !important; font-weight: 700 !important; color: #000 !important; }
    #quote-modal-overlay .qc-cart-footer__desc { font-size: 14px !important; font-weight: 500 !important; color: #333 !important; margin-top: 3px !important; }

    #quote-modal-overlay .qc-btn-gold {
      display: inline-flex !important; align-items: center !important; justify-content: center !important; white-space: nowrap !important;
      height: 52px !important; padding: 0 30px !important; background-color: var(--gold, #F2C300) !important; color: var(--navy, #1a2f4a) !important;
      border: none !important; border-radius: 0 !important; font-family: 'Montserrat', sans-serif !important; font-size: 15px !important;
      font-weight: 700 !important; cursor: pointer !important; transition: background 0.15s !important;
    }
    #quote-modal-overlay .qc-btn-gold:hover { background-color: var(--gold-dark, #d9ac00) !important; }

    /* Empty state */
    #quote-modal-overlay .qc-empty { padding: 32px 4px 12px !important; }
    #quote-modal-overlay .qc-empty p:first-of-type { font-size: 22px !important; font-weight: 700 !important; color: #000 !important; margin-bottom: 10px !important; }
    #quote-modal-overlay .qc-empty p { font-size: 17px !important; font-weight: 500 !important; color: var(--muted, #888) !important; margin-bottom: 28px !important; line-height: 1.5 !important; }

    /* Quote form view */
    #quote-modal-overlay .qc-form-group { margin-bottom: 24px !important; }
    #quote-modal-overlay .qc-form-row { display: flex !important; gap: 20px !important; margin-bottom: 24px !important; }
    #quote-modal-overlay .qc-form-field { flex: 1 1 0 !important; min-width: 0 !important; }
    #quote-modal-overlay .qc-form-label { display: block !important; font-size: 15px !important; font-weight: 700 !important; color: #000 !important; margin-bottom: 8px !important; }
    #quote-modal-overlay .qc-form-input {
      width: 100% !important; height: 54px !important; padding: 0 16px !important; border: 1.5px solid var(--border, #ddd) !important;
      border-radius: 6px !important; font-family: 'Montserrat', sans-serif !important; font-size: 16px !important; font-weight: 400 !important;
      color: #000 !important; background-color: #fff !important; box-sizing: border-box !important;
    }
    #quote-modal-overlay .qc-form-input::placeholder { color: rgba(0,0,0,0.35) !important; font-weight: 400 !important; }
    #quote-modal-overlay .qc-form-input:focus { outline: none !important; border-color: var(--blue, #2e6da4) !important; }
    #quote-modal-overlay .qc-form-input.qc-input--error { border-color: #D6392B !important; }
    #quote-modal-overlay .qc-form-error { display: none !important; font-size: 13px !important; font-weight: 600 !important; color: #D6392B !important; margin-top: 7px !important; }
    #quote-modal-overlay .qc-form-error.visible { display: block !important; }
    #quote-modal-overlay .qc-form-textarea { height: auto !important; min-height: 130px !important; padding: 14px 16px !important; resize: vertical !important; line-height: 1.5 !important; }
    #quote-modal-overlay .qc-section-label {
      font-size: 16px !important; font-weight: 800 !important; color: #000 !important; text-transform: uppercase !important;
      letter-spacing: 0.04em !important; margin-bottom: 20px !important; padding-bottom: 12px !important; border-bottom: 1.5px solid var(--border, #e2e2e2) !important;
    }
    #quote-modal-overlay .qc-form-submit-row { display: flex !important; justify-content: flex-end !important; margin-top: 10px !important; }

    /* Confirmation view */
    #quote-modal-overlay .qc-confirm {
      position: relative !important; height: 100% !important; box-sizing: border-box !important; padding: 40px 8px 28px !important; overflow: hidden !important;
      display: flex !important; flex-direction: column !important; align-items: flex-start !important; justify-content: center !important;
    }
    #quote-modal-overlay .qc-confirm__mountain {
      position: absolute !important; right: 0 !important; bottom: 0 !important; width: 300px !important; max-width: 42% !important; height: auto !important;
      color: var(--peak-navy, #1a2f4a) !important; opacity: 0.08 !important; pointer-events: none !important; z-index: 0 !important;
    }
    #quote-modal-overlay .qc-confirm__mountain svg { display: block !important; width: 100% !important; height: auto !important; }
    #quote-modal-overlay .qc-confirm h2 { position: relative !important; font-size: 28px !important; font-weight: 800 !important; color: #000 !important; margin-bottom: 12px !important; }
    #quote-modal-overlay .qc-confirm p { position: relative !important; font-size: 16px !important; font-weight: 500 !important; color: #000 !important; margin-bottom: 28px !important; max-width: 460px !important; line-height: 1.6 !important; }
    #quote-modal-overlay .qc-confirm .qc-btn-gold {
      position: relative !important; height: 44px !important; padding: 0 22px !important; font-size: 14px !important;
    }

    @media (max-width: 640px) {
      #quote-modal-overlay .qc-header { padding: 18px 20px !important; flex-wrap: wrap !important; row-gap: 10px !important; }
      #quote-modal-overlay .qc-header-title { font-size: 19px !important; }
      #quote-modal-overlay button.qc-header-right { font-size: 12px !important; padding: 5px 8px !important; white-space: nowrap !important; }
      #quote-modal-overlay .qc-body { padding: 20px !important; }
      #quote-modal-overlay .qc-cart-scroll { padding: 20px 20px 10px !important; }
      #quote-modal-overlay .qc-body.qc-body--split .qc-cart-footer { padding: 16px 20px 20px !important; }
      #quote-modal-overlay .qc-form-row { flex-direction: column !important; gap: 20px !important; margin-bottom: 0 !important; }
      #quote-modal-overlay .qc-form-row .qc-form-field { margin-bottom: 24px !important; }
      #quote-modal-overlay .qc-cart-footer { flex-direction: column !important; align-items: stretch !important; }
      #quote-modal-overlay .qc-cart-footer .qc-btn-gold { width: 100% !important; }
      #quote-modal-overlay .qc-table thead th.qc-col-sku { display: none !important; }
      #quote-modal-overlay .qc-product-sku { display: block !important; }
      #quote-modal-overlay .qc-product-cell { gap: 10px !important; }
      #quote-modal-overlay .qc-product-title { font-size: 14px !important; }
    }
  `;
  document.head.appendChild(style);
}

/* ── Modal shell ──────────────────────────────────────────────── */
function cartInjectModal() {
  if (document.getElementById('quote-modal-overlay')) return; // already injected
  cartInjectStyles();

  const overlay = document.createElement('div');
  overlay.id = 'quote-modal-overlay';
  overlay.innerHTML = `
    <div id="quote-modal">
      <div class="qc-header">
        <div>
          <div class="qc-header-title" id="qc-header-title">Your Quote Cart</div>
          <div class="qc-header-sub" id="qc-header-sub" style="display:none;"></div>
        </div>
        <div id="qc-header-right"></div>
      </div>
      <div class="qc-body" id="qc-body"></div>
    </div>
  `;
  overlay.addEventListener('click', e => { if (e.target === overlay) cartCloseModal(); });
  document.body.appendChild(overlay);
}

function cartCloseModal() {
  const overlay = document.getElementById('quote-modal-overlay');
  if (overlay) overlay.style.display = 'none';
  document.body.style.overflow = '';
}

function cartOpenModal() {
  const overlay = document.getElementById('quote-modal-overlay');
  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  cartShowView('cart');
}

/* ── View switching ──────────────────────────────────────────── */
function cartShowView(view) {
  cartModalView = view;
  const headerTitle = document.getElementById('qc-header-title');
  const headerSub   = document.getElementById('qc-header-sub');
  const headerRight = document.getElementById('qc-header-right');

  const xIcon = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>`;

  headerSub.style.display = 'none';

  if (view === 'cart') {
    document.getElementById('quote-modal')?.classList.remove('quote-modal--form');
    document.getElementById('quote-modal')?.classList.remove('quote-modal--confirm');
    const count = cartItemCount();
    headerTitle.innerHTML = count > 0 ? `Your Quote Cart <span>(${count} item${count === 1 ? '' : 's'})</span>` : 'Your Quote Cart';
    headerRight.innerHTML = count > 0
      ? `<button class="qc-header-right" onclick="cartCloseModal()">Continue Browsing Products ${xIcon}</button>`
      : `<button class="qc-close-x" onclick="cartCloseModal()" aria-label="Close">${xIcon}</button>`;
    cartRenderCartView();
  } else if (view === 'form') {
    document.getElementById('quote-modal')?.classList.remove('quote-modal--empty');
    document.getElementById('quote-modal')?.classList.remove('quote-modal--confirm');
    document.getElementById('quote-modal')?.classList.add('quote-modal--form');
    document.getElementById('qc-body')?.classList.remove('qc-body--split');
    const count = cartItemCount();
    headerTitle.textContent = 'Request a Quote';
    headerSub.textContent = `${count} item${count === 1 ? '' : 's'} selected`;
    headerSub.style.display = 'block';
    headerRight.innerHTML = `<button class="qc-header-right" onclick="cartShowView('cart')">Back to Quote Cart ${xIcon}</button>`;
    cartRenderFormView();
  } else if (view === 'confirm') {
    document.getElementById('quote-modal')?.classList.remove('quote-modal--empty');
    document.getElementById('quote-modal')?.classList.remove('quote-modal--form');
    document.getElementById('quote-modal')?.classList.add('quote-modal--confirm');
    document.getElementById('qc-body')?.classList.remove('qc-body--split');
    headerTitle.textContent = 'Quote Request Submitted';
    headerRight.innerHTML = `<button class="qc-close-x" onclick="cartCloseModal()" aria-label="Close">${xIcon}</button>`;
    cartRenderConfirmView();
  }
}

/* ── View: Cart ──────────────────────────────────────────────── */
function cartRenderCartView() {
  const body = document.getElementById('qc-body');
  if (!body || cartModalView !== 'cart') return;
  const items = cartGet();
  const modalEl = document.getElementById('quote-modal');

  if (!items.length) {
    if (modalEl) modalEl.classList.add('quote-modal--empty');
    body.classList.remove('qc-body--split');
    body.innerHTML = `
      <div class="qc-empty">
        <p>Your quote cart is empty.</p>
        <p>Browse our products and add items to your cart to get started.</p>
        <button class="qc-btn-gold" onclick="cartCloseModal()">Continue Browsing Products</button>
      </div>
    `;
    // Header shows no item count / no "continue browsing" text when empty
    document.getElementById('qc-header-title').textContent = 'Your Quote Cart';
    document.getElementById('qc-header-right').innerHTML = `
      <button class="qc-close-x" onclick="cartCloseModal()" aria-label="Close">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>`;
    return;
  }

  if (modalEl) modalEl.classList.remove('quote-modal--empty');
  body.classList.add('qc-body--split');
  body.innerHTML = `
    <div class="qc-cart-scroll">
      <table class="qc-table">
        <thead>
          <tr>
            <th>Product</th>
            <th class="qc-col-center" style="width:100px;">Quantity</th>
            <th class="qc-col-center" style="width:90px;">Remove</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => {
            const imgSrc = item.image ? 'Product_Pictures/' + item.image.replace('Product_Pictures/', '') : '';
            return `
            <tr>
              <td>
                <div class="qc-product-cell">
                  <div class="qc-product-thumb">
                    ${imgSrc
                      ? `<img src="${imgSrc}" alt="${item.title}" />`
                      : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`
                    }
                  </div>
                  <div>
                    <div class="qc-product-title">${item.title}</div>
                    <div class="qc-product-sku">${item.sku || ''}</div>
                  </div>
                </div>
              </td>
              <td class="qc-col-center">
                <input class="qc-qty-input" type="number" min="1" value="${item.qty}"
                  onchange="cartSetQty('${item.id}', this.value)" />
              </td>
              <td class="qc-col-center">
                <button class="qc-remove-btn" onclick="cartRemove('${item.id}')">Remove</button>
              </td>
            </tr>
          `}).join('')}
        </tbody>
      </table>
    </div>
    <div class="qc-cart-footer">
      <div>
        <div class="qc-cart-footer__title">Ready to request a quote?</div>
        <div class="qc-cart-footer__desc">Review your items, then continue to send your quote request.</div>
      </div>
      <button class="qc-btn-gold" onclick="cartShowView('form')">Continue to Quote Request</button>
    </div>
  `;

  // Restore normal header (in case it was previously showing the empty state)
  cartShowViewHeaderOnly('cart');
}

// Updates just the header (used after re-rendering the cart table so the
// item count / "Continue Browsing Products" affordance stays in sync).
function cartShowViewHeaderOnly(view) {
  if (view !== 'cart') return;
  const count = cartItemCount();
  const xIcon = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>`;
  const headerTitle = document.getElementById('qc-header-title');
  const headerRight = document.getElementById('qc-header-right');
  if (!headerTitle || !headerRight) return;
  headerTitle.innerHTML = count > 0 ? `Your Quote Cart <span>(${count} item${count === 1 ? '' : 's'})</span>` : 'Your Quote Cart';
  headerRight.innerHTML = count > 0
    ? `<button class="qc-header-right" onclick="cartCloseModal()">Continue Browsing Products ${xIcon}</button>`
    : `<button class="qc-close-x" onclick="cartCloseModal()" aria-label="Close">${xIcon}</button>`;
}

/* ── View: Quote request form ────────────────────────────────── */
const QC_EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const QC_PHONE_PATTERN = /^\d{3}-\d{3}-\d{4}$/;

function cartRenderFormView() {
  const body = document.getElementById('qc-body');
  if (!body) return;
  body.innerHTML = `
    <form id="qc-form" novalidate onsubmit="cartSubmitQuoteForm(event)">
      <div class="qc-section-label">Contact Information</div>

      <div class="qc-form-row">
        <div class="qc-form-field">
          <label class="qc-form-label">First Name *</label>
          <input class="qc-form-input" type="text" id="qc-first-name" placeholder="First Name" required />
        </div>
        <div class="qc-form-field">
          <label class="qc-form-label">Last Name *</label>
          <input class="qc-form-input" type="text" id="qc-last-name" placeholder="Last Name" required />
        </div>
      </div>

      <div class="qc-form-row">
        <div class="qc-form-field">
          <label class="qc-form-label">Email *</label>
          <input class="qc-form-input" type="text" inputmode="email" id="qc-email" placeholder="Email" required
            oninput="cartOnEmailInput()" onblur="cartValidateEmail()" />
          <span class="qc-form-error" id="qc-email-error">Must be a valid email</span>
        </div>
        <div class="qc-form-field">
          <label class="qc-form-label">Phone *</label>
          <input class="qc-form-input" type="tel" id="qc-phone" placeholder="XXX-XXX-XXXX" maxlength="12" required
            oninput="cartOnPhoneInput(this)" onblur="cartValidatePhone()" />
          <span class="qc-form-error" id="qc-phone-error">Must be a valid phone number of the format "XXX-XXX-XXXX"</span>
        </div>
      </div>

      <div class="qc-form-row">
        <div class="qc-form-field">
          <label class="qc-form-label">Hospital / Facility *</label>
          <input class="qc-form-input" type="text" id="qc-facility" placeholder="Hospital / Facility" required />
        </div>
        <div class="qc-form-field">
          <label class="qc-form-label">Title / Position *</label>
          <input class="qc-form-input" type="text" id="qc-position" placeholder="Title / Position" required />
        </div>
      </div>

      <div class="qc-section-label">Additional Information</div>

      <div class="qc-form-group">
        <label class="qc-form-label">Comments / Questions</label>
        <textarea class="qc-form-input qc-form-textarea" id="qc-comments" placeholder="Anything else we should know?"></textarea>
      </div>

      <div class="qc-form-submit-row">
        <button type="submit" class="qc-btn-gold">Submit Quote Request</button>
      </div>
    </form>
  `;
}

function cartSetFieldError(input, errorEl, hasError) {
  input.classList.toggle('qc-input--error', hasError);
  if (errorEl) errorEl.classList.toggle('visible', hasError);
}

function cartValidateEmail() {
  const input = document.getElementById('qc-email');
  const errorEl = document.getElementById('qc-email-error');
  const value = input.value.trim();
  const invalid = value.length > 0 && !QC_EMAIL_PATTERN.test(value);
  cartSetFieldError(input, errorEl, invalid);
  return value.length > 0 && !invalid;
}

function cartOnEmailInput() {
  const input = document.getElementById('qc-email');
  if (input.classList.contains('qc-input--error')) cartValidateEmail();
}

function cartValidatePhone() {
  const input = document.getElementById('qc-phone');
  const errorEl = document.getElementById('qc-phone-error');
  const value = input.value.trim();
  const invalid = value.length > 0 && !QC_PHONE_PATTERN.test(value);
  cartSetFieldError(input, errorEl, invalid);
  return value.length > 0 && !invalid;
}

function cartFormatPhoneInput(input) {
  const digits = input.value.replace(/\D/g, '').slice(0, 10);
  let formatted = digits;
  if (digits.length > 6) formatted = `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6)}`;
  else if (digits.length > 3) formatted = `${digits.slice(0,3)}-${digits.slice(3)}`;
  input.value = formatted;
}

function cartOnPhoneInput(input) {
  cartFormatPhoneInput(input);
  if (input.classList.contains('qc-input--error')) cartValidatePhone();
}

function cartSubmitQuoteForm(event) {
  event.preventDefault();
  const form = document.getElementById('qc-form');

  const emailValid = cartValidateEmail();
  const phoneValid = cartValidatePhone();
  if (!form.reportValidity()) return;
  if (!emailValid) { document.getElementById('qc-email').focus(); return; }
  if (!phoneValid) { document.getElementById('qc-phone').focus(); return; }

  const firstName = document.getElementById('qc-first-name').value.trim();
  const lastName  = document.getElementById('qc-last-name').value.trim();
  const email     = document.getElementById('qc-email').value.trim();
  const phone     = document.getElementById('qc-phone').value.trim();
  const facility  = document.getElementById('qc-facility').value.trim();
  const position  = document.getElementById('qc-position').value.trim();
  const comments  = document.getElementById('qc-comments').value.trim();

  const cart = cartGet();
  const itemLines = cart.map((p, i) =>
    `${i + 1}. ${p.title} (SKU: ${p.sku})${p.qty > 1 ? ' x' + p.qty : ''}`
  ).join('%0A');

  const subject = encodeURIComponent('Quote Request from ' + firstName + ' ' + lastName);
  const body = encodeURIComponent(
    'Quote Request Details\n' +
    '=====================\n' +
    'Name:               ' + firstName + ' ' + lastName + '\n' +
    'Hospital / Facility: ' + facility + '\n' +
    'Title / Position:    ' + position + '\n' +
    'Email:               ' + email + '\n' +
    'Phone:               ' + phone + '\n' +
    (comments ? '\nComments:\n' + comments + '\n' : '') +
    '\nRequested Items:\n'
  ) + itemLines;

  window.location.href = `mailto:info@peakmdi.com?subject=${subject}&body=${body}`;

  // The request has effectively been handed off — clear the cart and
  // show the confirmation screen.
  cartSave([]);
  cartShowView('confirm');
}

/* ── View: Confirmation ──────────────────────────────────────── */
function cartRenderConfirmView() {
  const body = document.getElementById('qc-body');
  if (!body) return;
  body.innerHTML = `
    <div class="qc-confirm">
      <div class="qc-confirm__mountain">
        <svg viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 200 L55 128 L95 162 L160 55 L205 108 L245 72 L300 150 L345 105 L400 150 L400 200 Z" fill="currentColor"/>
        </svg>
      </div>
      <h2>Thank you.</h2>
      <p>A PEAK Representative will review your request and contact you shortly.</p>
      <button class="qc-btn-gold" onclick="cartCloseModal()">Continue Browsing Products</button>
    </div>
  `;
}

/* ── Init — runs on every page load ──────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  cartInjectModal();
  cartUpdateBadge();

  // Wire all "Get A Quote" buttons to open the modal
  document.querySelectorAll('.btn-quote').forEach(btn => {
    btn.style.position = 'relative';

    // Add badge
    const badge = document.createElement('span');
    badge.className = 'cart-badge';
    badge.style.cssText = `
      display:none; position:absolute; top:-7px; right:-7px;
      background:#e03c3c; color:#fff; border-radius:999px;
      font-size:10px; font-weight:800; min-width:18px; height:18px;
      align-items:center; justify-content:center; padding:0 4px;
      font-family:'Montserrat',sans-serif; pointer-events:none;
      border:2px solid #fff;
    `;
    btn.appendChild(badge);

    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      cartOpenModal();
    });
  });

  // Also wire mobile cart buttons
  document.querySelectorAll('.cart-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      cartOpenModal();
    });
  });

  cartUpdateBadge();

  // Close modal on Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') cartCloseModal();
  });
});
