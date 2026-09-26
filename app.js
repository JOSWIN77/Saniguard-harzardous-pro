// SaniGuard - Interactive Experience & Simulation Engine

// Initialize Lucide Icons & Core Subsystems
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }
  initHotspots();
  initSimulator();
  initCalculator();
  initFaq();
  initMobileMenu();
  initPilotForm();
});

// Mobile Menu Handler
function initMobileMenu() {
  const btn = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');
  if (btn && menu) {
    btn.addEventListener('click', () => {
      menu.classList.toggle('hidden');
    });
    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => menu.classList.add('hidden'));
    });
  }
}

// -------------------------------------------------------------
// Interactive Hardware Anatomy Hotspots
// -------------------------------------------------------------
const hotspotData = {
  gas: {
    category: 'ATMOSPHERIC SENSOR SUB-ASSEMBLY',
    code: 'NODE-GAS-01',
    title: 'Quad-Gas Micro-Aspiration Chamber',
    desc: 'Continuously draws ambient air across an array of NDIR and electrochemical sensor cells. Detects CH4 (Methane), H2S (Hydrogen Sulfide), Carbon Monoxide (CO), and Oxygen starvation in 100 milliseconds.',
    stat1: '< 100 Milliseconds',
    stat2: '0.1 PPM Resolution',
    stat3: 'Self-Zeroing Auto Calibration',
    stat4: 'ATEX Zone 0 Ex ia Certified'
  },
  hud: {
    category: 'OPTICAL DISPLAY & BIOMETRIC ARRAY',
    code: 'VISOR-HUD-V2',
    title: 'Peripheral Augmented Visor & IR Scanner',
    desc: 'Transparent organic HUD projects vital vectors (gas level bar, heading, distress beacon vector) into worker peripheral vision. Integrates non-contact forehead IR thermometry.',
    stat1: 'High-Contrast OLED',
    stat2: '±0.2°C IR Accuracy',
    stat3: 'Anti-Fog Ballistic Polycarbonate',
    stat4: 'ANSI Z87.1+ High Impact'
  },
  strobe: {
    category: 'EMERGENCY BEACON & AUDIO TRANSDUCER',
    code: 'BEACON-SOS-360',
    title: '360° Smart Strobe & Bone Conduction Intercom',
    desc: 'Ultra-bright 1200-lumen perimeter strobe shifts between status white, warning amber, and critical flashing red. Bone conduction audio enables crystal-clear hands-free comms in 110dB ambient noise.',
    stat1: '1200 Lumens Peak',
    stat2: '110dB Audio Clarity',
    stat3: 'Sub-second SOS Trigger',
    stat4: 'IP68 Waterproof'
  },
  mesh: {
    category: 'SUBTERRANEAN CONNECTIVITY NODE',
    code: 'MESH-LORA-UWB',
    title: 'LoRaWAN + UWB Mesh Transceiver',
    desc: 'Every helmet functions as an ad-hoc mesh node. Deep subterranean tunnels and steel refinery vessels route telemetry packet-by-packet to surface gateways with micro-positioning accuracy of ±30cm.',
    stat1: '5+ km Sub-GHz Line of Sight',
    stat2: '±30 cm UWB Micro-location',
    stat3: 'Zero Cellular Dependency',
    stat4: 'AES-256 Encrypted Stream'
  },
  battery: {
    category: 'ENERGY STORAGE SYSTEM',
    code: 'PWR-LIFEPO4-HOTSWAP',
    title: '48-Hour Hot-Swappable Power Cartridge',
    desc: 'Intrinsically safe Lithium Iron Phosphate dual battery module. An integrated super-capacitor bridge powers all sensors and wireless mesh for up to 3 minutes while switching battery packs mid-shift.',
    stat1: '48 Hours Operational Life',
    stat2: '3-Minute Capacitor Bridge',
    stat3: 'Zero-Downtime Hot Swap',
    stat4: 'Explosion-Proof LiFePO4 Chemistry'
  }
};

function initHotspots() {
  const buttons = document.querySelectorAll('.hotspot-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const spotKey = btn.getAttribute('data-spot');
      selectHotspot(spotKey, btn);
    });
  });
}

