const STORAGE_KEY='muscleMasterStateV2';
const LEGACY_KEY='muscleMasterStateV1';
const Core=window.MuscleMasterCore;
const QuestCore=window.MuscleMasterQuestCore;
const QUEST_XP_PER_SET=10;
const QUEST_PACK_URL='./data/quests/core.json';

const exerciseCatalog={
  squat:{id:'squat',kind:'脚・お尻',name:'スクワット',target:'10〜15回 × 3セット',sets:3,primaryCategory:'strength',categories:['strength','endurance'],stats:{strength:3,endurance:1},execution:{mode:'reps',value:12,advice:'胸を起こし、膝とつま先の向きを揃えましょう。',formTip:'椅子へ腰掛けるようにお尻を引き、呼吸を止めない範囲で行います。'}},
  pushup:{id:'pushup',kind:'胸・腕・肩',name:'プッシュアップ',target:'10〜20回 × 3セット',sets:3,primaryCategory:'strength',categories:['strength','endurance'],stats:{strength:3,endurance:1},execution:{mode:'reps',value:12,advice:'頭から踵までを一直線に保ちましょう。',formTip:'肘を開きすぎず、胸を床へ近づけます。難しい場合は膝をついて構いません。'}},
  bridge:{id:'bridge',kind:'お尻・もも裏',name:'グルートブリッジ',target:'10〜15回 × 3セット',sets:3,primaryCategory:'strength',categories:['strength','core'],stats:{strength:2,core:1},execution:{mode:'reps',value:12,advice:'踵で床を押し、お尻をゆっくり持ち上げましょう。',formTip:'腰を反らしすぎず、肩から膝が一直線になる位置で一度止めます。'}},
  crunch:{id:'crunch',kind:'腹筋',name:'クランチ',target:'15〜20回 × 3セット',sets:3,primaryCategory:'core',categories:['core'],stats:{core:3},execution:{mode:'reps',value:15,advice:'首ではなく、みぞおちを丸める意識で行いましょう。',formTip:'顎と胸の間を空け、反動を使わず肩甲骨が浮く範囲まで起こします。'}},
  plank:{id:'plank',kind:'体幹',name:'プランク',target:'20〜45秒 × 3セット',sets:3,primaryCategory:'core',categories:['core','endurance'],stats:{core:3,endurance:1},execution:{mode:'timer',value:30,advice:'頭から踵までを一直線に保ちましょう。',formTip:'腰が反る前に終了します。呼吸を続け、肘は肩の真下へ置きます。'}},
  mobility:{id:'mobility',kind:'柔軟・可動域',name:'クネクネ＆ストレッチ',target:'約3〜5分',sets:1,primaryCategory:'mobility',categories:['mobility'],stats:{mobility:4},execution:{mode:'timer',value:180,advice:'反動をつけず、気持ちよい範囲で動きましょう。',formTip:'痛みが出る手前で止め、ゆっくりした呼吸に合わせて全身をほぐします。'}},
  neck:{id:'neck',kind:'首・僧帽筋',name:'ネックアイソメトリック',target:'各方向 5〜10秒 × 2セット',sets:2,primaryCategory:'strength',categories:['strength','core'],stats:{strength:1,core:1},execution:{mode:'timer',value:10,advice:'首を動かさず、手と頭を軽く押し合いましょう。',formTip:'力は最大の半分程度に抑えます。痛みやしびれがある場合は実施しません。'}}
};

const questCategoryMeta={
  strength:{label:'筋力',short:'STR',icon:'#icon-strength'},
  core:{label:'体幹',short:'CORE',icon:'#icon-core'},
  mobility:{label:'柔軟',short:'MOB',icon:'#icon-mobility'},
  endurance:{label:'持久力',short:'END',icon:'#icon-endurance'}
};

