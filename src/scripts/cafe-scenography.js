/**
 * Café Almar street set.
 *
 * Everything here is placed at real-world scale, one unit to the metre, and
 * every solid object is an authored mesh loaded from `public/cafe/models/`
 * (built by `tools/cafe-assets/`). This module owns composition: where the
 * corner building sits, how far the side street recedes, and which silhouettes
 * fall on which third of the frame.
 *
 * Composition notes, from the reference photograph:
 *  - the white corner block is near-frontal and sits right of centre, so the
 *    barred window lands on the right third;
 *  - the side street opens on the left and recedes away from the camera;
 *  - the utility pole is deliberately off the centre line. In the first pass
 *    it ran straight down the middle of the frame and cut the image in half.
 */

const BUILDING_X = 4.15;     // pushes the corner onto the left third
const BUILDING_Z = -9.95;    // façade plane; far enough for aerial depth
const KERB_Z = -3.15;        // near kerb: the pavement we are sitting on
const FAR_KERB_Z = -7.70;    // far kerb: the street is deliberately narrow


export function buildStreetSet({ THREE, scene, models, surfaces, clone, quality }) {
  const group = new THREE.Group();
  // The whole street is turned a few degrees off the image plane. Dead-square
  // to camera, the kerbs and the façade stacked into flat horizontal bands
  // with nothing for the eye to travel along; at this angle the kerb lines
  // converge and the side street opens towards the viewer.
  group.rotation.y = -0.095;
  scene.add(group);

  const mat = (color, roughness = 1, extra = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness, ...extra });

  // ---------------------------------------------------------------- ground
  // Every ground plane gets its own copy of the maps with a repeat derived
  // from its real size, so a 1.1 m paving slab stays 1.1 m on all of them.
  // A single shared material stretched the slabs into floorboards on any
  // plane that was not square.
  const SLAB = 3.2;                                   // metres per texture tile
  const tiled = (texture, width, depth, metres) => {
    const copy = texture.clone();
    copy.needsUpdate = true;
    copy.wrapS = copy.wrapT = THREE.RepeatWrapping;
    copy.repeat.set(width / metres, depth / metres);
    return copy;
  };
  const pavingFor = (width, depth) => mat('#d8cfbe', 0.97, {
    map: tiled(surfaces.pavement, width, depth, SLAB),
    normalMap: tiled(surfaces.pavementNormal, width, depth, SLAB),
    normalScale: new THREE.Vector2(0.8, 0.8),
  });

  // A street is pavement, kerb, carriageway, kerb, pavement. The first pass
  // ran the roadway all the way to the building, so the façade rose straight
  // out of the tarmac and the middle of the frame read as a black trough.
  const slab = (width, depth, z, y = 0) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth),
      pavingFor(width, depth));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(0, y, z);
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };
  const pavement = slab(80, 30, KERB_Z + 15);                   // ours
  slab(80, 6.0, FAR_KERB_Z - 3.0);                              // theirs

  const roadDepth = Math.abs(FAR_KERB_Z - KERB_Z) + 0.2;
  const roadway = mat('#e8dfd0', 0.99, {
    map: tiled(surfaces.asphalt, 120, roadDepth, 2.4),
  });
  const road = new THREE.Mesh(new THREE.PlaneGeometry(120, roadDepth), roadway);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, -0.135, (KERB_Z + FAR_KERB_Z) / 2);
  road.receiveShadow = true;
  group.add(road);

  // Kerbs, the near one carrying the painted red-and-white no-parking banding
  // of the reference street.
  const kerbStone = mat('#c9c0b1', 0.95);
  const bandGeometry = new THREE.BoxGeometry(0.62, 0.016, 0.355);
  const bandRed = mat('#a4453f', 0.9);
  const bandWhite = mat('#ddd4c4', 0.9);
  [[KERB_Z, true], [FAR_KERB_Z, false]].forEach(([z, painted]) => {
    const kerb = new THREE.Mesh(new THREE.BoxGeometry(80, 0.15, 0.34), kerbStone);
    kerb.position.set(0, 0.075, z);
    kerb.castShadow = kerb.receiveShadow = true;
    group.add(kerb);
    if (!painted) return;
    for (let i = 0; i < 44; i += 1) {
      const band = new THREE.Mesh(bandGeometry, i % 2 ? bandWhite : bandRed);
      band.position.set(-13.9 + i * 0.64, 0.152, z);
      group.add(band);
    }
  });

  // --------------------------------------------------------- corner building
  const building = models.building;
  building.position.set(BUILDING_X, 0, BUILDING_Z);
  group.add(building);

  // Ghost sign on the plaster directly behind the table. At phone widths the
  // façade behind the props is otherwise an empty wall, and this is the one
  // piece of storybook charm the composition can carry without clutter.
  // It is parented to the building, not to the street: the street is turned a
  // few degrees, so the façade plane is not at a constant world z and a sign
  // placed in street space ends up buried inside the wall.
  const painted = new THREE.Mesh(
    new THREE.PlaneGeometry(3.3, 1.65),
    new THREE.MeshStandardMaterial({
      map: surfaces.wallSign, transparent: true, roughness: 0.98,
      depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2,
    }));
  painted.name = 'GhostSign';
  painted.position.set(-3.95, 2.28, 0.07);
  building.add(painted);

  // The side street: a receding terrace on the left, each block a different
  // height and depth so the roofline is never a repeating sawtooth.
  // The far side of the alley. It starts well in front of the corner so the
  // street reads as a slot the eye can travel down, and each block steps back
  // and changes height so the far end dissolves into haze rather than ending.
  // Heights are deliberately low. A tall terrace put the whole alley in its
  // own shadow; at two storeys the morning sun clears it and lays a lit band
  // down the far wall, which is what gives the side street its depth.
  // The first block is kept to a single storey on purpose: its roofline
  // falls just below the top of frame, so a wedge of sky opens over the mouth
  // of the side street. That slot is the only sky in the composition and it
  // is what stops the background reading as one continuous wall.
  const terrace = [
    { x: -8.55, z: -8.6, w: 2.8, h: 3.35, d: 5.0, tone: '#e9e0cd' },
    { x: -9.05, z: -14.0, w: 3.2, h: 4.45, d: 5.6, tone: '#f2ebdc' },
    { x: -8.45, z: -19.6, w: 2.6, h: 3.70, d: 5.4, tone: '#dfd6c2' },
    { x: -9.25, z: -25.2, w: 3.4, h: 5.30, d: 6.0, tone: '#eee6d4' },
    { x: -8.65, z: -31.4, w: 2.8, h: 4.30, d: 6.6, tone: '#e4dbc8' },
  ];
  const plasterFar = (tone) => mat(tone, 0.98, {
    map: surfaces.plaster,
    normalMap: surfaces.plasterNormal,
    normalScale: new THREE.Vector2(0.5, 0.5),
  });
  terrace.forEach((block, index) => {
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(block.w, block.h, block.d), plasterFar(block.tone));
    body.position.set(block.x, block.h / 2, block.z);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // A cornice band gives each block a lit top edge at distance.
    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(block.w + 0.32, 0.30, block.d + 0.32),
      mat('#f7f1e3', 0.9));
    cap.position.set(block.x, block.h - 0.12, block.z);
    group.add(cap);

    // Shop openings and shuttered upper windows facing the street.
    for (let k = 0; k < 2; k += 1) {
      const opening = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 2.05, 1.15), mat('#2d3a3c', 0.6));
      opening.position.set(block.x + block.w / 2 + 0.02, 1.10,
        block.z - block.d / 4 + k * block.d / 2);
      group.add(opening);
      const shutter = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 1.25, 0.95), mat(k ? '#5d7a72' : '#7d6a52', 0.78));
      shutter.position.set(block.x + block.w / 2 + 0.05, block.h * 0.62,
        block.z - block.d / 4 + k * block.d / 2);
      group.add(shutter);
    }
  });

  // Awnings over the first two shopfronts, where they still read as fabric.
  [[-7.05, -8.2, 0.0], [-7.45, -13.6, 0.04]].forEach(([x, z, tilt], index) => {
    const awning = clone('Awning');
    awning.position.set(x, 2.68 - index * 0.08, z);
    awning.rotation.y = -Math.PI / 2 + tilt;
    awning.scale.setScalar(index ? 0.92 : 1.0);
    awning.traverse((node) => { if (node.isMesh) node.castShadow = true; });
    group.add(awning);
  });

  // The café's own awning on the corner block. A dark horizontal above the
  // door is one of the defining notes of the reference street.
  const shopAwning = clone('Awning');
  shopAwning.position.set(BUILDING_X + 5.35, 2.92, BUILDING_Z + 0.14);
  shopAwning.rotation.y = Math.PI;
  shopAwning.scale.set(0.82, 0.86, 0.80);
  shopAwning.traverse((node) => { if (node.isMesh) node.castShadow = true; });
  group.add(shopAwning);

  // ------------------------------------------------------------ street props
  // The pole sits on the left third, framing the mouth of the side street
  // instead of bisecting the picture.
  const pole = clone('UtilityPole');
  pole.position.set(-4.40, 0, -6.05);
  pole.rotation.set(0, 0.42, 0.020);
  pole.traverse((node) => { if (node.isMesh) node.castShadow = true; });
  group.add(pole);

  // Overhead cable: one of the few straight lines allowed to cross the sky.
  const cable = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
      new THREE.Vector3(-4.40, 6.4, -6.05),
      new THREE.Vector3(1.0, 5.45, -8.4),
      new THREE.Vector3(6.0, 5.85, -10.6),
    ]), 20, 0.018, 5, false), mat('#4c524f', 0.85));
  group.add(cable);

  const sign = clone('RoundSign');
  sign.position.set(-6.05, 0, -7.6);
  sign.rotation.y = -0.30;
  sign.traverse((node) => { if (node.isMesh) node.castShadow = true; });
  group.add(sign);

  // Bollards along the kerb, irregularly spaced and slightly out of plumb -
  // a perfectly even row is the quickest way to look procedural.
  [[-5.4, 0.96, 0.05], [-3.5, 1.0, -0.03], [-1.6, 0.93, 0.02],
   [0.6, 1.02, -0.04], [2.9, 0.97, 0.03], [5.4, 1.0, -0.02],
   [8.1, 0.94, 0.04]].forEach(([x, scale, lean], index) => {
    const bollard = clone('Bollard');
    bollard.position.set(x, 0, KERB_Z + 0.42 + (index % 2) * 0.05);
    bollard.scale.setScalar(scale);
    bollard.rotation.set(lean, index * 1.1, lean * 0.6);
    bollard.traverse((node) => { if (node.isMesh) node.castShadow = true; });
    group.add(bollard);
  });

  // Planting: three pots, deliberately few. The brief rules out decorative
  // clutter, so the greenery exists to break hard architectural verticals.
  [[-6.85, -7.2, 1.0], [-7.50, -12.6, 0.86], [8.20, -10.2, 0.92]]
    .forEach(([x, z, scale], index) => {
      const pot = clone('Planter');
      pot.position.set(x, 0, z);
      pot.scale.setScalar(scale);
      pot.rotation.y = index * 1.7;
      pot.traverse((node) => { if (node.isMesh) node.castShadow = true; });
      group.add(pot);

      const bush = clone('Shrub');
      bush.position.set(x, 0.30 * scale, z);
      bush.scale.setScalar(scale * 1.05);
      bush.rotation.y = index * 2.3;
      bush.traverse((node) => { if (node.isMesh) node.castShadow = quality.shadows; });
      group.add(bush);
    });

  // A second table further up the street, so the café reads as a place that
  // has other customers rather than a single staged prop.
  const neighbour = models.table.clone(true);
  neighbour.position.set(-6.35, 0, -10.0);
  neighbour.rotation.y = 0.58;
  neighbour.traverse((node) => { if (node.isMesh) node.castShadow = true; });
  group.add(neighbour);
  [[-5.70, -9.4, 2.3], [-7.00, -10.7, -0.7]].forEach(([x, z, turn]) => {
    const seat = clone('Chair');
    seat.position.set(x, 0, z);
    seat.rotation.y = turn;
    seat.traverse((node) => { if (node.isMesh) node.castShadow = true; });
    group.add(seat);
  });

  return { facade: building, road, pavement };
}