function selectHotspot(key, activeBtn) {
  const data = hotspotData[key];
  if (!data) return;

  document.querySelectorAll('.hotspot-btn').forEach(b => b.classList.remove('active', 'scale-125', 'ring-white'));
  if (activeBtn) {
    activeBtn.classList.add('active', 'scale-125', 'ring-white');
  }

  const labelElem = document.getElementById('active-hotspot-label');
  if (labelElem) labelElem.innerText = data.title;

  const card = document.getElementById('hotspot-detail-card');
  if (card) {
    card.classList.add('opacity-75');
    setTimeout(() => {
      const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
      setTxt('spot-category', data.category);
      setTxt('spot-code', data.code);
      setTxt('spot-title', data.title);
      setTxt('spot-desc', data.desc);
      setTxt('spot-stat-1', data.stat1);
      setTxt('spot-stat-2', data.stat2);
      setTxt('spot-stat-3', data.stat3);
      setTxt('spot-stat-4', data.stat4);
      card.classList.remove('opacity-75');
    }, 120);
  }
}

// -------------------------------------------------------------
// Interactive 10Hz Telemetry Simulator & Chart.js Engine
// -------------------------------------------------------------
let simChart = null;
let currentScenario = 'normal';
let currentMotionState = 'NORMAL';
let motionTargetAccel = 1.0;
let chartInterval = null;
let simTime = 0;

const scenarioConfigs = {
  normal: {
    gasTarget: 0.4,
    impactTarget: 1.0,
    bpmTarget: 74,
    tempTarget: 36.8,
    gasBadge: { text: '0.4 PPM', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    dispatchTitle: '<i data-lucide="shield-check" class="w-4 h-4"></i> NOMINAL SAFE',
    dispatchDesc: 'Worker SW-001 operating within standard safety thresholds.',
    dispatchClass: 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300',
    strobeText: 'White 10%',
    strobeColor: 'text-slate-200',
    emsText: 'Standby'
  },
  gas: {
    gasTarget: 48.5,
    impactTarget: 1.1,
    bpmTarget: 122,
    tempTarget: 37.4,
    gasBadge: { text: '48.5 PPM (LETHAL)', class: 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse' },
    dispatchTitle: '<i data-lucide="alert-octagon" class="w-4 h-4 text-red-400"></i> LETHAL GAS EVACUATION ALERT',
    dispatchDesc: 'H₂S gas level @ 48.5 PPM (OSHA limit 10 PPM). Emergency tunnel egress vector deployed.',
    dispatchClass: 'bg-red-950/70 border-red-500/60 text-red-300',
    strobeText: 'RAPID RED FLASH (100%)',
    strobeColor: 'text-red-400 font-bold',
    emsText: 'EMS Evac Triage Alert'
  },
  heat: {
    gasTarget: 0.2,
    impactTarget: 1.0,
    bpmTarget: 154,
    tempTarget: 39.6,
    gasBadge: { text: '0.2 PPM', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    dispatchTitle: '<i data-lucide="flame" class="w-4 h-4 text-amber-400"></i> HEATSTROKE / HYPERTHERMIA',
    dispatchDesc: 'Worker core temperature 39.6°C / 103.3°F with 154 BPM tachycardia. Cooling station dispatched.',
    dispatchClass: 'bg-amber-950/70 border-amber-500/50 text-amber-300',
    strobeText: 'AMBER BEACON (50%)',
    strobeColor: 'text-amber-400 font-bold',
    emsText: 'Supervisor Escalation'
  }
};

let currentGas = 0.4;
let currentImpact = 1.0;
let currentBpm = 74;
let currentTemp = 36.8;

function initSimulator() {
  const ctx = document.getElementById('telemetryChart');
  if (!ctx) return;

  const pointCount = 20;
  const initialLabels = Array.from({ length: pointCount }, (_, i) => `-${pointCount - i}s`);
  
  // Seed with realistic baseline sine oscillations
  const gasData = Array.from({ length: pointCount }, (_, i) => +(0.4 + Math.sin(i * 0.5) * 0.15).toFixed(2));
  const impactData = Array.from({ length: pointCount }, (_, i) => +(1.0 + Math.cos(i * 0.4) * 0.04).toFixed(2));

  simChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: initialLabels,
      datasets: [
        {
          label: 'Gas (PPM)',
          data: gasData,
          borderColor: '#06b6d4',
          backgroundColor: 'rgba(6, 182, 212, 0.15)',
          borderWidth: 2,
          tension: 0.35,
          fill: true,
          yAxisID: 'y',
          pointRadius: 0
        },
        {
          label: 'Acceleration (g)',
          data: impactData,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderWidth: 2,
          tension: 0.3,
          fill: false,
          yAxisID: 'y1',
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#64748b', font: { family: 'monospace', size: 9 }, maxTicksLimit: 6 }
        },
        y: {
          type: 'linear',
          position: 'left',
          min: 0,
          max: 60,
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#06b6d4', font: { family: 'monospace', size: 9 }, stepSize: 15 }
        },
        y1: {
          type: 'linear',
          position: 'right',
          min: 0,
          max: 6,
          grid: { drawOnChartArea: false },
          ticks: { color: '#f59e0b', font: { family: 'monospace', size: 9 }, stepSize: 1.5 }
        }
      }
    }
  });

  // Start continuous 10Hz stream loop (150ms updates for high responsiveness)
  if (chartInterval) clearInterval(chartInterval);
  chartInterval = setInterval(updateTelemetryStream, 150);
}

