'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {metadata,validate,build,assertLegacyNames}=require('../metadata-model.js');
const asset=(id,name)=>({id,name,rect:{x:0,y:0,w:16,h:24}});
test('migrates legacy kinds without treating category and collision as mutually exclusive',()=>{
  const m=metadata({kind:'decor',collision:true,tags:'tree, forest'});
  assert.equal(m.category,'decoration');assert.equal(m.collision.mode,'solid');assert.deepEqual(m.tags,['tree','forest']);
  assert.equal(metadata({kind:'collision'}).collision.mode,'solid');
  assert.equal(metadata({kind:'animated'}).category,'prop');
});
test('v2 preserves duplicate names with stable IDs; legacy export rejects destructive name collisions',()=>{
  const assets=[asset('one','Big Tree'),asset('two','big_tree')];
  const doc=build({type:'atlas',image:'trees.png',width:32,height:24,assets});
  assert.equal(doc.assets.length,2);assert.equal(doc.assets[1].id,'two');assert.equal(doc.image.file,'trees.png');
  assert.throws(()=>assertLegacyNames(assets),/overwrite duplicate name/);
  assert.throws(()=>build({assets:[asset('one','A'),asset('one','B')]}),/duplicate asset ID/);
});
test('validates placement, collision geometry, custom data and linked animation references',()=>{
  const m=metadata({});assert.deepEqual(validate(m,16,24),[]);
  m.enabled={category:true,placement:true,collision:true,properties:true,animationId:true};
  m.pivot.x=2;m.collision={mode:'solid',shape:{type:'rectangle',x:12,y:0,w:10,h:4}};
  m.properties={bad:{nested:true}};m.animationId='missing';
  assert.equal(validate(m,16,24).length,4);
  m.pivot.x=.5;m.properties={damage:10,active:true,label:'wood'};m.animationId=null;
  m.collision.shape={type:'polygon',points:[{x:0,y:0},{x:8,y:0},{x:4,y:8}]};
  assert.deepEqual(validate(m,16,24),[]);
  m.collision.shape.points=[{x:0,y:0},{x:1,y:1},{x:2,y:2}];
  assert.match(validate(m,16,24).join(),/non-zero area/);
});
test('linked animations include real frame pixels, timing and clip ranges',()=>{
  const a=asset('tree','Tree');a.metadata={animationId:'wind'};
  const doc=build({assets:[a],animations:[{id:'wind',name:'Wind',w:1,h:1,frames:[{id:'f',px:['#abcdef'],dur:160}],tags:[{name:'Sway',start:1,end:1,mode:'Ping Pong'}]}]});
  assert.equal(doc.animations[0].frames[0].durationMs,160);
  assert.deepEqual(doc.animations[0].frames[0].pixels,['#abcdef']);
  assert.equal(doc.animations[0].clips[0].mode,'Ping Pong');
});
test('invalid linked animation buffers and ranges prevent broken references from exporting',()=>{
  const a=asset('tree','Tree');a.metadata={animationId:'bad'};
  assert.throws(()=>build({assets:[a],animations:[{id:'bad',name:'Bad',w:2,h:2,frames:[{id:'f',px:[],dur:0}],tags:[{start:1,end:5}]}]}),/Invalid animation frames/);
});
test('disabled optional fields are omitted and do not validate inactive values',()=>{
  const a=asset('one','Blank asset');
  a.metadata={enabled:{category:false,collision:false,placement:false,tags:false,properties:false,terrain:false,animationId:false},collision:{mode:'invalid'},pivot:{x:100,y:100},properties:{invalid:{}},animationId:'missing'};
  const doc=build({assets:[a]});
  assert.deepEqual(Object.keys(doc.assets[0]),['id','name','rect']);
  assert.deepEqual(doc.animations,[]);
});
test('blank category and empty optional values are not exported; enabled values remain',()=>{
  const a=asset('one','Custom');
  a.metadata={category:'',enabled:{category:true,tags:true,properties:true,animationId:true},tags:[],properties:{},animationId:null};
  assert.deepEqual(Object.keys(build({assets:[a]}).assets[0]),['id','name','rect']);
  a.metadata.category='Potion ingredient';a.metadata.properties={rarity:'rare'};
  const entry=build({assets:[a]}).assets[0];
  assert.equal(entry.category,'Potion ingredient');assert.equal(entry.properties.rarity,'rare');
});
test('array and comma-separated tags are preserved in migrated v2 metadata',()=>{
  const {tags}=require('../metadata-model.js');
  assert.deepEqual(tags([' forest ','tree','tree',null]),['forest','tree']);
  assert.deepEqual(tags('forest, tree, forest'),['forest','tree']);
  const a=asset('tree','Tree');a.tags=['forest','tree'];
  assert.deepEqual(build({assets:[a]}).assets[0].tags,['forest','tree']);
  a.metadata={tags:'forest, tree'};
  assert.deepEqual(metadata(a).tags,['forest','tree']);
});


test('generic terrain roles preserve weights, layers, corner labels and grouped pattern cells',()=>{
 const tiles=Array.from({length:4},(_,i)=>({id:'q'+i,name:'Meadow',rect:{x:i*16,y:0,w:16,h:16},metadata:{category:'terrain',terrain:{family:'grass',role:'base',corners:[],weight:3,pattern:{id:'meadow',columns:2,rows:2,column:i%2,row:Math.floor(i/2)}}}}));
 const doc=build({type:'tileset',image:'terrain.png',width:64,height:16,assets:tiles});assert.equal(doc.type,'tileset');assert.deepEqual(doc.assets[3].terrain.pattern,{id:'meadow',columns:2,rows:2,column:1,row:1});
 assert.throws(()=>build({type:'tileset',assets:tiles.slice(1)}),/Incomplete terrain pattern/);
 const dup=JSON.parse(JSON.stringify(tiles));dup[3].metadata.terrain.pattern.row=0;assert.throws(()=>build({type:'tileset',assets:dup}),/duplicate terrain pattern/);
 const mismatch=JSON.parse(JSON.stringify(tiles));mismatch[3].metadata.terrain.weight=9;assert.throws(()=>build({type:'tileset',assets:mismatch}),/Inconsistent/);
 for(const terrain of [{family:'grass',role:'overlay',corners:[],weight:2,layer:4},{family:'grass',role:'transition',corners:['grass','dirt','dirt','grass'],weight:1}]){
  const a=asset('tile','Terrain');a.metadata={category:'terrain',terrain};const d=build({type:'tileset',assets:[a]});assert.deepEqual(d.assets[0].terrain,terrain);
 }
});
test('invalid terrain role and variation data are blocked while disabled terrain stays optional',()=>{
 for(const patch of [{role:'paint'},{weight:-1},{weight:Infinity},{layer:.5},{role:'transition',corners:[]},{pattern:{id:'p',columns:2,rows:2,column:2,row:0}}]){
  const m=metadata({metadata:{category:'terrain',terrain:{family:'grass',role:'base',corners:[],...patch}}});assert.ok(validate(m,16,16).length);m.enabled.terrain=false;assert.deepEqual(validate(m,16,16),[]);
 }
});

test('art exports omit legacy geometry even when the old project geometry is invalid',()=>{
 const a=asset('art','Art');a.collision=true;a.metadata={pivot:{x:99,y:-1},collision:{mode:'solid',shape:{type:'polygon',points:[]}},enabled:{placement:true,collision:true}};
 const d=build({type:'atlas',assets:[a]});assert.equal('collision' in d.assets[0],false);assert.equal('pivot' in d.assets[0],false);assert.deepEqual(d.coordinates,{rectangles:'pixels; top-left origin'});
});
