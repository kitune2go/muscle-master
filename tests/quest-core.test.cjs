const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Quest=require('../quest-core.js');

const pack=JSON.parse(fs.readFileSync(path.join(__dirname,'..','data','quests','core.json'),'utf8'));
const exerciseCatalog={
  squat:{categories:['strength','endurance']},
  pushup:{categories:['strength','endurance']},
  plank:{categories:['core','endurance']},
  mobility:{categories:['mobility']}
};
const trainingState={
  totalSets:6,
  days:{
    '2026-08-10':{squat:[true,true,false]},
    '2026-08-11':{mobility:[true]},
    '2026-08-12':{plank:[true,true,false],pushup:[true,false,false]}
  }
};

test('quest JSON pack has stable ids and replaceable media slots',()=>{
  const validated=Quest.validateQuestPack(pack);
  assert.equal(validated.schemaVersion,1);
  assert.equal(new Set(validated.quests.map(quest=>quest.id)).size,validated.quests.length);
  for(const quest of validated.quests){
    assert.ok(Object.hasOwn(quest.presentation.media,'imageUrl'));
    assert.ok(Object.hasOwn(quest.presentation.media,'audioUrl'));
    assert.equal(typeof quest.presentation.trainerDialogue.default,'string');
  }
});

test('daily and Monday-based weekly progress are recomputed from training records',()=>{
  const evaluation=Quest.evaluateQuestPack(pack,trainingState,{now:new Date(2026,7,12,12),exerciseCatalog});
  const byId=Object.fromEntries(evaluation.instances.map(instance=>[instance.questId,instance]));
  assert.equal(byId.daily_complete_3_sets.value,3);
  assert.equal(byId.daily_complete_3_sets.complete,true);
  assert.equal(byId.daily_core_2_sets.value,2);
  assert.equal(byId.weekly_active_3_days.value,3);
  assert.equal(byId.weekly_active_3_days.complete,true);
  assert.equal(byId.weekly_complete_12_sets.value,6);
  assert.equal(byId.weekly_complete_12_sets.complete,false);
  assert.match(byId.weekly_active_3_days.periodKey,/weekly:2026-08-10/);
});

test('completion records are created once and survive later progress decreases',()=>{
  const now=new Date(2026,7,12,12);
  const evaluation=Quest.evaluateQuestPack(pack,trainingState,{now,exerciseCatalog});
  const first=Quest.mergeQuestEvaluation({},evaluation,now);
  assert.equal(first.newlyCompleted.length,4);
  const repeated=Quest.mergeQuestEvaluation(first.state,evaluation,new Date(2026,7,12,13));
  assert.equal(repeated.newlyCompleted.length,0);

  const reduced=Quest.evaluateQuestPack(pack,{totalSets:0,days:{}},{now,exerciseCatalog});
  const afterUndo=Quest.mergeQuestEvaluation(repeated.state,reduced,new Date(2026,7,12,14));
  const instanceId=evaluation.instances.find(instance=>instance.questId==='daily_first_set').instanceId;
  assert.equal(afterUndo.state.progress[instanceId].value,0);
  assert.equal(afterUndo.state.progress[instanceId].complete,true);
  assert.ok(afterUndo.state.completions[instanceId]);
});

test('reward claim ledger rejects duplicate records for the same quest instance',()=>{
  const now=new Date(2026,7,12,12);
  const evaluation=Quest.evaluateQuestPack(pack,trainingState,{now,exerciseCatalog});
  const merged=Quest.mergeQuestEvaluation({},evaluation,now);
  const instanceId=merged.newlyCompleted[0].instanceId;
  const first=Quest.recordRewardClaim(merged.state,instanceId,new Date(2026,7,12,13));
  const duplicate=Quest.recordRewardClaim(first.state,instanceId,new Date(2026,7,12,14));
  assert.equal(first.recorded,true);
  assert.equal(duplicate.recorded,false);
  assert.equal(duplicate.reason,'already-recorded');
  assert.deepEqual(duplicate.claim,first.claim);
});

test('mission view models distinguish active, completed and claimed states',()=>{
  const now=new Date(2026,7,12,12);
  const evaluation=Quest.evaluateQuestPack(pack,trainingState,{now,exerciseCatalog});
  const merged=Quest.mergeQuestEvaluation({},evaluation,now);
  const claimTarget=merged.newlyCompleted[0].instanceId;
  const claimed=Quest.recordRewardClaim(merged.state,claimTarget,new Date(2026,7,12,13));
  const missions=Quest.buildMissionViewModels(evaluation,claimed.state);
  const byInstance=Object.fromEntries(missions.map(mission=>[mission.instanceId,mission]));
  assert.equal(byInstance[claimTarget].status,'claimed');
  assert.equal(byInstance[claimTarget].percent,100);
  assert.ok(missions.some(mission=>mission.status==='completed'));
  assert.ok(missions.some(mission=>mission.status==='active'));

  const reduced=Quest.evaluateQuestPack(pack,{totalSets:0,days:{}},{now,exerciseCatalog});
  const afterUndo=Quest.buildMissionViewModels(reduced,claimed.state);
  const persisted=afterUndo.find(mission=>mission.instanceId===claimTarget);
  assert.equal(persisted.status,'claimed');
  assert.equal(persisted.displayValue,persisted.target);
  assert.equal(persisted.percent,100);
});

test('legacy saves receive optional quest state without changing training data',()=>{
  const legacy={totalSets:3,days:{'2026-08-12':{squat:[true,true,true]}}};
  const quests=Quest.normalizeQuestState(legacy.quests);
  assert.deepEqual(quests,{schemaVersion:1,progress:{},completions:{},rewardClaims:{}});
  assert.equal(legacy.totalSets,3);
});
