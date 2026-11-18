/**
 * ============================================================================
 * JARVIS — TUNING CONSTANTS, SETTINGS & EDUCATIONAL MODEL DATA
 * ============================================================================
 */

export const TUNING_CONFIG = {
  // Exponential Moving Average (EMA) smoothing factor
  HAND_SMOOTHING_ALPHA: 0.16,
  TRANSFORM_DAMPING_LAMBDA: 7.5,

  // Dead zones to prevent micro-jitter when holding hand steady
  ROTATION_DEADZONE: 0.012,
  ZOOM_DEADZONE: 0.009,
  MOVE_DEADZONE: 0.012,

  // Base gesture sensitivities
  ROTATION_SENSITIVITY_X: 4.4,
  ROTATION_SENSITIVITY_Y: 3.4,
  PINCH_ZOOM_SENSITIVITY: 4.8,
  TWO_HAND_ZOOM_SENSITIVITY: 3.6,
  DRAG_SENSITIVITY_X: 5.5,
  DRAG_SENSITIVITY_Y: 4.0,

  // Zoom bounds
  MIN_ZOOM: 0.45,
  MAX_ZOOM: 2.6,
  DEFAULT_ZOOM: 1.0,

  // Relative hand-scale gesture classification thresholds
  MIN_HAND_SCALE: 0.02,
  PINCH_START_RATIO: 0.35, // dist(4,8) / handScale <= 0.35 starts pinch
  PINCH_END_RATIO: 0.55,   // dist(4,8) / handScale >= 0.55 ends pinch
  FINGER_EXTENDED_RATIO: 1.18, // Tip distance to wrist vs PIP distance to wrist
  EXPLODE_MIN_RATIO: 2.0,  // Two open palms spread / avgHandScale <= 2.0 -> ASSEMBLE (0)
  EXPLODE_MAX_RATIO: 4.5,  // Two open palms spread / avgHandScale >= 4.5 -> EXPLODE (1)

  // Debounce & grace timings
  POSE_DEBOUNCE_FRAMES: 3,
  SWIPE_STABLE_PALM_FRAMES: 5,
  HAND_LOSS_GRACE_MS: 300,

  // Timing & cooldowns (milliseconds)
  SWIPE_VELOCITY_THRESHOLD: 0.95,
  SWIPE_COOLDOWN_MS: 950,
  RESET_HOLD_DURATION_MS: 2000,
  RESET_STILLNESS_RADIUS: 0.032,
  ATTRACT_MODE_IDLE_MS: 10000,
  JUDGE_PROMPT_DURATION_MS: 6500,

  // Performance & Particle limits (Requirement 5.2: at most 260 particles)
  LOW_FPS_THRESHOLD: 25,
  HIGH_PARTICLE_COUNT: 260,
  LOW_PARTICLE_COUNT: 120,
  HAND_TRACKING_INTERVAL_MS: 55,
};

export interface JarvisSettings {
  cameraId: string;
  mirrorPreview: boolean;
  handSensitivity: number; // 0.5 to 1.5, default 1.0
  voiceMode: 'push-to-talk' | 'hands-free';
  voiceLang: 'en-IN' | 'hi-IN';
  spokenReplies: boolean; // default false
  muted: boolean;
  volume: number; // 0 to 1, default 0.6
  ambientHum: boolean; // default false
  pyramidSize: number; // 0.18 to 0.45, default 0.31
  pyramidGap: number; // 0.6 to 1.3, default 0.96
  pyramidFlip180: boolean; // default false
  showFps: boolean; // default false
  wsUrl: string;
}

export const DEFAULT_SETTINGS: JarvisSettings = {
  cameraId: '',
  mirrorPreview: true,
  handSensitivity: 1.0,
  voiceMode: 'push-to-talk',
  voiceLang: 'en-IN',
  spokenReplies: false,
  muted: false,
  volume: 0.6,
  ambientHum: false,
  pyramidSize: 0.31,
  pyramidGap: 0.96,
  pyramidFlip180: false,
  showFps: false,
  wsUrl: 'ws://localhost:8080/jarvis-gestures',
};

const SETTINGS_STORAGE_KEY = 'jarvis.settings.v1';
const CAMERA_ID_STORAGE_KEY = 'jarvis.cameraId';

