/**
 * Café Apollo - the living painting.
 *
 * The café is one painted image. Everything that moves in it is done by a
 * single fragment shader warping and shading that image: the foliage sways,
 * leaf shadows travel across the table and the road, the free corner of the
 * menu lifts in the draught, steam rises off the cup and bends what is behind
 * it, and the light drifts as if cloud were passing.
 *
 * There is no 3D. An earlier pass built the table and its objects as real
 * geometry over a painted street; the geometry never got close to the
 * painting's own quality, and this does - at a fraction of the weight, with
 * no Three.js and no models to download.
 *
 * The shader reads four images:
 *
 *   backdrop.jpg  the painting
 *   motion.png    four amplitude fields packed one per channel - R foliage,
 *                 G surfaces that receive travelling shade, B menu lift,
 *                 A depth for parallax (see tools/cafe-art/build_motion.py)
 *   gobo.png      a tiling sheet of leaf shadow
 *   noise.png     tiling value noise driving the wind and the steam
 *
 * The masks are amplitude fields rather than silhouettes, which is what makes
 * the canopy hinge from its branch instead of sliding about as a solid block.
 *
 * The HTML interface is untouched. The Menu, Coffee and Glasses controls are
 * ordinary buttons positioned over their painted counterparts, so mouse,
 * touch and keyboard stay equivalent.
 */
const canvas = document.getElementById('cafe-canvas');
const world = document.getElementById('cafe-world');
const layer = document.getElementById('cafe-objects');
const backdrop = document.getElementById('cafe-backdrop');

const ART = '/cafe/';
const IMAGE_W = 1672;
const IMAGE_H = 941;
// The painting is anchored by its table line rather than its centre, so the
// tabletop stays put as the viewport changes shape. Must match the
// object-position in cafe-world.css, which positions the fallback image.
const ANCHOR_Y = 0.635;

// Where each interactive object sits in the painting, as fractions of the
// image: centre x, centre y, width, height.
const HOTSPOTS = {
  menu: [0.295, 0.790, 0.280, 0.310],
  coffee: [0.566, 0.760, 0.135, 0.195],
  glasses: [0.775, 0.775, 0.155, 0.120],
};

// Portrait needs its own answer. A 16:9 painting on a 9:19.5 phone is cropped
// to about a quarter of its width, and the painted menu and sunglasses are
// simply not on screen - while the controls, sized from the image, come out
// wider than the viewport and sit on top of each other.
//
// So on narrow screens the three controls are laid across the visible band of
// tabletop instead of over their own painted objects. They stop being exactly
// on the thing they refer to, which is a real loss, but they stay visible,
// tappable and in the place the hint sends you. Fractions of the viewport:
// left, top, width, height.
const PORTRAIT_SPOTS = {
  menu: [0.055, 0.655, 0.270, 0.150],
  coffee: [0.365, 0.655, 0.270, 0.150],
  glasses: [0.675, 0.655, 0.270, 0.150],
};

// The object layer, cropped to the three objects' bounding box. Must match
// CROP in tools/cafe-art/build_objects.py. Given here bottom-up, because
// that is the orientation textures are sampled in.
const CROP = [0.118, 0.000, 0.882, 0.380];

// Each object's own patch of that layer, again bottom-up, so a transformed
// sample cannot stray into a neighbour. Then the pivot it moves about.
const OBJECTS = {
  menu:    { box: [0.128, 0.025, 0.470, 0.369], pivot: [0.163, 0.200] },
  coffee:  { box: [0.470, 0.075, 0.675, 0.366], pivot: [0.566, 0.120] },
  glasses: { box: [0.672, 0.120, 0.868, 0.322], pivot: [0.778, 0.210] },
};

const VERTEX = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAGMENT = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uPaint;
uniform sampler2D uMotion;
uniform sampler2D uGobo;
uniform sampler2D uNoise;
uniform sampler2D uObject;      // the three objects, colour
uniform sampler2D uObjectA;     // their matte
uniform sampler2D uFill;        // the tabletop behind them
uniform vec4 uCover;            // scaleU, scaleV, offsetU, offsetV
uniform vec4 uCrop;             // the object layer's rect in image space
uniform vec3 uHover;            // menu, coffee, glasses
uniform vec2 uLook;
uniform float uTime;
uniform float uLive;
uniform float uAspect;

float noise(vec2 p) { return texture2D(uNoise, p).r; }

vec2 layerUv(vec2 p) {
  return (p - uCrop.xy) / (uCrop.zw - uCrop.xy);
}

// Undo an object's transform, so a destination pixel can ask the untouched
// layer what belongs there. Rotation is done in square units or the image's
// 16:9 shape shears it.
vec2 untransform(vec2 p, vec2 pivot, float rot, float scale, vec2 shift) {
  vec2 d = (p - shift - pivot) * vec2(uAspect, 1.0);
  float c = cos(-rot), s = sin(-rot);
  d = vec2(d.x * c - d.y * s, d.x * s + d.y * c) / scale;
  return pivot + d / vec2(uAspect, 1.0);
}

