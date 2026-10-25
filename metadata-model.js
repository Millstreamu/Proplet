(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.PixelStudioMetadata=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const CATEGORIES=['character','prop','decoration','ground','terrain','item','effect','ui'];
  const PRESETS={decoration:{category:'decoration',collision:{mode:'none',shape:{type:'bounds'}}},'solid prop':{category:'prop',collision:{mode:'solid',shape:{type:'bounds'}}},collectible:{category:'item',collision:{mode:'trigger',shape:{type:'bounds'}}},character:{category:'character',collision:{mode:'solid',shape:{type:'bounds'}}}};
  function tags(value){
    const items=Array.isArray(value)?value:typeof value==='string'?value.split(','):[];
    return [...new Set(items.filter(v=>typeof v==='string').map(v=>v.trim()).filter(Boolean))];
  }
  function metadata(asset){
    const old=asset.kind||'decor';
    const result = {category:old==='decor'?'decoration':['collision','animated'].includes(old)?'prop':old,
      collision:{mode:asset.collision||old==='collision'?'solid':'none',shape:{type:'bounds'}},
      pivot:{x:.5,y:1},groundAnchor:null,footprint:null,terrain:{family:'',corners:asset.corners||[]},
      tags:tags(asset.tags),properties:{},animationId:null,...asset.metadata};
    result.tags=tags(result.tags);
    result.enabled={category:!!result.category,collision:result.collision?.mode!=='none',placement:!!asset.metadata?.pivot||!!result.groundAnchor||!!result.footprint,tags:result.tags.length>0,properties:Object.keys(result.properties||{}).length>0,terrain:result.category==='terrain',animationId:!!result.animationId,...asset.metadata?.enabled};
    return result;
  }
  function validate(m,w,h,animationIds=[]){
    const errors=[];
    const on=m.enabled || {category:true,collision:true,placement:true,tags:true,properties:true,terrain:true,animationId:true};
    if(on.category&&m.category!==''&&(typeof m.category!=='string'||!m.category.trim()))errors.push('Category is required.');
    const point=(p,maxX,maxY)=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.y>=0&&p.x<=maxX&&p.y<=maxY;
    if(on.placement&&m.pivot!==null&&!point(m.pivot,1,1))errors.push('Pivot coordinates must be between 0 and 1.');
    if(on.placement&&m.groundAnchor!==null&&!point(m.groundAnchor,w,h))errors.push('Ground anchor must lie inside the sprite.');
    if(on.placement&&m.footprint!==null&&(!m.footprint||!Number.isInteger(m.footprint.w)||!Number.isInteger(m.footprint.h)||m.footprint.w<1||m.footprint.h<1))errors.push('Tile footprint needs positive integer w and h.');
    if(on.collision&&!['none','solid','trigger','one-way'].includes(m.collision?.mode))errors.push('Invalid collision mode.');
    const shape=m.collision?.shape;
    if(on.collision&&!['bounds','rectangle','polygon'].includes(shape?.type))errors.push('Invalid collision shape.');
    if(on.collision&&shape?.type==='rectangle'&&(!point(shape,w,h)||!Number.isFinite(shape.w)||!Number.isFinite(shape.h)||shape.w<=0||shape.h<=0||shape.x+shape.w>w||shape.y+shape.h>h))errors.push('Collision rectangle must fit inside the sprite.');
    if(on.collision&&shape?.type==='polygon'){
      const ps=shape.points;
      if(!Array.isArray(ps)||ps.length<3||!ps.every(p=>point(p,w,h)))errors.push('Polygon needs at least three points inside the sprite.');
      else if(Math.abs(ps.reduce((sum,p,i)=>{const q=ps[(i+1)%ps.length];return sum+p.x*q.y-q.x*p.y;},0))<.000001)errors.push('Polygon must have non-zero area.');
    }
    if(on.tags&&(!Array.isArray(m.tags)||!m.tags.every(t=>typeof t==='string')))errors.push('Tags must be text labels.');
    if(on.properties&&(!m.properties||Array.isArray(m.properties)||typeof m.properties!=='object'||!Object.values(m.properties).every(v=>typeof v==='string'||typeof v==='boolean'||(typeof v==='number'&&Number.isFinite(v)))))errors.push('Custom properties must be an object of text, finite numbers, or booleans.');
    if(on.animationId&&m.animationId&&!animationIds.includes(m.animationId))errors.push('Linked animation does not exist.');
    if(on.terrain&&(!m.terrain||typeof m.terrain.family!=='string'||!Array.isArray(m.terrain.corners)||![0,4].includes(m.terrain.corners.length)||!m.terrain.corners.every(c=>c===null||typeof c==='string')))errors.push('Terrain corners must be empty or contain TL, TR, BR, BL labels.');
    return errors;
  }
  function build({type,image,width,height,assets,animations=[]}){
    const ids=new Set(),errors=[];
    const entries=assets.map(a=>{
      if(!a.id||ids.has(a.id))errors.push('Missing or duplicate asset ID: '+a.id);ids.add(a.id);
      const m=metadata(a);
      errors.push(...validate(m,a.rect.w,a.rect.h,animations.map(a=>a.id)).map(e=>a.name+': '+e));
      const entry={id:a.id,name:a.name,rect:a.rect};
      for(const key of ['category','collision','tags','properties','terrain','animationId']){
        const value=m[key];
        if(m.enabled[key]&&value!=null&&value!==''&&!(Array.isArray(value)&&!value.length)&&!(key==='properties'&&!Object.keys(value).length))entry[key]=value;
      }
      if(m.enabled.placement){for(const key of ['pivot','groundAnchor','footprint'])if(m[key]!=null)entry[key]=m[key];}
      return entry;
    });
    const linkedIds=new Set(entries.map(a=>a.animationId).filter(Boolean));
    for(const a of animations.filter(a=>linkedIds.has(a.id))){
      if(!Array.isArray(a.frames)||!a.frames.length||!a.frames.every(f=>Array.isArray(f.px)&&f.px.length===a.w*a.h&&Number.isFinite(f.dur)&&f.dur>0))errors.push('Invalid animation frames: '+a.name);
      if((a.tags||[]).some(t=>!Number.isInteger(t.start)||!Number.isInteger(t.end)||t.start<1||t.end<t.start||t.end>(a.frames||[]).length||!['Forward','Reverse','Ping Pong'].includes(t.mode||'Forward')))errors.push('Invalid animation clip: '+a.name);
    }
    if(errors.length)throw new Error(errors.join('\n'));
    const linked=new Set(entries.map(a=>a.animationId).filter(Boolean));
    return {format:'proplet-assets',version:2,type,image:{file:image,width,height},coordinates:{rectangles:'pixels; top-left origin',collision:'local pixels; top-left origin',groundAnchor:'local pixels',pivot:'normalized 0..1',footprint:'tile cells'},assets:entries,animations:animations.filter(a=>linked.has(a.id)).map(a=>({id:a.id,name:a.name,w:a.w,h:a.h,frames:a.frames.map(f=>({id:f.id,durationMs:f.dur,pixels:f.px})),clips:(a.tags||[]).map(t=>({name:t.name,start:t.start,end:t.end,mode:t.mode})),clipFrameIndices:'1-based inclusive'}))};
  }
  function assertLegacyNames(assets){const names=new Set();for(const a of assets){const key=a.name.toLowerCase().replace(/\s+/g,'_');if(names.has(key))throw new Error('Legacy export would overwrite duplicate name: '+key);names.add(key);}}
  return {CATEGORIES,PRESETS,tags,metadata,validate,build,assertLegacyNames};
});