export function loadSettings(): JarvisSettings {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { ...DEFAULT_SETTINGS };
    }
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    const savedCam = window.localStorage.getItem(CAMERA_ID_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<JarvisSettings>) : {};
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      cameraId: savedCam !== null ? savedCam : parsed.cameraId ?? DEFAULT_SETTINGS.cameraId,
      handSensitivity: Math.min(1.5, Math.max(0.5, Number(parsed.handSensitivity ?? 1.0))),
      pyramidSize: Math.min(0.45, Math.max(0.18, Number(parsed.pyramidSize ?? 0.31))),
      pyramidGap: Math.min(1.4, Math.max(0.5, Number(parsed.pyramidGap ?? 0.96))),
      volume: Math.min(1, Math.max(0, Number(parsed.volume ?? 0.6))),
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: JarvisSettings): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    if (settings.cameraId) {
      window.localStorage.setItem(CAMERA_ID_STORAGE_KEY, settings.cameraId);
    } else {
      window.localStorage.removeItem(CAMERA_ID_STORAGE_KEY);
    }
  } catch {
    // Ignore storage quota or private browsing errors
  }
}

export type ModelId = 'earth' | 'solar' | 'heart' | 'dna' | 'atom';

export interface SubPartInfo {
  id: string;
  name: string;
  summary: string;
  metric?: string;
  explodeVector: [number, number, number];
}

export interface ScienceModelSpec {
  id: ModelId;
  keyNumber: number;
  name: string;
  shortName: string;
  subtitle: string;
  category: string;
  whatItTeaches: string;
  facts: [string, string, string];
  defaultBpm?: number;
  parts: SubPartInfo[];
}

