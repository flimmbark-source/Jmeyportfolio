/**
 * Café Apollo - the foreground set.
 *
 * The street is a painted backdrop (`public/cafe/backdrop.jpg`, the approved
 * art-direction reference). Everything in this module is the real geometry
 * that sits in front of it: the table, and the near dressing that gives the
 * composition genuine parallax when the viewer looks around.
 *
 * The backdrop's own table, chair arm and potted plant are covered by that
 * geometry, so the ones rebuilt here are not decoration - they are what the
 * painting loses by being painted. A flat image cannot shift against the
 * foreground when the camera moves; these can.
 */

export function buildForeground({ THREE, scene, models, surfaces, clone }) {
  const group = new THREE.Group();
  scene.add(group);
  const swaying = [];

  // --- the table ----------------------------------------------------------
  // Scaled in plan only, never uniformly: the top has to span the frame at
  // its far edge to cover the painted one, but the height is a real table
  // height and the espresso cup standing on it is a real 6.3 cm cup.
  const table = models.table;
  // 1.30, not more. The painted table does not run edge to edge: its far
  // corners sit about a tenth of the frame in from each side, and matching
  // that is what turns a flat red band across the bottom back into a table
  // with a shape. Slightly wider than the painted one so it still covers it,
  // and the painting's own chair arm and pot plant survive around the sides.
  table.scale.set(1.30, 1, 1.30);
  table.position.set(0, 0, 0);
  group.add(table);

  // --- the moving shadow on the painted road -----------------------------
  // The street is a painting, so its shadows cannot move. To get wind across
  // it the scene has to lay a real shadow layer over the top: a transparent
  // catcher on the ground plane, and a canopy off-frame throwing leaf shadow
  // onto it. Kept to the band of pavement between the table's far edge and
  // the foot of the building - far enough back and it stops agreeing with the
  // painting's own perspective, and high enough and it starts printing leaves
  // onto painted wall that already has its own light.
  const roadShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(26, 5.4),
    new THREE.ShadowMaterial({ opacity: 0.17, transparent: true,
      depthWrite: false }));
  roadShadow.rotation.x = -Math.PI / 2;
  roadShadow.position.set(0.4, 0.004, -3.3);
  roadShadow.receiveShadow = true;
  group.add(roadShadow);

  // --- the gobo -----------------------------------------------------------
  // A canopy hung over the viewer's shoulder, well outside the frame. It is
  // here purely to break the key light into leaf shadow across the table,
  // which is the single clearest thing the painting does to the tabletop and
  // the one piece of its lighting that geometry can actually reproduce.
  //
  // Its position is solved, not guessed: from a leaf at height y the sun's
  // direction drops it onto the table top after t = (y - 0.745) / 0.521
  // metres of travel, moving +0.662t in x and -0.535t in z. Running that
  // backwards from the middle of the table is what puts it up, to the left
  // and behind the lens.
  const gobo = clone('Canopy');
  gobo.position.set(-3.30, 0, 1.80);
  gobo.rotation.y = 1.7;
  // Small on purpose: at full size the leaf mass is contiguous enough that it
  // lands as one soft smear across half the table instead of dapple. Offset
  // left, too - in the painting the shadow falls across the near-left of the
  // table and the right-hand side stays in full sun, and measuring the two
  // halves separately was the only way to catch that the first placement had
  // it exactly backwards.
  gobo.scale.setScalar(0.60);
  gobo.traverse((node) => { if (node.isMesh) node.castShadow = true; });
  group.add(gobo);
  swaying.push({ node: gobo, amount: 0.046, rate: 0.62, phase: 1.4 });

  // The canopy that dapples the road. Solved the same way as the table gobo
  // but for a point four metres further back, which puts it higher, further
  // left and further behind the lens.
  const roadGobo = clone('Canopy');
  roadGobo.position.set(-5.95, 0.9, 1.70);
  roadGobo.rotation.y = 0.6;
  roadGobo.scale.setScalar(1.05);
  roadGobo.traverse((node) => { if (node.isMesh) node.castShadow = true; });
  group.add(roadGobo);
  swaying.push({ node: roadGobo, amount: 0.030, rate: 0.37, phase: 2.6 });

  return { table, group, swaying };
}
