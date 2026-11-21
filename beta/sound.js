'use strict';
// 효과음: Web Audio로 레트로 효과음을 코드에서 바로 만든다(파일 없음).
// 나중에 파일로 바꿀 때는 play(name)을 부르는 곳은 그대로 두고, 아래 sounds[name]만 파일 재생으로 바꾸면 된다.
// - 음량: 전체 × 분류(효과음 sfx / 화면 ui / 경고·진행 alert). 설정은 'rift-sound-v1'에 저장한다.
// - 겹침 제한: 소리마다 최소 간격(gap)과 동시에 울릴 수 있는 수(max)를 둔다. 공격음처럼 잦은 소리는 작고 드물게 낸다.
// - 브라우저 정책상 첫 클릭·키 입력 전에는 소리를 낼 수 없어서, 그때 오디오를 켠다. 탭이 가려지면 멈춘다.
const ManmulSound=(()=>{
 const KEY='rift-sound-v1',defaults={enabled:true,master:.7,sfx:.8,ui:.7,alert:.9};
 let settings=read(),ctx=null,out=null,noiseBuffer=null,lastAt={},playing={},log=[],enemyLevel=0;
 function read(){try{let d=JSON.parse(localStorage.getItem(KEY)||'{}'),s={...defaults};if(typeof d.enabled==='boolean')s.enabled=d.enabled;for(const k of ['master','sfx','ui','alert'])if(Number.isFinite(d[k]))s[k]=Math.max(0,Math.min(1,d[k]));return s}catch(e){return {...defaults}}}
 function save(){try{localStorage.setItem(KEY,JSON.stringify(settings))}catch(e){}}
 const AC=typeof AudioContext==='function'?AudioContext:typeof webkitAudioContext==='function'?webkitAudioContext:null;
 function unlock(){if(!AC)return;if(!ctx){try{ctx=new AC();out=ctx.createGain();out.connect(ctx.destination);applyMaster()}catch(e){ctx=null;return}}if(ctx.state==='suspended'&&!(typeof document==='object'&&document.hidden))ctx.resume?.()}
 function applyMaster(){if(out)out.gain.value=settings.enabled?settings.master:0}
 const now=()=>ctx?ctx.currentTime:0;

 // ── 소리 재료 ──
 // tone: 주파수가 f0에서 f1로 미끄러지는 음 하나. noise: 걸러 낸 잡음(타격·폭발).
 function tone(dest,{type='square',f0=440,f1=f0,dur=.1,vol=.3,delay=0,attack=.005}){let t=now()+delay,o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);if(f1!==f0)o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+attack);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(dest);o.start(t);o.stop(t+dur+.02);return t+dur}
 function noise(dest,{dur=.08,vol=.2,delay=0,freq=1200,q=.8,kind='lowpass'}){if(!noiseBuffer){noiseBuffer=ctx.createBuffer(1,ctx.sampleRate*.5,ctx.sampleRate);let d=noiseBuffer.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}
  let t=now()+delay,s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=noiseBuffer;f.type=kind;f.frequency.value=freq;f.Q.value=q;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(f);f.connect(g);g.connect(dest);s.start(t);s.stop(t+dur+.02);return t+dur}
 const notes=(dest,list,o={})=>list.reduce((end,f,i)=>Math.max(end,tone(dest,{type:o.type||'square',f0:f,dur:o.dur||.09,vol:o.vol||.22,delay:(o.step||.07)*i})),0);
 const grades=['노말','매직','레어','에픽','유니크','레전더리','재앙','역설','천체','신수'];

 // ── 소리 목록 ──  group: 음량 분류, gap: 같은 소리 최소 간격(초), max: 동시에 울릴 수 있는 수
 const sounds={
  click:{group:'ui',gap:.04,max:2,make:d=>tone(d,{type:'square',f0:900,f1:700,dur:.03,vol:.12})},
  error:{group:'ui',gap:.15,max:1,make:d=>{tone(d,{type:'square',f0:220,f1:150,dur:.12,vol:.18});return tone(d,{type:'square',f0:180,f1:120,dur:.12,vol:.15,delay:.09})}},
  chat:{group:'ui',gap:.3,max:1,make:d=>{tone(d,{type:'sine',f0:880,dur:.06,vol:.18});return tone(d,{type:'sine',f0:1320,dur:.08,vol:.15,delay:.06})}},
  summon:{group:'sfx',gap:.05,max:3,make:d=>{tone(d,{type:'triangle',f0:420,f1:840,dur:.12,vol:.25});return tone(d,{type:'sine',f0:1000,dur:.08,vol:.12,delay:.07})}},
  // 조합: 결과 등급이 높을수록 음이 높고 길다.
  fuse:{group:'sfx',gap:.08,max:2,make:(d,o={})=>{let i=Math.max(0,grades.indexOf(o.grade)),base=330*Math.pow(2,i*2/12),list=[base,base*1.26,base*1.5];if(i>=3)list.push(base*2);if(i>=5)list.push(base*2.52);return notes(d,list,{type:i>=4?'triangle':'square',dur:.1+i*.01,vol:.2,step:.06})}},
  upgrade:{group:'sfx',gap:.1,max:1,make:d=>{tone(d,{type:'sine',f0:300,f1:1200,dur:.28,vol:.22});return notes(d,[1320,1760],{type:'triangle',dur:.08,vol:.12,step:.05})}},
  hitPhys:{group:'sfx',gap:.06,max:3,make:d=>noise(d,{dur:.05,vol:.07,freq:1100})},
  hitMagic:{group:'sfx',gap:.06,max:3,make:d=>tone(d,{type:'sine',f0:1300,f1:650,dur:.06,vol:.05})},
  kill:{group:'sfx',gap:.05,max:3,make:d=>noise(d,{dur:.08,vol:.08,freq:700,kind:'bandpass',q:1.2})},
  wave:{group:'alert',gap:1,max:1,make:d=>{tone(d,{type:'triangle',f0:440,dur:.14,vol:.22});return tone(d,{type:'triangle',f0:660,dur:.22,vol:.22,delay:.13})}},
  bossWarn:{group:'alert',gap:1,max:1,make:d=>[0,.22,.44,.66].reduce((e,t,i)=>tone(d,{type:'square',f0:i%2?700:520,dur:.2,vol:.16,delay:t}),0)},
  bossSpawn:{group:'alert',gap:1,max:1,make:d=>{noise(d,{dur:.9,vol:.25,freq:220});tone(d,{type:'sawtooth',f0:110,f1:55,dur:.9,vol:.22});return tone(d,{type:'square',f0:82,f1:60,dur:.7,vol:.12,delay:.1})}},
  bossDown:{group:'alert',gap:.5,max:1,make:d=>{noise(d,{dur:.5,vol:.25,freq:500});return notes(d,[523,659,784,1047],{type:'triangle',dur:.16,vol:.2,step:.09})}},
  reward:{group:'alert',gap:.3,max:1,make:d=>notes(d,[880,1109,1319,1760],{type:'triangle',dur:.1,vol:.16,step:.06})},
  alarm:{group:'alert',gap:2,max:1,make:(d,o={})=>{let n=o.level>=2?3:2,f=o.level>=2?990:880;let e=0;for(let i=0;i<n;i++)e=tone(d,{type:'square',f0:f,dur:.08,vol:.16,delay:i*.14});return e}},
  victory:{group:'alert',gap:2,max:1,make:d=>notes(d,[523,659,784,1047,784,1047],{type:'square',dur:.16,vol:.2,step:.13})},
  defeat:{group:'alert',gap:2,max:1,make:d=>{tone(d,{type:'sawtooth',f0:400,f1:90,dur:.9,vol:.2});return noise(d,{dur:.9,vol:.12,freq:300})}}
 };

 // 마지막에 요청된 소리 기록(테스트·디버그용). 오디오를 켤 수 없는 환경에서도 남는다.
 function play(name,opts){let s=sounds[name];if(!s)return false;log.push(name);if(log.length>30)log.shift();if(!settings.enabled||!settings[s.group]||!settings.master)return false;
  if(!ctx||ctx.state!=='running')return false;let t=now();if(t-(lastAt[name]??-9)<s.gap)return false;if((playing[name]||0)>=s.max)return false;
  lastAt[name]=t;let g=ctx.createGain();g.gain.value=settings[s.group];g.connect(out);playing[name]=(playing[name]||0)+1;
  let end;try{end=s.make(g,opts)}catch(e){end=t}setTimeout(()=>{playing[name]=Math.max(0,(playing[name]||1)-1);try{g.disconnect()}catch(e){}},Math.max(50,(end-t)*1000+80));return true}
 // 적 수 경고: 60·80마리를 넘는 순간 한 번씩 울리고, 50·70마리 아래로 내려가면 다시 울릴 수 있다.
 function enemyCount(n){let level=n>=80?2:n>=60?1:0;if(level>enemyLevel){play('alarm',{level});enemyLevel=level}else if((enemyLevel===2&&n<70)||(enemyLevel===1&&n<50))enemyLevel=n>=60?1:0}
 function set(key,value){if(key==='enabled')settings.enabled=!!value;else if(key in defaults)settings[key]=Math.max(0,Math.min(1,+value||0));save();applyMaster();if(value&&key!=='enabled')play(key==='alert'?'reward':'click')}

 if(typeof addEventListener==='function'){addEventListener('pointerdown',unlock,true);addEventListener('keydown',unlock,true)}
 if(typeof document==='object'){document.addEventListener?.('visibilitychange',()=>{if(!ctx)return;if(document.hidden)ctx.suspend?.();else ctx.resume?.()});
  // 버튼 클릭음(조합 카드·보상 카드 등은 각자 소리가 따로 나므로 클릭음은 작다)
  document.addEventListener?.('click',e=>{if(e.target?.closest?.('button'))play('click')},true)}
 return {play,enemyCount,set,unlock,sounds,get settings(){return {...settings}},get log(){return [...log]}};
})();
// 최상위 const는 window 속성이 아니라서, 다른 파일이 globalThis.ManmulSound?.play(...)로 부를 수 있게 붙여 둔다.
globalThis.ManmulSound=ManmulSound;
