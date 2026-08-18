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

test('runtime observers do not watch their own session panel subtree',()=>{
  const runtime=read('training-session-runtime.js');
  assert.doesNotMatch(runtime,/observe\(n\.view,\{attributes:true,attributeFilter:\['class'\],subtree:true/);
  assert.match(runtime,/observe\(n\.view,\{attributes:true,attributeFilter:\['class'\]\}\)/);
  assert.match(runtime,/\[n\.exercise,n\.set,n\.mode,n\.value,n\.status\]\.forEach\(node=>observeSource\(node\)\)/);
  assert.match(runtime,/observeSource\(n\.ring,\{attributes:true,attributeFilter:\['class'\]\}\)/);
});

test('timer presentation adds milestone and final-five cues without broad DOM observation',()=>{
  const timerPresentation=read('training-timer-presentation.js');
  assert.match(timerPresentation,/HALFWAY!/);
  assert.match(timerPresentation,/あと10秒！/);
  assert.match(timerPresentation,/remaining<=5/);
  assert.match(timerPresentation,/timer-session-final/);
  assert.match(timerPresentation,/ラスト\$\{remaining\}秒/);
  assert.doesNotMatch(timerPresentation,/observe\(n\.view,[^\n]*subtree:true/);
});

test('trainer runtime loads the session gate and service worker caches it',()=>{
  const trainerRuntime=read('trainer-runtime.js');
  const sw=read('sw.js');
  assert.match(trainerRuntime,/training-session-core\.js/);
  assert.match(trainerRuntime,/training-session-runtime\.js/);
  assert.match(trainerRuntime,/training-session-presentation\.js/);
  assert.match(trainerRuntime,/training-timer-presentation\.js/);
  assert.match(sw,/muscle-master-v19/);
  assert.match(sw,/training-session-core\.js/);
  assert.match(sw,/training-session-runtime\.js/);
  assert.match(sw,/training-session-presentation\.js/);
  assert.match(sw,/training-timer-presentation\.js/);
});
