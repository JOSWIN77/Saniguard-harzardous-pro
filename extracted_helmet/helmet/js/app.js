/**
 * SMART SAFETY HELMET - APPLICATION LOGIC & INTERACTION CONTROLLER
 * Real-time simulations, sensors, fall detection, radiation thresholds,
 * emergency escalation, telemetry dashboard, and ergonomics.
 */

(function () {
  'use strict';

  // State Management
  const AppState = {
    isWorn: true,
    radiationDoseRate: 0.12, // uSv/h
    radiationStatus: 'safe', // 'safe', 'warning', 'danger'
    fallSimState: 'normal', // 'normal', 'abnormal', 'impact', 'fall'
    fallSimTimeout: null,
    emergencyTimer: null,
    emergencySecondsLeft: 30,
    emergencyStatus: 'idle', // 'idle', 'counting', 'escalated', 'cancelled'
    liveFeedLogs: [
      { time: '12:04:31', msg: 'System initialized — ESP32 Dual-Core Ready' },
      { time: '12:04:45', msg: 'Capacitive wear detection: HELMET WORN' },
      { time: '12:05:02', msg: 'GNSS Lock established — Fix: 9 Satellites (Zone B)' },
      { time: '12:05:10', msg: 'Radiation background monitoring active: 0.12 uSv/h' },
      { time: '12:05:16', msg: 'Hazardous gas chamber baseline calibrated: 0 ppm' }
    ]
  };

  // Component Hotspots Data Dictionary
  const HotspotDetails = {
    'gas-sensor': {
      title: 'Hazardous Gas Sensor',
      category: 'Environmental Safety Module',
      icon: 'wind',
      status: 'Active (Monitoring)',
      range: 'Selected toxic/combustible gases (CO, CH4, LPG, H2S depending on sensor installed)',
      interface: 'Analog / I2C via ADC',
      description: 'The gas-sensing module monitors surrounding air quality for selected airborne contaminants that human olfactory senses cannot reliably identify or quantify. Provides threshold alarms before hazardous concentration builds up.',
      failsafe: 'Auto-zero baseline check on boot; flags sensor heater degradation fault code.'
    },
    'rad-sensor': {
      title: 'Radiation Sensor / Dosimeter',
      category: 'Ionizing Radiation Detection',
      icon: 'radioactivity',
      status: 'Active (Calibrated)',
      range: '0.05 uSv/h to 100 mSv/h (Gamma & X-Ray detection)',
      interface: 'Digital Pulse Counter / SPI',
      description: 'Specialized compact detector (Geiger-Muller tube or calibrated silicon PIN diode) measuring real-time ambient dose-rate and cumulative dose. Crucial for detecting hidden radiation that cannot be seen, smelled, or felt.',
      disclaimer: 'Note: An additional prototype module. Radiation detection is not radiation shielding. Does not replace occupational legal dosimetry.',
      failsafe: 'High-voltage bias circuit monitor with self-diagnostic heartbeat pulse.'
    },
    'imu': {
      title: '6-Axis IMU (MPU-6050)',
      category: 'Inertial Motion & Impact Unit',
      icon: 'activity',
      status: 'Active (100 Hz Sampling)',
      range: '±16g Accelerometer, ±2000°/s Gyroscope',
      interface: 'I2C Interface (Fast-mode 400 kHz)',
      description: 'Combines 3-axis accelerometer and 3-axis gyroscope to track head movement, orientation, sudden high-G impacts, abnormal deceleration during a fall, and subsequent worker immobility.',
      failsafe: 'High-pass filtering to distinguish normal walking/head-turning from severe impact and free-fall spikes.'
    },
    'gps': {
      title: 'GPS / GNSS Module',
      category: 'Worker Location Tracking',
      icon: 'map-pin',
      status: 'Connected (9 Satellites)',
      range: 'Horizontal Accuracy: ~2.5m (Outdoor)',
      interface: 'UART Serial @ 9600 baud',
      description: 'Provides exact geographic coordinates (Latitude, Longitude, Altitude, Site Zone) of the worker to rapid emergency response teams during accident triggers or manual SOS activation.',
      failsafe: 'Reports last known good coordinate if satellite line-of-sight is lost indoors.'
    },
    'temp-hum': {
      title: 'Temp & Humidity Sensor',
      category: 'Microclimate & Heat Stress',
      icon: 'thermometer',
      status: 'Active (31°C / 68% RH)',
      range: '-40°C to +80°C (±0.5°C), 0-100% RH (±2%)',
      interface: 'I2C / Single-bus digital',
      description: 'Monitors microclimate within the helmet shell and ambient hazardous environment to calculate heat index and warn workers of impending heat stroke or extreme cold risk.',
      failsafe: 'Out-of-range sensor clamping with thermal drift compensation.'
    },
    'wear-sensor': {
      title: 'Wear-Detection Sensor',
      category: 'Worker Compliance & Power State',
      icon: 'user-check',
      status: 'Worn (Active)',
      range: 'Capacitive proximity / Head contact microswitch',
      interface: 'GPIO Digital Interrupt',
      description: 'Determines whether the safety helmet is actively placed on the worker\'s head. Automatically shifts sensors between full active monitoring and battery-saving standby, eliminating false positive alerts when resting on a shelf.',
      failsafe: 'Debounce timing prevents false off-head triggers during helmet adjustment.'
    },
    'esp32': {
      title: 'ESP32 Microcontroller',
      category: 'Central Processing & Wireless Gateway',
      icon: 'cpu',
      status: 'Online (240 MHz Dual-Core)',
      range: 'Wi-Fi 802.11 b/g/n (2.4 GHz) & BLE 4.2',
      interface: 'SPI, I2C, UART, ADC, GPIO, PWM',
      description: 'The computational brain of the helmet. Executes local sensor fusion algorithms, threshold comparisons, real-time OLED updates, audio buzzer triggers, and transmits emergency telemetry to site supervisory dashboards.',
      failsafe: 'Hardware Watchdog Timer (WDT) with auto-recovery in under 200 ms.'
    },
    'battery': {
      title: 'Li-Ion Battery Pack',
      category: 'Power Management System',
      icon: 'battery-charging',
      status: '78% (Estimated 8.5h Remaining)',
      range: '3.7V Nominal, Integrated BMS Protection',
      interface: 'I2C Fuel Gauge IC (MAX17048)',
      description: 'Lightweight rechargeable battery. Crucially mounted in the rear lower cradle of the helmet to serve as an ergonomic counter-balance to front-mounted optics and electronics, mitigating forward neck torque.',
      failsafe: 'Over-charge, over-discharge, short-circuit, and cell thermal shutdown protections.'
    },
    'sos-button': {
      title: 'Emergency SOS Button',
      category: 'Manual Duress Alert',
      icon: 'alert-circle',
      status: 'Armed (Ready)',
      range: 'Tactile momentary push-button switch',
      interface: 'Direct GPIO Hardware Interrupt',
      description: 'A protected, high-visibility tactile button on the helmet side. Allows the worker to immediately broadcast an SOS panic distress signal with live coordinates to safety supervisors if trapped or in peril.',
      failsafe: 'Long-press hold (2 seconds) prevents accidental triggers while brushing against obstacles.'
    },
    'oled-display': {
      title: 'Front OLED Telemetry Display',
      category: 'Visual Worker Feedback',
      icon: 'monitor',
      status: 'Active ([SAFE] 0.12 uSv/h)',
      range: '0.96" Monochrome 128x64 pixels',
      interface: 'I2C Interface',
      description: 'Front-facing ultra-low-power OLED screen that provides immediate visual confirmation of active hazards, radiation dose-rate, battery life, and helmet communication state without needing a separate handheld receiver.',
      failsafe: 'Burn-in prevention pixel shifting with auto-dimming during low battery.'
    }
  };

  // Initialize all DOM handlers and interactive components
  document.addEventListener('DOMContentLoaded', function () {
    setupStickyNav();
    setupMobileMenu();
    setupHotspotInspector();
    setupRadiationSimulator();
    setupFallDetectionSimulator();
    setupWearDetectionToggle();
    setupEmergencyWorkflow();
    setupWeightCalculator();
    setupReportAccordion();
    setupLiveDashboardModal();
    setupTelemetryClock();
  });

  // 1. Sticky Nav & Scroll Spy
  function setupStickyNav() {
    const nav = document.querySelector('.site-nav');
    if (!nav) return;

    window.addEventListener('scroll', function () {
      if (window.scrollY > 40) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
      updateActiveNavLink();
    });
  }

  function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const scrollY = window.pageYOffset;

    sections.forEach((current) => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 120;
      const sectionId = current.getAttribute('id');
      const navLink = document.querySelector(`.nav-link[href*="${sectionId}"]`);

      if (navLink) {
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
          navLink.classList.add('active');
        } else {
          navLink.classList.remove('active');
        }
      }
    });
  }

  // 2. Mobile Menu Drawer
  function setupMobileMenu() {
    const toggleBtn = document.querySelector('.nav-toggle-btn');
    const drawer = document.querySelector('.mobile-menu-drawer');
    if (!toggleBtn || !drawer) return;

    toggleBtn.addEventListener('click', function () {
      drawer.classList.toggle('open');
      const isOpen = drawer.classList.contains('open');
      toggleBtn.setAttribute('aria-expanded', isOpen);
    });

    drawer.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        drawer.classList.remove('open');
      });
    });
  }

  // 3. Hotspot Inspector
  function setupHotspotInspector() {
    const hotspots = document.querySelectorAll('.hotspot-pin');
    const titleEl = document.getElementById('inspector-title');
    const catEl = document.getElementById('inspector-category');
    const descEl = document.getElementById('inspector-desc');
    const statusValEl = document.getElementById('inspector-status-val');
    const rangeValEl = document.getElementById('inspector-range-val');
    const ifaceValEl = document.getElementById('inspector-iface-val');
    const failsafeValEl = document.getElementById('inspector-failsafe-val');

    hotspots.forEach((pin) => {
      pin.addEventListener('click', function () {
        hotspots.forEach((p) => p.classList.remove('active'));
        this.classList.add('active');

        const componentId = this.getAttribute('data-component');
        const data = HotspotDetails[componentId];
        if (!data) return;

        if (titleEl) titleEl.textContent = data.title;
        if (catEl) catEl.textContent = data.category;
        if (descEl) {
          descEl.innerHTML = data.description + (data.disclaimer ? `<br><br><strong style="color:var(--status-danger); font-size:0.85rem;">${data.disclaimer}</strong>` : '');
        }
        if (statusValEl) statusValEl.textContent = data.status;
        if (rangeValEl) rangeValEl.textContent = data.range;
        if (ifaceValEl) ifaceValEl.textContent = data.interface;
        if (failsafeValEl) failsafeValEl.textContent = data.failsafe;
      });
    });
  }

  // 4. Radiation Safety Simulator
  function setupRadiationSimulator() {
    const slider = document.getElementById('radiation-slider');
    const readout = document.getElementById('rad-readout-val');
    const statusBadge = document.getElementById('rad-status-badge');
    const stateCards = document.querySelectorAll('.radiation-state-box');
    const dashRadValue = document.getElementById('dash-rad-val');
    const dashRadBadge = document.getElementById('dash-rad-badge');

    if (!slider) return;

    slider.addEventListener('input', function () {
      const val = parseFloat(this.value);
      AppState.radiationDoseRate = val;
      if (readout) readout.textContent = val.toFixed(2) + ' µSv/h';

      let status = 'safe';
      if (val >= 0.25 && val <= 2.5) {
        status = 'warning';
      } else if (val > 2.5) {
        status = 'danger';
      }
      AppState.radiationStatus = status;

      // Update State Box Highlights
      stateCards.forEach((card) => {
        card.classList.toggle('active', card.getAttribute('data-rad-state') === status);
      });

      // Update 3D Helmet LED
      if (window.SmartHelmet3D) {
        window.SmartHelmet3D.setLedStatus(status);
      }

      // Update Dashboard Metric if present
      if (dashRadValue) dashRadValue.textContent = val.toFixed(2) + ' µSv/h';
      if (dashRadBadge) {
        dashRadBadge.className = 'badge ' + (status === 'safe' ? 'badge-safe' : status === 'warning' ? 'badge-warning' : 'badge-danger');
        dashRadBadge.textContent = status.toUpperCase();
      }

      if (statusBadge) {
        statusBadge.className = 'badge ' + (status === 'safe' ? 'badge-safe' : status === 'warning' ? 'badge-warning' : 'badge-danger');
        statusBadge.textContent = status.toUpperCase();
      }
    });
  }

  // 5. Fall Detection Simulator
  function setupFallDetectionSimulator() {
    const triggerBtn = document.getElementById('btn-sim-fall');
    const resetBtn = document.getElementById('btn-reset-fall');
    const stateCards = document.querySelectorAll('.fall-state-card');
    const sequenceSteps = document.querySelectorAll('.sequence-step');
    const alertBox = document.getElementById('fall-alert-banner');
    const gyroDisplay = document.getElementById('gyro-angle-display');

    if (!triggerBtn) return;

    triggerBtn.addEventListener('click', function () {
      runFallSimulationSequence();
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        resetFallSimulation();
      });
    }

    function runFallSimulationSequence() {
      clearTimeout(AppState.fallSimTimeout);
      triggerBtn.disabled = true;
      triggerBtn.textContent = 'Simulating Sequence...';

      // Step 1: Normal Movement
      setFallState('normal', 0);
      updateGyro(0, 0, 1.0);

      // Step 2: Abnormal Acceleration (Free fall drop) after 900ms
      AppState.fallSimTimeout = setTimeout(() => {
        setFallState('abnormal', 1);
        updateGyro(15, 30, 0.2); // Low-G freefall

        // Step 3: Hard Impact after 1600ms
        AppState.fallSimTimeout = setTimeout(() => {
          setFallState('impact', 2);
          updateGyro(85, -45, 6.8); // High-G spike impact

          // Step 4: Fall Detected & Immobility after 2500ms
          AppState.fallSimTimeout = setTimeout(() => {
            setFallState('fall', 3);
            updateGyro(92, -12, 0.98); // Resting horizontal on ground
            if (alertBox) alertBox.style.display = 'flex';
            triggerBtn.disabled = false;
            triggerBtn.textContent = 'Re-Run Fall Simulation';

            // Also trigger emergency modal banner
            triggerEmergencyAlert('FALL DETECTED', 'WORKER-014', 'SITE ZONE B');
          }, 1200);
        }, 1000);
      }, 900);
    }

    function setFallState(stateName, stepIndex) {
      AppState.fallSimState = stateName;
      stateCards.forEach((card) => {
        card.classList.toggle('active', card.getAttribute('data-fall-state') === stateName);
      });
      sequenceSteps.forEach((step, idx) => {
        step.classList.toggle('active', idx <= stepIndex);
      });
    }

    function updateGyro(pitch, roll, gForce) {
      if (gyroDisplay) {
        gyroDisplay.textContent = `Pitch: ${pitch}° | Roll: ${roll}° | Total: ${gForce.toFixed(2)}g`;
      }
    }

    function resetFallSimulation() {
      clearTimeout(AppState.fallSimTimeout);
      setFallState('normal', 0);
      updateGyro(0, 0, 1.0);
      if (alertBox) alertBox.style.display = 'none';
      if (triggerBtn) {
        triggerBtn.disabled = false;
        triggerBtn.textContent = 'Simulate Fall Event';
      }
    }
  }

  // 6. Wear Detection Toggle
  function setupWearDetectionToggle() {
    const toggleBtn = document.getElementById('btn-toggle-wear');
    const wearBoxes = document.querySelectorAll('.wear-state-box');
    const liveWearMetric = document.getElementById('dash-wear-val');
    const liveWearBadge = document.getElementById('dash-wear-badge');

    if (!toggleBtn) return;

    toggleBtn.addEventListener('click', function () {
      AppState.isWorn = !AppState.isWorn;

      wearBoxes.forEach((box) => {
        const isWornBox = box.classList.contains('worn');
        if (AppState.isWorn) {
          box.classList.toggle('active', isWornBox);
        } else {
          box.classList.toggle('active', !isWornBox);
        }
      });

      if (toggleBtn) {
        toggleBtn.textContent = AppState.isWorn ? 'Simulate Taking Helmet Off' : 'Simulate Wearing Helmet';
      }

      if (liveWearMetric) {
        liveWearMetric.textContent = AppState.isWorn ? 'WORN' : 'NOT WORN';
      }
      if (liveWearBadge) {
        liveWearBadge.className = 'badge ' + (AppState.isWorn ? 'badge-safe' : 'badge-danger');
        liveWearBadge.textContent = AppState.isWorn ? 'ACTIVE' : 'STANDBY';
      }

      addLiveFeedLog(AppState.isWorn ? 'Capacitive wear sensor: HELMET WORN' : 'Capacitive wear sensor: HELMET REMOVED (Standby Mode)');
    });
  }

  // 7. Accident Emergency Escalation Workflow
  function setupEmergencyWorkflow() {
    const ackBtn = document.getElementById('btn-emergency-ack');
    const escalateBtn = document.getElementById('btn-emergency-escalate');
    const statusText = document.getElementById('emergency-status-text');
    const timerDisplay = document.getElementById('emergency-timer-val');

    if (ackBtn) {
      ackBtn.addEventListener('click', function () {
        clearInterval(AppState.emergencyTimer);
        AppState.emergencyStatus = 'cancelled';
        if (statusText) statusText.innerHTML = '<span style="color:var(--status-safe)">Alert Cancelled: Worker Acknowledged Safe.</span>';
        addLiveFeedLog('Worker response received: Alert cancelled locally.');
      });
    }

    if (escalateBtn) {
      escalateBtn.addEventListener('click', function () {
        clearInterval(AppState.emergencyTimer);
        AppState.emergencyStatus = 'escalated';
        if (statusText) {
          statusText.innerHTML = '<span style="color:var(--status-danger)">NO RESPONSE — Emergency Escalated to Site Supervisor via LTE/LoRa & GPS Broadcast.</span>';
        }
        addLiveFeedLog('EMERGENCY ESCALATION: Worker non-responsive. Supervisor notified.');
      });
    }
  }

  function triggerEmergencyAlert(cause, workerId, zone) {
    const alertBox = document.getElementById('emergency-alert-card');
    const causeEl = document.getElementById('emergency-cause-val');
    const workerEl = document.getElementById('emergency-worker-val');
    const locEl = document.getElementById('emergency-loc-val');
    const statusText = document.getElementById('emergency-status-text');
    const timerDisplay = document.getElementById('emergency-timer-val');

    if (!alertBox) return;

    alertBox.style.display = 'block';
    if (causeEl) causeEl.textContent = cause;
    if (workerEl) workerEl.textContent = workerId;
    if (locEl) locEl.textContent = zone;

    AppState.emergencySecondsLeft = 30;
    AppState.emergencyStatus = 'counting';

    clearInterval(AppState.emergencyTimer);
    AppState.emergencyTimer = setInterval(() => {
      AppState.emergencySecondsLeft--;
      if (timerDisplay) timerDisplay.textContent = AppState.emergencySecondsLeft + 's';

      if (AppState.emergencySecondsLeft <= 0) {
        clearInterval(AppState.emergencyTimer);
        AppState.emergencyStatus = 'escalated';
        if (statusText) {
          statusText.innerHTML = '<span style="color:var(--status-danger); font-weight:bold;">AUTO ESCALATION: 30s Timeout Reached. GPS & SOS Broadcast Dispatched.</span>';
        }
        addLiveFeedLog('AUTO ESCALATION DISPATCHED: Worker-014 Zone B non-responsive.');
      }
    }, 1000);
  }

  // 8. Weight & Neck Ergonomics Interactive Calculator
  function setupWeightCalculator() {
    const massSlider = document.getElementById('neck-mass-slider');
    const massVal = document.getElementById('neck-mass-val');
    const forceVal = document.getElementById('neck-force-val');

    if (!massSlider) return;

    massSlider.addEventListener('input', function () {
      const massGrams = parseInt(this.value, 10);
      const massKg = massGrams / 1000;
      const forceN = massKg * 9.80665;

      if (massVal) massVal.textContent = massGrams + ' g (' + massKg.toFixed(2) + ' kg)';
      if (forceVal) forceVal.textContent = '≈ ' + forceN.toFixed(2) + ' N';
    });
  }

  // 9. Whitepaper Report Accordion
  function setupReportAccordion() {
    const headers = document.querySelectorAll('.report-header');
    headers.forEach((hdr) => {
      hdr.addEventListener('click', function () {
        const item = this.parentElement;
        const isActive = item.classList.contains('active');

        // Toggle clicked
        item.classList.toggle('active', !isActive);
      });
    });
  }

  // 10. Live Safety Dashboard Modal
  function setupLiveDashboardModal() {
    const openBtns = document.querySelectorAll('[data-open-dashboard]');
    const modal = document.getElementById('dashboard-modal');
    const closeBtn = document.querySelector('.modal-close-btn');

    openBtns.forEach((btn) => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        if (modal) modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      });
    });

    if (closeBtn && modal) {
      closeBtn.addEventListener('click', function () {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      });
    }

    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) {
          modal.classList.remove('active');
          document.body.style.overflow = '';
        }
      });
    }
  }

  // 11. Live Telemetry Clock & Feed Generator
  function setupTelemetryClock() {
    const clockEl = document.getElementById('telemetry-clock');

    setInterval(() => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      if (clockEl) clockEl.textContent = timeStr + ' UTC';
    }, 1000);
  }

  function addLiveFeedLog(message) {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    AppState.liveFeedLogs.unshift({ time: timeStr, msg: message });
    if (AppState.liveFeedLogs.length > 8) AppState.liveFeedLogs.pop();

    const feedLists = document.querySelectorAll('.feed-list');
    feedLists.forEach((list) => {
      list.innerHTML = AppState.liveFeedLogs
        .map(
          (log) => `
        <div class="feed-item">
          <span class="feed-time">${log.time}</span>
          <span class="feed-msg">${log.msg}</span>
        </div>`
        )
        .join('');
    });
  }

  // Expose global app object
  window.SmartHelmetApp = {
    AppState: AppState,
    triggerEmergencyAlert: triggerEmergencyAlert,
    addLiveFeedLog: addLiveFeedLog
  };
})();
