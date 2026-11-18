'use strict';
// Initial v5 balancing adapter. The original document values remain unchanged.
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ManmulModel=factory()})(globalThis,function(){
 const SCALE=3.6;
 // Trial normal-unit tuning: small differences while preserving similar base DPS.
 const normalBalance={N001:{attack:38,interval:1.05},N002:{attack:35,interval:.98},N003:{attack:33,interval:.92},N004:{attack:39,interval:1.08},N005:{attack:41,interval:1.14},N006:{attack:34,interval:.95},N007:{attack:36,interval:1}};
 // Explicit v5 categories for category-restricted support skills; IDs are stable.
 const categoryIds={
  '식물':'N006 M009 M012 M013 M018 M020 M025 R001 R014 R015 R018 R023 R027 R028 R029 R035 R041 R045 R046 R047 E008 E012 U007 U031 L022 H008',
  '물':'N002 M002 M007 M016 M017 M018 M024 M027 R008 R009 R019 R021 R022 R033 R037 R040 R057 R058 E005 E006 E007 E026 E036 E048 E070 E071 U006 U008 U015 U036 U040 L010 L021 D002 D007 H005 H019',
  '빛':'N007 M006 M023 R025 R052 E009 E020 E037 E042 E043 E050 E060 E072 U032 U039 L002 L008 C002 C003 C006 C007',
  '열기':'N001 M001 M014 M022 E004 E011 E025 E048 E057 E058 E059 U034 L019 D001 D005 D012 H013 C002 C006',
  '냉기':'M010 R002 R010 E016 E069 U003 U018 U033 D003 D011 H013 C001 C005 C006 C007',
  '기계':'E015 E016 E018 E019 E020 E021 E022 E023 E026 E029 E030 E034 E038 E043 E044 E045 E050 E062 E067 E071 U001 U002 U003 U005 U006 U008 U010 U011 U012 U013 U014 U015 U016 U017 U018 U019 U020 U021 U023 U025 U026 U027 U028 U030 U032 U033 U034 U037 U038 U039 U040 L001 L002 L003 L004 L005 L007 L008 L009 L010 L011 L012 L013 L015 L016 L017 L018 L019 L020 L021 L023 L024 H001 H005 H006 H009 H010 H011 H012 H013 H015 H016 H017 H018 H019',
  '바람':'N003 M003 M016 M017 M024 M025 R028 R029 R032 R033 R037 R041 E010 E021 E030 E039 E047 E065 E066 E068 U005 U009 U016 U022 U036 D004 D013',
  '전기':'R007 R024 R031 R039 E015 E017 E019 E020 E021 E022 E034 E050 E067 U005 U006 U010 U011 U012 U014 U015 U019 U020 U023 U030 U032 U039 L002 L003 L013 D008 H009 H011',
  '목재':'R001 R012 R013 R023 R027 R029 R034 R035 R041 R045 R046 E001 E002 E003 E008 E012 E027 E028 E045 E047 E064 E065 U007 U027 U031 H002 H008 H010 H014',
  '교통':'E029 E030 E031 E038 E063 E065 E066 E068 U001 U009 U013 U016 U017 U021 U022 U023 U025 U029 U035 U036 L001 L004 L007 L011 L012 L015 L016 L020 L021 H006 H016 H019',
  '날씨':'M003 M010 M016 M017 M027 R007 R009 R010 R033 R039 E017 U008 D002 D003 D004 D007 D008 D011 D012 D013 C007'
 };
 const categories=Object.fromEntries(Object.entries(categoryIds).map(([category,ids])=>[category,new Set(ids.split(' '))]));
 function buildUnits(source){return source.units.map(u=>{
  const special=u.grade==='재앙'||u.grade==='천체',paradox=u.grade==='역설';
  // v5 normal 10 is scaled to the existing game's normal attack 36.
  // Paradox has no documented skill power; approximate it from normal-equivalent cost.
  const rawSkillPower=u.skill_power??(paradox?200+10*u.normal_cost:null),normal=u.grade==='노말'?normalBalance[u.id]:null;
  return {...u,categories:Object.keys(categories).filter(category=>categories[category].has(u.id)),attack:normal?.attack??Math.round(u.attack*SCALE),skill_power:rawSkillPower===null?null:Math.round(rawSkillPower*SCALE),uses_basic:!special&&!paradox&&u.attack>0,attack_interval_seconds:normal?.interval??(u.attack_interval_seconds&&u.attack_interval_seconds>0?u.attack_interval_seconds:null),range_world:u.range_tiles*45};
 })}
 return {SCALE,buildUnits};
});
