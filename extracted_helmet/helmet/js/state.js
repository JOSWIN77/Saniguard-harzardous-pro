/**
 * SMART SAFETY HELMET - CENTRAL APPLICATION STATE & SOUND SYNTHESIZER
 * Manages global reactive state, pub-sub events, telemetry logs, and Web Audio SFX
 */

(function () {
  'use strict';

  // Central Application Reactive State
  const AppState = {
    isWorn: true,
    radiationDoseRate: 0.12, // uSv/h
    radiationStatus: 'safe', // 'safe', 'warning', 'danger'
    fallSimState: 'normal', // 'normal', 'abnormal', 'impact', 'fall'
    fallSimTimeout: null,
    emergencyTimer: null,
    emergencySecondsLeft: 30,
    emergencyStatus: 'idle', // 'idle', 'counting', 'escalated', 'cancelled'
    helmetColor: 0xfacc15, // Default Safety Yellow
    current3DView: 'perspective',
    liveFeedLogs: [
      { time: '12:04:31', msg: 'System initialized — ESP32 Dual-Core (FreeRTOS) Ready' },
      { time: '12:04:45', msg: 'Capacitive wear detection: HELMET WORN' },
      { time: '12:05:02', msg: 'GNSS Lock established — Fix: 9 Satellites (Site Zone B)' },
      { time: '12:05:10', msg: 'Radiation background monitoring active: 0.12 µSv/h' },
      { time: '12:05:16', msg: 'Hazardous gas chamber baseline calibrated: 0 ppm' }
    ],

    // Pub/Sub Event System
    _listeners: {},
    on: function (event, callback) {
      if (!this._listeners[event]) this._listeners[event] = [];
      this._listeners[event].push(callback);
    },
    emit: function (event, data) {
      if (this._listeners[event]) {
        this._listeners[event].forEach((cb) => {
          try { cb(data); } catch (e) { console.error('Event error [' + event + ']:', e); }
        });
      }
    }
  };

  // Web Audio Procedural Sound Synthesizer (No external audio files needed!)
  const SoundFX = {
    ctx: null,
    init: function () {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    },
    // Geiger counter click
    geigerClick: function () {
      try {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800 + Math.random() * 400, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.015);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.015);
      } catch (e) {}
    },
    // Emergency dual-tone siren pulse
    emergencyBeep: function (freq = 880) {
      try {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.18);
      } catch (e) {}
    },
    // Gentle UI click
    uiClick: function () {
      try {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.04);
      } catch (e) {}
    }
  };

  // Hardware Component Hotspots Dictionary
  const HotspotDetails = {
    'hud': {
      title: 'Integrated OLED HUD & Ultra-Bright LED Work Lamp',
      category: 'Visual Worker Feedback & Illumination',
      icon: 'monitor',
      status: 'Active (128x64 Micro-OLED + 350 Lumen Cree LED)',
      range: 'Monochrome high-contrast display; 45m flood beam',
      interface: 'I2C Interface (SSD1306) + PWM Strobe Controller',
      description: 'The front brow module houses a curved shock-resistant micro-OLED display providing real-time telemetry (radiation dose-rate, toxic gas ppm, battery percentage, GPS lock) and a high-efficiency emergency work light with textured faceted lens.',
      failsafe: 'Auto-dimming burn-in protection; high-efficiency thermal heat sink prevents forehead heat transfer.'
    },
    'gas-sensor': {
      title: 'Explosion-Proof Hazardous Gas Chamber',
      category: 'Environmental Safety Module',
      icon: 'wind',
      status: 'Active (Continuous Diffusion Sampling)',
      range: 'Toxic & combustible gases (CO: 0-1000 ppm, CH4: 0-100% LEL, H2S)',
      interface: 'Analog 16-bit ADC / I2C Bus',
      description: 'Specialized gas-sampling pod with a porous sintered stainless-steel mesh flame arrestor (ATEX Zone 1 compliant). Detects hazardous airborne vapors before concentration reaches toxic or explosive limits.',
      failsafe: 'Auto-zero baseline calibration on boot; flags sensor heater element degradation fault.'
    },
    'rad-sensor': {
      title: 'Ionizing Radiation Dosimeter Pod',
      category: 'Nuclear & Industrial Radiography Safety',
      icon: 'radioactivity',
      status: 'Active (Calibrated GM Pulse Counter)',
      range: '0.05 µSv/h to 100 mSv/h (Gamma & Hard X-Ray)',
      interface: 'Digital Pulse Counter / SPI Interface',
      description: 'High-sensitivity radiation detection module (miniature Geiger-Müller tube / calibrated silicon PIN diode) continuously monitoring real-time ambient dose-rate and cumulative worker exposure.',
      disclaimer: 'Prototype module. Radiation detection provides situational awareness; it does not replace statutory personal dosimeters.',
      failsafe: 'High-voltage bias generator diagnostic loop with heartbeat count validation.'
    },
    'imu': {
      title: '6-Axis IMU (MPU-6050) & ESP32 Dual-Core',
      category: 'Inertial Motion & Computation Core',
      icon: 'activity',
      status: 'Active (100 Hz Sampling Rate)',
      range: '±16g Accelerometer, ±2000°/s Gyroscope',
      interface: 'Fast-mode I2C (400 kHz) to ESP32 Tensilica LX6',
      description: 'The central computational engine combines 3-axis accelerometer and 3-axis gyroscope sensors to execute local fall-detection algorithms: free-fall detection, severe shock impact, and subsequent immobility verification.',
      failsafe: 'Hardware Watchdog Timer (WDT) with auto-recovery in <150 ms; high-pass motion filtering.'
    },
    'gps': {
      title: 'GPS / GNSS Ceramic Patch Antenna',
      category: 'Worker Geo-Location & Incident Positioning',
      icon: 'map-pin',
      status: 'Connected (9 Satellites Locked)',
      range: 'Horizontal Accuracy: ~2.5m (Zone B Fix)',
      interface: 'UART Serial @ 9600 bps with NMEA parser',
      description: 'Crown-mounted high-gain ceramic patch antenna positioned at the highest point of the helmet for unobstructed sky view. Dispatches live geographic coordinates during emergency triggers or SOS button presses.',
      failsafe: 'Last-known-position dead reckoning latching if satellite line-of-sight is obstructed indoors.'
    },
    'temp-hum': {
      title: 'Microclimate & Heat Stress Sensor',
      category: 'Ergonomic Thermal Monitoring',
      icon: 'thermometer',
      status: 'Active (31.2°C / 66% Relative Humidity)',
      range: '-40°C to +85°C (±0.3°C), 0-100% RH (±2%)',
      interface: 'I2C Interface (Sensirion SHT31)',
      description: 'Monitors microclimate within the inner helmet shell and ambient hazardous environment to calculate physiological Heat Index (HI) and warn workers before heat stroke occurs.',
      failsafe: 'Thermal drift compensation with out-of-bounds sensor clamp.'
    },
    'wear-sensor': {
      title: 'Capacitive Head-Wear Detection',
      category: 'Worker Compliance & Power Optimization',
      icon: 'user-check',
      status: 'Worn (System Active 100 Hz)',
      range: 'Capacitive proximity pad / microswitch',
      interface: 'GPIO Digital Interrupt with debouncing',
      description: 'Detects whether the helmet is actively fitted on the worker\'s head. Automatically switches telemetry between active 100 Hz monitoring and deep-sleep standby mode, eliminating false alarms when stored on a shelf.',
      failsafe: '5-second debounce delay prevents false triggers during helmet position adjustments.'
    },
    'battery': {
      title: 'LiFePO4 Ergonomic Counterbalance Battery',
      category: 'Power Management & Biomechanical Balance',
      icon: 'battery-charging',
      status: '78% (Estimated 9.2 Hours Runtime)',
      range: '3.2V 3200 mAh, Integrated BMS + USB-C Magnetic Port',
      interface: 'I2C Fuel Gauge (MAX17048)',
      description: 'Mounted at the lower rear nape of the helmet to serve as a precise ergonomic counter-weight to front-mounted optics and sensors, achieving a 50:50 center-of-gravity balance that prevents neck strain.',
      failsafe: 'Triple-redundant BMS: over-charge, over-discharge, short-circuit, and cell thermal cut-off.'
    },
    'sos-button': {
      title: 'Tactical Emergency SOS Button',
      category: 'Manual Duress Alert Switch',
      icon: 'alert-circle',
      status: 'Armed & Guarded',
      range: 'High-visibility tactile switch with protective collar',
      interface: 'Direct Non-Maskable GPIO Interrupt',
      description: 'A recessed, glove-operable red emergency button on the lateral rim. Depressing for 2 seconds immediately broadcasts high-priority SOS telemetry with live GPS coordinates to site safety supervisors.',
      failsafe: '2-second hold-down threshold prevents accidental actuation by brushes or bumps.'
    },
    'ratchet': {
      title: '6-Point Suspension & Ratchet Adjustment',
      category: 'Structural Impact Protection & Fit',
      icon: 'shield',
      status: 'Secured (54-62 cm Head Size Range)',
      range: 'High-tensile nylon webbing cradle + knurled dial',
      interface: 'Mechanical suspension with EPS crumple liner',
      description: 'A 6-point shock-absorbing suspension harness suspends the helmet 30mm above the skull to dissipate kinetic shock. Features a one-handed knurled ratchet adjustment knob at the nape.',
      failsafe: 'Compliant with EN 397 shock absorption and lateral deformation standards.'
    }
  };

  // Add Log Entry Helper
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

    AppState.emit('logAdded', { time: timeStr, msg: message });
  }

  // Expose to global scope
  window.SmartHelmetState = {
    AppState: AppState,
    SoundFX: SoundFX,
    HotspotDetails: HotspotDetails,
    addLiveFeedLog: addLiveFeedLog
  };

  // Backward compatibility
  window.AppState = AppState;
  window.HotspotDetails = HotspotDetails;
})();
