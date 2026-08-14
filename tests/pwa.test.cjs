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
  for(const required of ['app-core.js','assets/logo.png','assets/icon-192.png','assets/icon-512.png'])assert.match(sw,new RegExp(required.replace('.','\\.')));
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
  assert.match(sw,/muscle-master-v12/);
  assert.doesNotMatch(sw,/\.\/style\.css|\.\/v3\.css|\.\/trainer-runtime\.css/);
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
