(function(){
  if(window.__muscleMasterTrainingSessionRuntime)return;
  window.__muscleMasterTrainingSessionRuntime=true;

  const SessionCore=window.MuscleMasterTrainingSessionCore;
  if(!SessionCore)return;

  const cadenceSeconds=SessionCore.DEFAULT_REP_CADENCE_SECONDS||2;
  let session={signature:'',mode:'reps',targetReps:1,repElapsed:0,repCount:0,started:false,ready:false,intervalId:null};

  function nodes(){
    return {
      view:document.querySelector('#view-workout'),
      ring:document.querySelector('#workoutTimerRing'),
      mode:document.querySelector('#workoutTimerMode'),
      value:document.querySelector('#workoutTimerValue'),
      status:document.querySelector('#workoutTimerStatus'),
      toggle:document.querySelector('#workoutTimerToggle'),
      reset:document.querySelector('#workoutTimerReset'),
      complete:document.querySelector('#workoutCompleteButton'),
      exercise:document.querySelector('#workoutExerciseName'),
      set:document.querySelector('#workoutCurrentSet')
    };
  }

  function ensureStyle(){
    if(document.querySelector('#trainingSessionRuntimeStyle'))return;
    const style=document.createElement('style');
    style.id='trainingSessionRuntimeStyle';
    style.textContent=`
      .training-session-gate{margin-top:12px;padding:11px 12px;border:2px solid #2b2929;border-radius:10px;background:linear-gradient(#fff8e9,#f1d7aa);box-shadow:inset 0 1px #fff,0 3px 0 #8d683a;color:#211d1c}
      .training-session-gate[data-ready="true"]{background:linear-gradient(#f3ffe9,#d7ecb7);border-color:#355d28;box-shadow:inset 0 1px #fff,0 3px 0 #537b3a}
      .training-session-gate-head{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:.58rem;letter-spacing:.08em}
      .training-session-gate-head b{font-size:.72rem;letter-spacing:0}
      .training-session-gate-progress{height:9px;margin:8px 0 7px;overflow:hidden;border:1px solid #74624e;border-radius:999px;background:#d4c3a6}
      .training-session-gate-progress i{display:block;width:0;height:100%;background:linear-gradient(90deg,#bf2733,#f1a62e);transition:width .22s ease}
      .training-session-gate[data-ready="true"] .training-session-gate-progress i{background:linear-gradient(90deg,#5d8f38,#8ec95a)}
      .training-session-gate p{margin:0;font-size:.63rem;line-height:1.55}
      .training-session-gate strong{font-family:var(--font-display,inherit);font-size:.84rem}
      .workout-complete-button:disabled{opacity:.48;filter:grayscale(.25);cursor:not-allowed;transform:none!important}
    `;
    document.head.appendChild(style);
  }

  function ensurePanel(){
    ensureStyle();
    let panel=document.querySelector('#trainingSessionGate');
    if(panel)return panel;
    const consolePanel=document.querySelector('.workout-console');
    if(!consolePanel)return null;
    panel=document.createElement('section');
    panel.id='trainingSessionGate';
    panel.className='training-session-gate';
    panel.setAttribute('aria-live','polite');
    panel.innerHTML=`<div class="training-session-gate-head"><span>SESSION PROGRESS</span><b id="trainingSessionCount">0 / 0</b></div><div class="training-session-gate-progress"><i id="trainingSessionBar"></i></div><p id="trainingSessionMessage">開始すると、セット完遂までガイドします。</p>`;
    consolePanel.appendChild(panel);
    return panel;
  }

  function activeWorkout(){const {view}=nodes();return Boolean(view?.classList.contains('active'));}
  function signature(){const n=nodes();return `${n.exercise?.textContent||''}|${n.set?.textContent||''}`;}
  function isTimerMode(){return nodes().mode?.textContent==='COUNTDOWN';}
  function currentTargetReps(){
    const n=nodes();
    const value=Number.parseInt(n.value?.textContent||'0',10);
    return Number.isFinite(value)&&value>0?value:1;
  }
  function parseClock(text){
    const match=String(text||'').trim().match(/^(\d+):(\d{2})$/);
    if(!match)return 0;
    return Number(match[1])*60+Number(match[2]);
  }
  function allSetsDone(){return nodes().complete?.querySelector('span')?.textContent==='全セット完了';}
  function stopRepCounter(){if(session.intervalId)clearInterval(session.intervalId);session.intervalId=null;}

  function resetSession(){
    stopRepCounter();
    session={signature:signature(),mode:isTimerMode()?'timer':'reps',targetReps:currentTargetReps(),repElapsed:0,repCount:0,started:false,ready:false,intervalId:null};
    sync();
  }

  function timerReady(){
    const n=nodes();
    if(!session.started)return false;
    if(n.status?.textContent?.includes('タイマー完了'))return true;
    return parseClock(n.value?.textContent)<=0;
  }

  function sync(){
    if(!activeWorkout())return;
    const panel=ensurePanel(),n=nodes();
    if(!panel||!n.complete)return;
    if(session.signature!==signature())resetSession();

    if(session.mode==='timer')session.ready=timerReady();
    else session.ready=SessionCore.isSessionReady({mode:'reps',started:session.started,targetReps:session.targetReps,repCount:session.repCount});

    if(!allSetsDone())n.complete.disabled=!session.ready;
    panel.dataset.ready=String(session.ready);

    const count=panel.querySelector('#trainingSessionCount');
    const bar=panel.querySelector('#trainingSessionBar');
    const message=panel.querySelector('#trainingSessionMessage');

    if(session.mode==='timer'){
      const remaining=parseClock(n.value?.textContent);
      const total=Math.max(1,Number.parseInt(n.mode?.dataset?.total||'',10)||remaining||1);
      const progress=session.started?(session.ready?100:Math.max(0,Math.min(99,100-Math.round((remaining/Math.max(total,remaining))*100)))):0;
      count.textContent=session.ready?'完走':'TIME';
      bar.style.width=`${progress}%`;
      message.textContent=session.ready?'時間ガイド完了。このセットを記録できます。':session.started?'タイマーを最後まで完走するとセット完了が有効になります。':'「開始」を押して時間ガイドを始めてください。';
    }else{
      const progress=SessionCore.progressPercent({mode:'reps',targetReps:session.targetReps,repCount:session.repCount});
      count.textContent=`${session.repCount} / ${session.targetReps}`;
      bar.style.width=`${progress}%`;
      message.textContent=session.ready?'回数ガイド完了。このセットを記録できます。':session.started?`約${cadenceSeconds}秒ペースで実行中。フォームを崩さず続けましょう。`:'「開始」を押すと回数ガイドが始まります。';
    }
  }

  function startRepCounter(){
    if(session.intervalId||session.mode!=='reps'||session.ready)return;
    session.intervalId=setInterval(()=>{
      session.repElapsed+=1;
      session.repCount=SessionCore.repCountForElapsed(session.repElapsed,session.targetReps,cadenceSeconds);
      if(session.repCount>=session.targetReps)stopRepCounter();
      sync();
    },1000);
  }

  function bind(){
    const n=nodes();
    if(!n.view||!n.toggle||!n.reset||!n.complete)return;
    ensurePanel();
    resetSession();

    n.toggle.addEventListener('click',()=>setTimeout(()=>{
      if(!activeWorkout())return;
      session.started=true;
      const running=n.ring?.classList.contains('is-running');
      if(session.mode==='reps'){
        if(running)startRepCounter();
        else stopRepCounter();
      }
      sync();
    },0));

    n.reset.addEventListener('click',()=>setTimeout(resetSession,0));
    n.complete.addEventListener('click',()=>setTimeout(()=>{if(activeWorkout())resetSession();},0));

    new MutationObserver(()=>{
      if(!activeWorkout()){stopRepCounter();return;}
      if(session.signature!==signature())resetSession();
      else sync();
    }).observe(n.view,{attributes:true,attributeFilter:['class'],subtree:true,childList:true,characterData:true});

    document.addEventListener('click',event=>{
      const quickSet=event.target.closest?.('.set-button:not(.done)');
      if(quickSet){
        const card=quickSet.closest('.exercise-card');
        const start=card?.querySelector('.exercise-start-button');
        if(start){event.preventDefault();event.stopImmediatePropagation();start.click();}
        return;
      }
      const homeQuick=event.target.closest?.('[data-quick]');
      if(homeQuick&&typeof window.openWorkout==='function'){
        event.preventDefault();event.stopImmediatePropagation();window.openWorkout(homeQuick.dataset.quick);
      }
    },true);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});
  else bind();
})();
