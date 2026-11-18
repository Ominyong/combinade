'use strict';
// Display tags are built only from structured runtime definitions, never from description text.
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ManmulRoles=factory()})(globalThis,function(){
 function build(types,basic,skills){const result={};for(const t of Object.values(types)){
  const tags=new Set(),b=basic[t.id]||{},s=skills[t.id]||{};
  function damage(type){if(type==='물리')tags.add('physical');else if(type==='마법')tags.add('magic')}
  if(t.uses_basic){damage(t.damage_type);tags.add('single')}
  if(s.kind==='attack'||['dot','scatter','mixed','clusterAreas','clusterShots','highAndNearby','differentAreas','bossSplash','recordedDamage','mines'].includes(s.kind))damage(s.damageType||t.damage_type);
  if(b.areaCount||['multi','splash','areaSlow','periodic_area'].includes(b.kind)||['area','cone'].includes(s.shape)||['clusterAreas','clusterShots','highAndNearby','differentAreas','mixed','mines'].includes(s.kind))tags.add('area');
  if(['pierce','path'].includes(b.kind)||s.shape==='line'||s.pierce)tags.add('pierce');if(b.kind==='chain'||s.shape==='chain')tags.add('chain');
  if(b.kind==='dot'||s.kind==='dot'||s.dot)tags.add('dot');if(['slow','areaSlow'].includes(b.kind))tags.add('slow');if(b.kind==='root')tags.add('control');
  if(b.markedShred||s.stat==='armor'||s.debuff?.stat==='armor')tags.add('armor');if(s.stat==='resist'||s.debuff?.stat==='resist')tags.add('resist');
  if(b.aura||b.targetAura||b.beamReflect||b.targetAssist||b.weatherAura||['buff','cooldown','copyBasic','weaken'].includes(s.kind))tags.add('support');
  if(b.passive||['summon','summonCopy','reviveSummon','mines'].includes(s.kind)||t.id==='H010')tags.add('summon');if(s.kind==='bossSplash'||b.targetAura?.boss)tags.add('boss');
  if(['역설','재앙','천체'].includes(t.grade))tags.add('special');result[t.id]=[...tags];
 }return result}
 return {build};
});
