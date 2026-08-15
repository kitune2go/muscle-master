(function(){
  const Trainers=window.MuscleMasterTrainers||{};

  function saved(){
    try{return JSON.parse(localStorage.getItem('muscleMasterStateV2')||'{}')||{};}
    catch{return {};}
  }

  function trainer(){
    const state=saved();
    return Trainers[state.trainerId||'rio']||Trainers.rio;
  }

  function numberFrom(selector){
    const value=Number.parseInt(document.querySelector(selector)?.textContent||'0',10);
    return Number.isFinite(value)?value:0;
  }

  function currentStateKey(){
    const progress=numberFrom('#progressText');
    const plan=document.querySelector('#planName')?.textContent||'';
    if(plan==='回復日'&&progress===0)return 'rest';
    if(progress===0)return 'normal';
    if(progress<30)return 'smile';
    if(progress<60)return 'cheer';
    if(progress<90)return 'praise';
    if(progress<100)return 'cheer';
    return 'achieved';
  }

  function titleFor(totalSets){
    if(totalSets>=100)return '鋼の継続者';
    if(totalSets>=50)return '鉄の意志';
    if(totalSets>=10)return '努力のルーキー';
    if(totalSets>=1)return '最初の一歩';
    return '見習いトレーニー';
  }

  function syncProgress(){
    const completed=numberFrom('#questProgressDone');
    const total=numberFrom('#questProgressTotal');
    const percent=numberFrom('#progressText');
    const doneNode=document.querySelector('#goldenProgressDone');
    const totalNode=document.querySelector('#goldenProgressTotal');
    const bar=document.querySelector('#goldenProgressBar');
    if(doneNode)doneNode.textContent=completed;
    if(totalNode)totalNode.textContent=total;
    if(bar)bar.style.width=`${Math.max(0,Math.min(100,percent))}%`;
  }

  function syncStats(){
    const sources={
      strength:'#strengthValue',
      core:'#coreValue',
      mobility:'#mobilityValue',
      endurance:'#enduranceValue'
    };
    Object.entries(sources).forEach(([key,selector])=>{
      const value=numberFrom(selector);
      const row=document.querySelector(`#goldenHomeStats [data-stat="${key}"]`);
      if(!row)return;
      const bar=row.querySelector('.stat-meter i');
      const level=row.querySelector('.stat-level');
      if(bar)bar.style.width=`${Math.max(0,Math.min(100,value))}%`;
      if(level)level.textContent=`Lv.${Math.max(1,Math.ceil(value/10))}`;
    });
  }

  function syncProfile(current){
    const state=saved();
    const name=document.querySelector('#goldenPlayerName');
    const title=document.querySelector('#goldenPlayerTitle');
    const avatar=document.querySelector('#goldenPlayerAvatar');
    const xpBar=document.querySelector('#goldenXpBar');
    const xp=numberFrom('#xpText');
    if(name)name.textContent=state.userName||'タナカ';
    if(title)title.textContent=titleFor(Number(state.totalSets||0));
    if(avatar){avatar.src=current.assets.portrait;avatar.alt=current.displayName;}
    if(xpBar)xpBar.style.width=`${Math.max(0,Math.min(100,xp%100))}%`;
  }

  function bindSettingsNav(){
    const button=document.querySelector('#goldenSettingsNav');
    if(!button||button.dataset.bound)return;
    button.dataset.bound='1';
    button.addEventListener('click',()=>document.querySelector('#settingsButton')?.click());
  }

  function apply(){
    const current=trainer();
    if(!current)return;

    const hero=document.querySelector('#trainerArt');
    if(hero){hero.src=current.assets.hero;hero.alt=`応援トレーナーの${current.displayName}`;}

    const expression=document.querySelector('#trainerExpression');
    if(expression){
      const stateKey=currentStateKey();
      expression.src=current.states[stateKey]||current.assets.portrait;
      expression.dataset.trainerState=stateKey;
      expression.alt=`${current.displayName}の${stateKey}状態`;
    }

    const levelUp=document.querySelector('#levelUpTrainerArt');
    if(levelUp)levelUp.src=current.states.levelUp||current.assets.levelUp;

    const workout=document.querySelector('#workoutTrainerImage');
    if(workout){workout.src=current.assets.portrait;workout.alt=`トレーナーの${current.displayName}`;}

    syncProfile(current);
    syncProgress();
    syncStats();
    bindSettingsNav();
  }

  function observe(){
    ['#progressText','#planName','#levelText','#xpText','#totalSetsText','#heroTitle','#strengthValue','#coreValue','#mobilityValue','#enduranceValue'].forEach(selector=>{
      const target=document.querySelector(selector);
      if(target)new MutationObserver(apply).observe(target,{childList:true,subtree:true,characterData:true});
    });
    const exerciseList=document.querySelector('#exerciseList');
    if(exerciseList)new MutationObserver(syncProgress).observe(exerciseList,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    window.addEventListener('storage',apply);
    document.querySelector('#settingsForm')?.addEventListener('submit',()=>setTimeout(apply,0));
  }

  function loadScript(src,id){
    if(document.querySelector(`#${id}`))return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.id=id;
      script.src=src;
      script.defer=true;
      script.onload=resolve;
      script.onerror=reject;
      document.body.appendChild(script);
    });
  }

  function loadTrainingSessionRuntime(){
    return loadScript('./training-session-core.js','trainingSessionCoreScript')
      .then(()=>loadScript('./training-session-runtime.js','trainingSessionRuntimeScript'))
      .catch(error=>console.warn('Training session runtime could not be loaded.',error));
  }

  apply();
  observe();
  loadTrainingSessionRuntime();
})();
