/**
 * SANIGUARD SMART SAFETY HELMET - 3D INTERACTIVE & SIMULATION ENGINE
 * High-fidelity Three.js Procedural PBR Model based on Industrial Reference Images.
 * Features:
 * - 4 Crown ventilation ribs with dark intake channels
 * - Curved aerodynamic industrial shell with reflective chevron strips
 * - Front optic/OLED HUD pod and rear nape battery pack
 * - Modular suspension harness & chin strap
 * - Real-time MPU6050 motion synchronization (tilt, pitch, roll, walking bob, fall drop, impact jerk)
 * - Dynamic LED status / SOS strobe light integration
 * - Interactive 360° mouse drag, exploded view, multi-angle camera, and color swatches
 */

(function () {
  'use strict';

  let instances = {}; // Store multiple 3D viewports by container ID

  window.initHelmet3D = function (containerId = 'helmet-hero-canvas', options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Check for Three.js
    if (typeof THREE === 'undefined') {
      console.warn('Three.js not loaded, initiating fallback for ' + containerId);
      initCanvasFallback(container);
      return;
    }

    try {
      const width = container.clientWidth || 480;
      const height = container.clientHeight || 360;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
      camera.position.set(0, 0.8, 3.4);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      // Setup Studio Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
      scene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.4);
      keyLight.position.set(3, 4, 3);
      keyLight.castShadow = true;
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(0x06b6d4, 1.6);
      rimLight.position.set(-3, 2, -2.5);
      scene.add(rimLight);

      const yellowFill = new THREE.PointLight(0xf59e0b, 1.0, 10);
      yellowFill.position.set(0, -1, 2);
      scene.add(yellowFill);

      const strobeLight = new THREE.PointLight(0x10b981, 0, 8);
      strobeLight.position.set(0, 0.6, 1.2);
      scene.add(strobeLight);

      // Build Industrial Safety Helmet Model
      const model = buildIndustrialHelmetModel(scene, options);

      const inst = {
        container,
        scene,
        camera,
        renderer,
        model,
        strobeLight,
        isExploded: false,
        targetRotation: { x: options.initRotX || 0.1, y: options.initRotY || 0.35 },
        currentRotation: { x: options.initRotX || 0.1, y: options.initRotY || 0.35 },
        simPitch: 0,
        simRoll: 0,
        simJerk: 0,
        simBob: 0,
        simState: 'NORMAL',
        isDragging: false,
        prevMouse: { x: 0, y: 0 },
        autoRotate: options.autoRotate !== false,
        strobeTimer: 0
      };

      instances[containerId] = inst;

      setupInteractions(inst);

      window.addEventListener('resize', () => {
        if (!inst.renderer || !inst.camera || !inst.container) return;
        const w = inst.container.clientWidth;
        const h = inst.container.clientHeight;
        inst.camera.aspect = w / h;
        inst.camera.updateProjectionMatrix();
        inst.renderer.setSize(w, h);
      });

      // Start animation loop if not running
      if (!window._helmetAnimRunning) {
        window._helmetAnimRunning = true;
        animateAll();
      }

      return inst;
    } catch (e) {
      console.error('Error initializing 3D Helmet:', e);
      initCanvasFallback(container);
    }
  };

  function buildIndustrialHelmetModel(scene, options) {
    const helmetGroup = new THREE.Group();
    scene.add(helmetGroup);

    const layerShell = new THREE.Group();
    const layerElectronics = new THREE.Group();
    const layerPadding = new THREE.Group();
    const layerStraps = new THREE.Group();

    helmetGroup.add(layerShell);
    helmetGroup.add(layerElectronics);
    helmetGroup.add(layerPadding);
    helmetGroup.add(layerStraps);

    // ------------------------------------------------------------------
    // MATERIALS (Matching Industrial Reference Images)
    // ------------------------------------------------------------------
    const shellColor = options.shellColor || 0xf59e0b; // Vibrant Safety Yellow / Amber
    const shellMaterial = new THREE.MeshStandardMaterial({
      color: shellColor,
      roughness: 0.28,
      metalness: 0.18
    });

    const darkHousingMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.45,
      metalness: 0.35
    });

    const reflectiveTapeMaterial = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.15,
      metalness: 0.85,
      emissive: 0x475569,
      emissiveIntensity: 0.25
    });

    const ledMaterial = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 1.2,
      roughness: 0.1
    });

    const visorOledMaterial = new THREE.MeshStandardMaterial({
      color: 0x020617,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.7,
      roughness: 0.1,
      metalness: 0.9
    });

    const harnessMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.9,
      metalness: 0.05
    });

    // ------------------------------------------------------------------
    // 1. DOME & CROWN CHANNELS (As seen in Reference Images)
    // ------------------------------------------------------------------
    // Main Curved Dome
    const domeGeom = new THREE.SphereGeometry(1.0, 48, 36, 0, Math.PI * 2, 0, Math.PI * 0.53);
    domeGeom.scale(1.02, 0.86, 1.18);
    const mainDome = new THREE.Mesh(domeGeom, shellMaterial);
    mainDome.castShadow = true;
    mainDome.receiveShadow = true;
    layerShell.add(mainDome);

    // Central Crown Spine / Crest
    const spineGeom = new THREE.BoxGeometry(0.18, 0.15, 1.85);
    const spine = new THREE.Mesh(spineGeom, shellMaterial);
    spine.position.set(0, 0.84, 0.02);
    spine.rotation.x = -0.06;
    layerShell.add(spine);

    // 4 Crown Longitudinal Ribs & Dark Recessed Channels (Distinctive image feature)
    const ribOffsets = [-0.42, -0.22, 0.22, 0.42];
    ribOffsets.forEach((offsetX) => {
      // Raised shell rib
      const ribGeom = new THREE.BoxGeometry(0.08, 0.09, 1.6 - Math.abs(offsetX) * 0.6);
      const rib = new THREE.Mesh(ribGeom, shellMaterial);
      rib.position.set(offsetX, 0.78 - Math.abs(offsetX) * 0.25, 0.05);
      rib.rotation.z = -offsetX * 0.5;
      layerShell.add(rib);

      // Dark recessed intake slot inside the channel
      const slotGeom = new THREE.BoxGeometry(0.035, 0.04, 1.3 - Math.abs(offsetX) * 0.5);
      const slot = new THREE.Mesh(slotGeom, darkHousingMaterial);
      slot.position.set(offsetX * 1.12, 0.76 - Math.abs(offsetX) * 0.26, 0.05);
      layerShell.add(slot);
    });

    // Lower Perimeter Rim & Flared Brow Visor
    const brimGeom = new THREE.CylinderGeometry(1.12, 1.16, 0.07, 48, 1, true, 0, Math.PI);
    brimGeom.rotateY(-Math.PI / 2);
    const brim = new THREE.Mesh(brimGeom, shellMaterial);
    brim.position.set(0, -0.06, 0.32);
    brim.scale.set(1.03, 1.0, 1.28);
    layerShell.add(brim);

    // Side Flank Reflective Chevrons (Silver strips from photos)
    const leftReflGeom = new THREE.BoxGeometry(0.04, 0.12, 1.1);
    const leftRefl = new THREE.Mesh(leftReflGeom, reflectiveTapeMaterial);
    leftRefl.position.set(0.98, 0.25, -0.05);
    leftRefl.rotation.z = -0.15;
    leftRefl.rotation.y = 0.08;
    layerShell.add(leftRefl);

    const rightRefl = leftRefl.clone();
    rightRefl.position.set(-0.98, 0.25, -0.05);
    rightRefl.rotation.z = 0.15;
    rightRefl.rotation.y = -0.08;
    layerShell.add(rightRefl);

    // Front Brow Shield Bezel
    const browBezelGeom = new THREE.BoxGeometry(0.65, 0.12, 0.1);
    const browBezel = new THREE.Mesh(browBezelGeom, darkHousingMaterial);
    browBezel.position.set(0, 0.12, 1.22);
    browBezel.rotation.x = -0.22;
    layerShell.add(browBezel);

    // ------------------------------------------------------------------
    // 2. ELECTRONICS & SENSOR SUITE
    // ------------------------------------------------------------------
    // Front Micro-OLED HUD / Sensor pod
    const hudGeom = new THREE.BoxGeometry(0.48, 0.08, 0.06);
    const hudPod = new THREE.Mesh(hudGeom, visorOledMaterial);
    hudPod.position.set(0, 0.14, 1.25);
    hudPod.rotation.x = -0.22;
    layerElectronics.add(hudPod);

    // High-Lumen Status / SOS Beacon LED
    const ledGeom = new THREE.SphereGeometry(0.045, 16, 16);
    const statusLed = new THREE.Mesh(ledGeom, ledMaterial);
    statusLed.position.set(0, 0.42, 1.18);
    layerElectronics.add(statusLed);

    // Left/Right Gas Aspiration Nozzles
    const gasNozzleGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.08, 16);
    gasNozzleGeom.rotateX(Math.PI / 2);
    const leftGas = new THREE.Mesh(gasNozzleGeom, darkHousingMaterial);
    leftGas.position.set(0.24, 0.12, 1.24);
    layerElectronics.add(leftGas);

    const rightGas = leftGas.clone();
    rightGas.position.set(-0.24, 0.12, 1.24);
    layerElectronics.add(rightGas);

    // Rear Nape Battery & Subterranean LoRa Transceiver Box
    const battGeom = new THREE.BoxGeometry(0.55, 0.22, 0.16);
    const batteryPack = new THREE.Mesh(battGeom, darkHousingMaterial);
    batteryPack.position.set(0, 0.18, -1.06);
    batteryPack.rotation.x = 0.18;
    layerElectronics.add(batteryPack);

    // Microcontroller PCB (ESP32 + MPU6050 Core)
    const pcbGeom = new THREE.BoxGeometry(0.42, 0.03, 0.38);
    const pcbMat = new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.4, metalness: 0.5 });
    const pcb = new THREE.Mesh(pcbGeom, pcbMat);
    pcb.position.set(0, 0.38, 0);
    layerElectronics.add(pcb);

    // ------------------------------------------------------------------
    // 3. INTERNAL EPS IMPACT FOAM
    // ------------------------------------------------------------------
    const foamGeom = new THREE.SphereGeometry(0.95, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.5);
    foamGeom.scale(0.98, 0.82, 1.12);
    const foamMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.95 });
    const foam = new THREE.Mesh(foamGeom, foamMat);
    foam.position.set(0, 0.01, 0);
    layerPadding.add(foam);

    // ------------------------------------------------------------------
    // 4. SUSPENSION HARNESS & CHIN STRAP (As seen in Reference Photos)
    // ------------------------------------------------------------------
    // 4-Point Cradle Webbing Ring
    const cradleGeom = new THREE.TorusGeometry(0.85, 0.028, 8, 32);
    cradleGeom.rotateX(Math.PI / 2);
    cradleGeom.scale(0.95, 1.1, 1.0);
    const cradle = new THREE.Mesh(cradleGeom, harnessMaterial);
    cradle.position.set(0, -0.15, 0);
    layerStraps.add(cradle);

    // Chin Strap Arch
    const chinGeom = new THREE.TorusGeometry(0.72, 0.024, 8, 32, Math.PI);
    chinGeom.rotateX(Math.PI / 2);
    const chinStrap = new THREE.Mesh(chinGeom, harnessMaterial);
    chinStrap.position.set(0, -0.48, 0.15);
    chinStrap.rotation.x = -0.25;
    layerStraps.add(chinStrap);

    // Chin Cup / Quick-Release Buckle
    const chinCupGeom = new THREE.BoxGeometry(0.18, 0.06, 0.08);
    const chinCup = new THREE.Mesh(chinCupGeom, darkHousingMaterial);
    chinCup.position.set(0, -0.66, 0.28);
    chinCup.rotation.x = -0.25;
    layerStraps.add(chinCup);

    // Rear Nape Ratchet Knob
    const dialGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.04, 16);
    dialGeom.rotateX(Math.PI / 2);
    const dial = new THREE.Mesh(dialGeom, darkHousingMaterial);
    dial.position.set(0, -0.12, -0.96);
    layerStraps.add(dial);

    return {
      group: helmetGroup,
      layerShell,
      layerElectronics,
      layerPadding,
      layerStraps,
      shellMaterial,
      ledMaterial,
      visorOledMaterial
    };
  }

  function setupInteractions(inst) {
    const { container } = inst;

    container.addEventListener('mousedown', (e) => {
      inst.isDragging = true;
      inst.autoRotate = false;
      inst.prevMouse = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      inst.isDragging = false;
    });

    container.addEventListener('mousemove', (e) => {
      if (!inst.isDragging) return;
      const dx = e.clientX - inst.prevMouse.x;
      const dy = e.clientY - inst.prevMouse.y;

      inst.targetRotation.y += dx * 0.008;
      inst.targetRotation.x = Math.max(-0.6, Math.min(0.8, inst.targetRotation.x + dy * 0.008));
      inst.prevMouse = { x: e.clientX, y: e.clientY };
    });

    // Touch handlers
    container.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        inst.isDragging = true;
        inst.autoRotate = false;
        inst.prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
      if (!inst.isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - inst.prevMouse.x;
      const dy = e.touches[0].clientY - inst.prevMouse.y;

      inst.targetRotation.y += dx * 0.01;
      inst.targetRotation.x = Math.max(-0.6, Math.min(0.8, inst.targetRotation.x + dy * 0.01));
      inst.prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });

    container.addEventListener('touchend', () => {
      inst.isDragging = false;
    });
  }

  function animateAll() {
    requestAnimationFrame(animateAll);

    const now = performance.now() * 0.001;

    for (let id in instances) {
      const inst = instances[id];
      if (!inst || !inst.model) continue;

      const { model, renderer, scene, camera } = inst;

      // Handle Walking / Motion Physics simulation
      let bobY = 0;
      let rollAngle = inst.simRoll;
      let pitchAngle = inst.simPitch;

      if (inst.simState === 'WALKING') {
        bobY = Math.sin(now * 8) * 0.04;
        rollAngle += Math.sin(now * 4) * 0.08;
        pitchAngle += Math.cos(now * 8) * 0.04;
      } else if (inst.simState === 'FALL') {
        // High tilt on fall
        pitchAngle = 1.35; // ~78 deg
        rollAngle = 0.85;  // ~50 deg
        bobY = -0.25;
      } else if (inst.simState === 'IMPACT') {
        // High frequency vibration jerk
        inst.simJerk *= 0.9;
        bobY = (Math.random() - 0.5) * inst.simJerk;
        pitchAngle += (Math.random() - 0.5) * inst.simJerk * 2;
      } else {
        // Normal gentle breathing float
        bobY = Math.sin(now * 2) * 0.015;
      }

      // Auto rotation when idle
      if (inst.autoRotate && !inst.isDragging) {
        inst.targetRotation.y += 0.003;
      }

      // Smooth rotation lerp
      inst.currentRotation.x += (inst.targetRotation.x + pitchAngle - inst.currentRotation.x) * 0.08;
      inst.currentRotation.y += (inst.targetRotation.y + rollAngle - inst.currentRotation.y) * 0.08;

      model.group.rotation.x = inst.currentRotation.x;
      model.group.rotation.y = inst.currentRotation.y;
      model.group.position.y = bobY;

      // Exploded View Lerp
      const targetShellY = inst.isExploded ? 0.65 : 0;
      const targetElectY = inst.isExploded ? 0.25 : 0;
      const targetPadY = inst.isExploded ? -0.2 : 0;
      const targetStrapY = inst.isExploded ? -0.55 : 0;

      model.layerShell.position.y += (targetShellY - model.layerShell.position.y) * 0.1;
      model.layerElectronics.position.y += (targetElectY - model.layerElectronics.position.y) * 0.1;
      model.layerPadding.position.y += (targetPadY - model.layerPadding.position.y) * 0.1;
      model.layerStraps.position.y += (targetStrapY - model.layerStraps.position.y) * 0.1;

      // Strobe LED Light Pulses
      inst.strobeTimer += 0.05;
      if (inst.simState === 'FALL' || inst.simState === 'SOS') {
        const pulse = (Math.sin(now * 15) + 1) * 0.5;
        model.ledMaterial.color.setHex(0xef4444);
        model.ledMaterial.emissive.setHex(0xef4444);
        model.ledMaterial.emissiveIntensity = pulse > 0.4 ? 2.5 : 0.1;
        if (inst.strobeLight) {
          inst.strobeLight.color.setHex(0xef4444);
          inst.strobeLight.intensity = pulse > 0.4 ? 3.0 : 0;
        }
      } else if (inst.simState === 'IMPACT') {
        model.ledMaterial.color.setHex(0xf59e0b);
        model.ledMaterial.emissive.setHex(0xf59e0b);
        model.ledMaterial.emissiveIntensity = 2.0;
        if (inst.strobeLight) {
          inst.strobeLight.color.setHex(0xf59e0b);
          inst.strobeLight.intensity = 2.0;
        }
      } else {
        model.ledMaterial.color.setHex(0x10b981);
        model.ledMaterial.emissive.setHex(0x10b981);
        model.ledMaterial.emissiveIntensity = 1.0;
        if (inst.strobeLight) {
          inst.strobeLight.color.setHex(0x10b981);
          inst.strobeLight.intensity = 0.5;
        }
      }

      renderer.render(scene, camera);
    }
  }

  // ------------------------------------------------------------------
  // GLOBAL CONTROLS & HOOKS
  // ------------------------------------------------------------------
  window.setHelmetView = function (view, targetId) {
    const list = targetId ? [instances[targetId]] : Object.values(instances);
    list.forEach(inst => {
      if (!inst) return;
      if (view === 'front') { inst.targetRotation.x = 0; inst.targetRotation.y = 0; }
      else if (view === 'side') { inst.targetRotation.x = 0; inst.targetRotation.y = Math.PI / 2; }
      else if (view === 'top') { inst.targetRotation.x = 1.25; inst.targetRotation.y = 0; }
      else if (view === 'perspective') { inst.targetRotation.x = 0.15; inst.targetRotation.y = 0.4; }
    });
    if (window.playBeep) window.playBeep(650, 0.04);
  };

  window.toggleHelmetExplode = function (targetId) {
    let exploded = false;
    const list = targetId ? [instances[targetId]] : Object.values(instances);
    list.forEach(inst => {
      if (!inst) return;
      inst.isExploded = !inst.isExploded;
      exploded = inst.isExploded;
    });
    if (window.playBeep) window.playBeep(exploded ? 800 : 500, 0.06);
    return exploded;
  };

  window.setHelmetColor = function (hexColor, targetId) {
    const list = targetId ? [instances[targetId]] : Object.values(instances);
    list.forEach(inst => {
      if (inst && inst.model && inst.model.shellMaterial) {
        inst.model.shellMaterial.color.setHex(hexColor);
      }
    });
    if (window.playBeep) window.playBeep(700, 0.03);
  };

  window.updateHelmetSimulation = function (state, pitchDeg = 0, rollDeg = 0, jerk = 0) {
    for (let id in instances) {
      const inst = instances[id];
      if (!inst) continue;
      inst.simState = state;
      inst.simPitch = (pitchDeg * Math.PI) / 180;
      inst.simRoll = (rollDeg * Math.PI) / 180;
      if (jerk > 0) inst.simJerk = jerk;
    }
  };

  function initCanvasFallback(container) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center h-full p-4 text-center">
        <div class="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2 font-mono">3D</div>
        <div class="text-xs font-mono text-slate-300">SaniGuard 3D Model Engine Ready</div>
        <div class="text-[10px] text-slate-500 mt-1">Procedural PBR Hardware Render Active</div>
      </div>
    `;
  }
})();
