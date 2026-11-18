import * as THREE from 'three';

const root = document.querySelector('#game');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#aab7a3');
scene.fog = new THREE.FogExp2('#aab7a3', .0065);
const camera = new THREE.PerspectiveCamera(68, innerWidth/innerHeight, .1, 700);
const renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:'high-performance'});
renderer.setSize(innerWidth,innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.17;
root.append(renderer.domElement);
scene.add(new THREE.HemisphereLight('#e0e9d9','#414938',2.05));
const sun=new THREE.DirectionalLight('#ffe1a8',3.0);sun.position.set(-48,75,35);sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-90;sun.shadow.camera.right=90;sun.shadow.camera.top=90;sun.shadow.camera.bottom=-90;scene.add(sun);
const mats={asphalt:new THREE.MeshStandardMaterial({color:'#454842',roughness:.94}),side:new THREE.MeshStandardMaterial({color:'#aaa994',roughness:1}),grass:new THREE.MeshStandardMaterial({color:'#727e61',roughness:1}),white:new THREE.MeshStandardMaterial({color:'#dfdfca',roughness:.9}),yellow:new THREE.MeshStandardMaterial({color:'#d9bd76',roughness:.85}),glass:new THREE.MeshStandardMaterial({color:'#81948a',roughness:.28,metalness:.15}),darkglass:new THREE.MeshStandardMaterial({color:'#394943',roughness:.25,metalness:.12})};
function box(parent,x,y,z,w,h,d,mat,cast=false){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);o.position.set(x,y,z);o.castShadow=cast;o.receiveShadow=true;parent.add(o);return o}
const ground=box(scene,0,-.32,0,400,.5,400,mats.grass);ground.receiveShadow=true;
// Small, explorable Sakhalin-inspired urban grid with sidewalks, intersections, lots and trees.
const roadMat=new THREE.MeshStandardMaterial({color:'#494b46',roughness:1});
const roads=[];for(let n=-2;n<=2;n++)roads.push(n*58);
for(const p of roads){box(scene,0,-.02,p,320,.12,13,roadMat);box(scene,p,-.02,0,13,.12,320,roadMat);box(scene,0,.045,p,320,.018,.12,mats.yellow);box(scene,p,.045,0,.12,.018,320,mats.yellow);
 for(let t=-145;t<155;t+=10){if(Math.abs(t-p)<10)continue;box(scene,t,.04,p-2.7,3,.015,.12,mats.white);box(scene,t,.04,p+2.7,3,.015,.12,mats.white);box(scene,p-2.7,.04,t,.12,.015,3,mats.white);box(scene,p+2.7,.04,t,.12,.015,3,mats.white)}}
