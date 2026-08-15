(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.MuscleMasterQuestCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const SCHEMA_VERSION=1;
  const QUEST_TYPES=new Set(['daily','weekly','challenge','event','achievement']);
  const METRICS=new Set(['completed_sets','active_days','completed_exercises','total_sets']);
  const TIERS=new Set(['minor','standard','major','special']);

  function isRecord(value){return Boolean(value)&&typeof value==='object'&&!Array.isArray(value);}
  function clone(value){return value===undefined?undefined:JSON.parse(JSON.stringify(value));}
  function cleanRecord(value){return isRecord(value)?clone(value):{};}
  function toDate(value=new Date()){
    const parsed=value instanceof Date?new Date(value.getTime()):new Date(value);
    if(Number.isNaN(parsed.getTime()))throw new TypeError('A valid date is required.');
    return parsed;
  }
  function dateKey(value=new Date()){
    const date=toDate(value);
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  }
  function dateFromKey(key){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(String(key)))return null;
    const [year,month,day]=String(key).split('-').map(Number);
    const date=new Date(year,month-1,day);
    return date.getFullYear()===year&&date.getMonth()===month-1&&date.getDate()===day?date:null;
  }
  function shiftedDate(value,days){
    const date=toDate(value);
    date.setDate(date.getDate()+days);
    return date;
  }
  function mondayFor(value){
    const date=toDate(value);
    date.setHours(0,0,0,0);
    date.setDate(date.getDate()-((date.getDay()+6)%7));
    return date;
  }
  function periodForQuest(definition,now=new Date()){
    const current=toDate(now);
    if(definition.type==='daily'){
      const key=dateKey(current);
      return {key:`daily:${key}`,startKey:key,endKey:key};
    }
    if(definition.type==='weekly'){
      const start=mondayFor(current),startKey=dateKey(start),endKey=dateKey(shiftedDate(start,6));
      return {key:`weekly:${startKey}`,startKey,endKey};
    }
    if(definition.type==='event'&&isRecord(definition.availability)){
      const startKey=definition.availability.start||null,endKey=definition.availability.end||null;
      return {key:`event:${startKey||'open'}:${endKey||'open'}`,startKey,endKey};
    }
    return {key:`${definition.type}:all-time`,startKey:null,endKey:null};
  }
  function isQuestActive(definition,now=new Date()){
    if(definition.type!=='event'||!isRecord(definition.availability))return true;
    const current=dateKey(now),{start,end}=definition.availability;
    return (!start||current>=start)&&(!end||current<=end);
  }
  function validateStringArray(value,label){
    if(value===undefined)return;
    if(!Array.isArray(value)||value.some(item=>typeof item!=='string'||!item.trim()))throw new TypeError(`${label} must be an array of strings.`);
  }
  function validateQuestPack(input){
    if(!isRecord(input))throw new TypeError('Quest pack must be an object.');
    if(input.schemaVersion!==SCHEMA_VERSION)throw new TypeError(`Unsupported quest schema version: ${input.schemaVersion}`);
    if(!/^[a-z0-9][a-z0-9_-]*$/.test(String(input.packId||'')))throw new TypeError('Quest pack requires a stable packId.');
    if(!Array.isArray(input.quests))throw new TypeError('Quest pack requires a quests array.');
    const ids=new Set();
    for(const quest of input.quests){
      if(!isRecord(quest)||!/^[a-z0-9][a-z0-9_-]*$/.test(String(quest.id||'')))throw new TypeError('Every quest requires a stable id.');
      if(ids.has(quest.id))throw new TypeError(`Duplicate quest id: ${quest.id}`);
      ids.add(quest.id);
      if(!QUEST_TYPES.has(quest.type))throw new TypeError(`Unsupported quest type: ${quest.type}`);
      if(!METRICS.has(quest.metric))throw new TypeError(`Unsupported quest metric: ${quest.metric}`);
      if(!Number.isFinite(Number(quest.target))||Number(quest.target)<=0)throw new TypeError(`Quest ${quest.id} requires a positive target.`);
      const filters=isRecord(quest.filters)?quest.filters:{};
      validateStringArray(filters.exerciseIds,`${quest.id}.filters.exerciseIds`);
      validateStringArray(filters.categories,`${quest.id}.filters.categories`);
      if(!isRecord(quest.reward))throw new TypeError(`Quest ${quest.id} requires reward data.`);
      const presentation=quest.presentation;
      if(!isRecord(presentation)||typeof presentation.title!=='string'||!presentation.title.trim())throw new TypeError(`Quest ${quest.id} requires presentation.title.`);
      if(!TIERS.has(presentation.tier))throw new TypeError(`Quest ${quest.id} has an unsupported presentation tier.`);
      if(!isRecord(presentation.media)||!Object.hasOwn(presentation.media,'imageUrl')||!Object.hasOwn(presentation.media,'audioUrl'))throw new TypeError(`Quest ${quest.id} requires imageUrl and audioUrl media slots.`);
      for(const field of ['imageUrl','audioUrl'])if(presentation.media[field]!==null&&typeof presentation.media[field]!=='string')throw new TypeError(`Quest ${quest.id} presentation.media.${field} must be a string or null.`);
      if(!isRecord(presentation.trainerDialogue)||typeof presentation.trainerDialogue.default!=='string')throw new TypeError(`Quest ${quest.id} requires default trainer dialogue.`);
    }
    return clone(input);
  }

  function normalizeQuestState(value){
    const source=isRecord(value)?value:{};
    return {
      schemaVersion:SCHEMA_VERSION,
      progress:cleanRecord(source.progress),
      completions:cleanRecord(source.completions),
      rewardClaims:cleanRecord(source.rewardClaims)
    };
  }
  function exerciseMatches(exerciseId,filters,catalog){
    if(Array.isArray(filters.exerciseIds)&&filters.exerciseIds.length&&!filters.exerciseIds.includes(exerciseId))return false;
    if(Array.isArray(filters.categories)&&filters.categories.length){
      const exercise=catalog[exerciseId];
      const categories=Array.isArray(exercise?.categories)?exercise.categories:[];
      if(!filters.categories.some(category=>categories.includes(category)))return false;
    }
    return true;
  }
  function keysInPeriod(days,period){
    return Object.keys(isRecord(days)?days:{}).filter(key=>dateFromKey(key)&&(!period.startKey||key>=period.startKey)&&(!period.endKey||key<=period.endKey));
  }
  function completedSetsInDay(day,filters,catalog){
    if(!isRecord(day))return 0;
    return Object.entries(day).reduce((total,[exerciseId,sets])=>{
      if(!Array.isArray(sets)||!exerciseMatches(exerciseId,filters,catalog))return total;
      return total+sets.filter(Boolean).length;
    },0);
  }
  function metricValue(definition,trainingState,period,catalog){
    const days=isRecord(trainingState?.days)?trainingState.days:{};
    const filters=isRecord(definition.filters)?definition.filters:{};
    const keys=keysInPeriod(days,period);
    if(definition.metric==='total_sets'&&!filters.exerciseIds&&!filters.categories)return Math.max(0,Math.floor(Number(trainingState?.totalSets)||0));
    if(definition.metric==='completed_sets'||definition.metric==='total_sets')return keys.reduce((total,key)=>total+completedSetsInDay(days[key],filters,catalog),0);
    if(definition.metric==='active_days')return keys.filter(key=>completedSetsInDay(days[key],filters,catalog)>0).length;
    if(definition.metric==='completed_exercises'){
      return keys.reduce((total,key)=>total+Object.entries(isRecord(days[key])?days[key]:{}).filter(([exerciseId,sets])=>Array.isArray(sets)&&sets.length>0&&sets.every(Boolean)&&exerciseMatches(exerciseId,filters,catalog)).length,0);
    }
    return 0;
  }
  function evaluateQuestPack(input,trainingState={},options={}){
    const pack=validateQuestPack(input),now=toDate(options.now||new Date()),catalog=isRecord(options.exerciseCatalog)?options.exerciseCatalog:{};
    const instances=pack.quests.filter(quest=>isQuestActive(quest,now)).map(quest=>{
      const period=periodForQuest(quest,now),value=metricValue(quest,trainingState,period,catalog),target=Math.floor(Number(quest.target));
      return {
        instanceId:`${quest.id}@${period.key}`,
        questId:quest.id,
        type:quest.type,
        metric:quest.metric,
        periodKey:period.key,
        value,
        target,
        complete:value>=target,
        reward:clone(quest.reward),
        presentation:clone(quest.presentation)
      };
    });
    return {schemaVersion:SCHEMA_VERSION,packId:pack.packId,evaluatedAt:now.toISOString(),instances};
  }
  function mergeQuestEvaluation(current,evaluation,now=new Date()){
    const state=normalizeQuestState(current),completedAt=toDate(now).toISOString(),newlyCompleted=[];
    for(const instance of Array.isArray(evaluation?.instances)?evaluation.instances:[]){
      const priorCompletion=state.completions[instance.instanceId];
      state.progress[instance.instanceId]={
        questId:instance.questId,
        type:instance.type,
        periodKey:instance.periodKey,
        value:instance.value,
        target:instance.target,
        complete:Boolean(instance.complete||priorCompletion),
        updatedAt:evaluation.evaluatedAt||completedAt
      };
      if(instance.complete&&!priorCompletion){
        const completion={
          questId:instance.questId,
          type:instance.type,
          periodKey:instance.periodKey,
          completedAt,
          reward:clone(instance.reward),
          presentation:clone(instance.presentation)
        };
        state.completions[instance.instanceId]=completion;
        newlyCompleted.push({instanceId:instance.instanceId,...clone(completion)});
      }
    }
    return {state,newlyCompleted};
  }
  function buildMissionViewModels(evaluation,current){
    const state=normalizeQuestState(current);
    return (Array.isArray(evaluation?.instances)?evaluation.instances:[]).map(instance=>{
      const target=Math.max(1,Math.floor(Number(instance.target)||1));
      const value=Math.max(0,Math.floor(Number(instance.value)||0));
      const claimed=Boolean(state.rewardClaims[instance.instanceId]);
      const completed=Boolean(instance.complete||state.completions[instance.instanceId]||claimed);
      const displayValue=completed?target:Math.min(value,target);
      return {
        ...clone(instance),
        value,
        target,
        displayValue,
        percent:Math.min(100,Math.round(displayValue/target*100)),
        status:claimed?'claimed':completed?'completed':'active',
        completed,
        claimed
      };
    });
  }
  function recordRewardClaim(current,instanceId,now=new Date()){
    const state=normalizeQuestState(current),completion=state.completions[instanceId];
    if(!completion)return {state,recorded:false,reason:'not-completed',claim:null};
    if(state.rewardClaims[instanceId])return {state,recorded:false,reason:'already-recorded',claim:clone(state.rewardClaims[instanceId])};
    const claim={questId:completion.questId,periodKey:completion.periodKey,reward:clone(completion.reward),claimedAt:toDate(now).toISOString()};
    state.rewardClaims[instanceId]=claim;
    return {state,recorded:true,reason:null,claim:clone(claim)};
  }

  return {SCHEMA_VERSION,dateKey,periodForQuest,validateQuestPack,normalizeQuestState,evaluateQuestPack,mergeQuestEvaluation,buildMissionViewModels,recordRewardClaim};
});
