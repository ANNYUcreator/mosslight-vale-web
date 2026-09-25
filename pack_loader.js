/* Web-only PCK loader: smaller verified chunks to reduce mobile memory spikes. */
window.mossInstallPackLoader = engine => {
  const original=engine.preloadFile.bind(engine);
  const hex=buffer=>[...new Uint8Array(buffer)].map(b=>b.toString(16).padStart(2,'0')).join('');
  const pause=()=>new Promise(resolve=>requestAnimationFrame(()=>resolve()));
  const fetchPart=async(part)=>{
    let last;
    for(let attempt=0;attempt<3;attempt++){
      try{
        const response=await fetch(part.name,{cache:'force-cache'});
        if(!response.ok)throw new Error('HTTP '+response.status);
        const bytes=await response.arrayBuffer();
        if(bytes.byteLength!==part.bytes)throw new Error('length mismatch');
        const digest=hex(await crypto.subtle.digest('SHA-256',bytes));
        if(digest!==part.sha256)throw new Error('hash mismatch');
        return new Uint8Array(bytes);
      }catch(error){last=error;if(attempt<2)await new Promise(r=>setTimeout(r,500*(attempt+1)));}
    }
    throw new Error('Cannot load '+part.name+': '+last);
  };
  engine.preloadFile=async(file,path)=>{
    if(file!=='index.pck')return original(file,path);
    const mr=await fetch('pack-parts.json',{cache:'no-cache'});
    if(!mr.ok)throw new Error('Cannot load game manifest');
    const manifest=await mr.json();
    const pack=new Uint8Array(manifest.bytes);let offset=0;
    const label=document.createElement('div');
    label.id='moss-pack-progress';
    label.style.cssText='position:absolute;bottom:12%;left:8%;right:8%;text-align:center;color:white;font:600 15px sans-serif;z-index:10';
    document.getElementById('status')?.append(label);
    for(let i=0;i<manifest.parts.length;i++){
      label.textContent=`載入遊戲 / Loading ${i+1} / ${manifest.parts.length}`;
      const bytes=await fetchPart(manifest.parts[i]);
      pack.set(bytes,offset);offset+=bytes.byteLength;
      label.textContent=`載入遊戲 / Loading ${(offset/1048576).toFixed(0)} / ${(manifest.bytes/1048576).toFixed(0)} MB`;
      await pause();
    }
    if(offset!==manifest.bytes)throw new Error('Incomplete game data');
    window.mossVerifiedPack=manifest.sha256;
    label.textContent='正在開啟遊戲 / Starting…';
    return original(pack,path||file);
  };
};