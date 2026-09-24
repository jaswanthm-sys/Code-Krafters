/**
 * Code Krafter's - Main Application Controller
 * Handles UI rendering, 3D card interactions, filtering, search, cart synchronization,
 * fly-to-cart animations, payment mode selection, and checkout flow.
 */

// Application State
const appState = {
  currentCategory: 'all',
  searchQuery: '',
  vegOnly: false,
  sortBy: 'popular'
};

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initCategories();
  initEventListeners();
  renderMenu();

  // Subscribe cart changes to update UI automatically
  cart.subscribe(() => {
    updateCartUI();
    renderMenu(); // Re-render menu to update stepper counts on cards
  });

  // Initial cart UI update
  updateCartUI();

  // Sticky header shadow on scroll
  window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
});

/* ==========================================================================
   THEME MANAGER (DARK / LIGHT MODE)
   ========================================================================== */
function initTheme() {
  const savedTheme = localStorage.getItem('code_krafters_theme') || 'dark';
  setTheme(savedTheme);

  const themeBtn = document.getElementById('theme-toggle-btn');
  const mobThemeBtn = document.getElementById('mobile-theme-toggle');

  const onToggle = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    if (window.soundEngine) window.soundEngine.playPop();
  };

  if (themeBtn) themeBtn.addEventListener('click', onToggle);
  if (mobThemeBtn) mobThemeBtn.addEventListener('click', onToggle);
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('code_krafters_theme', theme);
  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.className = theme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
  }
  const mobBtn = document.getElementById('mobile-theme-toggle');
  if (mobBtn) {
    mobBtn.innerHTML = theme === 'dark' ? '<i class="fa-solid fa-moon"></i> Dark Theme' : '<i class="fa-solid fa-sun"></i> Light Theme';
  }
}

/* ==========================================================================
   CATEGORY TABS INITIALIZATION & HANDLING
   ========================================================================== */
function initCategories() {
  const container = document.getElementById('category-tabs-wrapper');
  const mobileContainer = document.getElementById('mobile-category-links');
  if (!container) return;

  container.innerHTML = '';
  if (mobileContainer) mobileContainer.innerHTML = '';

  MENU_CATEGORIES.forEach((cat) => {
    // Desktop / Tablet Pill
    const pill = document.createElement('button');
    pill.className = `category-pill ${cat.id === appState.currentCategory ? 'active' : ''}`;
    pill.innerHTML = `
      <span>${cat.name}</span>
      <span class="pill-count">${getCategoryCount(cat.id)}</span>
    `;
    pill.addEventListener('click', () => {
      filterByCategory(cat.id);
    });
    container.appendChild(pill);

    // Mobile Drawer Link
    if (mobileContainer) {
      const mobBtn = document.createElement('button');
      mobBtn.className = cat.id === appState.currentCategory ? 'active' : '';
      mobBtn.innerHTML = `${cat.name} (${getCategoryCount(cat.id)})`;
      mobBtn.addEventListener('click', () => {
        filterByCategory(cat.id);
        closeMobileNav();
      });
      mobileContainer.appendChild(mobBtn);
    }
  });
}

function getCategoryCount(catId) {
  if (catId === 'all') return MENU_ITEMS.length;
  return MENU_ITEMS.filter((item) => item.category === catId).length;
}

