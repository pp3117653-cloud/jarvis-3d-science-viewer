import * as THREE from 'three';
import { ModelId, SCIENCE_MODELS, SubPartInfo } from '../config/constants';

export interface BuiltHologramModel {
  id: ModelId;
  rootGroup: THREE.Group;
  explodableParts: THREE.Object3D[];
  raycastTargets: THREE.Mesh[];
  update: (elapsed: number, dt: number, bpm: number, explodeAmount: number) => void;
}

/**
 * Generates a procedural holographic Earth continent + grid CanvasTexture
 */
function createEarthHoloTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Natural ocean gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#081c2d');
  grad.addColorStop(0.5, '#123d55');
  grad.addColorStop(1, '#061522');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);

  // Natural procedural land masses without a telemetry grid
  // Stylized continent silhouettes in glowing neon cyan
  ctx.fillStyle = 'rgba(6, 182, 212, 0.68)';
  ctx.strokeStyle = '#67e8f9';
  ctx.lineWidth = 2;

  const continents = [
    // North America
    [
      [150, 90], [260, 80], [290, 150], [230, 220], [180, 200], [130, 140],
    ],
    // South America
    [
      [250, 250], [320, 270], [310, 380], [270, 440], [240, 350],
    ],
    // Eurasia
    [
      [470, 75], [760, 70], [840, 150], [770, 230], [660, 240], [540, 190], [460, 150],
    ],
    // Africa
    [
      [470, 195], [580, 205], [610, 300], [560, 400], [500, 370], [455, 270],
    ],
    // Australia
    [
      [770, 320], [865, 315], [880, 385], [790, 395],
    ],
  ];

  for (const poly of continents) {
    ctx.beginPath();
    poly.forEach(([px, py], i) => {
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

/**
 * Helper to tag a part Group and all child meshes with SubPartInfo for raycasting & exploding
 */
function registerSubPart(
  partGroup: THREE.Group,
  partInfo: SubPartInfo,
  explodableParts: THREE.Object3D[],
  raycastTargets: THREE.Mesh[]
): void {
  partGroup.userData.partInfo = partInfo;
  partGroup.userData.basePosition = partGroup.position.clone();
  partGroup.userData.explodeVector = new THREE.Vector3(...partInfo.explodeVector);
  explodableParts.push(partGroup);

  partGroup.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.userData.partInfo = partInfo;
      mesh.userData.parentPartGroup = partGroup;
      raycastTargets.push(mesh);
    }
  });
}

/**
 * Adds a holographic wireframe edge overlay to a geometry
 */
function addHoloWireframe(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  color = 0x9b4d3f,
  opacity = 0.35
): THREE.LineSegments {
  const edges = new THREE.EdgesGeometry(geometry, 18);
  const lineMat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.NormalBlending,
    depthWrite: false,
  });
  const lines = new THREE.LineSegments(edges, lineMat);
  lines.visible = true;
  parent.add(lines);
  return lines;
}

/**
 * 1. PLANETARY EARTH MODEL (5 Explodable Layers)
 */