function updateTelemetryStream() {
  if (!simChart) return;

  simTime += 0.15;
  const cfg = scenarioConfigs[currentScenario] || scenarioConfigs.normal;

  // Realistic signal physics
  let targetAccel = motionTargetAccel;
  let accelJitter = 0;

  if (currentMotionState === 'WALKING') {
    // Rhythmic 2Hz walking sine wave
    accelJitter = Math.sin(simTime * 8) * 0.28 + (Math.random() - 0.5) * 0.05;
  } else if (currentMotionState === 'FALL') {
    accelJitter = (Math.random() - 0.5) * 0.12;
  } else if (currentMotionState === 'IMPACT') {
    accelJitter = Math.sin(simTime * 20) * 0.45;
  } else if (currentMotionState === 'NO_MOVEMENT') {
    accelJitter = (Math.random() - 0.5) * 0.01;
  } else {
    // Normal resting micro-tremor
    accelJitter = (Math.random() - 0.5) * 0.04;
  }

  // Smooth lerp towards targets
  const gasNoise = (Math.random() - 0.5) * (currentScenario === 'gas' ? 1.5 : 0.08);
  currentGas = Math.max(0.1, currentGas + (cfg.gasTarget - currentGas) * 0.25 + gasNoise);
  currentImpact = Math.max(0.1, targetAccel + accelJitter);
  
  currentBpm = Math.round(currentBpm + (cfg.bpmTarget - currentBpm) * 0.15 + (Math.random() - 0.5) * 1.5);
  currentTemp = +(currentTemp + (cfg.tempTarget - currentTemp) * 0.1 + (Math.random() - 0.5) * 0.02).toFixed(1);

  // Update UI meters
  updateMeters(cfg);

  // Push new data points into Chart
  simChart.data.datasets[0].data.shift();
  simChart.data.datasets[0].data.push(+currentGas.toFixed(2));

  simChart.data.datasets[1].data.shift();
  simChart.data.datasets[1].data.push(+currentImpact.toFixed(2));

  simChart.update('none');
}

function updateMeters(cfg) {
  // Gas Gauge
  const gasVal = document.getElementById('gas-value');
  const gasBar = document.getElementById('gas-bar');
  const gasBadge = document.getElementById('gas-status-badge');
  if (gasVal) gasVal.innerHTML = `${currentGas.toFixed(1)} <span class="text-xs font-normal text-slate-500">PPM</span>`;
  if (gasBar) {
    const pct = Math.min(100, (currentGas / 50) * 100);
    gasBar.style.width = `${Math.max(3, pct)}%`;
    gasBar.className = currentGas > 10 ? 'bg-red-500 h-full rounded-full transition-all duration-200' : 'bg-cyan-400 h-full rounded-full transition-all duration-200';
  }
  if (gasBadge) {
    gasBadge.className = `px-2 py-0.5 rounded text-[10px] font-mono border ${currentGas > 10 ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse' : cfg.gasBadge.class}`;
    gasBadge.innerText = currentGas > 10 ? `${currentGas.toFixed(1)} PPM (CRITICAL)` : `${currentGas.toFixed(1)} PPM`;
  }

  // Vitals Gauge
  const vitalsVal = document.getElementById('vitals-value');
  const tempVal = document.getElementById('temp-value');
  const vitalsBar = document.getElementById('vitals-bar');
  if (vitalsVal) vitalsVal.innerHTML = `${currentBpm} <span class="text-xs font-normal text-slate-500">BPM</span>`;
  if (tempVal) tempVal.innerText = `${currentTemp.toFixed(1)}°C / ${(currentTemp * 9/5 + 32).toFixed(1)}°F`;
  if (vitalsBar) {
    const pct = Math.min(100, ((currentBpm - 50) / 120) * 100);
    vitalsBar.style.width = `${Math.max(10, pct)}%`;
    vitalsBar.className = currentBpm > 120 || currentTemp > 38.5 ? 'bg-red-500 h-full rounded-full transition-all duration-200' : 'bg-rose-400 h-full rounded-full transition-all duration-200';
  }
}

