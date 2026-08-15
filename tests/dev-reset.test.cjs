'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const html=fs.readFileSync(path.join(__dirname,'..','dev-reset.html'),'utf8');

test('developer reset page is gated behind dev=1 and never auto-resets',()=>{
  assert.match(html,/get\('dev'\)===['"]1['"]/);
  assert.match(html,/resetRewards\.disabled=!devEnabled/);
  assert.match(html,/resetAll\.disabled=!devEnabled/);
  assert.doesNotMatch(html,/addEventListener\(['"]load['"],[^)]*reset/i);
});

test('reward QA reset preserves training progress while clearing reward state',()=>{
  const rewardReset=html.match(/function resetRewardQaState\(\)\{([\s\S]*?)\n  \}/)?.[1]||'';
  assert.match(rewardReset,/\.\.\.current/);
  assert.match(rewardReset,/bonusXp:0/);
  assert.match(rewardReset,/quests:QuestCore\.normalizeQuestState\(\)/);
  assert.doesNotMatch(rewardReset,/days:\{\}/);
  assert.doesNotMatch(rewardReset,/totalSets:0/);
  assert.doesNotMatch(rewardReset,/stats:\{strength:0/);
});

test('full QA reset clears gameplay progress but keeps other saved preferences by spreading current state',()=>{
  const fullReset=html.match(/function resetAllProgress\(\)\{([\s\S]*?)\n  \}/)?.[1]||'';
  assert.match(fullReset,/\.\.\.current/);
  assert.match(fullReset,/days:\{\}/);
  assert.match(fullReset,/totalSets:0/);
  assert.match(fullReset,/bonusXp:0/);
  assert.match(fullReset,/stats:\{strength:0,core:0,mobility:0,endurance:0\}/);
  assert.match(fullReset,/quests:QuestCore\.normalizeQuestState\(\)/);
});

test('every reset writes a local backup and restore is explicit',()=>{
  assert.match(html,/const BACKUP_KEY=['"]muscleMasterDevBackupV1['"]/);
  assert.ok((html.match(/saveBackup\(current\)/g)||[]).length>=2);
  assert.match(html,/window\.confirm\(['"]直前のバックアップへ復元しますか？['"]\)/);
});