function buildEarthModel(maxAnisotropy: number): BuiltHologramModel {
  const spec = SCIENCE_MODELS.find((m) => m.id === 'earth')!;
  const rootGroup = new THREE.Group();
  const explodableParts: THREE.Object3D[] = [];
  const raycastTargets: THREE.Mesh[] = [];

  // Part 0: Inner & Outer Core
  const coreGroup = new THREE.Group();
  const coreGeo = new THREE.IcosahedronGeometry(0.52, 2);
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0x8f6b3f,
    roughness: 0.2,
    metalness: 0.8,
  });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  coreGroup.add(coreMesh);
  addHoloWireframe(coreGroup, coreGeo, 0xf2eee5, 0.7);
  rootGroup.add(coreGroup);
  registerSubPart(coreGroup, spec.parts[0], explodableParts, raycastTargets);

  // Part 1: Silicate Mantle Shell
  const mantleGroup = new THREE.Group();
  const mantleGeo = new THREE.SphereGeometry(0.88, 28, 20, 0, Math.PI * 1.65);
  const mantleMat = new THREE.MeshStandardMaterial({
    color: 0x9f6b43,
    roughness: 0.45,
    metalness: 0.5,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.82,
  });
  const mantleMesh = new THREE.Mesh(mantleGeo, mantleMat);
  mantleGroup.add(mantleMesh);
  addHoloWireframe(mantleGroup, mantleGeo, 0x8f6b3f, 0.45);
  rootGroup.add(mantleGroup);
  registerSubPart(mantleGroup, spec.parts[1], explodableParts, raycastTargets);

  // Part 2: Continental & Oceanic Crust
  const crustGroup = new THREE.Group();
  const crustGeo = new THREE.SphereGeometry(1.25, 36, 28);
  const earthTex = createEarthHoloTexture(maxAnisotropy);
  const crustMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: earthTex,
    roughness: 0.35,
    metalness: 0.3,
    transparent: true,
    opacity: 0.92,
  });
  const crustMesh = new THREE.Mesh(crustGeo, crustMat);
  crustGroup.add(crustMesh);
  addHoloWireframe(crustGroup, new THREE.SphereGeometry(1.255, 18, 12), 0x9b4d3f, 0.3);
  rootGroup.add(crustGroup);
  registerSubPart(crustGroup, spec.parts[2], explodableParts, raycastTargets);

  // Part 3: Troposphere & Magnetosphere Ring Shell
  const atmoGroup = new THREE.Group();
  const atmoGeo = new THREE.SphereGeometry(1.48, 24, 18);
  const atmoMat = new THREE.MeshStandardMaterial({
    color: 0x9b4d3f,
    roughness: 0.15,
    metalness: 0.1,
    transparent: true,
    opacity: 0.18,
  });
  const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
  atmoGroup.add(atmoMesh);

  // Equatorial orbital telemetry ring
  const ringGeo = new THREE.TorusGeometry(1.72, 0.018, 12, 64);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xc8a96b,
    transparent: true,
    opacity: 0.65,
  });
  const eqRing = new THREE.Mesh(ringGeo, ringMat);
  eqRing.rotation.x = Math.PI * 0.42;
  atmoGroup.add(eqRing);
  rootGroup.add(atmoGroup);
  registerSubPart(atmoGroup, spec.parts[3], explodableParts, raycastTargets);

  // Part 4: Lunar Satellite (Moon)
  const moonGroup = new THREE.Group();
  moonGroup.position.set(2.05, 0.35, 0);
  const moonGeo = new THREE.SphereGeometry(0.26, 20, 16);
  const moonMat = new THREE.MeshStandardMaterial({
    color: 0xbae6fd,
    roughness: 0.6,
    metalness: 0.2,
  });
  const moonMesh = new THREE.Mesh(moonGeo, moonMat);
  moonGroup.add(moonMesh);
  addHoloWireframe(moonGroup, moonGeo, 0xb7c4d4, 0.55);
  rootGroup.add(moonGroup);
  registerSubPart(moonGroup, spec.parts[4], explodableParts, raycastTargets);

  return {
    id: 'earth',
    rootGroup,
    explodableParts,
    raycastTargets,
    update: (elapsed, _dt, _bpm, explodeAmount) => {
      crustMesh.rotation.y = elapsed * 0.22;
      mantleMesh.rotation.y = -elapsed * 0.15;
      coreMesh.rotation.y = elapsed * 0.45;
      coreMesh.rotation.x = elapsed * 0.3;
      atmoMesh.rotation.y = elapsed * 0.1;

      // Orbit moon when not exploded
      const orbitAngle = elapsed * 0.55;
      const baseRadius = 2.05;
      const basePos = moonGroup.userData.basePosition as THREE.Vector3;
      basePos.set(
        Math.cos(orbitAngle) * baseRadius,
        Math.sin(orbitAngle * 0.7) * 0.35,
        Math.sin(orbitAngle) * baseRadius
      );
      if (explodeAmount < 0.01) {
        moonGroup.position.copy(basePos);
      }
    },
  };
}

