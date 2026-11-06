(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./metadata-model.js'):root.PixelStudioMetadata);if(typeof module==='object'&&module.exports)module.exports=api;root.PixelStudioAtlasImport=api;})(typeof globalThis!=='undefined'?globalThis:this,function(M){
 'use strict';
 const size=n=>Number.isInteger(n)&&n>0&&n<=256;
 function prepare(data,image){
  if(!data||typeof data!=='object')throw new Error('Choose a Proplet project or atlas JSON file.');
  let sprites,animations=[];
  if(data.format==='pixelproj'){
   sprites=Array.isArray(data.atlasSheets)&&data.atlasSheets.length?data.atlasSheets.flatMap(sheet=>sheet.assets||[]):data.atlas;
   animations=data.animations||[];
  }else{
   const modern=data.format==='proplet-assets'&&data.version===2&&data.type==='atlas';
   if(!modern&&!data.sprites)throw new Error('This JSON is not an atlas export.');
   if(!image)throw new Error('Choose the atlas PNG that belongs to this JSON.');
   const declared=modern?data.image:{width:data.width,height:data.height};
   if(declared?.width!==image.width||declared?.height!==image.height)throw new Error('PNG dimensions do not match the atlas JSON.');
   const entries=modern?data.assets:Object.entries(data.sprites).map(([name,a])=>({...a,name,rect:{x:a.x,y:a.y,w:a.w,h:a.h}}));
   if(!Array.isArray(entries))throw new Error('Atlas assets must be a list.');
   sprites=entries.map(a=>{
    const r=a.rect;
    if(!r||!size(r.w)||!size(r.h)||![r.x,r.y].every(Number.isInteger)||r.x<0||r.y<0||r.x+r.w>image.width||r.y+r.h>image.height)throw new Error('Invalid image rectangle for '+a.name);
    const px=Array.from({length:r.w*r.h},(_,i)=>{const j=((r.y+Math.floor(i/r.w))*image.width+r.x+i%r.w)*4;const rgba=Array.from(image.pixels.slice(j,j+4));return rgba[3]===0?null:'#'+(rgba[3]===255?rgba.slice(0,3):rgba).map(v=>v.toString(16).padStart(2,'0')).join('');});
    if(!modern)return {...a,w:r.w,h:r.h,px};
    const metadata={};
    for(const key of ['category','collision','pivot','groundAnchor','footprint','terrain','tags','properties','animationId'])if(key in a)metadata[key]=a[key];
    metadata.enabled=Object.fromEntries(['category','collision','tags','properties','terrain','animationId'].map(k=>[k,k in a]));
    metadata.enabled.placement=['pivot','groundAnchor','footprint'].some(k=>k in a);
    return {name:a.name,w:r.w,h:r.h,px,metadata};
   });
   animations=modern?(data.animations||[]).map(a=>({...a,frames:(a.frames||[]).map(f=>({id:f.id,px:f.pixels,dur:f.durationMs,sel:true})),tags:(a.clips||[]).map((c,i)=>({...c,id:'clip-'+i,color:'#e1ad66'})),activeTag:null,active:0})):[];
  }
  if(!Array.isArray(sprites)||!sprites.length)throw new Error('This file contains no Atlas sprites.');
  if(!Array.isArray(animations))throw new Error('Invalid animation list.');
  const linked=new Set(sprites.map(a=>a.metadata?.animationId).filter(Boolean));
  animations=animations.filter(a=>linked.has(a.id));
  if(new Set(animations.map(a=>a.id)).size!==animations.length)throw new Error('Duplicate animation IDs in import.');
  for(const a of animations){if(!size(a.w)||!size(a.h)||!Array.isArray(a.frames)||!a.frames.length||a.frames.some(f=>!Array.isArray(f.px)||f.px.length!==a.w*a.h||!Number.isFinite(f.dur)||f.dur<=0))throw new Error('Invalid linked animation: '+a.name);}
  sprites=sprites.map(a=>{
   if(!a||!size(a.w)||!size(a.h)||!Array.isArray(a.px)||a.px.length!==a.w*a.h||a.px.some(c=>c!==null&&(typeof c!=='string'||!/^#(?:[a-f\d]{3}|[a-f\d]{6}|[a-f\d]{8})$/i.test(c))))throw new Error('Invalid sprite pixels or size: '+a?.name);
   const metadata=M.metadata(a),errors=M.validate(metadata,a.w,a.h,animations.map(a=>a.id));
   if(errors.length)throw new Error((a.name||'Sprite')+': '+errors.join(' '));
   return {...a,name:typeof a.name==='string'&&a.name.trim()?a.name:'Imported sprite',metadata};
  });
  M.build({assets:sprites.map((a,i)=>({...a,id:'validate-'+i,rect:{x:0,y:0,w:a.w,h:a.h}})),animations});
  return {sprites,animations,categories:data.metadataCategories||[]};
 }
 return {prepare};
});
