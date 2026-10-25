const test=require('node:test');const assert=require('node:assert/strict');const {scale,asset}=require('../scaling-model.js');
test('nearest-neighbour scaling preserves colours and transparency',()=>{
 assert.deepEqual(scale(['a',null,'b','c'],2,2,4,4),['a','a',null,null,'a','a',null,null,'b','b','c','c','b','b','c','c']);
 assert.deepEqual(scale(['a','b','c','d'],2,2,1,1),['d']);
 assert.throws(()=>scale(['a'],1,1,257,257));
});
test('local geometry scales without changing normalized pivots or tile footprints',()=>{
 const source={px:['a'],metadata:{pivot:{x:.5,y:1},footprint:{w:1,h:1},groundAnchor:{x:1,y:1},collision:{shape:{type:'rectangle',x:0,y:0,w:1,h:1}}}};
 const out=asset(source,1,1,2,3);
 assert.deepEqual(out.metadata.groundAnchor,{x:2,y:3});assert.equal(out.metadata.collision.shape.h,3);
 assert.deepEqual(out.metadata.pivot,source.metadata.pivot);assert.equal(source.metadata.collision.shape.h,1);
});
test('downscaling samples pixel centres on non-square art without introducing colours',()=>{
 assert.deepEqual(scale(['a','b','c','d','e','f','g','h'],4,2,2,1),['f','h']);
 assert.deepEqual(scale(['a',null,'b',null],4,1,2,1),[null,null]);
});
test('hue rotation changes the palette while keeping shading, greys and transparency',()=>{
 const {huePixels}=require('../scaling-model.js');
 assert.deepEqual(huePixels(['#ff0000','#800000','#808080',null,'#ff000080'],120),['#00ff00','#008000','#808080',null,'#00ff0080']);
 assert.deepEqual(huePixels(['#ff0000'], -120),['#0000ff']);
 assert.deepEqual(huePixels(['#f00',null],360),['#f00',null]);
 assert.throws(()=>huePixels(['#ff0000'],NaN));
});