/**
 * 2. HELIOCENTRIC SOLAR SYSTEM MODEL (Sun + 8 Planets + Orbit Rings)
 */
function buildSolarSystemModel(): BuiltHologramModel {
  const spec = SCIENCE_MODELS.find((m) => m.id === 'solar')!;
  const rootGroup = new THREE.Group();
  const explodableParts: THREE.Object3D[] = [];
  const raycastTargets: THREE.Mesh[] = [];

  // Part 0: The Sun
  const sunGroup = new THREE.Group();
  const sunGeo = new THREE.IcosahedronGeometry(0.56, 3);
  const sunMat = new THREE.MeshStandardMaterial({
    color: 0x8f6b3f,
    roughness: 0.2,
    metalness: 0.3,
  });
  const sunMesh = new THREE.Mesh(sunGeo, sunMat);
  sunGroup.add(sunMesh);
  addHoloWireframe(sunGroup, new THREE.IcosahedronGeometry(0.62, 2), 0xe8e0d0, 0.55);
  rootGroup.add(sunGroup);
  registerSubPart(sunGroup, spec.parts[0], explodableParts, raycastTargets);

  const planetConfigs = [
    { idx: 1, radius: 0.85, size: 0.09, speed: 1.6, color: 0xb7c4d4, tilt: 0.05 }, // Mercury
    { idx: 2, radius: 1.12, size: 0.13, speed: 1.25, color: 0x8f6b3f, tilt: 0.08 }, // Venus
    { idx: 3, radius: 1.42, size: 0.145, speed: 1.0, color: 0x4f7c5d, tilt: 0.1 }, // Earth
    { idx: 4, radius: 1.72, size: 0.115, speed: 0.82, color: 0x9f6b43, tilt: 0.12 }, // Mars
    { idx: 5, radius: 2.12, size: 0.25, speed: 0.55, color: 0x9b4d3f, tilt: 0.06 }, // Jupiter
    { idx: 6, radius: 2.55, size: 0.21, speed: 0.42, color: 0xc8a96b, tilt: 0.14, hasRing: true }, // Saturn
    { idx: 7, radius: 2.92, size: 0.16, speed: 0.31, color: 0x5e6a7a, tilt: 0.18 }, // Uranus
    { idx: 8, radius: 3.25, size: 0.155, speed: 0.24, color: 0x274c77, tilt: 0.09 }, // Neptune
  ];

  const planetOrbitData: Array<{
    group: THREE.Group;
    radius: number;
    speed: number;
    phase: number;
    tilt: number;
  }> = [];

  planetConfigs.forEach((cfg, i) => {
    // Orbit track ring
    const orbitGeo = new THREE.RingGeometry(cfg.radius - 0.008, cfg.radius + 0.008, 64);
    const orbitMat = new THREE.MeshBasicMaterial({
      color: 0x4f7c5d,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.25,
    });
    const orbitRing = new THREE.Mesh(orbitGeo, orbitMat);
    orbitRing.rotation.x = Math.PI / 2;
    rootGroup.add(orbitRing);

    const pGroup = new THREE.Group();
    const phase = (i * Math.PI * 2) / planetConfigs.length;
    pGroup.position.set(Math.cos(phase) * cfg.radius, 0, Math.sin(phase) * cfg.radius);

    const pGeo = new THREE.SphereGeometry(cfg.size, 20, 16);
    const pMat = new THREE.MeshStandardMaterial({
      color: cfg.color,
      roughness: 0.35,
      metalness: 0.45,
    });
    const pMesh = new THREE.Mesh(pGeo, pMat);
    pGroup.add(pMesh);
    addHoloWireframe(pGroup, pGeo, 0xf2eee5, 0.45);

    if (cfg.hasRing) {
      const saturnRingGeo = new THREE.RingGeometry(cfg.size * 1.35, cfg.size * 2.1, 32);
      const saturnRingMat = new THREE.MeshBasicMaterial({
        color: 0xe8e0d0,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.65,
      });
      const saturnRing = new THREE.Mesh(saturnRingGeo, saturnRingMat);
      saturnRing.rotation.x = Math.PI * 0.38;
      pGroup.add(saturnRing);
    }

    rootGroup.add(pGroup);
    registerSubPart(pGroup, spec.parts[cfg.idx], explodableParts, raycastTargets);
    planetOrbitData.push({
      group: pGroup,
      radius: cfg.radius,
      speed: cfg.speed,
      phase,
      tilt: cfg.tilt,
    });
  });

  // Slightly tilt the entire ecliptic plane so all orbits are visible from the front
  rootGroup.rotation.x = 0.32;

  return {
    id: 'solar',
    rootGroup,
    explodableParts,
    raycastTargets,
    update: (elapsed, _dt, _bpm, explodeAmount) => {
      sunMesh.rotation.y = elapsed * 0.35;
      for (const p of planetOrbitData) {
        const angle = p.phase + elapsed * p.speed * 0.45;
        const basePos = p.group.userData.basePosition as THREE.Vector3;
        basePos.set(
          Math.cos(angle) * p.radius,
          Math.sin(angle) * p.tilt,
          Math.sin(angle) * p.radius
        );
        if (explodeAmount < 0.01) {
          p.group.position.copy(basePos);
        }
        p.group.rotation.y = elapsed * 1.2;
      }
    },
  };
}

