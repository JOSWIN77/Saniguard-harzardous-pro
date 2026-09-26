/**
 * SMART SAFETY HELMET - 3D INTERACTIVE VISUALIZER
 * Three.js Procedural PBR Model, Exploded View, View Transitions & Fallback
 */

(function () {
  'use strict';

  let scene, camera, renderer, helmetGroup;
  let layerShell, layerElectronics, layerPadding, layerStraps;
  let oledMaterial, ledMaterial, shellMaterial;
  let isExploded = false;
  let currentView = 'front';
  let targetRotation = { x: 0.1, y: 0.3 };
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };
  let animationFrameId;

  // Initialize Three.js or Fallback Canvas
  function init() {
    const container = document.getElementById('helmet-hero-canvas');
    if (!container) return;

    // Check for Three.js availability
    if (typeof THREE === 'undefined') {
      console.warn('Three.js not loaded, initiating high-fidelity 2D canvas fallback.');
      initCanvasFallback(container);
      return;
    }

    try {
      const width = container.clientWidth || 500;
      const height = container.clientHeight || 380;

      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
      camera.position.set(0, 1.2, 3.8);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      setupLighting();
      buildHelmetModel();
      setupInteractions(container);
      setupViewControls();

      window.addEventListener('resize', onWindowResize);
      animate();
    } catch (e) {
      console.error('WebGL error:', e);
      initCanvasFallback(container);
    }
  }

  // Setup Lighting with Studio Aesthetics
  function setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    // Warm key light
    const keyLight = new THREE.DirectionalLight(0xfff5ea, 1.2);
    keyLight.position.set(3, 4, 3);
    keyLight.castShadow = true;
    scene.add(keyLight);

    // Cyan rim light for tech aesthetic
    const rimLight = new THREE.DirectionalLight(0x06b6d4, 1.4);
    rimLight.position.set(-3, 2, -2);
    scene.add(rimLight);

    // Safety yellow accent fill
    const yellowFill = new THREE.PointLight(0xfacc15, 0.8, 10);
    yellowFill.position.set(0, -1, 2);
    scene.add(yellowFill);
  }

  // Build Procedural 3D Smart Helmet Model
  function buildHelmetModel() {
    helmetGroup = new THREE.Group();
    scene.add(helmetGroup);

    // Layer Groups for Exploded View
    layerShell = new THREE.Group();
    layerElectronics = new THREE.Group();
    layerPadding = new THREE.Group();
    layerStraps = new THREE.Group();

    helmetGroup.add(layerShell);
    helmetGroup.add(layerElectronics);
    helmetGroup.add(layerPadding);
    helmetGroup.add(layerStraps);

    // ----------------------------------------------------
    // LAYER 1: OUTER HIGH-IMPACT ABS SHELL (Vibrant Safety Yellow)
    // ----------------------------------------------------
    shellMaterial = new THREE.MeshStandardMaterial({
      color: 0xfacc15, // Safety Yellow
      roughness: 0.3,
      metalness: 0.1,
      bumpScale: 0.05
    });

    const blackHousingMaterial = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.4,
      metalness: 0.3
    });

    // Main Dome
    const domeGeom = new THREE.SphereGeometry(1, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.52);
    domeGeom.scale(1, 0.85, 1.15);
    const dome = new THREE.Mesh(domeGeom, shellMaterial);
    dome.castShadow = true;
    layerShell.add(dome);

    // Reinforced Top Ridge
    const ridgeGeom = new THREE.CylinderGeometry(0.08, 0.12, 1.8, 16);
    ridgeGeom.rotateX(Math.PI / 2);
    ridgeGeom.scale(1, 0.7, 1);
    const ridge = new THREE.Mesh(ridgeGeom, shellMaterial);
    ridge.position.set(0, 0.82, 0.05);
    layerShell.add(ridge);

    // Front Visor / Brim
    const brimGeom = new THREE.CylinderGeometry(1.08, 1.12, 0.06, 48, 1, true, 0, Math.PI);
    brimGeom.rotateY(-Math.PI / 2);
    const brim = new THREE.Mesh(brimGeom, shellMaterial);
    brim.position.set(0, -0.05, 0.3);
    brim.scale.set(1.02, 1, 1.25);
    layerShell.add(brim);

    // Side Air Vents
    const ventGeom = new THREE.BoxGeometry(0.04, 0.05, 0.3);
    const leftVent = new THREE.Mesh(ventGeom, blackHousingMaterial);
    leftVent.position.set(0.85, 0.35, 0);
    leftVent.rotation.z = -0.3;
    layerShell.add(leftVent);

    const rightVent = leftVent.clone();
    rightVent.position.set(-0.85, 0.35, 0);
    rightVent.rotation.z = 0.3;
    layerShell.add(rightVent);

    // ----------------------------------------------------
    // LAYER 2: SENSORS & ELECTRONICS LAYER
    // ----------------------------------------------------
    // Front OLED Display Strip
    const oledGeom = new THREE.BoxGeometry(0.48, 0.14, 0.05);
    oledMaterial = new THREE.MeshStandardMaterial({
      color: 0x050b14,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.6,
      roughness: 0.2
    });
    const oledDisplay = new THREE.Mesh(oledGeom, oledMaterial);
    oledDisplay.position.set(0, 0.28, 1.14);
    oledDisplay.rotation.x = -0.2;
    layerElectronics.add(oledDisplay);

    // OLED Bezel Frame
    const bezelGeom = new THREE.BoxGeometry(0.52, 0.18, 0.04);
    const bezel = new THREE.Mesh(bezelGeom, blackHousingMaterial);
    bezel.position.set(0, 0.28, 1.12);
    bezel.rotation.x = -0.2;
    layerElectronics.add(bezel);

    // Status RGB LEDs
    ledMaterial = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 0.9
    });
    const ledGeom = new THREE.SphereGeometry(0.03, 16, 16);
    const statusLed = new THREE.Mesh(ledGeom, ledMaterial);
    statusLed.position.set(0.28, 0.3, 1.08);
    layerElectronics.add(statusLed);

    // ESP32 Microcontroller Board (Center Interior)
    const espGeom = new THREE.BoxGeometry(0.38, 0.04, 0.32);
    const pcbMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f5132,
      roughness: 0.5,
      metalness: 0.2
    });
    const esp32 = new THREE.Mesh(espGeom, pcbMaterial);
    esp32.position.set(0, 0.45, 0);
    layerElectronics.add(esp32);

    // IMU Sensor (MPU-6050 chip on ESP32)
    const imuGeom = new THREE.BoxGeometry(0.08, 0.02, 0.08);
    const chipMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.2 });
    const imuChip = new THREE.Mesh(imuGeom, chipMat);
    imuChip.position.set(0.06, 0.48, 0.04);
    layerElectronics.add(imuChip);

    // Radiation Sensor / Dosimeter Tube Module (Side Mounted Sensor Pod)
    const radGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.35, 16);
    radGeom.rotateZ(Math.PI / 2);
    const radMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      emissive: 0xef4444,
      emissiveIntensity: 0.2,
      metalness: 0.6
    });
    const radSensor = new THREE.Mesh(radGeom, radMat);
    radSensor.position.set(0.65, 0.35, -0.15);
    layerElectronics.add(radSensor);

    // Gas Sensor Chamber (Opposite Lateral Pod)
    const gasGeom = new THREE.CylinderGeometry(0.07, 0.07, 0.12, 16);
    const gasMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.7, roughness: 0.3 });
    const gasSensor = new THREE.Mesh(gasGeom, gasMat);
    gasSensor.position.set(-0.65, 0.35, -0.15);
    layerElectronics.add(gasSensor);

    // Rear Battery Counter-Balance Unit (Ergonomic mass balance)
    const battGeom = new THREE.BoxGeometry(0.42, 0.15, 0.12);
    const battMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
    const battery = new THREE.Mesh(battGeom, battMat);
    battery.position.set(0, 0.22, -1.02);
    layerElectronics.add(battery);

    // GPS Ceramic Patch Antenna (Top Crown)
    const gpsGeom = new THREE.BoxGeometry(0.14, 0.03, 0.14);
    const gpsMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.2, metalness: 0.5 });
    const gps = new THREE.Mesh(gpsGeom, gpsMat);
    gps.position.set(0, 0.75, -0.1);
    layerElectronics.add(gps);

    // SOS Emergency Button (High visibility red tactile switch on lateral rim)
    const sosGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.03, 16);
    const sosMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x991b1b, roughness: 0.3 });
    const sosBtn = new THREE.Mesh(sosGeom, sosMat);
    sosBtn.position.set(0.72, 0.1, 0.2);
    sosBtn.rotation.z = -Math.PI / 3;
    layerElectronics.add(sosBtn);

    // ----------------------------------------------------
    // LAYER 3: INNER SHOCK-ABSORBING PADDING (High density EPS Foam)
    // ----------------------------------------------------
    const paddingGeom = new THREE.SphereGeometry(0.92, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.48);
    paddingGeom.scale(1, 0.82, 1.12);
    const paddingMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.9,
      metalness: 0.0
    });
    const padding = new THREE.Mesh(paddingGeom, paddingMat);
    padding.position.set(0, 0.02, 0);
    layerPadding.add(padding);

    // ----------------------------------------------------
    // LAYER 4: STRAP SYSTEM & ERGONOMIC CHIN STRAP
    // ----------------------------------------------------
    const strapMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    const curvePoints = [
      new THREE.Vector3(0.68, 0.05, 0.1),
      new THREE.Vector3(0.45, -0.45, 0.15),
      new THREE.Vector3(0.0, -0.58, 0.2),
      new THREE.Vector3(-0.45, -0.45, 0.15),
      new THREE.Vector3(-0.68, 0.05, 0.1)
    ];
    const strapCurve = new THREE.CatmullRomCurve3(curvePoints);
    const strapGeom = new THREE.TubeGeometry(strapCurve, 32, 0.025, 8, false);
    const strap = new THREE.Mesh(strapGeom, strapMat);
    layerStraps.add(strap);

    // Chin Cup
    const cupGeom = new THREE.BoxGeometry(0.18, 0.06, 0.08);
    const cup = new THREE.Mesh(cupGeom, blackHousingMaterial);
    cup.position.set(0, -0.58, 0.2);
    layerStraps.add(cup);

    // Set initial orientation
    helmetGroup.rotation.y = 0.35;
    helmetGroup.rotation.x = 0.1;
  }

  // Setup Mouse Drag & Touch Interactions
  function setupInteractions(container) {
    container.addEventListener('mousedown', function (e) {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousemove', function (e) {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      targetRotation.y += deltaX * 0.008;
      targetRotation.x += deltaY * 0.008;
      targetRotation.x = Math.max(-0.6, Math.min(0.8, targetRotation.x));

      previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', function () {
      isDragging = false;
    });

    // Touch Support
    container.addEventListener('touchstart', function (e) {
      if (e.touches.length === 1) {
        isDragging = true;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    });

    window.addEventListener('touchmove', function (e) {
      if (!isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - previousMousePosition.x;
      const deltaY = e.touches[0].clientY - previousMousePosition.y;

      targetRotation.y += deltaX * 0.008;
      targetRotation.x += deltaY * 0.008;
      targetRotation.x = Math.max(-0.6, Math.min(0.8, targetRotation.x));

      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    });

    window.addEventListener('touchend', function () {
      isDragging = false;
    });
  }

  // Setup View Switcher Buttons
  function setupViewControls() {
    const buttons = document.querySelectorAll('[data-helmet-view]');
    buttons.forEach((btn) => {
      btn.addEventListener('click', function () {
        const view = this.getAttribute('data-helmet-view');
        switchView(view);

        buttons.forEach((b) => b.classList.remove('active'));
        this.classList.add('active');
      });
    });
  }

  // Camera & Model View Switcher
  function switchView(view) {
    currentView = view;
    if (!helmetGroup) return;

    // Reset Exploded separation unless in exploded view
    if (view === 'exploded') {
      isExploded = true;
      shellMaterial.wireframe = false;
      shellMaterial.transparent = false;
      shellMaterial.opacity = 1.0;
    } else {
      isExploded = false;
    }

    if (view === 'front') {
      targetRotation = { x: 0.05, y: 0.0 };
      resetMaterials();
    } else if (view === 'side') {
      targetRotation = { x: 0.0, y: Math.PI / 2 };
      resetMaterials();
    } else if (view === 'back') {
      targetRotation = { x: 0.1, y: Math.PI };
      resetMaterials();
    } else if (view === 'internal') {
      targetRotation = { x: 0.35, y: 0.6 };
      // Make shell semi-transparent wireframe to inspect internal PCB & sensors
      if (shellMaterial) {
        shellMaterial.transparent = true;
        shellMaterial.opacity = 0.25;
        shellMaterial.wireframe = true;
      }
    } else if (view === 'exploded') {
      targetRotation = { x: 0.25, y: 0.5 };
    }
  }

  function resetMaterials() {
    if (shellMaterial) {
      shellMaterial.transparent = false;
      shellMaterial.opacity = 1.0;
      shellMaterial.wireframe = false;
    }
  }

  // Animation Loop with Smooth Damping
  function animate() {
    animationFrameId = requestAnimationFrame(animate);

    if (helmetGroup) {
      // Smooth rotation damping
      helmetGroup.rotation.y += (targetRotation.y - helmetGroup.rotation.y) * 0.08;
      helmetGroup.rotation.x += (targetRotation.x - helmetGroup.rotation.x) * 0.08;

      // Gentle auto-rotation when user is not dragging
      if (!isDragging && currentView === 'front') {
        targetRotation.y += 0.0015;
      }

      // Smooth Exploded View Layer Separation
      const targetShellY = isExploded ? 0.65 : 0.0;
      const targetElecY = isExploded ? 0.25 : 0.0;
      const targetPaddingY = isExploded ? -0.15 : 0.0;
      const targetStrapsY = isExploded ? -0.55 : 0.0;

      layerShell.position.y += (targetShellY - layerShell.position.y) * 0.08;
      layerElectronics.position.y += (targetElecY - layerElectronics.position.y) * 0.08;
      layerPadding.position.y += (targetPaddingY - layerPadding.position.y) * 0.08;
      layerStraps.position.y += (targetStrapsY - layerStraps.position.y) * 0.08;

      // Pulse LED status light
      if (ledMaterial) {
        const time = Date.now() * 0.003;
        ledMaterial.emissiveIntensity = 0.6 + Math.sin(time) * 0.35;
      }
    }

    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  function onWindowResize() {
    const container = document.getElementById('helmet-hero-canvas');
    if (!container || !renderer || !camera) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  // ----------------------------------------------------
  // HIGH FIDELITY 2D CANVAS FALLBACK
  // ----------------------------------------------------
  function initCanvasFallback(container) {
    container.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.width = container.clientWidth || 500;
    canvas.height = container.clientHeight || 380;
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let angle = 0;

    function drawFallback() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2 + 10;

      // Tech Grid Background
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Outer Shell Yellow Dome
      ctx.save();
      ctx.translate(cx, cy);

      // Chin Strap
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 30, 85, 0.2, Math.PI - 0.2);
      ctx.stroke();

      // Main Helmet Dome
      const grad = ctx.createLinearGradient(-120, -100, 120, 50);
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.3, '#facc15');
      grad.addColorStop(0.8, '#eab308');
      grad.addColorStop(1, '#ca8a04');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, -10, 120, 95, 0, Math.PI, 0);
      ctx.fill();

      // Brim
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.ellipse(0, -10, 135, 20, 0, 0, Math.PI * 2);
      ctx.fill();

      // Top Center Ridge
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.ellipse(0, -75, 24, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      // OLED Display (Front)
      ctx.fillStyle = '#050b14';
      ctx.fillRect(-65, -35, 130, 26);
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-65, -35, 130, 26);

      // OLED Digital Text
      ctx.fillStyle = '#06b6d4';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText('[SAFE] 0.12 uSv/h | 78%', -60, -18);

      // Status LED (Blinking Green)
      ctx.fillStyle = '#10b981';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(55, -22, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Sensor Pods
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(80, -30, 20, 35); // Gas pod
      ctx.fillRect(-100, -30, 20, 35); // Rad pod

      ctx.restore();

      requestAnimationFrame(drawFallback);
    }

    drawFallback();
  }

  // Expose global controller
  window.SmartHelmet3D = {
    init: init,
    switchView: switchView,
    setLedStatus: function (status) {
      if (!ledMaterial) return;
      if (status === 'safe') {
        ledMaterial.color.setHex(0x10b981);
        ledMaterial.emissive.setHex(0x10b981);
      } else if (status === 'warning') {
        ledMaterial.color.setHex(0xf59e0b);
        ledMaterial.emissive.setHex(0xf59e0b);
      } else if (status === 'danger') {
        ledMaterial.color.setHex(0xef4444);
        ledMaterial.emissive.setHex(0xef4444);
      }
    }
  };

  // Auto initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