export const SCIENCE_MODELS: ScienceModelSpec[] = [
  {
    id: 'earth',
    keyNumber: 1,
    name: 'Planetary Earth',
    shortName: 'Earth',
    subtitle: 'Biosphere, Magnetosphere & Tectonic Crust',
    category: 'Planetary geophysics',
    whatItTeaches:
      'Demonstrates how Earth’s layered internal core, oceanic-continental crust, and protective magnetosphere sustain liquid water and life.',
    facts: [
      'Earth’s solid iron-nickel inner core spins slightly faster than the surface, generating our protective magnetic field.',
      'Over 71% of the lithosphere is submerged beneath liquid oceans averaging 3.7 kilometers in depth.',
      'The Karman Line at 100 km altitude marks the boundary between Earth’s atmospheric envelope and outer space.',
    ],
    parts: [
      {
        id: 'earth-core',
        name: 'Inner & Outer Core',
        summary: 'Superheated iron-nickel dynamo generating the planetary geomagnetic shield.',
        metric: '5,400 °C · Radius 3,480 km',
        explodeVector: [0, -1.6, 0],
      },
      {
        id: 'earth-mantle',
        name: 'Silicate Mantle Shell',
        summary: 'Convecting viscoelastic rock layer driving plate tectonics and volcanism.',
        metric: '2,900 km Thick · 84% Volume',
        explodeVector: [-1.7, 0.4, 0.3],
      },
      {
        id: 'earth-crust',
        name: 'Continental & Oceanic Crust',
        summary: 'Tectonic plates carrying continents, mountain ranges, and abyssal ocean basins.',
        metric: '12,742 km Diameter · 1.0 G',
        explodeVector: [0, 0, 0],
      },
      {
        id: 'earth-atmosphere',
        name: 'Troposphere & Ionosphere',
        summary: 'Nitrogen-oxygen atmospheric shell scattering solar radiation and regulating climate.',
        metric: '78% N2 · 21% O2 · 1 atm',
        explodeVector: [1.7, 0.6, -0.3],
      },
      {
        id: 'earth-moon',
        name: 'Lunar Satellite (Moon)',
        summary: 'Tidally locked natural satellite stabilizing Earth’s 23.5° axial tilt and ocean tides.',
        metric: '384,400 km Orbit · 27.3 Days',
        explodeVector: [2.2, 1.4, 0.8],
      },
    ],
  },
  {
    id: 'solar',
    keyNumber: 2,
    name: 'Heliocentric Solar System',
    shortName: 'Solar system',
    subtitle: 'G-Type Main-Sequence Star & 8 Planetary Orbits',
    category: 'Astrophysics & orbital mechanics',
    whatItTeaches:
      'Illustrates Kepler’s Laws of Planetary Motion: inner rocky terrestrial worlds orbit rapidly while outer gas and ice giants sweep wide, slower orbits.',
    facts: [
      'The Sun contains 99.86% of all mass in the Solar System, fusing 600 million tons of hydrogen every second.',
      'Venus is hotter than Mercury (464 °C) due to a runaway carbon dioxide greenhouse atmosphere.',
      'Jupiter’s magnetosphere is so immense that if visible from Earth, it would appear larger than the full Moon.',
    ],
    parts: [
      {
        id: 'solar-sun',
        name: 'The Sun (Sol)',
        summary: 'G2V main-sequence fusion reactor anchoring the gravitational well of all 8 planets.',
        metric: 'Dist: 0 AU · Surface: 5,500 °C',
        explodeVector: [0, 0, 0],
      },
      {
        id: 'solar-mercury',
        name: 'Mercury',
        summary: 'Closest cratered iron-core world with extreme day-to-night thermal swings.',
        metric: 'Dist: 57.9M km · Temp: 167 °C',
        explodeVector: [-0.8, 0.9, 0.4],
      },
      {
        id: 'solar-venus',
        name: 'Venus',
        summary: 'Super-greenhouse terrestrial planet veiled in reflective sulfuric acid clouds.',
        metric: 'Dist: 108.2M km · Temp: 464 °C',
        explodeVector: [0.9, 1.1, -0.3],
      },
      {
        id: 'solar-earth',
        name: 'Earth',
        summary: 'Temperate ocean world in the circumstellar habitable zone with an active biosphere.',
        metric: 'Dist: 149.6M km · Temp: 15 °C',
        explodeVector: [-1.3, 0.6, 0.8],
      },
      {
        id: 'solar-mars',
        name: 'Mars',
        summary: 'Iron-oxide desert planet home to Olympus Mons, the tallest volcano in the Solar System.',
        metric: 'Dist: 227.9M km · Temp: -65 °C',
        explodeVector: [1.4, 0.5, 0.9],
      },
      {
        id: 'solar-jupiter',
        name: 'Jupiter',
        summary: 'Colossal hydrogen-helium gas giant with the centuries-old Great Red Spot anticyclone.',
        metric: 'Dist: 778.5M km · Temp: -110 °C',
        explodeVector: [-1.8, -0.7, 0.5],
      },
      {
        id: 'solar-saturn',
        name: 'Saturn',
        summary: 'Low-density gas giant encircled by a 282,000 km ring system of crystalline water ice.',
        metric: 'Dist: 1.43B km · Temp: -140 °C',
        explodeVector: [1.9, -0.8, -0.5],
      },
      {
        id: 'solar-uranus',
        name: 'Uranus',
        summary: 'Methane-tinted ice giant rotating on its side at an extreme 97.7° axial tilt.',
        metric: 'Dist: 2.87B km · Temp: -195 °C',
        explodeVector: [-2.1, -1.3, -0.7],
      },
      {
        id: 'solar-neptune',
        name: 'Neptune',
        summary: 'Outermost ice giant swept by supersonic 2,100 km/h methane-ammonia winds.',
        metric: 'Dist: 4.50B km · Temp: -200 °C',
        explodeVector: [2.2, -1.4, 0.7],
      },
    ],
  },
  {
    id: 'heart',
    keyNumber: 3,
    name: 'Human Cardiac Pump',
    shortName: 'Heart',
    subtitle: 'Four-Chambered Bio-Mechanical Circulatory Engine',
    category: 'Human anatomy & cardiology',
    whatItTeaches:
      'Shows synchronous systolic contraction and diastolic filling across the right pulmonary circuit and high-pressure left systemic circuit.',
    defaultBpm: 72,
    facts: [
      'Beating ~100,000 times daily, the human heart pumps roughly 7,500 liters of blood through 96,000 km of vessels.',
      'The Left Ventricle has myocardium walls 3x thicker than the Right Ventricle to propel blood to the entire body.',
      'The sinoatrial (SA) node generates autonomous electrical impulses, allowing the heart to beat even outside the body.',
    ],
    parts: [
      {
        id: 'heart-lv',
        name: 'Left Ventricle',
        summary: 'Thick-walled primary high-pressure chamber pumping oxygenated blood into the systemic aorta.',
        metric: 'Systolic: 120 mmHg · Wall: 12 mm',
        explodeVector: [0.68, -0.45, 0.2],
      },
      {
        id: 'heart-rv',
        name: 'Right Ventricle',
        summary: 'Crescent-shaped chamber propelling deoxygenated venous blood into the pulmonary lungs.',
        metric: 'Systolic: 25 mmHg · Wall: 4 mm',
        explodeVector: [-0.68, -0.45, 0.2],
      },
      {
        id: 'heart-ra',
        name: 'Right Atrium',
        summary: 'Receiving chamber for deoxygenated blood from the Superior and Inferior Vena Cava; houses the SA pacemaker node.',
        metric: 'Pacemaker: 60–100 BPM · 4 mmHg',
        explodeVector: [-0.75, 0.42, 0.15],
      },
      {
        id: 'heart-la',
        name: 'Left Atrium',
        summary: 'Receives freshly oxygenated blood from four pulmonary veins and feeds the mitral valve.',
        metric: 'Oxygen Saturation: 98% SpO2',
        explodeVector: [0.75, 0.42, -0.15],
      },
      {
        id: 'heart-aorta',
        name: 'Aortic Arch & Trunk',
        summary: 'Largest elastic artery distributing oxygenated blood to the brain, coronary arteries, and body.',
        metric: 'Flow Rate: 5.0 Liters/min',
        explodeVector: [0.22, 0.72, 0.1],
      },
      {
        id: 'heart-pulmonary',
        name: 'Pulmonary Artery & Vena Cava',
        summary: 'Major vascular conduits carrying venous blood into the lungs and returning systemic blood.',
        metric: 'Pulmonary Circuit: Low Resistance',
        explodeVector: [-0.28, 0.68, -0.2],
      },
    ],
  },
  {
    id: 'dna',
    keyNumber: 4,
    name: 'DNA Double Helix',
    shortName: 'DNA',
    subtitle: 'B-Form Deoxyribonucleic Acid Macromolecule',
    category: 'Molecular genetics & biochemistry',
    whatItTeaches:
      'Visualizes Watson-Crick complementary base pairing (Adenine–Thymine and Guanine–Cytosine) suspended between antiparallel sugar-phosphate backbones.',
    facts: [
      'Uncoiled and linked end-to-end, the DNA inside a single human cell stretches 2 meters long.',
      'Adenine pairs with Thymine via 2 hydrogen bonds, while Guanine pairs with Cytosine via 3 stronger hydrogen bonds.',
      'Humans share 99.9% identical DNA sequences with each other and roughly 60% of core cellular genes with bananas.',
    ],
    parts: [
      {
        id: 'dna-backbone-a',
        name: '5’ → 3’ Sugar-Phosphate Strand',
        summary: 'Deoxyribose pentose sugars linked by negatively charged phosphodiester bridges forming the outer structural rail.',
        metric: 'Helix Pitch: 3.4 nm (10.5 bp/turn)',
        explodeVector: [-1.7, 0.2, 0.4],
      },
      {
        id: 'dna-backbone-b',
        name: '3’ → 5’ Antiparallel Strand',
        summary: 'Complementary reverse-oriented polynucleotide strand enabling semi-conservative DNA replication.',
        metric: 'Helix Diameter: 2.0 nanometers',
        explodeVector: [1.7, -0.2, -0.4],
      },
      {
        id: 'dna-at-pair',
        name: 'Adenine – Thymine (A–T) Rungs',
        summary: 'Purine-pyrimidine base pair joined by two electrostatic hydrogen bonds across the central axis.',
        metric: '2 Hydrogen Bonds · 0.34 nm Rise',
        explodeVector: [0, 1.3, 0.9],
      },
      {
        id: 'dna-gc-pair',
        name: 'Guanine – Cytosine (G–C) Rungs',
        summary: 'High-stability base pair joined by three hydrogen bonds, conferring thermal resilience to the genome.',
        metric: '3 Hydrogen Bonds · High Stability',
        explodeVector: [0, -1.3, -0.9],
      },
    ],
  },
  {
    id: 'atom',
    keyNumber: 5,
    name: 'Quantum Carbon-12 Atom',
    shortName: 'Atom',
    subtitle: 'Nucleon Core & Relativistic Electron Shells',
    category: 'Quantum physics & atomic structure',
    whatItTeaches:
      'Models how strong nuclear force binds positively charged protons and neutral neutrons together while electrons occupy quantized orbital shells.',
    facts: [
      'Atoms are 99.9999999% empty space: if the nucleus were a marble on a football field, electrons would orbit the stadium seats.',
      'Carbon-12 (6 protons, 6 neutrons, 6 electrons) is forged inside dying red giant stars via the triple-alpha process.',
      'Electrons do not orbit like miniature planets; they exist as standing wave probability clouds governed by quantum mechanics.',
    ],
    parts: [
      {
        id: 'atom-protons',
        name: 'Proton Cluster (Z = 6)',
        summary: 'Six positively charged baryons (uud quarks) defining the atomic number and chemical identity of Carbon.',
        metric: 'Charge: +1e · Mass: 1.007 u each',
        explodeVector: [-0.9, 0.8, 0.5],
      },
      {
        id: 'atom-neutrons',
        name: 'Neutron Stabilizers (N = 6)',
        summary: 'Six uncharged nucleons providing residual strong nuclear force to prevent electrostatic proton repulsion.',
        metric: 'Charge: 0e · Nuclear Binding: 92 MeV',
        explodeVector: [0.9, -0.8, 0.5],
      },
      {
        id: 'atom-shell-1s',
        name: 'Inner K-Shell (1s² Orbital)',
        summary: 'Two tightly bound core electrons occupying the lowest principal quantum energy level (n = 1).',
        metric: 'Binding Energy: 284 eV · 2 Electrons',
        explodeVector: [-1.8, -0.6, -0.6],
      },
      {
        id: 'atom-shell-2sp',
        name: 'Valence L-Shell (2s² 2p² Orbitals)',
        summary: 'Four outer valence electrons enabling Carbon to form 4 covalent bonds—the foundation of all organic chemistry.',
        metric: 'Valence: 4 Covalent Bonds · Tetrahedral',
        explodeVector: [1.8, 0.7, -0.6],
      },
    ],
  },
];

