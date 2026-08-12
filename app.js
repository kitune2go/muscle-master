const STORAGE_KEY = 'muscleMasterStateV1';

const exercises = [
  { id:'squat', kind:'脚・お尻', name:'スクワット', target:'10〜15回 × 3セット', sets:3, stats:{ strength:3, endurance:1 } },
  { id:'pushup', kind:'胸・腕・肩', name:'プッシュアップ', target:'10〜20回 × 3セット', sets:3, stats:{ strength:3, endurance:1 } },
  { id:'bridge', kind:'お尻・もも裏', name:'グルートブリッジ', target:'10〜15回 × 3セット', sets:3, stats:{ strength:2, core:1 } },
  { id:'crunch', kind:'腹筋', name:'クランチ', target:'15〜20回 × 3セット', sets:3, stats:{ core:3 } },
  { id:'plank', kind:'体幹', name:'プランク', target:'20〜60秒 × 3セット', sets:3, stats:{ core:3, endurance:1 } },
  { id:'mobility', kind:'柔軟・可動域', name:'クネクネ＆ストレッチ', target:'約3〜5分', sets:1, stats:{ mobility:4 } },
  { id:'neck', kind:'首・僧帽筋', name:'ネックアイソメトリック', target:'各方向 5〜10秒 × 2セット', sets:2, stats:{ strength:1, core:1 } }
];

const defaultState = {
  userName:'', trainerName:'', days:{}, totalSets:0,
  stats:{ strength:0, core:0, mobility:0, endurance:0 }
};

