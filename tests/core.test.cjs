const test=require('node:test');
const assert=require('node:assert/strict');
const Core=require('../app-core.js');

test('XP and levels advance every ten completed sets',()=>{
  assert.equal(Core.xpForTotalSets(10),100);
  assert.equal(Core.levelForTotalSets(10),2);
  assert.equal(Core.levelProgressForTotalSets(14),40);
});

test('the default trainer remains Rio when no custom name exists',()=>{
  assert.equal(Core.trainerDisplayName(''),'リオ');
  assert.equal(Core.trainerDisplayName('  コーチ  '),'コーチ');
});

test('a streak remains visible before the current day workout',()=>{
  const days={
    '2026-08-10':{squat:[true,false,false]},
    '2026-08-11':{mobility:[true]},
    '2026-08-12':{plank:[true,false,false]}
  };
  assert.equal(Core.computeStreak(days,new Date(2026,7,13,8)),3);
});

test('a missed full day ends the streak',()=>{
  const days={
    '2026-08-10':{squat:[true]},
    '2026-08-12':{plank:[true]}
  };
  assert.equal(Core.computeStreak(days,new Date(2026,7,13,8)),1);
});

test('execution clock formats countdown and elapsed time safely',()=>{
  assert.equal(Core.formatClock(0),'00:00');
  assert.equal(Core.formatClock(65),'01:05');
  assert.equal(Core.formatClock(-20),'00:00');
});

test('execution selects the preferred or next incomplete set',()=>{
  assert.equal(Core.nextIncompleteSet([false,false,false],0),0);
  assert.equal(Core.nextIncompleteSet([true,false,false],0),1);
  assert.equal(Core.nextIncompleteSet([true,true,true],1),-1);
});
