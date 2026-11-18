'use strict';
const {types,recipes,rosterData,gradeColors}=ManmulRoster.build(ManmulRosterData);
const summonCost=20;
const unitRoleTags={};
const combatRules={// Grade efficiency: multiplies attack and skill power so combining raises power per gold (tuned with tools/balance-sim.cjs).
costExponent:.5,gradePower:{'노말':1,'매직':1.3,'레어':1.8,'에픽':2.4,'유니크':3,'레전더리':2.8,'재앙':2.4,'역설':2.4,'천체':2.6},supportRange:140,supportBonus:.10,supportCap:.30,roundReward:12,enemyBaseHp:135,enemyHpPerWave:42,enemyKinds:{normal:{hp:1,speed:35,reward:1,armor:6,resist:6},fast:{hp:1,speed:55,reward:1,armor:3,resist:8},armor:{hp:2,speed:35,reward:1,armor:85,resist:5},swarm:{hp:.55,speed:35,reward:1,armor:4,resist:85},boss:{hp:9,speed:23,reward:20,armor:22,resist:22}}};

// 각 대보스는 서로 다른 방어 특성을 가진다. 수치는 40라운드 테스트용이다.
const bossPool=[
 {id:'bastion',name:'강철의 파수꾼',armor:100,resist:12,hp:11,speed:23,color:'#a2adba',hint:'물리 방어가 높습니다. 마법 공격과 방깎을 준비하세요.'},
 {id:'phantom',name:'심연의 주술사',armor:12,resist:100,hp:11,speed:23,color:'#bb86d9',hint:'마법 저항이 높습니다. 물리 공격과 마깎을 준비하세요.'},
 {id:'warden',name:'균열의 지배자',armor:50,resist:50,hp:14,speed:20,color:'#e0aa61',hint:'물리·마법 모두에 저항합니다. 방깎과 마깎을 함께 활용하세요.'}
];
combatRules.enemyKinds.miniboss={hp:5,speed:27,reward:12,armor:30,resist:30};

