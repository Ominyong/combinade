'use strict';
// Player-facing unit text: official skill names, implementation-based basic attack descriptions
// and removal of internal design notes from tooltips.
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ManmulUnitText=factory()})(globalThis,function(){
 const skillNames={
  E001:'쪼개기',E002:'마법 낭독',E003:'유리 파편',E004:'불씨 튀기기',E005:'끓는 물',E006:'빗물 받이',E007:'물살 회전',E008:'온기 순환',E009:'야간 조명',E010:'바람개비',
  E011:'장작 불꽃',E012:'독꽃 피우기',E013:'반사 광선',E014:'고압 분사',E015:'과부하',E016:'급속 냉동',E017:'뇌우',E018:'피스톤 돌진',E019:'연쇄 번개',E020:'밝은 빛',
  E021:'강풍',E022:'비등',E023:'초침',E024:'플래시',E025:'열선',E026:'물보라',E027:'약점 채집',E028:'톱질',E029:'굴러가기',E030:'페달 가속',
  E031:'뱃머리 돌격',E032:'흔들기',E033:'먹칠',E034:'방전',E035:'낚아채기',E036:'맑은 물',E037:'탐조등',E038:'질주로',E039:'풍선 터뜨리기',E040:'거품 세척',
  E041:'방위 표시',E042:'초점 집중',E043:'원거리 조준',E044:'일제 포격',E045:'장난감 행진',E046:'울림',E047:'연줄 베기',E048:'열탕',E049:'깜짝 상자',E050:'충전',E051:'박치기',
  U001:'급행 열차',U002:'포탑 생산',U003:'냉기 방출',U004:'지식 전수',U005:'순풍',U006:'방류',U007:'군락 번식',U008:'기상 예보',U009:'공중 투하',U010:'탈수',
  U011:'응원 방송',U012:'위치 추적',U013:'정면 돌파',U014:'다중 조준',U015:'정화',U016:'가속 질주',U017:'어뢰 발사',U018:'냉방',U019:'드론 출격',U020:'연산 가속',
  U021:'층간 충격',U022:'기총 사격',U023:'고압 방전',U024:'감정 표식',U025:'함포 사격',U026:'회전 관람',U027:'원목 절단',U028:'정오의 종',U029:'투망',
  L001:'발사',L002:'궤도 폭격',L003:'임계 파동',L004:'함재기 폭격',L005:'최적화 연산',L006:'고층 광선',L007:'초전도 질주',L008:'심우주 관측',L009:'용광로',L010:'수문 개방',
  L011:'부스터',L012:'유도 미사일',L013:'전력 공급',
  D001:'들불',D002:'범람',D003:'한파',D004:'폭풍의 눈',D005:'분화',D006:'지각 변동',D007:'대해일',D008:'벼락',
  H001:'어긋난 시간',H002:'페이지 복제',H003:'역류하는 빛',H004:'거울상',H005:'끝없는 물벼락',H006:'유령 운행',H007:'황금 자기장',H008:'환영 재생',H009:'영원한 불빛',H010:'태엽 감기',
  H011:'속삭임',H012:'길 잃기',H013:'냉온 폭주',H014:'그림자 소묘',H015:'무한 회전',H016:'은신 기뢰',H017:'역회전',H018:'원근 역전',H019:'망령의 그물'
 };
 // Clauses that only state what an effect does NOT do, or how it was implemented, are design notes rather than player information.
 const notePatterns=[
  /\s*\(이동 변화 없음\)/g,
  /[;,]\s*(?:밀치기|끌어당기기|끌어당김|정지 효과|이동 변화|이동 제어|위치 변경|회전·정지|이동·회전 제어)\s*없음/g,
  /[;,]\s*100% 가동 금지/g,
  /[;,]\s*재귀 발동 금지/g,
  /[;,]\s*목표 위치 교란은 추가 피해 판정으로 대체/g,
  /[;,]\s*적 투사체 반사는 아군의 공격으로 전환/g,
  /[;,]\s*자력은 추가 피해 판정만 발생/g
 ];
 function clean(text){let out=String(text||'').replace(/\s*\(기본 공격 없음·주기 기술 사용\)/g,' · 기본 공격 없음');for(const pattern of notePatterns)out=out.replace(pattern,'');return out.replace(/\s{2,}/g,' ').trim()}
 // Skill text starts with "<cooldown>초 · " and often "<cooldown>초마다:" or "<name>:"; the tooltip already shows both.
 function skillDescription(text,name){let out=clean(text).replace(/^\s*\d+(?:\.\d+)?초\s*·\s*/,'');let m=out.match(/^([^:：]+)[:：]\s*(.*)$/);if(m&&(/^\d+(?:\.\d+)?초마다$/.test(m[1].trim())||m[1].trim()===name)){out=m[2];let lead=out.match(/^(\d+(?:\.\d+)?)초마다\s+/);if(lead)out=out.slice(lead[0].length)}return out.trim()}
 const pct=v=>`${Math.round(v*1000)/10}%`;
 const dotNames={burn:'화상',poison:'중독'};
 const selectNames={nearest:'가장 가까운 적',progress:'가장 앞선 적',hp:'체력이 가장 높은 적',health:'체력이 가장 높은 적'};
 // Returns a description generated from the executable basic definition, or null when the definition has mechanics this
 // generator does not cover (the curated design description is kept in that case).
 function describeBasic(def){
  if(!def||typeof def!=='object')return null;
  const known=new Set(['kind','mark','element','factor','count','amount','duration','dotType','dotArea','dotAllInRange','markMulti','markPierced','markSplash','markAreaSlow','interval','bonusSelect','bonusElement','radius','chainElement','armorIgnore']);
  if(Object.keys(def).some(k=>!known.has(k)))return null;
  const el=def.element?`${def.element} 속성 `:'';let main;
  switch(def.kind){
   case 'single':main=def.armorIgnore?`${el}단일 대상 공격 · 방어력 ${pct(def.armorIgnore)} 무시`:`${el}단일 대상 공격`;break;
   case 'double':main=`${el}같은 대상에 2연속 공격 (각 공격력 ${pct(def.factor)})`;break;
   case 'multi':main=`${el}대상과 주변 적 ${(def.count||1)-1}기를 함께 공격${def.factor!==1?` (추가 대상 공격력 ${pct(def.factor)})`:''}`;break;
   case 'pierce':main=`${el}대상 뒤의 적 ${def.count||1}기까지 관통 (관통 공격력 ${pct(def.factor)})`;break;
   case 'chain':main=`주변 적 1기에게 공격력 ${pct(def.factor)} ${def.chainElement&&def.element?def.element+' ':''}연쇄 피해`;break;
   case 'splash':main=`대상 주변 적 최대 3기에 공격력 ${pct(def.factor)} ${def.element?def.element+' ':''}범위 피해`;break;
   case 'slow':main=`적중 시 ${def.duration}초간 이동속도 ${pct(def.amount)} 감소`;break;
   case 'areaSlow':main=`대상 포함 적 ${def.count}기의 이동속도 ${def.duration}초간 ${pct(def.amount)} 감소`;break;
   case 'root':main=`일반 적을 ${def.duration}초 묶음 (보스·중간 보스 제외)`;break;
   case 'dot':{let who=def.dotAllInRange?'사거리 안 모든 적에게':def.dotArea?'대상과 주변 적에게':'적중 시';main=`${who} ${def.duration}초간 공격력 ${pct(def.factor)} ${dotNames[def.dotType]||'지속'} 피해`;break}
   case 'vulnerability':main=`적중 시 ${def.duration}초간 받는 피해 ${pct(def.amount)} 증가`;break;
   case 'periodic_bonus':main=`${def.interval}초마다 ${selectNames[def.bonusSelect]||'공격 대상'}에게 공격력 ${pct(def.factor)} ${def.bonusElement?def.bonusElement+' ':''}추가 피해`;break;
   case 'speed_aura':main=`반경 ${def.radius}칸 아군 공격속도 ${pct(def.amount)} 증가`;break;
   default:return null;
  }
  if(def.mark){let all=(def.kind==='multi'&&def.markMulti)||(def.kind==='pierce'&&def.markPierced)||(def.kind==='splash'&&def.markSplash)||(def.kind==='areaSlow'&&def.markAreaSlow)||(def.kind==='dot'&&def.dotArea);main+=` · ${all?'맞힌 모든 적에게':'대상에게'} ${def.mark} 표식`}
  return main;
 }
 function skillName(id,fallback){return skillNames[id]||fallback}
 // 마법 유닛의 위력은 「마력」, 물리 유닛은 「공격력」으로 부른다. 마법 유닛 설명 속 자기 피해 수치(공격력 N%)도 마력으로 바꾼다.
 // 아군에게 주는 버프(…아군 공격력 N% 증가, 공격력 +N%)는 그대로 둔다.
 function powerLabel(type){return type==='마법'?'마력':'공격력'}
 function forDamageType(text,type){if(type!=='마법'||!text)return text;return String(text).replace(/공격력(\s*)(\d+(?:\.\d+)?%)/g,(m,sp,v,at,all)=>/아군[^.;·]{0,14}$/.test(all.slice(0,at))?m:'마력'+sp+v)}
 return {skillNames,skillName,clean,skillDescription,describeBasic,powerLabel,forDamageType};
});
