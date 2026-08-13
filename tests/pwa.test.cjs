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
