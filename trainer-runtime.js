(function(){
  const Trainers=window.MuscleMasterTrainers||{};

  function storedTrainerId(){
    try{
      const raw=localStorage.getItem('muscleMasterStateV2');
      if(raw){const parsed=JSON.parse(raw);if(parsed&&parsed.trainerId)return parsed.trainerId;}
    }catch{}
    return 'rio';
  }

  function trainer(){return Trainers[storedTrainerId()]||Trainers.rio;}

  function ensureExpressionNode(){
    let node=document.querySelector('#trainerExpression');
    if(node)return node;
    const current=document.querySelector('.speech-avatar');
    if(!current)return null;
    node=document.createElement('img');
    node.id='trainerExpression';
    node.className='speech-avatar trainer-expression';
    node.alt='リオの表情';
    current.replaceWith(node);
    return node;
  }

  function ensureLevelUpNode(){
    let node=document.querySelector('#levelUpTrainerArt');
    if(node)return node;
    const card=document.querySelector('.levelup-card');
    if(!card)return null;
    node=document.createElement('img');
    node.id='levelUpTrainerArt';
    node.className='levelup-trainer-art';
    node.alt='レベルアップを祝うリオ';
    const number=card.querySelector('#levelUpNumber');
    card.insertBefore(node,number);
    return node;
  }

  function progressValue(){
    const text=document.querySelector('#progressText')?.textContent||'0';
    const value=Number.parseInt(text,10);
    return Number.isFinite(value)?value:0;
  }

  function currentStateKey(){
    const progress=progressValue();
    const plan=document.querySelector('#planName')?.textContent||'';
    if(plan==='回復日'&&progress===0)return 'rest';
    if(progress===0)return 'normal';
    if(progress<30)return 'smile';
    if(progress<60)return 'cheer';
    if(progress<90)return 'praise';
    if(progress<100)return 'cheer';
    return 'achieved';
  }

  function apply(){
    const current=trainer();
    if(!current)return;

    const hero=document.querySelector('#trainerArt');
    if(hero){hero.src=current.assets.hero;hero.alt=`応援トレーナーの${current.displayName}`;}

    const expression=ensureExpressionNode();
    if(expression){
      const stateKey=currentStateKey();
      expression.src=current.states[stateKey]||current.assets.portrait;
      expression.dataset.trainerState=stateKey;
      expression.alt=`${current.displayName}の${stateKey}状態`;
    }

    const levelUp=ensureLevelUpNode();
    if(levelUp)levelUp.src=current.states.levelUp||current.assets.levelUp;
  }

  function observe(){
    ['#progressText','#planName'].forEach(selector=>{
      const target=document.querySelector(selector);
      if(target)new MutationObserver(apply).observe(target,{childList:true,subtree:true,characterData:true});
    });
    window.addEventListener('storage',apply);
  }

  apply();
  observe();
})();
