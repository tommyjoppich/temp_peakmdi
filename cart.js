/* ═══════════════════════════════════════════════════════════════
   cart.js — Shared quote cart for PEAK MDI
   Uses sessionStorage so the cart persists across pages for the
   duration of the user's browser session, then clears automatically.
═══════════════════════════════════════════════════════════════ */

const CART_KEY = 'peak_quote_cart';

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

function cartSetQty(id, qty) {
  if (qty < 1) {
    // Show confirmation before removing
    cartConfirmRemove(id);
    return;
  }
  let items = cartGet();
  const item = items.find(i => i.id === id);
  if (item) item.qty = qty;
  cartSave(items);
  cartRenderItems();
}

function cartRemove(id) {
  cartConfirmRemove(id);
}

function cartConfirmRemove(id) {
  const item = cartGet().find(i => i.id === id);
  if (!item) return;
  cartShowConfirm(
    `Remove "${item.title}" from your quote?`,
    () => {
      cartSave(cartGet().filter(i => i.id !== id));
      cartRenderItems();
    }
  );
}

function cartClear() {
  cartShowConfirm(
    'Remove all items from your quote cart?',
    () => {
      cartSave([]);
      cartRenderItems();
    }
  );
}

/* ── Badge — small count indicator on the Get A Quote button ──── */
function cartUpdateBadge() {
  const items = cartGet();
  const total = items.reduce((sum, i) => sum + i.qty, 0);
  document.querySelectorAll('.cart-badge').forEach(el => {
    el.textContent = total;
    el.style.display = total > 0 ? 'flex' : 'none';
  });
}

