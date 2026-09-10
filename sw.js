const CACHE="pqo-study-v3-2";
const CORE=[
  "./","./index.html","./style.css","./data.js","./app.js","./config.js",
  "./manifest.webmanifest","./icons/icon-192.png","./icons/icon-512.png"
];
const SUPABASE_CDN="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

self.addEventListener("install",event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await cache.addAll(CORE);
    try{
      const response=await fetch(SUPABASE_CDN,{mode:"no-cors"});
      await cache.put(SUPABASE_CDN,response);
    }catch(_e){}
    await self.skipWaiting();
  })());
});

self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith("pqo-study-")&&k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

function isSupabaseApi(url){return url.hostname.endsWith(".supabase.co")}
function isStaticLocal(request,url){
  return url.origin===self.location.origin && (request.destination==="script"||request.destination==="style"||request.destination==="image"||url.pathname.endsWith(".webmanifest"));
}

self.addEventListener("fetch",event=>{
  const request=event.request;if(request.method!=="GET")return;
  const url=new URL(request.url);

  if(isSupabaseApi(url)){
    event.respondWith(fetch(request));
    return;
  }

  if(request.mode==="navigate"){
    event.respondWith((async()=>{
      try{
        const fresh=await fetch(request);
        const cache=await caches.open(CACHE);cache.put("./index.html",fresh.clone());
        return fresh;
      }catch(_e){return (await caches.match("./index.html")) || (await caches.match("./"))}
    })());
    return;
  }

  if(isStaticLocal(request,url)||url.href===SUPABASE_CDN||url.hostname==="cdn.jsdelivr.net"){
    event.respondWith((async()=>{
      const cached=await caches.match(request) || await caches.match(url.href);
      if(cached){
        event.waitUntil(fetch(request).then(async r=>{const c=await caches.open(CACHE);await c.put(request,r.clone())}).catch(()=>{}));
        return cached;
      }
      try{
        const fresh=await fetch(request);const cache=await caches.open(CACHE);await cache.put(request,fresh.clone());return fresh;
      }catch(_e){return new Response("",{status:503,statusText:"Offline"})}
    })());
    return;
  }

  event.respondWith(fetch(request).catch(()=>caches.match(request)));
});