const weeklyPlans={
  0:{code:'SUN',name:'回復日',note:'軽く動いて、しっかり休む',ids:['mobility','bridge']},
  1:{code:'MON',name:'全身A',note:'脚・胸・腹をバランスよく',ids:['squat','pushup','crunch','plank']},
  2:{code:'TUE',name:'モビリティ',note:'身体をほぐして可動域を育てる',ids:['mobility','bridge','neck']},
  3:{code:'WED',name:'全身B',note:'全身をもう一度、丁寧に',ids:['squat','pushup','bridge','plank']},
  4:{code:'THU',name:'体幹・回復',note:'体幹と柔軟性を中心に',ids:['crunch','plank','mobility','neck']},
  5:{code:'FRI',name:'全身C',note:'週の仕上げを無理なく',ids:['squat','pushup','bridge','crunch']},
  6:{code:'SAT',name:'選択チャレンジ',note:'余裕があれば軽く挑戦',ids:['squat','pushup','plank','mobility']}
};

const defaultState={userName:'',trainerId:'rio',trainerName:'リオ',days:{},totalSets:0,stats:{strength:0,core:0,mobility:0,endurance:0},sound:true,lastShownLevel:1,quests:QuestCore.normalizeQuestState()};
function cloneDefault(){return JSON.parse(JSON.stringify(defaultState));}
function todayKey(date=new Date()){return Core.todayKey(date);}
function dateFromKey(key){return new Date(`${key}T00:00:00`);}
function planForDate(date=new Date()){return weeklyPlans[date.getDay()];}
function exercisesForDate(date=new Date()){return planForDate(date).ids.map(id=>exerciseCatalog[id]);}
function planForKey(key){return planForDate(dateFromKey(key));}
function exercisesForKey(key){return exercisesForDate(dateFromKey(key));}

function loadState(){
  try{
    const fresh=localStorage.getItem(STORAGE_KEY);
    if(fresh)return {...cloneDefault(),...JSON.parse(fresh)};
    const legacy=localStorage.getItem(LEGACY_KEY);
    if(legacy){const migrated={...cloneDefault(),...JSON.parse(legacy)};localStorage.setItem(STORAGE_KEY,JSON.stringify(migrated));return migrated;}
  }catch{}
  return cloneDefault();
}
let state=loadState();
let questFilter='all';
let questPack=null;
let activeWorkoutId=null;
let workoutSetIndex=0;
const workoutClock={running:false,elapsed:0,remaining:0,intervalId:null};
state.stats={...defaultState.stats,...(state.stats||{})};state.days||={};state.quests=QuestCore.normalizeQuestState(state.quests);
function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}

function evaluateQuests(){
  if(!questPack)return[];
  const now=new Date();
  const evaluation=QuestCore.evaluateQuestPack(questPack,state,{now,exerciseCatalog});
  const merged=QuestCore.mergeQuestEvaluation(state.quests,evaluation,now);
  state.quests=merged.state;
  saveState();
  return merged.newlyCompleted;
}
function emitTrainingEvent(name,detail){window.dispatchEvent(new CustomEvent(name,{detail}));}
async function loadQuestPack(){
  try{
    const response=await fetch(QUEST_PACK_URL);
    if(!response.ok)throw new Error(`Quest pack request failed: ${response.status}`);
    questPack=QuestCore.validateQuestPack(await response.json());
    evaluateQuests();
  }catch(error){console.warn('Quest pack is unavailable; training records remain active.',error);}
}

