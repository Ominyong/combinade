'use strict';
// 계승의 나무 screen (opened from the title panel): category tabs on top, the category card on the left, the skill
// board in the middle (round node icons joined by arrows, rows 기초·심화·비전), the selected skill's details on the right.
// Data and bonuses live in progression.js (treeNodes, treeCategories, treeBonus). Icons are 9×9 placeholder pixel art.
const treeIcons={
 sword:['......##.','.....###.','....###..','...###...','#.###....','.###.....','..#......','.#.#.....','#........'],
 fist:['..#.#.#..','.#######.','.#######.','.#######.','########.','#######..','.######..','..####...','..####...'],
 orb:['...###...','.##...##.','.#..#..#.','#..###..#','#.#####.#','#..###..#','.#..#..#.','.##...##.','...###...'],
 crown:['.........','#...#...#','##.###.##','#########','#########','#.#.#.#.#','#########','#########','.........'],
 bolt:['.....##..','....##...','...##....','..######.','.....##..','....##...','...##....','..##.....','..#......'],
 flame:['....#....','...##....','...###...','..####.#.','.###.###.','.##...##.','.##...##.','..##.##..','...###...'],
 snow:['....#....','.#..#..#.','..#.#.#..','...###...','#########','...###...','..#.#.#..','.#..#..#.','....#....'],
 shieldBreak:['#########','#...#...#','#...#..##','#..#...##','#...#..#.','.#..#..#.','.#.#..#..','..#..#...','...###...'],
 eye:['.........','...###...','.##...##.','#...#...#','#..###..#','#...#...#','.##...##.','...###...','.........'],
 card:['.#######.','.#.....#.','.#..#..#.','.#.###.#.','.#..#..#.','.#.....#.','.#.....#.','.#######.','.........'],
 cards:['...######','...#....#','.######.#','.#....#.#','.#.##.#.#','.#....###','.#....#..','.######..','.........'],
 bag:['...###...','....#....','..#####..','.##...##.','##..#..##','#..###..#','#...#...#','##.....##','.#######.'],
 coin:['..#####..','.##...##.','##..#..##','#..###..#','#...#...#','#..###..#','##..#..##','.##...##.','..#####..'],
 coins:['..#####..','.#.....#.','..#####..','.#.....#.','..#####..','.#.....#.','..#####..','.#.....#.','..#####..'],
 scale:['....#....','#########','#...#...#','#...#...#','##..#..##','##..#..##','....#....','...###...','.#######.'],
 shard:['....#....','...###...','...#.#...','..##.##..','..#...#..','.##...##.','.#.....#.','..#...#..','...###...'],
 swap:['..#......','.##......','#########','.##......','..#...#..','......##.','#########','......##.','......#..'],
 ticket:['.........','#########','#.......#','..#####..','#.......#','..#####..','#.......#','#########','.........'],
 star:['....#....','....#....','...###...','#########','.#######.','..#####..','..##.##..','.##...##.','.#.....#.'],
 gem:['..#####..','.#.#.#.#.','#########','.#.....#.','..#...#..','...#.#...','....#....','.........','.........'],
 clover:['.##...##.','####.####','####.####','.##.#.##.','...###...','.##.#.##.','####.####','.##...##.','....#....']
};
function treeIconSvg(name,cls='tree-icon'){let rows=treeIcons[name]||treeIcons.star,rects='';rows.forEach((r,y)=>{for(let x=0;x<r.length;x++)if(r[x]==='#')rects+=`<rect x="${x}" y="${y}" width="1" height="1"/>`});return `<svg class="${cls}" viewBox="0 0 9 9" shape-rendering="crispEdges" aria-hidden="true" fill="currentColor">${rects}</svg>`}
const treeState={cat:'combat',node:null};
const treeLayout={left:110,colGap:200,rowTop:120,rowGap:250};
function treeNodePos(n){return {x:treeLayout.left+n.col*treeLayout.colGap,y:treeLayout.rowTop+n.row*treeLayout.rowGap}}
function treeNodesOf(cat){return Object.entries(treeNodes).filter(([,n])=>n.cat===cat)}
function treeBuyableCount(cat){return treeNodesOf(cat).filter(([id])=>treeCanBuy(id)).length}
function treeChildren(id){return Object.entries(treeNodes).filter(([,n])=>(n.requires||[]).some(([r])=>r===id)).map(([cid])=>cid)}
function treeNodeState(id){let n=treeNodes[id],lv=progression.levels[id]||0;return lv>=n.max?'is-max':treeCanBuy(id)?'is-available':!treeRequirementsMet(id)?'is-locked':lv>0?'is-learned':'is-open'}
function treePips(id){let n=treeNodes[id],lv=progression.levels[id]||0;if(n.max>5)return `<span class="tree-pips-num">${lv}/${n.max}</span>`;return Array.from({length:n.max},(_,i)=>`<i class="${i<lv?'on':''}"></i>`).join('')}
function treeNodeLine(id){let n=treeNodes[id],lv=progression.levels[id]||0;if(!treeRequirementsMet(id))return (n.requires||[]).filter(([r,l])=>(progression.levels[r]||0)<l).map(([r,l])=>`${treeNodes[r].name} ${l}단계 필요`).join(' · ');return lv?treeEffectLine(id,lv):`✦ ${treeCost(id)}`}
function treeTabsHtml(){return Object.entries(treeCategories).map(([cat,c])=>{let n=treeBuyableCount(cat);return `<button type="button" class="tree-tab" role="tab" aria-selected="${treeState.cat===cat}" style="--cat:${c.color}" onclick="treeSelectCat('${cat}')"><span class="tree-tab-icon">${treeIconSvg(c.icon)}</span>${c.name}${n?`<b class="tree-badge">${n}</b>`:''}</button>`}).join('')}
function treeCardHtml(){let cat=treeState.cat,c=treeCategories[cat],list=treeNodesOf(cat),learned=list.filter(([id])=>progression.levels[id]>0).length,levels=list.reduce((s,[id])=>s+(progression.levels[id]||0),0),maxLevels=list.reduce((s,[,n])=>s+n.max,0),n=treeBuyableCount(cat);
 let unlocks=list.filter(([,node])=>node.effect.key==='card').map(([id,node])=>{let card=globalThis.ManmulCards?.cards[node.effect.card];if(!card)return '';let on=progression.levels[id]>0,fam=ManmulCards.families[card.family];return `<li class="${on?'is-on':''}" style="--fam:${fam.color}"><b>${card.name}</b><small>${fam.name} · ${ManmulCards.rarities[card.rarity].name} · ${card.description}</small><span>${on?'해금됨':'잠김'}</span></li>`}).join('');
 return `<div class="tree-card" style="--cat:${c.color}"><div class="tree-card-art">${treeIconSvg(c.icon,'tree-card-glyph')}<span class="tree-card-rift"></span></div><div class="tree-card-body"><h3>${c.name}${n?`<b class="tree-badge">${n}</b>`:''}</h3><p class="tree-card-tags">${c.tags}</p><p class="tree-card-flavor">${c.flavor}</p>
 <div class="tree-card-progress"><span>익힌 기술 <b>${learned}/${list.length}</b></span><span>단계 <b>${levels}/${maxLevels}</b></span></div><div class="tree-card-bar"><i style="width:${Math.round(levels/Math.max(1,maxLevels)*100)}%"></i></div>
 <div class="tree-card-icons">${list.map(([id,node])=>`<button type="button" class="${progression.levels[id]>0?'is-on':''}" title="${node.name}" onclick="treeSelectNode('${id}')">${treeIconSvg(node.icon)}</button>`).join('')}</div>
 ${unlocks?`<h4>해금하는 보상 카드</h4><ul class="tree-card-unlocks">${unlocks}</ul>`:''}</div></div>`}
