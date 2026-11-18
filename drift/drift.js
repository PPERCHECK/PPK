const canvas=document.querySelector('#track'),ctx=canvas.getContext('2d');
const keys=new Set(),storage='ssait-drift-best';
let width=0,height=0,dpr=1,carX=0,carY=0,heading=0,vx=0,vy=0;
let started=false,finished=false,lap=0,lapStart=0,raceStart=0,nextCheckpoint=2,best=Number(localStorage.getItem(storage))||0,drifting=0;

function resize(){const r=canvas.getBoundingClientRect();dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);width=r.width;height=r.height;ctx.setTransform(dpr,0,0,dpr,0,0);if(!started&&!finished)placeCar()}
function radii(){return {x:Math.min(width*.31,height*.33),y:Math.min(height*.34,width*.43)}}
function placeCar(){const c={x:width*.5,y:height*.51},r=radii(),a=Math.PI*.91;carX=c.x+Math.cos(a)*r.x;carY=c.y+Math.sin(a)*r.y;heading=a+Math.PI/2;vx=0;vy=0}
function fmt(ms){if(!ms||!isFinite(ms))return'--:--.---';const m=Math.floor(ms/60000),s=Math.floor(ms%60000/1000),f=Math.floor(ms%1000);return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')+'.'+String(f).padStart(3,'0')}
function reset(){started=false;finished=false;lap=0;nextCheckpoint=2;lapStart=raceStart=0;drifting=0;placeCar();document.querySelector('#lap').textContent='0 / 3';document.querySelector('#time').textContent='00:00.000';document.querySelector('#countdown').textContent='НАЖМИ W, ЧТОБЫ СТАРТОВАТЬ';document.querySelector('#countdown').style.display='block'}
document.querySelector('#best').textContent=fmt(best);document.querySelector('#reset').addEventListener('click',reset);
addEventListener('resize',resize);
addEventListener('keydown',e=>{const k=e.key.toLowerCase();keys.add(k);if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault()});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
document.querySelectorAll('.mobile-wheel button').forEach(b=>{const k=b.dataset.key;b.addEventListener('pointerdown',e=>{e.preventDefault();keys.add(k)});for(const name of ['pointerup','pointerleave','pointercancel'])b.addEventListener(name,()=>keys.delete(k))});
function update(dt,now){
 const gas=keys.has('w')||keys.has('arrowup')||keys.has('up'),brake=keys.has('s')||keys.has('arrowdown')||keys.has('down');
 const steer=(keys.has('d')||keys.has('arrowright')||keys.has('right')?1:0)-(keys.has('a')||keys.has('arrowleft')||keys.has('left')?1:0),nitro=keys.has('shift');
 if(gas&&!started&&!finished){started=true;raceStart=lapStart=now;document.querySelector('#countdown').style.display='none'}
 if(finished)return;
 const fx=Math.cos(heading),fy=Math.sin(heading),forward=vx*fx+vy*fy,side=-vx*fy+vy*fx;
 let speed=forward;
 speed+=gas?dt*(nitro?150:105):0;
 if(brake)speed-=Math.sign(speed||1)*dt*155;
 if(!gas&&!brake)speed*=Math.pow(.985,dt*60);
 speed=Math.max(-55,Math.min(speed,nitro?300:235));
 heading+=steer*Math.max(.22,Math.min(1.35,Math.abs(speed)/100))*dt*(speed<0?-1:1);
 const grip=nitro?.92:.78,lateral=side*Math.pow(grip,dt*60);
 vx=Math.cos(heading)*speed-Math.sin(heading)*lateral;
 vy=Math.sin(heading)*speed+Math.cos(heading)*lateral;
 carX+=vx*dt;carY+=vy*dt;
 const c={x:width*.5,y:height*.51},r=radii(),radius=Math.hypot((carX-c.x)/r.x,(carY-c.y)/r.y);
 const onTrack=radius>.68&&radius<1.27;
 if(!onTrack){vx*=Math.pow(.91,dt*60);vy*=Math.pow(.91,dt*60)}
 drifting=steer&&Math.abs(side)>35&&Math.abs(speed)>75?Math.min(1,drifting+dt*2):Math.max(0,drifting-dt);
 const angle=(Math.atan2((carY-c.y)/r.y,(carX-c.x)/r.x)+Math.PI*2)%(Math.PI*2),sector=Math.floor(angle/(Math.PI/2));
 if(started&&onTrack&&speed>35&&sector===nextCheckpoint){nextCheckpoint=(nextCheckpoint+1)%4;if(nextCheckpoint===2){lap++;lapStart=now;document.querySelector('#lap').textContent=Math.min(lap,3)+' / 3';if(lap>=3){finished=true;const total=now-raceStart;if(!best||total<best){best=total;localStorage.setItem(storage,String(best));document.querySelector('#best').textContent=fmt(best)}document.querySelector('#countdown').textContent='ФИНИШ · '+fmt(total);document.querySelector('#countdown').style.display='block'}}}
 const shown=Math.round(Math.abs(speed)*.48);document.querySelector('#speed').textContent=String(shown).padStart(3,'0');document.querySelector('#gear').textContent=nitro&&gas?'N':speed<0?'R':'D';
 if(started)document.querySelector('#time').textContent=fmt(now-raceStart);
}
function paint(now){
 requestAnimationFrame(paint);const dt=Math.min((now-(paint.last||now))/1000,.04);paint.last=now;update(dt,now);ctx.clearRect(0,0,width,height);
 const sky=ctx.createLinearGradient(0,0,0,height);sky.addColorStop(0,'#8eaa88');sky.addColorStop(.62,'#b7b58b');sky.addColorStop(.63,'#6f815a');sky.addColorStop(1,'#52634a');ctx.fillStyle=sky;ctx.fillRect(0,0,width,height);
 const cx=width*.5,cy=height*.51,r=radii();
 ctx.fillStyle='#637b58';ctx.beginPath();ctx.moveTo(0,height*.64);for(let x=0;x<=width;x+=width/10)ctx.lineTo(x,height*(.52+Math.sin(x*.012)*.05));ctx.lineTo(width,height);ctx.lineTo(0,height);ctx.fill();
 for(let i=0;i<28;i++){const x=i*97%Math.max(width,1),y=cy-r.y-24-(i%4)*10;ctx.fillStyle=i%2?'#526d4c':'#75885a';ctx.beginPath();ctx.arc(x,y,8+i%5,0,Math.PI*2);ctx.fill()}
 ctx.beginPath();ctx.ellipse(cx,cy,r.x+38,r.y+38,0,0,Math.PI*2);ctx.ellipse(cx,cy,r.x-42,r.y-42,0,0,Math.PI*2,true);ctx.fillStyle='#4c4f48';ctx.fill('evenodd');ctx.lineWidth=3;ctx.strokeStyle='#e8e3c9';ctx.stroke();
 ctx.beginPath();ctx.ellipse(cx,cy,r.x-42,r.y-42,0,0,Math.PI*2);ctx.stroke();
 for(let a=0;a<Math.PI*2;a+=.13){ctx.fillStyle=Math.floor(a/.13)%2?'#f1efe0':'#d56f59';ctx.beginPath();ctx.arc(cx+Math.cos(a)*(r.x+35),cy+Math.sin(a)*(r.y+35),3,0,Math.PI*2);ctx.fill()}
 ctx.setLineDash([11,12]);ctx.lineWidth=2;ctx.strokeStyle='#c9c5a777';ctx.beginPath();ctx.ellipse(cx,cy,r.x-2,r.y-2,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
 const sx=cx+Math.cos(Math.PI*.91)*r.x,sy=cy+Math.sin(Math.PI*.91)*r.y;ctx.save();ctx.translate(sx,sy);ctx.rotate(Math.PI*.91+Math.PI/2);for(let i=0;i<8;i++){ctx.fillStyle=i%2?'#f1f0de':'#2f302c';ctx.fillRect(-10+i*3,-10,3,20)}ctx.restore();
 for(let i=0;i<4;i++){const a=i*Math.PI/2;ctx.fillStyle=i===nextCheckpoint?'#d2f079':'#f1d28b';ctx.beginPath();ctx.arc(cx+Math.cos(a)*r.x,cy+Math.sin(a)*r.y,4,0,Math.PI*2);ctx.fill()}
 ctx.save();ctx.translate(carX,carY);ctx.rotate(heading+Math.PI/2);ctx.fillStyle='#12151055';ctx.fillRect(-14,-2,30,16);ctx.fillStyle=drifting?'#e9906c':'#d4ed82';ctx.beginPath();ctx.moveTo(0,-18);ctx.lineTo(11,-7);ctx.lineTo(10,14);ctx.lineTo(-10,14);ctx.lineTo(-11,-7);ctx.closePath();ctx.fill();ctx.fillStyle='#4e6254';ctx.fillRect(-7,-7,14,9);ctx.fillStyle='#fff0be';ctx.fillRect(-9,-17,5,3);ctx.fillRect(4,-17,5,3);ctx.restore();
}
resize();requestAnimationFrame(paint);
