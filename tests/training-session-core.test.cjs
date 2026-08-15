const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const SessionCore=require('../training-session-core.js');

const root=path.resolve(__dirname,'..');

function read(file){return fs.readFileSync(path.join(root,file),'utf8');}

test('rep guide advances at a stable cadence and caps at target',()=>{
  assert.equal(SessionCore.repCountForElapsed(0,12,2),0);
  assert.equal(SessionCore.repCountForElapsed(1,12,2),0);
  assert.equal(SessionCore.repCountForElapsed(2,12,2),1);
  assert.equal(SessionCore.repCountForElapsed(24,12,2),12);
  assert.equal(SessionCore.repCountForElapsed(999,12,2),12);
});

test('session completion requires an actually started guide',()=>{
  assert.equal(SessionCore.isSessionReady({mode:'reps',started:false,targetReps:12,repCount:12}),false);
  assert.equal(SessionCore.isSessionReady({mode:'reps',started:true,targetReps:12,repCount:11}),false);
  assert.equal(SessionCore.isSessionReady({mode:'reps',started:true,targetReps:12,repCount:12}),true);
  assert.equal(SessionCore.isSessionReady({mode:'timer',started:false,remainingSeconds:0}),false);
  assert.equal(SessionCore.isSessionReady({mode:'timer',started:true,remainingSeconds:1}),false);
  assert.equal(SessionCore.isSessionReady({mode:'timer',started:true,remainingSeconds:0}),true);
});

test('runtime blocks incomplete quick-set completion and redirects into execution',()=>{
  const runtime=read('training-session-runtime.js');
  assert.match(runtime,/\.set-button:not\(\.done\)/);
  assert.match(runtime,/stopImmediatePropagation\(\)/);
  assert.match(runtime,/exercise-start-button/);
  assert.match(runtime,/window\.openWorkout/);
  assert.match(runtime,/complete\.disabled=!session\.ready/);
});

test('trainer runtime loads the session gate and service worker caches it',()=>{
  const trainerRuntime=read('trainer-runtime.js');
  const sw=read('sw.js');
  assert.match(trainerRuntime,/training-session-core\.js/);
  assert.match(trainerRuntime,/training-session-runtime\.js/);
  assert.match(sw,/muscle-master-v17/);
  assert.match(sw,/training-session-core\.js/);
  assert.match(sw,/training-session-runtime\.js/);
});
