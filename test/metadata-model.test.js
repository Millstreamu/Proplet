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