/**
 * 3. HUMAN CARDIAC PUMP (HEART) MODEL (6 Anatomical Chambers & Great Vessels)
 */
function buildHeartModel(): BuiltHologramModel {
  const spec = SCIENCE_MODELS.find((m) => m.id === 'heart')!;
  const rootGroup = new THREE.Group();
  const explodableParts: THREE.Object3D[] = [];
  const raycastTargets: THREE.Mesh[] = [];

  const makeChamberMat = (color: number, emissive: number, roughness = 0.28) =>
    new THREE.MeshStandardMaterial({
      color,
      emissive,
      roughness,
      metalness: 0.55,
      transparent: true,
      opacity: 0.78,
    });

  // Part 0: Left Ventricle (sculpted muscular ellipsoid-cone lobe on viewer right)
  const lvGroup = new THREE.Group();
  lvGroup.position.set(0.28, -0.28, 0.08);
  const lvGeo = new THREE.SphereGeometry(0.52, 24, 20);
  lvGeo.scale(0.82, 1.35, 0.85);
  lvGeo.rotateZ(-0.28);
  const lvMesh = new THREE.Mesh(lvGeo, makeChamberMat(0x4f7c5d, 0x6d4538, 0.22));
  lvGroup.add(lvMesh);
  addHoloWireframe(lvGroup, lvGeo, 0xc8a96b, 0.55);
  rootGroup.add(lvGroup);
  registerSubPart(lvGroup, spec.parts[0], explodableParts, raycastTargets);

  // Part 1: Right Ventricle (crescent anterior lobe on viewer left)
  const rvGroup = new THREE.Group();
  rvGroup.position.set(-0.28, -0.24, 0.14);
  const rvGeo = new THREE.SphereGeometry(0.46, 22, 18);
  rvGeo.scale(0.8, 1.25, 0.82);
  rvGeo.rotateZ(0.26);
  const rvMesh = new THREE.Mesh(rvGeo, makeChamberMat(0x5e6a7a, 0x3d4b58, 0.48));
  rvGroup.add(rvMesh);
  addHoloWireframe(rvGroup, rvGeo, 0x8f6b3f, 0.5);
  rootGroup.add(rvGroup);
  registerSubPart(rvGroup, spec.parts[1], explodableParts, raycastTargets);

  // Part 2: Right Atrium (upper left receiving chamber)
  const raGroup = new THREE.Group();
  raGroup.position.set(-0.44, 0.36, 0.04);
  const raGeo = new THREE.SphereGeometry(0.36, 20, 16);
  raGeo.scale(1.0, 1.1, 0.9);
  const raMesh = new THREE.Mesh(raGeo, makeChamberMat(0x8f6b3f, 0x5e6a7a, 0.35));
  raGroup.add(raMesh);
  addHoloWireframe(raGroup, raGeo, 0xb7c4d4, 0.5);
  rootGroup.add(raGroup);
  registerSubPart(raGroup, spec.parts[2], explodableParts, raycastTargets);

  // Part 3: Left Atrium (upper right posterior chamber)
  const laGroup = new THREE.Group();
  laGroup.position.set(0.42, 0.38, -0.06);
  const laGeo = new THREE.SphereGeometry(0.35, 20, 16);
  laGeo.scale(1.05, 1.08, 0.9);
  const laMesh = new THREE.Mesh(laGeo, makeChamberMat(0x9b4d3f, 0x4f7c5d, 0.25));
  laGroup.add(laMesh);
  addHoloWireframe(laGroup, laGeo, 0xe8e0d0, 0.55);
  rootGroup.add(laGroup);
  registerSubPart(laGroup, spec.parts[3], explodableParts, raycastTargets);

  // Part 4: Aortic Arch & Systemic Trunk
  const aortaGroup = new THREE.Group();
  aortaGroup.position.set(0.08, 0.72, 0.04);
  const aortaCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.12, -0.35, 0.04),
    new THREE.Vector3(0.18, 0.12, 0.06),
    new THREE.Vector3(0.0, 0.38, 0.0),
    new THREE.Vector3(-0.26, 0.25, -0.08),
    new THREE.Vector3(-0.3, -0.15, -0.16),
  ]);
  const aortaGeo = new THREE.TubeGeometry(aortaCurve, 28, 0.135, 14, false);
  const aortaMesh = new THREE.Mesh(aortaGeo, makeChamberMat(0xc8a96b, 0x4f7c5d, 0.2));
  aortaGroup.add(aortaMesh);
  addHoloWireframe(aortaGroup, aortaGeo, 0xf2eee5, 0.6);
  rootGroup.add(aortaGroup);
  registerSubPart(aortaGroup, spec.parts[4], explodableParts, raycastTargets);

  // Part 5: Pulmonary Artery & Superior Vena Cava
  const pulmGroup = new THREE.Group();
  pulmGroup.position.set(-0.22, 0.68, -0.06);
  const pulmCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.06, -0.36, 0.14),
    new THREE.Vector3(-0.04, 0.06, 0.1),
    new THREE.Vector3(0.28, 0.14, -0.04),
  ]);
  const pulmGeo = new THREE.TubeGeometry(pulmCurve, 20, 0.115, 12, false);
  const pulmMesh = new THREE.Mesh(pulmGeo, makeChamberMat(0x9f6b43, 0x5e6a7a, 0.4));
  pulmGroup.add(pulmMesh);

  const svcGeo = new THREE.CylinderGeometry(0.1, 0.11, 0.68, 14);
  svcGeo.translate(-0.28, 0.04, 0.0);
  const svcMesh = new THREE.Mesh(svcGeo, makeChamberMat(0x5e6a7a, 0x3d4b58, 0.45));
  pulmGroup.add(svcMesh);
  addHoloWireframe(pulmGroup, pulmGeo, 0x8f6b3f, 0.5);
  rootGroup.add(pulmGroup);
  registerSubPart(pulmGroup, spec.parts[5], explodableParts, raycastTargets);

  return {
    id: 'heart',
    rootGroup,
    explodableParts,
    raycastTargets,
    update: (elapsed, _dt, bpm) => {
      // Realistic physiological cardiac cycle at active BPM
      const freq = Math.max(40, Math.min(180, bpm)) / 60;
      const phase = (elapsed * freq) % 1;
      // Lub-dub double systolic wave
      const lub = Math.exp(-Math.pow((phase - 0.15) * 10, 2));
      const dub = 0.6 * Math.exp(-Math.pow((phase - 0.34) * 12, 2));
      const pulse = 1 + (lub + dub) * 0.11;

      lvMesh.scale.setScalar(pulse);
      rvMesh.scale.setScalar(1 + (lub + dub) * 0.09);
      raMesh.scale.setScalar(1 + Math.exp(-Math.pow((phase - 0.05) * 9, 2)) * 0.08);
      laMesh.scale.setScalar(1 + Math.exp(-Math.pow((phase - 0.05) * 9, 2)) * 0.08);
      aortaMesh.scale.setScalar(1 + dub * 0.07);
    },
  };
}

