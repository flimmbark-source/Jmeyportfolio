import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { buildForeground } from './cafe-scenography.js';

/**
 * Café Apollo - the hybrid café.
 *
 * The street is a painted backdrop; the table and the objects on it are real
 * geometry rendered over it on a transparent canvas. That split is deliberate.
 * A real-time renderer was never going to reach the painting's brushwork, and
 * a flat image was never going to let you pick up a menu, so each half does
 * the job it is actually good at:
 *
 *   painted   the street, the architecture, the light, the people. Fixed, and
 *             far better than anything this scene could render.
 *   geometry  the table and everything on it. Lit to match the painting,
 *             casting a real shadow onto it, and shifting against it when the
 *             viewer looks around - which is the one thing the image cannot do.
 *
 * Registration between the two is handled by anchoring: the backdrop is placed
 * by its painted table line rather than by its centre (see cafe-world.css),
 * and the camera below is composed so the real table's far edge lands on that
 * same line. They stay aligned at every aspect ratio without per-breakpoint
 * fudging.
 *
 * Everything the interface relies on is unchanged: semantic buttons stay
 * projected over the meshes, so mouse, touch and keyboard remain equivalent.
 */
const canvas = document.getElementById('cafe-canvas');
const world = document.getElementById('cafe-world');
const layer = document.getElementById('cafe-objects');
const fallback = document.getElementById('cafe-scene-fallback');
const backdrop = document.getElementById('cafe-backdrop');

const MODELS = '/cafe/models/';
const TEX = '/cafe/tex/';
const TEX_BACKDROP = '/cafe/backdrop.jpg';
const TABLE_TOP = 0.745;

