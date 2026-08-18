const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');

test('manifest icons and app shell assets exist',()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
  assert.equal(manifest.icons.length,3);
  for(const icon of manifest.icons){
    assert.ok(fs.existsSync(path.join(root,icon.src.replace(/^\.\//,''))),icon.src);
  }
  assert.notDeepEqual(
    fs.readFileSync(path.join(root,'assets/icon-512.png')),
    fs.readFileSync(path.join(root,'assets/icon-maskable-512.png')),
    'maskable icon must use a full-bleed background'
  );
  const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
  for(const required of ['app-core.js','quest-core.js','data/quests/core.json','assets/logo.png','assets/icon-192.png','assets/icon-512.png'])assert.match(sw,new RegExp(required.replace('.','\\.')));
});

test('settings close is a non-submit button',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.match(html,/id="settingsCloseButton"[^>]*type="button"/);
  assert.match(html,/assets\/logo\.png/);
});

test('golden screen uses one runtime stylesheet and vector UI icons',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const styles=[...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(match=>match[1]);
  assert.deepEqual(styles,['./design-match.css']);
  for(const id of ['icon-home','icon-quest','icon-status','icon-log','icon-settings','icon-trophy','icon-dumbbell']){
    assert.match(html,new RegExp(`id="${id}"`));
  }
  assert.match(html,/id="soundButton"[^>]*aria-pressed="true"/);
  assert.match(html,/class="levelup-rewards"/);

  const css=fs.readFileSync(path.join(root,'design-match.css'),'utf8');
  assert.equal((css.match(/{/g)||[]).length,(css.match(/}/g)||[]).length,'CSS braces must be balanced');

  const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
  assert.match(sw,/muscle-master-v19/);
  assert.doesNotMatch(sw,/\.\/style\.css|\.\/v3\.css|\.\/trainer-runtime\.css/);
});

test('quest foundation loads JSON definitions and evaluates training events',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
  const pack=JSON.parse(fs.readFileSync(path.join(root,'data','quests','core.json'),'utf8'));
  assert.match(html,/<script src="\.\/quest-core\.js"><\/script>/);
  assert.ok(html.indexOf('./quest-core.js')<html.indexOf('./app.js'));
  assert.match(app,/QUEST_PACK_URL='\.\/data\/quests\/core\.json'/);
  assert.match(app,/training:set-completed/);
  assert.match(app,/QuestCore\.evaluateQuestPack/);
  assert.match(app,/QuestCore\.mergeQuestEvaluation/);
  assert.ok(pack.quests.some(quest=>quest.type==='daily'));
  assert.ok(pack.quests.some(quest=>quest.type==='weekly'));
});

test('mission board grants rewards once and exposes the persistent presentation queue',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
  const core=fs.readFileSync(path.join(root,'quest-core.js'),'utf8');
  const css=fs.readFileSync(path.join(root,'design-match.css'),'utf8');

  for(const id of ['questTrainingPanel','questMissionPanel','missionCompletedCount','dailyMissionList','weeklyMissionList','extraMissionList','missionTemplate']){
    assert.match(html,new RegExp(`id="${id}"`));
  }
  assert.match(html,/data-quest-mode="training"/);
  assert.match(html,/data-quest-mode="missions"/);
  for(const id of ['rewardPresentationOverlay','rewardPresentationCard','rewardPresentationTitle','rewardPresentationXp','rewardPresentationClose']){
    assert.match(html,new RegExp(`id="${id}"`));
  }
  assert.match(html,/class="mission-claim-button"/);
  assert.match(html,/達成した報酬は1回だけ受け取れます/);
  assert.match(app,/QuestCore\.buildMissionViewModels/);
  assert.match(app,/QuestCore\.grantReward/);
  assert.match(app,/QuestCore\.acknowledgePresentation/);
  assert.match(app,/function showNextRewardPresentation\(\)/);
  assert.match(app,/Core\.totalXp\(state\.totalSets,state\.bonusXp\)/);
  assert.match(app,/active:\{label:'進行中'\}/);
  assert.match(app,/completed:\{label:'達成済み'\}/);
  assert.match(app,/claimed:\{label:'受取済み'\}/);
  assert.match(core,/function buildMissionViewModels/);
  assert.match(core,/function grantReward/);
  assert.match(core,/presentationQueue/);
  assert.match(css,/\.quest-mode-button\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css,/\.mission-card\.status-completed/);
  assert.match(css,/\.mission-claim-button\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css,/\.reward-overlay\.show/);
});

