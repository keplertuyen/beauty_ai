/**
 * main.js — BeautyAI Frontend Interactivity Engine
 * Hỗ trợ: đổi tiền tệ (VND/USD) · ngăn kéo giỏ hàng · modal xác thực · tab · toast
 *
 * ⚠️ GHI CHÚ CHO BẢN TRIỂN KHAI THẬT:
 *   Tỷ giá ở đây CHỈ là giá trị mô phỏng cho prototype.
 *   Trong hệ thống thật, tỷ giá là CẤU HÌNH do Quản trị viên đặt
 *   (bảng app_settings, khóa `exchange_rate_usd_vnd`) và API trả về
 *   đồng thời cả `priceUsd` và `priceVnd` — frontend KHÔNG tự quy đổi.
 *   Xem: BR-PRICE-01 → BR-PRICE-08 · FE-06 · RISK-17
 */

// Cấu hình mô phỏng — trong hệ thống thật, nạp từ GET /api/v1/catalog/config
const BEAUTYAI_CONFIG = {
  exchangeRate: 25400,          // app_settings.exchange_rate_usd_vnd
  shippingFeeVnd: 30000,        // app_settings.shipping_fee_vnd
  freeShippingThresholdVnd: 500000,
  comboDiscountPercent: 5,
  supportHours: { start: '08:00', end: '21:00' }
};

let currentCurrency = localStorage.getItem('beautyai_currency') || 'VND';

// Giỏ hàng mô phỏng — khớp với cart.html (4 món, 1 món hết hàng)
let cartItems = JSON.parse(localStorage.getItem('beautyai_cart')) || [
  {
    id: 'P427417',
    name: 'Niacinamide 10% + Zinc 1% Oil Control Serum',
    brand: 'The Ordinary',
    price_usd: 10.80,
    qty: 1,
    img: 'https://www.sephora.com/productimages/sku/s2031391-main-zoom.jpg'
  },
  {
    id: 'P442563',
    name: 'AHA 30% + BHA 2% Exfoliating Peeling Solution',
    brand: 'The Ordinary',
    price_usd: 9.50,
    qty: 1,
    img: 'https://www.sephora.com/productimages/sku/s2210722-main-zoom.jpg'
  },
  {
    id: 'P447207',
    name: 'Retinol 0.5% in Squalane',
    brand: 'The Ordinary',
    price_usd: 12.90,
    qty: 1,
    img: ''
  }
];

// ── FORMAT PRICE ──
function formatPrice(usd) {
  usd = parseFloat(usd) || 0;
  if (currentCurrency === 'VND') {
    // Làm tròn LÊN bội số 1.000 theo BR-PRICE-02
    const vnd = Math.ceil((usd * BEAUTYAI_CONFIG.exchangeRate) / 1000) * 1000;
    return new Intl.NumberFormat('vi-VN').format(vnd) + '₫';
  } else {
    return '$' + usd.toFixed(2);
  }
}

