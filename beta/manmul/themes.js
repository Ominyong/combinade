'use strict';
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ManmulThemes=factory()})(globalThis,function(){
 const themes={steel:{name:'강철 균열',description:'적의 방어력이 높고 라운드마다 더 단단해집니다. 마법 공격과 방어력 감소 유닛이 유리합니다.',stat:'armor',factor:1.2,abilities:[['thick','두꺼운 장갑','물리 피해 15% 감소'],['armor','적응 장갑','체력 50% 이하에서 방어력 30% 증가'],['barrier','주기적 방벽','15초마다 최대 체력의 8% 보호막'],['heavy','둔중한 진격','이동속도 15% 감소, 체력 20% 증가']]},magic:{name:'마력 균열',description:'적의 마법 저항력이 높고 라운드마다 더 올라갑니다. 물리 공격과 마법 저항 감소 유닛이 유리합니다.',stat:'resist',factor:1.2,abilities:[['magic','마력 갑피','마법 피해 15% 감소'],['resist','적응 장막','체력 50% 이하에서 마법 저항력 30% 증가'],['absorb','마력 흡수','15초마다 최대 체력의 5% 회복'],['unstable','불안정한 장막','10초마다 4초 동안 피해 20% 감소']]},speed:{name:'질주 균열',description:'적이 더 많이, 더 빠르게 몰려옵니다(개체 체력은 낮음). 범위·관통·연쇄 공격 유닛이 유리합니다.',stat:'speed',factor:1.15,abilities:[['dash','급가속','15초마다 4초 동안 이동속도 40% 증가'],['last','최후의 질주','체력 50% 이하에서 이동속도 25% 증가'],['light','경량 갑각','체력 15% 감소, 이동속도 30% 증가'],['tenacity','저항성 발걸음','감속 효과 절반 적용']]},life:{name:'생명 균열',description:'적의 체력이 높고 5초마다 회복합니다. 화상·중독 상태의 적은 회복하지 못하므로 지속 피해 유닛이 유리합니다.',stat:'max',factor:1.15,abilities:[['regen','재생','5초마다 최대 체력의 2% 회복'],['vital','끈질긴 생명력','최대 체력 20% 증가'],['revive','위기의 재생','체력 50% 이하에서 한 번 최대 체력의 15% 회복'],['shield','생명 보호막','등장 시 최대 체력의 15% 보호막']]}};
 // Theme-exclusive bosses: each theme has four bosses, one per theme ability (16 in total).
 // hp is a multiplier of the round's base enemy HP; armor/resist are base values before round and theme scaling.
 const bosses={
  steel:[
   {id:'steel-hulk',name:'철갑 거수',ability:'thick',armor:110,resist:15,hp:11,speed:22,color:'#9aa6b4',hint:'두꺼운 장갑으로 물리 피해를 덜 받습니다. 마법 공격과 방어력 감소를 준비하세요.'},
   {id:'steel-golem',name:'적응형 강철 골렘',ability:'armor',armor:80,resist:25,hp:12,speed:22,color:'#8f9dab',hint:'체력이 절반 아래로 떨어지면 방어력이 오릅니다. 후반 마무리용 마법 화력을 남겨 두세요.'},
   {id:'steel-warden',name:'방벽의 수문장',ability:'barrier',armor:70,resist:40,hp:11,speed:23,color:'#b5bec8',hint:'주기적으로 보호막을 두릅니다. 연타와 지속 피해로 보호막을 빠르게 벗겨내세요.'},
   {id:'steel-ram',name:'강철 공성추',ability:'heavy',armor:90,resist:20,hp:12,speed:24,color:'#7d8794',hint:'느리지만 체력이 많습니다. 방어력 감소와 높은 마법 화력을 집중하세요.'}
  ],
  magic:[
   {id:'magic-knight',name:'마력 갑주 기사',ability:'magic',armor:15,resist:110,hp:11,speed:22,color:'#a777d6',hint:'마력 갑피로 마법 피해를 덜 받습니다. 물리 공격과 마법 저항 감소를 준비하세요.'},
   {id:'magic-shaman',name:'장막의 주술사',ability:'resist',armor:25,resist:80,hp:12,speed:22,color:'#bb86d9',hint:'체력이 절반 아래로 떨어지면 마법 저항이 오릅니다. 마무리용 물리 화력을 남겨 두세요.'},
   {id:'magic-lord',name:'흡마의 군주',ability:'absorb',armor:40,resist:70,hp:11,speed:23,color:'#9b5fcf',hint:'주기적으로 체력을 흡수합니다. 회복 주기 사이에 화력을 몰아 넣으세요.'},
   {id:'magic-phantom',name:'일렁이는 환영체',ability:'unstable',armor:20,resist:90,hp:12,speed:22,color:'#c99ae6',hint:'주기적으로 모든 피해를 덜 받습니다. 장막이 걷힌 순간에 기술을 맞추세요.'}
  ],
  speed:[
   {id:'speed-hunter',name:'질풍 추격자',ability:'dash',armor:35,resist:35,hp:10,speed:26,color:'#f2c45c',hint:'주기적으로 급가속합니다. 경로 전체에 고르게 화력을 배치하세요.'},
   {id:'speed-rager',name:'광폭한 돌진수',ability:'last',armor:40,resist:30,hp:11,speed:24,color:'#f0a84e',hint:'체력이 절반 아래로 떨어지면 더 빨라집니다. 넓은 사거리와 관통 공격이 유리합니다.'},
   {id:'speed-crawler',name:'경갑 질주충',ability:'light',armor:30,resist:30,hp:11,speed:25,color:'#ffd77a',hint:'체력은 낮지만 매우 빠릅니다. 범위와 연쇄 공격으로 주변 적과 함께 정리하세요.'},
   {id:'speed-marcher',name:'불굴의 행군자',ability:'tenacity',armor:45,resist:45,hp:11,speed:23,color:'#e6b552',hint:'감속 효과를 절반만 받습니다. 둔화보다 순수 화력으로 상대하세요.'}
  ],
  life:[
   {id:'life-elder',name:'재생하는 고목',ability:'regen',armor:40,resist:40,hp:12,speed:21,color:'#6fbf73',hint:'5초마다 체력을 회복합니다. 화상·중독을 유지해 회복을 막으세요.'},
   {id:'life-titan',name:'거대 생명체',ability:'vital',armor:35,resist:35,hp:12,speed:20,color:'#58a862',hint:'최대 체력이 매우 높습니다. 지속 피해와 보스 특화 화력을 오래 유지하세요.'},
   {id:'life-cocoon',name:'부활의 고치',ability:'revive',armor:45,resist:45,hp:12,speed:21,color:'#8fd38f',hint:'체력이 절반 아래로 떨어지면 한 번 크게 회복합니다. 회복 직후 화력을 다시 집중하세요.'},
   {id:'life-spirit',name:'보호막 정령',ability:'shield',armor:50,resist:50,hp:11,speed:22,color:'#7fd1a8',hint:'등장할 때 큰 보호막을 두릅니다. 초반에 화력을 몰아 보호막을 벗겨내세요.'}
  ]
 };
 for(const [id,list] of Object.entries(bosses))themes[id].bosses=list;
 function abilityOf(theme,abilityId){return themes[theme]?.abilities.find(a=>a[0]===abilityId)||null}
 function choose(theme,previous,random=Math.random){let options=themes[theme].abilities.filter(a=>a[0]!==previous);return options[Math.floor(random()*options.length)]}
 // Theme pressure: on top of the base factor, every enemy gets a theme-specific edge that grows with the round.
 // intensity comes from the difficulty (0 = base factor only), so higher difficulties demand units that answer the theme.
 // steelScale/lifeRegen/lifeHp/speedCount were tuned with tools/balance-sim.cjs so the four themes clear at similar rates
// (steel lacks magic area units, life lacks damage-over-time units, speed is countered by the many area units).
const pressure={defenseBase:5,defensePerWave:2.5,steelScale:.45,resistScale:1.25,speedCount:1,speedCountCap:2.3,speedHp:.15,speedMove:.12,lifeHp:.04,lifeRegen:.002};
 function applyPressure(e,theme,opts){let p=Math.max(0,opts?.intensity||0),wave=Math.max(1,opts?.wave||1),k=pressure;if(!p)return;let defense=p*(k.defenseBase+k.defensePerWave*wave);if(theme==='steel')e.armor=(e.armor||0)+defense*k.steelScale;else if(theme==='magic')e.resist=(e.resist||0)+defense*k.resistScale;else if(theme==='speed'){e.speed*=1+k.speedMove*p;e.max/=1+k.speedHp*p}else if(theme==='life'){e.max*=1+k.lifeHp*p;e.themeRegen=k.lifeRegen*p*Math.min(1,wave/20)}}
 function initialize(e,theme,ability,now,opts){if(!themes[theme])return;let t=themes[theme];e[t.stat]*=t.factor;applyPressure(e,theme,opts);if(t.stat==='max'||theme==='life')e.hp=e.max;e.themeStarted=now;e.themeTick=0;e.bossAbility=ability?.[0]||null;e.bossAbilityName=ability?.[1]||'';e.bossStarted=now;e.bossTick=0;switch(e.bossAbility){case 'heavy':e.speed*=.85;e.max*=1.2;break;case 'light':e.speed*=1.3;e.max*=.85;break;case 'vital':e.max*=1.2;break}e.hp=e.max;if(e.bossAbility==='shield')e.shield=e.max*.15}
 function update(e,now){if(e.themeRegen&&e.hp>0){let n=Math.floor((Math.max(0,now-(e.themeStarted||0))+1e-9)/5),wounded=(e.manmulDots||[]).some(d=>d.until>now);while((e.themeTick||0)<n){e.themeTick=(e.themeTick||0)+1;if(!wounded)e.hp=Math.min(e.max,e.hp+e.max*e.themeRegen)}}if(!e.bossAbility||e.hp<=0)return;let elapsed=Math.max(0,now-e.bossStarted),id=e.bossAbility,interval=id==='regen'?5:(id==='barrier'||id==='absorb'?15:0);if(interval){let n=Math.floor((elapsed+1e-9)/interval);while(e.bossTick<n){e.bossTick++;if(id==='barrier')e.shield=Math.max(e.shield||0,e.max*.08);else e.hp=Math.min(e.max,e.hp+e.max*(id==='regen'?.02:.05))}}if(id==='revive'&&!e.bossRecovered&&e.hp<=e.max*.5){e.bossRecovered=true;e.hp=Math.min(e.max,e.hp+e.max*.15)}}
 function defenseMultiplier(e,type){return e.hp<=e.max*.5&&((e.bossAbility==='armor'&&type==='물리')||(e.bossAbility==='resist'&&type==='마법'))?1.3:1}
 function mitigation(e,type,now){let id=e.bossAbility;if(id==='thick'&&type==='물리'||id==='magic'&&type==='마법')return .15;if(id==='unstable'&&now-e.bossStarted>=10&&(now-e.bossStarted)%10<4)return .2;return 0}
 function speedMultiplier(e,now){let elapsed=now-e.bossStarted;if(e.bossAbility==='dash'&&elapsed>=15&&elapsed%15<4)return 1.4;if(e.bossAbility==='last'&&e.hp<=e.max*.5)return 1.25;return 1}
 // Speed rifts send larger waves (enemies loop the path, so numbers - not speed - are what threatens the 100-enemy limit).
 // Capped so extreme (intensity 1.6) gets the same enemy count as hard (1.3) instead of 2.6x.
function waveCountFactor(theme,intensity,wave=20){return theme==='speed'?1+Math.min(pressure.speedCountCap-1,pressure.speedCount*Math.max(0,intensity||0))*Math.min(1,Math.max(1,wave)/15):1}
 // 협동 모드: a second (third, fourth) theme stacked on the same enemy — its stat change and pressure only.
 function stack(e,theme,now,opts){if(!themes[theme])return;let t=themes[theme];e[t.stat]*=t.factor;applyPressure(e,theme,opts);if(t.stat==='max'||theme==='life')e.hp=e.max}
 return {themes,bosses,abilityOf,pressure,waveCountFactor,choose,initialize,stack,update,defenseMultiplier,mitigation,speedMultiplier};
});
