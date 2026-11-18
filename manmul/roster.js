'use strict';
// Convert the v5 source into the shapes expected by the existing battlefield UI.
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./model.js'),require('./unit-text.js'));else root.ManmulRoster=factory(root.ManmulModel,root.ManmulUnitText)})(globalThis,function(model,text){
 const grades=['노말','매직','레어','에픽','유니크','레전더리','재앙','역설','천체'];
 const codes={'노말':'N','매직':'M','레어':'R','에픽':'E','유니크':'U','레전더리':'L','재앙':'D','역설':'H','천체':'C'};
 const colors={'노말':'#b7bec5','매직':'#79e785','레어':'#76aaff','에픽':'#cf91ff','유니크':'#ffe36a','레전더리':'#ff7777','재앙':'#ff9870','역설':'#ff8dcf','천체':'#90def5'};
 function skillName(unit){let match=(unit.skill_text||'').match(/^\s*\d+(?:\.\d+)?초\s*·\s*([^:：]+)[:：]/),name=match?.[1]?.trim();return name&&!/^\d+(?:\.\d+)?초마다$/.test(name)?name:text.skillName(unit.id,unit.name+' 스킬')}
 function basicDescription(unit){let text=(unit.basic_text||'').replace(/^(?:물리|마법)\s*공\s*[\d,.]+\s*\/\s*(?:[\d,.]+|—)초\s*\/\s*[\d,.]+칸/,'').replace(/기술 위력\s*[\d,.]+\s*$/,'').trim();return !text||text==='없음'?'추가 효과 없음':text}
 function build(source){
  const adapted=model.buildUnits(source),byId=Object.fromEntries(adapted.map(u=>[u.id,u]));
  const types=Object.fromEntries(adapted.map(u=>{let active=u.skill_cooldown_seconds!==null,t={...u,grade_name:u.grade,faction_id:codes[u.grade],faction:u.grade,color:colors[u.grade],damage:u.attack,rate:u.attack_interval_seconds||0,range:u.range_world,speed:80,radius:11,normal_equivalent:u.normal_cost,attack_speed:u.attack_interval_seconds?Number((1/u.attack_interval_seconds).toFixed(2)):0,active,skill_cooldown:u.skill_cooldown_seconds,skill_name:active?skillName(u):'',skill_effect:active?text.skillDescription(u.skill_text,skillName(u)):u.skill_text,attack_effect:text.clean(basicDescription(u))};return [u.id,t]}));
  const units=adapted.map(u=>({...types[u.id],grade:codes[u.grade]}));
  // Each unit has one main recipe and optional alternate recipes (alt_recipes) with the same normal cost; the main one comes first.
  const recipes=adapted.filter(u=>u.recipe.length).flatMap(u=>[u.recipe,...(u.alt_recipes||[])].map((recipe,i)=>{let parts=recipe.flatMap(r=>Array(r.quantity).fill(r.unit_id));let main=[...recipe].sort((a,b)=>byId[b.unit_id].normal_cost-byId[a.unit_id].normal_cost)[0].unit_id;return i?{result:u.id,parts,main,alt:true}:{result:u.id,parts,main}}));
  return {types,recipes,rosterData:{units,factions:grades.map(g=>({id:codes[g],name:g}))},gradeColors:colors,grades};
 }
 return {build,grades,codes,colors};
});
