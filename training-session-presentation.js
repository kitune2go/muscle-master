(function(){
  if(window.__muscleMasterTrainingSessionPresentation)return;
  window.__muscleMasterTrainingSessionPresentation=true;

  const REST_SECONDS=30;
  let restIntervalId=null;
  let restRemaining=0;
  let reactionTimerId=null;

  function saved(){
    try{return JSON.parse(localStorage.getItem('muscleMasterStateV2')||'{}')||{};}
    catch{return {};}
  }

  function trainer(){
    const trainers=window.MuscleMasterTrainers||{};
    const state=saved();
    return trainers[state.trainerId||'rio']||trainers.rio||null;
  }

  function nodes(){
    return {
      view:document.querySelector('#view-workout'),
      image:document.querySelector('#workoutTrainerImage'),
      toggle:document.querySelector('#workoutTimerToggle'),
      reset:document.querySelector('#workoutTimerReset'),
      complete:document.querySelector('#workoutCompleteButton'),
      gate:document.querySelector('#trainingSessionGate'),
      guide:document.querySelector('.workout-guide'),
      console:document.querySelector('.workout-console')
    };
  }

  function activeWorkout(){return Boolean(nodes().view?.classList.contains('active'));}
  function gateReady(){return nodes().gate?.dataset.ready==='true';}
  function allSetsDone(){return nodes().complete?.querySelector('span')?.textContent==='全セット完了';}
  function inRest(){return restIntervalId!==null||restRemaining>0;}

  function ensureStyle(){
    if(document.querySelector('#trainingSessionPresentationStyle'))return;
    const style=document.createElement('style');
    style.id='trainingSessionPresentationStyle';
    style.textContent=`
      #workoutTrainerImage.session-presenting{transition:transform .2s ease,opacity .16s ease,filter .2s ease}
      #workoutTrainerImage.session-pop{animation:sessionTrainerPop .52s cubic-bezier(.2,.8,.25,1)}
      #workoutTrainerImage[data-session-state="struggle"]{filter:saturate(1.08)}
      #workoutTrainerImage[data-session-state="achieved"]{filter:saturate(1.18) drop-shadow(0 0 10px rgba(255,190,55,.45))}
      .training-reaction-burst{position:absolute;z-index:5;left:50%;top:8px;transform:translateX(-50%) scale(.88);padding:6px 12px;border:2px solid #342824;border-radius:999px;background:linear-gradient(#fff8cf,#efb94c);box-shadow:0 3px 0 #8f5c22,0 8px 18px rgba(0,0,0,.18);font-weight:900;font-size:.7rem;letter-spacing:.05em;opacity:0;pointer-events:none;white-space:nowrap}
      .training-reaction-burst.show{animation:sessionBurst .95s ease both}
      .training-rest-card{margin:12px 0;padding:12px 14px;border:2px solid #31302e;border-radius:12px;background:linear-gradient(135deg,#e9f5ff,#c9e5fa);box-shadow:inset 0 1px #fff,0 4px 0 #6d8ca3;color:#1f2930}
      .training-rest-card[hidden]{display:none}
      .training-rest-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
      .training-rest-head span{font-size:.62rem;font-weight:900;letter-spacing:.1em}
      .training-rest-head strong{font-size:1.35rem;line-height:1;font-family:var(--font-display,inherit)}
      .training-rest-card p{margin:7px 0 0;font-size:.66rem;line-height:1.55}
      .training-rest-card i{display:block;height:8px;margin-top:9px;border:1px solid #637b8b;border-radius:999px;overflow:hidden;background:#aec5d5}
      .training-rest-card i b{display:block;height:100%;width:100%;background:linear-gradient(90deg,#3987bb,#73b7df);transition:width .3s linear}
      @keyframes sessionTrainerPop{0%{transform:scale(.9)}55%{transform:scale(1.08)}100%{transform:scale(1)}}
      @keyframes sessionBurst{0%{opacity:0;transform:translateX(-50%) translateY(5px) scale(.82)}22%,72%{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}100%{opacity:0;transform:translateX(-50%) translateY(-8px) scale(.96)}}
      @media (prefers-reduced-motion:reduce){#workoutTrainerImage.session-presenting,.training-rest-card i b{transition:none}.training-reaction-burst.show,#workoutTrainerImage.session-pop{animation:none}.training-reaction-burst.show{opacity:1}}
    `;
    document.head.appendChild(style);
  }

  function ensureReactionBurst(){
    const n=nodes();
    if(!n.guide)return null;
    if(getComputedStyle(n.guide).position==='static')n.guide.style.position='relative';
    let burst=document.querySelector('#trainingReactionBurst');
    if(!burst){
      burst=document.createElement('div');
      burst.id='trainingReactionBurst';
      burst.className='training-reaction-burst';
      burst.setAttribute('aria-live','polite');
      n.guide.appendChild(burst);
    }
    return burst;
  }

  function ensureRestCard(){
    let card=document.querySelector('#trainingRestCard');
    if(card)return card;
    const n=nodes();
    if(!n.console)return null;
    card=document.createElement('section');
    card.id='trainingRestCard';
    card.className='training-rest-card';
    card.hidden=true;
    card.setAttribute('aria-live','polite');
    card.innerHTML='<div class="training-rest-head"><span>REST TIME</span><strong id="trainingRestValue">0:30</strong></div><p id="trainingRestMessage">呼吸を整えて、次のセットに備えましょう。</p><i aria-hidden="true"><b id="trainingRestBar"></b></i>';
    n.console.insertAdjacentElement('afterend',card);
    return card;
  }

  function assetFor(state){
    const current=trainer();
    if(!current)return null;
    const expressions=current.assets?.expressions||{};
    const chibi=current.assets?.chibi||{};
    const map={
      normal:current.assets?.portrait,
      serious:expressions.serious||current.states?.worry||current.assets?.portrait,
      struggle:chibi.struggle||expressions.serious||current.assets?.portrait,
      cheer:expressions.cheer||chibi.cheer||current.assets?.portrait,
      achieved:chibi.achieved||expressions.achieved||current.states?.achieved||current.assets?.portrait,
      rest:chibi.rest||current.states?.rest||current.assets?.portrait
    };
    return map[state]||current.assets?.portrait||null;
  }

  function setTrainerState(state,{pop=false}={}){
    const n=nodes(),current=trainer(),src=assetFor(state);
    if(!n.image||!src)return;
    n.image.classList.add('session-presenting');
    n.image.dataset.sessionState=state;
    n.image.src=src;
    n.image.alt=`${current?.displayName||'トレーナー'}の${state}状態`;
    if(pop){
      n.image.classList.remove('session-pop');
      void n.image.offsetWidth;
      n.image.classList.add('session-pop');
      setTimeout(()=>n.image?.classList.remove('session-pop'),560);
    }
  }

  function showReaction(text){
    const burst=ensureReactionBurst();
    if(!burst)return;
    clearTimeout(reactionTimerId);
    burst.textContent=text;
    burst.classList.remove('show');
    void burst.offsetWidth;
    burst.classList.add('show');
    reactionTimerId=setTimeout(()=>burst.classList.remove('show'),1000);
  }

  function playCue(kind){
    if(typeof window.tone!=='function')return;
    if(kind==='ready'){
      window.tone(660,.07,'triangle',.028);
      window.tone(880,.09,'triangle',.025,.07);
    }else if(kind==='rest-end'){
      window.tone(523,.06,'triangle',.03);
      window.tone(659,.06,'triangle',.03,.07);
      window.tone(784,.1,'triangle',.03,.14);
    }else if(kind==='tick')window.tone(520,.04,'sine',.018);
  }

  function renderRest(){
    const card=ensureRestCard();
    if(!card)return;
    const value=card.querySelector('#trainingRestValue');
    const bar=card.querySelector('#trainingRestBar');
    const message=card.querySelector('#trainingRestMessage');
    value.textContent=`0:${String(Math.max(0,restRemaining)).padStart(2,'0')}`;
    bar.style.width=`${Math.max(0,Math.min(100,restRemaining/REST_SECONDS*100))}%`;
    message.textContent=restRemaining<=3?'次のセットの準備！':restRemaining<=10?'あと少し。呼吸を整えましょう。':'呼吸を整えて、次のセットに備えましょう。';
  }

  function stopRest({restoreControls=true,restoreTrainer=true}={}){
    if(restIntervalId)clearInterval(restIntervalId);
    restIntervalId=null;
    restRemaining=0;
    const card=ensureRestCard();
    if(card)card.hidden=true;
    const n=nodes();
    if(restoreControls){
      if(n.toggle)n.toggle.disabled=false;
      if(n.reset)n.reset.disabled=false;
    }
    if(restoreTrainer&&activeWorkout())setTrainerState('serious',{pop:true});
  }

  function finishRest(){
    stopRest({restoreControls:true,restoreTrainer:true});
    showReaction('NEXT SET!');
    playCue('rest-end');
    if(typeof window.showToast==='function')window.showToast('休憩終了。次のセットへ！','success');
  }

  function startRest(){
    if(allSetsDone())return;
    stopRest({restoreControls:false,restoreTrainer:false});
    restRemaining=REST_SECONDS;
    const card=ensureRestCard(),n=nodes();
    if(card)card.hidden=false;
    if(n.toggle)n.toggle.disabled=true;
    if(n.reset)n.reset.disabled=true;
    if(n.complete)n.complete.disabled=true;
    setTrainerState('rest',{pop:true});
    showReaction('REST 30 SEC');
    renderRest();
    restIntervalId=setInterval(()=>{
      restRemaining=Math.max(0,restRemaining-1);
      if(restRemaining>0&&restRemaining<=3)playCue('tick');
      renderRest();
      if(restRemaining<=0)finishRest();
    },1000);
  }

  function reactToGate(){
    if(!activeWorkout()||inRest())return;
    if(gateReady()){
      setTrainerState('achieved',{pop:true});
      showReaction('PERFECT SET!');
      playCue('ready');
      return;
    }
    const n=nodes();
    if(n.ring?.classList.contains('is-running'))setTrainerState('struggle');
  }

  function bind(){
    ensureStyle();
    ensureReactionBurst();
    ensureRestCard();
    const n=nodes();
    if(!n.view||!n.toggle||!n.complete)return;

    setTrainerState('normal');

    n.toggle.addEventListener('click',()=>setTimeout(()=>{
      if(!activeWorkout()||inRest())return;
      if(n.ring?.classList.contains('is-running')){
        setTrainerState('serious',{pop:true});
        showReaction('START!');
        setTimeout(()=>{if(activeWorkout()&&!inRest()&&n.ring?.classList.contains('is-running')&&!gateReady())setTrainerState('struggle');},700);
      }else if(gateReady())setTrainerState('achieved');
      else setTrainerState('serious');
    },0));

    n.reset.addEventListener('click',()=>setTimeout(()=>{
      if(activeWorkout()&&!inRest())setTrainerState('serious');
    },0));

    document.addEventListener('click',event=>{
      const button=event.target.closest?.('#workoutCompleteButton');
      if(!button||button.disabled||!gateReady()||inRest())return;
      setTimeout(()=>{
        if(!activeWorkout())return;
        setTrainerState('achieved',{pop:true});
        showReaction(allSetsDone()?'WORKOUT CLEAR!':'SET COMPLETE!');
        if(!allSetsDone())setTimeout(()=>{if(activeWorkout())startRest();},850);
      },0);
    },true);

    if(n.gate)new MutationObserver(reactToGate).observe(n.gate,{attributes:true,attributeFilter:['data-ready']});
    if(n.ring)new MutationObserver(()=>{
      if(!activeWorkout()||inRest()||gateReady())return;
      if(n.ring.classList.contains('is-running'))setTrainerState('struggle');
    }).observe(n.ring,{attributes:true,attributeFilter:['class']});

    new MutationObserver(()=>{
      if(activeWorkout()){
        if(!inRest()&&!gateReady())setTrainerState('serious');
      }else{
        stopRest({restoreControls:true,restoreTrainer:false});
        setTrainerState('normal');
      }
    }).observe(n.view,{attributes:true,attributeFilter:['class']});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});
  else bind();
})();