// Hook for motion selection
window.setTelemetryMotion = function (preset, accel) {
  currentMotionState = preset;
  motionTargetAccel = accel;
};

// Hook for atmospheric scenario
window.setSimState = function (scenario) {
  currentScenario = scenario;
  const cfg = scenarioConfigs[scenario];
  if (!cfg) return;

  const dispatchBox = document.getElementById('dispatch-banner');
  if (dispatchBox) {
    dispatchBox.className = `p-3 rounded-lg border text-xs font-mono mb-2 space-y-1 ${cfg.dispatchClass}`;
    dispatchBox.innerHTML = `
      <div id="dispatch-title" class="font-bold flex items-center gap-1.5">${cfg.dispatchTitle}</div>
      <div id="dispatch-desc" class="text-[10px] text-slate-400">${cfg.dispatchDesc}</div>
    `;
  }

  const strobeElem = document.getElementById('strobe-status-text');
  if (strobeElem) {
    strobeElem.className = cfg.strobeColor;
    strobeElem.innerText = cfg.strobeText;
  }

  const emsElem = document.getElementById('ems-status-text');
  if (emsElem) {
    emsElem.className = scenario !== 'normal' ? 'text-rose-400 font-bold' : 'text-slate-500';
    emsElem.innerText = cfg.emsText;
  }

  if (scenario === 'gas') {
    if (window.playAlarmSound) window.playAlarmSound();
  } else {
    if (window.playBeep) window.playBeep(700, 0.04);
  }
};

// -------------------------------------------------------------
// Interactive Safety ROI & Risk Reduction Calculator
// -------------------------------------------------------------
function initCalculator() {
  const workersInput = document.getElementById('calc-workers');
  const riskSelect = document.getElementById('calc-risk-level');

  if (workersInput && riskSelect) {
    const update = () => {
      const workers = parseInt(workersInput.value, 10);
      const riskMultiplier = parseFloat(riskSelect.value);

      const label = document.getElementById('calc-workers-label');
      if (label) label.innerText = `${workers} Workers`;

      const estimatedIncidents = (workers * 0.045 * riskMultiplier).toFixed(1);
      const annualSavings = Math.round(estimatedIncidents * 0.845 * 42000);

      const dropEl = document.getElementById('calc-incident-drop');
      if (dropEl) dropEl.innerText = `84.5%`;
      const savEl = document.getElementById('calc-annual-savings');
      if (savEl) savEl.innerText = `$${annualSavings.toLocaleString()}+`;
    };

    workersInput.addEventListener('input', update);
    riskSelect.addEventListener('change', update);
    update();
  }
}

// -------------------------------------------------------------
// Collapsible FAQ Accordion
// -------------------------------------------------------------
function initFaq() {
  const triggers = document.querySelectorAll('.faq-trigger');
  triggers.forEach(btn => {
    btn.addEventListener('click', () => {
      const content = btn.nextElementSibling;
      const icon = btn.querySelector('i');
      const isHidden = content.classList.contains('hidden');
      
      document.querySelectorAll('.faq-content').forEach(c => c.classList.add('hidden'));
      document.querySelectorAll('.faq-trigger i').forEach(i => i.style.transform = 'rotate(0deg)');

      if (isHidden) {
        content.classList.remove('hidden');
        if (icon) icon.style.transform = 'rotate(180deg)';
      }
    });
  });
}

// -------------------------------------------------------------
// Pilot Form Submission Simulation
// -------------------------------------------------------------
function initPilotForm() {
  const form = document.getElementById('pilot-form');
  const feedback = document.getElementById('pilot-confirmation');
  if (form && feedback) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      feedback.classList.remove('hidden');
      form.reset();
    });
  }
}
