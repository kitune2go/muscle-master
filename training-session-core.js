(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.MuscleMasterTrainingSessionCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const DEFAULT_REP_CADENCE_SECONDS=2;

  function clampInt(value,min=0,max=Number.MAX_SAFE_INTEGER){
    const n=Math.floor(Number(value)||0);
    return Math.min(max,Math.max(min,n));
  }

  function repCountForElapsed(elapsedSeconds,targetReps,cadenceSeconds=DEFAULT_REP_CADENCE_SECONDS){
    const target=clampInt(targetReps,1);
    const cadence=Math.max(1,Number(cadenceSeconds)||DEFAULT_REP_CADENCE_SECONDS);
    const elapsed=Math.max(0,Number(elapsedSeconds)||0);
    return Math.min(target,Math.floor(elapsed/cadence));
  }

  function isSessionReady({mode,started=false,targetReps=0,repCount=0,remainingSeconds=0}={}){
    if(!started)return false;
    if(mode==='timer')return Number(remainingSeconds)<=0;
    return clampInt(repCount)>=clampInt(targetReps,1);
  }

  function progressPercent({mode,targetReps=0,repCount=0,totalSeconds=0,remainingSeconds=0}={}){
    if(mode==='timer'){
      const total=Math.max(1,Number(totalSeconds)||1);
      const remaining=Math.max(0,Number(remainingSeconds)||0);
      return Math.max(0,Math.min(100,Math.round((total-remaining)/total*100)));
    }
    const target=clampInt(targetReps,1);
    return Math.max(0,Math.min(100,Math.round(clampInt(repCount)/target*100)));
  }

  return {DEFAULT_REP_CADENCE_SECONDS,repCountForElapsed,isSessionReady,progressPercent};
});
