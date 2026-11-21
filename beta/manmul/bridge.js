'use strict';
// Wires the v5 arena callbacks to a live game state and the shared combat rules.
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./arena.js'),require('./effects.js'),require('./summons.js'));else root.ManmulBridge=factory(root.ManmulArena,root.ManmulEffects,root.ManmulSummons)})(globalThis,function(arena,effects,summonsModule){
 function create(state,basicDefinitions){
  const now=()=>state.time,summons=summonsModule.create();let instance;
  const hooks={type:id=>state.types[id],units:()=>state.units,enemies:()=>state.enemies,now,pathPoint:state.pathPoint,random:state.random||Math.random,onSkillEffect:state.onSkillEffect?(...args)=>state.onSkillEffect(...args):null,
   gradeLevel:(grade,u)=>state.gradeLevelFor?state.gradeLevelFor(grade,u):(state.gradeLevels?.[grade]||0),gradePower:grade=>state.gradePower?.[grade]??1,costPower:t=>state.costPower?state.costPower(t):1,progressBonus:u=>state.powerBonusFor&&u?state.powerBonusFor(u):(state.powerBonus||0),attackBonus:u=>Math.min(.4,effects.bonus(u,'attack',now(),.4)+effects.bonus(u,'damage',now(),.4)+(state.runAttackBonus?state.runAttackBonus(u):0)),skillBonus:(u,options={})=>effects.bonus(u,'skillDamage',now(),.4)+(options.excludeNextSkill?0:effects.bonus(u,'nextSkillDamage',now(),.4)),speedBonus:u=>effects.bonus(u,'speed',now(),.6)+(state.runSpeedBonusFor?state.runSpeedBonusFor(u):(state.runSpeedBonus||0)),rangeBonus:u=>effects.bonus(u,'range',now()),areaBonus:u=>effects.bonus(u,'areaDamage',now(),.4),
   damage:(enemy,amount,type,options={})=>{if(state.adjustDamage)amount=state.adjustDamage(enemy,amount,type,options);let actual=effects.damage(enemy,amount,type,options,now());// actual is capped at the remaining HP (used for stats); the full hit including overkill goes to the damage number.
   if(state.onDamage&&actual>0)state.onDamage(enemy,actual,type,options,enemy.manmulLastHit??actual);if(state.onAssist&&actual>0){let list=[...(options.assist||[]),...effects.enemyAssist(enemy,type,options,now())];if(list.length)state.onAssist(enemy,actual,list,options)}return actual},
   defense:(enemy,type)=>effects.effectiveDefense(enemy,type,now()),
   slow:(enemy,amount,duration)=>effects.slow(enemy,Math.min(.9,amount*(1+(state.runSlowBonus||0))),duration,now()),control:(enemy,duration)=>effects.control(enemy,duration,now()),bossControl:enemy=>effects.bossControl(enemy,now()),
   dot:(enemy,source,amount,duration,type,kind)=>effects.applyDot(enemy,source,amount*(kind==='burn'?1+(state.runBurnBonus||0):1),duration,type,now(),kind),
   buff:(unit,effect)=>effects.applyBuff(unit,effect,now()),debuff:(enemy,effect)=>effects.applyDebuff(enemy,{...effect,amount:effect.amount*(effect.stat==='armor'?1+(state.runArmorBonus||0):effect.stat==='resist'?1+(state.runResistBonus||0):1)},now()),
   recentDamage:(enemy,seconds,time)=>effects.recentDamage(enemy,seconds,time),removeProtection:enemy=>{if(enemy.protection>0)enemy.protection--},
   summon:(actor,def,time)=>summons.add(actor,{...def,prototypeProfile:def.prototype?{...instance.profile(def.prototype),attack_interval_seconds:instance.attackInterval(def.prototype)}:null},time),
   reviveSummon:(actor,time,nearOnly)=>summons.revive(actor,time,nearOnly),placeMines:(actor,anchor,def,time)=>summons.placeMines(actor,anchor,def,time,state.pathPoint)};
  instance=arena.create(hooks,basicDefinitions);
  function tickEnemy(enemy){effects.updateDots(enemy,now(),instance.world.damage);return {slow:effects.slowAmount(enemy,now()),rooted:(enemy.manmulRootUntil||0)>now()}}
  function tickSummons(){summons.update(now(),instance.world)}
  return {...instance,tickEnemy,tickSummons,summons,effects};
 }
 return {create};
});
