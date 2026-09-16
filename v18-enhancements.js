/* =========================================================
   KRAVEN GAME V18 — Professional Platform Experience
   Additive, local-first, performance-safe layer.
   ========================================================= */
(function(){
  'use strict';

  const KEY = 'kraven_v18_state';
  const state = (()=>{
    try { return Object.assign({audio:true, motion:true, recent:[], sessions:0}, JSON.parse(localStorage.getItem(KEY)||'{}')); }
    catch { return {audio:true,motion:true,recent:[],sessions:0}; }
  })();
  const save=()=>{ try{localStorage.setItem(KEY,JSON.stringify(state));}catch{} };
  const $=(s,r=document)=>r.querySelector(s);
  const esc=(s)=>{const d=document.createElement('div');d.textContent=s??'';return d.innerHTML;};
  const isHome=()=>$('#page-home')?.classList.contains('active');

  // 1) Legacy V18 sort helper retained; V19 overrides the first-load default to NEWEST.
  function setOldestDefault(){
    const sel=$('#sort-filter'); if(!sel) return;
    if(!localStorage.getItem('kraven_v18_sort_initialized')){
      sel.value='newest';
      localStorage.setItem('kraven_v18_sort_initialized','1');
      sel.dispatchEvent(new Event('change'));
    }
  }
  const originalClear=window._clearGameFilters;
  window._clearGameFilters=function(){
    if(typeof originalClear==='function') originalClear();
    const sel=$('#sort-filter'); if(sel){sel.value='newest';sel.dispatchEvent(new Event('change'));}
  };

  // 2) Lightweight local recent history + recommendation engine.
  function pushRecent(id){
    if(!id) return;
    state.recent=[id].concat((state.recent||[]).filter(x=>x!==id)).slice(0,12);
    save();
  }
  const originalNav=window._navigateToGame;
  if(typeof originalNav==='function'){
    window._navigateToGame=function(id){ pushRecent(id); state.sessions=(state.sessions||0)+1; save(); return originalNav.apply(this,arguments); };
  }
  function getGamesSafe(){
    try{return typeof getGames==='function'?getGames():Promise.resolve([]);}catch{return Promise.resolve([])}
  }
  function likedIds(){try{return Object.keys(JSON.parse(localStorage.getItem('kraven_likes')||'{}')).filter(k=>JSON.parse(localStorage.getItem('kraven_likes')||'{}')[k]);}catch{return[]}}
  function card(g){
    const img=g.imageData?`<img src="${g.imageData}" loading="lazy" decoding="async" alt="${esc(g.title||'بازی')}" />`:'<div class="v18-cover-placeholder">🎮</div>';
    return `<article class="v18-game-card" data-v18-game="${esc(g.id)}"><div class="v18-cover">${img}</div><div class="v18-g-body"><div class="v18-g-title">${esc(g.title||'بدون عنوان')}</div><div class="v18-g-meta">${esc(g.genre||'Gaming')} • ${esc(String(g.year||'—'))}</div><div class="v18-g-score">★ ${esc(String(g.rating||'0.0'))}</div></div></article>`;
  }
  async function renderProSections(){
    const anchor=$('#games-grid'); if(!anchor || !isHome()) return;
    let wrap=$('#v18-pro-sections');
    if(!wrap){
      wrap=document.createElement('div'); wrap.id='v18-pro-sections';
      wrap.innerHTML=`
        <section class="v18-section" id="v18-continue-section">
          <div class="v18-head"><div><span class="v18-kicker">CONTINUE</span><h2>▶️ ادامه بده</h2><p>آخرین بازی‌هایی که باز کردی، همین‌جا آماده‌اند.</p></div></div><div class="v18-rail" id="v18-continue"></div>
        </section>
        <section class="v18-section">
          <div class="v18-head"><div><span class="v18-kicker">SMART PICKS</span><h2>🎯 پیشنهادهای هوشمند</h2><p>بر پایه‌ی علاقه‌مندی‌ها و بازی‌هایی که اخیراً دیدی.</p></div></div><div class="v18-rail" id="v18-recommendations"></div>
        </section>
        <section class="v18-section">
          <div class="v18-head"><div><span class="v18-kicker">LOCAL ANALYTICS</span><h2>📊 آمار Kraven</h2><p>آمار شخصی این مرورگر؛ بدون سرویس خارجی.</p></div></div><div class="v18-analytics" id="v18-analytics"></div>
        </section>`;
      anchor.insertAdjacentElement('afterend',wrap);
      wrap.addEventListener('click',e=>{const c=e.target.closest('[data-v18-game]');if(c)window._navigateToGame?.(c.dataset.v18Game);});
    }
    const games=await getGamesSafe(); if(!Array.isArray(games)) return;
    const map=new Map(games.map(g=>[String(g.id),g]));
    const recent=(state.recent||[]).map(id=>map.get(String(id))).filter(Boolean).slice(0,6);
    $('#v18-continue').innerHTML=recent.length?recent.map(card).join(''):'<div class="v18-empty">هنوز بازی‌ای برای ادامه دادن نداریم؛ یک بازی را باز کن تا این بخش شروع به کار کند 🎮</div>';
    const liked=likedIds();
    const genres=liked.map(id=>map.get(id)?.genre).filter(Boolean);
    let rec=games.filter(g=>!liked.includes(String(g.id)) && genres.includes(g.genre));
    if(rec.length<6){
      const recentGenres=recent.map(g=>g.genre).filter(Boolean);
      rec=rec.concat(games.filter(g=>!rec.includes(g)&&!liked.includes(String(g.id))&&recentGenres.includes(g.genre)));
    }
    if(rec.length<6){
      rec=rec.concat(games.filter(g=>!rec.includes(g)&&!liked.includes(String(g.id))).sort((a,b)=>Number(b.rating||0)-Number(a.rating||0)));
    }
    rec=rec.slice(0,6);
    $('#v18-recommendations').innerHTML=rec.length?rec.map(card).join(''):'<div class="v18-empty">برای پیشنهاد شخصی، چند بازی را ببین یا لایک کن.</div>';

    const views=(()=>{try{return JSON.parse(localStorage.getItem('kraven_views')||'{}')}catch{return{}}})();
    const viewCount=Object.values(views).reduce((a,b)=>a+Number(b||0),0);
    const likes=liked.length;
    const uniqueSeen=Object.keys(views).length;
    const topId=Object.entries(views).sort((a,b)=>Number(b[1])-Number(a[1]))[0]?.[0];
    const topGame=map.get(String(topId));
    $('#v18-analytics').innerHTML=`
      <div class="v18-stat"><strong>${uniqueSeen}</strong><span>بازی دیده‌شده</span></div>
      <div class="v18-stat"><strong>${viewCount}</strong><span>بازدید ثبت‌شده</span></div>
      <div class="v18-stat"><strong>${likes}</strong><span>علاقه‌مندی</span></div>
      <div class="v18-stat"><strong>${state.sessions||0}</strong><span>ورود به صفحه بازی</span></div>
      <div class="v18-stat v18-wide"><strong>${esc(topGame?.title||'—')}</strong><span>پربازدیدترین بازی این مرورگر</span></div>`;
  }

  // 3) Professional experience controls: audio + motion, stored locally.
  function patchK10Settings(){
    const settingsPanel=document.querySelector('.k10-panel[data-panel="settings"]');
    if(!settingsPanel || settingsPanel.querySelector('#v18-audio-toggle')) return;
    const box=document.createElement('div'); box.className='v18-settings-box';
    box.innerHTML=`<div class="v18-setting-row"><div><b>🔊 صدای تعامل</b><small>صدای کلیک و بازخورد لمسی</small></div><button id="v18-audio-toggle" class="v18-toggle ${state.audio?'on':''}" type="button">${state.audio?'روشن':'خاموش'}</button></div>
      <div class="v18-setting-row"><div><b>📱 Motion Background</b><small>حرکت زنده‌ی پس‌زمینه روی موبایل</small></div><button id="v18-motion-toggle" class="v18-toggle ${state.motion?'on':''}" type="button">${state.motion?'روشن':'خاموش'}</button></div>`;
    settingsPanel.prepend(box);
    $('#v18-audio-toggle').onclick=()=>{state.audio=!state.audio;save();document.documentElement.classList.toggle('v18-audio-off',!state.audio);const b=$('#v18-audio-toggle');b.classList.toggle('on',state.audio);b.textContent=state.audio?'روشن':'خاموش';};
    $('#v18-motion-toggle').onclick=()=>{state.motion=!state.motion;save();document.documentElement.classList.toggle('v18-motion-off',!state.motion);const b=$('#v18-motion-toggle');b.classList.toggle('on',state.motion);b.textContent=state.motion?'روشن':'خاموش';};
  }
  function addProBadge(){
    if($('#v18-pro-launch')) return;
    const bar=document.getElementById('v5-appbar');
    if(!bar) return;
    const b=document.createElement('button'); b.id='v18-pro-launch'; b.className='v5-pill primary'; b.textContent='⚡ Kraven Pro';
    b.onclick=()=>{const btn=document.querySelector('[data-k10-open="discovery"]'); if(btn) btn.click(); else document.getElementById('hamburger-btn')?.click();};
    bar.appendChild(b);
  }

  // 4) Image performance: lazy-load non-critical media and remove eager decode pressure.
  function optimizeImages(){
    document.querySelectorAll('img').forEach(img=>{
      if(!img.hasAttribute('decoding')) img.setAttribute('decoding','async');
      if(!img.closest('#loading-screen,header,.logo,.game-detail-header') && !img.hasAttribute('loading')) img.loading='lazy';
    });
  }

  function boot(){
    setOldestDefault();
    document.documentElement.classList.toggle('v18-audio-off',!state.audio);
    document.documentElement.classList.toggle('v18-motion-off',!state.motion);
    optimizeImages();
    patchK10Settings(); addProBadge();
    if(isHome()) setTimeout(renderProSections,450);
    const refresh=()=>{setOldestDefault();patchK10Settings();addProBadge();optimizeImages();if(isHome())setTimeout(renderProSections,180);};
    window.addEventListener('hashchange',refresh,{passive:true});
    window.addEventListener('kraven:navigate',refresh,{passive:true});
    window.addEventListener('kraven:v17:ready',refresh,{passive:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
