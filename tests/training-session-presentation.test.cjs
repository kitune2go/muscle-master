const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('trial presentation reuses existing trainer art states',()=>{
  const runtime=read('training-session-presentation.js');
  const trainerData=read('trainer-data.js');
  for(const token of ['serious','struggle','achieved','rest'])assert.match(runtime,new RegExp(token));
  assert.match(trainerData,/expressions:\{/);
  assert.match(trainerData,/chibi:\{/);
  assert.match(trainerData,/struggle:'\.\/assets\/trainers\/rio\/chibi\/struggle\.webp'/);
  assert.match(trainerData,/rest:'\.\/assets\/trainers\/rio\/chibi\/rest\.webp'/);
  assert.match(trainerData,/achieved:'\.\/assets\/trainers\/rio\/chibi\/achieved\.webp'/);
});

test('trial presentation adds a thirty second rest phase without changing mission records',()=>{
  const runtime=read('training-session-presentation.js');
  assert.match(runtime,/const REST_SECONDS=30/);
  assert.match(runtime,/REST 30 SEC/);
  assert.match(runtime,/PERFECT SET!/);
  assert.match(runtime,/SET COMPLETE!/);
  assert.doesNotMatch(runtime,/training:set-completed/);
  assert.doesNotMatch(runtime,/QuestCore/);
});

test('presentation observers stay narrow to avoid self-trigger loops',()=>{
  const runtime=read('training-session-presentation.js');
  assert.match(runtime,/observe\(n\.gate,\{attributes:true,attributeFilter:\['data-ready'\]\}\)/);
  assert.match(runtime,/observe\(n\.ring,\{attributes:true,attributeFilter:\['class'\]\}\)/);
  assert.match(runtime,/observe\(n\.view,\{attributes:true,attributeFilter:\['class'\]\}\)/);
  assert.doesNotMatch(runtime,/subtree:true/);
});
