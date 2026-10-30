/**
 * Café Almar street set, art pass 02.
 * Composition comes from the supplied photograph: a sunlit, mostly frontal
 * white corner building, a much narrower street opening to the left, a dark
 * awning, barred window, sign, wires, planters and shaded stone pavement.
 * Coordinates deliberately avoid generic straight-ahead fantasy streets.
 */
export function buildStreetSet({THREE,scene,mat,mats,box,plane,cylinder,sphere,line,plaster,texture,seeded}) {
  const rnd=seeded(20261030);
  const paint=(color,roughness=1)=>mat(color,roughness);
  const chalk=paint('#e6ded0');
  const trim=paint('#eee9dc');
  const shadow=paint('#b4ab9d');
  const darkMetal=mat('#475252',.74,{metalness:.24});
  const paleMetal=mat('#aeb2a9',.8,{metalness:.15});
  const plaster1=mat('#ffffff',1,{map:plaster('#f1e7d8',14)});
  const plaster2=mat('#ffffff',1,{map:plaster('#e5dfd2',17)});
  const plaster3=mat('#ffffff',1,{map:plaster('#f7f1e6',3)});

  // Grainy, irregular Jerusalem-stone pavement with ink-like joints.
  const stone=texture((ctx,w,h)=>{
    ctx.fillStyle='#8f8f8b';ctx.fillRect(0,0,w,h);
    const r=seeded(189);
    for(let row=0,y=-8;y<h;row++,y+=38+r()*11){
      let x=row%2?-42:0;
      while(x<w) {
        const len=62+r()*45,v=r()*25|0;
        ctx.fillStyle='rgb('+(125+v)+','+(124+v)+','+(119+v)+')';
        ctx.fillRect(x+2,y+2,len-4,37);
        ctx.fillStyle='rgba(255,247,227,.09)';
        ctx.fillRect(x+4,y+3,len-8,2);
        ctx.fillStyle='rgba(44,40,42,.07)';
        for(let j=0;j<12;j++){
          ctx.fillRect(x+r()*len,y+r()*31+5,r()*4+1,r()*2+1);
        } x+=len;
      }
    }
  },1024,1024);
  stone.wrapS=stone.wrapT=THREE.RepeatWrapping;stone.repeat.set(4,5);
  const paving=new THREE.MeshStandardMaterial({map:stone,roughness:1,color:'#ffffff'});
  const road=plane(scene,80,75,paving,-.5,-.12,-19.3);
  road.receiveShadow=true;
  // Main curb in front of the building, interrupted by pedestrian crossing.
  box(scene,16,.14,.65,paint('#c3b6a9'),5.85,-.03,-4.5);
  for(let i=0;i<7;i++){
    const x=-1.1+i*2.1;
    box(scene,1.13,.024,.17,paint(i%3===1?'#a85d59':'#cfc6b9'),x,.054,-4.13);
  }
  box(scene,2,.11,43,paint('#c8c1b6'),-5.18,-.03,-17.1);
  box(scene,.18,.2,44,paint('#b9a99e'),-4.21,.03,-17.1);
  for(let i=0;i<12;i++)
    box(scene,.2,.025,1.24,paint(i%3===1?'#a74f4d':'#ddd1c3'),-4.21,.15,-2-i*2.9);

  // The white corner building is the composition's main silhouette.
  // Its face runs across the viewport. No repetitive right-hand alley.
  const facade=box(scene,12.6,8.6,.83,plaster3,5.15,4.14,-5.36);
  facade.castShadow=true;
  box(scene,1.1,8.7,.86,plaster1,-1.15,4.18,-5.36);
  box(scene,13,.24,.94,paint('#f0e9de'),5.05,8.27,-5.33);
  box(scene,13,.13,.96,shadow,5.05,7.82,-5.31);
  // Very subtle stucco patches, a few exposed plaster scars and aging bands.
  for(let i=0;i<28;i++){
    const x=-.95+rnd()*11.6,y=.7+rnd()*7.2;
    if(x>1.4&&x<3.5&&y>2&&y<4.8)continue;
    const patch=box(scene,.18+rnd()*.28,.012+rnd()*.045,.016,
      paint(rnd()>.48?'#ddd6c8':'#fdf6e8'),x,y,-4.925);
    patch.rotation.z=(rnd()-.5)*.18;patch.castShadow=false;
  }
  // Upper transom window and lower barred window sit within the front wall.
  const windowFrame=paint('#c6c9bd');
  const glass=mat('#3c5158',.36,{metalness:.10});
  box(scene,3.05,1.18,.14,windowFrame,2.60,6.58,-4.87,.035);
  box(scene,2.85,.95,.015,glass,2.60,6.56,-4.786);
  line(scene,[2.6,6.12,-4.765],[2.6,7.08,-4.765],.052,trim);
  box(scene,2.6,2.36,.16,windowFrame,2.65,4.03,-4.88,.025);
  box(scene,2.4,2.1,.03,glass,2.65,4.03,-4.767);
  const rail=paint('#d2d5d0');
  for(let i=0;i<13;i++){
    const x=1.55+i*.185;
    line(scene,[x,3.02,-4.67],[x,5.05,-4.67],.025,rail);
  }
  line(scene,[1.44,3.3,-4.67],[3.86,3.3,-4.67],.028,rail);
  line(scene,[1.44,4.68,-4.67],[3.86,4.68,-4.67],.028,rail);
  box(scene,2.94,.22,.24,paint('#e4e5d9'),2.65,2.84,-4.74);
  // Door with a very unglamorous utility lock and chipped wall panels.
  box(scene,1.66,3.08,.16,paint('#d8dcd5'),6.18,1.43,-4.89);
  box(scene,1.4,2.93,.02,paint('#f1eee5'),6.18,1.42,-4.79);
  line(scene,[5.51,.72,-4.755],[6.84,.72,-4.755],.02,paint('#c1c1b8'));
  box(scene,.10,.18,.06,paleMetal,5.51,1.58,-4.735,.012);
  // Service boxes, stencil sign and urban imperfections, not tourist props.
  box(scene,.68,.46,.12,paint('#c9cbc4'),4.72,3.06,-4.82,.025);
  for(let i=0;i<7;i++)box(scene,.05,.29,.013,paint('#919995'),4.51+i*.069,3.07,-4.73);
  const numberTexture=texture((c,w,h)=>{
    c.fillStyle='#f1f0e9';c.fillRect(0,0,w,h);
    c.fillStyle='#35629e';c.font='bold 240px sans-serif';c.textAlign='center';c.fillText('3',w/2,h*.73);
    c.fillStyle='#737475';c.font='33px sans-serif';c.fillText('6650',w/2,h*.90);
  },256,256);
  plane(scene,.46,.59,new THREE.MeshStandardMaterial({map:numberTexture,roughness:1,side:THREE.DoubleSide}),-.48,4.1,-4.91,0);

  // Recessed street on the left: converging walls and smaller shop openings.
  box(scene,1.75,8.1,48,plaster1,-5.25,3.95,-28);
  box(scene,1.35,8.0,47,plaster2,-.63,3.92,-29);
  for(let z=-8.2;z>-38;z-=5.2){
    box(scene,.08,1.6,1.22,paint('#7d887b'),-4.32,2.9,z);
    box(scene,.015,1.43,1.07,glass,-4.267,2.9,z);
    box(scene,.10,1.2,.77,paint('#cbc6b9'),-1.30,2.9,z);
    box(scene,.014,1.07,.61,glass,-1.244,2.9,z);
    for(let i=0;i<3;i++)
      line(scene,[-4.244,2.23,z-.45+i*.4],[-4.244,3.60,z-.45+i*.4],.017,rail);
  }
  // Awnings: dark practical fabric, repeated panel seams and shading.
  const awningNavy=paint('#2a3d55');
  const awningAlt=paint('#384b63');
  for(let i=0;i<8;i++){
    const m=box(scene,.67,.07,4.7,i%2?awningAlt:awningNavy,-4.59,.0,-6.35+i*.71);
    m.position.y=4.0; m.rotation.z=-.03; m.castShadow=true;
  }
  line(scene,[-4.52,4.0,-6.55],[-4.52,3.45,-6.55],.045,darkMetal);
  line(scene,[-4.52,4.0,-2.1],[-4.52,3.45,-2.1],.045,darkMetal);
  box(scene,.18,.20,8,paint('#1f2e42'),-4.28,3.85,-4.0);
  // Modest tables, bags and pots in the recessed street.
  for(const [x,z,size] of [[-3.15,-7.1,.83],[-3.38,-11.0,.70],[-3.56,-18,.5]]){
    box(scene,size,.07,size*.72,mats.wood,x,.72,z,.025);
    line(scene,[x,.70,z],[x,.08,z],.065,darkMetal);
    box(scene,.52*size,.10,.45*size,paint('#674e42'),x-size*.8,.45,z,.017);
    box(scene,.52*size,.56,.1,mats.wood,x-size*.8,.82,z+.18);
  }
  // Wall-mounted cabling and junction boxes.
  for(const [x,z] of [[-.93,-8.5],[-1.03,-15.8]]) {
    box(scene,.12,.28,.27,paint('#c4c2b7'),x,4.9,z,.012);
    line(scene,[x,5.05,z-.1],[x,6.7,z-.1],.019,darkMetal);
  }

  // Two street signs / poles from the source composition.
  const signMetal=paint('#697172');
  cylinder(scene,.051,.056,5.2,signMetal,-3.05,2.5,-5.5,12);
  const signDisc=cylinder(scene,.43,.43,.065,paint('#f1e7dc'),-3.05,4.58,-5.5,36);
  signDisc.rotation.x=Math.PI/2;
  const signRed=cylinder(scene,.375,.375,.071,paint('#ae3441'),-3.05,4.58,-5.42,36);
  signRed.rotation.x=Math.PI/2;
  box(scene,.60,.080,.024,paint('#ece9df'),-3.05,4.58,-5.37,.015);
  // Foreground utility pole obscures a little of the façade like the photograph.
  const util=cylinder(scene,.065,.08,8.8,paint('#6d7778'),.36,4.22,-2.1,14);
  util.rotation.z=.035;
  for(let i=0;i<7;i++){
    const y=2.6+i*.53;
    const strip=box(scene,.21,.08,.018,paint(i%2?'#53666c':'#87716a'),.35,y,-2.00,.012);
    strip.rotation.y=(i%3)*.07;
  }
  line(scene,[-1.05,7.4,-6.2],[3.9,6.7,-5.1],.015,paint('#666b68'));

  // Street bollards and heavy traffic wear.
  for(const [x,z,s] of [[-4.05,-4.7,.94],[-4.05,-6.5,.80],[-4.05,-8.4,.72],[.0,-4.24,.99],
    [1.7,-4.20,.90],[6.0,-4.2,.85],[8.6,-4.2,.82]]){
    cylinder(scene,.083*s,.12*s,.65*s,signMetal,x,.30*s,z,10);
    sphere(scene,.115*s,signMetal,x,.61*s,z);
  }
  // Uneven curb cuts and painted street repairs.
  for(let i=0;i<24;i++){
    const x=-4+rnd()*14,z=-1-rnd()*4;
    const a=box(scene,.3+rnd()*1,.003,.03+rnd()*.25,paint(rnd()>.5?'#a29f97':'#787c7c'),x,-.103,z);
    a.rotation.y=rnd()*1.3;a.castShadow=false;
  }

  const leaves=[paint('#456750'),paint('#567756'),paint('#73855c'),paint('#385a43'),paint('#8b9662')];
  function plant(x,z,height=.9){
    cylinder(scene,.19,.13,.34,paint('#a57c62'),x,.17,z);
    for(let k=0;k<4;k++){
      const ex=x+(rnd()-.5)*.48,ey=.4+height*(.8+rnd()*.35),ez=z+(rnd()-.5)*.45;
      line(scene,[x,.36,z],[ex,ey,ez],.018,paint('#5e6750'));
      for(let j=0;j<5;j++){
        const t=.45+j*.12;
        const obj=sphere(scene,.095+rnd()*.035,leaves[Math.floor(rnd()*leaves.length)],
          x+(ex-x)*t+(rnd()-.5)*.22,.38+(ey-.38)*t,z+(ez-z)*t+(rnd()-.5)*.18);
        obj.scale.set(.76,1.23,.63);
      }
    }
  }
  for(const [x,z,h] of [[-3.98,-5.95,1.4],[-4.0,-9.5,1.0],[-1.35,-7.4,1.1],[8.8,-4.4,.8]])
    plant(x,z,h);
  for(let i=0;i<45;i++){
    const px=-4.28+(rnd()-.5)*.8,py=4.0+rnd()*.7,pz=-3.5-rnd()*3.2;
    const leaf=sphere(scene,.11+rnd()*.12,leaves[i%leaves.length],px,py,pz);
    leaf.scale.set(1,.45,.8);
  }
  // Foreground uses the same morning light / atmosphere as the actual objects.
  return {facade,road};
}
