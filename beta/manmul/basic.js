'use strict';
// Executable base attacks for v5 normal, magic and rare units.
// The caller supplies range-filtered targets, defensive damage calculation and visuals.
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./combat.js'));else root.ManmulBasic=factory(root.ManmulCombat)})(globalThis,function(combat){
 function attack(unit,target,definition,world,now){
  if(!unit||!target||!definition||typeof world.damage!=='function')return false;
  const amount=unit.attack,type=unit.damage_type,event={now,power:amount,damageType:type,tags:definition.element?[definition.element]:[],duration:4*(unit.effectDurationFactor||1)+(unit.effectDurationBonus||0),reactionBonus:definition.reactionBonus};
  const hasMark=Object.values(target.manmulMarks||{}).some(until=>until>now);
  const bonus=(definition.bonusMark&&(target.manmulMarks?.[definition.bonusMark]||0)>now)||(definition.bonusAnyMark&&hasMark)?1+definition.bonus:1;
  const streak=definition.streakBonus?Math.min(definition.streakCap,Math.max(0,(unit.basicStreak||1)-1)*definition.streakBonus):0,armor=definition.armorThreshold&&(world.defense?world.defense(target,'물리'):(target.armor||0))>=definition.armorThreshold?definition.armorBonus:0;
  const primary=(definition.kind==='double'?amount*definition.factor:amount)*bonus*(definition.baseFactor||1)*(1+streak+armor);
  const pierced=definition.kind==='pierce'&&world.behind?world.behind(unit,target,definition.count||1):[],beam=definition.element==='광선'&&!definition.mark?combat.prepareBeam([target,...pierced],event,world):null;
  world.damage(target,primary*(beam?beam.beamMultiplier:1),type,{source:unit,secondary:false,basic:true,armorIgnore:definition.armorIgnore||0,element:definition.element,area:['multi','splash'].includes(definition.kind)});
  if(definition.kind==='double')world.damage(target,primary,type,{source:unit,secondary:false});
  if(definition.mark)combat.mark(target,definition.mark,event,world);else if(!beam||beam.target!==target)combat.resolveHit(target,beam?{...event,tags:[]}:event,world);
  for(const other of pierced){world.damage(other,amount*definition.factor*(beam?beam.beamMultiplier:1),type,{source:unit,secondary:!definition.markPierced&&!beam,element:definition.element});if(definition.markPierced&&definition.mark)combat.mark(other,definition.mark,event,world);else if(beam&&beam.target!==other)combat.resolveHit(other,{...event,tags:[]},world)}
  if(definition.kind==='multi'&&world.nearby)for(const other of world.nearby(target,(definition.count||1)-1)){world.damage(other,amount*definition.factor,type,{source:unit,secondary:!definition.markMulti,area:true});if(definition.markMulti&&definition.mark)combat.mark(other,definition.mark,event,world)}
  if(definition.kind==='path'&&world.targets)for(const other of world.targets(unit,{select:'progress',shape:'target',limit:definition.count,global:true,now}).filter(e=>e!==target).slice(0,(definition.count||1)-1))world.damage(other,amount*definition.factor,type,{source:unit,secondary:true});
  if(definition.kind==='chain'&&world.nearby){let other=world.nearby(target,1).find(e=>e!==target);if(other){world.damage(other,amount*definition.factor,type,{source:unit,secondary:!definition.chainElement,element:definition.chainElement?definition.element:undefined});if(definition.chainElement)combat.resolveHit(other,event,world)}}
  if(definition.kind==='splash'&&world.nearby)for(const other of world.nearby(target,3).filter(e=>e!==target).slice(0,3)){world.damage(other,amount*definition.factor,type,{source:unit,secondary:!definition.markSplash,area:true});if(definition.markSplash&&definition.mark)combat.mark(other,definition.mark,event,world)}
  if(definition.kind==='slow'&&world.slow)world.slow(target,definition.amount,definition.duration,unit);
  if(definition.kind==='areaSlow'&&world.slow)for(const other of [target,...world.nearby(target,(definition.count||1)-1)]){world.slow(other,definition.amount,definition.duration,unit);if(other!==target&&definition.markAreaSlow&&definition.mark)combat.mark(other,definition.mark,event,world)}
  if(definition.kind==='root'){if(target.kind==='boss'||target.kind==='miniboss'){if(world.bossControl)world.bossControl(target)}else if(world.control)world.control(target,definition.duration)}
  if(definition.kind==='dot'&&world.dot)for(const other of definition.dotAllInRange&&world.targets?world.targets(unit,{select:'progress',shape:'target',limit:null,now}):definition.dotArea?[target,...world.nearby(target,Infinity)]:[target]){world.dot(other,amount*definition.factor,definition.duration,type,unit,definition.dotType);if(other!==target&&definition.mark)combat.mark(other,definition.mark,event,world)}
  if(definition.markedShred&&hasMark&&world.applyDebuff)world.applyDebuff(target,{stat:'armor',amount:definition.markedShred.amount,duration:definition.markedShred.duration,source:unit.id});
  if(definition.kind==='vulnerability'&&world.vulnerability)world.vulnerability(target,definition.amount,definition.duration,unit.id);
  if(definition.kind==='rotation')unit.basicAttackCount=(unit.basicAttackCount||0)+1;
  if(definition.kind==='everyHits'){unit.basicAttackCount=(unit.basicAttackCount||0)+1;if(unit.basicAttackCount%definition.every===0){let extra=definition.bonusSelect&&world.targets?world.targets(unit,{select:definition.bonusSelect,shape:'target',limit:1,now})[0]:target;if(extra&&definition.areaCount&&world.nearby){for(const enemy of [extra,...world.nearby(extra,definition.areaCount-1)]){world.damage(enemy,amount*definition.factor,type,{source:unit,secondary:false,area:true,element:definition.pulseElement});if(definition.pulseElement)combat.resolveHit(enemy,{now,power:amount,damageType:type,tags:[definition.pulseElement]},world)}}else if(extra)for(let i=0;i<(definition.shots||1);i++){world.damage(extra,amount*definition.factor,type,{source:unit,secondary:!definition.extraElement,element:definition.extraElement});if(definition.extraElement)combat.resolveHit(extra,{...event,tags:[definition.extraElement]},world)}if(extra&&definition.pierce&&world.behind)for(const other of world.behind(unit,extra,definition.pierce))world.damage(other,amount*definition.factor,type,{source:unit,secondary:true})}}
  periodic(unit,target,definition,world,now);return true;
 }
 function periodic(unit,target,definition,world,now){
  if(!unit||!target||!definition||!world||!Number.isFinite(now)||now<(unit.periodicBonusAt||0))return false;
  const amount=unit.attack,type=unit.damage_type;
  if(definition.kind==='periodic_bonus'&&now>=(unit.periodicBonusAt||0)){let bonusTarget=definition.bonusSelect&&world.targets?world.targets(unit,{select:definition.bonusSelect,shape:'target',limit:1,now})[0]:target;if(bonusTarget)world.damage(bonusTarget,amount*definition.factor,type,{source:unit,secondary:true,element:definition.bonusElement});unit.periodicBonusAt=now+definition.interval}
  if(definition.kind==='periodic_area'&&now>=(unit.periodicBonusAt||0)){let targets=definition.shape==='cone'&&world.targets?world.targets(unit,{select:'progress',shape:'cone',anchor:target,limit:definition.count,now}):[target,...world.nearby(target,(definition.count||1)-1)];for(const other of targets)world.damage(other,amount*definition.factor,type,{source:unit,secondary:true,area:true});unit.periodicBonusAt=now+definition.interval}
  if(definition.kind==='periodicShots'&&now>=(unit.periodicBonusAt||0)){for(let i=0;i<definition.shots;i++)world.damage(target,amount*definition.factor,type,{source:unit,secondary:true});unit.periodicBonusAt=now+definition.interval}
  return ['periodic_bonus','periodic_area','periodicShots'].includes(definition.kind);
 }
 function speedAura(definition){return definition.kind==='speed_aura'?{amount:definition.amount,radius:definition.radius*45}:null}
 return {attack,periodic,speedAura};
});
