/**
 * Code Krafter's - Ultra-Realistic Interactive 3D Hero Scene with Three.js
 * Features a high-fidelity procedural double smash burger with glossy egg-washed brioche buns,
 * 75+ teardrop sesame seeds, char-grilled meat patties with grill marks, melting artisan cheddar cheese drips,
 * ruffled curly lettuce leaves, juicy beefsteak tomatoes, sliced purple red onions, crinkle-cut pickles,
 * orbiting golden french fries, soft contact shadow, mouse tracking tilt, 360° drag to spin, and mouse wheel zoom.
 */

class Hero3DScene {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    if (typeof THREE === 'undefined') {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (typeof THREE !== 'undefined') {
          clearInterval(interval);
          this.setup();
        } else if (attempts > 15) {
          clearInterval(interval);
          this.renderFallback();
        }
      }, 200);
      return;
    }

    this.setup();
  }

  setup() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.burgerGroup = null;
    this.particlesGroup = null;
    this.orbitingFries = [];
    this.shadowPlane = null;

    // Interaction state
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.mouse = { x: 0, y: 0 };
    this.targetRotation = { x: 0.15, y: 0.45 };
    this.currentRotation = { x: 0.15, y: 0.45 };
    this.targetZoom = 7.2;
    this.currentZoom = 7.2;
    this.clock = new THREE.Clock();

    this.init();
  }

  renderFallback() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; text-align:center; transform:perspective(800px) rotateY(-10deg);">
        <div style="font-size:7rem; filter:drop-shadow(0 15px 30px rgba(255,42,77,0.5)); animation:floatBadge 3s ease-in-out infinite alternate;">🍔</div>
        <div style="font-weight:800; font-family:'Outfit',sans-serif; font-size:1.3rem; color:#FFB800; margin-top:10px;">Code Krafter's Double Smash 3D</div>
      </div>
    `;
  }

  init() {
    const width = this.container.clientWidth || 550;
    const height = this.container.clientHeight || 520;

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    this.camera.position.set(0, 1.1, this.currentZoom);

    // 3. High Performance Renderer with antialiasing
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // 4. Studio Lighting
    this.setupLighting();

    // 5. Realistic Procedural 3D Burger
    this.createRealisticBurger();

    // 6. Realistic Contact Shadow Plane
    this.createContactShadow();

    // 7. Orbiting Golden French Fries & Sparkles
    this.createOrbitingFries();
    this.createBackgroundSparks();

    // 8. Event listeners (Mouse, Touch, Wheel Zoom)
    this.bindEvents();

    // 9. Render Loop
    this.animate();
  }

  setupLighting() {
    // 1. Ambient Warm Room Light
    const ambientLight = new THREE.AmbientLight(0xfff6ec, 1.4);
    this.scene.add(ambientLight);

    // 2. Key Studio Light (Warm Appetizing Sunlight)
    const keyLight = new THREE.DirectionalLight(0xfffae6, 2.5);
    keyLight.position.set(5, 9, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 25;
    keyLight.shadow.bias = -0.001;
    this.scene.add(keyLight);

    // 3. Fill Light (Soft cool light from left)
    const fillLight = new THREE.DirectionalLight(0xdbeafe, 1.0);
    fillLight.position.set(-6, 4, 3);
    this.scene.add(fillLight);

    // 4. Rim / Kicker Light (Fast Food Neon Red glow for edges)
    const rimLight = new THREE.PointLight(0xff2a4d, 3.2, 18);
    rimLight.position.set(-5, 3, -4);
    this.scene.add(rimLight);

    // 5. Golden Bounce Light from bottom
    const bounceLight = new THREE.PointLight(0xffb800, 2.8, 14);
    bounceLight.position.set(0, -3.5, 3.5);
    this.scene.add(bounceLight);

    // 6. Subtle Cyber Cyan Accent
    const cyanLight = new THREE.PointLight(0x00e5ff, 1.8, 12);
    cyanLight.position.set(4, -1.5, -3);
    this.scene.add(cyanLight);
  }

  createContactShadow() {
    // Realistic soft circular shadow under burger
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
    grad.addColorStop(0.4, 'rgba(0, 0, 0, 0.35)');
    grad.addColorStop(0.8, 'rgba(0, 0, 0, 0.08)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const shadowTex = new THREE.CanvasTexture(canvas);
    const shadowGeo = new THREE.PlaneGeometry(5.2, 5.2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false
    });

    this.shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowPlane.rotation.x = -Math.PI / 2;
    this.shadowPlane.position.y = -1.6;
    this.scene.add(this.shadowPlane);
  }

  createRealisticBurger() {
    this.burgerGroup = new THREE.Group();

    // -------------------------------------------------------------
    // REALISTIC MATERIALS SETUP
    // -------------------------------------------------------------
    // Golden Egg-Washed Brioche Bun Material with subtle specular sheen
    const bunMaterial = new THREE.MeshStandardMaterial({
      color: 0xd28236,
      roughness: 0.32,
      metalness: 0.04,
      side: THREE.DoubleSide
    });

    const bunInsideMaterial = new THREE.MeshStandardMaterial({
      color: 0xfde3b5,
      roughness: 0.6,
      side: THREE.DoubleSide
    });

    // Char-Grilled Beef Patty Material with rugged finish
    const pattyMaterial = new THREE.MeshStandardMaterial({
      color: 0x38190d,
      roughness: 0.88,
      metalness: 0.12,
      side: THREE.DoubleSide
    });

    // Melting Cheddar Cheese Material with rich gloss
    const cheeseMaterial = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      roughness: 0.22,
      metalness: 0.15,
      side: THREE.DoubleSide
    });

    // Fresh Wavy Crisp Lettuce Material
    const lettuceMaterial = new THREE.MeshStandardMaterial({
      color: 0x44b31a,
      roughness: 0.42,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    // Juicy Red Beefsteak Tomato Slice Material
    const tomatoMaterial = new THREE.MeshStandardMaterial({
      color: 0xd91424,
      roughness: 0.18,
      metalness: 0.14,
      side: THREE.DoubleSide
    });

    // Toasted Sesame Seeds Material
    const sesameMaterial = new THREE.MeshStandardMaterial({
      color: 0xfff3df,
      roughness: 0.35,
      metalness: 0.05
    });

    // Purple Sliced Red Onion Material
    const onionPurpleMat = new THREE.MeshStandardMaterial({
      color: 0x8a185b,
      roughness: 0.3,
      side: THREE.DoubleSide
    });
    const onionWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xf5f3ea,
      roughness: 0.4,
      side: THREE.DoubleSide
    });

    // Crinkle-Cut Pickles Material
    const pickleMat = new THREE.MeshStandardMaterial({
      color: 0x4f6b1e,
      roughness: 0.45,
      metalness: 0.1,
      side: THREE.DoubleSide
    });

    // -------------------------------------------------------------
    // 1. TOP BRIOCHE BUN
    // -------------------------------------------------------------
    const topBunGeo = new THREE.SphereGeometry(1.68, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.46);
    const topBun = new THREE.Mesh(topBunGeo, bunMaterial);
    topBun.position.y = 1.25;
    topBun.scale.set(1.12, 0.82, 1.12);
    topBun.castShadow = true;
    this.burgerGroup.add(topBun);

    // Toasted underside of top bun
    const topBunFlatGeo = new THREE.CircleGeometry(1.68 * 1.12 * 0.99, 36);
    const topBunFlat = new THREE.Mesh(topBunFlatGeo, bunInsideMaterial);
    topBunFlat.rotation.x = Math.PI / 2;
    topBunFlat.position.y = 1.25;
    this.burgerGroup.add(topBunFlat);

    // 75+ Teardrop Sesame Seeds scattered organically on bun dome
    const seedGeo = new THREE.ConeGeometry(0.045, 0.12, 8);
    seedGeo.rotateX(Math.PI / 2);

    for (let i = 0; i < 75; i++) {
      const seed = new THREE.Mesh(seedGeo, sesameMaterial);
      const theta = Math.random() * Math.PI * 2;
      const phi = 0.15 + Math.random() * 0.85; // Upper dome
      const r = 1.705;

      seed.position.x = r * Math.sin(phi) * Math.cos(theta) * 1.12;
      seed.position.y = (r * Math.cos(phi) * 0.82) + 1.25;
      seed.position.z = r * Math.sin(phi) * Math.sin(theta) * 1.12;

      // Natural tilt
      seed.lookAt(
        seed.position.x * 1.25,
        seed.position.y + 0.4,
        seed.position.z * 1.25
      );
      seed.scale.setScalar(0.85 + Math.random() * 0.35);
      this.burgerGroup.add(seed);
    }

    // -------------------------------------------------------------
    // 2. SLICED RED ONIONS & CRINKLE PICKLES
    // -------------------------------------------------------------
    this.createOnionRings(onionPurpleMat, onionWhiteMat, 1.12);
    this.createPickles(pickleMat, 1.08);

    // -------------------------------------------------------------
    // 3. JUICY BEEFSTEAK TOMATO SLICES (2 overlapping thick slices)
    // -------------------------------------------------------------
    const tomatoGeo = new THREE.CylinderGeometry(0.78, 0.78, 0.13, 32);
    const tomato1 = new THREE.Mesh(tomatoGeo, tomatoMaterial);
    tomato1.position.set(-0.6, 0.96, 0.22);
    tomato1.rotation.set(0.06, 0.3, 0.08);
    tomato1.castShadow = true;
    this.burgerGroup.add(tomato1);

    const tomato2 = new THREE.Mesh(tomatoGeo, tomatoMaterial);
    tomato2.position.set(0.62, 0.95, -0.18);
    tomato2.rotation.set(-0.05, -0.4, -0.06);
    tomato2.castShadow = true;
    this.burgerGroup.add(tomato2);

    // -------------------------------------------------------------
    // 4. UPPER MELTED CHEDDAR CHEESE SLICE (Overhanging dripping corners)
    // -------------------------------------------------------------
    const cheese1 = this.createRealisticCheese(cheeseMaterial, 0.78, 0.05);
    this.burgerGroup.add(cheese1);

    // -------------------------------------------------------------
    // 5. UPPER JUICY SMASH PATTY (Charred grill texture)
    // -------------------------------------------------------------
    const patty1 = this.createCharredPatty(pattyMaterial, 0.48);
    this.burgerGroup.add(patty1);

    // -------------------------------------------------------------
    // 6. RUFFLED CRISPY CURLY LETTUCE
    // -------------------------------------------------------------
    const lettuce = this.createRuffledLettuce(lettuceMaterial, 0.18);
    this.burgerGroup.add(lettuce);

    // -------------------------------------------------------------
    // 7. LOWER MELTED CHEDDAR CHEESE SLICE (Turned 45 degrees)
    // -------------------------------------------------------------
    const cheese2 = this.createRealisticCheese(cheeseMaterial, -0.02, Math.PI / 4);
    this.burgerGroup.add(cheese2);

    // -------------------------------------------------------------
    // 8. LOWER DOUBLE SMASH PATTY
    // -------------------------------------------------------------
    const patty2 = this.createCharredPatty(pattyMaterial, -0.32);
    this.burgerGroup.add(patty2);

    // -------------------------------------------------------------
    // 9. BOTTOM BRIOCHE BUN
    // -------------------------------------------------------------
    const botBunGeo = new THREE.CylinderGeometry(1.68, 1.52, 0.52, 48);
    const botBun = new THREE.Mesh(botBunGeo, bunMaterial);
    botBun.position.y = -0.78;
    botBun.castShadow = true;
    this.burgerGroup.add(botBun);

    // Rounded bottom heel
    const botTorusGeo = new THREE.TorusGeometry(1.48, 0.16, 20, 48);
    const botTorus = new THREE.Mesh(botTorusGeo, bunMaterial);
    botTorus.rotation.x = Math.PI / 2;
    botTorus.position.y = -1.0;
    this.burgerGroup.add(botTorus);

    // Toasted top surface of bottom bun
    const botBunFlatGeo = new THREE.CircleGeometry(1.66, 36);
    const botBunFlat = new THREE.Mesh(botBunFlatGeo, bunInsideMaterial);
    botBunFlat.rotation.x = -Math.PI / 2;
    botBunFlat.position.y = -0.51;
    this.burgerGroup.add(botBunFlat);

    this.scene.add(this.burgerGroup);
  }

  createCharredPatty(material, yPos) {
    const group = new THREE.Group();
    // High poly cylinder with uneven edge roughness
    const pattyGeo = new THREE.CylinderGeometry(1.72, 1.74, 0.38, 48, 4);

    // Deform vertices subtly for authentic meat smash texture
    const pos = pattyGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const uY = pos.getY(i);
      // Only deform the outer rim
      if (Math.abs(uY) < 0.18) {
        const noise = (Math.sin(i * 12.5) + Math.cos(i * 7.8)) * 0.035;
        pos.setX(i, pos.getX(i) * (1 + noise));
        pos.setZ(i, pos.getZ(i) * (1 + noise));
      }
    }
    pattyGeo.computeVertexNormals();

    const patty = new THREE.Mesh(pattyGeo, material);
    patty.position.y = yPos;
    patty.castShadow = true;
    group.add(patty);

    // Add charred grill marks on top of patty
    const grillMarkMat = new THREE.MeshBasicMaterial({
      color: 0x180b06,
      transparent: true,
      opacity: 0.65
    });

    for (let g = -1.0; g <= 1.0; g += 0.5) {
      const markGeo = new THREE.BoxGeometry(0.08, 0.02, 2.6);
      const mark = new THREE.Mesh(markGeo, grillMarkMat);
      mark.position.set(g * 0.8, yPos + 0.192, 0);
      mark.rotation.y = 0.45;
      group.add(mark);
    }

    return group;
  }

  createRealisticCheese(material, yPos, rotationAngle = 0) {
    const group = new THREE.Group();
    group.rotation.y = rotationAngle;

    // Main melted cheese square
    const cheesePlaneGeo = new THREE.BoxGeometry(2.45, 0.06, 2.45);
    const mainCheese = new THREE.Mesh(cheesePlaneGeo, material);
    mainCheese.position.y = yPos;
    mainCheese.castShadow = true;
    group.add(mainCheese);

    // Drooping and dripping corners
    const drops = [
      { x: 1.24, z: 0, rotZ: -0.45, len: 0.55 },
      { x: -1.24, z: 0, rotZ: 0.45, len: 0.6 },
      { x: 0, z: 1.24, rotX: 0.45, len: 0.5 },
      { x: 0, z: -1.24, rotX: -0.45, len: 0.58 },
      // Corner drips
      { x: 1.0, z: 1.0, rotZ: -0.4, rotX: 0.4, len: 0.65 },
      { x: -1.0, z: 1.0, rotZ: 0.4, rotX: 0.4, len: 0.55 },
      { x: 1.0, z: -1.0, rotZ: -0.4, rotX: -0.4, len: 0.5 }
    ];

    drops.forEach((d) => {
      const dripGeo = new THREE.ConeGeometry(0.35, d.len, 12);
      dripGeo.rotateX(Math.PI);
      const drip = new THREE.Mesh(dripGeo, material);
      drip.position.set(d.x * 0.95, yPos - d.len * 0.45, d.z * 0.95);
      if (d.rotZ) drip.rotation.z = d.rotZ;
      if (d.rotX) drip.rotation.x = d.rotX;
      drip.castShadow = true;
      group.add(drip);
    });

    return group;
  }

  createRuffledLettuce(material, yPos) {
    const lettuceGroup = new THREE.Group();
    const count = 14;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const leafGeo = new THREE.SphereGeometry(0.62, 16, 12, 0, Math.PI, 0, Math.PI * 0.6);
      const leaf = new THREE.Mesh(leafGeo, material);

      leaf.scale.set(1.5, 0.28, 1.35);
      leaf.position.x = Math.cos(angle) * 1.62;
      leaf.position.y = yPos + Math.sin(i * 1.8) * 0.08;
      leaf.position.z = Math.sin(angle) * 1.62;

      leaf.rotation.y = angle;
      leaf.rotation.x = 0.35 + Math.sin(i) * 0.15;
      leaf.castShadow = true;
      lettuceGroup.add(leaf);
    }

    return lettuceGroup;
  }

  createOnionRings(purpleMat, whiteMat, yPos) {
    const onionGroup = new THREE.Group();
    const ringConfigs = [
      { x: -0.4, z: -0.3, rot: 0.15, rad: 0.65 },
      { x: 0.5, z: 0.35, rot: -0.2, rad: 0.6 }
    ];

    ringConfigs.forEach((cfg) => {
      // Purple outer ring
      const outerGeo = new THREE.TorusGeometry(cfg.rad, 0.05, 12, 32);
      const outerRing = new THREE.Mesh(outerGeo, purpleMat);
      outerRing.rotation.x = Math.PI / 2 + cfg.rot;
      outerRing.position.set(cfg.x, yPos, cfg.z);
      onionGroup.add(outerRing);

      // White inner ring
      const innerGeo = new THREE.TorusGeometry(cfg.rad - 0.06, 0.04, 12, 32);
      const innerRing = new THREE.Mesh(innerGeo, whiteMat);
      innerRing.rotation.x = Math.PI / 2 + cfg.rot;
      innerRing.position.set(cfg.x, yPos, cfg.z);
      onionGroup.add(innerRing);
    });

    this.burgerGroup.add(onionGroup);
  }

  createPickles(material, yPos) {
    const pickleGroup = new THREE.Group();
    const picklePositions = [
      { x: 0.7, z: -0.6, rot: 0.2 },
      { x: -0.7, z: 0.65, rot: -0.25 }
    ];

    picklePositions.forEach((pos) => {
      const pickleGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.07, 24);
      const pickle = new THREE.Mesh(pickleGeo, material);
      pickle.position.set(pos.x, yPos, pos.z);
      pickle.rotation.set(0.1, pos.rot, 0.08);
      pickle.castShadow = true;
      pickleGroup.add(pickle);
    });

    this.burgerGroup.add(pickleGroup);
  }

  createOrbitingFries() {
    const fryMaterial = new THREE.MeshStandardMaterial({
      color: 0xffbe1a,
      roughness: 0.28,
      metalness: 0.08
    });

    const fryGeo = new THREE.BoxGeometry(0.18, 1.45, 0.18);

    for (let i = 0; i < 7; i++) {
      const fry = new THREE.Mesh(fryGeo, fryMaterial);
      const angle = (i / 7) * Math.PI * 2;
      const radius = 2.9 + Math.random() * 0.9;

      fry.position.x = Math.cos(angle) * radius;
      fry.position.y = (Math.random() - 0.5) * 2.8;
      fry.position.z = Math.sin(angle) * radius;

      fry.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      fry.userData = {
        radius: radius,
        speed: 0.35 + Math.random() * 0.45,
        angle: angle,
        rotSpeedX: (Math.random() - 0.5) * 0.03,
        rotSpeedY: (Math.random() - 0.5) * 0.03,
        baseY: fry.position.y
      };

      this.scene.add(fry);
      this.orbitingFries.push(fry);
    }
  }

  createBackgroundSparks() {
    this.particlesGroup = new THREE.Group();
    const sparkGeo = new THREE.OctahedronGeometry(0.09, 0);
    const colors = [0xff2a4d, 0xffb800, 0x00e5ff, 0xffffff, 0x10b981];

    for (let i = 0; i < 40; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: colors[i % colors.length],
        transparent: true,
        opacity: 0.75
      });
      const spark = new THREE.Mesh(sparkGeo, mat);

      spark.position.set(
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 11,
        (Math.random() - 0.5) * 8 - 2
      );

      spark.userData = {
        speedY: 0.006 + Math.random() * 0.016,
        rotSpeed: 0.02 + Math.random() * 0.03,
        initialY: spark.position.y
      };

      this.particlesGroup.add(spark);
    }

    this.scene.add(this.particlesGroup);
  }

  bindEvents() {
    // 1. Mouse movement tracking for 3D parallax tilt
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      if (!this.isDragging) {
        this.targetRotation.y = this.mouse.x * 0.7;
        this.targetRotation.x = -this.mouse.y * 0.45 + 0.15;
      }
    });

    // 2. Drag to rotate burger 360 degrees
    const el = this.renderer.domElement;

    const onPointerDown = (clientX, clientY) => {
      this.isDragging = true;
      this.previousMousePosition = { x: clientX, y: clientY };
    };

    const onPointerMove = (clientX, clientY) => {
      if (!this.isDragging) return;
      const deltaX = clientX - this.previousMousePosition.x;
      const deltaY = clientY - this.previousMousePosition.y;

      this.targetRotation.y += deltaX * 0.009;
      this.targetRotation.x += deltaY * 0.009;

      this.previousMousePosition = { x: clientX, y: clientY };
    };

    const onPointerUp = () => {
      this.isDragging = false;
    };

    // Mouse events
    el.addEventListener('mousedown', (e) => onPointerDown(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => onPointerMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', onPointerUp);

    // Touch events for mobile
    el.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        onPointerDown(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && this.isDragging) {
        onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('touchend', onPointerUp);

    // Mouse wheel zoom in/out to inspect burger
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.targetZoom += e.deltaY * 0.004;
      this.targetZoom = Math.max(5.5, Math.min(9.5, this.targetZoom));
    }, { passive: false });

    // Responsive resize
    window.addEventListener('resize', () => this.onResize());
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const elapsedTime = this.clock.getElapsedTime();

    // Smooth Burger Rotation Interpolation (lerp)
    this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * 0.06;
    this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.06;

    // Smooth Zoom Interpolation
    this.currentZoom += (this.targetZoom - this.currentZoom) * 0.08;
    this.camera.position.z = this.currentZoom;

    if (this.burgerGroup) {
      this.burgerGroup.rotation.x = this.currentRotation.x;

      if (!this.isDragging) {
        // Idle gentle float & spin
        this.burgerGroup.rotation.y = this.currentRotation.y + Math.sin(elapsedTime * 0.6) * 0.22;
      } else {
        this.burgerGroup.rotation.y = this.currentRotation.y;
      }

      // Breathing floating movement
      const floatY = Math.sin(elapsedTime * 1.6) * 0.12;
      this.burgerGroup.position.y = floatY;

      // Contact shadow scale pulsation in sync with float
      if (this.shadowPlane) {
        const shadowScale = 1 - floatY * 0.35;
        this.shadowPlane.scale.set(shadowScale, shadowScale, shadowScale);
      }
    }

    // Orbiting French Fries
    this.orbitingFries.forEach((fry) => {
      fry.userData.angle += fry.userData.speed * 0.02;
      fry.position.x = Math.cos(fry.userData.angle) * fry.userData.radius;
      fry.position.z = Math.sin(fry.userData.angle) * fry.userData.radius;
      fry.position.y = fry.userData.baseY + Math.sin(elapsedTime * 2 + fry.userData.angle) * 0.2;

      fry.rotation.x += fry.userData.rotSpeedX;
      fry.rotation.y += fry.userData.rotSpeedY;
    });

    // Floating Sparkle Particles
    if (this.particlesGroup) {
      this.particlesGroup.children.forEach((spark) => {
        spark.position.y += spark.userData.speedY;
        spark.rotation.x += spark.userData.rotSpeed;
        spark.rotation.y += spark.userData.rotSpeed;

        if (spark.position.y > 6.5) {
          spark.position.y = -6.5;
        }
      });
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('hero-3d-canvas');
  if (container) {
    window.hero3D = new Hero3DScene('hero-3d-canvas');
  }
});
