'use strict';
// v5 event dispatch: all damage calculations and rendering stay with the caller.
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./reactions.js'));else root.ManmulCombat=factory(root.ManmulReactions)})(globalThis,function(reactions){
 // Check the explicit multi-mark catalysts before generic reactions can consume marks.
 const reactionOrder=['다중반응','일식공명','극광','중력렌즈','감전','증기폭발','급랭','파쇄','개화','포자연소','집광','정밀타격','반사'];
 function resolveHit(target,event,world){
  if(!target||event.secondary)return {triggered:[],beamMultiplier:1};
  let sourcesAtHit={...(target.manmulMarkSource||{})},marksOf=name=>[...new Set((reactions.REACTION_MARKS?.[name]||[]).filter(m=>(target.manmulMarks?.[m]||0)>event.now).map(m=>sourcesAtHit[m]).filter(Boolean))];
  let beamMultiplier=1,triggered=[],ctx={now:event.now,power:event.power,damageType:event.damageType,tags:event.tags||[],previousBasicDamage:event.previousBasicDamage,previousBasicType:event.previousBasicType,
   nearby:world.nearby,damage:(enemy,amount,type,options={})=>world.damage(enemy,amount*(1+(event.reactionBonus?.[options.reaction]||0)),type,{...options,reactionSource:world.currentUnit,markSources:options.reaction?marksOf(options.reaction):null}),control:(enemy,time)=>{if(enemy.kind==='boss'||enemy.kind==='miniboss'){if(world.bossControl)world.bossControl(enemy);else if(world.slow)world.slow(enemy,.3,1)}else if(world.control)world.control(enemy,time)},boostBeam:amount=>{beamMultiplier+=amount}};
  for(const name of reactionOrder)if((!event.reactionOnly||event.reactionOnly===name)&&reactions.react(name,target,ctx))triggered.push(name);
  return {triggered,beamMultiplier};
 }
 function mark(target,name,event,world){if(event.secondary||!reactions.addMark(target,name,event.now,event.duration??4,world.currentUnit?.type))return {triggered:[],beamMultiplier:1};return resolveHit(target,event,world)}
 function prepareBeam(targets,event,world){let target=targets.find(e=>e&&e.hp>0&&reactions.has(e,'표적',event.now)&&(e.manmulReactionCooldowns?.['집광']??-Infinity)<=event.now);if(!target)return {target:null,beamMultiplier:1};return {target,...resolveHit(target,event,world)}}
 function vulnerability(target,now){return target.manmulVulnerability&&target.manmulVulnerability.until>now?target.manmulVulnerability.amount:0}
 return {resolveHit,mark,prepareBeam,vulnerability,reactionOrder};
});
