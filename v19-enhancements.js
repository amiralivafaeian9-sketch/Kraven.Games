/* =========================================================
   KRAVEN GAME V20 — Professional UX Layer
   Theme: Dark/White dual mode, Command Search, Quick Preview,
   Library-style shortcuts, lightweight performance telemetry.
   ========================================================= */
(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const THEME_KEY='kraven_v19_mode';
  const state={mode:localStorage.getItem(THEME_KEY)||'dark',previewId:null};
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const safe=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const games=()=>{try{return typeof getGames==='function'?Promise.resolve(getGames()):Promise.resolve([])}catch{return Promise.resolve([])}};

  function applyMode(mode){
    state.mode=mode==='light'?'light':'dark';
    document.documentElement.classList.toggle('kraven-light',state.mode==='light');
    document.body.classList.toggle('kraven-light',state.mode==='light');
    localStorage.setItem(THEME_KEY,state.mode);
    const b=$('#k19-theme-toggle'); if(b){b.querySelector('.ico').textContent=state.mode==='light'?'🌙':'☀️';b.querySelector('.label').textContent=state.mode==='light'?'حالت تیره':'حالت سفید';b.setAttribute('aria-label',state.mode==='light'?'بازگشت به حالت تیره':'فعال‌سازی حالت سفید');}
  }
  function mountTheme(){
    const old=$('#theme-btn'); if(!old) return;
    const b=document.createElement('button');b.id='k19-theme-toggle';b.className='k19-theme-toggle';b.type='button';b.innerHTML='<span class="ico"></span><span class="label"></span>';
    old.replaceWith(b);b.addEventListener('click',()=>applyMode(state.mode==='light'?'dark':'light'));
    applyMode(state.mode);
  }

  async function buildCommand(){
    if($('#k19-command'))return;
    const o=document.createElement('div');o.id='k19-command';o.className='k19-command';
    o.innerHTML='<div class="k19-command-box" role="dialog" aria-modal="true" aria-label="جستجوی Kraven"><div class="k19-command-top"><input id="k19-cmd-input" placeholder="جستجوی بازی، ژانر، سازنده…" autocomplete="off"><span class="k19-command-hint">ESC برای بستن</span></div><div class="k19-results" id="k19-results"></div></div>';
    document.body.appendChild(o);
    const inp=$('#k19-cmd-input');
    const render=async q=>{
      const all=await games(); const s=q.trim().toLowerCase();
      const list=all.filter(g=>!s||[g.title,g.genre,g.developer,g.platform,g.mode].some(x=>String(x||'').toLowerCase().includes(s))).slice(0,18);
      $('#k19-results').innerHTML=list.length?list.map(g=>`<button class="k19-result" data-gid="${safe(g.id)}"><img src="${safe(g.imageData||'')}" loading="lazy" decoding="async"><span><b>${safe(g.title||'بدون عنوان')}</b><span>${safe([g.genre,g.year,g.platform].filter(Boolean).join(' • ')||'Game')}</span></span></button>`).join(''):'<div style="padding:20px;text-align:center;color:var(--text-muted);font:.75rem var(--font)">نتیجه‌ای پیدا نشد.</div>';
    };
    inp.addEventListener('input',()=>render(inp.value));
    o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('open');const r=e.target.closest('.k19-result');if(r){o.classList.remove('open');window._v19Preview(r.dataset.gid);}});
    window.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();o.classList.add('open');inp.focus();render('')}if(e.key==='Escape')o.classList.remove('open')});
    window._v19OpenSearch=()=>{o.classList.add('open');inp.focus();render(inp.value)};
  }

  function mountQuickPreview(){
    if($('#k19-preview'))return;
    const o=document.createElement('div');o.id='k19-preview';o.className='k19-preview';o.innerHTML='<div class="k19-preview-card"><button class="icon-btn k19-preview-close" id="k19-preview-close">✕</button><div id="k19-preview-body"></div></div>';
    document.body.appendChild(o);$('#k19-preview-close').addEventListener('click',()=>o.classList.remove('open'));o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('open')});
  }
  window._v19Preview=async function(id){
    const all=await games(),g=all.find(x=>String(x.id)===String(id));if(!g)return;
    const o=$('#k19-preview'); if(!o)return; state.previewId=id;
    $('#k19-preview-body').innerHTML=`<div class="k19-preview-media"><img src="${safe(g.imageData||'')}" alt="${safe(g.title)}" loading="eager"><div class="k19-preview-side"><div><div style="font:.66rem var(--font);color:var(--accent);font-weight:900;letter-spacing:.8px">KRAVEN QUICK VIEW</div><h2>${safe(g.title||'بدون عنوان')}</h2><div class="k19-preview-meta">${[g.genre,g.year,g.platform,g.mode].filter(Boolean).map(x=>`<span class="k19-chip">${safe(x)}</span>`).join('')}</div><p style="margin-top:12px;font:.77rem/2 var(--font);color:var(--text-secondary)">${safe(g.shortDesc||'اطلاعات کوتاه بازی در دسترس نیست.')}</p></div><div class="k19-preview-actions"><button class="btn btn-primary" id="k19-open-game">🎮 صفحه بازی</button><button class="btn" id="k19-preview-close2">بستن</button></div></div></div>`;
    $('#k19-open-game').onclick=()=>{o.classList.remove('open');window._navigateToGame?.(id)};$('#k19-preview-close2').onclick=()=>o.classList.remove('open');o.classList.add('open');
  };

  function enhanceCards(){
    $$('.game-card').forEach(card=>{
      if(card.querySelector('.k19-game-actions'))return;
      const html=card.getAttribute('onclick')||'';const m=html.match(/_navigateToGame\(['"]([^'"]+)/);if(!m)return;
      const id=m[1];card.style.position='relative';
      const actions=document.createElement('div');actions.className='k19-game-actions';actions.innerHTML='<button class="k19-card-btn" title="پیش‌نمایش">👁</button><button class="k19-card-btn" title="علاقه‌مندی">♡</button>';
      actions.children[0].onclick=e=>{e.stopPropagation();window._v19Preview(id)};
      actions.children[1].onclick=e=>{e.stopPropagation();try{window.toggleLike?.(id);e.currentTarget.textContent='♥';}catch{e.currentTarget.textContent='♥'}};
      card.appendChild(actions);
    });
  }
  function addQuickBar(){
    if($('#k19-quickbar')||!$('#page-home'))return;
    const anchor=$('.search-bar');if(!anchor)return;
    const bar=document.createElement('div');bar.id='k19-quickbar';bar.className='k19-quickbar';bar.innerHTML='<button class="k19-quick" data-k19="latest">🆕 جدیدترین</button><button class="k19-quick" data-k19="rating">⭐ امتیاز بالا</button><button class="k19-quick" data-k19="likes">🔥 محبوب‌ترین</button><button class="k19-quick" data-k19="favorites">❤️ علاقه‌مندی‌ها</button><button class="k19-quick" data-k19="library">📚 کتابخانه</button><button class="k19-quick" data-k19="search">⌕ جستجوی سریع</button>';
    anchor.after(bar);
    bar.addEventListener('click',e=>{const b=e.target.closest('[data-k19]');if(!b)return;const a=b.dataset.k19;if(a==='search')return window._v19OpenSearch?.();if(a==='favorites')return window._go?.('favorites');if(a==='library')return window._go?.('bookmarks');const sel=$('#sort-filter');if(!sel)return;sel.value=a==='latest'?'newest':a;sel.dispatchEvent(new Event('change'))});
  }
  function addStats(){
    if($('#k19-stats'))return;const anchor=$('#games-count');if(!anchor)return;const box=document.createElement('div');box.id='k19-stats';box.className='k19-hero-grid';box.innerHTML='<div class="k19-stat"><b id="k19-st-games">—</b><span>بازی در آرشیو</span></div><div class="k19-stat"><b id="k19-st-favs">—</b><span>علاقه‌مندی محلی</span></div><div class="k19-stat"><b id="k19-st-views">—</b><span>بازدیدهای محلی</span></div><div class="k19-stat"><b id="k19-st-mode">—</b><span>تم فعال</span></div>';anchor.before(box);
    const refresh=async()=>{const all=await games();let fav=0,views=0;try{fav=Object.values(JSON.parse(localStorage.getItem('kraven_likes')||'{}')).filter(Boolean).length}catch{}try{views=Object.values(JSON.parse(localStorage.getItem('kraven_views')||'{}')).reduce((a,b)=>a+(+b||0),0)}catch{}$('#k19-st-games').textContent=all.length;$('#k19-st-favs').textContent=fav;$('#k19-st-views').textContent=views;$('#k19-st-mode').textContent=state.mode==='light'?'سفید':'تیره'};refresh();
  }
  function perfGuard(){
    if(reduced) return;
    let frames=0,last=performance.now();
    const tick=now=>{if(now-last>=1000){if(frames>90)document.documentElement.dataset.k19perf='busy';frames=0;last=now}frames++;requestAnimationFrame(tick)};requestAnimationFrame(tick);
    const mo=new MutationObserver(()=>{let i=0;$$('img').forEach(img=>{if(i++>80)return;if(!img.loading)img.loading='lazy';if(!img.decoding)img.decoding='async'})});mo.observe(document.body,{childList:true,subtree:true});
  }
  function init(){mountTheme();buildCommand();mountQuickPreview();addQuickBar();addStats();enhanceCards();perfGuard();
    const obs=new MutationObserver(()=>{enhanceCards();addQuickBar()});obs.observe(document.body,{childList:true,subtree:true});
    window.addEventListener('kraven:navigate',()=>setTimeout(enhanceCards,180));
    const gb=$('#global-search-btn');if(gb)gb.addEventListener('dblclick',()=>window._v19OpenSearch?.());
    applyMode(state.mode);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,300),{once:true});else setTimeout(init,300);
})();
