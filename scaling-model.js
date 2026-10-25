(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.PixelStudioScaling=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function scale(pixels,w,h,nw,nh){
    if(![w,h,nw,nh].every(n=>Number.isInteger(n)&&n>=1&&n<=256))throw new Error('Scaled dimensions must be between 1 and 256 pixels.');
    if(pixels.length!==w*h)throw new Error('Pixel buffer does not match its dimensions.');
    return Array.from({length:nw*nh},(_,i)=>pixels[Math.min(h-1,Math.floor((Math.floor(i/nw)+.5)*h/nh))*w+Math.min(w-1,Math.floor(((i%nw)+.5)*w/nw))]);
  }
  function asset(item,w,h,nw,nh){
    const out={...item,px:scale(item.px,w,h,nw,nh)};
    if(item.metadata){
      const m=JSON.parse(JSON.stringify(item.metadata)),sx=nw/w,sy=nh/h;
      const point=p=>({x:p.x*sx,y:p.y*sy});
      if(m.groundAnchor)m.groundAnchor=point(m.groundAnchor);
      const shape=m.collision?.shape;
      if(shape?.type==='rectangle')m.collision.shape={...shape,...point(shape),w:shape.w*sx,h:shape.h*sy};
      if(shape?.type==='polygon')m.collision.shape={...shape,points:shape.points.map(point)};
      out.metadata=m;
    }
    return out;
  }
  function hueColour(colour,degrees){
    if(colour==null||degrees%360===0)return colour;
    const match=/^#([a-f\d]{3}|[a-f\d]{6}|[a-f\d]{8})$/i.exec(colour);
    if(!match)throw new Error('Unsupported pixel colour: '+colour);
    let hex=match[1];if(hex.length===3)hex=hex.split('').map(c=>c+c).join('');
    const alpha=hex.length===8?hex.slice(6):'';
    const rgb=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)/255);
    const max=Math.max(...rgb),min=Math.min(...rgb),chroma=max-min;
    if(chroma===0)return colour;
    let hue=max===rgb[0]?((rgb[1]-rgb[2])/chroma)%6:max===rgb[1]?(rgb[2]-rgb[0])/chroma+2:(rgb[0]-rgb[1])/chroma+4;
    hue=((hue*60+degrees)%360+360)%360/60;
    const x=chroma*(1-Math.abs(hue%2-1));
    const channels=hue<1?[chroma,x,0]:hue<2?[x,chroma,0]:hue<3?[0,chroma,x]:hue<4?[0,x,chroma]:hue<5?[x,0,chroma]:[chroma,0,x];
    return '#'+channels.map(v=>Math.round((v+min)*255).toString(16).padStart(2,'0')).join('')+alpha;
  }
  function huePixels(pixels,degrees){
    if(!Number.isFinite(degrees))throw new Error('Hue must be a finite number of degrees.');
    const colours=new Map();
    return pixels.map(c=>{if(!colours.has(c))colours.set(c,hueColour(c,degrees));return colours.get(c);});
  }
  function modifyPixels(pixels,{hue=0,saturation=100,contrast=0}={}){
    if(![hue,saturation,contrast].every(Number.isFinite)||saturation<0||saturation>200||contrast< -100||contrast>100)throw new Error('Invalid colour adjustment.');
    const colours=new Map();
    return pixels.map(colour=>{
      if(colour==null)return colour;
      if(colours.has(colour))return colours.get(colour);
      if(hue%360===0&&saturation===100&&contrast===0)return colour;
      let value=hueColour(colour,hue).slice(1);
      if(value.length===3)value=value.split('').map(c=>c+c).join('');
      if(!/^[a-f\d]{6}([a-f\d]{2})?$/i.test(value))throw new Error('Unsupported pixel colour: '+colour);
      const rgb=[0,2,4].map(i=>parseInt(value.slice(i,i+2),16)/255);
      const light=(Math.max(...rgb)+Math.min(...rgb))/2;
      const gain=(100+contrast)/100;
      const out='#'+rgb.map(c=>{
        const saturated=Math.max(0,Math.min(1,light+(c-light)*saturation/100));
        return Math.round(Math.max(0,Math.min(1,(saturated-.5)*gain+.5))*255).toString(16).padStart(2,'0');
      }).join('')+value.slice(6);
      colours.set(colour,out);return out;
    });
  }
  return {scale,asset,hueColour,huePixels,modifyPixels};
});