function updateCategoryPillsUI(catId) {
  document.querySelectorAll('.category-pill').forEach((pill, idx) => {
    const cat = MENU_CATEGORIES[idx];
    if (cat && cat.id === catId) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });

  const mobButtons = document.querySelectorAll('#mobile-category-links button');
  mobButtons.forEach((btn, idx) => {
    const cat = MENU_CATEGORIES[idx];
    if (cat && cat.id === catId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function filterByCategory(catId) {
  appState.currentCategory = catId;
  appState.searchQuery = ''; // Reset active search filter on category selection
  
  const searchInput = document.getElementById('menu-search-input');
  const mobileSearchInput = document.getElementById('mobile-search-input');
  const clearSearchBtn = document.getElementById('search-clear-btn');
  if (searchInput) searchInput.value = '';
  if (mobileSearchInput) mobileSearchInput.value = '';
  if (clearSearchBtn) clearSearchBtn.classList.add('hidden');

  updateCategoryPillsUI(catId);

  const catObj = MENU_CATEGORIES.find((c) => c.id === catId);
  const activeLabel = document.getElementById('active-category-display');
  if (activeLabel && catObj) {
    activeLabel.textContent = catObj.name;
  }

  if (window.soundEngine) window.soundEngine.playPop();
  renderMenu();
}

/* ==========================================================================
   MENU RENDERING & 3D CARD TILT
   ========================================================================== */
function renderMenu() {
  const grid = document.getElementById('food-grid');
  const noResults = document.getElementById('no-results-state');
  const countDisplay = document.getElementById('items-count-display');
  if (!grid) return;

  // Filter items
  let items = MENU_ITEMS.filter((item) => {
    // 1. If searching, search across all categories; otherwise filter by active category
    if (!appState.searchQuery && appState.currentCategory !== 'all' && item.category !== appState.currentCategory) {
      return false;
    }
    // 2. Veg only
    if (appState.vegOnly && !item.isVeg) {
      return false;
    }
    // 3. Robust Search query across name, description, category, tags, prep time, calories
    if (appState.searchQuery) {
      const q = appState.searchQuery.toLowerCase();
      const tokens = q.split(/\s+/).filter((t) => t.length > 0);
      const searchable = `${item.name} ${item.description} ${item.category} ${item.badge} ${item.prepTime || ''} ${item.calories || ''}`.toLowerCase();
      const matchesAllTokens = tokens.every((token) => searchable.includes(token));
      if (!matchesAllTokens) return false;
    }
    return true;
  });

  // Sort items
  if (appState.sortBy === 'price-asc') {
    items.sort((a, b) => a.price - b.price);
  } else if (appState.sortBy === 'price-desc') {
    items.sort((a, b) => b.price - a.price);
  } else if (appState.sortBy === 'rating') {
    items.sort((a, b) => b.rating - a.rating);
  } else {
    // Default: Popularity (reviews count)
    items.sort((a, b) => b.reviews - a.reviews);
  }

  // Update item count
  if (countDisplay) {
    countDisplay.textContent = items.length;
  }

  // Check empty state
  if (items.length === 0) {
    grid.innerHTML = '';
    if (noResults) noResults.classList.remove('hidden');
    return;
  } else {
    if (noResults) noResults.classList.add('hidden');
  }

  // Render cards
  grid.innerHTML = '';
  items.forEach((item) => {
    const card = createFoodCardElement(item);
    grid.appendChild(card);
  });
}

function createFoodCardElement(item) {
  const card = document.createElement('div');
  card.className = 'food-card';
  card.dataset.id = item.id;

  const currentQty = cart.getItemQuantity(item.id);
  const discountAmount = Math.max(0, (item.originalPrice || item.price) - item.price);

  card.innerHTML = `
    <div class="card-img-wrap">
      <img src="${item.image}" alt="${item.name}" loading="lazy">
      <div class="card-badges">
        <span class="card-tag" style="background: ${item.badgeColor || 'var(--color-primary)'}">${item.badge}</span>
        <div class="diet-indicator ${item.isVeg ? 'veg' : 'non-veg'}" title="${item.isVeg ? '100% Vegetarian' : 'Contains Non-Veg / Poultry'}">
          <div class="dot"></div>
        </div>
      </div>
      <div class="card-quick-meta">
        <span class="meta-pill"><i class="fa-regular fa-clock"></i> ${item.prepTime}</span>
        <span class="meta-pill"><i class="fa-solid fa-fire-flame-curved"></i> ${item.calories}</span>
      </div>
    </div>

    <div class="card-content">
      <div class="card-title-row">
        <h3 class="card-name">${item.name}</h3>
        <div class="card-rating">
          <i class="fa-solid fa-star"></i>
          <span>${item.rating}</span>
        </div>
      </div>

      <p class="card-desc">${item.description}</p>

      <div class="card-footer">
        <div class="card-pricing">
          <div class="price-main">₹${item.price}</div>
          <div class="price-strike-wrap">
            <span class="strikethrough">₹${item.originalPrice}</span>
            <span class="save-badge">Save ₹${discountAmount}</span>
          </div>
        </div>

        <div class="card-action-wrap" id="card-action-${item.id}">
          ${
            currentQty > 0
              ? `
            <div class="card-stepper">
              <button class="stepper-btn" onclick="updateItemQty('${item.id}', -1)" aria-label="Decrease quantity">
                <i class="fa-solid fa-minus"></i>
              </button>
              <span class="stepper-qty">${currentQty}</span>
              <button class="stepper-btn" onclick="updateItemQty('${item.id}', 1)" aria-label="Increase quantity">
                <i class="fa-solid fa-plus"></i>
              </button>
            </div>
          `
              : `
            <button class="add-to-cart-btn" onclick="handleCardAddToCart(event, '${item.id}')" aria-label="Add ${item.name} to cart">
              <i class="fa-solid fa-plus"></i>
              <span>Add</span>
            </button>
          `
          }
        </div>
      </div>
    </div>
  `;

  // Attach 3D Mouse Tilt & Specular Sheen Handler
  attach3DTilt(card);

  return card;
}

/* 3D Dynamic Card Tilt Logic */
function attach3DTilt(card) {
  const maxTilt = 12; // Maximum tilt angle in degrees

  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const tiltX = ((y - centerY) / centerY) * -maxTilt;
    const tiltY = ((x - centerX) / centerX) * maxTilt;

    card.style.transform = `perspective(1000px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) translateY(-8px) scale3d(1.02, 1.02, 1.02)`;

    // Update specular highlight CSS variable
    const mouseXPercent = (x / rect.width) * 100;
    const mouseYPercent = (y / rect.height) * 100;
    card.style.setProperty('--mouse-x', `${mouseXPercent}%`);
    card.style.setProperty('--mouse-y', `${mouseYPercent}%`);
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) scale3d(1, 1, 1)';
  });
}

/* ==========================================================================
   CART INTERACTIONS & FLY-TO-CART ANIMATION
   ========================================================================== */
function handleCardAddToCart(e, itemId) {
  const item = MENU_ITEMS.find((it) => it.id === itemId);
  if (!item) return;

  // Trigger Fly-to-Cart visual effect
  triggerFlyToCartAnimation(e.currentTarget, item.image);

  // Add to cart state
  cart.addItem(item, 1);
}

function updateItemQty(itemId, delta) {
  cart.updateQuantity(itemId, delta);
}

function triggerFlyToCartAnimation(buttonEl, imgSrc) {
  const cartBtn = document.getElementById('cart-toggle-btn');
  if (!cartBtn) return;

  const btnRect = buttonEl.getBoundingClientRect();
  const cartRect = cartBtn.getBoundingClientRect();

  // Create flying particle
  const flyingImg = document.createElement('img');
  flyingImg.src = imgSrc;
  flyingImg.className = 'flying-food-particle';
  flyingImg.style.left = `${btnRect.left + btnRect.width / 2 - 25}px`;
  flyingImg.style.top = `${btnRect.top + btnRect.height / 2 - 25}px`;

  document.body.appendChild(flyingImg);

  // Force reflow
  flyingImg.getBoundingClientRect();

  // Animate to cart icon
  flyingImg.style.transform = 'scale(0.3) rotate(360deg)';
  flyingImg.style.opacity = '0.3';
  flyingImg.style.left = `${cartRect.left + cartRect.width / 2 - 15}px`;
  flyingImg.style.top = `${cartRect.top + cartRect.height / 2 - 15}px`;

  setTimeout(() => {
    flyingImg.remove();
    // Bounce cart badge
    const badge = document.getElementById('nav-cart-count');
    if (badge) {
      badge.classList.remove('bounce');
      void badge.offsetWidth; // trigger reflow
      badge.classList.add('bounce');
    }
  }, 750);
}

/* ==========================================================================
   CART UI & PRICE BREAKDOWN SYNCHRONIZATION
   ========================================================================== */
function updateCartUI() {
  const calcs = cart.getCalculations();
  const totalCount = cart.getTotalCount();

  // 1. Update Navbar Cart Count & Total Preview
  const navCount = document.getElementById('nav-cart-count');
  const navPrice = document.getElementById('nav-cart-price');
  if (navCount) navCount.textContent = totalCount;
  if (navPrice) navPrice.textContent = `₹${calcs.grandTotal}`;

  // 2. Update Drawer Header Count
  const drawerCount = document.getElementById('drawer-items-count');
  if (drawerCount) drawerCount.textContent = `${totalCount} item${totalCount === 1 ? '' : 's'}`;

  // 3. Update Free Delivery Progress Bar (Free above ₹499)
  const freeThreshold = 499;
  const progressPercent = Math.min(100, Math.round((calcs.subtotal / freeThreshold) * 100));
  const barFill = document.getElementById('delivery-progress-bar');
  const barText = document.getElementById('delivery-progress-text');

  if (barFill && barText) {
    barFill.style.width = `${progressPercent}%`;
    if (calcs.subtotal === 0) {
      barText.innerHTML = `Add items worth <strong>₹${freeThreshold}</strong> for <strong>FREE Delivery!</strong>`;
    } else if (calcs.subtotal >= freeThreshold || calcs.freeDeliveryApplied) {
      barText.innerHTML = `🎉 <strong>Hurray! You've unlocked FREE Lightning Delivery!</strong>`;
      barFill.style.background = 'var(--color-veg-green)';
    } else {
      const remaining = freeThreshold - calcs.subtotal;
      barText.innerHTML = `Add <strong>₹${remaining}</strong> more to unlock <strong>FREE Delivery!</strong>`;
    }
  }

  // 4. Cart Items List / Empty State Toggle
  const emptyState = document.getElementById('cart-empty-state');
  const itemsContainer = document.getElementById('cart-items-list');
  const cartFooter = document.getElementById('cart-footer');

  if (totalCount === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
    if (itemsContainer) itemsContainer.innerHTML = '';
    if (cartFooter) cartFooter.classList.add('hidden');
    // Hide mobile float pill
    const floatPill = document.getElementById('floating-mobile-cart');
    if (floatPill) floatPill.classList.add('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');
  if (cartFooter) cartFooter.classList.remove('hidden');

  // Render items inside drawer
  if (itemsContainer) {
    itemsContainer.innerHTML = '';
    calcs.itemsList.forEach(({ item, quantity }) => {
      const itemRow = document.createElement('div');
      itemRow.className = 'cart-item-row';
      itemRow.innerHTML = `
        <img src="${item.image}" alt="${item.name}" class="cart-item-thumb">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">₹${item.price * quantity}</div>
        </div>
        <div class="cart-item-stepper">
          <button class="cart-stepper-btn" onclick="updateItemQty('${item.id}', -1)" aria-label="Decrease quantity">
            <i class="fa-solid fa-minus"></i>
          </button>
          <span class="cart-stepper-qty">${quantity}</span>
          <button class="cart-stepper-btn" onclick="updateItemQty('${item.id}', 1)" aria-label="Increase quantity">
            <i class="fa-solid fa-plus"></i>
          </button>
        </div>
        <button class="cart-item-remove" onclick="cart.removeItem('${item.id}')" title="Remove item" aria-label="Remove item">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      `;
      itemsContainer.appendChild(itemRow);
    });
  }

  // 5. Update Detailed Bill Breakdown
  const billOriginal = document.getElementById('bill-original-subtotal');
  const billSubtotal = document.getElementById('bill-subtotal');
  const billCouponRow = document.getElementById('coupon-discount-row');
  const billCouponVal = document.getElementById('bill-coupon-discount');
  const billDelivery = document.getElementById('bill-delivery-fee');
  const billPackaging = document.getElementById('bill-packaging-fee');
  const billGst = document.getElementById('bill-gst');
  const billSaved = document.getElementById('bill-total-saved');
  const billGrandTotal = document.getElementById('bill-grand-total');
  const checkoutBtnPrice = document.getElementById('checkout-btn-price');

  if (billOriginal) billOriginal.textContent = `₹${calcs.originalSubtotal}`;
  if (billSubtotal) billSubtotal.textContent = `₹${calcs.subtotal}`;

  if (calcs.couponDiscount > 0) {
    if (billCouponRow) billCouponRow.classList.remove('hidden');
    if (billCouponVal) billCouponVal.textContent = `-₹${calcs.couponDiscount}`;
  } else {
    if (billCouponRow) billCouponRow.classList.add('hidden');
  }

  if (billDelivery) {
    billDelivery.innerHTML = calcs.actualDeliveryFee === 0 ? '<span class="highlight-green">FREE</span>' : `₹${calcs.actualDeliveryFee}`;
  }
  if (billPackaging) billPackaging.textContent = `₹${calcs.packagingFee}`;
  if (billGst) billGst.textContent = `₹${calcs.gstAmount}`;
  if (billSaved) billSaved.textContent = `₹${calcs.totalAmountSaved}`;
  if (billGrandTotal) billGrandTotal.textContent = `₹${calcs.grandTotal}`;
  if (checkoutBtnPrice) checkoutBtnPrice.textContent = `₹${calcs.grandTotal}`;

  // 6. Update Floating Cart Pill on Mobile
  const floatPill = document.getElementById('floating-mobile-cart');
  const floatCount = document.getElementById('float-cart-count');
  const floatTotal = document.getElementById('float-cart-total');

  if (floatPill && floatCount && floatTotal) {
    floatPill.classList.remove('hidden');
    floatCount.textContent = `${totalCount} item${totalCount === 1 ? '' : 's'}`;
    floatTotal.textContent = `₹${calcs.grandTotal}`;
  }

  // 7. Update Payment Mode Selector state
  updatePaymentSelectorUI();
}

function updatePaymentSelectorUI() {
  const method = cart.selectedPaymentMethod;
  document.querySelectorAll('.payment-option').forEach((opt) => {
    if (opt.dataset.method === method) {
      opt.classList.add('selected');
      const input = opt.querySelector('input');
      if (input) input.checked = true;
    } else {
      opt.classList.remove('selected');
    }
  });
}

/* ==========================================================================
   COUPON & PROMO CODES
   ========================================================================== */
function applyPromoInput(code) {
  const input = document.getElementById('coupon-input');
  if (input) input.value = code;
  applyCouponCode(code);
}

function applyPromoQuick(code) {
  openCartDrawer();
  const input = document.getElementById('coupon-input');
  if (input) input.value = code;
  applyCouponCode(code);
}

function applyCouponCode(code) {
  const msgEl = document.getElementById('coupon-message');
  if (!code) {
    if (msgEl) {
      msgEl.className = 'coupon-message error';
      msgEl.textContent = 'Please enter a valid coupon code.';
    }
    return;
  }

  const result = cart.applyCoupon(code);
  if (msgEl) {
    msgEl.className = `coupon-message ${result.success ? 'success' : 'error'}`;
    msgEl.textContent = result.message;
  }
}

/* ==========================================================================
   CART DRAWER & MODAL TOGGLES
   ========================================================================== */
function openCartDrawer() {
  const overlay = document.getElementById('cart-drawer-overlay');
  if (overlay) overlay.classList.add('active');
  if (window.soundEngine) window.soundEngine.playPop();
}

function closeCartDrawer() {
  const overlay = document.getElementById('cart-drawer-overlay');
  if (overlay) overlay.classList.remove('active');
}

function closeCartAndScroll() {
  closeCartDrawer();
  const menuSec = document.getElementById('menu-section');
  if (menuSec) menuSec.scrollIntoView({ behavior: 'smooth' });
}

function closeMobileNav() {
  const drawer = document.getElementById('mobile-nav-drawer');
  if (drawer) drawer.classList.remove('open');
}

/* ==========================================================================
   CHECKOUT & ORDER FLOW
   ========================================================================== */
function openCheckoutModal() {
  const calcs = cart.getCalculations();
  if (calcs.itemsList.length === 0) return;

  const modal = document.getElementById('checkout-modal');
  const payLabel = document.getElementById('checkout-selected-payment');
  const totalLabel = document.getElementById('checkout-modal-total');
  const savingsLabel = document.getElementById('checkout-modal-savings');

  // Format chosen payment label
  const methodNames = {
    upi: 'Instant UPI / QR (GPay/PhonePe)',
    card: 'Credit / Debit Card',
    cod: 'Cash on Delivery (COD)',
    wallet: 'Net Banking & Wallets'
  };

  if (payLabel) payLabel.textContent = methodNames[cart.selectedPaymentMethod] || 'Instant UPI';
  if (totalLabel) totalLabel.textContent = `₹${calcs.grandTotal}`;
  if (savingsLabel) savingsLabel.textContent = `₹${calcs.totalAmountSaved}`;

  if (modal) modal.classList.remove('hidden');
  closeCartDrawer();
  if (window.soundEngine) window.soundEngine.playPop();
}

function closeCheckoutModal() {
  const modal = document.getElementById('checkout-modal');
  if (modal) modal.classList.add('hidden');
}

function handlePlaceOrder(e) {
  e.preventDefault();

  const nameInput = document.getElementById('cust-name');
  const phoneInput = document.getElementById('cust-phone');
  const addrInput = document.getElementById('cust-address');

  if (!nameInput.value || !phoneInput.value || !addrInput.value) {
    alert('Please fill out all required delivery fields.');
    return;
  }

  const calcs = cart.getCalculations();
  const orderId = `#CK-${Math.floor(10000 + Math.random() * 90000)}`;

  // Close checkout modal
  closeCheckoutModal();

  // Populate Order Success Modal
  const successModal = document.getElementById('order-success-modal');
  const idDisplay = document.getElementById('success-order-id');
  const payDisplay = document.getElementById('success-payment-method');
  const totalDisplay = document.getElementById('success-total-amount');
  const savingsDisplay = document.getElementById('success-total-savings');

  const methodNames = {
    upi: 'Instant UPI / QR Code',
    card: 'Credit / Debit Card',
    cod: 'Cash on Delivery (COD)',
    wallet: 'Net Banking / Wallet'
  };

  if (idDisplay) idDisplay.textContent = orderId;
  if (payDisplay) payDisplay.textContent = methodNames[cart.selectedPaymentMethod] || 'Instant UPI';
  if (totalDisplay) totalDisplay.textContent = `₹${calcs.grandTotal}`;
  if (savingsDisplay) savingsDisplay.textContent = `₹${calcs.totalAmountSaved}`;

  if (successModal) successModal.classList.remove('hidden');

  // Trigger celebration sounds & confetti
  if (window.soundEngine) window.soundEngine.playOrderSuccess();
  triggerConfetti();

  // Reset cart
  cart.clearCart();
}

function closeSuccessModalAndReset() {
  const modal = document.getElementById('order-success-modal');
  if (modal) modal.classList.add('hidden');
  const menuSec = document.getElementById('menu-section');
  if (menuSec) menuSec.scrollIntoView({ behavior: 'smooth' });
}

/* Canvas Confetti Explosion */
function triggerConfetti() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF2A4D', '#FFB800', '#00E5FF', '#10B981', '#FF6B00']
    });

    setTimeout(() => {
      confetti({
        particleCount: 60,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 60,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });
    }, 250);
  }
}