const buildingMats=['#b5ad98','#d0c7b2','#879187','#b9896f','#ddd2b7','#737e79','#c3b298'].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.83}));
const windowMat=new THREE.MeshStandardMaterial({color:'#e9cf95',emissive:'#574a2c',emissiveIntensity:.22,roughness:.3});
const buildingBoxes=[];
for(let gx=-2;gx<2;gx++)for(let gz=-2;gz<2;gz++){
 const cx=(gx+.5)*58,cz=(gz+.5)*58;
 // Corners remain open, leaving traversable courtyards and side streets.
 for(let sideX of [-1,1])for(let sideZ of [-1,1]){
  const x=cx+sideX*(15+Math.random()*3),z=cz+sideZ*(15+Math.random()*3);
  const w=11+Math.random()*9,d=10+Math.random()*8,h=9+Math.random()*22;
  const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
  const body=box(g,0,h/2,0,w,h,d,buildingMats[Math.floor(Math.random()*buildingMats.length)],true);buildingBoxes.push(new THREE.Box3().setFromObject(body));
  box(g,0,h+.35,0,w*.78,.7,d*.78,new THREE.MeshStandardMaterial({color:'#65645a',roughness:1}),true);
  const floors=Math.floor(h/3.2), cols=Math.max(2,Math.floor(w/2.5));
  for(let row=0;row<floors;row++)for(let col=0;col<cols;col++){
   const wx=-w/2+1.4+col*(w-2.8)/Math.max(1,cols-1),wy=2+row*3.1;
   box(g,wx,wy,d/2+.018,.62,1.04,.04,Math.random()>.36?windowMat:mats.darkglass);
   box(g,wx,wy,-d/2-.018,.62,1.04,.04,mats.darkglass);
   box(g,w/2+.018,wy,-d/2+1+col*2.6,.04,1.04,.62,mats.darkglass);
  }
 }
}
// Corner shop with sign, bus stop and street furniture.
const shopMat=new THREE.MeshStandardMaterial({color:'#bd9775',roughness:.85});
const shop=box(scene,-43,3.5,-43,17,7,14,shopMat,true);buildingBoxes.push(new THREE.Box3().setFromObject(shop));
box(scene,-43,5.1,-35.8,9,1.1,.14,new THREE.MeshStandardMaterial({color:'#d1d5a0',emissive:'#667342',emissiveIntensity:.38}));
for(let t=-140;t<145;t+=19){for(const [x,z] of [[t,-7],[t,7],[-7,t],[7,t]]){
 if(Math.abs(x)<14&&Math.abs(z)<14)continue;
 const trunk=box(scene,x,1.45,z,.42,2.9,.42,new THREE.MeshStandardMaterial({color:'#604b39'}),true);
 const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(2.15,1),new THREE.MeshStandardMaterial({color:['#68795d','#7e8967','#637659'][Math.abs(Math.floor(x+z))%3],roughness:1}));crown.position.set(x,4,z);crown.castShadow=true;scene.add(crown);
}}
// Street lamps.
const lampMat=new THREE.MeshStandardMaterial({color:'#363b34',metalness:.55,roughness:.4});
for(let t=-116;t<=116;t+=58){for(const [x,z] of [[t,-9],[t,9],[-9,t],[9,t]]){box(scene,x,3.1,z,.14,6.2,.14,lampMat);box(scene,x+.3,6.1,z,.8,.12,.16,windowMat)}}

// Lightweight ambient traffic gives the streets movement without a server.
const traffic=[];
const trafficPaint=['#64877b','#d3bc86','#68748b','#bd795f'].map(color=>new THREE.MeshStandardMaterial({color,roughness:.42,metalness:.22}));
for(const [i,config] of [[0,{axis:'x',lane:-58,offset:-3,dir:1,speed:8}],[1,{axis:'x',lane:58,offset:3,dir:-1,speed:6}],[2,{axis:'z',lane:58,offset:-3,dir:-1,speed:7}],[3,{axis:'z',lane:-58,offset:3,dir:1,speed:9}]]){
 const vehicle=new THREE.Group();scene.add(vehicle);
 box(vehicle,0,.56,0,3.2,.66,1.55,trafficPaint[i],true);
 box(vehicle,-.18,1.05,0,1.55,.55,1.28,mats.glass,true);
 for(const x of [-1,1])for(const z of [-.78,.78]){const tire=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.2,12),new THREE.MeshStandardMaterial({color:'#242725',roughness:.9}));tire.rotation.x=Math.PI/2;tire.position.set(x,.34,z);vehicle.add(tire)}
 const carConfig={...config,vehicle};traffic.push(carConfig);
 if(config.axis==='x'){vehicle.position.set(-112+i*35,.02,config.lane+config.offset);vehicle.rotation.y=config.dir>0?0:Math.PI}
 else{vehicle.position.set(config.lane+config.offset,.02,-112+i*42);vehicle.rotation.y=config.dir>0?-Math.PI/2:Math.PI/2}
}

// Player capsule, styled from simple original geometry.
const player=new THREE.Group();scene.add(player);
const skin=new THREE.MeshStandardMaterial({color:'#d5b194',roughness:.88}), jacket=new THREE.MeshStandardMaterial({color:'#425d58',roughness:.95}), pants=new THREE.MeshStandardMaterial({color:'#313c38',roughness:.95});
const body=new THREE.Mesh(new THREE.CapsuleGeometry(.42,.84,4,8),jacket);body.position.y=1.15;body.castShadow=true;player.add(body);
const head=new THREE.Mesh(new THREE.SphereGeometry(.27,12,10),skin);head.position.y=1.96;head.castShadow=true;player.add(head);
const legs=new THREE.Mesh(new THREE.CapsuleGeometry(.16,.55,3,6),pants);legs.position.set(0,.45,0);player.add(legs);
player.position.set(-24,0,0);