function cloneDefault(){ return JSON.parse(JSON.stringify(defaultState)); }
function todayKey(date = new Date()){
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
function loadState(){
  try { return { ...cloneDefault(), ...JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}') }; }
  catch { return cloneDefault(); }
}
let state = loadState();
state.stats = { ...defaultState.stats, ...(state.stats||{}) };
state.days ||= {};
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

function ensureDay(key=todayKey()){
  state.days[key] ||= {};
  for(const ex of exercises){
    if(!Array.isArray(state.days[key][ex.id]) || state.days[key][ex.id].length !== ex.sets){
      const old = Array.isArray(state.days[key][ex.id]) ? state.days[key][ex.id] : [];
      state.days[key][ex.id] = Array.from({length:ex.sets},(_,i)=>Boolean(old[i]));
    }
  }
  return state.days[key];
}
function completedSetsForDay(day){
  return Object.values(day||{}).reduce((sum,sets)=>sum+(Array.isArray(sets)?sets.filter(Boolean).length:0),0);
}
function requiredSets(){ return exercises.reduce((sum,e)=>sum+e.sets,0); }
function getProgress(day=ensureDay()){ return Math.round(completedSetsForDay(day)/requiredSets()*100); }
function getStreak(){
  let streak=0; const cursor=new Date();
  while(true){
    const done=completedSetsForDay(state.days[todayKey(cursor)]);
    if(done===0) break;
    streak++; cursor.setDate(cursor.getDate()-1);
  }
  return streak;
}
function xp(){ return Math.max(0,state.totalSets*10); }
function level(){ return Math.floor(xp()/100)+1; }
function levelProgress(){ return xp()%100; }
function trainerMessage(progress){
  const user=state.userName||'あなた';
  if(progress===0) return `${user}、今日は1セットから。最初の一歩がいちばん強いわ。`;
  if(progress<30) return `いいスタート、${user}。フォームを崩さず、この調子。`;
  if(progress<60) return `${user}、身体が起きてきたわ。呼吸も忘れずにね。`;
  if(progress<90) return `ここまで来たら十分立派。残りは体調と相談していきましょう。`;
  if(progress<100) return `あと少し！ 追い込みより、きれいな1セットを。`;
  return `全クエスト完了！ ${user}、本日の育成は大成功よ。回復までがトレーニング！`;
}
function addStats(ex,direction){
  for(const [key,amount] of Object.entries(ex.stats)) state.stats[key]=Math.max(0,Math.min(100,(state.stats[key]||0)+amount*direction));
}
function firstIncomplete(){
  const day=ensureDay();
  for(const ex of exercises){ const idx=day[ex.id].findIndex(v=>!v); if(idx!==-1) return {ex,index:idx}; }
  return null;
}
function formatDate(key){
  const d=new Date(`${key}T00:00:00`);
  return new Intl.DateTimeFormat('ja-JP',{month:'short',day:'numeric',weekday:'short'}).format(d);
}

function setBar(id,value){ const el=document.querySelector(id); if(el) el.style.width=`${Math.max(0,Math.min(100,value))}%`; }

function renderHome(){
  const day=ensureDay(); const progress=getProgress(day); const lv=level();
  document.querySelector('#progressText').textContent=`${progress}%`;
  document.querySelector('#streakText').textContent=getStreak();
  document.querySelector('#totalSetsText').textContent=state.totalSets;
  document.querySelector('#trainerName').textContent=state.trainerName||'トレーナー';
  document.querySelector('#trainerMessage').textContent=trainerMessage(progress);
  document.querySelector('#levelText').textContent=`LV. ${lv}`;
  document.querySelector('#xpText').textContent=`${xp()} XP`;
  document.querySelector('#heroTitle').innerHTML=state.userName ? `${escapeHtml(state.userName)}を<br><em>1段階</em>アップデート。` : `今日の自分を<br><em>1段階</em>アップデート。`;

  const quick=document.querySelector('#quickQuest');
  const next=firstIncomplete();
  if(!next){
    quick.innerHTML='<div class="quick-item"><div><strong>本日のクエスト完了</strong><span>今日は回復まで含めて育成です。</span></div><button data-tab-link="status">成長を見る</button></div>';
  }else{
    quick.innerHTML=`<div class="quick-item"><div><strong>${next.ex.name} · SET ${next.index+1}</strong><span>${next.ex.kind}｜${next.ex.target}</span></div><button data-quick="${next.ex.id}" data-index="${next.index}">完了する</button></div>`;
  }
}

function renderQuest(){
  const day=ensureDay(); const progress=getProgress(day);
  document.querySelector('#userHeading').textContent=state.userName?`${state.userName}の今日のトレーニング`:'今日のトレーニング';
  setBar('#progressBar',progress);
  const list=document.querySelector('#exerciseList'); list.innerHTML='';
  const template=document.querySelector('#exerciseTemplate');
  exercises.forEach((ex,exIndex)=>{
    const node=template.content.cloneNode(true);
    node.querySelector('.exercise-number').textContent=String(exIndex+1).padStart(2,'0');
    node.querySelector('.exercise-kind').textContent=ex.kind;
    node.querySelector('.exercise-name').textContent=ex.name;
    node.querySelector('.exercise-target').textContent=ex.target;
    const buttons=node.querySelector('.set-buttons');
    day[ex.id].forEach((done,index)=>{
      const btn=document.createElement('button');
      btn.className=`set-button${done?' done':''}`; btn.textContent=done?'✓':index+1;
      btn.setAttribute('aria-label',`${ex.name} ${index+1}セット目`);
      btn.addEventListener('click',()=>toggleSet(ex,index));
      buttons.appendChild(btn);
    });
    list.appendChild(node);
  });
}

function renderStatus(){
  const lv=level(); const lp=levelProgress();
  document.querySelector('#profileLevel').textContent=String(lv).padStart(2,'0');
  setBar('#levelBar',lp);
  document.querySelector('#levelCaption').textContent=lp===0 && xp()>0 ? 'レベルアップ！ 次の100 XPへ' : `次のレベルまで ${100-lp} XP`;
  const map=[['strength','strengthBar','strengthValue'],['core','coreBar','coreValue'],['mobility','mobilityBar','mobilityValue'],['endurance','enduranceBar','enduranceValue']];
  map.forEach(([key,bar,val])=>{ setBar(`#${bar}`,state.stats[key]||0); document.querySelector(`#${val}`).textContent=state.stats[key]||0; });
  const achievements=[
    {label:'🌱 はじめの1セット',ok:state.totalSets>=1},
    {label:'💪 10セット突破',ok:state.totalSets>=10},
    {label:'🔥 3日継続',ok:getStreak()>=3},
    {label:'⚔ 50セット突破',ok:state.totalSets>=50},
    {label:'👑 LV.5到達',ok:level()>=5}
  ];
  document.querySelector('#achievementList').innerHTML=achievements.map(a=>`<span class="achievement${a.ok?'':' locked'}">${a.label}</span>`).join('');
}

function renderHistory(){
  const entries=Object.entries(state.days).map(([key,day])=>({key,done:completedSetsForDay(day)})).filter(x=>x.done>0).sort((a,b)=>b.key.localeCompare(a.key)).slice(0,14);
  const root=document.querySelector('#historyList');
  if(!entries.length){ root.innerHTML='<div class="empty-state">まだ記録がありません。<br>最初の1セットを始めましょう。</div>'; return; }
  root.innerHTML=entries.map(e=>`<div class="history-row"><div><strong>${formatDate(e.key)}</strong><span>${e.done} / ${requiredSets()} セット完了</span></div><span class="history-badge">${Math.round(e.done/requiredSets()*100)}%</span></div>`).join('');
}

function render(){ renderHome(); renderQuest(); renderStatus(); renderHistory(); saveState(); bindDynamicLinks(); }
function toggleSet(ex,index){
  const day=ensureDay(); const wasDone=day[ex.id][index]; day[ex.id][index]=!wasDone;
  state.totalSets=Math.max(0,state.totalSets+(wasDone?-1:1)); addStats(ex,wasDone?-1:1); saveState(); render();
}
function quickComplete(id,index){ const ex=exercises.find(e=>e.id===id); if(ex) toggleSet(ex,index); }
function escapeHtml(text){ const d=document.createElement('div'); d.textContent=text; return d.innerHTML; }

function showView(name){
  document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.dataset.view===name));
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.tabLink===name));
  history.replaceState(null,'',`#${name}`); window.scrollTo({top:0,behavior:'smooth'});
}
function bindDynamicLinks(){
  document.querySelectorAll('[data-tab-link]').forEach(el=>{ if(el.dataset.bound)return; el.dataset.bound='1'; el.addEventListener('click',e=>{e.preventDefault();showView(el.dataset.tabLink);}); });
  document.querySelectorAll('[data-quick]').forEach(el=>{ if(el.dataset.bound)return; el.dataset.bound='1'; el.addEventListener('click',()=>quickComplete(el.dataset.quick,Number(el.dataset.index))); });
}

