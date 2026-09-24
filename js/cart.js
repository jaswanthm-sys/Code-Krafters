/**
 * Code Krafter's - Cart State Management & Price Breakdown Engine
 * Handles items, quantities, coupons, GST calculations, delivery tiers,
 * total savings calculation, and payment method selection.
 */

class CartManager {
  constructor() {
    this.STORAGE_KEY = 'code_krafters_cart_v1';
    this.items = this.loadCart();
    this.appliedCoupon = null;
    this.selectedPaymentMethod = 'upi'; // 'upi', 'card', 'cod', 'wallet'
    this.listeners = [];
  }

  // Subscribe to cart changes for UI reactivity
  subscribe(listener) {
    this.listeners.push(listener);
  }

  notify() {
    this.saveCart();
    this.listeners.forEach((fn) => fn(this));
  }

  loadCart() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }

  saveCart() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.items));
    } catch (e) {}
  }

  addItem(item, qty = 1) {
    if (this.items[item.id]) {
      this.items[item.id].quantity += qty;
    } else {
      this.items[item.id] = {
        item: { ...item },
        quantity: qty
      };
    }
    this.notify();
    if (window.soundEngine) window.soundEngine.playAddToCart();
  }

  updateQuantity(itemId, delta) {
    if (!this.items[itemId]) return;
    this.items[itemId].quantity += delta;
    if (this.items[itemId].quantity <= 0) {
      delete this.items[itemId];
    }
    this.notify();
    if (window.soundEngine) window.soundEngine.playPop();
  }

  removeItem(itemId) {
    if (this.items[itemId]) {
      delete this.items[itemId];
      this.notify();
      if (window.soundEngine) window.soundEngine.playPop();
    }
  }

  clearCart() {
    this.items = {};
    this.appliedCoupon = null;
    this.notify();
  }

  getItemQuantity(itemId) {
    return this.items[itemId] ? this.items[itemId].quantity : 0;
  }

  getTotalCount() {
    return Object.values(this.items).reduce((sum, entry) => sum + entry.quantity, 0);
  }

  applyCoupon(couponCode) {
    const code = couponCode.trim().toUpperCase();
    const coupon = PROMO_COUPONS[code];

    if (!coupon) {
      return { success: false, message: 'Invalid promo code. Try KRAFTER50 or BYTEBITE!' };
    }

    const { subtotal } = this.getCalculations();
    if (coupon.minOrder && subtotal < coupon.minOrder) {
      return {
        success: false,
        message: `Min order amount for ${code} is ₹${coupon.minOrder}. Add more items!`
      };
    }

    this.appliedCoupon = coupon;
    this.notify();
    if (window.soundEngine) window.soundEngine.playPop();
    return { success: true, message: `Awesome! Coupon ${code} applied successfully!` };
  }

  removeCoupon() {
    this.appliedCoupon = null;
    this.notify();
    if (window.soundEngine) window.soundEngine.playPop();
  }

  setPaymentMethod(method) {
    this.selectedPaymentMethod = method;
    this.notify();
    if (window.soundEngine) window.soundEngine.playPop();
  }

  getCalculations() {
    const itemsList = Object.values(this.items);

    // 1. Subtotals & Original MRP
    let subtotal = 0;
    let originalSubtotal = 0;

    itemsList.forEach(({ item, quantity }) => {
      subtotal += item.price * quantity;
      originalSubtotal += (item.originalPrice || item.price) * quantity;
    });

    // 2. Direct Item Discount Savings
    const itemSavings = Math.max(0, originalSubtotal - subtotal);

    // 3. Coupon Discount Calculation
    let couponDiscount = 0;
    let freeDeliveryApplied = false;

    if (this.appliedCoupon && subtotal > 0) {
      if (this.appliedCoupon.discountPercent) {
        couponDiscount = (subtotal * this.appliedCoupon.discountPercent) / 100;
        if (this.appliedCoupon.maxDiscount) {
          couponDiscount = Math.min(couponDiscount, this.appliedCoupon.maxDiscount);
        }
      } else if (this.appliedCoupon.flatDiscount) {
        couponDiscount = Math.min(this.appliedCoupon.flatDiscount, subtotal);
      } else if (this.appliedCoupon.freeDelivery) {
        freeDeliveryApplied = true;
      }
    }
    couponDiscount = Math.round(couponDiscount);

    // 4. Delivery Fee (Free over ₹499 or via coupon)
    let standardDeliveryFee = subtotal > 0 ? (subtotal >= 499 ? 0 : 40) : 0;
    let actualDeliveryFee = freeDeliveryApplied ? 0 : standardDeliveryFee;
    let deliverySavings = standardDeliveryFee > 0 && freeDeliveryApplied ? 40 : (subtotal >= 499 && subtotal > 0 ? 40 : 0);

    // 5. Packaging & Restaurant Convenience Fee
    const packagingFee = subtotal > 0 ? 25 : 0;

    // 6. GST Calculation (Statutory 5% for Restaurant & Fast Food)
    const taxableAmount = Math.max(0, subtotal - couponDiscount);
    const gstRate = 0.05;
    const gstAmount = subtotal > 0 ? Math.round(taxableAmount * gstRate * 100) / 100 : 0;

    // 7. Total Amount Saved
    const totalAmountSaved = itemSavings + couponDiscount + (freeDeliveryApplied && standardDeliveryFee > 0 ? 40 : 0);

    // 8. Final Grand Total
    const grandTotal = subtotal > 0 ? Math.max(0, Math.round(taxableAmount + gstAmount + actualDeliveryFee + packagingFee)) : 0;

    return {
      itemsList,
      subtotal,
      originalSubtotal,
      itemSavings,
      appliedCoupon: this.appliedCoupon,
      couponDiscount,
      freeDeliveryApplied,
      standardDeliveryFee,
      actualDeliveryFee,
      deliverySavings,
      packagingFee,
      gstRate: 5,
      gstAmount,
      totalAmountSaved,
      grandTotal,
      selectedPaymentMethod: this.selectedPaymentMethod
    };
  }
}

const cart = new CartManager();
