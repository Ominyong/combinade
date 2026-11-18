'use strict';
// Periodic paradox passives. Intervals, amounts and target counts follow the v5 text;
// values absent from the text are conservative test assumptions documented in audit.
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ManmulPassives=factory()})(globalThis,function(){
 const interval={U002:5,U017:5,L004:7,H002:20,H003:8,H005:6,H006:1.22,H008:20,H010:10,H011:12,H012:8,H015:4,H016:6,H019:5};
 function tick(actor,now,world){
  const period=interval[actor.id],unit=actor.liveUnit;if(!period||!unit)return false;
  if(unit.passiveReadyAt===undefined){unit.passiveReadyAt=now+period;return false}
  if(now<unit.passiveReadyAt)return false;
  let targets=world.targets(actor,{select:['H016','H019'].includes(actor.id)?'cluster':'progress',shape:actor.id==='H019'?'area':'target',limit:actor.id==='H015'?2:actor.id==='H019'||actor.id==='H006'?3:1,global:actor.id==='H006',now}),success=false,power=actor.skill_power??actor.attack;
  switch(actor.id){
   case 'U002':case 'L004':if(targets.length)success=world.summon(actor,{summon:actor.id==='U002'?'turret':'aircraft',count:actor.id==='U002'?1:2,max:4,duration:3,factor:.25},now)>0;break;
   case 'H002':success=world.copySkill(actor,.5,now,{includeLegendary:true});break;
   case 'H003':{let ally=world.allies(actor,{excludeSelf:true}).find(world.canBasic);if(targets.length&&ally){world.applyBuff(ally,{stat:'nextBasicFlat',amount:power*.35,duration:4,source:actor.id,damageType:actor.damage_type});success=true}break}
   case 'H005':if(targets.length){for(const e of [targets[0],...world.nearby(targets[0],3)])world.slow(e,.2,2,actor);success=true}break;
   case 'H006':for(const e of targets)world.damage(e,power,actor.damage_type,{source:actor,secondary:true});success=!!targets.length;break;
   case 'H008':success=world.reviveSummon(actor,now,true)>0;break;
   case 'H010':if(targets.length)success=world.summon(actor,{summon:'decoy',count:1,max:1,duration:3,factor:0,position:world.point(targets[0].d)},now)>0;break;
   case 'H011':{let ally=world.allies(actor,{excludeSelf:true}).find(u=>u.skillReadyAt>now);if(ally){world.reduceCooldown(ally,1,now);success=true}break}
   case 'H012':if(targets.length){world.damage(targets[0],power*1.2,actor.damage_type,{source:actor,secondary:true});success=true}break;
   case 'H015':for(const e of targets)world.damage(e,power*.75,actor.damage_type,{source:actor,secondary:true});success=!!targets.length;break;
   case 'U017':case 'H016':if(targets.length)success=world.placeMines(actor,targets[0],{count:1,factor:.5,limit:3,duration:8},now)>0;break;
   case 'H019':for(const e of targets)e.manmulNetUntil=now+4;success=!!targets.length;break;
  }
  if(success)unit.passiveReadyAt=now+period;return success;
 }
 return {tick,interval};
});