function treeBoardHtml(){let cat=treeState.cat,list=treeNodesOf(cat),lines='';
 for(const [id,n] of list)for(const [req] of n.requires||[]){let p=treeNodes[req];if(!p||p.cat!==cat)continue;let a=treeNodePos(p),b=treeNodePos(n),done=(progression.levels[req]||0)>0&&(progression.levels[id]||0)>0,path;
  if(p.row===n.row&&Math.abs(p.col-n.col)===1)path=`M${a.x+(b.x>a.x?46:-46)} ${a.y} H${b.x+(b.x>a.x?-50:50)}`;else if(p.row===n.row){let top=a.y-58;path=`M${a.x} ${a.y-42} V${top} H${b.x} V${b.y-46}`}else{let mid=a.y+treeLayout.rowGap/2+10;path=`M${a.x} ${a.y+62} V${mid} H${b.x} V${b.y-50}`}
  lines+=`<path class="${done?'is-done':''}" d="${path}" marker-end="url(#treeArrow)"/>`}
 let rows=treeRows.map((r,i)=>`<div class="tree-row" style="top:${treeLayout.rowTop+i*treeLayout.rowGap-treeLayout.rowGap/2+20}px;height:${treeLayout.rowGap}px"><span>${r.split('').join('<br>')}</span></div>`).join('');
 let nodes=list.map(([id,n])=>{let p=treeNodePos(n),st=treeNodeState(id);return `<button type="button" class="tree-node ${st}${treeState.node===id?' is-selected':''}" style="left:${p.x}px;top:${p.y}px" onclick="treeSelectNode('${id}')" aria-label="${n.name}"><span class="tree-node-ring">${treeIconSvg(n.icon)}${st==='is-available'?'<b class="tree-node-plus">+</b>':''}${st==='is-locked'?'<b class="tree-node-lock">잠김</b>':''}</span><span class="tree-node-name">${n.name} <span class="tree-pips">${treePips(id)}</span></span><span class="tree-node-sub">${treeNodeLine(id)}</span></button>`}).join('');
 return `<div class="tree-board-inner">${rows}<svg class="tree-lines" width="100%" height="100%"><defs><marker id="treeArrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L8 4 L0 8 Z"/></marker></defs>${lines}</svg>${nodes}</div>`}
