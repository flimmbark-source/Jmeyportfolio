import { buildStreetSet } from './cafe-scenography.js';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/**
 * Three-dimensional café environment.
 * The existing Astro/Menu/reading states remain HTML, while the world and
 * objects share one camera, real geometry and one lighting model.
 * All major objects have semantic buttons positioned over their projected
 * meshes, keeping mouse, touch and keyboard navigation equivalent.
 */
const canvas = document.getElementById('cafe-canvas');
const world = document.getElementById('cafe-world');
const layer = document.getElementById('cafe-objects');
const fallback = document.getElementById('cafe-scene-fallback');
if (canvas && world && layer) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const smallScreen = window.matchMedia('(max-width: 720px)');
  const base = new THREE.Color('#d7d5c6');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#bcdce1');
  scene.fog = new THREE.FogExp2('#ddd0b6', 0.011);
  const camera = new THREE.PerspectiveCamera(51, 1, 0.08, 120);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas, antialias: true, alpha: false, powerPreference: 'high-performance'
    });
  } catch (error) {
    console.warn('3D scene unavailable; retaining illustrated fallback', error);
  }

  if (renderer) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.24;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    canvas.classList.add('is-ready');
    fallback?.setAttribute('hidden', '');
    world.classList.add('is-three-dimensional');

    const ambient = new THREE.HemisphereLight('#e8f7ff', '#79685e', 1.35);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight('#ffdfae', 3.1);
    sun.position.set(-6, 13, 7);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -14;
    sun.shadow.camera.right = 14;
    sun.shadow.camera.top = 15;
    sun.shadow.camera.bottom = -13;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 55;
    sun.shadow.bias = -0.00025;
    sun.shadow.normalBias = 0.026;
    scene.add(sun);
    const fill = new THREE.DirectionalLight('#b6d9e1', 1.4);
    fill.position.set(6, 5, -4);
    scene.add(fill);

    const mat = (color, roughness = 0.92, extra = {}) =>
      new THREE.MeshStandardMaterial({color, roughness, ...extra});
    const mats = {
      wall: mat('#eee3cb', 1),
      whiteWall: mat('#f4f1e6', 1),
      wallShadow: mat('#d9d8ce', 1),
      stone: mat('#b2a8a0', 1),
      curb: mat('#c6b6aa', 1),
      redPaint: mat('#bb5c58', 1),
      dark: mat('#404e4e', 1),
      iron: mat('#575c59', 0.72, {metalness:0.35}),
      wood: mat('#7b4d37', 1),
      pavement: mat('#797778', 1),
      glass: mat('#405969', 0.23, {metalness:0.14}),
      foliage: [mat('#4d7453'),mat('#68835c'),mat('#416747'),mat('#899366'),mat('#567d5d')],
      ceramic: mat('#225979', 0.19),
      porcelain: mat('#f2eee1',0.24),
      paper: mat('#f1dfbd',0.95),
      redTable: mat('#b2453d',0.87,{metalness:0.08}),
      menuSpine: mat('#6b5543',1),
      lens: mat('#302e2c',0.15,{metalness:0.28}),
      spectacle: mat('#5d3c2b',0.38,{metalness:0.22})
    };

    function texture(draw, width=512, height=512) {
      const c=document.createElement('canvas');
      c.width=width;c.height=height;
      const ctx=c.getContext('2d');
      draw(ctx,width,height);
      const t=new THREE.CanvasTexture(c);
      t.colorSpace=THREE.SRGBColorSpace;
      t.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);
      return t;
    }
    function seeded(seed) {
      let v=seed;
      return () => ((v=(v*1664525+1013904223)>>>0)/4294967296);
    }
    function plaster(baseColor,seed=2) {
      // Layered, imperfect watercolour-plaster surface. Broad pigment washes
      // matter more visually than random high-frequency noise.
      const random=seeded(seed);
      const t=texture((ctx,w,h)=>{
        ctx.fillStyle=baseColor;ctx.fillRect(0,0,w,h);
        const wash=ctx.createLinearGradient(0,0,w,h);
        wash.addColorStop(0,'rgba(255,255,243,.09)');
        wash.addColorStop(.4,'rgba(255,247,224,0)');
        wash.addColorStop(1,'rgba(106,88,79,.10)');
        ctx.fillStyle=wash;ctx.fillRect(0,0,w,h);
        for(let i=0;i<170;i++){
          const x=random()*w,y=random()*h;
          const rx=10+random()*110,ry=2+random()*35;
          ctx.globalAlpha=.018+random()*.028;
          ctx.fillStyle=random()>.45?'#755e51':'#fffcf2';
          ctx.beginPath();ctx.ellipse(x,y,rx,ry,(random()-.5)*1.1,0,Math.PI*2);
          ctx.fill();
        }
        ctx.globalAlpha=1;
        for(let i=0;i<2900;i++){
          const x=random()*w,y=random()*h,r=random()*2.8+.3;
          ctx.fillStyle=random()<.5?'rgba(112,81,61,.055)':'rgba(255,255,255,.11)';
          ctx.fillRect(x,y,r*2,r);
        }
        for(let i=0;i<145;i++){
          const x=random()*w,y=random()*h;
          ctx.strokeStyle=random()>.5?'rgba(118,95,75,.08)':'rgba(255,255,255,.14)';
          ctx.lineWidth=random()*1.8+.4;
          ctx.beginPath();ctx.moveTo(x,y);
          ctx.bezierCurveTo(x+random()*7,y+random()*3,x+random()*18,y+random()*7,x+random()*33,y+random()*4);
          ctx.stroke();
        }
        // Water-damage and raised stucco around lower edges.
        for(let i=0;i<26;i++){
          const x=random()*w,y=h*(.74+random()*.25);
          ctx.fillStyle='rgba(111,102,83,'+(.018+random()*.026)+')';
          ctx.beginPath();ctx.ellipse(x,y,8+random()*62,1+random()*12,0,0,Math.PI*2);
          ctx.fill();
        }
      });
      t.wrapS=t.wrapT=THREE.RepeatWrapping;
      t.repeat.set(2,2);
      return t;
    }
    const plasterWarm = mat('#ffffff',1,{map:plaster('#e7decc',4)});
    const plasterLight = mat('#ffffff',1,{map:plaster('#f3ede1',7)});
    const plasterPale = mat('#ffffff',1,{map:plaster('#dad5c9',12)});
    const roadTexture = texture((ctx,w,h)=>{
      const random=seeded(42);
      ctx.fillStyle='#97938f';ctx.fillRect(0,0,w,h);
      let y=0,row=0;
      while(y<h){
        const ht=45+random()*11;let x= row%2?-24:0;
        while(x<w){
          const len=76+random()*32;
          const v=Math.floor(random()*29);
          ctx.fillStyle='rgb('+(132+v)+','+(130+v)+','+(127+v)+')';
          ctx.fillRect(x+2,y+2,len-4,ht-4);
          ctx.strokeStyle='rgba(81,74,70,.17)';ctx.lineWidth=2;
          ctx.strokeRect(x+2,y+2,len-4,ht-4);
          x+=len;
        } y+=ht;row++;
      }
    });
    roadTexture.wrapS=roadTexture.wrapT=THREE.RepeatWrapping;
    roadTexture.repeat.set(2.5,15);
    mats.pavement.map=roadTexture;
    mats.pavement.needsUpdate=true;
    // The chipped original table is a painted surface, not a flat coral slab.
    const paint = texture((ctx,w,h)=>{
      const rnd=seeded(902);
      ctx.fillStyle='#a63d39';ctx.fillRect(0,0,w,h);
      const glaze=ctx.createLinearGradient(0,0,w,h);
      glaze.addColorStop(0,'rgba(244,120,87,.21)');
      glaze.addColorStop(.5,'rgba(146,33,37,.03)');
      glaze.addColorStop(1,'rgba(60,19,27,.24)');
      ctx.fillStyle=glaze;ctx.fillRect(0,0,w,h);
      for(let i=0;i<2800;i++){
        const x=rnd()*w,y=rnd()*h,r=rnd()*5+.3;
        ctx.fillStyle=rnd()>.56?'rgba(248,205,171,.07)':'rgba(71,25,28,.08)';
        ctx.beginPath();ctx.ellipse(x,y,r*2,r*(.15+rnd()*.65),rnd()*3,0,6.29);ctx.fill();
      }
      for(let i=0;i<270;i++){
        const x=rnd()*w,y=rnd()*h,r=2+rnd()*13;
        ctx.fillStyle=rnd()>.6?'#d1afa0':'#6d6660';
        ctx.globalAlpha=.28+rnd()*.35;
        ctx.beginPath();ctx.moveTo(x-r*.6,y);ctx.lineTo(x+r*.45,y-r*.35);
        ctx.lineTo(x+r,y+r*.15);ctx.lineTo(x-r*.3,y+r*.3);ctx.closePath();ctx.fill();
      }
      ctx.globalAlpha=1;
      for(let i=0;i<230;i++){
        ctx.strokeStyle='rgba(247,219,184,'+(rnd()*.21)+')';ctx.lineWidth=rnd()*1.5+.4;
        const x=rnd()*w,y=rnd()*h;ctx.beginPath();ctx.moveTo(x,y);
        ctx.lineTo(x+8+rnd()*45,y-1+rnd()*5);ctx.stroke();
      }
    },1024,1024);
    mats.redTable.map=paint;mats.redTable.color.set('#ffffff');mats.redTable.needsUpdate=true;


    const addMesh=(parent,geometry,material,x=0,y=0,z=0)=>{
      const m=new THREE.Mesh(geometry,material);
      m.position.set(x,y,z);
      m.castShadow=false;m.receiveShadow=true;
      parent.add(m);return m;
    };
    const box=(parent,w,h,d,material,x,y,z,rounded=0)=>{
      const geom=rounded?new RoundedBoxGeometry(w,h,d,3,rounded):new THREE.BoxGeometry(w,h,d);
      const mesh=addMesh(parent,geom,material,x,y,z);
      mesh.castShadow=(material===mats.redTable || material===mats.ceramic || material===mats.wood ||
        material===mats.menuSpine || material===mats.paper);
      return mesh;
    };
    const plane=(parent,w,h,material,x,y,z,rx=-Math.PI/2)=>{
      const m=addMesh(parent,new THREE.PlaneGeometry(w,h),material,x,y,z);
      m.rotation.x=rx;m.castShadow=false;return m;
    };
    const cylinder=(parent,rt,rb,h,material,x,y,z,segments=16)=>{
      return addMesh(parent,new THREE.CylinderGeometry(rt,rb,h,segments),material,x,y,z);
    };
    const sphere=(parent,r,material,x,y,z)=>{
      return addMesh(parent,new THREE.SphereGeometry(r,9,7),material,x,y,z);
    };
    function line(parent,a,b,r,material,segments=9) {
      const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b);
      const mid=va.clone().add(vb).multiplyScalar(.5);
      const m=cylinder(parent,r,r,va.distanceTo(vb),material,mid.x,mid.y,mid.z,segments);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),vb.sub(va).normalize());
      return m;
    }
    const streetSet=buildStreetSet({THREE,scene,mat,mats,box,plane,cylinder,sphere,line,plaster,texture,seeded});
    canvas.dataset.facadeMaterialValid=String(Boolean(streetSet.facade.material?.isMaterial));

    // The original rectangular weathered red metal table, not a round café set.
    const table = new THREE.Group();scene.add(table);
    table.position.set(0,0,2.68);
    const top=box(table,4.45,.13,2.46,mats.redTable,0,1.0,0,.085);
    top.receiveShadow=true;
    const rim=mat('#873530',.52,{metalness:.24});
    for(const x of [-2.17,2.17]) box(table,.065,.14,2.33,rim,x,.96,0,.02);
    for(const z of [-1.17,1.17]) box(table,4.28,.14,.06,rim,0,.96,z,.02);
    const legs=mat('#30363b',.75,{metalness:.35});
    cylinder(table,.1,.105,.96,legs,0,.46,0);
    box(table,1.4,.12,.65,legs,0,.12,0,.04);
    const random=seeded(567);
    // Chipped paint and scattered wear, drawn in world coordinates on the top.
    for(let i=0;i<130;i++){
      const x=(random()-.5)*4.05,z=(random()-.5)*2.15;
      const size=.009+random()*.032;
      const patch=box(table,size,.003,size*.4,mat(random()>.48?'#d38b77':'#703133'),x,1.069,z,.001);
      patch.rotation.y=random()*6.3;patch.castShadow=false;
    }

    const physical = new Map();
    function tag(id,group,anchor,sizeX,sizeY) {
      scene.add(group);
      const button=document.querySelector('[data-object="'+id+'"]');
      if (button) physical.set(id,{group,anchor,button,sizeX,sizeY});
      button?.addEventListener('pointerenter',()=>{hover=id;});
      button?.addEventListener('pointerleave',()=>{if(hover===id)hover=null;});
      button?.addEventListener('focus',()=>{hover=id;});
      button?.addEventListener('blur',()=>{if(hover===id)hover=null;});
    }

    // Printed paper texture with restrained café branding, not a website button.
    const menuCover=texture((ctx,w,h)=>{
      ctx.fillStyle='#eadbbf';ctx.fillRect(0,0,w,h);
      const rand=seeded(11);
      for(let i=0;i<1150;i++){
        const x=rand()*w,y=rand()*h;
        ctx.fillStyle='rgba(77,60,46,'+(rand()*.09)+')';ctx.fillRect(x,y,rand()*3+1,rand()*2+1);
      }
      ctx.strokeStyle='#9c8463';ctx.lineWidth=5;ctx.strokeRect(35,36,w-70,h-72);
      ctx.lineWidth=1.5;ctx.strokeRect(48,48,w-96,h-96);
      ctx.textAlign='center';ctx.fillStyle='#695139';
      ctx.font='italic 35px Georgia';ctx.fillText('a morning at',w/2,135);
      ctx.font='bold 82px Georgia';ctx.fillText('ALMAR',w/2,246);
      ctx.font='20px Georgia';ctx.fillText('CAFÉ • EST. ALWAYS',w/2,286);
      ctx.strokeStyle='#8d8158';ctx.lineWidth=8;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(195,395);ctx.quadraticCurveTo(255,337,347,360);ctx.stroke();
      for(let i=0;i<6;i++){
        const bx=216+i*23,by=380-i*5;
        ctx.fillStyle=i%2?'#697858':'#7d8b5f';
        ctx.beginPath();ctx.ellipse(bx,by-15,22,10,i%2?-.9:.65,0,Math.PI*2);ctx.fill();
      }
      ctx.fillStyle='#836c55';ctx.font='italic 24px Georgia';ctx.fillText('coffee · conversation · curiosities',w/2,461);
    });
    const menu=new THREE.Group();
    menu.position.set(-1.28,1.09,2.85);
    menu.rotation.y=-.12;
    box(menu,1.38,.055,.94,mats.menuSpine,0,.015,0,.025);
    box(menu,1.3,.058,.90,mats.paper,.02,.055,-.01,.025);
    const cover=plane(menu,1.26,.86,new THREE.MeshStandardMaterial({map:menuCover,roughness:.91}),.02,.089,-.01);
    cover.rotation.z=-.018;
    box(menu,.09,.082,.94,mats.menuSpine,-.64,.055,0,.012);
    for(const x of [-.55,.6])for(const z of [-.4,.39])
      cylinder(menu,.012,.012,.008,mat('#b79962',.42,{metalness:.3}),x,.094,z,8);
    tag('menu',menu,new THREE.Vector3(0,.12,0),1.4,.96);

    // Actual hollow ceramic cup, espresso surface, saucer and handle.
    const coffee=new THREE.Group();coffee.position.set(.1,1.07,2.25);
    coffee.scale.setScalar(.87);
    cylinder(coffee,.51,.49,.07,mats.ceramic,0,.02,0,44);
    cylinder(coffee,.4,.4,.013,mats.porcelain,0,.057,0,44);
    const profile=[
      new THREE.Vector2(.245,.055),new THREE.Vector2(.30,.07),
      new THREE.Vector2(.335,.14),new THREE.Vector2(.37,.34),
      new THREE.Vector2(.398,.40),new THREE.Vector2(.402,.415)
    ];
    addMesh(coffee,new THREE.LatheGeometry(profile,48),mats.ceramic,0,0,0);
    const rimRing=addMesh(coffee,new THREE.TorusGeometry(.389,.028,10,48),mats.porcelain,0,.418,0);
    rimRing.rotation.x=Math.PI/2;
    const coffeeSurface=cylinder(coffee,.355,.355,.012,mat('#4c2c23',.17,{metalness:.07}),0,.362,0,48);
    const crema=addMesh(coffee,new THREE.TorusGeometry(.23,.024,6,44),mat('#b98a5c',.26),.04,.373,0);
    crema.rotation.x=Math.PI/2;crema.scale.set(1,.7,1);
    const handle=addMesh(coffee,new THREE.TorusGeometry(.175,.057,10,24),mats.ceramic,.47,.257,0);
    handle.rotation.y=Math.PI/2;
    // The blue-glazed ceramic is intentionally undecorated; its irregular
    // reflections, ivory rim, and espresso crema carry the material character.
    const blueGlaze=mat('#2a6682',.2);
    const cupBase=cylinder(coffee,.27,.27,.034,blueGlaze,0,.073,0,36);
    cupBase.receiveShadow=true;
    tag('coffee',coffee,new THREE.Vector3(0,.25,0),.88,.82);

    // Sunglasses physically resting beside the cup; no magic graphics at idle.
    const glasses=new THREE.Group();
    glasses.position.set(1.3,1.105,2.98);
    glasses.rotation.y=-.1;glasses.rotation.z=.07;
    for(const x of [-.26,.26]){
      const frame=addMesh(glasses,new THREE.TorusGeometry(.215,.043,9,27),mats.spectacle,x,.074,0);
      frame.scale.set(1.18,.72,1);
      const lens=addMesh(glasses,new THREE.CircleGeometry(.19,30),mats.lens,x,.077,-.008);
      lens.scale.set(1.16,.71,1);
      lens.material.transparent=true;lens.material.opacity=.83;lens.material.side=THREE.DoubleSide;
      const glint=box(glasses,.09,.007,.007,mat('#afafa1',.18,{metalness:.65}),x-.04,.14,.025,.004);
      glint.rotation.z=.2;
      line(glasses,[x+(x<0?-.2:.2),.08,0],[x+(x<0?-.26:.26),.03,-.3],.027,mats.spectacle);
    }
    line(glasses,[-.06,.10,0],[.06,.10,0],.035,mats.spectacle);
    tag('glasses',glasses,new THREE.Vector3(0,.11,0),1.18,.45);

    // The receipt is incidental, not a competing interactive navigation card.
    const receiptTex=texture((ctx,w,h)=>{
      ctx.fillStyle='#ead9bc';ctx.fillRect(0,0,w,h);
      ctx.fillStyle='#655647';ctx.textAlign='center';
      ctx.font='bold 34px monospace';ctx.fillText('ALMAR',w/2,95);
      ctx.font='22px monospace';
      ctx.fillText('ESPRESSO       1',w/2,175);
      ctx.fillText('MORNING        1',w/2,215);
      ctx.fillText('-----------------',w/2,270);
      ctx.fillText('TAKE YOUR TIME',w/2,315);
    });
    const receipt=plane(scene,.38,.67,new THREE.MeshStandardMaterial({map:receiptTex,roughness:1,side:THREE.DoubleSide}),
      .81,1.08,1.92);
    receipt.rotation.z=-.25;
    const ash=mat('#7d7468',.55,{metalness:.35});
    cylinder(scene,.22,.22,.068,ash,1.77,1.11,1.88,22);
    cylinder(scene,.14,.14,.068,mat('#4e4b46'),1.77,1.145,1.88,22);

    // Subtle steam uses real volume positions and camera-facing transparent sprites.
    const puffTexture=texture((ctx,w,h)=>{
      const grad=ctx.createRadialGradient(w/2,h/2,2,w/2,h/2,w*.48);
      grad.addColorStop(0,'rgba(248,244,232,.58)');
      grad.addColorStop(.5,'rgba(242,240,229,.24)');
      grad.addColorStop(1,'rgba(238,236,225,0)');
      ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
    },128,128);
    const steam=[];
    for(let i=0;i<7;i++){
      const material=new THREE.SpriteMaterial({
        map:puffTexture,transparent:true,depthWrite:false,opacity:.30,color:'#fff5e3'
      });
      const sprite=new THREE.Sprite(material);
      sprite.position.set(.1,1.55,2.25);
      sprite.scale.set(.26,.42,1);
      scene.add(sprite);
      steam.push(sprite);
    }

    // A few restrained environmental details: enamel sign and a distant chair.
    const chalk=texture((ctx,w,h)=>{
      ctx.fillStyle='#324043';ctx.fillRect(0,0,w,h);
      ctx.strokeStyle='#c4b99d';ctx.lineWidth=8;ctx.strokeRect(24,24,w-48,h-48);
      ctx.textAlign='center';ctx.fillStyle='#e7dcbf';
      ctx.font='italic 51px Georgia';ctx.fillText('good coffee',w/2,195);
      ctx.font='39px Georgia';ctx.fillText('slow mornings',w/2,265);
      ctx.font='30px Georgia';ctx.fillText('↝',w/2,343);
    });
    const sign=plane(scene,1.18,1.0,new THREE.MeshStandardMaterial({map:chalk,roughness:1,side:THREE.DoubleSide}),-3.84,1.57,-3.2,0);
    sign.rotation.y=Math.PI/2;
    line(scene,[-3.84,1.1,-3.2],[-3.84,.1,-3.2],.045,mats.wood);

    const place = () => {
      const w=world.clientWidth,h=world.clientHeight;
      // Portrait uses a closer, narrower table staging. It is still the same
      // seated world, but props remain visible rather than shrinking to dots.
      if (smallScreen.matches) {
        table.scale.set(.84,1,1.58);
        table.position.z=2.85;
        menu.position.set(-.88,1.09,3.1);
        coffee.position.set(.18,1.07,2.30);
        glasses.position.set(.95,1.105,3.13);
      } else {
        table.scale.set(1,1,1);
        table.position.z=2.68;
        menu.position.set(-1.28,1.09,2.85);
        coffee.position.set(.1,1.07,2.25);
        glasses.position.set(1.3,1.105,2.98);
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,smallScreen.matches?1:1.25));
      renderer.setSize(w,h,false);
      camera.aspect=w/h;camera.fov=smallScreen.matches?68:51;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize',place,{passive:true});
    place();

    let hover=null, tick=0, last=0;
    let frameNumber=0;
    const tmp=new THREE.Vector3();
    function moveHotspots() {
      const bounds=world.getBoundingClientRect();
      for(const [id,obj] of physical) {
        tmp.copy(obj.anchor);
        obj.group.localToWorld(tmp);
        tmp.project(camera);
        const x=(tmp.x*.5+.5)*bounds.width;
        const y=(-tmp.y*.5+.5)*bounds.height;
        const perspective=smallScreen.matches?Math.max(.58,Math.min(.94,6.4/Math.abs(camera.position.z-obj.group.position.z))):
          Math.max(.8,Math.min(1.2,6.4/Math.abs(camera.position.z-obj.group.position.z)));
        const sw=smallScreen.matches?Math.max(77,obj.sizeX*110*perspective):obj.sizeX*200*perspective;
        const sh=smallScreen.matches?Math.max(56,obj.sizeY*110*perspective):obj.sizeY*148*perspective;
        // Quantized, stable, fully on-screen hit targets. Continuous subpixel
        // movement made touch targets unstable even with no camera input.
        const left=Math.round(Math.max(8,Math.min(bounds.width-sw-8,x-sw/2))/4)*4;
        const top=Math.round(Math.max(150,Math.min(bounds.height-sh-16,y-sh/2))/4)*4;
        const box=[left,top,Math.round(sw),Math.round(sh)];
        if (obj.lastBox && box.every((v,i)=>v===obj.lastBox[i])) continue;
        obj.lastBox=box;
        obj.button.style.left=left+'px';
        obj.button.style.top=top+'px';
        obj.button.style.width=Math.round(sw)+'px';
        obj.button.style.height=Math.round(sh)+'px';
      }
    }

    function frame(now) {
      requestAnimationFrame(frame);
      if (!renderer || !canvas.isConnected) return;
      frameNumber++;
      // Do not burn GPU cycles animating a scene behind a reading view.
      if (document.body.classList.contains('is-dialog-open') && frameNumber % 8 !== 0) return;
      // A reduced-motion scene is mostly static, but still responds to focus/resize.
      if (reduced.matches && frameNumber>3 && frameNumber % 18 !== 0) return;
      const dt=Math.min(.045,(now-last)/1000 || .016);
      last=now;
      tick+=dt;
      const rawX=parseFloat(world.style.getPropertyValue('--look-x'))||0;
      const rawY=parseFloat(world.style.getPropertyValue('--look-y'))||0;
      const mobile=smallScreen.matches;
      const targetZ=mobile?7.3:6.45;
      const targetY=mobile?3.05:2.7;
      camera.position.x=THREE.MathUtils.lerp(camera.position.x,rawX*(mobile?.55:.22), .075);
      camera.position.y=THREE.MathUtils.lerp(camera.position.y,targetY+rawY*.15,.075);
      camera.position.z=THREE.MathUtils.lerp(camera.position.z,targetZ,.085);
      camera.lookAt(rawX*(mobile?1.6:.24),mobile?1.22+rawY*.15:1.25+rawY*.2,mobile?.7:-.4);
      const shouldAnimate=!reduced.matches && !document.body.classList.contains('is-dialog-open');
      for(let i=0;i<steam.length;i++) {
        const t=shouldAnimate?(tick*.17+i/7)%1:i/7;
        steam[i].position.set(.1+Math.sin(t*4+i)*.09,1.57+t*.75,2.25+Math.cos(t*3+i)*.05);
        steam[i].scale.set(.22+t*.2,.33+t*.3,1);
        steam[i].material.opacity=(1-t)*.20;
      }
      for(const [id,obj] of physical) {
        const desired=hover===id?1.025:1;
        const value=THREE.MathUtils.lerp(obj.group.scale.x,desired,.14);
        obj.group.scale.setScalar(value);
      }
      moveHotspots();
      renderer.render(scene,camera);
    }
    camera.position.set(0,smallScreen.matches?3.05:2.7,smallScreen.matches?7.3:6.45);
    camera.lookAt(0,smallScreen.matches?1.22:1.25,smallScreen.matches?.7:-.4);
    requestAnimationFrame(frame);
  }
}
