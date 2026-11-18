'use strict';
// Optional innate target priorities from the v5 unit specifications.
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ManmulTargetRules=factory()})(globalThis,function(){
 const modes={E030:'progress',E037:'progress',E043:'far',E049:'rotate3',U012:'marked',U014:'rotate',U016:'progress',L007:'progress',L011:'progress',L012:'adaptive',L020:'progress'};
 function compare(unit,a,b,point,now){const mode=modes[unit.type];if(!mode)return 0;
  if(mode==='progress')return b.d-a.d||a.id-b.id;
  if(mode==='far'){let x=point(a.d),y=point(b.d);return Math.hypot(y.x-unit.x,y.y-unit.y)-Math.hypot(x.x-unit.x,x.y-unit.y)||b.d-a.d||a.id-b.id}
  if(mode==='marked'){let marked=e=>Object.values(e.manmulMarks||{}).some(t=>t>now);return Number(marked(b))-Number(marked(a))||b.d-a.d||a.id-b.id}
  if(mode==='rotate3'){let last=unit.lastBasicTargetId;if(last!==undefined&&unit.basicAttackCount%3!==0)return Number(b.id===last)-Number(a.id===last)||a.id-b.id;return Number(a.id<=last)-Number(b.id<=last)||a.id-b.id}
  if(mode==='rotate'){let last=unit.lastBasicTargetId??-Infinity;return Number(a.id<=last)-Number(b.id<=last)||a.id-b.id}
  if(mode==='adaptive'){let boss=e=>e.kind==='boss'||e.kind==='miniboss';return Number(boss(b))-Number(boss(a))||b.d-a.d||a.id-b.id}
  return 0;
 }
 return {modes,compare};
});