function ensureDay(key=todayKey()){
  state.days[key]||={};
  for(const ex of exercisesForKey(key)){
    if(!Array.isArray(state.days[key][ex.id])||state.days[key][ex.id].length!==ex.sets){
      const old=Array.isArray(state.days[key][ex.id])?state.days[key][ex.id]:[];
      state.days[key][ex.id]=Array.from({length:ex.sets},(_,i)=>Boolean(old[i]));
    }
  }
  return state.days[key];
}
function completedSetsForKey(key){const day=state.days[key]||{};return exercisesForKey(key).reduce((sum,ex)=>sum+((day[ex.id]||[]).filter(Boolean).length),0);}
function requiredSetsForKey(key){return exercisesForKey(key).reduce((sum,e)=>sum+e.sets,0);}
function getProgress(key=todayKey()){const total=requiredSetsForKey(key);return total?Math.min(100,Math.round(completedSetsForKey(key)/total*100)):0;}
function getStreak(){return Core.computeStreak(state.days,new Date());}
function xp(){return Core.xpForTotalSets(state.totalSets);}
function level(){return Core.levelForTotalSets(state.totalSets);}
function levelProgress(){return Core.levelProgressForTotalSets(state.totalSets);}
function addStats(ex,direction){for(const [key,amount] of Object.entries(ex.stats))state.stats[key]=Math.max(0,Math.min(100,(state.stats[key]||0)+amount*direction));}
function firstIncomplete(){const key=todayKey(),day=ensureDay(key);for(const ex of exercisesForKey(key)){const idx=day[ex.id].findIndex(v=>!v);if(idx!==-1)return{ex,index:idx};}return null;}
function formatDate(key){return new Intl.DateTimeFormat('ja-JP',{month:'short',day:'numeric',weekday:'short'}).format(dateFromKey(key));}
function setBar(id,value){const el=document.querySelector(id);if(el)el.style.width=`${Math.max(0,Math.min(100,value))}%`;}
function escapeHtml(text){const d=document.createElement('div');d.textContent=text;return d.innerHTML;}

function trainerMessage(progress){
  const user=state.userName||'あなた';const plan=planForDate();
  if(plan.name==='回復日'&&progress===0)return `${user}、今日は回復日。軽くほぐすだけでも十分よ。`;
  if(progress===0)return `${user}、今日は1セットから。最初の一歩がいちばん強いわ。`;
  if(progress<30)return `いいスタート、${user}。フォームを崩さず、この調子。`;
  if(progress<60)return `${user}、身体が起きてきたわ。呼吸も忘れずにね。`;
  if(progress<90)return `ここまで来たら十分立派。残りは体調と相談していきましょう。`;
  if(progress<100)return `あと少し！ 追い込みより、きれいな1セットを。`;
  return `全クエスト完了！ ${user}、本日の育成は大成功。回復までがトレーニングよ。`;
}

let audioCtx=null;
function tone(freq,duration=.08,type='sine',gain=.035,delay=0){if(!state.sound)return;try{audioCtx||=new(window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.value=freq;g.gain.value=gain;o.connect(g);g.connect(audioCtx.destination);const t=audioCtx.currentTime+delay;o.start(t);g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.stop(t+duration);}catch{}}
function playComplete(){tone(520,.07,'triangle');tone(740,.1,'triangle',.03,.06);}
function playUndo(){tone(300,.07,'sine',.025);}
function playLevelUp(){[523,659,784,1047].forEach((f,i)=>tone(f,.2,'triangle',.04,i*.09));}
function pulseTrainer(){['#trainerStage','#workoutTrainerImage'].forEach(selector=>{const el=document.querySelector(selector);if(!el)return;el.classList.remove('trainer-cheer');void el.offsetWidth;el.classList.add('trainer-cheer');setTimeout(()=>el.classList.remove('trainer-cheer'),700);});}
function showToast(text,toneName='default'){const t=document.querySelector('#toast');t.textContent=text;t.dataset.tone=toneName;t.classList.add('show');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>t.classList.remove('show'),1700);}
function confetti(){const layer=document.querySelector('#confetti');layer.innerHTML='';for(let i=0;i<36;i++){const s=document.createElement('i');s.style.left=`${Math.random()*100}%`;s.style.setProperty('--x',`${(Math.random()-.5)*180}px`);s.style.setProperty('--r',`${Math.random()*520-260}deg`);s.style.animationDelay=`${Math.random()*.2}s`;layer.appendChild(s);}setTimeout(()=>layer.innerHTML='',1800);}
function showLevelUp(newLevel){document.querySelector('#levelUpNumber').textContent=`LV. ${newLevel}`;document.querySelector('#levelUpMessage').textContent=`${state.userName||'プレイヤー'}、新しいレベルに到達！`;const overlay=document.querySelector('#levelUpOverlay');overlay.classList.add('show');overlay.setAttribute('aria-hidden','false');playLevelUp();confetti();pulseTrainer();}
function checkLevelUp(previousLevel){const now=level();if(now>previousLevel){state.lastShownLevel=now;saveState();showLevelUp(now);}}