/**
 * 4. DNA DOUBLE HELIX MODEL (4 Functional Molecular Sub-Groups)
 */
function buildDnaModel(): BuiltHologramModel {
  const spec = SCIENCE_MODELS.find((m) => m.id === 'dna')!;
  const rootGroup = new THREE.Group();
  const explodableParts: THREE.Object3D[] = [];
  const raycastTargets: THREE.Mesh[] = [];

  const backboneAGroup = new THREE.Group();
  const backboneBGroup = new THREE.Group();
  const atRungsGroup = new THREE.Group();
  const gcRungsGroup = new THREE.Group();

  const numPairs = 22;
  const heightSpan = 3.4;
  const radius = 0.78;
  const turns = 2.2;

  const sphereGeo = new THREE.SphereGeometry(0.1, 14, 12);
  const matStrandA = new THREE.MeshStandardMaterial({
    color: 0x9b4d3f,
    roughness: 0.2,
    metalness: 0.6,
  });
  const matStrandB = new THREE.MeshStandardMaterial({
    color: 0x8f6b3f,
    roughness: 0.45,
    metalness: 0.4,
  });
  const matAT = new THREE.MeshStandardMaterial({
    color: 0xc8a96b,
    roughness: 0.3,
    metalness: 0.5,
  });
  const matGC = new THREE.MeshStandardMaterial({
    color: 0x9f6b43,
    roughness: 0.55,
    metalness: 0.3,
  });

  const pointsA: THREE.Vector3[] = [];
  const pointsB: THREE.Vector3[] = [];

  for (let i = 0; i < numPairs; i++) {
    const t = i / (numPairs - 1);
    const y = (t - 0.5) * heightSpan;
    const angle = t * Math.PI * 2 * turns;

    const posA = new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    const posB = new THREE.Vector3(
      Math.cos(angle + Math.PI) * radius,
      y,
      Math.sin(angle + Math.PI) * radius
    );
    pointsA.push(posA);
    pointsB.push(posB);

    const nodeA = new THREE.Mesh(sphereGeo, matStrandA);
    nodeA.position.copy(posA);
    backboneAGroup.add(nodeA);

    const nodeB = new THREE.Mesh(sphereGeo, matStrandB);
    nodeB.position.copy(posB);
    backboneBGroup.add(nodeB);

    // Base pair rung connecting posA and posB
    const rungGeo = new THREE.CylinderGeometry(0.036, 0.036, radius * 2, 10);
    rungGeo.rotateZ(Math.PI / 2);
    const isAT = i % 2 === 0;
    const rungMesh = new THREE.Mesh(rungGeo, isAT ? matAT : matGC);
    rungMesh.position.set(0, y, 0);
    rungMesh.rotation.y = -angle;

    if (isAT) {
      atRungsGroup.add(rungMesh);
    } else {
      gcRungsGroup.add(rungMesh);
    }
  }

  // Smooth helical sugar-phosphate tubes
  const curveA = new THREE.CatmullRomCurve3(pointsA);
  const tubeGeoA = new THREE.TubeGeometry(curveA, 64, 0.045, 10, false);
  backboneAGroup.add(new THREE.Mesh(tubeGeoA, matStrandA));

  const curveB = new THREE.CatmullRomCurve3(pointsB);
  const tubeGeoB = new THREE.TubeGeometry(curveB, 64, 0.045, 10, false);
  backboneBGroup.add(new THREE.Mesh(tubeGeoB, matStrandB));

  rootGroup.add(backboneAGroup, backboneBGroup, atRungsGroup, gcRungsGroup);

  registerSubPart(backboneAGroup, spec.parts[0], explodableParts, raycastTargets);
  registerSubPart(backboneBGroup, spec.parts[1], explodableParts, raycastTargets);
  registerSubPart(atRungsGroup, spec.parts[2], explodableParts, raycastTargets);
  registerSubPart(gcRungsGroup, spec.parts[3], explodableParts, raycastTargets);

  return {
    id: 'dna',
    rootGroup,
    explodableParts,
    raycastTargets,
    update: (elapsed) => {
      rootGroup.rotation.y = elapsed * 0.35;
    },
  };
}

