// 멀티플레이: 각자 자기 맵에서 플레이하고 상태만 공유한다.
// PeerJS(WebRTC) 별 모양 연결: 방장이 모든 참가자와 연결하고 메시지를 중계한다.
// game.js의 전역(gold, wave, enemies, units, ended 등)을 읽기만 하고, 시작은 beginRiftRun()으로 한다.
const Multiplayer=(()=>{
 const MAX_PLAYERS=4,PREFIX='rift-guard-v1-',CODE_CHARS='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',STATE_INTERVAL=1000,KEEPALIVE=3000,STALE=10000;
 let seen={},lastSentAt=0,peer=null,host=false,code='',selfId='',hostConn=null,conns=new Map(),players=[],states={},started=false,theme=null,status='',stateTimer=null;
 // 테스트처럼 타이머·이벤트가 없는 환경에서도 불러올 수 있게 한다.
 const every=(fn,ms)=>typeof setInterval==='function'?setInterval(fn,ms):null,stopTimer=id=>{if(id!==null&&typeof clearInterval==='function')clearInterval(id)};
 const $=s=>document.querySelector(s);
 const esc=text=>String(text??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const myName=()=>(typeof playerProfile==='object'&&playerProfile?.name)||'플레이어';
 const randomCode=()=>Array.from({length:5},()=>CODE_CHARS[Math.floor(Math.random()*CODE_CHARS.length)]).join('');
 const difficultyId=()=>{let v=$('#difficultySelect')?.value;return typeof difficulties==='object'&&Object.hasOwn(difficulties,v)?v:'normal'};
 function setStatus(text){status=text;render()}
 function newPeer(id){return new Promise((resolve,reject)=>{if(typeof Peer!=='function'){reject(new Error('PeerJS를 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.'));return}let p=id?new Peer(id):new Peer();p.on('open',()=>resolve(p));p.on('error',err=>reject(err))})}

 // ── 방장 ──
 async function createRoom(){if(peer)return;setStatus('방을 만드는 중…');for(let attempt=0;attempt<3;attempt++){let c=randomCode();try{peer=await newPeer(PREFIX+c);code=c;break}catch(err){if(err?.type!=='unavailable-id'){fail(err);return}}}if(!peer){fail(new Error('방 코드를 만들지 못했습니다.'));return}
  host=true;selfId=peer.id;players=[{id:selfId,name:myName()}];peer.on('connection',acceptGuest);peer.on('error',err=>setStatus('연결 오류: '+(err?.type||err?.message||err)));peer.on('disconnected',()=>{if(peer&&!peer.destroyed)peer.reconnect()});setStatus('');}
 function acceptGuest(conn){conn.on('open',()=>{if(started){conn.send({t:'reject',reason:'이미 게임이 시작된 방입니다.'});setTimeout(()=>conn.close(),300);return}if(players.length>=MAX_PLAYERS){conn.send({t:'reject',reason:'방이 가득 찼습니다(최대 4명).'});setTimeout(()=>conn.close(),300);return}conns.set(conn.peer,conn)});
  conn.on('data',msg=>onHostData(conn,msg));conn.on('close',()=>dropGuest(conn.peer));conn.on('error',()=>dropGuest(conn.peer))}
 function onHostData(conn,msg){if(!msg||typeof msg!=='object'||!conns.has(conn.peer))return;
  if(msg.t==='hello'){let base=String(msg.name||'플레이어').slice(0,10),name=base;for(let i=2;players.some(p=>p.name===name);i++)name=base+i;if(!players.some(p=>p.id===conn.peer))players.push({id:conn.peer,name});broadcastRoster();return}
  if(msg.t==='state'){let s=sanitizeState(msg.s);states[conn.peer]=s;seen[conn.peer]=Date.now();broadcast({t:'state',from:conn.peer,s},conn.peer);render()}}
 function dropGuest(id){if(!conns.has(id)&&!players.some(p=>p.id===id))return;conns.delete(id);let player=players.find(p=>p.id===id);if(started&&player){if(states[id])states[id].left=true}else{players=players.filter(p=>p.id!==id);delete states[id]}broadcastRoster();if(player&&typeof notice==='function'&&!inLobby)notice(player.name+' 님이 나갔습니다');}
 function broadcast(msg,except){for(let [id,c] of conns)if(id!==except&&c.open)c.send(msg)}
 function broadcastRoster(){broadcast({t:'roster',players,difficulty:difficultyId(),left:Object.keys(states).filter(id=>states[id].left)});render()}
 function startRoom(){if(!host||started)return;if(players.length<2){setStatus('다른 플레이어가 들어와야 시작할 수 있습니다.');return}let ids=Object.keys(ManmulThemes.themes);theme=ids[Math.floor(Math.random()*ids.length)];let msg={t:'start',difficulty:difficultyId(),theme};broadcast(msg);launch(msg)}

 // ── 참가자 ──
 async function joinRoom(input){if(peer)return;let c=String(input||'').trim().toUpperCase();if(!/^[A-Z0-9]{5}$/.test(c)){setStatus('방 코드 5자리를 입력해 주세요.');return}setStatus('방에 접속하는 중…');try{peer=await newPeer()}catch(err){fail(err);return}
  selfId=peer.id;code=c;let conn=peer.connect(PREFIX+c,{reliable:true}),opened=false;hostConn=conn;
  let timeout=setTimeout(()=>{if(!opened)fail(new Error('방을 찾지 못했습니다. 코드를 확인해 주세요.'))},10000);
  peer.on('error',err=>{if(err?.type==='peer-unavailable')fail(new Error('방을 찾지 못했습니다. 코드를 확인해 주세요.'));else if(!opened)fail(err)});
  conn.on('open',()=>{opened=true;clearTimeout(timeout);conn.send({t:'hello',name:myName()});setStatus('')});
  conn.on('data',onGuestData);
  conn.on('close',()=>{if(!peer)return;if(started){if(states[conn.peer])states[conn.peer].left=true;setStatus('방장과 연결이 끊겼습니다.');if(typeof notice==='function'&&!inLobby)notice('방장과 연결이 끊겨 멀티 현황이 멈췄습니다')}else{leave();setStatus('방장이 방을 닫았습니다.')}})}
 function onGuestData(msg){if(!msg||typeof msg!=='object')return;
  if(msg.t==='reject'){leave();setStatus(msg.reason||'입장할 수 없습니다.');return}
  if(msg.t==='roster'){players=Array.isArray(msg.players)?msg.players.slice(0,MAX_PLAYERS).map(p=>({id:String(p.id),name:String(p.name).slice(0,12)})):[];for(let id of msg.left||[])if(states[id])states[id].left=true;if(!started&&$('#difficultySelect')&&typeof difficulties==='object'&&Object.hasOwn(difficulties,msg.difficulty)){$('#difficultySelect').value=msg.difficulty;if(typeof renderDifficultyRecord==='function')renderDifficultyRecord()}render();return}
  if(msg.t==='start'){launch(msg);return}
  if(msg.t==='state'){let from=msg.from||(hostConn?.peer);if(from&&from!==selfId){states[from]=sanitizeState(msg.s);seen[from]=Date.now();render()}}}

 // ── 게임 시작·상태 공유 ──
 function launch(msg){if(started)return;started=true;theme=typeof ManmulThemes==='object'&&ManmulThemes.themes[msg.theme]?msg.theme:null;let d=typeof difficulties==='object'&&Object.hasOwn(difficulties,msg.difficulty)?msg.difficulty:'normal';if($('#difficultySelect'))$('#difficultySelect').value=d;for(let p of players)seen[p.id]=Date.now();beginRiftRun(d);stopTimer(stateTimer);stateTimer=every(sendState,STATE_INTERVAL);sendState();render()}
 function snapshot(){let byGrade={};for(let u of units){let g=types[u.type]?.grade;if(g)byGrade[g]=(byGrade[g]||0)+1}let top=ManmulRoster.grades.slice().reverse().find(g=>byGrade[g]);let best=units.map(u=>types[u.type]).filter(Boolean).sort((a,b)=>ManmulRoster.grades.indexOf(b.grade)-ManmulRoster.grades.indexOf(a.grade)).slice(0,3).map(t=>({id:t.id,name:t.name,grade:t.grade}));
  return {name:myName(),wave,maxWave,enemies:enemies.length,gold,units:units.length,topGrade:top||null,best,ended,won:ended&&wave>=maxWave&&enemies.length<=100,test:!!testRun}}
 function sanitizeState(s){s=s&&typeof s==='object'?s:{};let n=(v,max=1e9)=>Number.isFinite(+v)?Math.max(0,Math.min(max,Math.floor(+v))):0;let grades=typeof ManmulRoster==='object'?ManmulRoster.grades:[];return {name:String(s.name||'플레이어').slice(0,12),wave:n(s.wave,999),maxWave:n(s.maxWave,999),enemies:n(s.enemies,9999),gold:n(s.gold),units:n(s.units,999),topGrade:grades.includes(s.topGrade)?s.topGrade:null,best:Array.isArray(s.best)?s.best.slice(0,3).filter(b=>b&&types[b.id]).map(b=>({id:b.id,name:types[b.id].name,grade:types[b.id].grade})):[],ended:!!s.ended,won:!!s.won,test:!!s.test,left:false}}
 let lastSent='';
 function sendState(){if(!started||!peer)return;let s=snapshot(),key=JSON.stringify(s);if(key===lastSent&&Date.now()-lastSentAt<KEEPALIVE)return;lastSent=key;lastSentAt=Date.now();if(host)broadcast({t:'state',from:selfId,s});else if(hostConn?.open)hostConn.send({t:'state',s});render()}

 function leave(){stopTimer(stateTimer);stateTimer=null;try{peer?.destroy()}catch(e){}peer=null;host=false;code='';selfId='';hostConn=null;conns=new Map();players=[];states={};seen={};started=false;theme=null;lastSent='';lastSentAt=0;render()}
 function fail(err){leave();let type=err?.type;setStatus(type==='browser-incompatible'?'이 브라우저는 P2P 연결을 지원하지 않습니다.':type==='network'||type==='server-error'||type==='socket-error'?'중계 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.':err?.message||'연결에 실패했습니다.')}

 // ── 화면 ──
 function renderLobbyBox(){let box=$('#multiBox');if(!box)return;let select=$('#difficultySelect');if(select)select.disabled=!!peer&&!host;let msg=status?`<p class="multi-status" role="status">${esc(status)}</p>`:'';
  if(!peer){box.innerHTML=`<div class="multi-head"><strong>멀티 플레이</strong><small>최대 4명 · 각자 맵에서 같은 전장으로 경쟁</small></div><div class="multi-row"><button type="button" class="multi-primary" onclick="Multiplayer.createRoom()">방 만들기</button><form class="multi-join" onsubmit="event.preventDefault();Multiplayer.joinRoom(this.code.value)"><input name="code" maxlength="5" placeholder="방 코드" autocomplete="off" aria-label="방 코드"><button type="submit">참가</button></form></div>${msg}`;return}
  if(!code||(!host&&!players.length)){box.innerHTML=`<div class="multi-head"><strong>멀티 플레이</strong></div>${msg||'<p class="multi-status">연결 중…</p>'}<div class="multi-row"><button type="button" onclick="Multiplayer.leave()">취소</button></div>`;return}
  let list=players.map(p=>`<li>${p.id===players[0]?.id?'<span class="multi-crown" title="방장">♛</span>':''}${esc(p.name)}${p.id===selfId?' <small>(나)</small>':''}</li>`).join('');
  for(let i=players.length;i<MAX_PLAYERS;i++)list+='<li class="multi-empty">빈 자리</li>';
  box.innerHTML=`<div class="multi-head"><strong>방 코드 <span class="multi-code">${esc(code)}</span></strong><small>${host?'코드를 친구에게 알려 주세요. 난이도는 방장이 정합니다.':'방장이 시작하면 함께 시작됩니다.'}</small></div><ul class="multi-players">${list}</ul><div class="multi-row">${host?`<button type="button" class="multi-primary" onclick="Multiplayer.startRoom()" ${players.length<2?'disabled':''}>함께 시작 (${players.length}명)</button>`:''}<button type="button" onclick="Multiplayer.leave()">나가기</button></div>${msg}`}
 function renderBoard(){let board=$('#multiBoard');if(!board)return;if(!started){board.classList.add('hidden');return}board.classList.remove('hidden');
  let mine=Object.assign(snapshot(),{self:true}),stale=id=>Date.now()-(seen[id]||0)>STALE,others=players.filter(p=>p.id!==selfId).map(p=>Object.assign(states[p.id]?Object.assign({},states[p.id]):{wave:0,maxWave,enemies:0,units:0,best:[],waiting:true},{name:p.name,left:!!states[p.id]?.left||stale(p.id)}));
  for(let id of Object.keys(states))if(!players.some(p=>p.id===id))others.push(Object.assign({},states[id],{left:true}));
  let rank=r=>r.won?0:r.ended||r.left?2:1;
  let rows=[mine,...others].sort((a,b)=>rank(a)-rank(b)||b.wave-a.wave||a.enemies-b.enemies);
  board.innerHTML=`<div class="multi-board-head">멀티 현황 <small>${esc(code)}</small></div>`+rows.map(r=>{let state=r.won?'클리어':r.ended?'탈락':r.left?'연결 끊김':r.waiting?'대기':`${r.wave}/${r.maxWave||maxWave}`,level=r.enemies>=80?'danger':r.enemies>=60?'warn':'safe';
   return `<div class="multi-card${r.self?' is-self':''}${r.ended||r.left?' is-out':''}" data-level="${level}"><div class="multi-card-top"><strong>${esc(r.name)}${r.self?' <small>(나)</small>':''}${r.test?' <small>테스트</small>':''}</strong><span>${state}</span></div><div class="multi-card-bar" aria-hidden="true"><i style="width:${Math.min(100,r.enemies)}%"></i></div><div class="multi-card-meta">몬스터 ${r.enemies} · 유닛 ${r.units}${r.best?.length?' · '+r.best.map(b=>`<span style="color:${typeof gradeColors==='object'?gradeColors[b.grade]||'':''}">${esc(b.name)}</span>`).join(', '):''}</div></div>`}).join('')}
 function render(){renderLobbyBox();renderBoard()}

 if(typeof addEventListener==='function')addEventListener('beforeunload',()=>{try{peer?.destroy()}catch(e){}});
 every(()=>{if(started)renderBoard()},STATE_INTERVAL);
 $('#difficultySelect')?.addEventListener('change',()=>{if(host&&!started)broadcastRoster()});
 render();
 return {createRoom,joinRoom,startRoom,leave,get inRoom(){return !!peer},get isHost(){return host},get started(){return started},get theme(){return started?theme:null}};
})();
