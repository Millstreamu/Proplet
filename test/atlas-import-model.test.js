const test=require('node:test');const assert=require('node:assert/strict');const {prepare}=require('../atlas-import-model.js');
const image={width:2,height:1,pixels:new Uint8ClampedArray([255,0,0,255,0,0,255,128])};
test('v2 import crops sprites in order with transparency and optional metadata preserved',()=>{
 const out=prepare({format:'proplet-assets',version:2,type:'atlas',image:{width:2,height:1},assets:[{id:'old',name:'Red',rect:{x:0,y:0,w:1,h:1}},{id:'old2',name:'Blue',rect:{x:1,y:0,w:1,h:1},category:'prop'}]},image);
 assert.deepEqual(out.sprites.map(a=>a.px[0]),['#ff0000','#0000ff80']);
 assert.equal(out.sprites[0].metadata.enabled.category,false);assert.equal(out.sprites[1].metadata.category,'prop');
});
test('legacy JSON and project atlases import without replacing project data',()=>{
 const legacy=prepare({width:2,height:1,sprites:{red:{x:0,y:0,w:1,h:1,tags:['hot']}}},image);
 assert.deepEqual(legacy.sprites[0].metadata.tags,['hot']);
 const project=prepare({format:'pixelproj',atlas:[{name:'Original',w:1,h:1,px:['#abc']}]});
 assert.deepEqual(project.sprites[0].px,['#abc']);
});
test('invalid files, mismatched PNGs and out-of-range rectangles reject the import',()=>{
 assert.throws(()=>prepare({format:'pixelproj',atlas:[]}),/no Atlas sprites/);
 assert.throws(()=>prepare({sprites:{}},image),/dimensions/);
 assert.throws(()=>prepare({width:2,height:1,sprites:{bad:{x:2,y:0,w:1,h:1}}},image),/rectangle/);
 assert.throws(()=>prepare({width:2,height:1,sprites:{}}),/PNG/);
});
test('project imports include all named Atlas sheets in their existing order',()=>{
 const sprite=name=>({name,w:1,h:1,px:['#abc']});
 const out=prepare({format:'pixelproj',atlas:[sprite('Compatibility cache')],atlasSheets:[{assets:[sprite('First')]},{assets:[sprite('Second')]}]});
 assert.deepEqual(out.sprites.map(a=>a.name),['First','Second']);
});
