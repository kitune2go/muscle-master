const CACHE_NAME='muscle-master-v11';
const APP_SHELL=[
  './','./index.html','./design-match.css',
  './app-core.js','./trainer-data.js','./app.js','./trainer-runtime.js','./manifest.json',
  './assets/logo.png','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png','./assets/icon-maskable-512.png',
  './assets/trainers/rio/manifest.json','./assets/trainers/rio/base-master.webp','./assets/trainers/rio/hero.webp','./assets/trainers/rio/portrait.webp','./assets/trainers/rio/level-up.webp',
  './assets/trainers/rio/expressions/neutral.webp','./assets/trainers/rio/expressions/smile.webp','./assets/trainers/rio/expressions/cheer.webp','./assets/trainers/rio/expressions/blush.webp','./assets/trainers/rio/expressions/serious.webp','./assets/trainers/rio/expressions/tired.webp','./assets/trainers/rio/expressions/angry.webp','./assets/trainers/rio/expressions/achieved.webp',
  './assets/trainers/rio/chibi/normal.webp','./assets/trainers/rio/chibi/cheer.webp','./assets/trainers/rio/chibi/struggle.webp','./assets/trainers/rio/chibi/rest.webp','./assets/trainers/rio/chibi/achieved.webp'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))));self.clients.claim();});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;if(event.request.mode==='navigate'){event.respondWith(fetch(event.request).then(response=>{if(response.ok)caches.open(CACHE_NAME).then(cache=>cache.put('./index.html',response.clone()));return response;}).catch(()=>caches.match('./index.html')));return;}event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));}return response;})));});