/* ==========================================================================
   EVENT LISTENERS & BINDINGS
   ========================================================================== */
function initEventListeners() {
  // Cart open / close buttons
  const cartToggleBtn = document.getElementById('cart-toggle-btn');
  const cartCloseBtn = document.getElementById('cart-close-btn');
  const cartOverlay = document.getElementById('cart-drawer-overlay');

  if (cartToggleBtn) cartToggleBtn.addEventListener('click', openCartDrawer);
  if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCartDrawer);

  if (cartOverlay) {
    cartOverlay.addEventListener('click', (e) => {
      if (e.target === cartOverlay) closeCartDrawer();
    });
  }

  // Mobile menu drawer toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileNav = document.getElementById('mobile-nav-drawer');
  if (mobileMenuBtn && mobileNav) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
      if (window.soundEngine) window.soundEngine.playPop();
    });
  }

  // Sound toggle button
  const soundBtn = document.getElementById('sound-toggle-btn');
  const soundIcon = document.getElementById('sound-icon');
  if (soundBtn && soundIcon) {
    soundBtn.addEventListener('click', () => {
      const isMuted = window.soundEngine.toggleMute();
      soundIcon.className = isMuted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
    });
  }

  // Veg filter checkbox (Desktop & Mobile)
  const vegCheckbox = document.getElementById('veg-filter-checkbox');
  const mobileVegCheckbox = document.getElementById('mobile-veg-checkbox');

  const onVegToggle = (val) => {
    appState.vegOnly = val;
    if (vegCheckbox) vegCheckbox.checked = val;
    if (mobileVegCheckbox) mobileVegCheckbox.checked = val;
    if (window.soundEngine) window.soundEngine.playPop();
    renderMenu();
  };

  if (vegCheckbox) {
    vegCheckbox.addEventListener('change', (e) => onVegToggle(e.target.checked));
  }
  if (mobileVegCheckbox) {
    mobileVegCheckbox.addEventListener('change', (e) => onVegToggle(e.target.checked));
  }

  // Search input with debounce (Desktop & Mobile)
  const searchInput = document.getElementById('menu-search-input');
  const mobileSearchInput = document.getElementById('mobile-search-input');
  const clearSearchBtn = document.getElementById('search-clear-btn');

  let searchTimeout = null;
  const onSearchChange = (query) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      appState.searchQuery = query.trim();
      const activeLabel = document.getElementById('active-category-display');

      if (query.trim().length > 0) {
        if (clearSearchBtn) clearSearchBtn.classList.remove('hidden');
        // When searching, auto-select 'All Items' category tab
        appState.currentCategory = 'all';
        updateCategoryPillsUI('all');
        if (activeLabel) {
          activeLabel.textContent = `Search: "${query.trim()}"`;
        }
        // Smooth scroll to menu section so search results are instantly visible
        const menuSec = document.getElementById('menu-section');
        if (menuSec && window.scrollY < 260) {
          menuSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else {
        if (clearSearchBtn) clearSearchBtn.classList.add('hidden');
        if (activeLabel) {
          const catObj = MENU_CATEGORIES.find((c) => c.id === appState.currentCategory);
          activeLabel.textContent = catObj ? catObj.name : 'All Items';
        }
      }
      renderMenu();
    }, 150);
  };

  const handleSearchEnter = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const menuSec = document.getElementById('menu-section');
      if (menuSec) menuSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      onSearchChange(e.target.value);
      if (mobileSearchInput) mobileSearchInput.value = e.target.value;
    });
    searchInput.addEventListener('keydown', handleSearchEnter);
  }
  if (mobileSearchInput) {
    mobileSearchInput.addEventListener('input', (e) => {
      onSearchChange(e.target.value);
      if (searchInput) searchInput.value = e.target.value;
    });
    mobileSearchInput.addEventListener('keydown', handleSearchEnter);
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (mobileSearchInput) mobileSearchInput.value = '';
      clearSearchBtn.classList.add('hidden');
      appState.searchQuery = '';
      const activeLabel = document.getElementById('active-category-display');
      if (activeLabel) activeLabel.textContent = 'All Items';
      renderMenu();
    });
  }

  // Sort dropdown
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      appState.sortBy = e.target.value;
      if (window.soundEngine) window.soundEngine.playPop();
      renderMenu();
    });
  }

  // Coupon apply button
  const applyCouponBtn = document.getElementById('apply-coupon-btn');
  const couponInput = document.getElementById('coupon-input');
  if (applyCouponBtn && couponInput) {
    applyCouponBtn.addEventListener('click', () => {
      applyCouponCode(couponInput.value);
    });
    couponInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') applyCouponCode(couponInput.value);
    });
  }

  // Payment Mode selection options
  document.querySelectorAll('.payment-option').forEach((opt) => {
    opt.addEventListener('click', () => {
      const method = opt.dataset.method;
      if (method) cart.setPaymentMethod(method);
    });
  });

  // Proceed to Checkout button
  const proceedBtn = document.getElementById('proceed-checkout-btn');
  if (proceedBtn) {
    proceedBtn.addEventListener('click', openCheckoutModal);
  }

  // Close Checkout Modal
  const closeCheckoutBtn = document.getElementById('close-checkout-modal-btn');
  if (closeCheckoutBtn) {
    closeCheckoutBtn.addEventListener('click', closeCheckoutModal);
  }

  // Hero Quick Buttons
  const heroOrderBtn = document.getElementById('hero-order-now-btn');
  const heroCombosBtn = document.getElementById('hero-view-combos-btn');

  if (heroCombosBtn) {
    heroCombosBtn.addEventListener('click', () => {
      filterByCategory('combos');
      const menuSec = document.getElementById('menu-section');
      if (menuSec) menuSec.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Reset filters button (on no results screen)
  const resetBtn = document.getElementById('reset-filters-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      appState.currentCategory = 'all';
      appState.searchQuery = '';
      appState.vegOnly = false;
      appState.sortBy = 'popular';
      if (searchInput) searchInput.value = '';
      if (mobileSearchInput) mobileSearchInput.value = '';
      if (vegCheckbox) vegCheckbox.checked = false;
      if (mobileVegCheckbox) mobileVegCheckbox.checked = false;
      if (clearSearchBtn) clearSearchBtn.classList.add('hidden');
      initCategories();
      renderMenu();
    });
  }
}
