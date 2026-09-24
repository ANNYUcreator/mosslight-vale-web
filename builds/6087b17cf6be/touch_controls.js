/* Web-only input overlay. No game resources or native settings are modified. */
(() => {
  'use strict';
  const canvas = document.querySelector('canvas');
  if (!canvas) return;
  const root = document.createElement('div'); root.id = 'moss-touch';
  const held = new Map();
  const send = (key, code, down) => canvas.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', {key, code, bubbles:true, cancelable:true, shiftKey:key==='Shift' && down}));
  const release = pointer => { const v=held.get(pointer); if(v){ send(v[0],v[1],false); held.delete(pointer); } };
  const groups = [
    [['↑','w','KeyW'],['←','a','KeyA'],['↓','s','KeyS'],['→','d','KeyD']],
    [['互動','f','KeyF'],['攻擊',' ','Space'],['跑步','Shift','ShiftLeft'],['背包','Tab','Tab'],['地圖','m','KeyM'],['選單','Escape','Escape'],['視角↶','q','KeyQ'],['視角↷','e','KeyE']]
  ];
  for (const entries of groups) {
    const group=document.createElement('div'); group.className='moss-pad'; root.append(group);
    for(const [label,key,code] of entries){
      const button=document.createElement('button'); button.textContent=label; button.type='button'; button.dataset.code=code;
      button.addEventListener('pointerdown',e=>{e.preventDefault();canvas.focus();button.setPointerCapture(e.pointerId);held.set(e.pointerId,[key,code]);send(key,code,true);});
      for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,e=>{e.preventDefault();release(e.pointerId);});
      group.append(button);
    }
  }
  const clear=()=>{for(const pointer of [...held.keys()])release(pointer);};
  window.addEventListener('blur',clear); document.addEventListener('visibilitychange',clear);
  document.body.append(root);
  const toggle=document.createElement('button');toggle.id='moss-touch-toggle';toggle.textContent='觸控 / Touch';toggle.type='button';
  toggle.onclick=()=>{root.classList.toggle('moss-visible');};document.body.append(toggle);
  if(matchMedia('(pointer: coarse)').matches)root.classList.add('moss-visible');
})();
