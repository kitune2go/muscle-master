(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.MuscleMasterCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const DEFAULT_TRAINER_NAME='リオ';

  function todayKey(date=new Date()){
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  }

  function hasActivity(day){
    return Boolean(day&&Object.values(day).some(value=>Array.isArray(value)&&value.some(Boolean)));
  }

  function computeStreak(days={},now=new Date()){
    let streak=0;
    const cursor=new Date(now.getFullYear(),now.getMonth(),now.getDate());
    if(!hasActivity(days[todayKey(cursor)]))cursor.setDate(cursor.getDate()-1);
    while(hasActivity(days[todayKey(cursor)])){
      streak+=1;
      cursor.setDate(cursor.getDate()-1);
    }
    return streak;
  }

  function normalizedTotalSets(totalSets){
    const parsed=Number(totalSets);
    return Number.isFinite(parsed)?Math.max(0,Math.floor(parsed)):0;
  }

  function normalizedXp(value){
    const parsed=Number(value);
    return Number.isFinite(parsed)?Math.max(0,Math.floor(parsed)):0;
  }

  function xpForTotalSets(totalSets){return normalizedTotalSets(totalSets)*10;}
  function totalXp(totalSets,bonusXp=0){return xpForTotalSets(totalSets)+normalizedXp(bonusXp);}
  function levelForXp(value){return Math.floor(normalizedXp(value)/100)+1;}
  function levelProgressForXp(value){return normalizedXp(value)%100;}
  function levelForTotalSets(totalSets){return levelForXp(xpForTotalSets(totalSets));}
  function levelProgressForTotalSets(totalSets){return levelProgressForXp(xpForTotalSets(totalSets));}
  function trainerDisplayName(name){return String(name||'').trim()||DEFAULT_TRAINER_NAME;}
  function formatClock(totalSeconds){
    const safe=Math.max(0,Math.floor(Number(totalSeconds)||0));
    return `${String(Math.floor(safe/60)).padStart(2,'0')}:${String(safe%60).padStart(2,'0')}`;
  }
  function nextIncompleteSet(sets=[],preferredIndex=0){
    if(!Array.isArray(sets)||!sets.length)return -1;
    const safeIndex=Math.max(0,Math.min(sets.length-1,Math.floor(Number(preferredIndex)||0)));
    if(!sets[safeIndex])return safeIndex;
    const after=sets.findIndex((done,index)=>index>safeIndex&&!done);
    if(after!==-1)return after;
    return sets.findIndex(done=>!done);
  }

  return {DEFAULT_TRAINER_NAME,todayKey,hasActivity,computeStreak,normalizedXp,xpForTotalSets,totalXp,levelForXp,levelProgressForXp,levelForTotalSets,levelProgressForTotalSets,trainerDisplayName,formatClock,nextIncompleteSet};
});