test('training selection exposes readable filters and set status',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
  const css=fs.readFileSync(path.join(root,'design-match.css'),'utf8');

  for(const filter of ['all','strength','core','mobility','endurance']){
    assert.match(html,new RegExp(`data-quest-filter="${filter}"`));
  }
  for(const id of ['questProgressDone','questProgressTotal','exerciseEmptyState']){
    assert.match(html,new RegExp(`id="${id}"`));
  }
  for(const className of ['exercise-xp','exercise-progress','exercise-category','set-buttons-label']){
    assert.match(html,new RegExp(`class="${className}"`));
  }
  assert.match(app,/categories:\['strength','endurance'\]/);
  assert.match(app,/questFilter='all'/);
  assert.match(app,/aria-pressed/);
  assert.match(css,/@media \(max-width: 350px\)/);
});

test('training execution provides set flow, pause and timer controls',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
  const css=fs.readFileSync(path.join(root,'design-match.css'),'utf8');

  for(const id of ['view-workout','workoutTimerToggle','workoutTimerReset','workoutCompleteButton','workoutReturnButton']){
    assert.match(html,new RegExp(`id="${id}"`));
  }
  assert.match(html,/data-view="workout"/);
  assert.match(html,/class="exercise-start-button"/);
  assert.match(app,/execution:\{mode:'timer',value:30/);
  assert.match(app,/function toggleWorkoutClock\(\)/);
  assert.match(app,/function completeWorkoutSet\(\)/);
  assert.match(app,/Core\.nextIncompleteSet/);
  assert.match(css,/\.workout-trainer-frame\s*\{[^}]*overflow:\s*hidden/s);
  assert.match(css,/\.workout-trainer-frame b\s*\{[^}]*overflow-wrap:\s*anywhere/s);
  assert.match(css,/\.workout-mode \.bottom-nav/);
});

test('home progress remains based on the full daily plan while filters are active',()=>{
  const runtime=fs.readFileSync(path.join(root,'trainer-runtime.js'),'utf8');
  assert.match(runtime,/numberFrom\('#questProgressDone'\)/);
  assert.match(runtime,/numberFrom\('#questProgressTotal'\)/);
  assert.doesNotMatch(runtime,/exerciseList \.set-button/);
});

test('home trainer is clipped to the hero and status stays isolated',()=>{
  const css=fs.readFileSync(path.join(root,'design-match.css'),'utf8');
  assert.match(css,/\.home-hero\s*\{[^}]*overflow:\s*hidden[^}]*contain:\s*paint/s);
  assert.match(css,/\.trainer-stage\s*\{[^}]*width:\s*210px[^}]*overflow:\s*hidden/s);
  assert.match(css,/\.home-stats\s*\{\s*position:\s*relative[^}]*overflow:\s*hidden[^}]*isolation:\s*isolate/s);
});

test('trainer name badge stays above progress and handles long names',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const css=fs.readFileSync(path.join(root,'design-match.css'),'utf8');
  assert.match(html,/id="trainerNameInput"[^>]*maxlength="20"/);
  assert.match(css,/\.trainer-badge\s*\{[^}]*bottom:\s*66px[^}]*max-width:\s*min\(128px,\s*calc\(100%\s*-\s*30px\)\)/s);
  assert.match(css,/\.trainer-badge b\s*\{[^}]*overflow:\s*hidden[^}]*text-overflow:\s*ellipsis[^}]*white-space:\s*nowrap/s);
});
