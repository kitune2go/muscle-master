(function(){
  if(window.__muscleMasterTrainingTimerPresentation)return;
  window.__muscleMasterTrainingTimerPresentation=true;

  let totalSeconds=0;
  let lastSecond=null;
  let halfwayShown=false;
  let tenShown=false;
  let restoreTimerId=null;

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
      ring:document.querySelector('#workoutTimerRing'),
      mode:document.querySelector('#workoutTimerMode'),
      value:document.querySelector('#workoutTimerValue'),
      image:document.querySelector('#workoutTrainerImage'),
      gate:document.querySelector('#trainingSessionGate'),
      console:document.querySelector('.workout-console'),
      burst:document.querySelector('#trainingReactionBurst'),
      rest:document.querySelector('#trainingRestCard')
    };
  }

  function activeWorkout(){return Boolean(nodes().view?.classList.contains('active'));}
  function isTimerMode(){return nodes().mode?.textContent==='COUNTDOWN';}
  function running(){return Boolean(nodes().ring?.classList.contains('is-running'));}
  function gateReady(){return nodes().gate?.dataset.ready==='true';}
  function inRest(){const card=nodes().rest;return Boolean(card&&!card.hidden);}

  function parseClock(text){
    const match=String(text||'').trim().match(/^(\d+):(\d{2})$/);
    if(!match)return null;
    return Number(match[1])*60+Number(match[2]);
  }

  function ensureStyle(){
    if(document.querySelector('#trainingTimerPresentationStyle'))return;
    const style=document.createElement('style');
    style.id='trainingTimerPresentationStyle';
    style.textContent=`
      .timer-coach-chip{margin:8px auto 0;max-width:290px;padding:7px 11px;border:2px solid #332b27;border-radius:999px;background:linear-gradient(#fff8d6,#efc96b);box-shadow:0 3px 0 #8c642d;color:#251e1a;text-align:center;font-size:.66rem;font-weight:900;letter-spacing:.02em;transition:transform .18s ease,background .18s ease,box-shadow .18s ease}
      .timer-coach-chip[data-phase="final"]{background:linear-gradient(#ffe1dd,#f28a78);box-shadow:0 3px 0 #9a3d31;transform:scale(1.035)}
      .workout-timer-ring.timer-session-active{transition:transform .2s ease,filter .2s ease}
      .workout-timer-ring.timer-session-final{animation:timerFinalPulse .72s ease-in-out infinite;filter:drop-shadow(0 0 9px rgba(227,52,55,.4))}
      .workout-timer-ring.timer-session-final #workoutTimerValue{font-size:1.08em}
      #workoutTrainerImage.timer-countdown-pop{animation:timerCoachPop .42s cubic-bezier(.2,.8,.25,1)}
      @keyframes timerFinalPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.035)}}
      @keyframes timerCoachPop{0%{transform:scale(.93)}55%{transform:scale(1.07)}100%{transform:scale(1)}}
      @media (prefers-reduced-motion:reduce){.workout-timer-ring.timer-session-final,#workoutTrainerImage.timer-countdown-pop{animation:none}.timer-coach-chip{transition:none}}
    `;
    document.head.appendChild(style);
  }

  function ensureCoachChip(){
    let chip=document.querySelector('#timerCoachChip');
    if(chip)return chip;
    const n=nodes();
    if(!n.console)return null;
    chip=document.createElement('div');
    chip.id='timerCoachChip';
    chip.className='timer-coach-chip';
    chip.hidden=true;
    chip.setAttribute('aria-live','polite');
    chip.textContent='リオ：そのまま、呼吸を止めずに！';
    n.console.appendChild(chip);
    return chip;
  }

  function asset(state){
    const current=trainer();
    if(!current)return null;
    const expressions=current.assets?.expressions||{};
    const chibi=current.assets?.chibi||{};
    if(state==='cheer')return expressions.cheer||chibi.cheer||current.assets?.portrait;
    if(state==='struggle')return chibi.struggle||expressions.serious||current.assets?.portrait;
    if(state==='serious')return expressions.serious||current.states?.worry||current.assets?.portrait;
    return current.assets?.portrait||null;
  }

  function setTrainer(state,{pop=false,temporary=false}={}){
    const n=nodes(),current=trainer(),src=asset(state);
    if(!n.image||!src)return;
    clearTimeout(restoreTimerId);
    n.image.dataset.sessionState=state;
    n.image.src=src;
    n.image.alt=`${current?.displayName||'トレーナー'}の${state}状態`;
    if(pop){
      n.image.classList.remove('timer-countdown-pop');
      void n.image.offsetWidth;
      n.image.classList.add('timer-countdown-pop');
      setTimeout(()=>n.image?.classList.remove('timer-countdown-pop'),450);
    }
    if(temporary){
      restoreTimerId=setTimeout(()=>{
        if(activeWorkout()&&isTimerMode()&&running()&&!gateReady()&&!inRest())setTrainer('struggle');
      },900);
    }
  }

  function showBurst(text){
    const burst=nodes().burst;
    if(!burst)return;
    burst.textContent=text;
    burst.classList.remove('show');
    void burst.offsetWidth;
    burst.classList.add('show');
  }

  function playTick(strong=false){
    if(typeof window.tone!=='function')return;
    window.tone(strong?720:560,strong?.07:.045,'triangle',strong?.03:.02);
  }

  function resetTimerPresentation(){
    totalSeconds=0;
    lastSecond=null;
    halfwayShown=false;
    tenShown=false;
    clearTimeout(restoreTimerId);
    const n=nodes(),chip=ensureCoachChip();
    n.ring?.classList.remove('timer-session-active','timer-session-final');
    if(chip){chip.hidden=true;chip.dataset.phase='normal';}
  }

  function setCoach(text,phase='normal'){
    const chip=ensureCoachChip();
    if(!chip)return;
    chip.hidden=false;
    chip.dataset.phase=phase;
    chip.textContent=text;
  }

  function updateTimerPresentation(){
    const n=nodes();
    if(!activeWorkout()||!isTimerMode()||!running()||gateReady()||inRest()){
      if(!running()||!isTimerMode()){
        n.ring?.classList.remove('timer-session-active','timer-session-final');
        const chip=ensureCoachChip();
        if(chip)chip.hidden=true;
      }
      return;
    }

    const remaining=parseClock(n.value?.textContent);
    if(remaining===null)return;
    if(totalSeconds<=0||remaining>totalSeconds){
      totalSeconds=remaining;
      halfwayShown=false;
      tenShown=false;
    }
    if(lastSecond===remaining)return;
    lastSecond=remaining;

    n.ring?.classList.add('timer-session-active');
    setCoach('リオ：そのまま、呼吸を止めずに！');

    const halfway=Math.ceil(totalSeconds/2);
    if(!halfwayShown&&totalSeconds>=12&&remaining<=halfway&&remaining>10){
      halfwayShown=true;
      setTrainer('cheer',{pop:true,temporary:true});
      showBurst('HALFWAY!');
      setCoach('リオ：半分突破！いいペース！');
      playTick(true);
    }

    if(!tenShown&&totalSeconds>10&&remaining<=10&&remaining>5){
      tenShown=true;
      setTrainer('cheer',{pop:true,temporary:true});
      showBurst('あと10秒！');
      setCoach('リオ：あと10秒！姿勢をキープ！');
      playTick(true);
    }

    if(remaining<=5&&remaining>0){
      n.ring?.classList.add('timer-session-final');
      setTrainer('cheer',{pop:remaining===5});
      setCoach(`リオ：ラスト${remaining}秒！`, 'final');
      showBurst(String(remaining));
      if(remaining<=3)playTick(true);
      else playTick(false);
    }else{
      n.ring?.classList.remove('timer-session-final');
    }
  }

  function bind(){
    ensureStyle();
    ensureCoachChip();
    const n=nodes();
    if(!n.view||!n.ring||!n.mode||!n.value)return;

    new MutationObserver(()=>{
      if(!activeWorkout())resetTimerPresentation();
      else updateTimerPresentation();
    }).observe(n.view,{attributes:true,attributeFilter:['class']});

    new MutationObserver(()=>{
      if(!running()){
        const chip=ensureCoachChip();
        n.ring.classList.remove('timer-session-active','timer-session-final');
        if(chip)chip.hidden=true;
      }else updateTimerPresentation();
    }).observe(n.ring,{attributes:true,attributeFilter:['class']});

    new MutationObserver(updateTimerPresentation).observe(n.value,{childList:true,characterData:true,subtree:true});
    new MutationObserver(()=>{
      resetTimerPresentation();
      updateTimerPresentation();
    }).observe(n.mode,{childList:true,characterData:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});
  else bind();
})();