function treeDetailHtml(){let id=treeState.node,n=treeNodes[id];if(!n)return '<p class="tree-empty">기술을 누르면 자세한 내용이 나옵니다.</p>';
 let lv=progression.levels[id]||0,max=lv>=n.max,met=treeRequirementsMet(id),cost=max?0:treeCost(id),can=treeCanBuy(id),c=treeCategories[n.cat];
 let steps=Array.from({length:n.max},(_,i)=>`<li class="${i<lv?'is-done':i===lv?'is-next':''}"><b>${i+1}</b><span>${treeEffectLine(id,i+1)}</span><small>${i<lv?'익힘':`✦ ${treeCost(id,i)}`}</small></li>`).join('');
 if(n.max>6)steps=`<li class="${lv?'is-done':'is-next'}"><b>${lv}</b><span>${lv?treeEffectLine(id,lv):'아직 익히지 않음'}</span><small>현재</small></li>${max?'':`<li class="is-next"><b>${lv+1}</b><span>${treeEffectLine(id,lv+1)}</span><small>✦ ${cost}</small></li>`}<li><b>${n.max}</b><span>${treeEffectLine(id,n.max)}</span><small>최대</small></li>`;
 let reqs=(n.requires||[]).map(([r,l])=>{let ok=(progression.levels[r]||0)>=l;return `<li class="${ok?'is-ok':'is-no'}">${ok?'✓':'✗'} ${treeNodes[r].name} ${l}단계 <button type="button" onclick="treeSelectNode('${r}')">보기</button></li>`}).join('');
 let kids=treeChildren(id).map(k=>`<button type="button" onclick="treeSelectNode('${k}')">${treeIconSvg(treeNodes[k].icon)}${treeNodes[k].name}</button>`).join('');
 let label=max?'모두 익혔습니다':!met?'갖출 것이 부족합니다':progression.shards<cost?`파편이 부족합니다 · ✦ ${cost}`:`길게 눌러 익히기 · ✦ ${cost}`;
 return `<div class="tree-detail" style="--cat:${c.color}"><header><span class="tree-detail-ring">${treeIconSvg(n.icon)}</span><div><h3>${n.name}</h3><small>${c.name} · ${n.sub}</small></div></header><p class="tree-detail-desc">${n.description}</p>
 <h4>달라지는 것</h4><div class="tree-compare"><div><small>지금</small><span>${lv?treeEffectLine(id,lv):'효과 없음'}</span></div><i aria-hidden="true">›</i><div class="is-next"><small>${max?'최대 단계':'익히면'}</small><span>${max?treeEffectLine(id,lv):treeEffectLine(id,lv+1)}</span></div></div>
 <h4>단계 <small>${lv}/${n.max}</small></h4><ol class="tree-steps">${steps}</ol>
 <h4>갖출 것</h4>${reqs?`<ul class="tree-reqs">${reqs}</ul>`:'<p class="tree-ok">✓ 갖출 것 없이 처음부터 익힐 수 있습니다</p>'}
 ${kids?`<h4>이어지는 기술</h4><div class="tree-kids">${kids}</div>`:''}
 <button type="button" class="tree-learn${can?'':' is-disabled'}" ${can?'':'aria-disabled="true"'} onpointerdown="treeHoldStart(event,'${id}')" onpointerup="treeHoldCancel()" onpointerleave="treeHoldCancel()" onclick="if(event.detail===0)treeLearn('${id}')"><span>${label}</span></button></div>`}