if (canvas && world && layer) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const smallScreen = window.matchMedia('(max-width: 720px)');
  const midScreen = window.matchMedia('(max-width: 1024px)');

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas, antialias: true, alpha: true, powerPreference: 'high-performance',
    });
  } catch (error) {
    console.warn('3D scene unavailable; retaining illustrated fallback', error);
  }

  if (renderer) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.16;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x000000, 0);

    const quality = {
      shadows: true,
      shadowSize: smallScreen.matches ? 1536 : 3072,
      anisotropy: Math.min(renderer.capabilities.getMaxAnisotropy(), 8),
    };

    // ------------------------------------------------------------- the light
    // Matched to the painting rather than invented. In the backdrop the sun
    // is low and off to the left-front: the awnings throw their shadows down
    // and to the right, the right-hand wall is raked across its face, and the
    // table catches a warm highlight along its left edge. These numbers put
    // the key in the same place, so the geometry's shadows run the same way
    // as the painted ones and the two halves read as one photograph.
    const scene = new THREE.Scene();
    // No fog: there is no distant geometry left to lose into it, and fogging
    // a transparent canvas would only wash the painting underneath.

    const sky = new THREE.HemisphereLight('#cfe6f6', '#b08a62', 1.15);
    scene.add(sky);

    const sun = new THREE.DirectionalLight('#ffe2ad', 3.7);
    sun.position.set(-4.6, 4.4, 3.4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(quality.shadowSize, quality.shadowSize);
    // The shadow frustum only has to cover the table and its near dressing
    // now, which is what buys the resolution: at this size a chip in the
    // enamel and a leaf on the pot plant are both several texels across.
    sun.shadow.camera.left = -3.2;
    sun.shadow.camera.right = 3.2;
    sun.shadow.camera.top = 3.0;
    sun.shadow.camera.bottom = -3.0;
    sun.shadow.camera.near = 0.3;
    sun.shadow.camera.far = 16;
    sun.shadow.bias = -0.00012;
    sun.shadow.normalBias = 0.018;
    scene.add(sun);
    scene.add(sun.target);
    sun.target.position.set(0.1, 0.70, -0.4);

    // Cool sky fill from the right, so the shaded sides of the cup and the
    // menu stay readable without flattening the key.
    const fill = new THREE.DirectionalLight('#a9cbe4', 0.70);
    fill.position.set(5.0, 2.6, 1.6);
    scene.add(fill);

    // A short warm bounce standing in for the light coming back off the lit
    // pavement in the painting.
    const bounce = new THREE.PointLight('#ffd09a', 1.3, 2.4, 2.0);
    bounce.position.set(-0.45, 0.95, 0.30);
    scene.add(bounce);

    // ------------------------------------------------------- the environment
    // The backdrop doubles as the environment map. Mapping a flat painting as
    // an equirectangular panorama is not physically meaningful, but the point
    // here is colour agreement, not accuracy: the glaze on the cup and the
    // smoked lenses pick up the painting's own warm stone and blue sky, so
    // the reflections cannot disagree with the street behind them. The canvas
    // itself stays transparent - the painting is a DOM layer underneath.
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const backdropTexture = new THREE.TextureLoader().load(TEX_BACKDROP);
    backdropTexture.colorSpace = THREE.SRGBColorSpace;
    backdropTexture.mapping = THREE.EquirectangularReflectionMapping;
    let environment = null;
    const applyEnvironment = () => {
      if (environment) return;
      environment = pmrem.fromEquirectangular(backdropTexture).texture;
      scene.environment = environment;
      scene.environmentIntensity = 1.05;
    };
    if (backdropTexture.image) applyEnvironment();
    else backdropTexture.addEventListener('load', applyEnvironment);

    // ------------------------------------------------------------- the camera
    const camera = new THREE.PerspectiveCamera(52, 1, 0.05, 260);

    // Composed to register with the painting, not derived in the abstract.
    // Two things have to be true at once and both are measured off the
    // backdrop: the real table's far edge has to land on the painted table
    // line at 63.5% of frame height, and the real table has to be wide enough
    // to still span the frame there, because the painted one does. That
    // second constraint is what puts the eye so close and so low - in the
    // painting you are leaning over the table, and the near edge is behind
    // the lens rather than inside the picture.
    const VIEWS = {
      desktop: {
        fov: 60,
        eye: new THREE.Vector3(0, 1.168, 0.268),
        look: new THREE.Vector3(0, 0.420, -1.870),
        sway: 0.055,
      },
      tablet: {
        fov: 64,
        eye: new THREE.Vector3(0, 1.172, 0.246),
        look: new THREE.Vector3(0, 0.430, -1.870),
        sway: 0.048,
      },
      // Portrait crops the painting hard at the sides, so the props close up
      // to stay inside the narrower horizontal angle.
      mobile: {
        fov: 70,
        eye: new THREE.Vector3(0.015, 1.180, 0.220),
        look: new THREE.Vector3(-0.02, 0.400, -1.870),
        sway: 0.038,
      },
    };
    const view = () => (smallScreen.matches ? VIEWS.mobile
      : midScreen.matches ? VIEWS.tablet : VIEWS.desktop);

    // ----------------------------------------------------------- the surfaces
    const loadTexture = (file, { repeat = 1, srgb = true, wrap = true } = {}) => {
      const texture = new THREE.TextureLoader().load(TEX + file);
      if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
      if (wrap) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(repeat, repeat);
      }
      texture.anisotropy = quality.anisotropy;
      return texture;
    };
    const surfaces = {
      // The building's UVs are world-space / 2.4 m, so a repeat below one
      // stretches a single tile over several metres of wall. At repeat 1 the
      // render damage read as leopard spots.
      plaster: loadTexture('plaster.jpg', { repeat: 0.42 }),
      plasterNormal: loadTexture('plaster-normal.jpg', { repeat: 0.42, srgb: false }),
      plasterRough: loadTexture('plaster-rough.jpg', { repeat: 0.42, srgb: false }),
      pavement: loadTexture('pavement.jpg'),
      pavementNormal: loadTexture('pavement-normal.jpg', { srgb: false }),
      asphalt: loadTexture('asphalt.jpg'),
      enamel: loadTexture('enamel.jpg', { wrap: false }),
      enamelNormal: loadTexture('enamel-normal.jpg', { wrap: false, srgb: false }),
      enamelRough: loadTexture('enamel-rough.jpg', { wrap: false, srgb: false }),
      menuCover: loadTexture('menu-cover.jpg', { wrap: false }),
      wallSign: loadTexture('wall-sign.png', { wrap: false }),
      numberPlate: loadTexture('number-plate.jpg', { wrap: false }),
    };

    // Named materials come through from Blender, so dressing them with the
    // painted maps is a lookup rather than a guess.
    const DRESS = {
      TableEnamel: (m) => {
        m.map = surfaces.enamel;
        m.normalMap = surfaces.enamelNormal;
        m.normalScale = new THREE.Vector2(0.65, 0.65);
        m.roughnessMap = surfaces.enamelRough;
        // Slightly knocked back from the raw map: full-strength the enamel
        // read as fresh pillar-box red rather than a repainted street table.
        m.color.set('#ffffff');
        m.roughness = 1.0;
        m.metalness = 0.04;
      },
      MenuCover: (m) => {
        m.map = surfaces.menuCover;
        m.color.set('#ffffff');
        m.roughness = 0.84;
      },
      Plaster: (m) => dressPlaster(m, '#f3ebdb'),
      PlasterWarm: (m) => dressPlaster(m, '#e6dbc3'),
      Trim: (m) => dressPlaster(m, '#fbf6ea'),
      WindowGlass: (m) => { m.roughness = 0.11; m.metalness = 0.55; m.envMapIntensity = 1.6; },
      GlassLens: (m) => {
        // Smoked glass that still returns a highlight. Opaque black lenses
        // read as two holes punched in the frame.
        m.color.set('#3c3630');
        m.transparent = true; m.opacity = 0.78;
        m.roughness = 0.04; m.metalness = 0.72;
        m.envMapIntensity = 1.9;
        m.side = THREE.DoubleSide;
      },
      GlassFrame: (m) => { m.color.set('#4a3425'); m.roughness = 0.19; },
      SugarGlass: (m) => { m.transparent = true; m.opacity = 0.42; m.roughness = 0.06; },
      CupGlaze: (m) => { m.roughness = 0.11; m.envMapIntensity = 1.35; },
      CupInner: (m) => { m.roughness = 0.14; },
    };
    function dressPlaster(material, tint) {
      material.map = surfaces.plaster;
      material.normalMap = surfaces.plasterNormal;
      material.normalScale = new THREE.Vector2(0.6, 0.6);
      material.roughnessMap = surfaces.plasterRough;
      material.color.set(tint);
      material.roughness = 1.0;
    }

    // Foliage ships as single-sided cards - the solidify shell was pure
    // weight - so every leaf, bract and petal material is turned double
    // sided here, and softened so it reads as a translucent leaf in sun.
    const FOLIAGE = /^(Canopy|BougLeaf|Bract|VineLeaf|Leaf)\d*$/;

    function dress(root) {
      root.traverse((node) => {
        if (!node.isMesh) return;
        node.castShadow = true;
        node.receiveShadow = true;
        const list = Array.isArray(node.material) ? node.material : [node.material];
        list.forEach((material) => {
          if (!material || material.userData.dressed) return;
          material.userData.dressed = true;
          const handler = DRESS[material.name];
          if (handler) {
            handler(material);
          } else if (FOLIAGE.test(material.name || '')) {
            material.side = THREE.DoubleSide;
            material.roughness = 0.68;
            material.envMapIntensity = 0.5;
          }
          material.needsUpdate = true;
        });
      });
      return root;
    }

    // ------------------------------------------------------------- the loader
    const loader = new GLTFLoader();
    const load = (file) => new Promise((resolve, reject) => {
      loader.load(MODELS + file, (gltf) => resolve(gltf.scene), undefined, reject);
    });

    const physical = new Map();
    let hover = null;
    function tag(id, group, anchor, sizeX, sizeY) {
      const button = document.querySelector('[data-object="' + id + '"]');
      if (button) physical.set(id, { group, anchor, button, sizeX, sizeY });
      button?.addEventListener('pointerenter', () => { hover = id; });
      button?.addEventListener('pointerleave', () => { if (hover === id) hover = null; });
      button?.addEventListener('focus', () => { hover = id; });
      button?.addEventListener('blur', () => { if (hover === id) hover = null; });
    }

    Promise.all([
      load('table.glb'), load('cup.glb'), load('menu.glb'),
      load('glasses.glb'), load('props.glb'), load('nature.glb'),
    ]).then(([tableSrc, cupSrc, menuSrc, glassesSrc, propsSrc, natureSrc]) => {
      // The corner building is still in the repository and still built by the
      // asset pipeline, but the painting supplies the street now, so loading
      // it would be geometry that never appears on screen. The foliage kit
      // does still load: one canopy from it hangs outside the frame as the
      // gobo that dapples the table.
      [tableSrc, cupSrc, menuSrc, glassesSrc, propsSrc, natureSrc].forEach(dress);

      const kit = new Map();
      [propsSrc, natureSrc].forEach((source) => {
        source.children.slice().forEach((child) => { kit.set(child.name, child); });
      });
      const clone = (name) => {
        const source = kit.get(name);
        if (!source) return new THREE.Group();
        const copy = source.clone(true);
        copy.position.set(0, 0, 0);
        copy.rotation.set(0, 0, 0);
        copy.scale.setScalar(1);
        return copy;
      };

      const models = { table: tableSrc };
      const street = buildForeground({ THREE, scene, models, surfaces, clone });
      street.swaying.forEach((entry) => {
        entry.restX = entry.node.rotation.x;
        entry.restZ = entry.node.rotation.z;
      });

      // The browser QA gate asserts this. In the hybrid it is the table, not
      // a façade, that has to be a real lit Material - an early refactor once
      // passed a bare texture where a Material belonged and rendered nothing.
      let facadeMaterial = null;
      street.table.traverse((node) => {
        if (!facadeMaterial && node.isMesh) {
          facadeMaterial = Array.isArray(node.material) ? node.material[0] : node.material;
        }
      });
      canvas.dataset.facadeMaterialValid = String(Boolean(facadeMaterial?.isMaterial));

      // ----------------------------------------------------- the café table
      const table = tableSrc;
      table.position.set(0, 0, 0);
      scene.add(table);

      const menu = new THREE.Group();
      menu.add(menuSrc);
      menu.position.set(-0.286, TABLE_TOP, 0.212);
      menu.rotation.y = -0.30;
      scene.add(menu);

      const coffee = new THREE.Group();
      coffee.add(cupSrc);
      coffee.position.set(0.118, TABLE_TOP, 0.268);
      coffee.rotation.y = -0.62;
      scene.add(coffee);

      const glasses = new THREE.Group();
      glasses.add(glassesSrc);
      glasses.position.set(0.392, TABLE_TOP, 0.178);
      glasses.rotation.y = 0.42;
      scene.add(glasses);

      // Incidental table dressing. These are not competing navigation targets,
      // they are the things that make a table look used.
      const ashtray = clone('Ashtray');
      ashtray.position.set(-0.448, TABLE_TOP, -0.112);
      ashtray.rotation.y = 0.8;
      dress(ashtray);
      scene.add(ashtray);

      tag('menu', menu, new THREE.Vector3(0, 0.012, 0), 0.19, 0.27);
      tag('coffee', coffee, new THREE.Vector3(0, 0.040, 0), 0.14, 0.11);
      tag('glasses', glasses, new THREE.Vector3(0, 0.010, -0.01), 0.14, 0.08);

      // ------------------------------------------------------------- steam
      // Real volume positions, camera-facing sprites, barely there. Espresso
      // in the sun gives a thin ribbon, not a cartoon plume.
      const puff = (() => {
        const c = document.createElement('canvas');
        c.width = c.height = 128;
        const ctx = c.getContext('2d');
        const grad = ctx.createRadialGradient(64, 64, 2, 64, 64, 62);
        grad.addColorStop(0, 'rgba(255,252,244,.50)');
        grad.addColorStop(0.5, 'rgba(250,246,236,.20)');
        grad.addColorStop(1, 'rgba(248,244,234,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 128, 128);
        const texture = new THREE.CanvasTexture(c);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
      })();
      const steam = [];
      for (let i = 0; i < 6; i += 1) {
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
          map: puff, transparent: true, depthWrite: false,
          opacity: 0.16, color: '#fff6e6', fog: false,
        }));
        sprite.scale.set(0.035, 0.05, 1);
        scene.add(sprite);
        steam.push(sprite);
      }

      // ------------------------------------------------------------ framing
      const place = () => {
        const w = world.clientWidth;
        const h = world.clientHeight;
        const v = view();
        const portrait = smallScreen.matches;

        // Each breakpoint stages the table for its own horizontal angle, not
        // just its own camera. A landscape frame at 62 degrees sees about
        // 44 degrees either side of the axis; a phone at 70 degrees sees 18.
        // The desktop spread therefore pushes the menu and the cup straight
        // off both edges of a narrow frame, so the props close up and stack
        // front-to-back as the viewport narrows rather than being scaled.
        // With the eye this close and this low, only a band of the table is
        // actually in frame - roughly z -0.16 to -0.60 - and the horizontal
        // angle collapses as the viewport narrows. So each breakpoint gets
        // its own placement AND its own prop scale: the painting shows a
        // large bistro menu filling a third of the width, which a real A5
        // card at this distance does not do on its own.
        const staging = portrait ? {
          menu: [-0.058, -0.300, -0.16, 1.02],
          coffee: [0.086, -0.240, 1.04],
          glasses: [0.034, -0.420, 0.26, 0.98],
          ashtray: [0.235, -0.520],
        } : midScreen.matches ? {
          menu: [-0.168, -0.320, -0.26, 1.16],
          coffee: [0.078, -0.270, 1.14],
          glasses: [0.222, -0.320, 0.40, 1.10],
          ashtray: [-0.120, -0.500],
        } : {
          menu: [-0.262, -0.330, -0.32, 1.30],
          coffee: [0.100, -0.280, 1.26],
          glasses: [0.400, -0.310, 0.44, 1.22],
          ashtray: [0.300, -0.490],
        };
        menuSrc.scale.setScalar(staging.menu[3]);
        cupSrc.scale.setScalar(staging.coffee[2]);
        glassesSrc.scale.setScalar(staging.glasses[3]);
        menu.position.set(staging.menu[0], TABLE_TOP, staging.menu[1]);
        menu.rotation.y = staging.menu[2];
        coffee.position.set(staging.coffee[0], TABLE_TOP, staging.coffee[1]);
        glasses.position.set(staging.glasses[0], TABLE_TOP, staging.glasses[1]);
        glasses.rotation.y = staging.glasses[2];
        ashtray.position.set(staging.ashtray[0], TABLE_TOP, staging.ashtray[1]);

        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,
          portrait ? 1.5 : 1.75));
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.fov = v.fov;
        camera.updateProjectionMatrix();
      };
      window.addEventListener('resize', place, { passive: true });
      place();

      const target = new THREE.Vector3();
      const tmp = new THREE.Vector3();
      function moveHotspots() {
        const bounds = world.getBoundingClientRect();
        for (const [, obj] of physical) {
          tmp.copy(obj.anchor);
          obj.group.localToWorld(tmp);
          const distance = camera.position.distanceTo(tmp);
          tmp.project(camera);
          const x = (tmp.x * 0.5 + 0.5) * bounds.width;
          const y = (-tmp.y * 0.5 + 0.5) * bounds.height;
          // Hit targets track the projected size of the object, with a floor
          // that keeps them comfortably tappable at phone sizes.
          const scale = (bounds.height * 0.5)
            / (Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * distance);
          const sw = Math.max(smallScreen.matches ? 76 : 64, obj.sizeX * scale * 1.12);
          const sh = Math.max(smallScreen.matches ? 58 : 48, obj.sizeY * scale * 1.12);
          const left = Math.round(Math.max(8,
            Math.min(bounds.width - sw - 8, x - sw / 2)) / 2) * 2;
          const top = Math.round(Math.max(110,
            Math.min(bounds.height - sh - 16, y - sh / 2)) / 2) * 2;
          const box = [left, top, Math.round(sw), Math.round(sh)];
          if (obj.lastBox && box.every((value, i) => value === obj.lastBox[i])) continue;
          obj.lastBox = box;
          obj.button.style.left = left + 'px';
          obj.button.style.top = top + 'px';
          obj.button.style.width = Math.round(sw) + 'px';
          obj.button.style.height = Math.round(sh) + 'px';
        }
      }

      let tick = 0;
      let last = 0;
      let frameNumber = 0;
      const cupAnchor = new THREE.Vector3();

      function frame(now) {
        requestAnimationFrame(frame);
        if (!canvas.isConnected) return;
        frameNumber += 1;
        // Do not burn GPU cycles animating a scene behind a reading view.
        if (document.body.classList.contains('is-dialog-open') && frameNumber % 8 !== 0) return;
        if (reduced.matches && frameNumber > 3 && frameNumber % 18 !== 0) return;

        const dt = Math.min(0.045, (now - last) / 1000 || 0.016);
        last = now;
        tick += dt;

        const v = view();
        const lookX = parseFloat(world.style.getPropertyValue('--look-x')) || 0;
        const lookY = parseFloat(world.style.getPropertyValue('--look-y')) || 0;

        // Seated parallax: the head shifts a few centimetres, it does not fly.
        camera.position.x = THREE.MathUtils.lerp(
          camera.position.x, v.eye.x + lookX * v.sway, 0.08);
        camera.position.y = THREE.MathUtils.lerp(
          camera.position.y, v.eye.y + lookY * v.sway * 0.45, 0.08);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, v.eye.z, 0.08);
        target.set(
          v.look.x + lookX * v.sway * 3.4,
          v.look.y + lookY * v.sway * 2.2,
          v.look.z,
        );
        camera.lookAt(target);

        // Parallax. The painting moves a little, the geometry in front of it
        // moves more, and the difference is the depth cue. Keep the backdrop
        // shift small: push it too far and the fixed perspective inside the
        // image starts to argue with the moving camera in front of it.
        if (backdrop) {
          backdrop.style.setProperty('--backdrop-x', (-lookX * 13).toFixed(2) + 'px');
          backdrop.style.setProperty('--backdrop-y', (-lookY * 8).toFixed(2) + 'px');
        }

        const animate = !reduced.matches
          && !document.body.classList.contains('is-dialog-open');
        coffee.getWorldPosition(cupAnchor);
        for (let i = 0; i < steam.length; i += 1) {
          const t = animate ? (tick * 0.22 + i / steam.length) % 1 : i / steam.length;
          steam[i].position.set(
            cupAnchor.x + Math.sin(t * 5 + i) * 0.012 + t * 0.018,
            cupAnchor.y + 0.066 + t * 0.14,
            cupAnchor.z + Math.cos(t * 4 + i) * 0.010,
          );
          const grow = 0.030 + t * 0.055;
          steam[i].scale.set(grow, grow * 1.35, 1);
          steam[i].material.opacity = Math.sin(t * Math.PI) * 0.17;
        }

        // The breeze. Each mass leans on its own period and phase, so the
        // planting never pulses in unison; the amounts are a couple of
        // degrees, which is all it takes to stop foliage looking cast in
        // resin. Reduced motion holds everything at its rest pose.
        if (animate) {
          for (let i = 0; i < street.swaying.length; i += 1) {
            const sway = street.swaying[i];
            const gust = 0.72 + 0.28 * Math.sin(tick * 0.21 + sway.phase * 0.6);
            sway.node.rotation.z = sway.restZ
              + Math.sin(tick * sway.rate + sway.phase) * sway.amount * gust;
            sway.node.rotation.x = sway.restX
              + Math.cos(tick * sway.rate * 0.73 + sway.phase) * sway.amount
                * 0.55 * gust;
          }

        }

        for (const [id, obj] of physical) {
          const desired = hover === id ? 1.035 : 1;
          obj.group.scale.setScalar(
            THREE.MathUtils.lerp(obj.group.scale.x, desired, 0.14));
        }

        moveHotspots();
        renderer.render(scene, camera);
      }

      const v0 = view();
      camera.position.copy(v0.eye);
      camera.lookAt(v0.look);
      renderer.render(scene, camera);

      canvas.classList.add('is-ready');
      fallback?.setAttribute('hidden', '');
      world.classList.add('is-three-dimensional');
      requestAnimationFrame(frame);
    }).catch((error) => {
      // Keep the illustrated fallback rather than showing an empty canvas.
      console.warn('Café assets failed to load; retaining illustrated fallback', error);
      canvas.dataset.facadeMaterialValid = 'false';
    });
  }
}