function renderPlanLabels(){const plan=planForDate(),user=state.userName?`${state.userName}さん、`:'';['#weekdayChip','#questDayChip'].forEach(id=>document.querySelector(id).textContent=plan.code);['#planName','#questPlanName'].forEach(id=>document.querySelector(id).textContent=plan.name);['#planNote','#questPlanNote'].forEach(id=>document.querySelector(id).textContent=plan.note);document.querySelector('#questDescription').textContent=plan.name==='回復日'?`${user}今日は軽く身体を動かす日です。`:`${user}今日のメニューから取り組む種目を選びましょう。`;}
function renderHome(){const key=todayKey(),progress=getProgress(key),lv=level();document.querySelector('#progressText').textContent=`${progress}%`;document.querySelector('#streakText').textContent=getStreak();document.querySelector('#totalSetsText').textContent=state.totalSets;document.querySelector('#trainerName').textContent=Core.trainerDisplayName(state.trainerName);document.querySelector('#trainerMessage').textContent=trainerMessage(progress);document.querySelector('#levelText').textContent=`LV. ${lv}`;document.querySelector('#xpText').textContent=`${xp()} XP`;document.querySelector('#heroTitle').innerHTML=state.userName?`${escapeHtml(state.userName)}を<br><em>1段階</em>アップデート。`:`今日の自分を<br><em>1段階</em>アップデート。`;const quick=document.querySelector('#quickQuest'),next=firstIncomplete();if(!next)quick.innerHTML='<div class="quick-item"><div><strong>本日のクエスト完了</strong><span>今日は回復まで含めて育成です。</span></div><button data-tab-link="status">成長を見る</button></div>';else quick.innerHTML=`<div class="quick-item"><div><strong>${next.ex.name} · SET ${next.index+1}</strong><span>${next.ex.kind}｜${next.ex.target}</span></div><button data-quick="${next.ex.id}" data-index="${next.index}">完了する</button></div>`;}
function renderQuest(){
  const key=todayKey(),day=ensureDay(key),progress=getProgress(key),exercises=exercisesForKey(key);
  const completed=completedSetsForKey(key),required=requiredSetsForKey(key);
  const visible=questFilter==='all'?exercises:exercises.filter(ex=>ex.categories.includes(questFilter));
  document.querySelector('#userHeading').textContent='トレーニング選択';
  document.querySelector('#questProgressDone').textContent=completed;
  document.querySelector('#questProgressTotal').textContent=required;
  setBar('#progressBar',progress);
  document.querySelectorAll('[data-quest-filter]').forEach(button=>{
    const active=button.dataset.questFilter===questFilter;
    button.classList.toggle('is-active',active);
    button.setAttribute('aria-pressed',String(active));
  });

  const list=document.querySelector('#exerciseList');
  list.innerHTML='';
  const template=document.querySelector('#exerciseTemplate');
  visible.forEach(ex=>{
    const displayCategory=questFilter==='all'?ex.primaryCategory:questFilter;
    const node=template.content.cloneNode(true),category=questCategoryMeta[displayCategory];
    const completedForExercise=day[ex.id].filter(Boolean).length;
    const card=node.querySelector('.exercise-card');
    card.classList.add(`category-${displayCategory}`);
    card.classList.toggle('is-complete',completedForExercise===ex.sets);
    card.setAttribute('aria-label',`${ex.name}、${ex.target}、${completedForExercise}/${ex.sets}セット完了`);
    node.querySelector('.exercise-icon use').setAttribute('href',category.icon);
    node.querySelector('.exercise-kind').textContent=ex.kind;
    node.querySelector('.exercise-category').textContent=category.short;
    node.querySelector('.exercise-name').textContent=ex.name;
    node.querySelector('.exercise-xp').textContent=`+${ex.sets*QUEST_XP_PER_SET} XP`;
    node.querySelector('.exercise-target').textContent=ex.target;
    node.querySelector('.exercise-progress').textContent=completedForExercise===ex.sets?'COMPLETE':`${completedForExercise} / ${ex.sets} セット完了`;
    const startButton=node.querySelector('.exercise-start-button');
    startButton.querySelector('span').textContent=completedForExercise===ex.sets?'確認':'開始';
    startButton.setAttribute('aria-label',`${ex.name}の実行画面を開く`);
    startButton.addEventListener('click',()=>openWorkout(ex.id));
    const buttons=node.querySelector('.set-buttons');
    day[ex.id].forEach((done,index)=>{
      const btn=document.createElement('button');
      btn.className=`set-button${done?' done':''}`;
      btn.textContent=done?'✓':index+1;
      btn.setAttribute('aria-pressed',String(done));
      btn.setAttribute('aria-label',`${ex.name} ${index+1}セット目${done?'を取り消す':'を完了にする'}`);
      btn.addEventListener('click',()=>toggleSet(ex,index));
      buttons.appendChild(btn);
    });
    list.appendChild(node);
  });
  document.querySelector('#exerciseEmptyState').hidden=visible.length!==0;
}