// Drivable original compact hatchback with glass, headlights and rotating wheels.
const car=new THREE.Group();scene.add(car);car.position.set(-14,0,0);
const carPaint=new THREE.MeshStandardMaterial({color:'#c87554',metalness:.34,roughness:.38});
box(car,0,.67,0,4.1,.75,2.1,carPaint,true);box(car,-.25,1.18,0,2.4,.75,1.75,new THREE.MeshStandardMaterial({color:'#6b8079',roughness:.28}),true);
box(car,1.05,1.12,0,.12,.45,1.55,mats.darkglass);box(car,-1.42,.4,0,.16,.38,1.9,carPaint);
const wheels=[];for(const x of [-1.3,1.3])for(const z of [-1,1]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.26,16),new THREE.MeshStandardMaterial({color:'#242725',roughness:.93}));w.rotation.x=Math.PI/2;w.position.set(x,.38,z);w.castShadow=true;car.add(w);wheels.push(w)}
const headlightMat=new THREE.MeshStandardMaterial({color:'#fff1ba',emissive:'#efd48c',emissiveIntensity:1.1});for(const z of [-.65,.65])box(car,2.06,.78,z,.04,.25,.5,headlightMat);
const tailMat=new THREE.MeshStandardMaterial({color:'#a74236',emissive:'#78221a',emissiveIntensity:.6});for(const z of [-.7,.7])box(car,-2.06,.72,z,.04,.22,.42,tailMat);

// Three collectible city signals turn free roaming into a simple first mission.
const signals=[],signalStorage='ssait-beblox-signals-v1';let collectedSignals=0,foundSignals=[];try{const saved=JSON.parse(localStorage.getItem(signalStorage)||'[]');if(Array.isArray(saved))foundSignals=saved.filter(Number.isInteger)}catch{}
for(const [index,[x,z]] of [[0,-58],[58,0],[0,58]].entries()){
 const marker=new THREE.Group();marker.position.set(x,1.45,z);scene.add(marker);
 const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.55,0),new THREE.MeshStandardMaterial({color:'#c9ec74',emissive:'#8ab83a',emissiveIntensity:1.7,metalness:.35,roughness:.22}));gem.castShadow=true;marker.add(gem);
 const halo=new THREE.Mesh(new THREE.TorusGeometry(.86,.035,6,32),new THREE.MeshBasicMaterial({color:'#ddff8f',transparent:true,opacity:.75}));halo.rotation.x=Math.PI/2;marker.add(halo);
 const beam=new THREE.PointLight('#d5ff8b',8,9,2);marker.add(beam);marker.visible=!foundSignals.includes(index);if(!marker.visible)collectedSignals++;signals.push(marker);
}