const settingsDialog=document.querySelector('#settingsDialog');
document.querySelector('#settingsButton').addEventListener('click',()=>{
  document.querySelector('#userNameInput').value=state.userName||'';
  document.querySelector('#trainerNameInput').value=state.trainerName||'';
  settingsDialog.showModal();
});
document.querySelector('#settingsForm').addEventListener('submit',event=>{
  event.preventDefault(); state.userName=document.querySelector('#userNameInput').value.trim(); state.trainerName=document.querySelector('#trainerNameInput').value.trim();
  saveState(); settingsDialog.close(); render();
});
document.querySelector('#resetTodayButton').addEventListener('click',()=>{
  if(!confirm('今日のチェックをすべてリセットしますか？')) return;
  const day=ensureDay();
  for(const ex of exercises) day[ex.id].forEach((done,i)=>{ if(done){state.totalSets=Math.max(0,state.totalSets-1);addStats(ex,-1);} day[ex.id][i]=false; });
  saveState(); render();
});

window.addEventListener('hashchange',()=>showView(location.hash.replace('#','')||'home'));
if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));

ensureDay(); render();
showView(['home','quest','status','log'].includes(location.hash.slice(1))?location.hash.slice(1):'home');
if(!state.userName&&!state.trainerName) setTimeout(()=>settingsDialog.showModal(),300);