/**
 * 5. QUANTUM CARBON-12 ATOM MODEL (Protons, Neutrons, Inner 1s Shell, Outer 2sp Shell)
 */
function buildAtomModel(): BuiltHologramModel {
  const spec = SCIENCE_MODELS.find((m) => m.id === 'atom')!;
  const rootGroup = new THREE.Group();
  const explodableParts: THREE.Object3D[] = [];
  const raycastTargets: THREE.Mesh[] = [];

  const protonGroup = new THREE.Group();
  const neutronGroup = new THREE.Group();
  const shell1sGroup = new THREE.Group();
  const shell2spGroup = new THREE.Group();

  const nucleonGeo = new THREE.SphereGeometry(0.18, 18, 14);
  const protonMat = new THREE.MeshStandardMaterial({
    color: 0x9b4d3f,
    roughness: 0.2,
    metalness: 0.7,
  });
  const neutronMat = new THREE.MeshStandardMaterial({
    color: 0x5e6a7a,
    roughness: 0.5,
    metalness: 0.4,
  });

  // 6 Protons + 6 Neutrons in a compact icosahedral nuclear cluster
  const offsets = [
    [0.18, 0.12, 0.08],
    [-0.18, -0.12, 0.08],
    [0.12, -0.18, -0.1],
    [-0.12, 0.18, -0.1],
    [0.05, 0.08, 0.22],
    [-0.05, -0.08, -0.22],
  ];

  offsets.forEach(([x, y, z]) => {
    const p = new THREE.Mesh(nucleonGeo, protonMat);
    p.position.set(x, y, z);
    protonGroup.add(p);

    const n = new THREE.Mesh(nucleonGeo, neutronMat);
    n.position.set(-x * 0.95, y * 0.95, -z * 0.95);
    neutronGroup.add(n);
  });

  // Inner K-Shell (1s² - 2 electrons)
  const kRingGeo = new THREE.TorusGeometry(1.05, 0.016, 12, 64);
  const kRingMat = new THREE.MeshBasicMaterial({
    color: 0xc8a96b,
    transparent: true,
    opacity: 0.55,
  });
  const kRing = new THREE.Mesh(kRingGeo, kRingMat);
  kRing.rotation.x = Math.PI * 0.35;
  shell1sGroup.add(kRing);

  const electronGeo = new THREE.SphereGeometry(0.085, 16, 12);
  const electronMat = new THREE.MeshStandardMaterial({
    color: 0xf2eee5,
    roughness: 0.1,
    metalness: 0.2,
  });

  const kElectrons: THREE.Mesh[] = [];
  for (let i = 0; i < 2; i++) {
    const el = new THREE.Mesh(electronGeo, electronMat);
    shell1sGroup.add(el);
    kElectrons.push(el);
  }

  // Valence L-Shell (2s² 2p² - 4 electrons on 2 intersecting tilted orbital rings)
  const lRingGeo = new THREE.TorusGeometry(1.75, 0.018, 12, 72);
  const lRingMat = new THREE.MeshBasicMaterial({
    color: 0x9b4d3f,
    transparent: true,
    opacity: 0.5,
  });
  const lRing1 = new THREE.Mesh(lRingGeo, lRingMat);
  lRing1.rotation.set(Math.PI * 0.25, Math.PI * 0.2, 0);
  const lRing2 = new THREE.Mesh(lRingGeo, lRingMat);
  lRing2.rotation.set(-Math.PI * 0.25, -Math.PI * 0.2, Math.PI * 0.35);
  shell2spGroup.add(lRing1, lRing2);

  const lElectrons: THREE.Mesh[] = [];
  for (let i = 0; i < 4; i++) {
    const el = new THREE.Mesh(electronGeo, electronMat);
    shell2spGroup.add(el);
    lElectrons.push(el);
  }

  rootGroup.add(protonGroup, neutronGroup, shell1sGroup, shell2spGroup);
  registerSubPart(protonGroup, spec.parts[0], explodableParts, raycastTargets);
  registerSubPart(neutronGroup, spec.parts[1], explodableParts, raycastTargets);
  registerSubPart(shell1sGroup, spec.parts[2], explodableParts, raycastTargets);
  registerSubPart(shell2spGroup, spec.parts[3], explodableParts, raycastTargets);

  return {
    id: 'atom',
    rootGroup,
    explodableParts,
    raycastTargets,
    update: (elapsed) => {
      protonGroup.rotation.y = elapsed * 0.6;
      neutronGroup.rotation.x = -elapsed * 0.5;

      // Animate K-shell electrons
      kElectrons.forEach((el, idx) => {
        const a = elapsed * 2.4 + idx * Math.PI;
        el.position.set(
          Math.cos(a) * 1.05,
          Math.sin(a) * Math.sin(Math.PI * 0.35) * 1.05,
          Math.sin(a) * Math.cos(Math.PI * 0.35) * 1.05
        );
      });

      // Animate L-shell valence electrons
      lElectrons.forEach((el, idx) => {
        const a = elapsed * 1.65 + (idx * Math.PI) / 2;
        const tilt = idx % 2 === 0 ? 0.65 : -0.65;
        el.position.set(
          Math.cos(a) * 1.75,
          Math.sin(a) * tilt * 1.2,
          Math.sin(a) * 1.45
        );
      });
    },
  };
}