// World-space camera follows walking and driving. Drag to look around; click to capture pointer.
let yaw=0,pitch=.14,locked=false,driving=false,velocity=0,steer=0,elapsed=0,toastTimer,touchLook=null,soundEnabled=false,audioContext;
const keys=new Set();const center=document.querySelector('#center-msg'),prompt=document.querySelector('#prompt');
const toast=document.querySelector('#toast');function showToast(s){toast.textContent=s;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),2300)}
function playTone(frequency=520,length=.12){if(!soundEnabled)return;try{audioContext||=new(window.AudioContext||window.webkitAudioContext)();if(audioContext.state==='suspended')audioContext.resume();const oscillator=audioContext.createOscillator(),gain=audioContext.createGain();oscillator.type='sine';oscillator.frequency.setValueAtTime(frequency,audioContext.currentTime);gain.gain.setValueAtTime(.05,audioContext.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+length);oscillator.connect(gain);gain.connect(audioContext.destination);oscillator.start();oscillator.stop(audioContext.currentTime+length)}catch{}}
renderer.domElement.style.touchAction='none';
renderer.domElement.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch')return;e.preventDefault();touchLook={id:e.pointerId,x:e.clientX,y:e.clientY};renderer.domElement.setPointerCapture(e.pointerId);center.classList.add('hide')});
renderer.domElement.addEventListener('pointermove',e=>{if(!touchLook||touchLook.id!==e.pointerId)return;const dx=e.clientX-touchLook.x,dy=e.clientY-touchLook.y;touchLook.x=e.clientX;touchLook.y=e.clientY;yaw-=dx*.004;pitch=THREE.MathUtils.clamp(pitch-dy*.003,-.08,.55)});
const stopTouchLook=e=>{if(touchLook?.id===e.pointerId)touchLook=null};renderer.domElement.addEventListener('pointerup',stopTouchLook);renderer.domElement.addEventListener('pointercancel',stopTouchLook);renderer.domElement.addEventListener('lostpointercapture',stopTouchLook);
renderer.domElement.addEventListener('click',()=>{if(!locked&&!matchMedia('(pointer:coarse)').matches)renderer.domElement.requestPointerLock()});
document.addEventListener('pointerlockchange',()=>{locked=document.pointerLockElement===renderer.domElement});
document.addEventListener('mousemove',e=>{if(!locked)return;yaw-=e.movementX*.0023;pitch=THREE.MathUtils.clamp(pitch-e.movementY*.0018,-.08,.55)});
document.addEventListener('keydown',e=>{const k=e.key.toLowerCase();keys.add(k);if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();if(k==='e')interact();if(k==='escape'&&document.pointerLockElement)document.exitPointerLock()});
document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
for(const b of document.querySelectorAll('.mobile-controls button')){const k=b.dataset.key;b.addEventListener('pointerdown',e=>{e.preventDefault();keys.add(k);if(k==='e')interact()});for(const event of ['pointerup','pointercancel','pointerleave'])b.addEventListener(event,()=>keys.delete(k))}
function interact(){const actor=driving?car:player;const nearby=signals.findIndex(s=>s.visible&&actor.position.distanceTo(s.position)<5);if(nearby>=0){signals[nearby].visible=false;collectedSignals++;foundSignals.push(nearby);try{localStorage.setItem(signalStorage,JSON.stringify(foundSignals))}catch{}playTone(collectedSignals===3?880:660);if(collectedSignals===3)setTimeout(()=>playTone(1040),140);showToast(collectedSignals===3?'Миссия выполнена! Ты нашёл все сигналы.':'Сигнал найден · '+collectedSignals+' / 3');return}if(driving){driving=false;player.position.copy(car.position).add(new THREE.Vector3(0,0,3));player.visible=true;document.querySelector('#speedometer').classList.remove('show');document.querySelector('#gear').textContent='WALK';playTone(330);showToast('Ты вышел из машины. Осмотрись вокруг.')}else if(player.position.distanceTo(car.position)<6){driving=true;player.visible=false;document.querySelector('#speedometer').classList.add('show');playTone(190,.2);showToast('Машина заведена. Хорошей дороги!')}else showToast('Подойди ближе к машине или светящемуся сигналу.')}
function collides(pos){for(const b of buildingBoxes){if(pos.x>b.min.x-1&&pos.x<b.max.x+1&&pos.z>b.min.z-1&&pos.z<b.max.z+1)return true}return false}
const vForward=new THREE.Vector3(),vRight=new THREE.Vector3(),next=new THREE.Vector3();
function update(dt){
 for(const c of traffic){const p=c.vehicle.position;p[c.axis]+=c.dir*c.speed*dt;if(p[c.axis]>150)p[c.axis]=-150;if(p[c.axis]<-150)p[c.axis]=150}
 const forward=(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0);
 const side=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);
 if(forward||side)center.classList.add('hide');
 if(driving){const throttle=(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0);const turning=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);
  velocity+=throttle*dt*(keys.has('shift')?18:10);velocity*=Math.pow(.91,dt*60);velocity=THREE.MathUtils.clamp(velocity,-9,keys.has('shift')?27:20);steer=THREE.MathUtils.damp(steer,turning,.12,dt);
  car.rotation.y+=steer*velocity*.018*dt*60;
  vForward.set(Math.cos(car.rotation.y),0,-Math.sin(car.rotation.y));next.copy(car.position).addScaledVector(vForward,velocity*dt);
  if(!collides(next))car.position.copy(next);else velocity*= -.25;
  car.position.x=THREE.MathUtils.clamp(car.position.x,-156,156);car.position.z=THREE.MathUtils.clamp(car.position.z,-156,156);
  wheels.forEach(w=>w.rotation.z-=velocity*dt*1.8);
  const km=Math.round(Math.abs(velocity)*5.2);document.querySelector('#speed').textContent=String(km).padStart(2,'0');
 }else if(forward||side){
  const fast=keys.has('shift')?8.5:4.8;vForward.set(-Math.sin(yaw),0,-Math.cos(yaw));vRight.set(Math.cos(yaw),0,-Math.sin(yaw));next.copy(player.position).addScaledVector(vForward,forward*fast*dt).addScaledVector(vRight,side*fast*dt);
  if(!collides(next))player.position.copy(next);player.rotation.y=yaw;legs.rotation.x=Math.sin(elapsed*11)*.08*Math.min(1,Math.abs(forward)+Math.abs(side));
 }
 const actor=driving?car:player;const lookYaw=driving?car.rotation.y+Math.PI:yaw;
 const dist=driving?10:7.5,height=driving?4.2:3.4;
 const desired=new THREE.Vector3(actor.position.x+Math.sin(lookYaw)*dist,actor.position.y+height+pitch*5,actor.position.z+Math.cos(lookYaw)*dist);
 camera.position.lerp(desired,1-Math.exp(-dt*5));const target=actor.position.clone().add(new THREE.Vector3(0,driving?1.4:1.5,0));camera.lookAt(target);
 for(const s of signals)if(s.visible){s.rotation.y+=dt*.7;s.position.y=1.45+Math.sin(elapsed*2+s.position.x)*.14}
 const actor=driving?car:player;const signalNearby=signals.some(s=>s.visible&&actor.position.distanceTo(s.position)<5);const near=player.position.distanceTo(car.position)<7;prompt.classList.toggle('show',(near||signalNearby)&&!driving);prompt.querySelector('span').textContent=signalNearby?'СОБРАТЬ СИГНАЛ':'СЕСТЬ В МАШИНУ';document.querySelector('#mission-text').textContent=collectedSignals===3?'Миссия завершена ✳':'Собери сигналы: '+collectedSignals+' / 3';
}
// Minimap renderer.
const map=document.querySelector('#minimap'),ctx=map.getContext('2d');function drawMap(){const s=map.width/320;ctx.fillStyle='#343c32';ctx.fillRect(0,0,map.width,map.height);ctx.fillStyle='#899077';for(let x=0;x<320;x+=58)for(let z=0;z<320;z+=58)ctx.fillRect(x*s+9*s,z*s+9*s,38*s,38*s);ctx.fillStyle='#50534d';for(let p=0;p<320;p+=58){ctx.fillRect(0,(p-6.5+160)*s,320*s,13*s);ctx.fillRect((p-6.5+160)*s,0,13*s,320*s)}function mark(obj,color,radius=3){const x=(obj.position.x+160)*s,z=(obj.position.z+160)*s;ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,z,radius,0,Math.PI*2);ctx.fill()}for(const c of traffic)mark(c.vehicle,'#e9c38a',2);for(const signal of signals)if(signal.visible)mark(signal,'#d7fa8a',3);mark(car,'#e88a65',4);mark(player,'#d9f786',3)}
let last=performance.now();function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.04);last=now;elapsed+=dt;update(dt);renderer.render(scene,camera);drawMap();}
setTimeout(()=>document.querySelector('#loading').classList.add('done'),1450);
setInterval(()=>{const t=new Date();document.querySelector('#clock').textContent=t.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})},1000);
document.querySelector('#sound').addEventListener('click',event=>{soundEnabled=!soundEnabled;event.currentTarget.textContent=soundEnabled?'♫':'♪';event.currentTarget.setAttribute('aria-label',soundEnabled?'Выключить звук':'Включить звук');showToast(soundEnabled?'Звуки включены':'Звуки выключены');if(soundEnabled)playTone(620)});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.65))});
requestAnimationFrame(frame);
