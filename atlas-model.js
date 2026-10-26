(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.PixelStudioAtlas=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const clone=x=>JSON.parse(JSON.stringify(x));
 const id=prefix=>prefix+'-'+(typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));
 const settings=()=>({spacing:1,padding:1,transparent:true});
 function normalize(project){
  const sheets=Array.isArray(project.atlasSheets)&&project.atlasSheets.length?clone(project.atlasSheets):[{id:id('atlas'),name:'Atlas 1',assets:clone(project.atlas||[]),export:project.atlasExport||settings(),activeSprite:project.activeAtlas||0}];
  const seen=new Set();for(const s of sheets){if(typeof s.id!=='string'||!s.id||seen.has(s.id))throw Error('Atlas sheets need unique IDs.');seen.add(s.id);if(!Array.isArray(s.assets))throw Error('Atlas sheet assets must be a list.');s.name=String(s.name||'Atlas');s.export={...settings(),...s.export};s.activeSprite=Math.max(0,Math.min(s.assets.length-1,s.activeSprite||0));}
  return{projectId:typeof project.projectId==='string'&&project.projectId?project.projectId:id('project'),atlasSheets:sheets,activeAtlasSheet:sheets.some(s=>s.id===project.activeAtlasSheet)?project.activeAtlasSheet:sheets[0].id};
 }
 function duplicate(sheet){return{...clone(sheet),id:id('atlas'),name:sheet.name+' copy',assets:sheet.assets.map(a=>({...clone(a),id:id('sprite')}))};}
 function source(projectId,projectName,sheet,scope='complete'){return{project:{id:projectId,name:projectName},sheet:{id:sheet.id,name:sheet.name},scope};}
 return{normalize,duplicate,source,id};
});