// ── UPDATE ALL PRICES ON PAGE ──
function updateAllPrices() {
  document.querySelectorAll('[data-price-usd]').forEach(el => {
    const usd = parseFloat(el.getAttribute('data-price-usd'));
    el.textContent = formatPrice(usd);
  });
  
  // Update currency toggle button UI
  document.querySelectorAll('.currency-toggle-btn').forEach(btn => {
    if (btn.getAttribute('data-curr') === currentCurrency) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  updateCartDrawerUI();
}

function setCurrency(curr) {
  currentCurrency = curr;
  localStorage.setItem('beautyai_currency', curr);
  updateAllPrices();
  const rate = new Intl.NumberFormat('vi-VN').format(BEAUTYAI_CONFIG.exchangeRate);
  showToast('Đã đổi tiền tệ sang ' + curr + (curr === 'VND' ? ' (tỷ giá hiện hành 1$ = ' + rate + '₫)' : ''));
}

// ── TOAST NOTIFICATIONS ──
function showToast(message) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = '<span>✨</span><span>' + message + '</span>';
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

// ── CART DRAWER ──
function openCartDrawer() {
  const overlay = document.getElementById('cartDrawerOverlay');
  const panel = document.getElementById('cartDrawerPanel');
  if (overlay && panel) {
    overlay.classList.add('open');
    panel.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeCartDrawer() {
  const overlay = document.getElementById('cartDrawerOverlay');
  const panel = document.getElementById('cartDrawerPanel');
  if (overlay && panel) {
    overlay.classList.remove('open');
    panel.classList.remove('open');
    document.body.style.overflow = '';
  }
}

function updateCartBadge() {
  const count = cartItems.reduce((acc, it) => acc + it.qty, 0);
  document.querySelectorAll('.cart-badge-count').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

function updateCartDrawerUI() {
  const container = document.getElementById('cartDrawerItemsList');
  const totalEl = document.getElementById('cartDrawerSubtotal');
  if (!container) return;

  updateCartBadge();

  if (cartItems.length === 0) {
    container.innerHTML = '<div style="text-align:center; padding: 40px 20px; color: var(--text-muted);"><p style="font-size:2rem; margin:0 0 10px 0;">🛍️</p><p>Giỏ hàng của bạn đang trống</p></div>';
    if (totalEl) totalEl.textContent = formatPrice(0);
    return;
  }

  let subtotal = 0;
  let html = '';
  cartItems.forEach((item, index) => {
    const itemTotal = item.price_usd * item.qty;
    subtotal += itemTotal;
    html += `
      <div style="display:flex; gap:14px; padding:16px 0; border-bottom:1px solid var(--border-subtle); align-items:center;">
        ${item.img
          ? `<img src="${item.img}" alt="${item.name}" style="width:60px; height:60px; object-fit:cover; border-radius:10px; background:#F2ECE2;">`
          : `<div style="width:60px; height:60px; border-radius:10px; background:#F2ECE2; display:flex; align-items:center; justify-content:center; font-size:1.4rem;" role="img" aria-label="${item.name}">🧴</div>`}
        <div style="flex:1;">
          <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted);">${item.brand}</div>
          <a href="product-detail.html" style="font-size:0.88rem; font-weight:600; color:var(--text-primary); text-decoration:none; display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden;">${item.name}</a>
          <div style="font-size:0.9rem; font-weight:700; color:var(--primary); margin-top:4px;">${formatPrice(item.price_usd)}</div>
          <div style="display:flex; align-items:center; gap:8px; margin-top:6px;">
            <button onclick="changeCartQty(${index}, -1)" style="width:24px; height:24px; border:1px solid #DDD; border-radius:6px; background:#FFF; cursor:pointer;">-</button>
            <span style="font-size:0.85rem; font-weight:600;">${item.qty}</span>
            <button onclick="changeCartQty(${index}, 1)" style="width:24px; height:24px; border:1px solid #DDD; border-radius:6px; background:#FFF; cursor:pointer;">+</button>
          </div>
        </div>
        <button onclick="removeCartItem(${index})" style="background:none; border:none; color:#B85D3B; cursor:pointer; font-size:1.1rem; padding:4px;" title="Xóa">✕</button>
      </div>
    `;
  });

  container.innerHTML = html;
  if (totalEl) totalEl.textContent = formatPrice(subtotal);
}

function addToCart(id, name, brand, price_usd, img) {
  const existing = cartItems.find(it => it.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cartItems.push({ id, name, brand, price_usd: parseFloat(price_usd), qty: 1, img });
  }
  localStorage.setItem('beautyai_cart', JSON.stringify(cartItems));
  updateCartDrawerUI();
  openCartDrawer();
  showToast('Đã thêm "' + name + '" vào giỏ hàng! 🛒');
}

function changeCartQty(index, delta) {
  if (cartItems[index]) {
    cartItems[index].qty += delta;
    if (cartItems[index].qty <= 0) {
      cartItems.splice(index, 1);
    }
    localStorage.setItem('beautyai_cart', JSON.stringify(cartItems));
    updateCartDrawerUI();
  }
}

function removeCartItem(index) {
  cartItems.splice(index, 1);
  localStorage.setItem('beautyai_cart', JSON.stringify(cartItems));
  updateCartDrawerUI();
  showToast('Đã xóa sản phẩm khỏi giỏ hàng');
}

// ── AUTH MODAL ──
function openAuthModal(tab = 'login') {
  const overlay = document.getElementById('authModalOverlay');
  if (overlay) {
    overlay.classList.add('open');
    switchAuthTab(tab);
    document.body.style.overflow = 'hidden';
  }
}

function closeAuthModal() {
  const overlay = document.getElementById('authModalOverlay');
  if (overlay) {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
}

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
  });
  const loginForm = document.getElementById('authLoginForm');
  const registerForm = document.getElementById('authRegisterForm');
  if (loginForm && registerForm) {
    loginForm.style.display = tab === 'login' ? 'block' : 'none';
    registerForm.style.display = tab === 'register' ? 'block' : 'none';
  }
}

// ── INITIALIZE ON LOAD ──
document.addEventListener('DOMContentLoaded', () => {
  // Sticky Navbar
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    if (navbar) {
      if (window.scrollY > 20) {
        navbar.classList.add('navbar-scrolled');
      } else {
        navbar.classList.remove('navbar-scrolled');
      }
    }
  });

  // Mobile menu toggle
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
    });
  }

  // Cart Drawer open/close triggers
  document.querySelectorAll('.cart-open-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openCartDrawer();
    });
  });

  const cartCloseBtn = document.getElementById('cartDrawerCloseBtn');
  if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCartDrawer);

  const cartOverlay = document.getElementById('cartDrawerOverlay');
  if (cartOverlay) cartOverlay.addEventListener('click', (e) => {
    if (e.target === cartOverlay) closeCartDrawer();
  });

  // Auth Modal triggers
  document.querySelectorAll('.auth-open-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openAuthModal();
    });
  });

  const authCloseBtn = document.getElementById('authModalCloseBtn');
  if (authCloseBtn) authCloseBtn.addEventListener('click', closeAuthModal);

  const authOverlay = document.getElementById('authModalOverlay');
  if (authOverlay) authOverlay.addEventListener('click', (e) => {
    if (e.target === authOverlay) closeAuthModal();
  });

  // Update initial prices & cart UI
  updateAllPrices();
});