function renderTree(){let box=$('#treeScreen');if(!box)return;if(!treeState.node||treeNodes[treeState.node]?.cat!==treeState.cat)treeState.node=treeNodesOf(treeState.cat)[0]?.[0]||null;let c=treeCategories[treeState.cat];
 box.innerHTML=`<header class="tree-head"><button type="button" class="tree-back" onclick="closeTree()">‹ 뒤로</button><h2 class="tree-title" style="--cat:${c.color}"><small>계승의 나무</small>${c.name}</h2><div class="tree-balance"><span>✦</span> 균열의 파편 <strong>${progression.shards}</strong></div><button type="button" class="tree-close" onclick="closeTree()" aria-label="계승의 나무 닫기"><svg viewBox="0 0 7 7" shape-rendering="crispEdges" fill="currentColor" aria-hidden="true"><path d="M0 0h1v1H0zM1 1h1v1H1zM2 2h1v1H2zM3 3h1v1H3zM4 4h1v1H4zM5 5h1v1H5zM6 6h1v1H6zM6 0h1v1H6zM5 1h1v1H5zM4 2h1v1H4zM2 4h1v1H2zM1 5h1v1H1zM0 6h1v1H0z"/></svg></button>
 <nav class="tree-tabs" role="tablist">${treeTabsHtml()}</nav></header><div class="tree-body"><aside class="tree-left">${treeCardHtml()}</aside><section class="tree-board" style="--cat:${c.color}">${treeBoardHtml()}</section><aside class="tree-right">${treeDetailHtml()}</aside></div><p class="tree-toast" id="treeToast" role="status"></p>`}
function openTree(cat){if(cat&&treeCategories[cat])treeState.cat=cat;let box=$('#treeScreen');if(!box)return;renderTree();box.classList.remove('hidden');document.body?.classList?.add('tree-open')}
function closeTree(){$('#treeScreen')?.classList.add('hidden');document.body?.classList?.remove('tree-open');treeHoldCancel();if(typeof renderLobby==='function')renderLobby()}
function treeSelectCat(cat){if(!treeCategories[cat])return;treeState.cat=cat;treeState.node=null;renderTree()}
function treeSelectNode(id){let n=treeNodes[id];if(!n)return;treeState.cat=n.cat;treeState.node=id;renderTree()}
function treeLearn(id){if(!purchaseProgression(id)){let t=$('#treeToast');if(t)t.textContent=progression.levels[id]>=treeNodes[id]?.max?'이미 모두 익혔습니다.':'조건이나 파편을 확인해 주세요.';return false}
 globalThis.ManmulSound?.play?.('reward');treeState.node=id;renderTree();let t=$('#treeToast');if(t){t.textContent=`${treeNodes[id].name} ${progression.levels[id]}단계를 익혔습니다 · 다음 전투부터 적용`;t.classList.add('is-on')}return true}
let treeHoldTimer=null;
function treeHoldStart(e,id){if(e&&e.button>0)return;treeHoldCancel();if(!treeCanBuy(id))return;let btn=e?.currentTarget;btn?.classList?.add('is-holding');treeHoldTimer=setTimeout(()=>{treeHoldTimer=null;btn?.classList?.remove('is-holding');treeLearn(id)},650)}
function treeHoldCancel(){if(treeHoldTimer){clearTimeout(treeHoldTimer);treeHoldTimer=null}for(const b of document.querySelectorAll?.('.tree-learn.is-holding')||[])b.classList.remove('is-holding')}
document.addEventListener?.('keydown',e=>{if(e.key==='Escape'&&!$('#treeScreen')?.classList.contains('hidden')){e.stopImmediatePropagation?.();closeTree()}},true);
// Title panel summary: per-category progress and the button that opens the screen.
function renderTreeSummary(){let box=$('#hubSkills');if(!box)return;let total=Object.keys(treeNodes).reduce((s,id)=>s+(treeCanBuy(id)?1:0),0);
 box.innerHTML=`<div class="tree-summary">${Object.entries(treeCategories).map(([cat,c])=>{let list=treeNodesOf(cat),lv=list.reduce((s,[id])=>s+(progression.levels[id]||0),0),max=list.reduce((s,[,n])=>s+n.max,0);return `<button type="button" class="tree-summary-cat" style="--cat:${c.color}" onclick="openTree('${cat}')"><span class="tree-summary-icon">${treeIconSvg(c.icon)}</span><span>${c.name}</span><span class="tree-summary-bar"><i style="width:${Math.round(lv/Math.max(1,max)*100)}%"></i></span><small>${lv}/${max}</small></button>`}).join('')}</div><button type="button" class="tree-open-btn" onclick="openTree()"><strong>계승의 나무 열기</strong><small>${total?`지금 익힐 수 있는 기술 ${total}개`:'파편을 모아 기술을 익히세요'}</small></button>`}
renderTreeSummary();