export const GESTURE_GUIDE_ITEMS = [
  {
    gesture: 'Open hand move',
    badge: 'Rotate',
    howTo: 'Hold one open palm up and glide left, right, up, or down.',
    effect: 'Smooth 360° 3D rotation following your palm movement.',
    shortcut: 'Arrow keys / Mouse drag',
  },
  {
    gesture: 'Pinch and slide vertically',
    badge: 'Zoom',
    howTo: 'Pinch thumb and index finger together, then move your hand up to zoom in or down to zoom out.',
    effect: 'Zooms smoothly without losing the pinch; rotation is locked while pinching.',
    shortcut: '+ / - keys or Scroll wheel',
  },
  {
    gesture: 'Two-hand control',
    badge: 'Dual sync',
    howTo: 'Left hand open rotates while right hand pinches and slides vertically to zoom, or pinch both hands and move apart.',
    effect: 'Simultaneous rotation and zoom control.',
    shortcut: 'Drag + Scroll',
  },
  {
    gesture: 'Closed fist drag',
    badge: 'Move / pan',
    howTo: 'Close your hand into a fist and move across the frame.',
    effect: 'Repositions the model in 3D space.',
    shortcut: 'Shift + Mouse drag',
  },
  {
    gesture: 'Two open hands apart',
    badge: 'Explode view',
    howTo: 'Hold both open palms up and spread them apart to explode continuously; bring palms closer to reassemble.',
    effect: 'Separates the model proportionally into internal sub-parts.',
    shortcut: 'Key E',
  },
  {
    gesture: 'Fast horizontal swipe',
    badge: 'Switch model',
    howTo: 'Hold an open hand steady for a moment, then swipe briskly left or right.',
    effect: 'Switches to the next or previous 3D model.',
    shortcut: 'Keys 1 – 5',
  },
  {
    gesture: 'Index finger point',
    badge: 'Inspect part',
    howTo: 'Extend only your index finger to move the pointer over the model.',
    effect: 'Highlights internal parts with a floating metric callout.',
    shortcut: 'Hover / Click model',
  },
  {
    gesture: 'Still open palm (2 s)',
    badge: 'Reset',
    howTo: 'Hold a clear open palm steady for 2 seconds until the progress ring completes.',
    effect: 'Resets position, rotation, zoom, and reassembles parts.',
    shortcut: 'Key R',
  },
];
