'use strict';
// Runtime status and damage primitives used by the v5 arena adapter.
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./themes.js'));else root.ManmulEffects=factory(root.ManmulThemes)})(globalThis,function(themes){
 function active(items,now){return (items||[]).filter(x=>x.until>now)}
 function put(owner,key,effect,now){owner[key]=active(owner[key],now);let existing=owner[key].find(x=>x.source===effect.source&&x.stat===effect.stat);let entry={...effect,startedAt:existing?.startedAt??now,until:now+effect.duration};if(existing)Object.assign(existing,entry);else owner[key].push(entry)}
 function applyBuff(unit,effect,now){put(unit,'manmulBuffs',effect,now)}
 function applyDebuff(enemy,effect,now){put(enemy,'manmulDebuffs',effect,now)}
 function bonus(owner,stat,now,cap=Infinity){return Math.min(cap,active(owner.manmulBuffs,now).filter(x=>x.stat===stat).reduce((sum,x)=>sum+x.amount,0))}
 function reduction(enemy,stat,now){return active(enemy.manmulDebuffs,now).filter(x=>x.stat===stat).reduce((sum,x)=>sum+x.amount,0)}
 function effectiveDefense(enemy,type,now,ignore=0){let base=(type==='물리'?(enemy.armor||0):(enemy.resist||0))*themes.defenseMultiplier(enemy,type),stat=type==='물리'?'armor':'resist';return Math.max(0,base*(1-Math.min(1,reduction(enemy,stat,now)))*(1-ignore))}
 function damage(enemy,amount,type,options,now){
  if(!enemy||!Number.isFinite(amount)||amount<=0||enemy.hp<=0)return 0;
  if(options.finalDamage){if(enemy.shield>0){let absorbed=Math.min(enemy.shield,amount);enemy.shield-=absorbed;amount-=absorbed}amount=Math.min(enemy.hp,amount);enemy.hp-=amount;enemy.manmulDamageHistory=(enemy.manmulDamageHistory||[]).filter(x=>x.at>now-3);enemy.manmulDamageHistory.push({at:now,amount});return amount}
  let defense=effectiveDefense(enemy,type,now,options.armorIgnore||0);
  let mitigation=options.trueDamage?0:Math.min(.7,defense/(100+defense));
  // The black hole's named skill and its gravity-lens reaction describe the same
  // vulnerability; preserve the stronger one instead of applying it twice.
  let debuffs=active(enemy.manmulDebuffs,now).filter(x=>x.stat==='damageTaken'),gravitySkill=debuffs.filter(x=>x.source==='C008').reduce((m,x)=>Math.max(m,x.amount),0),gravityReaction=enemy.manmulVulnerability&&enemy.manmulVulnerability.until>now?enemy.manmulVulnerability.amount:0;
  let vulnerability=debuffs.filter(x=>x.source!=='C008').reduce((sum,x)=>sum+x.amount,0)+(type==='마법'?reduction(enemy,'magicDamageTaken',now):0)+(options.element?reduction(enemy,'element:'+options.element,now):0);
  let extra=themes.mitigation(enemy,type,now);mitigation=Math.min(.7,1-(1-mitigation)*(1-extra));let dealt=amount*(1-mitigation)*(1+vulnerability)*(1+Math.max(gravitySkill,gravityReaction));if(enemy.shield>0){let absorbed=Math.min(enemy.shield,dealt);enemy.shield-=absorbed;dealt-=absorbed}enemy.manmulLastHit=dealt;dealt=Math.min(enemy.hp,dealt);enemy.hp-=dealt;enemy.manmulDamageHistory=(enemy.manmulDamageHistory||[]).filter(x=>x.at>now-3);enemy.manmulDamageHistory.push({at:now,amount:dealt});return dealt;
 }
 // Enemy-side support: share of a hit caused by damage-taken debuffs and armor/resist reduction, per debuff source.
 function enemyAssist(enemy,type,options,now){let out=[];if(!enemy||options.finalDamage)return out;let ds=active(enemy.manmulDebuffs,now);
  let vul=ds.filter(x=>x.source!=='C008'&&x.amount>0&&(x.stat==='damageTaken'||type==='마법'&&x.stat==='magicDamageTaken'||options.element&&x.stat==='element:'+options.element)),vt=vul.reduce((s,x)=>s+x.amount,0);for(const x of vul)out.push([x.source,x.amount/(1+vt)]);
  let g=ds.filter(x=>x.stat==='damageTaken'&&x.source==='C008').reduce((m,x)=>Math.max(m,x.amount),0),gr=enemy.manmulVulnerability&&enemy.manmulVulnerability.until>now?enemy.manmulVulnerability.amount:0;if(g>0&&g>=gr)out.push(['C008',g/(1+g)]);
  if(!options.trueDamage){let stat=type==='물리'?'armor':'resist',sh=ds.filter(x=>x.stat===stat&&x.amount>0),raw=sh.reduce((s,x)=>s+x.amount,0);if(raw>0){let base=(type==='물리'?(enemy.armor||0):(enemy.resist||0))*themes.defenseMultiplier(enemy,type)*(1-(options.armorIgnore||0)),extra=themes.mitigation(enemy,type,now),m=d=>Math.min(.7,1-(1-Math.min(.7,d/(100+d)))*(1-extra)),m0=m(base),m1=m(base*(1-Math.min(1,raw)));if(m0>m1){let f=1-(1-m0)/(1-m1);for(const x of sh)out.push([x.source,f*x.amount/raw])}}}
  return out}
 function applyDot(enemy,source,amount,duration,type,now,kind){enemy.manmulDots=active(enemy.manmulDots,now);let dot=enemy.manmulDots.find(x=>x.source===source);if(dot){dot.amount=amount;dot.type=type;if(dot.kind!==kind)dot.startedAt=now;dot.kind=kind;dot.until=now+duration}else enemy.manmulDots.push({source,amount,type,kind,startedAt:now,until:now+duration,next:now+1})}
 function updateDots(enemy,now,deal){for(const dot of (enemy.manmulDots||[])){while(dot.next<=now+1e-9&&dot.next<=dot.until+1e-9){deal(enemy,dot.amount,dot.type,{secondary:true,dot:true,dotType:dot.kind,source:dot.source&&String(dot.source).startsWith('manmul:')?{id:Number(String(dot.source).slice(7))}:null});dot.next+=1}if(now>=dot.until){let fraction=dot.until-(dot.next-1);if(fraction>1e-9)deal(enemy,dot.amount*Math.min(1,fraction),dot.type,{secondary:true,dot:true,dotType:dot.kind,source:dot.source&&String(dot.source).startsWith('manmul:')?{id:Number(String(dot.source).slice(7))}:null})}}enemy.manmulDots=active(enemy.manmulDots,now)}
 function slow(enemy,amount,duration,now){put(enemy,'manmulDebuffs',{source:'slow:'+amount,stat:'slow',amount,duration},now)}
 function slowAmount(enemy,now){return Math.max(0,...active(enemy.manmulDebuffs,now).filter(x=>x.stat==='slow').map(x=>x.amount))}
 function bossControl(enemy,now){if((enemy.manmulControlImmunity||0)>now)return false;slow(enemy,.3,1,now);enemy.manmulControlImmunity=now+8;return true}
 function control(enemy,duration,now){if(enemy.kind==='boss'||enemy.kind==='miniboss'||(enemy.manmulControlImmunity||0)>now)return false;if(!(enemy.manmulRootUntil>now))enemy.manmulRootStarted=now;enemy.manmulRootUntil=Math.max(enemy.manmulRootUntil||0,now+duration);enemy.manmulControlImmunity=now+8;return true}
 function recentDamage(enemy,seconds,now){return (enemy.manmulDamageHistory||[]).filter(x=>x.at>now-seconds&&x.at<=now).reduce((sum,x)=>sum+x.amount,0)}
 return {applyBuff,applyDebuff,bonus,reduction,effectiveDefense,damage,enemyAssist,applyDot,updateDots,slow,slowAmount,control,bossControl,recentDamage};
});
