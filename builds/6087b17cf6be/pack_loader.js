/* Uses Godot's documented preloadFile(ArrayBuffer, path) API. Byte-identical pack. */
window.mossInstallPackLoader = engine => {
  const original=engine.preloadFile.bind(engine);
  engine.preloadFile=async(file,path)=>{
    if(file!=='index.pck')return original(file,path);
    const manifestResponse=await fetch('pack-parts.json');
    if(!manifestResponse.ok)throw new Error('Cannot load game manifest');
    const manifest=await manifestResponse.json();
    const pack=new Uint8Array(manifest.bytes);let offset=0;
    const label=document.createElement('div');label.style.cssText='position:absolute;bottom:12%;left:10%;right:10%;text-align:center;color:white;font:16px sans-serif';
    document.getElementById('status')?.append(label);
    for(const part of manifest.parts){
      const response=await fetch(part.name);if(!response.ok)throw new Error('Missing game data: '+part.name);
      const reader=response.body.getReader();let length=0;
      while(true){const result=await reader.read();if(result.done)break;pack.set(result.value,offset);offset+=result.value.length;length+=result.value.length;label.textContent=`載入遊戲 / Loading ${(offset/1048576).toFixed(1)} / ${(manifest.bytes/1048576).toFixed(1)} MB`;}
      if(length!==part.bytes)throw new Error('Game data length mismatch');
    }
    if(offset!==manifest.bytes)throw new Error('Incomplete game data');
    const digest=await crypto.subtle.digest('SHA-256',pack);
    const actual=[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
    if(actual!==manifest.sha256)throw new Error('Game data integrity mismatch');
    window.mossVerifiedPack=actual;label.textContent='正在開啟遊戲 / Starting…';
    return original(pack,path||file);
  };
};