function activeWorkout(){return activeWorkoutId?exerciseCatalog[activeWorkoutId]||null:null;}
function currentTrainer(){const trainers=window.MuscleMasterTrainers||{};return trainers[state.trainerId||'rio']||trainers.rio||null;}
function stopWorkoutClock(){
  if(workoutClock.intervalId)clearInterval(workoutClock.intervalId);
  workoutClock.intervalId=null;
  workoutClock.running=false;
}
function resetWorkoutClock(ex=activeWorkout()){
  stopWorkoutClock();
  workoutClock.elapsed=0;
  workoutClock.remaining=ex?.execution.mode==='timer'?ex.execution.value:0;
  renderWorkoutClock();
}
function renderWorkoutClock(){
  const ex=activeWorkout();
  if(!ex)return;
  const isTimer=ex.execution.mode==='timer';
  const total=Math.max(1,ex.execution.value);
  const allDone=ensureDay()[ex.id].every(Boolean);
  const ring=document.querySelector('#workoutTimerRing');
  const value=document.querySelector('#workoutTimerValue');
  const unit=document.querySelector('#workoutTimerUnit');
  const mode=document.querySelector('#workoutTimerMode');
  const status=document.querySelector('#workoutTimerStatus');
  const toggle=document.querySelector('#workoutTimerToggle');
  const reset=document.querySelector('#workoutTimerReset');
  const progress=isTimer?Math.min(100,Math.round((total-workoutClock.remaining)/total*100)):0;
  ring.style.setProperty('--timer-progress',`${progress}%`);
  ring.classList.toggle('is-running',workoutClock.running);
  ring.classList.toggle('is-reps',!isTimer);
  mode.textContent=isTimer?'COUNTDOWN':'TARGET';
  value.textContent=isTimer?Core.formatClock(workoutClock.remaining):ex.execution.value;
  unit.textContent=isTimer?'TIME':'REPS';
  if(allDone)status.textContent='全セット完了です。お疲れさまでした。';
  else if(workoutClock.running)status.textContent=isTimer?`残り ${Core.formatClock(workoutClock.remaining)}`:`経過 ${Core.formatClock(workoutClock.elapsed)} · 自分のペースで続けましょう。`;
  else if(isTimer&&workoutClock.elapsed>0&&workoutClock.remaining===0)status.textContent='タイマー完了。フォームを整えてセットを記録しましょう。';
  else if(workoutClock.elapsed>0)status.textContent=`一時停止中 · 経過 ${Core.formatClock(workoutClock.elapsed)}`;
  else status.textContent='フォームを確認して開始してください。';
  toggle.disabled=allDone;
  reset.disabled=allDone;
  toggle.querySelector('use').setAttribute('href',workoutClock.running?'#icon-pause':'#icon-play');
  toggle.querySelector('span').textContent=workoutClock.running?'一時停止':workoutClock.elapsed>0?'再開':'開始';
}
function renderWorkout(){
  const ex=activeWorkout();
  if(!ex)return;
  const day=ensureDay(),sets=day[ex.id],next=Core.nextIncompleteSet(sets,workoutSetIndex);
  const allDone=next===-1;
  if(!allDone)workoutSetIndex=next;
  const category=questCategoryMeta[ex.primaryCategory];
  const trainer=currentTrainer();
  document.querySelector('#workoutExerciseName').textContent=ex.name;
  document.querySelector('#workoutCategory').textContent=category.short;
  document.querySelector('#workoutKind').textContent=ex.kind;
  document.querySelector('#workoutTarget').textContent=ex.target;
  document.querySelector('#workoutAdvice').textContent=ex.execution.advice;
  document.querySelector('#workoutFormTip').textContent=ex.execution.formTip;
  document.querySelector('#workoutCurrentSet').textContent=allDone?ex.sets:workoutSetIndex+1;
  document.querySelector('#workoutTotalSets').textContent=ex.sets;
  const image=document.querySelector('#workoutTrainerImage');
  if(trainer){image.src=trainer.assets.portrait;image.alt=`トレーナーの${Core.trainerDisplayName(state.trainerName||trainer.displayName)}`;}
  document.querySelector('#workoutTrainerName').textContent=Core.trainerDisplayName(state.trainerName||trainer?.displayName);
  document.querySelector('#workoutSetDots').innerHTML=sets.map((done,index)=>`<span class="${done?'done':index===workoutSetIndex&&!allDone?'current':''}" aria-label="セット${index+1} ${done?'完了':index===workoutSetIndex&&!allDone?'実行中':'未完了'}">${done?'✓':index+1}</span>`).join('');
  const complete=document.querySelector('#workoutCompleteButton');
  complete.disabled=allDone;
  complete.querySelector('span').textContent=allDone?'全セット完了':'このセットを完了';
  complete.querySelector('b').textContent=allDone?'COMPLETE':`+${QUEST_XP_PER_SET} XP`;
  document.querySelector('#workoutReturnButton').hidden=!allDone;
  renderWorkoutClock();
}
function openWorkout(exerciseId){
  const ex=exerciseCatalog[exerciseId];
  if(!ex)return;
  activeWorkoutId=exerciseId;
  workoutSetIndex=Math.max(0,Core.nextIncompleteSet(ensureDay()[exerciseId],0));
  resetWorkoutClock(ex);
  renderWorkout();
  showView('workout');
}
function toggleWorkoutClock(){
  const ex=activeWorkout();
  if(!ex||ensureDay()[ex.id].every(Boolean))return;
  if(workoutClock.running){stopWorkoutClock();renderWorkoutClock();return;}
  if(ex.execution.mode==='timer'&&workoutClock.remaining<=0){workoutClock.remaining=ex.execution.value;workoutClock.elapsed=0;}
  workoutClock.running=true;
  workoutClock.intervalId=setInterval(()=>{
    workoutClock.elapsed+=1;
    if(ex.execution.mode==='timer')workoutClock.remaining=Math.max(0,workoutClock.remaining-1);
    if(ex.execution.mode==='timer'&&workoutClock.remaining===0){
      stopWorkoutClock();
      playComplete();
      showToast('タイマー完了！ セットを記録しましょう','success');
    }
    renderWorkoutClock();
  },1000);
  renderWorkoutClock();
}
function completeWorkoutSet(){
  const ex=activeWorkout();
  if(!ex)return;
  const day=ensureDay(),index=Core.nextIncompleteSet(day[ex.id],workoutSetIndex);
  if(index===-1){renderWorkout();return;}
  stopWorkoutClock();
  toggleSet(ex,index);
  workoutSetIndex=Math.max(0,Core.nextIncompleteSet(ensureDay()[ex.id],index));
  resetWorkoutClock(ex);
  renderWorkout();
}
function closeWorkout(){stopWorkoutClock();showView('quest');}
function renderStatus(){const lv=level(),lp=levelProgress();document.querySelector('#profileLevel').textContent=String(lv).padStart(2,'0');setBar('#levelBar',lp);document.querySelector('#levelCaption').textContent=lp===0&&xp()>0?'レベルアップ！ 次の100 XPへ':`次のレベルまで ${100-lp} XP`;[['strength','strengthBar','strengthValue'],['core','coreBar','coreValue'],['mobility','mobilityBar','mobilityValue'],['endurance','enduranceBar','enduranceValue']].forEach(([key,bar,val])=>{setBar(`#${bar}`,state.stats[key]||0);document.querySelector(`#${val}`).textContent=state.stats[key]||0;});const achievements=[{label:'🌱 はじめの1セット',ok:state.totalSets>=1},{label:'💪 10セット突破',ok:state.totalSets>=10},{label:'🔥 3日継続',ok:getStreak()>=3},{label:'⚔ 50セット突破',ok:state.totalSets>=50},{label:'👑 LV.5到達',ok:level()>=5}];document.querySelector('#achievementList').innerHTML=achievements.map(a=>`<span class="achievement${a.ok?'':' locked'}">${a.label}</span>`).join('');}
function renderHistory(){const entries=Object.keys(state.days).map(key=>({key,done:completedSetsForKey(key),total:requiredSetsForKey(key),plan:planForKey(key).name})).filter(x=>x.done>0).sort((a,b)=>b.key.localeCompare(a.key)).slice(0,14);const root=document.querySelector('#historyList');if(!entries.length){root.innerHTML='<div class="empty-state">まだ記録がありません。<br>最初の1セットを始めましょう。</div>';return;}root.innerHTML=entries.map(e=>`<div class="history-row"><div><strong>${formatDate(e.key)} · ${e.plan}</strong><span>${e.done} / ${e.total} セット完了</span></div><span class="history-badge">${Math.min(100,Math.round(e.done/e.total*100))}%</span></div>`).join('');}
function render(){renderPlanLabels();renderHome();renderQuest();if(activeWorkout())renderWorkout();renderStatus();renderHistory();const soundButton=document.querySelector('#soundButton'),soundIcon=soundButton.querySelector('use');soundButton.classList.toggle('muted-sound',!state.sound);soundButton.setAttribute('aria-pressed',String(state.sound));soundButton.setAttribute('aria-label',state.sound?'効果音をオフにする':'効果音をオンにする');if(soundIcon)soundIcon.setAttribute('href',state.sound?'#icon-sound':'#icon-sound-off');saveState();bindDynamicLinks();}
function toggleSet(ex,index){const day=ensureDay(),previousLevel=level(),wasDone=day[ex.id][index];day[ex.id][index]=!wasDone;state.totalSets=Math.max(0,state.totalSets+(wasDone?-1:1));addStats(ex,wasDone?-1:1);saveState();emitTrainingEvent(wasDone?'training:set-reverted':'training:set-completed',{dateKey:todayKey(),exerciseId:ex.id,setIndex:index});render();if(wasDone){playUndo();showToast('セットを取り消しました','undo');}else{playComplete();pulseTrainer();showToast(`${ex.name} SET ${index+1} 完了！ +10 XP`,'success');checkLevelUp(previousLevel);if(getProgress()===100){confetti();setTimeout(()=>playLevelUp(),120);}}}
function quickComplete(id,index){const ex=exerciseCatalog[id];if(ex)toggleSet(ex,index);}
function showView(name){if(name==='workout'&&!activeWorkout())name='quest';if(name!=='workout'&&workoutClock.running)stopWorkoutClock();document.body.classList.toggle('workout-mode',name==='workout');document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.dataset.view===name));document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.tabLink===(name==='workout'?'quest':name)));history.replaceState(null,'',`#${name}`);window.scrollTo({top:0,behavior:'smooth'});}
function bindDynamicLinks(){document.querySelectorAll('[data-tab-link]').forEach(el=>{if(el.dataset.bound)return;el.dataset.bound='1';el.addEventListener('click',e=>{e.preventDefault();showView(el.dataset.tabLink);});});document.querySelectorAll('[data-quick]').forEach(el=>{if(el.dataset.bound)return;el.dataset.bound='1';el.addEventListener('click',()=>quickComplete(el.dataset.quick,Number(el.dataset.index)));});}

