# 🍔 Code Krafter's - 3D Fast Food & Beverages Web Application

A responsive, colorful, 3D fast food ordering interface built with **HTML5, CSS3, and JavaScript**.

Inspired by global fast-food brands like **KFC** and **McDonald's**, Code Krafter's brings a modern digital ordering experience with an interactive 3D WebGL centerpiece, 3D card tilt effects, itemized cart breakdowns (subtotal, 5% GST, savings calculation), and multiple payment options.

---

## ✨ Features

### 1. 🎨 Visual Aesthetics & 3D Centerpiece
- **Interactive 3D Three.js Burger**: Procedural 3D layered burger with sesame bun, melting cheddar cheese, grilled patties, crispy lettuce, tomato slices, orbiting golden fries, and sparkling particles. Supports **mouse tracking tilt**, **touch rotation**, and **360° drag to spin**.
- **CSS 3D Card Hover Effects**: True 3D perspective with interactive tilt (`rotateX`, `rotateY`) and dynamic specular lighting sheens on hover.
- **Vibrant Fast-Food Aesthetic**: Neon glowing orbs, flame red (`#FF2A4D`), golden cheddar (`#FFB800`), neon tangerine (`#FF6B00`), and dark fast-food surfaces.

### 2. 🍗 Comprehensive Menu & Categories
35+ delicious items across 7 fast-food categories:
1. 🍔 **Krafter Burgers** (Double Smash Byte, Fiery Peri-Peri Zinger, Truffle Mushroom Glitch...)
2. 🍗 **Crispy Chicken & Buckets** (8-Piece Golden Bucket, Hot Wings, Popcorn Bites...)
3. 🍕 **Craft Pan Pizzas** (Pepperoni Overdrive, Margherita Supreme, Paneer Tikka...)
4. 🍟 **Loaded Fries & Sides** (Cheesy Lava Volcano, Cajun Waffle Fries, Onion Rings...)
5. 🥤 **Shakes & Beverages** (Oreo Thickshake, Lotus Biscoff Shake, Blue Citrus...)
6. 🍨 **Krafter Sweet Treats** (Choco Lava Volcano, Hot Apple Cinnamon Pie...)
7. 🍱 **Mega Value Combos** (Gamer's All-Nighter Box, Krafter Duo Feast...)

### 3. 🛒 Advanced Cart & Price Breakdown
- **Real-Time Price Calculations**:
  - Item MRP Total & Discounted Subtotal
  - **Total Amount Saved** highlighted in emerald green
  - **Statutory Fast Food GST (5%)** itemized
  - Delivery Fee (Free on orders above ₹499 or via coupon)
  - Eco-Friendly Packaging Fee
  - Grand Total Payable
- **Coupon Code System**:
  - `KRAFTER50`: 50% OFF up to ₹150 (Min ₹299)
  - `BYTEBITE`: Flat ₹100 Discount (Min ₹399)
  - `FREEDEL`: Free Delivery (Min ₹199)
- **Payment Method Selection**:
  - ⚡ Instant UPI / QR (GPay, PhonePe, Paytm)
  - 💳 Credit / Debit Card (Visa, Mastercard, RuPay)
  - 💵 Cash on Delivery (COD)
  - 📱 Net Banking & Wallets

### 4. 🚀 Interactive UI & Sound Engine
- **Fly-to-Cart Animation**: Smooth animated curved projectile when adding items.
- **Web Audio API Sound Engine**: Tactile sound effects for clicks, adds to cart, fast-food crunch, and celebratory order completion fanfare (with mute/unmute toggle).
- **Celebratory Checkout**: Confetti explosion, generated order ID (`#CK-XXXXX`), and live order tracker simulation.
- **Search & Filters**: Instant debounced search bar, 100% vegetarian filter toggle, and sorting options (price, rating, popularity).

---

## 🚀 Quick Start / How to Run

### Method 1: Local HTTP Server (Recommended)
Open your terminal in the project directory and run:

```bash
# Using Python
python -m http.server 8080
```
Then navigate to: **`http://localhost:8080/`**

### Method 2: Direct Browser Launch
Simply open `index.html` directly in any modern browser (Chrome, Edge, Firefox, Safari).

---

## 📂 Project Structure

```
code-krafters/
├── index.html              # Semantic HTML5 layout
├── README.md               # Documentation & usage guide
├── css/
│   └── styles.css          # 3D perspective styles, glassmorphism, responsive grid
└── js/
    ├── data.js             # 35+ item fast food dataset with high-res photos
    ├── sound.js            # Web Audio API sound synthesizer
    ├── three-scene.js      # Three.js 3D interactive hero burger scene
    ├── cart.js             # Cart state, calculations, GST & savings
    └── app.js              # UI controller, filtering, search, modals & checkout
```
