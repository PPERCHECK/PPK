const canvas = document.querySelector('#pixel-canvas');
const ctx = canvas.getContext('2d');
const width = canvas.width, height = canvas.height, total = width * height;
const storageKey = 'ssait-pixel-studio-v1';
const colors = [
  {name:'Прозрачный',value:'#00000000'}, {name:'Лайм',value:'#d7ff73'}, {name:'Мята',value:'#77e8bd'}, {name:'Небо',value:'#83caff'},
  {name:'Сирень',value:'#b391ff'}, {name:'Розовый',value:'#ff9ac9'}, {name:'Коралл',value:'#ff9a7c'}, {name:'Персик',value:'#ffc58f'},
  {name:'Солнечный',value:'#ffe47c'}, {name:'Снег',value:'#f8f2ff'}, {name:'Лавандовый',value:'#74648e'}, {name:'Черника',value:'#352b4d'},
  {name:'Трава',value:'#4f956e'}, {name:'Лес',value:'#283f3c'}, {name:'Глина',value:'#885747'}, {name:'Камень',value:'#737080'},
  {name:'Пыльный розовый',value:'#bd7184'}, {name:'Ночная слива',value:'#251c39'}
];
let pixels = new Uint8Array(total), selectedColor = 1, selectedTool = 'pen', brushSize = 1, drawing = false, moved = false;
let undoStack = [], redoStack = [], lastPoint = null;

try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
  if (Array.isArray(saved) && saved.length === total) pixels.set(saved.map(value => Math.max(0, Math.min(colors.length - 1, Number(value) || 0))));
} catch {}

function paint() {
  ctx.clearRect(0, 0, width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const colorIndex = pixels[y * width + x];
      if (colorIndex) { ctx.fillStyle = colors[colorIndex].value; ctx.fillRect(x, y, 1, 1); }
    }
  }
}

function renderPalette() {
  const palette = document.querySelector('#palette'); palette.replaceChildren();
  colors.forEach((color, index) => {
    const button = document.createElement('button');
    button.className = `swatch${index === 0 ? ' transparent' : ''}${selectedColor === index ? ' active' : ''}`;
    button.style.setProperty('--swatch', color.value);
    button.title = `${color.name} · клавиша ${index === 0 ? 0 : index}`;
    button.setAttribute('aria-label', color.name); button.setAttribute('aria-pressed', String(selectedColor === index));
    button.addEventListener('click', () => { selectedColor = index; document.querySelector('#color-name').textContent = color.name; renderPalette(); if (index === 0) setTool('eraser'); else if (selectedTool === 'eraser') setTool('pen'); });
    palette.append(button);
  });
  document.querySelector('#color-name').textContent = colors[selectedColor].name;
}

function setTool(tool) {
  selectedTool = tool;
  document.querySelectorAll('.tool').forEach(button => button.classList.toggle('active', button.dataset.tool === tool));
  canvas.style.cursor = tool === 'fill' ? 'cell' : tool === 'eraser' ? 'not-allowed' : 'crosshair';
}

function saveSnapshot() {
  undoStack.push(Array.from(pixels)); if (undoStack.length > 35) undoStack.shift();
  redoStack = []; updateHistoryButtons();
}

function updateHistoryButtons() {
  document.querySelector('#undo').disabled = undoStack.length === 0;
  document.querySelector('#redo').disabled = redoStack.length === 0;
}

let saveTimer;
function persist() {
  const state = document.querySelector('#save-state'), dot = document.querySelector('.save-dot');
  state.textContent = 'сохраняю…'; dot.classList.add('saving');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(Array.from(pixels))); state.textContent = 'сохранён на устройстве'; }
    catch { state.textContent = 'не поместилось — скачай рисунок'; }
    dot.classList.remove('saving');
  }, 180);
}

function point(event) {
  const rect = canvas.getBoundingClientRect();
  return {x:Math.max(0,Math.min(width-1,Math.floor((event.clientX-rect.left)*width/rect.width))),y:Math.max(0,Math.min(height-1,Math.floor((event.clientY-rect.top)*height/rect.height)))};
}

function setPixel(x,y,color=selectedColor) {
  for (let dy = 0; dy < brushSize; dy++) for (let dx = 0; dx < brushSize; dx++) {
    const px=x+dx,py=y+dy;if(px>=0&&py>=0&&px<width&&py<height)pixels[py*width+px]=color;
  }
}

function drawLine(from,to) {
  let x=from.x,y=from.y,dx=Math.abs(to.x-from.x),sx=from.x<to.x?1:-1,dy=-Math.abs(to.y-from.y),sy=from.y<to.y?1:-1,error=dx+dy;
  while(true){setPixel(x,y,selectedTool==='eraser'||selectedColor===0?0:selectedColor);if(x===to.x&&y===to.y)break;const e2=2*error;if(e2>=dy){error+=dy;x+=sx}if(e2<=dx){error+=dx;y+=sy}}
}

function floodFill(startX,startY) {
  const startIndex=startY*width+startX,target=pixels[startIndex],replacement=selectedTool==='eraser'||selectedColor===0?0:selectedColor;
  if(target===replacement)return;
  const queue=[startIndex];pixels[startIndex]=replacement;
  for(let cursor=0;cursor<queue.length;cursor++){
    const index=queue[cursor],x=index%width,y=Math.floor(index/width);
    for(const next of [x>0?index-1:-1,x<width-1?index+1:-1,y>0?index-width:-1,y<height-1?index+width:-1])if(next>=0&&pixels[next]===target){pixels[next]=replacement;queue.push(next)}
  }
  paint();persist();
}

