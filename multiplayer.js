// 멀티플레이: 각자 자기 맵에서 플레이하고 상태만 공유한다.
// PeerJS(WebRTC) 별 모양 연결: 방장이 모든 참가자와 연결하고 메시지를 중계한다.
// game.js의 전역(gold, wave, enemies, units, ended 등)을 읽고, 시작은 beginRiftRun()으로 한다.
// 방장이 '방 시계'를 돌려 라운드 시작과 배속을 정한다. 그래서 모두가 같은 순간에 라운드를 시작하고, 전투는 멈추지 않는다.
const Multiplayer=(()=>{
 const MAX_PLAYERS=4,PREFIX='rift-guard-v1-',CODE_CHARS='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',STATE_INTERVAL=1000,KEEPALIVE=3000,STALE=10000,CLOCK_TICK=250,VIEW_INTERVAL=200,CHAT_MAX=80,CHAT_KEEP=50;
 let seen={},lastSentAt=0,peer=null,host=false,code='',selfId='',hostConn=null,conns=new Map(),players=[],states={},started=false,theme=null,status='',stateTimer=null;
 // 방장 전용: 방 시계, 배속 요청, 관전 연결
 let clock=null,clockTimer=null,speedReq={},appliedSpeed=1,watchers={};
 // 모두: 내 배속 요청, 채팅, 관전, 종료 처리
 let mySpeedReq=1,chatLog=[],watching=null,streaming=false,viewTimer=null,localEnd=null,myResultHtml='',finalShown=false,prevEnded={};
 // 안정화: 시작 전 준비 확인, 마지막 방 시계(방장 넘기기에 씀), 방장 메시지 수신 시각, 복구 중 여부
 let pendingRejoin=new Map(),ready={},lastClock=null,lastHostMsgAt=0,recovering=false,lostHostId=null,announce=null,trace=[];
 // 재입장 신원: 방에 들어갈 때 만든 비밀 토큰. 방 명단에는 토큰의 해시만 실어서, 새 방장도 '아까 그 사람'인지 확인할 수 있다.
 let myToken='';
 const newToken=()=>Array.from({length:24},()=>CODE_CHARS[Math.floor(Math.random()*CODE_CHARS.length)]).join('');
 function tokenHash(t){let h=2166136261;for(const ch of String(t||''))h=Math.imul(h^ch.charCodeAt(0),16777619)>>>0;return h.toString(16)}
 const cleanPlayers=list=>Array.isArray(list)?list.slice(0,MAX_PLAYERS).map(p=>({id:String(p.id),name:String(p.name).slice(0,12),hash:String(p.hash||'').slice(0,16)})):[];
 const note=t=>{trace.push(Math.round(now()/100)%100000+" "+t);if(trace.length>60)trace.shift()};
 const HOST_SILENT=8000,RETRY_OLD_HOST=2,CONNECT_TIMEOUT=5000;
 // 테스트처럼 타이머·이벤트가 없는 환경에서도 불러올 수 있게 한다.
 const every=(fn,ms)=>typeof setInterval==='function'?setInterval(fn,ms):null,stopTimer=id=>{if(id!==null&&typeof clearInterval==='function')clearInterval(id)};
 const now=()=>Date.now();
 const $=s=>document.querySelector(s);
 const esc=text=>String(text??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const myName=()=>(typeof playerProfile==='object'&&playerProfile?.name)||'플레이어';
 const nameOf=id=>id===selfId?myName():players.find(p=>p.id===id)?.name||states[id]?.name||'플레이어';
 const randomCode=()=>Array.from({length:5},()=>CODE_CHARS[Math.floor(Math.random()*CODE_CHARS.length)]).join('');
 const difficultyId=()=>{let v=$('#difficultySelect')?.value;return typeof difficulties==='object'&&Object.hasOwn(difficulties,v)?v:'normal'};
 function setStatus(text){status=text;render()}
 function newPeer(id){return new Promise((resolve,reject)=>{if(typeof Peer!=='function'){reject(new Error('PeerJS를 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.'));return}let p=id?new Peer(id):new Peer();p.on('open',()=>resolve(p));p.on('error',err=>reject(err))})}
 function sendToHost(msg){if(host)onHostData({peer:selfId,self:true},msg);else if(hostConn?.open)hostConn.send(msg)}

 // ── 방장 ──
 async function createRoom(){if(peer)return;setStatus('방을 만드는 중…');for(let attempt=0;attempt<3;attempt++){let c=randomCode();try{peer=await newPeer(PREFIX+c);code=c;break}catch(err){if(err?.type!=='unavailable-id'){fail(err);return}}}if(!peer){fail(new Error('방 코드를 만들지 못했습니다.'));return}
  host=true;selfId=peer.id;myToken=newToken();players=[{id:selfId,name:myName(),hash:tokenHash(myToken)}];peer.on('connection',acceptGuest);peer.on('error',err=>setStatus('연결 오류: '+(err?.type||err?.message||err)));peer.on('disconnected',()=>{if(peer&&!peer.destroyed)peer.reconnect()});setStatus('');}
 // 시작 뒤에는 명단에 있던 사람(재연결·방장 넘기기)만 받는다.
 function acceptGuest(conn){conn.on('open',()=>{if(started&&!players.some(p=>p.id===conn.peer)){pendingRejoin.set(conn.peer,conn);setTimeout(()=>{if(pendingRejoin.get(conn.peer)===conn){pendingRejoin.delete(conn.peer);conn.send({t:'reject',reason:'이미 게임이 시작된 방입니다.'});setTimeout(()=>conn.close(),300)}},5000);return}if(!started&&players.length>=MAX_PLAYERS){conn.send({t:'reject',reason:'방이 가득 찼습니다(최대 4명).'});setTimeout(()=>conn.close(),300);return}conns.set(conn.peer,conn);if(started)rejoined(conn.peer)});
  conn.on('data',msg=>{if(pendingRejoin.get(conn.peer)===conn){if(msg?.t==='rejoin')acceptRejoin(conn,msg);return}onHostData(conn,msg)});conn.on('close',()=>dropGuest(conn.peer));conn.on('error',()=>dropGuest(conn.peer))}
 // conn.self: 방장 자신이 보낸 메시지(sendToHost)를 같은 경로로 처리한다.
 function onHostData(conn,msg){if(!msg||typeof msg!=='object'||(!conn.self&&!conns.has(conn.peer)))return;let from=conn.peer;
  if(msg.t==='hello'&&!conn.self){if(players.some(p=>p.id===from)){broadcastRoster();return}let base=String(msg.name||'플레이어').slice(0,10),name=base;for(let i=2;players.some(p=>p.name===name);i++)name=base+i;players.push({id:from,name,hash:String(msg.hash||'').slice(0,16)});ready[from]=false;broadcastRoster();return}
  if(msg.t==='ready'&&!conn.self){if(!started){ready[from]=!!msg.v;broadcastRoster()}return}
  if(msg.t==='state'&&!conn.self){let s=sanitizeState(msg.s);noteState(from,s);broadcast({t:'state',from,s},from);recomputeSpeed();render();return}
  if(msg.t==='speedReq'){speedReq[from]=[1,2,3].includes(msg.v)?msg.v:1;recomputeSpeed();return}
  if(msg.t==='chat'){let text=cleanChat(msg.text);if(!text)return;let line={t:'chat',from,name:nameOf(from),text};broadcast(line);addChat(line);return}
  if(msg.t==='watch'){for(let id of Object.keys(watchers))watchers[id].delete(from);let target=typeof msg.target==='string'&&players.some(p=>p.id===msg.target)&&msg.target!==from?msg.target:null;if(target)(watchers[target]=watchers[target]||new Set()).add(from);updateStreams();return}
  if(msg.t==='view'&&!conn.self){forwardView(from,msg.s);return}}
 function dropGuest(id){if(!peer)return;if(!conns.has(id)&&!players.some(p=>p.id===id))return;conns.delete(id);delete ready[id];for(let t of Object.keys(watchers))watchers[t].delete(id);delete watchers[id];let player=players.find(p=>p.id===id);if(started&&player){if(states[id])states[id].left=true;else states[id]={...sanitizeState({name:player.name}),left:true}}else{players=players.filter(p=>p.id!==id);delete states[id]}broadcastRoster();updateStreams();recomputeSpeed();if(player&&started)systemChat(player.name+' 님이 나갔습니다.');}
 function broadcast(msg,except){for(let [id,c] of conns)if(id!==except&&c.open)c.send(msg)}
 function sendTo(id,msg){if(id===selfId)onGuestData(msg,true);else{let c=conns.get(id);if(c?.open)c.send(msg)}}
 function broadcastRoster(){broadcast({t:'roster',players,ready,difficulty:difficultyId(),left:Object.keys(states).filter(id=>states[id].left)});render()}
 // 재연결한 손님에게 현재 명단·배속·시계를 바로 보낸다.
 function rejoined(id){if(states[id]?.left){states[id].left=false;systemChat(nameOf(id)+' 님이 다시 연결했습니다.')}seen[id]=now();broadcastRoster();recomputeSpeed();if(clock)sendClock();updateStreams()}
 // 새로고침한 사람의 재입장: 토큰 해시가 맞는 명단 자리를 새 연결 ID로 옮겨 준다.
 function acceptRejoin(conn,msg){pendingRejoin.delete(conn.peer);let h=tokenHash(msg.token),p=players.find(x=>x.hash&&x.hash===h);if(!p||p.id===selfId){conn.send({t:'reject',reason:'이 방의 참가자가 아닙니다.'});setTimeout(()=>conn.close(),300);return}
  let old=p.id,id=conn.peer;p.id=id;for(const m of [states,seen,speedReq,ready,prevEnded])if(old in m){m[id]=m[old];delete m[old]}for(const t of Object.keys(watchers))if(watchers[t].delete(old))watchers[t].add(id);if(watchers[old]){watchers[id]=watchers[old];delete watchers[old]}
  conns.delete(old);conns.set(id,conn);if(states[id])states[id].left=false;broadcast({t:'renamed',old,id},id);onGuestData({t:'renamed',old,id},true);conn.send({t:'welcome',players});systemChat(p.name+' 님이 게임에 다시 들어왔습니다.');rejoined(id)}
 const allReady=()=>players.length>=2&&players.every(p=>p.id===selfId||ready[p.id]);
 function startRoom(){if(!host||started)return;if(players.length<2){setStatus('다른 플레이어가 들어와야 시작할 수 있습니다.');return}if(!allReady()){setStatus('모든 참가자가 준비를 눌러야 시작할 수 있습니다.');return}let ids=Object.keys(ManmulThemes.themes);theme=ids[Math.floor(Math.random()*ids.length)];let msg={t:'start',difficulty:difficultyId(),theme,seed:Math.floor(Math.random()*2**31)};broadcast(msg);launch(msg);startClock()}

 // ── 방 시계(방장) ──
 // 첫 라운드는 시작 연출(약 5.5초)과 준비 시간 30초 뒤에 열린다. 시계는 실제 시간 × 공유 배속으로 흐른다.
 function startClock(){let intro=typeof introDuration==='number'?introDuration:5.5,prep=typeof preparation==='number'?preparation:30;clock={t:0,last:now(),wave:0,nextAt:intro+3+prep,lastTick:0};stopTimer(clockTimer);clockTimer=every(tickClock,CLOCK_TICK);tickClock()}
 function tickClock(){if(!clock||!started)return;let t=now();clock.t+=Math.min(2,(t-clock.last)/1000)*appliedSpeed;clock.last=t;let max=typeof maxWave==='number'?maxWave:60,round=typeof roundInterval==='number'?roundInterval:60;
  while(clock.wave<max&&clock.t>=clock.nextAt){clock.wave++;clock.nextAt+=round;sendClock()}
  if(t-clock.lastTick>=1000){clock.lastTick=t;sendClock()}}
 function sendClock(){let msg={t:'clock',n:clock.wave,remain:Math.max(0,clock.nextAt-clock.t)};broadcast(msg);applyClock(msg)}
 function applyClock(msg){if(!started||typeof multiSyncClock!=='function')return;let n=Math.max(0,Math.floor(+msg.n||0)),remain=Math.max(0,+msg.remain||0);lastClock={n,remain,at:now(),speed:appliedSpeed};multiSyncClock(n,remain)}
 // 새 방장이 이어서 돌리는 시계: 마지막으로 받은 라운드와 남은 시간에서, 그 뒤 흐른 시간만큼 뺀다.
 function startClockFrom(c){if(!c){startClock();return}let gone=(now()-c.at)/1000*(c.speed||1);clock={t:0,last:now(),wave:c.n,nextAt:Math.max(0,c.remain-gone),lastTick:0};stopTimer(clockTimer);clockTimer=every(tickClock,CLOCK_TICK);tickClock()}

 // ── 배속 투표 ──
 // 아직 싸우고 있는 모든 플레이어가 원하는 배속 중 가장 낮은 값이 적용된다. 그래서 모두가 원해야 배속이 오른다.
 function activeIds(){return players.map(p=>p.id).filter(id=>id===selfId?!(typeof ended==='boolean'&&ended):!(states[id]?.ended||states[id]?.left))}
 function recomputeSpeed(){if(!host||!started)return;speedReq[selfId]=mySpeedReq;let ids=activeIds(),v=ids.length?Math.min(...ids.map(id=>speedReq[id]||1)):appliedSpeed;appliedSpeed=v;let msg={t:'speed',v,req:Object.fromEntries(ids.map(id=>[id,speedReq[id]||1]))};broadcast(msg);applySpeed(msg)}
 let speedVotes={};
 function applySpeed(msg){appliedSpeed=[1,2,3].includes(msg.v)?msg.v:1;speedVotes=msg.req&&typeof msg.req==='object'?msg.req:{};if(typeof setSharedSpeed==='function')setSharedSpeed(appliedSpeed,speedLabel());let b=$('#speed');if(b)b.title=speedTitle()}
 function speedLabel(){return mySpeedReq!==appliedSpeed?`X${appliedSpeed}→${mySpeedReq}`:`X${appliedSpeed}`}
 function speedTitle(){let ids=Object.keys(speedVotes),want=ids.filter(id=>speedVotes[id]>appliedSpeed).length;return `멀티 배속: 아직 싸우는 모두가 원해야 바뀝니다. 현재 X${appliedSpeed} · `+ids.map(id=>`${nameOf(id)} X${speedVotes[id]}`).join(', ')+(want?` (${want}/${ids.length}명이 더 빠르게 원함)`:'')}
 function cycleSpeedRequest(){mySpeedReq=mySpeedReq%3+1;sendToHost({t:'speedReq',v:mySpeedReq});let b=$('#speed');if(b){b.textContent=speedLabel();b.title=speedTitle()}if(typeof notice==='function')notice(mySpeedReq===appliedSpeed?`배속 X${mySpeedReq}`:`배속 X${mySpeedReq} 요청 · 모두가 원하면 바뀝니다`)}

 // ── 채팅 ──
 function cleanChat(text){return String(text??'').replace(/[\u0000-\u001f]/g,' ').trim().slice(0,CHAT_MAX)}
 function addChat(line){if(!line.system&&line.from!==selfId)globalThis.ManmulSound?.play('chat');chatLog.push({name:String(line.name||'').slice(0,12),text:String(line.text||'').slice(0,CHAT_MAX),system:!!line.system,self:line.from===selfId});if(chatLog.length>CHAT_KEEP)chatLog.shift();renderChat()}
 function systemChat(text){addChat({system:true,text})}
 function sendChat(text){text=cleanChat(text);if(!text||!started)return;sendToHost({t:'chat',text})}
 function renderChat(){let box=$('#multiChat'),log=$('#multiChatLog');if(!box||!log)return;box.classList.toggle('hidden',!started);if(!started)return;log.innerHTML=chatLog.map(l=>l.system?`<p class="chat-system">${esc(l.text)}</p>`:`<p${l.self?' class="chat-self"':''}><strong>${esc(l.name)}</strong> ${esc(l.text)}</p>`).join('');log.scrollTop=log.scrollHeight}

 // ── 관전 ──
 // 보는 사람이 방장에게 대상을 알리면, 방장은 대상에게 화면 전송을 켜고 받은 화면을 보는 사람들에게 넘긴다.
 function watch(id){if(!started)return;if(!id||id===selfId){stopWatching();return}watching=id;if(typeof startSpectate==='function')startSpectate(id,nameOf(id));sendToHost({t:'watch',target:id});render()}
 function stopWatching(){if(watching===null)return;watching=null;sendToHost({t:'watch',target:null});if(typeof spectate!=='undefined'&&spectate&&typeof stopSpectate==='function')stopSpectate();render()}
 function spectateNext(){if(typeof closeModal==='function')closeModal();let target=players.find(p=>p.id!==selfId&&!states[p.id]?.ended&&!states[p.id]?.left)||players.find(p=>p.id!==selfId);if(target)watch(target.id)}
 function updateStreams(){if(!host)return;for(let p of players){let on=!!watchers[p.id]?.size;if(p.id===selfId)setStreaming(on);else sendTo(p.id,{t:'stream',on})}}
 function setStreaming(on){if(on===streaming)return;streaming=on;stopTimer(viewTimer);viewTimer=on?every(sendView,VIEW_INTERVAL):null;if(on)sendView()}
 function mapView(){let r=v=>Math.round(v),kinds=['normal','fast','armor','swarm','miniboss','boss'],levels={};if(typeof gradeLevels==='object')for(let [g,l] of Object.entries(gradeLevels))if(l)levels[g]=l;
  return {wave,maxWave,gold,levels,units:units.slice(0,120).map(u=>[u.id,u.type,r(u.x),r(u.y)]),enemies:enemies.slice(0,150).map(e=>[e.id,r(e.d),r(e.hp),r(e.max),Math.max(0,kinds.indexOf(e.kind)),e.laps||0,e.spawnWave||0])}}
 function sendView(){if(!streaming||!started)return;let s=mapView();if(host)forwardView(selfId,s);else if(hostConn?.open)hostConn.send({t:'view',s})}
 function forwardView(from,s){let set=watchers[from];if(!set?.size)return;for(let id of set)sendTo(id,{t:'view',from,s})}
 function sanitizeView(s){s=s&&typeof s==='object'?s:{};let n=v=>Number.isFinite(+v)?+v:0,levels={};if(s.levels&&typeof s.levels==='object')for(let [g,l] of Object.entries(s.levels))if(typeof ManmulRoster!=='object'||ManmulRoster.grades.includes(g))levels[g]=Math.max(0,Math.min(10,Math.floor(n(l))));
  return {wave:n(s.wave),maxWave:n(s.maxWave),gold:n(s.gold),levels,units:Array.isArray(s.units)?s.units.slice(0,120).filter(u=>Array.isArray(u)&&types[u[1]]).map(u=>[n(u[0]),String(u[1]),n(u[2]),n(u[3])]):[],enemies:Array.isArray(s.enemies)?s.enemies.slice(0,150).filter(Array.isArray).map(e=>e.slice(0,7).map(n)):[]}}

 // ── 참가자 ──
 async function joinRoom(input){if(peer)return;let c=String(input||'').trim().toUpperCase();if(!/^[A-Z0-9]{5}$/.test(c)){setStatus('방 코드 5자리를 입력해 주세요.');return}setStatus('방에 접속하는 중…');try{peer=await newPeer()}catch(err){fail(err);return}
  selfId=peer.id;code=c;listenAsPossibleHost();let conn=peer.connect(PREFIX+c,{reliable:true}),opened=false;hostConn=conn;lastHostMsgAt=now();
  let timeout=setTimeout(()=>{if(!opened)fail(new Error('방을 찾지 못했습니다. 코드를 확인해 주세요.'))},10000);
  // 입장 전의 오류만 실패로 본다. 입장 뒤에는 재연결·방장 넘기기 중의 '상대 없음' 오류가 나와도 시간 초과로 처리한다.
  peer.on('error',err=>{if(opened)return;if(err?.type==='peer-unavailable')fail(new Error('방을 찾지 못했습니다. 코드를 확인해 주세요.'));else fail(err)});
  conn.on('open',()=>{opened=true;clearTimeout(timeout);myToken=newToken();conn.send({t:'hello',name:myName(),hash:tokenHash(myToken)});setStatus('')});
  conn.on('data',msg=>{lastHostMsgAt=now();onGuestData(msg,false)});
  conn.on('close',()=>onHostLost(conn))}
 // 손님의 peer도 연결을 받을 수 있게 해 둔다. 방장 넘기기로 내가 방장이 되면 다른 사람이 여기로 연결한다.
 // 복구 중에 다음 방장 차례인 내게 연결이 오면, 다른 사람은 이미 옛 방장이 나갔다고 판단한 것이므로 바로 방장이 된다.
 // 다른 사람이 '방장이 나갔다'며 내게 연결하면, 내가 판단해서 답한다.
 //  - 나는 아직 방장과 이어져 있다(최근 2.5초 안에 방장 메시지를 받음) → 'host-alive'로 돌려보낸다.
 //  - 내가 다음 방장 차례다 → 바로 방장이 되어 받아들인다.
 //  - 내 차례가 아니다 → 'not-host'로 돌려보낸다.
 function listenAsPossibleHost(){peer.on('connection',c=>{if(host){acceptGuest(c);return}
   c.on('data',msg=>{if(!host&&msg?.t==='rejoin'){c.send({t:'redirect',host:hostConn?.peer||null});setTimeout(()=>c.close(),300);return}if(host||!msg||msg.t!=='hello'||!msg.rejoin||!started)return;let old=lostHostId||msg.old,refuse=reason=>{c.send({t:'reject',reason});setTimeout(()=>c.close(),300)};
    note('incoming '+String(c.peer).slice(0,6)+' rec='+recovering);if(hostConn?.open&&!recovering&&now()-lastHostMsgAt<2500){refuse('host-alive');return}
    if(nextHostCandidates(old)[0]!==selfId){refuse('not-host');return}
    becomeHost(old);conns.set(c.peer,c);c.on('data',m=>onHostData(c,m));c.on('close',()=>dropGuest(c.peer));c.on('error',()=>dropGuest(c.peer));rejoined(c.peer)})});peer.on('disconnected',()=>{if(peer&&!peer.destroyed)peer.reconnect()})}
 function toggleReady(){if(host||started||!hostConn?.open)return;let v=!ready[selfId];ready[selfId]=v;hostConn.send({t:'ready',v});render()}

 // ── 방장 연결이 끊겼을 때 ──
 // 1) 먼저 같은 방장에게 다시 연결해 본다(내 인터넷이 잠깐 끊긴 경우).
 // 2) 안 되면 방장이 나간 것으로 보고, 명단 순서대로 남은 사람 중 첫 번째가 새 방장이 된다. 모두 같은 명단을 갖고 있어서 같은 사람을 고른다.
 // 복구하는 동안은 각자의 타이머로 진행되고(syncActive=false), 새 방장은 마지막 방 시계에서 이어서 돌린다.
 function onHostLost(conn){if(conn&&conn!==hostConn)return;if(!peer)return;if(!started){leave();setStatus('방장이 방을 닫았습니다.');return}if(recovering)return;let old=hostConn?.peer;lostHostId=old;hostConn=null;recovering=true;try{conn?.close?.()}catch(e){}
  systemChat('방장과 연결이 끊겼습니다. 다시 연결하는 중…');if(typeof notice==='function'&&!inLobby)notice('방장과 연결이 끊겨 다시 연결하는 중입니다');render();recoverHost(old)}
 function connectTo(id,ms=CONNECT_TIMEOUT){return new Promise(resolve=>{if(!peer||peer.destroyed){resolve(null);return}let c,done=false,finish=v=>{if(done)return;done=true;if(!v)try{c?.close()}catch(e){}resolve(v)};try{c=peer.connect(id,{reliable:true})}catch(e){finish(null);return}c.on('open',()=>finish(c));c.on('error',()=>finish(null));setTimeout(()=>finish(null),ms)})}
 function nextHostCandidates(old){return players.filter(p=>p.id!==old&&!states[p.id]?.left).map(p=>p.id)}
 async function recoverHost(old){note("recover "+String(old).slice(0,6));for(let i=0;i<RETRY_OLD_HOST&&old;i++){let c=await connectTo(old);note("old "+i+" "+!!c);if(!peer||host)return;if(c){adoptHost(c,old,true);return}}
  if(old){states[old]={...(states[old]||sanitizeState({name:nameOf(old)})),left:true};systemChat(nameOf(old)+' 님(방장)이 나갔습니다.')}
  // 후보에게 한 번 실패했다고 바로 건너뛰면 방장이 둘이 될 수 있어서, 세 번까지 다시 시도한다.
  note("cands "+players.map(p=>p.id.slice(0,4)+(states[p.id]?.left?"L":"")).join(",")+" self="+selfId.slice(0,4));
  for(const id of nextHostCandidates(old)){if(id===selfId){becomeHost(old);return}let c=null;for(let k=0;k<3&&!c;k++){c=await connectTo(id,CONNECT_TIMEOUT+3000);note("cand "+id.slice(0,6)+" "+k+" "+!!c);if(!peer||host)return}if(c){adoptHost(c,id,false);return}states[id]={...(states[id]||sanitizeState({name:nameOf(id)})),left:true}}
  recovering=false;systemChat('다른 플레이어와 연결할 수 없어 혼자 진행합니다.');render()}
 function adoptHost(c,id,same){hostConn=c;lastHostMsgAt=now();c.on('data',msg=>{if(c!==hostConn)return;lastHostMsgAt=now();onGuestData(msg,false)});c.on('close',()=>onHostLost(c));c.send({t:'hello',name:myName(),rejoin:true,old:lostHostId});if(mySpeedReq!==1)c.send({t:'speedReq',v:mySpeedReq});if(watching)c.send({t:'watch',target:watching});recovering=false;announce=same?'방장과 다시 연결되었습니다.':nameOf(id)+' 님이 새 방장이 되었습니다.';render()}
 // 연결한 상대가 '방장 살아 있음/내 차례 아님'으로 돌려보내면, 잠시 뒤 처음부터 다시 복구한다(남은 사람으로 표시하지 않는다).
 function candidateRefused(){note("refused");let c=hostConn;hostConn=null;recovering=true;announce=null;try{c?.close()}catch(e){}setTimeout(()=>{if(peer&&!host&&recovering)recoverHost(lostHostId)},1500)}
 function becomeHost(old){if(host)return;note("becomeHost");host=true;recovering=false;hostConn=null;conns=new Map();watchers={};speedReq={};players=[...players.filter(p=>p.id===selfId),...players.filter(p=>p.id!==selfId)];if(old)states[old]={...sanitizeState({name:nameOf(old)}),...states[old],left:true};startClockFrom(lastClock);recomputeSpeed();systemChat('방장이 나가서 내가 새 방장이 되었습니다.');if(typeof notice==='function'&&!inLobby)notice('내가 새 방장이 되었습니다');render()}
 // local: 방장이 자기 자신에게 보낸 메시지(sendTo)
 function onGuestData(msg,local){if(!msg||typeof msg!=='object')return;
  if(msg.t==='reject'&&!local){if(started&&(msg.reason==='host-alive'||msg.reason==='not-host')){candidateRefused();return}leave();setStatus(msg.reason||'입장할 수 없습니다.');return}
  if(announce&&!local&&(msg.t==='roster'||msg.t==='clock'||msg.t==='speed')){systemChat(announce);announce=null}
  if(msg.t==='roster'&&!local){players=cleanPlayers(msg.players);let left=Array.isArray(msg.left)?msg.left:[];for(let id of Object.keys(states))states[id].left=left.includes(id);ready=msg.ready&&typeof msg.ready==='object'?{...msg.ready}:{};if(!started&&$('#difficultySelect')&&typeof difficulties==='object'&&Object.hasOwn(difficulties,msg.difficulty)){$('#difficultySelect').value=msg.difficulty;if(typeof renderDifficultyRecord==='function')renderDifficultyRecord()}render();return}
  if(msg.t==='start'&&!local){launch(msg);return}
  if(msg.t==='state'&&!local){let from=msg.from||(hostConn?.peer);if(from&&from!==selfId){noteState(from,sanitizeState(msg.s));render()}return}
  if(msg.t==='clock'&&!local){applyClock(msg);return}
  if(msg.t==='speed'&&!local){applySpeed(msg);return}
  if(msg.t==='chat'&&!local){addChat({from:msg.from,name:String(msg.name||''),text:cleanChat(msg.text)});return}
  if(msg.t==='renamed'){let {old,id}=msg;if(!old||!id||old===id)return;for(const m of [states,seen,prevEnded])if(old in m){m[id]=m[old];delete m[old]}if(watching===old){watching=id;if(typeof spectate!=='undefined'&&spectate?.id===old)spectate.id=id}render();return}
  if(msg.t==='stream'){setStreaming(!!msg.on);return}
  if(msg.t==='view'){if(msg.from&&msg.from===watching&&typeof setSpectateView==='function')setSpectateView(msg.from,sanitizeView(msg.s));return}}

 // ── 게임 시작·상태 공유 ──
 function launch(msg){if(started)return;started=true;theme=typeof ManmulThemes==='object'&&ManmulThemes.themes[msg.theme]?msg.theme:null;let d=typeof difficulties==='object'&&Object.hasOwn(difficulties,msg.difficulty)?msg.difficulty:'normal';if($('#difficultySelect'))$('#difficultySelect').value=d;for(let p of players)seen[p.id]=now();
  if(typeof setBossOrderSeed==='function')setBossOrderSeed(Number.isFinite(msg.seed)?msg.seed:NaN);
  mySpeedReq=1;appliedSpeed=1;speedReq={};chatLog=[];localEnd=null;myResultHtml='';finalShown=false;prevEnded={};
  beginRiftRun(d);if(typeof setSharedSpeed==='function')setSharedSpeed(1);stopTimer(stateTimer);stateTimer=every(sendState,STATE_INTERVAL);sendState();systemChat('게임이 시작되었습니다. 라운드는 모두 함께 시작합니다.');render()}
 function noteState(id,s){let was=prevEnded[id];states[id]=s;seen[id]=now();if(s.ended&&!was){prevEnded[id]=true;systemChat(`${s.name} 님이 ${s.won?'클리어했습니다!':'탈락했습니다.'}`)}checkFinal()}
 function snapshot(){let byGrade={};for(let u of units){let g=types[u.type]?.grade;if(g)byGrade[g]=(byGrade[g]||0)+1}let top=ManmulRoster.grades.slice().reverse().find(g=>byGrade[g]);let best=units.map(u=>types[u.type]).filter(Boolean).sort((a,b)=>ManmulRoster.grades.indexOf(b.grade)-ManmulRoster.grades.indexOf(a.grade)).slice(0,3).map(t=>({id:t.id,name:t.name,grade:t.grade}));
  return {name:myName(),mapSkin:playerProfile.mapSkin,wave,maxWave,enemies:enemies.length,gold,units:units.length,topGrade:top||null,best,ended,won:localEnd==='won'||(ended&&wave>=maxWave&&enemies.length===0),test:!!testRun}}
 function sanitizeState(s){s=s&&typeof s==='object'?s:{};let n=(v,max=1e9)=>Number.isFinite(+v)?Math.max(0,Math.min(max,Math.floor(+v))):0;let grades=typeof ManmulRoster==='object'?ManmulRoster.grades:[];return {name:String(s.name||'플레이어').slice(0,12),mapSkin:typeof mapSkins==='object'&&Object.hasOwn(mapSkins,s.mapSkin)?s.mapSkin:'forest',wave:n(s.wave,999),maxWave:n(s.maxWave,999),enemies:n(s.enemies,9999),gold:n(s.gold),units:n(s.units,999),topGrade:grades.includes(s.topGrade)?s.topGrade:null,best:Array.isArray(s.best)?s.best.slice(0,3).filter(b=>b&&types[b.id]).map(b=>({id:b.id,name:types[b.id].name,grade:types[b.id].grade})):[],ended:!!s.ended,won:!!s.won,test:!!s.test,left:false}}
 let lastSent='';
 function sendState(force){if(!started||!peer)return;let s=snapshot(),key=JSON.stringify(s);if(!force&&key===lastSent&&now()-lastSentAt<KEEPALIVE)return;lastSent=key;lastSentAt=now();if(host){broadcast({t:'state',from:selfId,s});recomputeSpeed()}else if(hostConn?.open)hostConn.send({t:'state',s});render()}

 // ── 끝난 뒤 ──
 // 먼저 끝난 사람은 결과를 보거나 관전하며 기다리고, 모두 끝나면 최종 순위가 나온다.
 const stale=id=>now()-(seen[id]||0)>STALE;
 function othersPlaying(){return players.some(p=>p.id!==selfId&&!states[p.id]?.ended&&!states[p.id]?.left&&!stale(p.id))}
 function onLocalEnd(won){if(!started||localEnd)return;localEnd=won?'won':'lost';myResultHtml=$('#modalContent')?.innerHTML||'';sendState(true);systemChat(won?'클리어했습니다!':'탈락했습니다.');
  if(won&&othersPlaying()){$('#modalContent').innerHTML=waitingHtml();$('#modal')?.classList.remove('hidden')}
  else addSpectateButton();
  checkFinal()}
 function waitingHtml(){return `${typeof modalOpen==='function'?modalOpen({eyebrow:'CLEAR',title:'클리어!',variant:'result-modal'}):''}<p class="ui-modal-lead">다른 플레이어가 아직 싸우고 있습니다. 모두 끝나면 최종 순위가 나옵니다.</p><div class="multi-final-actions"><button type="button" class="ui-btn-primary" onclick="Multiplayer.spectateNext()">관전하기</button><button type="button" class="ui-btn-ghost" onclick="Multiplayer.showMyResult()">내 결과 보기</button></div>${typeof modalClose==='function'?modalClose():''}`}
 function addSpectateButton(){let foot=$('#modalContent .ui-modal-foot');if(!foot||foot.querySelector?.('.multi-spectate'))return;if(!othersPlaying())return;foot.insertAdjacentHTML?.('afterbegin','<button type="button" class="ui-btn-ghost multi-spectate" onclick="Multiplayer.spectateNext()">관전하기</button>');myResultHtml=$('#modalContent').innerHTML}
 function showMyResult(){if(!myResultHtml)return;stopWatching();$('#modalContent').innerHTML=myResultHtml;$('#modal')?.classList.remove('hidden')}
 function checkFinal(){if(finalShown||!started||!localEnd||othersPlaying())return;finalShown=true;stopWatching();
  let rows=[{...snapshot(),name:myName(),self:true},...players.filter(p=>p.id!==selfId).map(p=>({...(states[p.id]||{wave:0}),name:p.name,left:!!states[p.id]?.left}))].sort((a,b)=>(b.won-a.won)||(b.wave-a.wave)||((a.enemies||0)-(b.enemies||0)));
  let list=rows.map((r,i)=>`<li class="${r.self?'is-self':''}"><b>${i+1}위</b> ${esc(r.name)}${r.self?' (나)':''} <span>${r.won?'클리어':r.left&&!r.ended?'연결 끊김':`${r.wave}라운드 탈락`}</span></li>`).join('');
  $('#modalContent').innerHTML=`${typeof modalOpen==='function'?modalOpen({eyebrow:'MULTIPLAYER',title:'최종 순위',variant:'result-modal'}):''}<ol class="multi-final">${list}</ol>${typeof modalClose==='function'?modalClose('<button type="button" class="ui-btn-ghost" onclick="Multiplayer.showMyResult()">내 결과 보기</button><button type="button" class="ui-btn-primary" onclick="location.reload()">로비로</button>'):''}`;
  $('#modal')?.classList.remove('hidden');systemChat('모든 플레이어가 끝났습니다.')}

 // 나가는 쪽은 아무것도 보내지 않는다. 연결이 닫히며 부르는 dropGuest가 남은 사람에게 "다른 손님이 나갔다"는 명단을 보내면,
 // 그 손님이 다음 방장 후보에서 빠져 방장이 둘이 될 수 있다.
// ── 새로고침 뒤 재입장 ──
 // 저장(save.js)에 함께 넣는 방 정보: 방장 ID, 명단(해시 포함), 내 토큰, 테마·난이도, 마지막 방 시계.
 function roomSnapshot(){if(!started)return null;return {code,hostId:host?selfId:hostConn?.peer||lostHostId,selfId,token:myToken,players:players.map(p=>({...p})),theme,lastClock:lastClock&&{...lastClock},speedReq:mySpeedReq,chat:chatLog.slice(-15)}}
 // 마지막 방장 → 명단의 다른 사람 순서로 연결해 본다. 방장이 아닌 사람은 지금 방장을 알려 준다(redirect).
 // 방장이 토큰을 확인하고 'welcome'을 보내면 restore()로 게임 상태를 되살리고 방에 합류한다. 그동안 지나간 라운드의 적은 건너뛴다.
 async function rejoin(room,restore){if(peer||!room?.token)return false;setStatus('멀티 게임에 다시 연결하는 중…');try{peer=await newPeer()}catch(err){fail(err);return false}
  selfId=peer.id;myToken=room.token;code=room.code||'';listenAsPossibleHost();peer.on('error',()=>{});
  let tried=new Set(),queue=[room.hostId,...(room.players||[]).map(p=>p.id).filter(id=>id!==room.selfId&&id!==room.hostId)].filter(Boolean);
  while(queue.length){let id=queue.shift();if(tried.has(id))continue;tried.add(id);let c=await connectTo(id);if(!peer)return false;if(!c)continue;
   let reply=await new Promise(res=>{let done=false,fin=v=>{if(!done){done=true;res(v)}};c.on('data',m=>{if(m?.t==='welcome'||m?.t==='redirect'||m?.t==='reject')fin(m)});c.on('close',()=>fin(null));setTimeout(()=>fin(null),6000);c.send({t:'rejoin',token:myToken,name:myName(),old:room.selfId})});
   if(reply?.t==='redirect'){try{c.close()}catch(e){}if(reply.host&&!tried.has(reply.host))queue.unshift(reply.host);continue}
   if(reply?.t!=='welcome'){try{c.close()}catch(e){}continue}
   players=cleanPlayers(reply.players);theme=room.theme||null;lastClock=room.lastClock||null;mySpeedReq=[1,2,3].includes(room.speedReq)?room.speedReq:1;chatLog=Array.isArray(room.chat)?room.chat.slice(-15):[];
   if(typeof restore==='function'&&!restore())return failRejoin('저장된 게임을 불러오지 못했습니다.');
   started=true;localEnd=null;finalShown=false;hostConn=c;lastHostMsgAt=now();c.on('data',m=>{if(c!==hostConn)return;lastHostMsgAt=now();onGuestData(m,false)});c.on('close',()=>onHostLost(c));
   for(let p of players)seen[p.id]=now();if(mySpeedReq!==1)c.send({t:'speedReq',v:mySpeedReq});stopTimer(stateTimer);stateTimer=every(sendState,STATE_INTERVAL);sendState(true);setStatus('');systemChat('게임에 다시 들어왔습니다. 그동안 지나간 라운드의 적은 건너뜁니다.');render();return true}
  return failRejoin('방을 찾지 못했습니다. 게임이 끝났거나 모두 나간 것 같습니다.')}
 function failRejoin(text){leave();setStatus(text);return false}
 function leave(){stopTimer(stateTimer);stopTimer(clockTimer);stopTimer(viewTimer);stateTimer=clockTimer=viewTimer=null;let old=peer;peer=null;conns=new Map();hostConn=null;try{old?.destroy()}catch(e){}host=false;code='';selfId='';players=[];states={};seen={};started=false;theme=null;lastSent='';lastSentAt=0;clock=null;speedReq={};appliedSpeed=1;watchers={};mySpeedReq=1;chatLog=[];watching=null;streaming=false;localEnd=null;myResultHtml='';finalShown=false;prevEnded={};ready={};lastClock=null;lastHostMsgAt=0;recovering=false;lostHostId=null;announce=null;myToken='';pendingRejoin=new Map();if(typeof setBossOrderSeed==='function')setBossOrderSeed(NaN);render()}
 function fail(err){leave();let type=err?.type;setStatus(type==='browser-incompatible'?'이 브라우저는 P2P 연결을 지원하지 않습니다.':type==='network'||type==='server-error'||type==='socket-error'?'중계 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.':err?.message||'연결에 실패했습니다.')}

 // ── 화면 ──
 function renderLobbyBox(){let box=$('#multiBox');if(!box)return;let select=$('#difficultySelect');if(select)select.disabled=!!peer&&!host;let msg=status?`<p class="multi-status" role="status">${esc(status)}</p>`:'';
  if(!peer){box.innerHTML=`<div class="multi-head"><strong>멀티 플레이</strong><small>최대 4명 · 각자 맵에서 같은 전장으로 경쟁</small></div><div class="multi-row"><button type="button" class="multi-primary" onclick="Multiplayer.createRoom()">방 만들기</button><form class="multi-join" onsubmit="event.preventDefault();Multiplayer.joinRoom(this.code.value)"><input name="code" maxlength="5" placeholder="방 코드" autocomplete="off" aria-label="방 코드"><button type="submit">참가</button></form></div>${msg}`;return}
  if(!code||(!host&&!players.length)){box.innerHTML=`<div class="multi-head"><strong>멀티 플레이</strong></div>${msg||'<p class="multi-status">연결 중…</p>'}<div class="multi-row"><button type="button" onclick="Multiplayer.leave()">취소</button></div>`;return}
  let list=players.map(p=>`<li>${p.id===players[0]?.id?'<span class="multi-crown" title="방장">♛</span>':''}${esc(p.name)}${p.id===selfId?' <small>(나)</small>':''}${p.id===players[0]?.id?'':ready[p.id]?' <span class="multi-ready is-on">준비</span>':' <span class="multi-ready">대기</span>'}</li>`).join('');
  for(let i=players.length;i<MAX_PLAYERS;i++)list+='<li class="multi-empty">빈 자리</li>';
  box.innerHTML=`<div class="multi-head"><strong>방 코드 <span class="multi-code">${esc(code)}</span></strong><small>${host?'코드를 친구에게 알려 주세요. 난이도는 방장이 정하고, 모두 준비하면 시작할 수 있습니다.':'준비를 누르면 방장이 시작할 수 있습니다.'}</small></div><ul class="multi-players">${list}</ul><div class="multi-row">${host?`<button type="button" class="multi-primary" onclick="Multiplayer.startRoom()" ${allReady()?'':'disabled'} title="${players.length<2?'다른 플레이어를 기다리는 중':allReady()?'':'모든 참가자가 준비해야 시작할 수 있습니다'}">함께 시작 (${players.length}명)</button>`:`<button type="button" class="${ready[selfId]?'':'multi-primary'}" onclick="Multiplayer.toggleReady()">${ready[selfId]?'준비 취소':'준비'}</button>`}<button type="button" onclick="Multiplayer.leave()">나가기</button></div>${msg}`}
 function renderBoard(){let board=$('#multiBoard');if(!board)return;if(!started){board.classList.add('hidden');return}board.classList.remove('hidden');
  let mine=Object.assign(snapshot(),{self:true,id:selfId}),others=players.filter(p=>p.id!==selfId).map(p=>Object.assign(states[p.id]?Object.assign({},states[p.id]):{wave:0,maxWave,enemies:0,units:0,best:[],waiting:true},{id:p.id,name:p.name,left:!!states[p.id]?.left||stale(p.id)}));
  for(let id of Object.keys(states))if(!players.some(p=>p.id===id))others.push(Object.assign({},states[id],{id,left:true}));
  let rank=r=>r.won?0:r.ended||r.left?2:1;
  let rows=[mine,...others].sort((a,b)=>rank(a)-rank(b)||b.wave-a.wave||a.enemies-b.enemies);
  board.innerHTML=`<div class="multi-board-head">멀티 현황 <small>${esc(code)}</small></div>`+rows.map(r=>{let state=r.won?'클리어':r.ended?'탈락':r.left?'연결 끊김':r.waiting?'대기':`${r.wave}/${r.maxWave||maxWave}`,level=r.enemies>=80?'danger':r.enemies>=60?'warn':'safe';
   let skin=typeof mapSkins==='object'&&Object.hasOwn(mapSkins,r.mapSkin)?r.mapSkin:'forest',skinImage=skin==='forest'?'assets/ui/ancient-ruins-v1/outer-ground.webp':`assets/ui/map-skins/${skin}.webp`;
   let action=r.self?(watching?'<button type="button" class="multi-watch" onclick="Multiplayer.stopWatching()">내 맵</button>':''):r.left?'':`<button type="button" class="multi-watch${watching===r.id?' is-on':''}" onclick="Multiplayer.watch('${esc(r.id)}')">${watching===r.id?'관전 중':'관전'}</button>`;
   return `<div class="multi-card${r.self?' is-self':''}${r.ended||r.left?' is-out':''}${watching===r.id?' is-watched':''}" data-level="${level}"><div class="multi-card-top"><strong>${esc(r.name)}${r.self?' <small>(나)</small>':''}${r.test?' <small>테스트</small>':''}</strong><span>${state}</span></div><div class="multi-card-skin"><img src="${skinImage}" alt=""><span>${esc(typeof mapSkins==='object'?mapSkins[skin]:'')}</span></div><div class="multi-card-bar" aria-hidden="true"><i style="width:${Math.min(100,r.enemies)}%"></i></div><div class="multi-card-meta">몬스터 ${r.enemies} · 유닛 ${r.units}${r.best?.length?' · '+r.best.map(b=>`<span style="color:${typeof gradeColors==='object'?gradeColors[b.grade]||'':''}">${esc(b.name)}</span>`).join(', '):''}</div>${action}</div>`}).join('')}
 function render(){renderLobbyBox();renderBoard();renderChat()}

 // 채팅 입력: Enter로 입력창을 열고 보내며, Esc로 닫는다. 입력 중에는 게임 단축키가 막힌다(game.js keydown).
 $('#multiChatForm')?.addEventListener?.('submit',e=>{e.preventDefault();let input=$('#multiChatInput');sendChat(input.value);input.value='';input.blur()});
 $('#multiChatInput')?.addEventListener?.('keydown',e=>{if(e.key==='Escape'){e.target.value='';e.target.blur()}});
 if(typeof addEventListener==='function'){addEventListener('beforeunload',()=>leave());document.addEventListener?.('keydown',e=>{if(!started||e.key!=='Enter'||e.target?.closest?.('input,textarea,form,button,select'))return;let input=$('#multiChatInput');if(input){e.preventDefault();input.focus()}})}
 every(()=>{if(started){if(!host&&hostConn&&!recovering&&now()-lastHostMsgAt>HOST_SILENT)onHostLost(hostConn);renderBoard();checkFinal()}},STATE_INTERVAL);
 $('#difficultySelect')?.addEventListener('change',()=>{if(host&&!started)broadcastRoster()});
 render();
 return {createRoom,joinRoom,startRoom,leave,toggleReady,rejoin,roomSnapshot,watch,stopWatching,spectateNext,showMyResult,cycleSpeedRequest,sendChat,onLocalEnd,
  get inRoom(){return !!peer},get isHost(){return host},get started(){return started},get theme(){return started?theme:null},
  // 방장이 시계를 돌리는 동안(방장 자신이거나 방장과 연결된 동안)만 라운드·배속을 방에 맞춘다.
  get syncActive(){return started&&!recovering&&(host||!!hostConn?.open)},get recovering(){return recovering},get speed(){return appliedSpeed},
  // 테스트 전용: 네트워크 없이 방 상태를 흉내 낸다.
  _test:{launch(msg,list,self,isHost=true){players=list;selfId=self;host=isHost;peer={destroy(){}};code='TEST1';launch(msg)},onHostData:(from,msg)=>{if(from!==selfId&&!conns.has(from))conns.set(from,{open:false,send(){}});onHostData({peer:from,self:from===selfId},msg)},onGuestData:msg=>onGuestData(msg,false),get chat(){return chatLog},get clock(){return clock},startClock,tickClock,get conns(){return conns},set hostConn(c){hostConn=c},noteState,get watchers(){return watchers},get ready(){return ready},allReady,get players(){return players},get states(){return states},nextHostCandidates,becomeHost,set lastClock(c){lastClock=c},connectTo:(id,ms)=>connectTo(id,ms),get trace(){return trace},get peerState(){return peer?{open:!!peer.open,disconnected:!!peer.disconnected,destroyed:!!peer.destroyed}:null},get selfId(){return selfId},get isHostNow(){return host},rejoined,acceptRejoin,tokenHash,set myToken(t){myToken=t},get pendingRejoin(){return pendingRejoin}}};
})();
