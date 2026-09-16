const CACHE_NAME='kraven-game-v25.1-2026-09';
const APP_SHELL=[
 './index.html','./manifest.json','./app.js?v=25.1','./app.css',
 './v17.css','./v17-enhancements.js','./v18.css','./v18-enhancements.js',
 './v19.css','./v19-enhancements.js','./v20.css','./v20-enhancements.js',
 './v21.css','./v21-enhancements.js','./v22.css','./v22-enhancements.js',
 './v23.css','./v23-enhancements.js','./v25.css','./v25-enhancements.js',
 './arcade.css','./kraven-arcade.js','./kraven-header.webp','./kraven-click.mp3,'./games.json','./news.json','./faq.json','./releases.json','./adSlots.json','./tutorials.json','./ads.json','./content-manifest.json']
];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(APP_SHELL).catch(()=>{})).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
function isData(req){const u=new URL(req.url);return /\.(?:json|mp3)$/.test(u.pathname);}
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET') return;
 const req=e.request;
 if(req.mode==='navigate'){
   e.respondWith(fetch(req,{cache:'no-store'}).then(r=>{if(r.ok)caches.open(CACHE_NAME).then(c=>c.put('./index.html',r.clone()));return r;}).catch(()=>caches.match('./index.html'))); return;
 }
 if(isData(req)){
   e.respondWith(fetch(req,{cache:'no-store'}).then(r=>{if(r.ok)caches.open(CACHE_NAME).then(c=>c.put(req,r.clone()));return r;}).catch(()=>caches.match(req))); return;
 }
 e.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(r=>{if(r.ok&&r.type==='basic')caches.open(CACHE_NAME).then(c=>c.put(req,r.clone()));return r;})));
});