canvas.addEventListener('contextmenu', event => event.preventDefault());
canvas.addEventListener('pointerdown', event => {
  event.preventDefault(); const p=point(event);document.querySelector('#coord').textContent=`x: ${p.x+1} · y: ${p.y+1}`;
  if(event.button===2){saveSnapshot();setTool('eraser')}
  if(selectedTool==='fill'&&event.button!==2){saveSnapshot();floodFill(p.x,p.y);return}
  saveSnapshot();drawing=true;moved=false;lastPoint=p;canvas.setPointerCapture(event.pointerId);drawLine(p,p);paint();
});

canvas.addEventListener('pointermove', event => {
  const p=point(event);document.querySelector('#coord').textContent=`x: ${p.x+1} · y: ${p.y+1}`;
  if(!drawing)return;
  if(lastPoint.x!==p.x||lastPoint.y!==p.y)moved=true;
  drawLine(lastPoint,p);lastPoint=p;paint();
});

function finishDraw(){if(!drawing)return;drawing=false;lastPoint=null;if(moved||selectedTool==='pen'||selectedTool==='eraser')persist();}
canvas.addEventListener('pointerup',finishDraw);canvas.addEventListener('pointercancel',finishDraw);canvas.addEventListener('lostpointercapture',finishDraw);
canvas.addEventListener('pointerleave',()=>{if(!drawing)document.querySelector('#coord').textContent='x: — · y: —'});

document.querySelectorAll('.tool').forEach(button => button.addEventListener('click',()=>setTool(button.dataset.tool)));
document.querySelector('#brush-size').addEventListener('input',event=>{brushSize=Number(event.target.value);document.querySelector('#brush-label').textContent=`${brushSize} px`});
document.querySelector('#undo').addEventListener('click',()=>{if(!undoStack.length)return;redoStack.push(Array.from(pixels));pixels=Uint8Array.from(undoStack.pop());paint();persist();updateHistoryButtons()});
document.querySelector('#redo').addEventListener('click',()=>{if(!redoStack.length)return;undoStack.push(Array.from(pixels));pixels=Uint8Array.from(redoStack.pop());paint();persist();updateHistoryButtons()});
document.querySelector('#clear').addEventListener('click',()=>{if(!pixels.some(Boolean))return;saveSnapshot();pixels.fill(0);paint();persist()});

function preset(kind){
  saveSnapshot();pixels.fill(0);
  if(kind==='star'){
    for(let y=5;y<27;y++)for(let x=5;x<27;x++){const dx=Math.abs(x-16),dy=Math.abs(y-16);if((dy<4&&dx<11)||(dx<4&&dy<11)||(dx+dy<10&&dx>3&&dy>3))setDirect(x,y,1)}
    for(let y=10;y<23;y++)for(let x=10;x<23;x++)if(x+y>27&&x+y<37&&x-y> -7&&x-y<7)setDirect(x,y,8);
  }
  if(kind==='house'){
    for(let y=14;y<27;y++)for(let x=7;x<26;x++)setDirect(x,y,14);
    for(let y=8;y<19;y++)for(let x=6;x<27;x++)if(Math.abs(x-16)<=y-7)setDirect(x,y,7);
    for(let y=19;y<27;y++)for(let x=14;x<19;x++)setDirect(x,y,15);
    for(let y=17;y<21;y++)for(let x=9;x<13;x++)setDirect(x,y,3);
  }
  if(kind==='heart'){
    for(let y=7;y<27;y++)for(let x=6;x<26;x++){const nx=(x-15.5)/10,ny=(y-15)/10;if(Math.pow(nx*nx+ny*ny-1,3)-nx*nx*ny*ny*ny<=0)setDirect(x,y,6)}
    for(let y=10;y<15;y++)for(let x=9;x<13;x++)setDirect(x,y,9);
  }
  paint();persist();
}

function setDirect(x,y,color){pixels[y*width+x]=color}
document.querySelectorAll('[data-preset]').forEach(button=>button.addEventListener('click',()=>preset(button.dataset.preset)));
document.querySelector('#export').addEventListener('click',()=>{
  const output=document.createElement('canvas');output.width=width*16;output.height=height*16;const out=output.getContext('2d');out.imageSmoothingEnabled=false;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){const color=pixels[y*width+x];if(color){out.fillStyle=colors[color].value;out.fillRect(x*16,y*16,16,16)}}
  output.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='ssait-pixel-art.png';link.click();setTimeout(()=>URL.revokeObjectURL(url),1500)});
});

window.addEventListener('keydown',event=>{
  if(event.target instanceof HTMLInputElement)return;
  const key=event.key.toLowerCase();
  if(key==='b')setTool('pen');if(key==='f')setTool('fill');if(key==='e')setTool('eraser');
  if(/^[0-9]$/.test(key)){const n=Number(key);if(n<colors.length){selectedColor=n;renderPalette();if(n)setTool('pen')}}
  if((event.ctrlKey||event.metaKey)&&key==='z'){event.preventDefault();document.querySelector(event.shiftKey?'#redo':'#undo').click()}
});

renderPalette();updateHistoryButtons();paint();
