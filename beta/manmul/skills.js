'use strict';
// Deterministic execution for manually specified v5 active abilities.
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./combat.js'),require('./reactions.js'),require('./skill-data.js'));else root.ManmulSkills=factory(root.ManmulCombat,root.ManmulReactions,root.ManmulSkillData)})(globalThis,function(combat,reactions,definitions){
 const UNMARKED_FACTOR=.6;
 function isDamageSkill(def){return !!def&&['attack','dot','recordedDamage','scatter','mixed','clusterShots','clusterAreas','highAndNearby','bossSplash','mines','differentAreas','summon'].includes(def.kind)}
 function cast(actor,now,world){
  let def=definitions[actor.id];if(!def||!Number.isFinite(now)||now<(actor.skillReadyAt||0)||typeof world.targets!=='function')return false;
  let power=actor.skill_power??actor.attack,durationBonus=actor.effectDurationBonus||0,durationFactor=actor.effectDurationFactor||1;if(!Number.isFinite(power)||power<=0)return false;
  let candidates=world.targets(actor,{select:def.select,shape:def.shape||'target',radius:def.radius,limit:null,requiresMark:def.requiresMark,global:def.global||actor.grade==='재앙',now});
  if(!Array.isArray(candidates))return false;
  // Mark-hunting skills (e.g. 유성 needs 균열) still fire when nobody carries the mark: they hit unmarked enemies at reduced power.
  if(def.requiresMark&&!candidates.some(e=>e&&e.hp>0)){candidates=world.targets(actor,{select:def.select,shape:def.shape||'target',radius:def.radius,limit:null,global:def.global||actor.grade==='재앙',now});if(!Array.isArray(candidates))return false;def={...def,requiresMark:null,factor:(def.factor||0)*UNMARKED_FACTOR}}
  if(def.kind==='copySkill'||def.kind==='reviveSummon'){
   if(!candidates.some(e=>e&&e.hp>0))return false;
   let success=def.kind==='copySkill'?typeof world.copySkill==='function'&&world.copySkill(actor,def.factor,now):typeof world.reviveSummon==='function'&&world.reviveSummon(actor,now)>0;
   if(success)actor.skillReadyAt=now+actor.skill_cooldown_seconds;return !!success;
  }
  if(['clusterShots','clusterAreas','highAndNearby'].includes(def.kind)){
   let remaining=candidates.filter(e=>e&&e.hp>0),groups=[];if(!remaining.length||typeof world.nearby!=='function')return false;
   if(def.kind==='highAndNearby'){
    let main=remaining.slice(0,def.limit),seen=new Set(main),extra=[];for(const enemy of main)for(const other of world.nearby(enemy,def.extra)){if(!seen.has(other)&&other.hp>0&&extra.length<def.extra){seen.add(other);extra.push(other)}}groups=[...main,...extra].map(e=>[e]);
   }else for(let i=0;i<def.groups&&remaining.length;i++){let anchor=remaining[0],near=new Set([anchor,...world.nearby(anchor,remaining.length)]),group=remaining.filter(e=>near.has(e));groups.push(group);remaining=remaining.filter(e=>!near.has(e))}
   let hit=(target,beam=null)=>{if(target.hp<=0)return;let event={now,power,damageType:actor.damage_type,tags:def.element?[def.element]:[]};world.damage(target,power*def.factor*(beam?beam.beamMultiplier:1),actor.damage_type,{source:actor,secondary:false,element:def.element,area:def.kind==='clusterAreas'});if(!beam||beam.target!==target)combat.resolveHit(target,beam?{...event,tags:[]}:event,world)};
   if(def.kind==='clusterShots')for(const group of groups)for(let i=0;i<def.shots;i++){let live=group.filter(e=>e.hp>0);if(live.length)hit(live[i%live.length])}
   else {let left=def.kind==='highAndNearby'?def.limit+def.extra:def.limit;for(const group of groups){let chosen=group.slice(0,left);left-=chosen.length;let beam=def.element==='광선'?combat.prepareBeam(chosen,{now,power,damageType:actor.damage_type,tags:['광선']},world):null;for(const enemy of chosen)hit(enemy,beam);if(left<=0)break}}
   actor.skillReadyAt=now+actor.skill_cooldown_seconds;return true;
  }
  if(def.kind==='bossSplash'){
   const target=candidates.find(e=>e.hp>0&&(e.kind==='boss'||e.kind==='miniboss'||e.kind==='elite'));if(!target||typeof world.nearby!=='function')return false;
   const event={now,power,damageType:actor.damage_type,tags:['광선']},pre=combat.resolveHit(target,event,world);world.damage(target,power*def.factor*pre.beamMultiplier,actor.damage_type,{source:actor,element:'광선'});for(const enemy of world.nearby(target,3))world.damage(enemy,power*def.splash,actor.damage_type,{source:actor,secondary:true});actor.skillReadyAt=now+actor.skill_cooldown_seconds;return true;
  }
  if(def.kind==='mines'){
   let anchor=candidates.find(e=>e&&e.hp>0);if(!anchor||typeof world.placeMines!=='function'||!world.placeMines(actor,anchor,def,now))return false;actor.skillReadyAt=now+actor.skill_cooldown_seconds;return true;
  }
  // Even support skills wait until at least one enemy is present, as in the design.
  if(def.kind==='buff'){
   if(!candidates.some(e=>e&&e.hp>0)||typeof world.applyBuff!=='function')return false;
   const allies=def.self?[actor]:typeof world.allies==='function'?world.allies(actor,{category:def.category,categories:def.categories,excludeGrades:def.excludeGrades}):[];
   if(!Array.isArray(allies)||!allies.length)return false;
   for(const ally of allies.slice(0,def.limit??allies.length)){world.applyBuff(ally,{stat:def.stat,amount:def.amount*(actor.copyScale??1),duration:def.duration*durationFactor+durationBonus,source:actor.id,count:def.count});if(def.also)world.applyBuff(ally,{...def.also,amount:def.also.amount*(actor.copyScale??1),duration:def.duration*durationFactor+durationBonus,source:actor.id})}
   actor.skillReadyAt=now+actor.skill_cooldown_seconds;return true;
  }
  if(['summon','summonCopy','copyBasic','cooldown'].includes(def.kind)){
   if(!candidates.some(e=>e&&e.hp>0))return false;
   let success=false;
   if(def.kind==='summon'&&typeof world.summon==='function')success=world.summon(actor,{...def,factor:def.factor*(actor.skillDamageMultiplier||1)},now)>0;
   else if(['summonCopy','copyBasic','cooldown'].includes(def.kind)&&typeof world.allies==='function'){
    const allies=world.allies(actor,{excludeSelf:true,excludeGrades:def.kind==='cooldown'?[]:['역설','재앙','천체','신수','레전더리']}).filter(unit=>def.kind!=='cooldown'||unit.skillReadyAt>now).slice(0,def.limit);
   if(def.kind==='cooldown'&&typeof world.reduceCooldown==='function'){for(const ally of allies)world.reduceCooldown(ally,def.amount*(actor.copyScale??1),now);success=allies.length>0}
    if(def.kind==='copyBasic'&&typeof world.applyBuff==='function'&&allies.length){world.applyBuff(allies[0],{stat:'copyBasic',amount:def.factor,duration:def.duration,source:actor.id});success=true}
    if(def.kind==='summonCopy'&&typeof world.summon==='function'&&allies.length)success=world.summon(actor,{...def,summon:'clone',count:1,max:1,prototype:allies[0]},now)>0;
   }
   if(success)actor.skillReadyAt=now+actor.skill_cooldown_seconds;return success;
  }
  const targets=candidates.filter(e=>e&&e.hp>0&&(!def.requiresMark||reactions.has(e,def.requiresMark,now))).slice(0,def.limit);if(!targets.length)return false;
  if(def.debuff&&typeof world.applyDebuff!=='function')return false;
  if((def.dot||def.kind==='dot')&&typeof world.dot!=='function')return false;
  if(def.kind==='weaken'){
   if(typeof world.applyDebuff!=='function')return false;
   for(const target of targets)world.applyDebuff(target,{stat:def.stat,amount:def.amount*(actor.copyScale??1),duration:def.duration*durationFactor+durationBonus,source:actor.id});
   actor.skillReadyAt=now+actor.skill_cooldown_seconds;return true;
  }
  if(def.kind==='mark'){
   for(const target of targets){combat.mark(target,def.mark,{now,power,damageType:actor.damage_type,duration:(def.duration??4)*durationFactor+durationBonus},world);if(def.debuff)world.applyDebuff(target,{...def.debuff,duration:def.debuff.duration*durationFactor+durationBonus,source:actor.id})}
   actor.skillReadyAt=now+actor.skill_cooldown_seconds;return true;
  }
  if(def.kind==='randomMark'){
   const mark=def.marks[Math.floor((world.random||Math.random)()*def.marks.length)];for(const target of targets)combat.mark(target,mark,{now,power,damageType:actor.damage_type,duration:4*durationFactor+durationBonus},world);
   actor.skillReadyAt=now+actor.skill_cooldown_seconds;return true;
  }
  if(def.kind==='experimentalMarks'){
   const marks=['젖음','열기','냉기','균열','포자','표적'];
   for(const target of targets){let first=Math.floor((world.random||Math.random)()*marks.length),second=(first+1+Math.floor((world.random||Math.random)()*(marks.length-1)))%marks.length;for(const mark of [marks[first],marks[second]])reactions.addMark(target,mark,now);combat.resolveHit(target,{now,power,damageType:actor.damage_type,tags:['연구소']},world)}
   actor.skillReadyAt=now+actor.skill_cooldown_seconds;return true;
  }
  if(def.kind==='dot'){
   for(const target of targets){world.dot(target,power*def.factor,def.duration,def.damageType||actor.damage_type,actor,def.dotType);if(def.reaction)combat.resolveHit(target,{now,power,damageType:def.damageType||actor.damage_type,tags:[],reactionOnly:def.reaction},world)}
   actor.skillReadyAt=now+actor.skill_cooldown_seconds;return true;
  }
  if(def.kind==='differentAreas'){
   if(typeof world.nearby!=='function')return false;
   const centers=Array.from({length:def.shots},(_,i)=>targets[i%targets.length]);for(const center of centers){for(const enemy of [center,...world.nearby(center,def.limit-1)].slice(0,def.limit)){if(enemy.hp<=0)continue;world.damage(enemy,power*def.factor,actor.damage_type,{source:actor,secondary:false,area:true,element:def.element});combat.resolveHit(enemy,{now,power,damageType:actor.damage_type,tags:[def.element]},world)}}
   actor.skillReadyAt=now+actor.skill_cooldown_seconds;return true;
  }
  if(def.kind==='recordedDamage'){
   if(typeof world.recentDamage!=='function')return false;
   for(const target of targets)world.damage(target,Math.min(world.recentDamage(target,def.window,now)*def.factor*(actor.skillDamageMultiplier||1),power*def.cap),'마법',{source:actor,secondary:true});
   actor.skillReadyAt=now+actor.skill_cooldown_seconds;return true;
  }
  if(def.kind==='scatter'){
   const count=def.distinct?Math.min(def.shots,targets.length):def.shots;
   let used=new Set();for(let i=0;i<count;i++){let live=targets.filter(target=>target.hp>0&&(!def.distinct||!used.has(target)));if(!live.length)break;let target=live[i%live.length],element=def.element,event={now,power,damageType:actor.damage_type,tags:element?[element]:[]};used.add(target);world.damage(target,power*def.factor,actor.damage_type,{source:actor,secondary:false,element});combat.resolveHit(target,event,world)}
   actor.skillReadyAt=now+actor.skill_cooldown_seconds;return true;
  }
  if(def.kind==='mixed'){
   for(const target of targets){for(const element of ['냉기','열기']){world.damage(target,power*def.factor,'마법',{source:actor,secondary:false,element});combat.resolveHit(target,{now,power,damageType:'마법',tags:[element]},world)}world.damage(target,power*def.bonus,'마법',{source:actor,secondary:true})}
   actor.skillReadyAt=now+actor.skill_cooldown_seconds;return true;
  }
  const damageType=def.damageType||actor.damage_type;
  const element=def.randomElements?def.randomElements[Math.floor((world.random||Math.random)()*def.randomElements.length)]:def.element;
  if(def.removeProtection&&typeof world.removeProtection!=='function')return false;
  const beam=element==='광선'&&!def.mark?combat.prepareBeam(targets,{now,power,damageType,tags:['광선'],duration:(def.markDuration??4)*durationFactor+durationBonus,reactionBonus:def.reactionBonus},world):null;
  for(const [index,target] of targets.entries()){let low=target.kind!=='boss'&&target.kind!=='miniboss'&&target.hp/target.max<=.3;if(def.removeProtection)world.removeProtection(target);for(let i=0;i<(def.hits||1)&&target.hp>0;i++){
   let event={now,power,damageType,tags:element?[element]:[],duration:(def.markDuration??4)*durationFactor+durationBonus,reactionBonus:def.reactionBonus};
   const factor=def.factor*Math.pow(1-(def.decay||0),index)*(def.bonusMark&&reactions.has(target,def.bonusMark,now)?1+def.bonus:1);
   if(def.mark&&def.markBeforeDamage)reactions.addMark(target,def.mark,now,event.duration);
   world.damage(target,power*factor*(beam?beam.beamMultiplier:1),damageType,{source:actor,secondary:false,trueDamage:!!def.trueDamage,armorIgnore:def.armorIgnore||0,element,area:['area','cone'].includes(def.shape)});
   if(def.mark&&!def.markBeforeDamage)combat.mark(target,def.mark,event,world);else if(!beam||beam.target!==target)combat.resolveHit(target,beam?{...event,tags:[]}:event,world);
  }if(index===0&&def.extraFirst)world.damage(target,power*def.extraFirst,damageType,{source:actor,secondary:true});if(low&&def.extraLowHealth)world.damage(target,power*def.extraLowHealth,damageType,{source:actor,secondary:true});if(def.extraNet&&(target.manmulNetUntil||0)>now)world.damage(target,power*def.extraNet,damageType,{source:actor,secondary:true});if(def.debuff)world.applyDebuff(target,{...def.debuff,duration:def.debuff.duration*durationFactor+durationBonus,source:actor.id});if(def.dot)world.dot(target,power*def.dot.factor,def.dot.duration,damageType,actor,def.dot.kind)}
  actor.skillReadyAt=now+actor.skill_cooldown_seconds;return true;
 }
 return {cast,definitions,isDamageSkill,UNMARKED_FACTOR};
});