float objectAlpha(vec2 src, vec4 box) {
  if (src.x < box.x || src.x > box.z || src.y < box.y || src.y > box.w) return 0.0;
  vec2 l = layerUv(src);
  if (l.x < 0.0 || l.x > 1.0 || l.y < 0.0 || l.y > 1.0) return 0.0;
  return texture2D(uObjectA, l).r;
}

void main() {
  // Screen position to image position, reproducing object-fit: cover with a
  // vertical anchor, so the shader and the fallback image agree exactly.
  float u = vUv.x * uCover.x + uCover.z;
  float vDown = (1.0 - vUv.y) * uCover.y + uCover.w;
  vec2 base = vec2(u, 1.0 - vDown);

  float depth = texture2D(uMotion, base).a;
  vec2 uv = base + uLook * (0.003 + 0.019 * depth);
  vec4 m = texture2D(uMotion, uv);

  float t = uTime;
  float gust = 0.60 + 0.40 * sin(t * 0.19) * sin(t * 0.073 + 1.3);

  // The breeze in the planting. Deliberately slight: warping painted
  // brushwork any harder than this reads as heat haze over the picture
  // rather than as leaves moving in it. The travelling leaf shadow below
  // does most of the work of making the air feel alive.
  vec2 wind = vec2(
    noise(uv * vec2(1.6, 2.9) + vec2( t * 0.0062, t * 0.0040)),
    noise(uv * vec2(2.1, 2.3) + vec2(-t * 0.0048, t * 0.0071))) - 0.5;
  vec2 sway = vec2(wind.x * 1.7, wind.y * 0.6) * m.r * 0.0034 * gust;

  vec3 col = texture2D(uPaint, uv + sway * uLive).rgb;

  // Leaf shadow travelling with the same wind. Multiplied, never replaced:
  // the painting already has its own light and this modulates it.
  vec2 gobo = uv * vec2(2.4 * uAspect, 2.4)
    + vec2(t * 0.0048, t * 0.0027) + wind * 0.055;
  float shade = texture2D(uGobo, gobo).r;
  col *= mix(1.0, 0.82 + 0.18 * shade, m.g * 0.9 * uLive);

  // ---- the objects -------------------------------------------------------
  // Lift them off the painting and put them back transformed. They are never
  // warped, so the brushwork on the menu, the cup and the glasses stays
  // exactly as painted however far they move.
  vec2 l0 = layerUv(uv);
  if (l0.x >= 0.0 && l0.x <= 1.0 && l0.y >= 0.0 && l0.y <= 1.0) {
    float resting = texture2D(uObjectA, l0).r;
    col = mix(col, texture2D(uFill, l0).rgb, resting);
  }

  // A breath of movement even untouched, so the table is never quite still.
  float idle = (0.5 + 0.5 * sin(t * 0.33)) * 0.08 * uLive;

  // The menu tips up about its spine, the way a cover lifts when you start
  // to open it: it rotates, foreshortens slightly and rises.
  float hm = uHover.x + idle * 0.5;
  vec2 srcM = untransform(uv, vec2(0.163, 0.200),
    0.052 * hm, 1.0 - 0.030 * hm, vec2(-0.0035, 0.0075) * hm);
  // The cup lifts straight off the saucer.
  float hc = uHover.y + idle * 0.35;
  vec2 srcC = untransform(uv, vec2(0.566, 0.120),
    -0.028 * hc, 1.0 + 0.040 * hc, vec2(0.0, 0.0130) * hc);
  // The glasses are nudged and turned, as though pushed aside.
  float hg = uHover.z + idle * 0.3;
  vec2 srcG = untransform(uv, vec2(0.778, 0.210),
    0.075 * hg, 1.0 + 0.030 * hg, vec2(0.0045, 0.0060) * hg);

  // Each one darkens the table under it as it rises. Offset up and left,
  // because that is where the sun is in the painting.
  vec2 castOff = vec2(-0.0032, 0.0048);
  float sm = objectAlpha(untransform(uv + castOff, vec2(0.163, 0.200),
    0.052 * hm, 1.0 - 0.030 * hm, vec2(-0.0035, 0.0075) * hm),
    vec4(0.128, 0.025, 0.470, 0.369));
  float sc = objectAlpha(untransform(uv + castOff, vec2(0.566, 0.120),
    -0.028 * hc, 1.0 + 0.040 * hc, vec2(0.0, 0.0130) * hc),
    vec4(0.470, 0.075, 0.675, 0.366));
  float sg = objectAlpha(untransform(uv + castOff, vec2(0.778, 0.210),
    0.075 * hg, 1.0 + 0.030 * hg, vec2(0.0045, 0.0060) * hg),
    vec4(0.672, 0.120, 0.868, 0.322));
  col *= 1.0 - 0.30 * (sm * hm + sc * hc + sg * hg);

  float am = objectAlpha(srcM, vec4(0.128, 0.025, 0.470, 0.369));
  col = mix(col, texture2D(uObject, layerUv(srcM)).rgb, am);
  float ag = objectAlpha(srcG, vec4(0.672, 0.120, 0.868, 0.322));
  col = mix(col, texture2D(uObject, layerUv(srcG)).rgb, ag);
  float ac = objectAlpha(srcC, vec4(0.470, 0.075, 0.675, 0.366));
  col = mix(col, texture2D(uObject, layerUv(srcC)).rgb, ac);

  // Hovering warms the object a touch, which reads as attention.
  col *= 1.0 + 0.10 * (am * uHover.x + ac * uHover.y + ag * uHover.z);

  // ---- steam -------------------------------------------------------------
  // Tracks the cup, so it keeps rising from the rim as the cup lifts.
  vec2 cup = vec2(0.566, 1.0 - 0.672) + vec2(0.0, 0.0130) * hc;
  vec2 d = (uv - cup) * vec2(uAspect, 1.0);
  float rise = d.y;
  float wobbleAt = (noise(vec2(rise * 2.4, t * 0.055)) - 0.5) * 0.12 * rise;
  float lateral = (d.x - wobbleAt) / (0.009 + rise * 0.40);
  float plume = exp(-lateral * lateral)
    * smoothstep(0.0, 0.018, rise) * smoothstep(0.26, 0.04, rise);
  plume *= 0.40 + 0.60 * noise(vec2(uv.x * 2.2, uv.y * 1.1 - t * 0.080));
  plume = max(plume, 0.0) * uLive * (1.0 + 0.5 * uHover.y);
  col += vec3(1.0, 0.965, 0.90) * plume * 0.32;

  // High cloud crossing the sun.
  float weather = sin(t * 0.041) * 0.5 + 0.5;
  col *= mix(vec3(0.972, 0.984, 1.018), vec3(1.034, 1.006, 0.968),
             weather * uLive + (1.0 - uLive) * 0.5);

  gl_FragColor = vec4(col, 1.0);
}`;

if (canvas && world && layer) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: false })
    || canvas.getContext('webgl', { alpha: false, antialias: false });

  if (!gl) {
    // The painted fallback image underneath is already correct; leave it.
    console.warn('WebGL unavailable; the café stays a still painting');
  } else try {
    const compile = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader) || 'shader failed');
      }
      return shader;
    };

    const program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) || 'link failed');
    }
    gl.useProgram(program);

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uniform = (name) => gl.getUniformLocation(program, name);
    const U = {
      cover: uniform('uCover'), look: uniform('uLook'), time: uniform('uTime'),
      live: uniform('uLive'), aspect: uniform('uAspect'), hover: uniform('uHover'),
    };

    const loadTexture = (file, unit, repeat) => new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        const wrap = repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        resolve(texture);
      };
      image.onerror = () => reject(new Error('could not load ' + file));
      image.src = ART + file;
    });

    // gobo and noise tile, so they are power-of-two and wrap; the painting and
    // the masks are clamped, which is what lets them stay their native size.
    Promise.all([
      loadTexture('backdrop.jpg', 0, false),
      loadTexture('motion.png', 1, false),
      loadTexture('gobo.png', 2, true),
      loadTexture('noise.png', 3, true),
      loadTexture('objects.jpg', 4, false),
      loadTexture('objects-alpha.png', 5, false),
      loadTexture('objects-fill.jpg', 6, false),
    ]).then(() => {
      gl.uniform1i(uniform('uPaint'), 0);
      gl.uniform1i(uniform('uMotion'), 1);
      gl.uniform1i(uniform('uGobo'), 2);
      gl.uniform1i(uniform('uNoise'), 3);
      gl.uniform1i(uniform('uObject'), 4);
      gl.uniform1i(uniform('uObjectA'), 5);
      gl.uniform1i(uniform('uFill'), 6);
      gl.uniform1f(U.aspect, IMAGE_W / IMAGE_H);
      gl.uniform4f(uniform('uCrop'), CROP[0], CROP[1], CROP[2], CROP[3]);

      // Pointer and keyboard both raise an object. Focus counts, so tabbing
      // through the controls shows the same response as hovering them.
      const want = { menu: 0, coffee: 0, glasses: 0 };
      const have = { menu: 0, coffee: 0, glasses: 0 };
      for (const id of Object.keys(OBJECTS)) {
        const button = document.querySelector('[data-object="' + id + '"]');
        if (!button) continue;
        const set = (value) => () => { want[id] = value; };
        button.addEventListener('pointerenter', set(1));
        button.addEventListener('pointerleave', set(0));
        button.addEventListener('focus', set(1));
        button.addEventListener('blur', set(0));
      }

      let cover = { scale: 1, offsetX: 0, offsetY: 0 };

      const place = () => {
        const w = world.clientWidth;
        const h = world.clientHeight;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        gl.viewport(0, 0, canvas.width, canvas.height);

        // object-fit: cover, anchored on the table line.
        const scale = Math.max(w / IMAGE_W, h / IMAGE_H);
        const offsetX = (w - IMAGE_W * scale) * 0.5;
        const offsetY = (h - IMAGE_H * scale) * ANCHOR_Y;
        cover = { scale, offsetX, offsetY };
        gl.uniform4f(U.cover,
          w / (scale * IMAGE_W), h / (scale * IMAGE_H),
          -offsetX / (scale * IMAGE_W), -offsetY / (scale * IMAGE_H));

        // Wide enough to show the painted objects, the controls sit on them
        // through the same mapping the shader uses, so they stay registered
        // at every aspect ratio. Too narrow, and they fall back to a row.
        const portrait = w / h < 1.15;
        for (const id of Object.keys(HOTSPOTS)) {
          const button = document.querySelector('[data-object="' + id + '"]');
          if (!button) continue;
          let px;
          let py;
          let pw;
          let ph;
          if (portrait) {
            const [fx, fy, fw, fh] = PORTRAIT_SPOTS[id];
            pw = Math.max(72, fw * w);
            ph = Math.max(56, fh * h);
            px = fx * w;
            py = fy * h;
          } else {
            const [cx, cy, bw, bh] = HOTSPOTS[id];
            pw = Math.max(64, bw * IMAGE_W * scale);
            ph = Math.max(52, bh * IMAGE_H * scale);
            px = offsetX + cx * IMAGE_W * scale - pw / 2;
            py = offsetY + cy * IMAGE_H * scale - ph / 2;
          }
          button.style.left = Math.round(Math.max(6, Math.min(w - pw - 6, px))) + 'px';
          button.style.top = Math.round(Math.max(96, Math.min(h - ph - 12, py))) + 'px';
          button.style.width = Math.round(pw) + 'px';
          button.style.height = Math.round(ph) + 'px';
        }
      };
      window.addEventListener('resize', place, { passive: true });
      place();

      let start = 0;
      let frames = 0;
      let lookX = 0;
      let lookY = 0;
      let settled = false;
      function frame(now) {
        requestAnimationFrame(frame);
        if (!canvas.isConnected) return;
        if (!start) start = now;
        frames += 1;

        const live = reduced.matches ? 0 : 1;
        // Nothing behind a reading view needs sixty frames a second.
        if (document.body.classList.contains('is-dialog-open') && frames % 8 !== 0) {
          return;
        }

        const targetX = parseFloat(world.style.getPropertyValue('--look-x')) || 0;
        const targetY = parseFloat(world.style.getPropertyValue('--look-y')) || 0;
        const moved = Math.abs(targetX - lookX) > 0.0005
          || Math.abs(targetY - lookY) > 0.0005;
        lookX += (targetX - lookX) * 0.07;
        lookY += (targetY - lookY) * 0.07;

        // Under reduced motion the painting is static, so once it has settled
        // there is nothing to redraw until the viewer looks around or raises
        // an object.
        settled = true;

        // Ease towards the wanted state so objects settle rather than snap.
        let hovering = false;
        for (const id of Object.keys(have)) {
          have[id] += (want[id] - have[id]) * 0.16;
          if (Math.abs(want[id] - have[id]) > 0.002) hovering = true;
        }

        if (!live && settled && !moved && !hovering) return;

        gl.uniform1f(U.time, live ? (now - start) / 1000 : 0);
        gl.uniform1f(U.live, live);
        gl.uniform2f(U.look, -lookX * 0.9, lookY * 0.55);
        gl.uniform3f(U.hover, have.menu, have.coffee, have.glasses);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      requestAnimationFrame(frame);

      canvas.dataset.sceneReady = 'true';
      canvas.classList.add('is-ready');
      world.classList.add('is-three-dimensional');
      backdrop?.classList.add('is-behind');
    }).catch((error) => {
      // The painted fallback is already on screen and already correct.
      console.warn('Café art failed to load; the painting stays still', error);
      canvas.dataset.sceneReady = 'false';
    });
  } catch (error) {
    // A shader that will not compile is not worth taking the page down for.
    // The painting underneath is already drawn and already correct.
    console.warn('Café shader unavailable; the painting stays still', error);
    canvas.dataset.sceneReady = 'false';
  }
}
