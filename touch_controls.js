/* Mobile/Web-only controls. Native input files are never modified. */
(() => {
  'use strict';
  const canvas = document.querySelector('canvas');
  if (!canvas) return;
  const coarse = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
  const root = document.createElement('div');
  root.id = 'moss-touch';
  root.innerHTML = [
    '<div id="moss-stick" aria-label="Move"><div id="moss-stick-knob"></div></div>',
    '<div id="moss-actions"></div>',
    '<div id="moss-camera-hint">右側拖曳視角<br><span>Drag right side to look</span></div>',
    '<div id="moss-landscape-tip">建議橫向遊玩 · Rotate to landscape</div>'
  ].join('');
  document.body.append(root);

  const keyState = new Map();
  const sendKey = (key, code, down) => {
    if (keyState.get(code) === down) return;
    keyState.set(code, down);
    canvas.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', {
      key, code, bubbles: true, cancelable: true
    }));
  };
  const movement = {
    left: ['a','KeyA'], right: ['d','KeyD'],
    up: ['w','KeyW'], down: ['s','KeyS']
  };
  const clearMovement = () => Object.values(movement).forEach(([k,c]) => sendKey(k,c,false));

  const stick = root.querySelector('#moss-stick');
  const knob = root.querySelector('#moss-stick-knob');
  let stickPointer = null;
  const updateStick = (e) => {
    const r = stick.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const radius = r.width * 0.34;
    let dx = e.clientX - cx, dy = e.clientY - cy;
    const len = Math.hypot(dx,dy);
    if (len > radius) { dx *= radius/len; dy *= radius/len; }
    knob.style.transform = `translate(${dx}px,${dy}px)`;
    const nx = dx / radius, ny = dy / radius, dead = 0.24;
    sendKey(...movement.left, nx < -dead);
    sendKey(...movement.right, nx > dead);
    sendKey(...movement.up, ny < -dead);
    sendKey(...movement.down, ny > dead);
  };
  stick.addEventListener('pointerdown', e => {
    e.preventDefault(); e.stopPropagation(); canvas.focus();
    stickPointer = e.pointerId; stick.setPointerCapture(e.pointerId); updateStick(e);
  }, {passive:false});
  stick.addEventListener('pointermove', e => {
    if (e.pointerId !== stickPointer) return;
    e.preventDefault(); updateStick(e);
  }, {passive:false});
  const endStick = e => {
    if (e.pointerId !== stickPointer) return;
    stickPointer = null; knob.style.transform = 'translate(0,0)'; clearMovement();
  };
  ['pointerup','pointercancel','lostpointercapture'].forEach(n => stick.addEventListener(n,endStick));

  const actions = [
    ['互動','F','f','KeyF'], ['攻擊','攻',' ','Space'],
    ['跑步','跑','Shift','ShiftLeft'], ['閃避','閃','Control','ControlLeft'],
    ['背包','包','Tab','Tab'], ['地圖','圖','m','KeyM'],
    ['選單','☰','Escape','Escape'], ['左轉','↶','q','KeyQ'], ['右轉','↷','e','KeyE']
  ];
  const actionRoot = root.querySelector('#moss-actions');
  const heldActions = new Map();
  for (const [title,label,key,code] of actions) {
    const b = document.createElement('button');
    b.type='button'; b.textContent=label; b.title=title; b.setAttribute('aria-label',title);
    b.addEventListener('pointerdown', e => {
      e.preventDefault(); e.stopPropagation(); canvas.focus();
      b.setPointerCapture(e.pointerId); heldActions.set(e.pointerId,[key,code]); sendKey(key,code,true);
    }, {passive:false});
    const release = e => {
      const v=heldActions.get(e.pointerId); if(!v) return;
      sendKey(v[0],v[1],false); heldActions.delete(e.pointerId);
    };
    ['pointerup','pointercancel','lostpointercapture'].forEach(n=>b.addEventListener(n,release));
    actionRoot.append(b);
  }

  let camera = null;
  const mouse = (type,e,buttons,mx=0,my=0) => canvas.dispatchEvent(new MouseEvent(type,{
    bubbles:true,cancelable:true,button:type==='mouseup'?2:2,buttons,
    clientX:e.clientX,clientY:e.clientY,movementX:mx,movementY:my
  }));
  canvas.addEventListener('pointerdown', e => {
    if (!coarse || (e.pointerType!=='touch' && e.pointerType!=='pen')) return;
    if (e.clientX < innerWidth*0.43 || e.clientY > innerHeight*0.84) return;
    camera={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,active:false};
  }, {passive:true});
  canvas.addEventListener('pointermove', e => {
    if (!camera || e.pointerId!==camera.id) return;
    const total=Math.hypot(e.clientX-camera.startX,e.clientY-camera.startY);
    const dx=e.clientX-camera.x, dy=e.clientY-camera.y;
    camera.x=e.clientX; camera.y=e.clientY;
    if (!camera.active && total>7) { camera.active=true; mouse('mousedown',e,2); }
    if (camera.active) { e.preventDefault(); mouse('mousemove',e,2,dx,dy); }
  }, {passive:false});
  const endCamera = e => {
    if (!camera || e.pointerId!==camera.id) return;
    if (camera.active) mouse('mouseup',e,0);
    camera=null;
  };
  ['pointerup','pointercancel'].forEach(n=>canvas.addEventListener(n,endCamera,{passive:true}));
  canvas.addEventListener('contextmenu',e=>e.preventDefault());

  const clearAll=()=>{
    clearMovement();
    for(const [id,v] of [...heldActions]){sendKey(v[0],v[1],false);heldActions.delete(id);}
    camera=null;
  };
  window.addEventListener('blur',clearAll);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clearAll();});
  document.addEventListener('touchmove',e=>{if(coarse)e.preventDefault();},{passive:false});

  const toggle=document.createElement('button');
  toggle.id='moss-touch-toggle';toggle.type='button';toggle.textContent='觸控';
  toggle.onclick=()=>root.classList.toggle('moss-hidden');
  document.body.append(toggle);
  if (!coarse) root.classList.add('moss-hidden');
  setTimeout(()=>root.querySelector('#moss-camera-hint')?.classList.add('fade'),4500);
})();