/* ── Modal ────────────────────────────────────────────────────── */
function cartInjectModal() {
  if (document.getElementById('quote-modal-overlay')) return; // already injected

  const overlay = document.createElement('div');
  overlay.id = 'quote-modal-overlay';
  overlay.style.cssText = `
    display:none; position:fixed; inset:0; z-index:10000;
    background:rgba(0,0,0,0.45); align-items:center; justify-content:center;
    padding:20px;
  `;

  overlay.innerHTML = `
    <div id="quote-modal" style="
      background:#fff; border-radius:16px; width:100%; max-width:900px;
      max-height:90vh; display:flex; flex-direction:column;
      box-shadow:0 20px 60px rgba(0,0,0,0.25); overflow:hidden;
      font-family:'Montserrat',sans-serif;
    ">
      <!-- Header -->
      <div style="
        display:flex; align-items:center; justify-content:space-between;
        padding:20px 24px; border-bottom:1.5px solid #e0e0e0;
        background:#fff; flex-shrink:0;
      ">
        <h2 style="font-size:18px;font-weight:800;color:#1a2f4a;">
          Current Items to be Quoted
        </h2>
        <button onclick="cartCloseModal()" title="Continue Shopping" style="
          background:none; border:none; cursor:pointer;
          display:flex; align-items:center; gap:6px;
          font-family:'Montserrat',sans-serif; font-size:13px;
          font-weight:600; color:#666; padding:6px 10px; border-radius:6px;
          transition:background 0.15s;
        " onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background='none'">
          Continue Shopping
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- Items list -->
      <div id="quote-modal-items" style="
        flex:1; overflow-y:auto; padding:0 24px;
      "></div>

      <!-- Footer — contact info -->
      <div style="
        padding:18px 24px; border-top:1.5px solid #e0e0e0;
        background:#f8f9fc; flex-shrink:0;
      ">
        <p style="font-size:13px;color:#555;font-weight:500;margin-bottom:12px;line-height:1.6;">
          Ready to get a quote? Contact us and reference the items above:
        </p>
        <div style="display:flex;gap:10px;flex-direction:column;">
          <a href="tel:6305205023" style="
            display:flex; align-items:center; gap:8px;
            background:#1a2f4a; color:#fff; border-radius:8px;
            padding:10px 18px; font-size:13px; font-weight:700;
            text-decoration:none; transition:background 0.15s; flex:1; justify-content:center;
          " onmouseover="this.style.background='#243d5a'" onmouseout="this.style.background='#1a2f4a'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            630-520-5023
          </a>
          <button onclick="openQuoteEmailDialog()" style="
            display:flex; align-items:center; gap:8px;
            background:#2e6da4; color:#fff; border-radius:8px;
            padding:10px 18px; font-size:13px; font-weight:700;
            border:none; cursor:pointer; transition:background 0.15s; flex:1; justify-content:center;
          " onmouseover="this.style.background='#245a8c'" onmouseout="this.style.background='#2e6da4'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            Email Quote Request
          </button>
          <!-- Live Quote with AI — inactive / coming soon -->
          <div style="position:relative;flex:1;">
            <div style="
              display:flex; align-items:center; gap:8px; justify-content:center;
              background:#e8e8e8; color:#aaa; border-radius:8px;
              padding:10px 18px; font-size:13px; font-weight:700;
              cursor:not-allowed; user-select:none;
              border:1.5px dashed #ccc;
            ">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Live Quote with AI
            </div>
            <span style="
              position:absolute; top:-9px; left:50%; transform:translateX(-50%);
              background:#f0a500; color:#fff; font-size:10px; font-weight:800;
              padding:2px 8px; border-radius:999px;
              font-family:'Montserrat',sans-serif; letter-spacing:0.06em;
              white-space:nowrap; pointer-events:none;
            ">Coming Soon</span>
          </div>
        </div>
      </div>
    </div>
  `;

  // Close on backdrop click
  overlay.addEventListener('click', e => { if (e.target === overlay) cartCloseModal(); });
  document.body.appendChild(overlay);

  // ── Confirmation dialog ──
  const confirmEl = document.createElement('div');
  confirmEl.id = 'cart-confirm-dialog';
  confirmEl.style.cssText = `
    display:none; position:fixed; inset:0; z-index:10001;
    background:rgba(0,0,0,0.35); align-items:center; justify-content:center;
    padding:20px; font-family:'Montserrat',sans-serif;
  `;
  confirmEl.innerHTML = `
    <div style="
      background:#fff; border-radius:14px; padding:28px 28px 24px;
      max-width:380px; width:100%;
      box-shadow:0 16px 48px rgba(0,0,0,0.22);
    ">
      <p id="cart-confirm-msg" style="
        font-size:15px; font-weight:600; color:#1a1a1a;
        margin-bottom:20px; line-height:1.5; text-align:center;
      "></p>
      <div style="display:flex;gap:10px;justify-content:center;">
        <button id="cart-confirm-cancel" style="
          flex:1; padding:11px 16px; border-radius:8px;
          border:1.5px solid #e0e0e0; background:#fff;
          font-family:'Montserrat',sans-serif; font-size:14px;
          font-weight:700; color:#555; cursor:pointer;
          transition:background 0.15s;
        " onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='#fff'">
          Keep Item
        </button>
        <button id="cart-confirm-ok" style="
          flex:1; padding:11px 16px; border-radius:8px;
          border:none; background:#e03c3c;
          font-family:'Montserrat',sans-serif; font-size:14px;
          font-weight:700; color:#fff; cursor:pointer;
          transition:background 0.15s;
        " onmouseover="this.style.background='#c82a2a'" onmouseout="this.style.background='#e03c3c'">
          Remove
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(confirmEl);
}

function cartShowConfirm(message, onConfirm) {
  const dialog = document.getElementById('cart-confirm-dialog');
  document.getElementById('cart-confirm-msg').textContent = message;
  dialog.style.display = 'flex';

  const okBtn     = document.getElementById('cart-confirm-ok');
  const cancelBtn = document.getElementById('cart-confirm-cancel');

  // Clone to remove previous listeners
  const newOk     = okBtn.cloneNode(true);
  const newCancel = cancelBtn.cloneNode(true);
  okBtn.replaceWith(newOk);
  cancelBtn.replaceWith(newCancel);

  document.getElementById('cart-confirm-ok').addEventListener('click', () => {
    dialog.style.display = 'none';
    onConfirm();
  });
  document.getElementById('cart-confirm-cancel').addEventListener('click', () => {
    dialog.style.display = 'none';
  });
}

function cartOpenModal() {
  cartRenderItems();
  const overlay = document.getElementById('quote-modal-overlay');
  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function cartCloseModal() {
  const overlay = document.getElementById('quote-modal-overlay');
  if (overlay) overlay.style.display = 'none';
  document.body.style.overflow = '';
}

function cartRenderItems() {
  const container = document.getElementById('quote-modal-items');
  if (!container) return;

  const items = cartGet();

  if (!items.length) {
    container.innerHTML = `
      <div style="text-align:center;padding:48px 20px;color:#aaa;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin:0 auto 12px;display:block;">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        <p style="font-size:15px;font-weight:600;margin-bottom:4px;">Your quote cart is empty.</p>
        <p style="font-size:13px;">Browse our products and click "Add to Quote" to get started.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <style>
      @media (max-width: 520px) {
        .cart-qty-header { display: none !important; }
        .cart-qty-cell { display: block !important; width: 100% !important; padding: 4px 8px 12px !important; }
        .cart-row-main td { vertical-align: top; }
        .cart-sku-cell { white-space: normal !important; word-break: break-all; }
      }
    </style>
    <table style="width:100%;border-collapse:collapse;margin:8px 0;">
      <thead>
        <tr style="border-bottom:1.5px solid #e0e0e0;">
          <th style="text-align:left;padding:10px 6px;font-size:11px;font-weight:700;color:#999;letter-spacing:0.08em;text-transform:uppercase;">Product</th>
          <th style="text-align:left;padding:10px 6px;font-size:11px;font-weight:700;color:#999;letter-spacing:0.08em;text-transform:uppercase;">Product No.</th>
          <th class="cart-qty-header" style="text-align:center;padding:10px 6px;font-size:11px;font-weight:700;color:#999;letter-spacing:0.08em;text-transform:uppercase;">Qty</th>
          <th class="cart-qty-header" style="width:36px;"></th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => {
          const imgSrc = item.image
            ? 'Product_Pictures/' + item.image.replace('Product_Pictures/', '')
            : '';
          return `
          <tr class="cart-row-main" style="border-bottom:1px solid #f0f0f0;flex-wrap:wrap;">
            <td style="padding:12px 8px;">
              <div style="display:flex;align-items:center;gap:12px;">
                <div style="
                  width:52px; height:52px; flex-shrink:0;
                  background:#f5f5f5; border-radius:8px; overflow:hidden;
                  display:flex; align-items:center; justify-content:center;
                  border:1px solid #e8e8e8;
                ">
                  ${imgSrc
                    ? `<img src="${imgSrc}" alt="${item.title}" style="width:100%;height:100%;object-fit:contain;" />`
                    : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`
                  }
                </div>
                <span style="font-size:14px;font-weight:600;color:#1a1a1a;line-height:1.3;">${item.title}</span>
              </div>
            </td>
            <td class="cart-sku-cell" style="padding:10px 6px;font-size:12px;color:#666;word-break:break-all;max-width:120px;">${item.sku}</td>
            <td style="padding:14px 8px;text-align:center;">
              <div style="display:flex;align-items:center;justify-content:center;gap:6px;">
                <button onclick="cartSetQty('${item.id}', ${item.qty - 1})" style="
                  width:26px;height:26px;border-radius:6px;border:1.5px solid #e0e0e0;
                  background:#fff;cursor:pointer;font-size:16px;display:flex;
                  align-items:center;justify-content:center;color:#555;font-family:inherit;
                ">−</button>
                <span style="font-size:14px;font-weight:700;min-width:20px;text-align:center;">${item.qty}</span>
                <button onclick="cartSetQty('${item.id}', ${item.qty + 1})" style="
                  width:26px;height:26px;border-radius:6px;border:1.5px solid #e0e0e0;
                  background:#fff;cursor:pointer;font-size:16px;display:flex;
                  align-items:center;justify-content:center;color:#555;font-family:inherit;
                ">+</button>
              </div>
            </td>
            <td class="cart-qty-cell" style="padding:10px 4px;text-align:center;width:36px;">
              <button onclick="cartRemove('${item.id}')" title="Remove" style="
                background:none;border:none;cursor:pointer;color:#ccc;
                display:flex;align-items:center;padding:4px;border-radius:4px;
                transition:color 0.15s;
              " onmouseover="this.style.color='#e03c3c'" onmouseout="this.style.color='#ccc'">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
              </button>
            </td>
          </tr>
        `}).join('')}
      </tbody>
    </table>
    <div style="text-align:right;padding:8px 8px 16px;">
      <button onclick="cartClear()" style="
        background:none;border:none;cursor:pointer;font-family:'Montserrat',sans-serif;
        font-size:12px;font-weight:600;color:#bbb;transition:color 0.15s;
      " onmouseover="this.style.color='#e03c3c'" onmouseout="this.style.color='#bbb'">
        Clear all items
      </button>
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


/* ── Quote Email Dialog ── */
function openQuoteEmailDialog() {
  // Build cart items summary
  const cart = cartGet();
  if (cart.length === 0) { alert('Your cart is empty.'); return; }

  // Remove existing dialog if any
  const existing = document.getElementById('quote-email-dialog');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'quote-email-dialog';
  overlay.style.cssText = `
    position:fixed; inset:0; z-index:100001;
    background:rgba(0,0,0,0.5);
    display:flex; align-items:center; justify-content:center; padding:20px;
  `;

  overlay.innerHTML = `
    <div style="
      background:#fff; border-radius:12px; padding:36px 32px;
      width:100%; max-width:480px; max-height:90vh; overflow-y:auto;
      box-shadow:0 16px 48px rgba(0,0,0,0.2);
    ">
      <h2 style="margin:0 0 6px; font-size:20px; color:#1a2b4a;">Request a Quote</h2>
      <p style="margin:0 0 24px; font-size:13px; color:#888;">Please fill in your details below. All fields are required.</p>

      ${['Full Name','Facility','Staff Position','Email','Phone Number'].map(label => {
        const id = 'qe-' + label.toLowerCase().replace(/\s+/g,'-');
        const type = label === 'Email' ? 'email' : label === 'Phone Number' ? 'tel' : 'text';
        return `
          <label style="display:block; font-size:13px; font-weight:600; color:#1a2b4a; margin-bottom:4px;">${label}</label>
          <input id="${id}" type="${type}" placeholder="${label}"
            oninput="checkQuoteFormReady()"
            style="width:100%; padding:10px 14px; border:1.5px solid #dde3ec; border-radius:8px;
                   font-size:14px; margin-bottom:14px; box-sizing:border-box; outline:none;
                   transition:border-color 0.2s;"
            onfocus="this.style.borderColor='#2563a8'"
            onblur="this.style.borderColor='#dde3ec'" />
        `;
      }).join('')}

      <button id="qe-submit" disabled
        onclick="submitQuoteEmail()"
        style="
          width:100%; padding:13px; border:none; border-radius:8px;
          font-size:14px; font-weight:700; cursor:not-allowed;
          background:#ccc; color:#fff; transition:background 0.2s; margin-top:4px;
        ">
        Send Quote Request to PEAK MDI Staff
      </button>
      <button onclick="document.getElementById('quote-email-dialog').remove()"
        style="
          width:100%; padding:10px; border:1.5px solid #dde3ec; border-radius:8px;
          font-size:13px; background:#fff; color:#666; cursor:pointer; margin-top:10px;
        ">
        Cancel
      </button>
    </div>
  `;

  document.body.appendChild(overlay);
}

function checkQuoteFormReady() {
  const ids = ['qe-full-name','qe-facility','qe-staff-position','qe-email','qe-phone-number'];
  const allFilled = ids.every(id => {
    const el = document.getElementById(id);
    return el && el.value.trim() !== '';
  });
  const btn = document.getElementById('qe-submit');
  if (btn) {
    btn.disabled = !allFilled;
    btn.style.background   = allFilled ? '#2e6da4' : '#ccc';
    btn.style.cursor       = allFilled ? 'pointer'  : 'not-allowed';
  }
}

function submitQuoteEmail() {
  const name     = document.getElementById('qe-full-name').value.trim();
  const facility = document.getElementById('qe-facility').value.trim();
  const position = document.getElementById('qe-staff-position').value.trim();
  const email    = document.getElementById('qe-email').value.trim();
  const phone    = document.getElementById('qe-phone-number').value.trim();

  const cart  = cartGet();
  const items = cart.map((p, i) =>
    `${i + 1}. ${p.title} (SKU: ${p.sku})${p.qty > 1 ? ' x' + p.qty : ''}`
  ).join('%0A');

  const subject = encodeURIComponent('Quote Request from ' + name);
  const body = encodeURIComponent(
    'Quote Request Details\n' +
    '=====================\n' +
    'Full Name:      ' + name     + '\n' +
    'Facility:       ' + facility + '\n' +
    'Staff Position: ' + position + '\n' +
    'Email:          ' + email    + '\n' +
    'Phone:          ' + phone    + '\n\n' +
    'Requested Items:\n'
  ) + items;

  window.location.href = `mailto:info@peakmdi.com?subject=${subject}&body=${body}`;
  document.getElementById('quote-email-dialog').remove();
}