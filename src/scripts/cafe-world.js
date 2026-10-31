import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { buildStreetSet } from './cafe-scenography.js';

/**
 * Café Almar - the three-dimensional café.
 *
 * The scene is assembled from artist-authored meshes built in Blender
 * (`tools/cafe-assets/`, exported to `public/cafe/models/`) and painterly
 * surface maps authored into `public/cafe/tex/`. Nothing here is a Three.js
 * primitive standing in for an object.
 *
 * Two rules govern the staging:
 *  1. Real-world scale, one unit to the metre. The table is 86 cm across and
 *     the espresso cup is 6.3 cm, so the seated camera - not an inflated
 *     prop - is what makes the foreground feel close.
 *  2. The HTML interface is untouched. Semantic buttons stay projected over
 *     the meshes, so mouse, touch and keyboard remain equivalent.
 */
const canvas = document.getElementById('cafe-canvas');
const world = document.getElementById('cafe-world');
const layer = document.getElementById('cafe-objects');
const fallback = document.getElementById('cafe-scene-fallback');

const MODELS = '/cafe/models/';
const TEX = '/cafe/tex/';
const TABLE_TOP = 0.745;

if (canvas && world && layer) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const smallScreen = window.matchMedia('(max-width: 720px)');
  const midScreen = window.matchMedia('(max-width: 1024px)');

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas, antialias: true, alpha: false, powerPreference: 'high-performance',
    });
  } catch (error) {
    console.warn('3D scene unavailable; retaining illustrated fallback', error);
  }

  if (renderer) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const quality = {
      shadows: true,
      shadowSize: smallScreen.matches ? 1024 : 2048,
      anisotropy: Math.min(renderer.capabilities.getMaxAnisotropy(), 8),
    };

    // ------------------------------------------------------------- the light
    // Low morning sun from the left, a cool sky above and a warm bounce off
    // the pavement. The first pass was ambient-dominated, which is why every
    // surface read as the same flat value.
    const scene = new THREE.Scene();
    // Aerial perspective is doing real work here: it is what separates the
    // table from the kerb from the far end of the alley. At the first
    // density the whole street sat in one tonal plane.
    const HAZE = new THREE.Color('#dfd0b4');
    scene.fog = new THREE.FogExp2(HAZE, 0.0295);

    const sky = new THREE.HemisphereLight('#bfe0f4', '#a98c6c', 0.76);
    scene.add(sky);

    // Low morning sun raking in from the left, almost across the street
    // rather than down onto it. Two things follow from the low angle: long
    // shadows that travel right across the empty pavement and give the
    // mid-ground something to look at, and grazing light on the plaster that
    // picks out every sill, pipe and patch. The first pass lit from behind
    // the table, which hid its shadow and left it reading as a flat rug.
    const sun = new THREE.DirectionalLight('#ffdfa8', 3.5);
    sun.position.set(-12.5, 8.6, 2.6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(quality.shadowSize, quality.shadowSize);
    // Wide enough that the edge of the shadow frustum never lands inside the
    // frame; at the first size it drew a hard vertical seam across the
    // foreground pavement.
    sun.shadow.camera.left = -17;
    sun.shadow.camera.right = 17;
    sun.shadow.camera.top = 15;
    sun.shadow.camera.bottom = -13;
    sun.shadow.camera.near = 0.4;
    sun.shadow.camera.far = 60;
    sun.shadow.bias = -0.00016;
    sun.shadow.normalBias = 0.012;
    scene.add(sun);
    scene.add(sun.target);
    sun.target.position.set(0, 0.55, -3.0);

    // Sky fill from the opposite side keeps shadow sides readable without
    // flattening the key.
    const fill = new THREE.DirectionalLight('#a6c8e0', 0.55);
    fill.position.set(7.5, 3.6, 3.2);
    scene.add(fill);

    // A short-range warm bounce so the table top is not lit only from above.
    const bounce = new THREE.PointLight('#ffd3a0', 1.1, 2.6, 2.0);
    bounce.position.set(0.30, 0.90, 0.70);
    scene.add(bounce);

    // --------------------------------------------------------------- the sky
    // A vertical gradient dome rather than a flat background colour, so the
    // horizon glows warm behind the hazy end of the street. The same dome is
    // pre-filtered into an environment map below.
    const skyDome = new THREE.Mesh(
      new THREE.SphereGeometry(160, 24, 16),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          zenith: { value: new THREE.Color('#79b4d8') },
          middle: { value: new THREE.Color('#bcd9e4') },
          horizon: { value: new THREE.Color('#f2e3c6') },
        },
        vertexShader: `
          varying vec3 vPos;
          void main() {
            vPos = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: `
          uniform vec3 zenith; uniform vec3 middle; uniform vec3 horizon;
          varying vec3 vPos;
          void main() {
            float h = clamp(normalize(vPos).y * 0.5 + 0.5, 0.0, 1.0);
            vec3 c = mix(horizon, middle, smoothstep(0.46, 0.60, h));
            c = mix(c, zenith, smoothstep(0.58, 0.92, h));
            gl_FragColor = vec4(c, 1.0);
          }`,
      }),
    );
    scene.add(skyDome);

    // Pre-filter the sky into an environment map. Without one, every metal in
    // the scene renders black and the ceramic glaze, the smoked lenses and the
    // window panes have nothing to reflect - which is most of why the first
    // pass read as matte plastic rather than as glazed, polished materials.
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const envScene = new THREE.Scene();
    const envDome = skyDome.clone();
    envDome.material = skyDome.material.clone();
    envScene.add(envDome);
    // A bright ground card so reflections pick up warm bounce from below
    // rather than a black floor.
    const envGround = new THREE.Mesh(
      new THREE.PlaneGeometry(600, 600),
      new THREE.MeshBasicMaterial({ color: '#b9a687' }));
    envGround.rotation.x = -Math.PI / 2;
    envGround.position.y = -6;
    envScene.add(envGround);
    const environment = pmrem.fromScene(envScene, 0.04).texture;
    scene.environment = environment;
    scene.environmentIntensity = 0.95;
    pmrem.dispose();

    // ------------------------------------------------------------- the camera
    const camera = new THREE.PerspectiveCamera(52, 1, 0.05, 260);

    // Seated framing. `pitch` is implicit in the look target: the near edge of
    // the table enters the bottom of frame, which is what stops the scene
    // reading as a diorama viewed from across the room.
    const VIEWS = {
      // Worked out from the geometry rather than by eye: with the eye 55 cm
      // above the table top and 59 cm behind its near edge, the far edge of
      // the table lands two thirds of the way down the frame and the near
      // edge runs off the bottom. That is what makes the table read as being
      // in front of the visitor instead of across the room.
      desktop: {
        fov: 55,
        eye: new THREE.Vector3(0, 1.272, 0.955),
        look: new THREE.Vector3(0, 0.432, -2.55),
        sway: 0.085,
      },
      tablet: {
        fov: 59,
        eye: new THREE.Vector3(0, 1.282, 0.950),
        look: new THREE.Vector3(0, 0.455, -2.35),
        sway: 0.075,
      },
      // Portrait is composed separately rather than cropped: the camera comes
      // in and rotates slightly so the three props stack into the tall frame
      // instead of spreading past both edges.
      mobile: {
        fov: 64,
        eye: new THREE.Vector3(0.04, 1.292, 0.912),
        look: new THREE.Vector3(-0.05, 0.400, -2.10),
        sway: 0.055,
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
        m.color.set('#bfada6');
        m.roughness = 1.0;
        m.metalness = 0.16;
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
          if (handler) handler(material);
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
      load('glasses.glb'), load('building.glb'), load('props.glb'),
    ]).then(([tableSrc, cupSrc, menuSrc, glassesSrc, buildingSrc, propsSrc]) => {
      [tableSrc, cupSrc, menuSrc, glassesSrc, buildingSrc, propsSrc].forEach(dress);

      const kit = new Map();
      propsSrc.children.slice().forEach((child) => { kit.set(child.name, child); });
      const clone = (name) => {
        const source = kit.get(name);
        if (!source) return new THREE.Group();
        const copy = source.clone(true);
        copy.position.set(0, 0, 0);
        copy.rotation.set(0, 0, 0);
        copy.scale.setScalar(1);
        return copy;
      };

      const models = { table: tableSrc, building: buildingSrc };
      const street = buildStreetSet({ THREE, scene, models, surfaces, clone, quality });

      // The browser QA gate asserts this, after an early refactor once passed
      // a bare texture where a Material belonged and rendered nothing.
      let facadeMaterial = null;
      street.facade.traverse((node) => {
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
      menu.position.set(-0.205, TABLE_TOP, 0.045);
      menu.rotation.y = -0.30;
      scene.add(menu);

      const coffee = new THREE.Group();
      coffee.add(cupSrc);
      cupSrc.scale.setScalar(1.10);
      coffee.position.set(0.085, TABLE_TOP, 0.095);
      coffee.rotation.y = -0.62;
      scene.add(coffee);

      const glasses = new THREE.Group();
      glasses.add(glassesSrc);
      glassesSrc.scale.setScalar(1.16);
      glasses.position.set(0.272, TABLE_TOP, 0.010);
      glasses.rotation.y = 0.42;
      scene.add(glasses);

      // Incidental table dressing. These are not competing navigation targets,
      // they are the things that make a table look used.
      const ashtray = clone('Ashtray');
      ashtray.position.set(-0.325, TABLE_TOP, -0.185);
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

        // Portrait gets its own prop layout. Scaling the desktop arrangement
        // down pushed the menu and glasses past both edges of the frame.
        if (portrait) {
          menu.position.set(-0.088, TABLE_TOP, 0.090);
          menu.rotation.y = -0.17;
          coffee.position.set(0.168, TABLE_TOP, 0.028);
          glasses.position.set(0.030, TABLE_TOP, -0.180);
          glasses.rotation.y = 0.26;
          ashtray.position.set(-0.280, TABLE_TOP, -0.210);
        } else {
          menu.position.set(-0.205, TABLE_TOP, 0.045);
          menu.rotation.y = -0.30;
          coffee.position.set(0.085, TABLE_TOP, 0.095);
          glasses.position.set(0.272, TABLE_TOP, 0.010);
          glasses.rotation.y = 0.42;
          ashtray.position.set(-0.330, TABLE_TOP, -0.190);
        }

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
        skyDome.position.copy(camera.position);

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
