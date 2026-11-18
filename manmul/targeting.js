'use strict';
// Spatial target selection for the v5 combat adapter. Coordinates are game-world pixels.
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ManmulTargeting=factory()})(globalThis,function(){
 function select(actor,enemies,options,point,random=Math.random){
  if(typeof point!=='function'||!Array.isArray(enemies))return [];
  const range=options.global?Infinity:(actor.range_world??actor.range??0),radius=options.radius??90;
  let candidates=enemies.filter(e=>e&&e.hp>0&&(!options.requiresMark||(e.manmulMarks?.[options.requiresMark]||0)>options.now)).map(e=>({e,p:point(e.d)})).filter(v=>Math.hypot(v.p.x-actor.x,v.p.y-actor.y)<=range);
  let order=options.select||'progress';
  if(order==='high')candidates.sort((a,b)=>b.e.hp-a.e.hp||b.e.d-a.e.d);
  else if(order==='low')candidates.sort((a,b)=>a.e.hp-b.e.hp||b.e.d-a.e.d);
  else if(order==='nearest')candidates.sort((a,b)=>Math.hypot(a.p.x-actor.x,a.p.y-actor.y)-Math.hypot(b.p.x-actor.x,b.p.y-actor.y));
  else if(order==='random'){for(let i=candidates.length-1;i>0;i--){let j=Math.floor(random()*(i+1));[candidates[i],candidates[j]]=[candidates[j],candidates[i]]}}
  else if(order==='cluster')candidates.sort((a,b)=>{let count=c=>candidates.filter(v=>Math.hypot(v.p.x-c.p.x,v.p.y-c.p.y)<=radius).length;return count(b)-count(a)||b.e.d-a.e.d});
  else candidates.sort((a,b)=>b.e.d-a.e.d);
  if(!candidates.length)return [];
  let anchor=options.anchor?{e:options.anchor,p:point(options.anchor.d)}:candidates[0],shape=options.shape||'target';
  if(shape==='area')candidates=candidates.filter(v=>Math.hypot(v.p.x-anchor.p.x,v.p.y-anchor.p.y)<=radius);
  else if(shape==='line'||shape==='cone'){
   let dx=anchor.p.x-actor.x,dy=anchor.p.y-actor.y,length=Math.hypot(dx,dy)||1,ux=dx/length,uy=dy/length;
   candidates=candidates.filter(v=>{let x=v.p.x-actor.x,y=v.p.y-actor.y,along=x*ux+y*uy,across=Math.abs(x*uy-y*ux);return along>=0&&(shape==='line'?across<=20:across<=along)})
  }else if(shape==='chain'){
   let sequence=[anchor],left=candidates.filter(v=>v!==anchor);while(left.length){let last=sequence[sequence.length-1],near=left.map(v=>({v,d:Math.hypot(v.p.x-last.p.x,v.p.y-last.p.y)})).filter(x=>x.d<=135).sort((a,b)=>a.d-b.d)[0];if(!near)break;sequence.push(near.v);left=left.filter(v=>v!==near.v)}candidates=sequence;
  }
  if(options.anchor){let at=candidates.findIndex(v=>v.e===options.anchor);if(at>0)candidates.unshift(candidates.splice(at,1)[0])}
  return candidates.map(v=>v.e).slice(0,options.limit??candidates.length);
 }
 return {select};
});
