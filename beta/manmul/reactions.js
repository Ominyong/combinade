'use strict';
// Isolated v5 reaction engine. Callers explicitly identify reaction triggers and supply combat callbacks.
// Damage from this engine is flagged secondary and must never be submitted as a new trigger.
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ManmulReactions=factory()})(globalThis,function(){
 const MARKS=new Set(['젖음','열기','냉기','균열','포자','표적']);
 const DURATIONS={'감전':1.5,'증기폭발':2,'급랭':2.5,'파쇄':2,'개화':2.5,'포자연소':2,'집광':2.5,'정밀타격':2,'다중반응':3,'일식공명':3,'극광':3,'중력렌즈':4,'반사':4};
 function addMark(target,mark,now,duration=4,source=null){if(!MARKS.has(mark)||!Number.isFinite(now)||duration<=0)return false;if(source)(target.manmulMarkSource=target.manmulMarkSource||{})[mark]=source;target.manmulMarks=target.manmulMarks||{};target.manmulMarkStarted=target.manmulMarkStarted||{};if(!(target.manmulMarks[mark]>now))target.manmulMarkStarted[mark]=now;target.manmulMarks[mark]=now+duration;return true}
 function has(target,mark,now){return (target.manmulMarks?.[mark]||0)>now}
 function consume(target,mark){if(target.manmulMarks)delete target.manmulMarks[mark];if(target.manmulMarkStarted)delete target.manmulMarkStarted[mark]}
 function validTrigger(name,target,ctx){const h=mark=>has(target,mark,ctx.now),t=ctx.tags||[];switch(name){case '감전':return h('젖음')&&t.includes('번개');case '증기폭발':return h('젖음')&&h('열기');case '급랭':return h('젖음')&&h('냉기');case '파쇄':return h('균열')&&t.includes('충격');case '개화':return h('포자')&&h('젖음');case '포자연소':return h('포자')&&h('열기');case '집광':return h('표적')&&t.includes('광선');case '정밀타격':return h('표적')&&t.includes('정밀');case '다중반응':return t.includes('연구소')&&[...MARKS].filter(h).length>=2;case '일식공명':return h('열기')&&h('냉기')&&t.includes('일식');case '극광':return h('젖음')&&h('냉기')&&t.includes('오로라');case '중력렌즈':return h('표적')&&t.includes('천체');case '반사':return h('표적')&&t.includes('거울')&&ctx.previousBasicDamage>0;default:return false}}
 function react(name,target,ctx){
  if(ctx.secondary||!DURATIONS[name]||!target||!Number.isFinite(ctx.now)||!Number.isFinite(ctx.power)||ctx.power<0||typeof ctx.damage!=='function'||typeof ctx.nearby!=='function')return false;
  let cooldowns=target.manmulReactionCooldowns||(target.manmulReactionCooldowns={});if((cooldowns[name]??-Infinity)>ctx.now||!validTrigger(name,target,ctx))return false;
  cooldowns[name]=ctx.now+DURATIONS[name];const near=n=>ctx.nearby(target,n).filter(e=>e!==target).slice(0,n),hit=(enemy,factor,type)=>ctx.damage(enemy,ctx.power*factor,type,{secondary:true,reaction:name});
  switch(name){
   case '감전':hit(target,.9,'마법');near(2).forEach(e=>hit(e,.9,'마법'));consume(target,'젖음');break;
   case '증기폭발':hit(target,1,'마법');near(3).forEach(e=>hit(e,1,'마법'));consume(target,'젖음');consume(target,'열기');break;
   case '급랭':hit(target,1.4,'마법');if(ctx.control)ctx.control(target,.4,{bossAlternative:true});addMark(target,'냉기',ctx.now);break;
   case '파쇄':hit(target,1.65,'물리');near(2).forEach(e=>hit(e,.7,'물리'));consume(target,'균열');break;
   case '개화':near(4).forEach(e=>hit(e,1,'마법'));consume(target,'포자');consume(target,'젖음');break;
   case '포자연소':hit(target,1.15,'마법');near(3).forEach(e=>hit(e,1.15,'마법'));consume(target,'포자');break;
   case '집광':if(ctx.boostBeam)ctx.boostBeam(.25);{let other=ctx.nearby(target,Infinity).find(e=>e!==target&&has(e,'표적',ctx.now));if(other)hit(other,.6,'마법')}break;
   case '정밀타격':hit(target,1.3*(target.hp/target.max<=.25?1.5:1),ctx.damageType||'물리');break;
   case '다중반응':hit(target,1.3,'마법');break;
   case '일식공명':hit(target,1.6,'마법');break;
   case '극광':hit(target,1.5,'마법');addMark(target,'냉기',ctx.now);break;
   case '중력렌즈':target.manmulVulnerability={amount:.08,until:ctx.now+3,startedAt:target.manmulVulnerability?.until>ctx.now?target.manmulVulnerability.startedAt:ctx.now};break;
   case '반사':ctx.damage(target,ctx.previousBasicDamage*.45,ctx.previousBasicType||'물리',{secondary:true,finalDamage:true,reaction:name});break;
  }return true;
 }
 // Marks each reaction uses; their placers share the reaction's damage as support.
 const REACTION_MARKS={'감전':['젖음'],'증기폭발':['젖음','열기'],'급랭':['젖음','냉기'],'파쇄':['균열'],'개화':['포자','젖음'],'포자연소':['포자','열기'],'집광':['표적'],'정밀타격':['표적'],'다중반응':[...MARKS],'일식공명':['열기','냉기'],'극광':['젖음','냉기'],'반사':['표적']};
 return {MARKS,DURATIONS,REACTION_MARKS,addMark,has,react};
});