const settingsDialog=document.querySelector('#settingsDialog');
document.querySelector('#settingsButton').addEventListener('click',()=>{document.querySelector('#userNameInput').value=state.userName||'';document.querySelector('#trainerNameInput').value=Core.trainerDisplayName(state.trainerName);settingsDialog.showModal();});
document.querySelector('#settingsCloseButton').addEventListener('click',()=>settingsDialog.close());
document.querySelector('#settingsForm').addEventListener('submit',event=>{event.preventDefault();state.userName=document.querySelector('#userNameInput').value.trim();state.trainerName=Core.trainerDisplayName(document.querySelector('#trainerNameInput').value);saveState();settingsDialog.close();render();});
document.querySelector('#soundButton').addEventListener('click',()=>{state.sound=!state.sound;saveState();render();if(state.sound){tone(660,.08,'triangle');showToast('効果音 ON','success');}else showToast('効果音 OFF','undo');});
document.querySelector('#levelUpClose').addEventListener('click',()=>{const o=document.querySelector('#levelUpOverlay');o.classList.remove('show');o.setAttribute('aria-hidden','true');});
document.querySelectorAll('[data-quest-filter]').forEach(button=>button.addEventListener('click',()=>{questFilter=button.dataset.questFilter||'all';renderQuest();}));
document.querySelector('#workoutBackButton').addEventListener('click',closeWorkout);
document.querySelector('#workoutReturnButton').addEventListener('click',closeWorkout);
document.querySelector('#workoutTimerToggle').addEventListener('click',toggleWorkoutClock);
document.querySelector('#workoutTimerReset').addEventListener('click',()=>resetWorkoutClock());
document.querySelector('#workoutCompleteButton').addEventListener('click',completeWorkoutSet);
['training:set-completed','training:set-reverted','training:day-reset'].forEach(name=>window.addEventListener(name,evaluateQuests));
document.querySelector('#resetTodayButton').addEventListener('click',()=>{if(!confirm('今日のチェックをすべてリセットしますか？'))return;const day=ensureDay();for(const ex of exercisesForDate())(day[ex.id]||[]).forEach((done,i)=>{if(done){state.totalSets=Math.max(0,state.totalSets-1);addStats(ex,-1);}day[ex.id][i]=false;});saveState();emitTrainingEvent('training:day-reset',{dateKey:todayKey()});render();showToast('今日の記録をリセットしました');});
window.addEventListener('hashchange',()=>showView(location.hash.replace('#','')||'home'));
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));

ensureDay();if(!state.lastShownLevel)state.lastShownLevel=level();render();showView(['home','quest','status','log'].includes(location.hash.slice(1))?location.hash.slice(1):'home');loadQuestPack();if(!state.userName)setTimeout(()=>settingsDialog.showModal(),300);