/**
 * Builds a 3D Holographic "THANK YOU" Easter Egg Ring Assembly
 */
export function buildThankYouHologram(maxAnisotropy = 4): THREE.Group {
  const group = new THREE.Group();

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(2, 16, 36, 0.85)';
  ctx.fillRect(0, 0, 1024, 256);
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 6;
  ctx.strokeRect(12, 12, 1000, 232);

  ctx.fillStyle = '#7dd3fc';
  ctx.font = '600 72px "Inter Variable", Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Thank you', 512, 108);

  ctx.fillStyle = '#eceef1';
  ctx.font = '500 28px "Inter Variable", Inter, system-ui, sans-serif';
  ctx.fillText('Jarvis · 3D science viewer', 512, 180);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;

  const plateGeo = new THREE.PlaneGeometry(3.4, 0.85);
  const plateMat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    side: THREE.DoubleSide,
  });
  const plate = new THREE.Mesh(plateGeo, plateMat);
  group.add(plate);

  const ringGeo = new THREE.TorusGeometry(1.95, 0.025, 16, 72);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x9b4d3f,
    transparent: true,
    opacity: 0.75,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI * 0.35;
  group.add(ring);

  return group;
}

export function createAllHologramModels(
  maxAnisotropy = 4
): Record<ModelId, BuiltHologramModel> {
  return {
    earth: buildEarthModel(maxAnisotropy),
    solar: buildSolarSystemModel(),
    heart: buildHeartModel(),
    dna: buildDnaModel(),
    atom: buildAtomModel(),
  };
}
