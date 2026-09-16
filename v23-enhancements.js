/* KRAVEN V23 — Cinematic Experience + Premium UX + Performance Layer */
(function(){
  'use strict';
  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var fine = !!(window.matchMedia && window.matchMedia('(pointer: fine)').matches);
  var lastClickSfx = 0;
  var audioCtx = null;
  var fxBuffer = null;
  var unlockBound = false;
  var commandOpen = false;
  var commandIndex = 0;
  var commandItems = [];

  function ready(fn){
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',fn,{once:true}); else fn();
  }
  function cssEscape(s){ try{return CSS.escape(s);}catch(e){return String(s).replace(/[^a-z0-9_-]/gi,'');} }
  function qs(s,r){return (r||document).querySelector(s)}
  function qsa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}
  function text(el){return el ? (el.textContent||'').trim() : '';}

  /* ---------- 1. WebAudio click system: instant + layered ---------- */
  async function initAudio(){
    if(audioCtx) return audioCtx;
    try{
      var C=window.AudioContext||window.webkitAudioContext;
      if(!C) return null;
      audioCtx=new C();
      return audioCtx;
    }catch(e){return null;}
  }
  async function loadFxBuffer(){
    if(fxBuffer) return fxBuffer;
    var ctx=await initAudio();
    if(!ctx) return null;
    try{
      var res=await fetch('assets/cursor%20click.mp3',{cache:'force-cache'});
      if(!res.ok) throw new Error('sfx');
      fxBuffer=await ctx.decodeAudioData(await res.arrayBuffer());
    }catch(e){fxBuffer=null;}
    return fxBuffer;
  }
  function playClick(){
    var now=performance.now();
    if(now-lastClickSfx<38) return;
    lastClickSfx=now;
    if(!audioCtx){ initAudio().then(function(){ loadFxBuffer().then(function(){playBuffer(.52);}); }); return; }
    if(audioCtx.state==='suspended') audioCtx.resume().catch(function(){});
    if(fxBuffer){ playBuffer(.52); return; }
    /* instant fallback: tiny synthesized tick while MP3 warms up */
    try{
      var o=audioCtx.createOscillator(), g=audioCtx.createGain();
      o.type='square'; o.frequency.setValueAtTime(1450,audioCtx.currentTime); o.frequency.exponentialRampToValueAtTime(700,audioCtx.currentTime+.035);
      g.gain.setValueAtTime(.0001,audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(.035,audioCtx.currentTime+.004); g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+.045);
      o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.05);
      loadFxBuffer();
    }catch(e){}
  }
  function playBuffer(gain){
    if(!audioCtx||!fxBuffer) return;
    try{
      var src=audioCtx.createBufferSource(), g=audioCtx.createGain();
      src.buffer=fxBuffer; g.gain.value=gain; src.connect(g);g.connect(audioCtx.destination);src.start(0);
    }catch(e){}
  }
  function bindAudioUnlock(){
    if(unlockBound) return; unlockBound=true;
    var unlock=function(){ initAudio().then(loadFxBuffer).then(function(){ if(audioCtx&&audioCtx.state==='suspended') return audioCtx.resume(); }).catch(function(){}); document.removeEventListener('pointerdown',unlock,true); document.removeEventListener('touchstart',unlock,true); };
    document.addEventListener('pointerdown',unlock,true); document.addEventListener('touchstart',unlock,true);
  }

  /* ---------- 2. Toast + Achievement ---------- */
  function toast(message, icon){
    var root=qs('#v23-toast-stack'); if(!root){ root=document.createElement('div');root.id='v23-toast-stack';root.className='v23-toast-stack';document.body.appendChild(root); }
    var el=document.createElement('div');el.className='v23-toast';el.innerHTML='<span aria-hidden="true">'+(icon||'✨')+'</span><span>'+message+'</span>';root.appendChild(el);
    setTimeout(function(){el.classList.add('leaving');setTimeout(function(){el.remove();},300);},2300);
  }
  function achievement(title, body, xp){
    var el=document.createElement('div'); el.className='v23-achievement';
    el.innerHTML='<small>🏆 ACHIEVEMENT UNLOCKED</small><strong>'+title+'</strong><div>'+body+'</div><div class="xp">+'+(xp||50)+' XP</div>';
    document.body.appendChild(el); setTimeout(function(){el.remove();},4200);
  }

  /* ---------- 3. Cinematic hero parallax ---------- */
  function initHeroParallax(){
    if(!fine||reduced) return;
    var hero=qs('#v16-hero'); if(!hero) return;
    var bg=qs('.v16-hero-bg',hero), glow=qs('.v16-hero-glow',hero); if(!bg&&!glow) return;
    var raf=0,tx=0,ty=0,x=0,y=0;
    function update(){raf=0;x+=(tx-x)*.10;y+=(ty-y)*.10;if(bg)bg.style.transform='translate3d('+(x*.55).toFixed(2)+'px,'+(y*.45).toFixed(2)+'px,0) scale(1.035)';if(glow)glow.style.transform='translate3d('+(x*.95).toFixed(2)+'px,'+(y*.8).toFixed(2)+'px,0)';if(Math.abs(tx-x)>.1||Math.abs(ty-y)>.1)raf=requestAnimationFrame(update);}
    hero.addEventListener('pointermove',function(e){var r=hero.getBoundingClientRect();tx=((e.clientX-r.left)/r.width-.5)*20;ty=((e.clientY-r.top)/r.height-.5)*14;if(!raf)raf=requestAnimationFrame(update);},{passive:true});
    hero.addEventListener('pointerleave',function(){tx=0;ty=0;if(!raf)raf=requestAnimationFrame(update);},{passive:true});
  }

  /* ---------- 4. Enhanced game cards + hover preview ---------- */
  function decorateCards(){
    qsa('.game-card').forEach(function(card){
      if(card.dataset.v23Decorated==='1') return;
      card.dataset.v23Decorated='1';card.classList.add('v23-enhanced');
      if(!reduced && fine) card.classList.add('v23-magnetic');
      var title=text(qs('.game-card-title,.game-title,h3,h4',card)) || 'جزئیات بازی';
      var rating=text(qs('.rating,.game-rating,.star-rating',card));
      var genre=text(qs('.game-card-genre,.genre',card));
      var p=document.createElement('div');p.className='v23-card-preview';
      p.innerHTML='<div class="v23-card-preview-row"><span class="v23-card-preview-title">'+title.replace(/[<>]/g,'')+'</span><span>'+((rating||'').slice(0,12))+'</span></div><div class="v23-card-preview-row" style="opacity:.72;margin-top:3px;"><span>'+((genre||'بازی').replace(/[<>]/g,''))+'</span><span>KRAVEN</span></div><div class="v23-card-preview-btns"><button type="button" class="v23-mini-btn" data-v23-preview="open">👁️ پیش‌نمایش</button><button type="button" class="v23-mini-btn" data-v23-preview="favorite">❤️ ذخیره</button></div>';
      card.appendChild(p);
    });
  }
  function openGameFromCard(card){
    try{
      if(card.getAttribute('onclick')){ var oc=card.getAttribute('onclick'); var m=oc.match(/_navigateToGame\(['"]([^'"]+)['"]\)/); if(m&&window._navigateToGame){window._navigateToGame(m[1]);return;} }
      var a=qs('a[href*="game"],a[href^="#"]',card);if(a)a.click();
    }catch(e){}
  }
  function cardFavorite(card){
    var b=qs('[data-action*="like"],[onclick*="like"],[title*="علاقه"]',card); if(b){b.click();toast('به علاقه‌مندی‌ها اضافه شد','❤️');return;}
    toast('بازی ذخیره شد (محلی)','🔖');
  }

  /* ---------- 5. Command palette ---------- */
  var actions=[
    {label:'خانه',icon:'🏠',page:'home'},
    {label:'بازی‌ها',icon:'🎮',page:'home'},
    {label:'اخبار',icon:'📰',page:'news'},
    {label:'علاقه‌مندی‌ها',icon:'❤️',page:'favorites'},
    {label:'مقایسه بازی‌ها',icon:'⚖️',page:'compare'},
    {label:'تقویم عرضه',icon:'📅',page:'calendar'},
    {label:'آموزش‌ها',icon:'📚',page:'tutorials'},
    {label:'تغییر تم',icon:'🌓',action:'theme'},
    {label:'بازی تصادفی',icon:'🎲',action:'random'}
  ];
  function ensureCommand(){
    if(qs('#v23-command-overlay')) return;
    var ov=document.createElement('div');ov.id='v23-command-overlay';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');
    ov.innerHTML='<div class="v23-command"><div class="v23-command-head"><span aria-hidden="true">⌘</span><input id="v23-command-input" type="search" autocomplete="off" placeholder="جستجوی Kraven..." aria-label="جستجوی سریع Kraven"><span class="v23-command-kbd">Esc</span></div><div class="v23-command-list" id="v23-command-list"></div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('pointerdown',function(e){if(e.target===ov)closeCommand();});
    qs('#v23-command-input',ov).addEventListener('input',renderCommand);
    qs('#v23-command-input',ov).addEventListener('keydown',function(e){
      if(e.key==='Escape'){e.preventDefault();closeCommand();}
      else if(e.key==='ArrowDown'){e.preventDefault();commandIndex=Math.min(commandIndex+1,commandItems.length-1);focusCommand();}
      else if(e.key==='ArrowUp'){e.preventDefault();commandIndex=Math.max(commandIndex-1,0);focusCommand();}
      else if(e.key==='Enter'){e.preventDefault();if(commandItems[commandIndex])runCommand(commandItems[commandIndex]);}
    });
  }
  function renderCommand(){
    var input=qs('#v23-command-input'),list=qs('#v23-command-list');if(!input||!list)return;
    var q=(input.value||'').trim().toLowerCase();
    commandItems=actions.filter(function(a){return !q||(a.label+' '+(a.page||'')).toLowerCase().includes(q);});
    /* live game titles if available */
    var cards=qsa('.game-card').slice(0,40);
    cards.forEach(function(card){var title=text(qs('.game-card-title,.game-title,h3,h4',card));if(title&&(!q||title.toLowerCase().includes(q)))commandItems.push({label:title,icon:'🎮',card:card});});
    commandIndex=0;
    list.innerHTML=commandItems.map(function(a,i){return '<button type="button" class="v23-command-item" data-v23-cmd="'+i+'"><span class="v23-command-icon">'+a.icon+'</span><span>'+a.label+'</span></button>';}).join('');
    qsa('[data-v23-cmd]',list).forEach(function(b){b.addEventListener('click',function(){runCommand(commandItems[Number(b.dataset.v23Cmd)]);});});
  }
  function focusCommand(){var list=qs('#v23-command-list');if(!list)return;var b=qs('[data-v23-cmd="'+commandIndex+'"]',list);if(b)b.focus();}
  function runCommand(a){if(!a)return;closeCommand();if(a.page&&window._showPage)window._showPage(a.page);else if(a.page){var link=qs('[data-page="'+cssEscape(a.page)+'"]');if(link)link.click();}else if(a.action==='theme'){var b=qs('#theme-btn');if(b)b.click();}else if(a.action==='random'){var b=qs('#random-btn');if(b)b.click();}else if(a.card){openGameFromCard(a.card);}}
  function openCommand(){ensureCommand();commandOpen=true;var ov=qs('#v23-command-overlay');ov.classList.add('open');var inp=qs('#v23-command-input');inp.value='';renderCommand();setTimeout(function(){inp.focus();},0);playClick();}
  function closeCommand(){commandOpen=false;var ov=qs('#v23-command-overlay');if(ov)ov.classList.remove('open');}

  /* ---------- 6. Mobile bottom navigation ---------- */
  function initBottomNav(){
    if(qs('#v23-bottom-nav')) return;
    var nav=document.createElement('nav');nav.id='v23-bottom-nav';nav.setAttribute('aria-label','ناوبری سریع');
    [['home','🏠','خانه'],['favorites','❤️','علاقه'],['news','📰','اخبار'],['compare','⚖️','مقایسه'],['calendar','📅','عرضه']].forEach(function(x){var b=document.createElement('button');b.type='button';b.className='v23-bottom-item';b.dataset.page=x[0];b.innerHTML='<span>'+x[1]+'</span><span>'+x[2]+'</span>';b.addEventListener('click',function(){var link=qs('[data-page="'+cssEscape(x[0])+'"]');if(link)link.click();playClick();syncBottomNav();});nav.appendChild(b);});
    document.body.appendChild(nav);syncBottomNav();
  }
  function syncBottomNav(){var active=qs('.sidebar-nav [data-page].active');var page=active&&active.dataset.page;qsa('.v23-bottom-item').forEach(function(b){b.classList.toggle('active',b.dataset.page===page);});}

  /* ---------- 7. Theme reveal, without fighting existing theme engine ---------- */
  function initThemeObserver(){
    var root=document.documentElement;
    var last=root.classList.contains('kraven-light');
    var obs=new MutationObserver(function(){var now=root.classList.contains('kraven-light');if(now===last)return;last=now;var btn=qs('#theme-btn'),r=btn?btn.getBoundingClientRect():{left:innerWidth/2,top:40,width:0,height:0};var x=r.left+r.width/2,y=r.top+r.height/2;var el=document.createElement('div');el.className='v23-theme-transition';el.style.setProperty('--v23-x',x+'px');el.style.setProperty('--v23-y',y+'px');el.style.setProperty('--v23-next-bg',now?'#ffffff':'#0f1119');document.body.appendChild(el);setTimeout(function(){el.remove();},680);});
    obs.observe(root,{attributes:true,attributeFilter:['class']});
  }

  /* ---------- 8. Mouse magnetic effect, lightweight ---------- */
  function initMagnetic(){
    if(!fine||reduced) return;
    document.addEventListener('pointermove',function(e){var el=e.target.closest&&e.target.closest('.v23-magnetic');if(!el)return;var r=el.getBoundingClientRect();var dx=(e.clientX-(r.left+r.width/2))/r.width,dy=(e.clientY-(r.top+r.height/2))/r.height;el.style.transform='translate3d('+(dx*5).toFixed(2)+'px,'+(dy*4).toFixed(2)+'px,0)';},{passive:true});
    document.addEventListener('pointerout',function(e){var el=e.target.closest&&e.target.closest('.v23-magnetic');if(el&&!el.contains(e.relatedTarget))el.style.transform='';},{passive:true});
  }

  /* ---------- 9. Smart skeletons for image-first cards ---------- */
  function initImageQuality(){
    qsa('img').forEach(function(img){
      if(img.dataset.v23Img==='1')return;img.dataset.v23Img='1';img.loading=img.loading||'lazy';img.decoding=img.decoding||'async';
      if(!img.complete) img.classList.add('v23-skeleton');
      img.addEventListener('load',function(){img.classList.remove('v23-skeleton');},{once:true,passive:true});
      img.addEventListener('error',function(){img.classList.remove('v23-skeleton');img.classList.add('v23-img-fallback');},{once:true,passive:true});
    });
  }

  /* ---------- 10. Game DNA widget ---------- */
  function inferDNA(){
    var counts={Action:0,RPG:0,Adventure:0,Strategy:0,Indie:0};var total=0;
    var likedKeys=['likes','likedGames','kraven_likes'];
    try{likedKeys.forEach(function(k){var v=localStorage.getItem(k);if(!v)return;var obj=JSON.parse(v);Object.keys(obj||{}).forEach(function(id){if(!obj[id])return;var card=qsa('.game-card').find(function(c){return (c.getAttribute('onclick')||'').includes(String(id));});if(card){var g=text(qs('.game-card-genre,.genre',card)).toLowerCase();total++;Object.keys(counts).forEach(function(cat){if(g.includes(cat.toLowerCase()))counts[cat]++;});}});});}catch(e){}
    if(total<3){var cards=qsa('.game-card').slice(0,12);cards.forEach(function(c){var g=text(qs('.game-card-genre,.genre',c)).toLowerCase();total++;Object.keys(counts).forEach(function(cat){if(g.includes(cat.toLowerCase()))counts[cat]++;});});}
    var vals=Object.keys(counts).map(function(k){return [k,counts[k]];});var sum=vals.reduce(function(a,x){return a+x[1];},0)||1;return vals.map(function(x){return [x[0],Math.round(x[1]/sum*100)];});
  }
  function initDNA(){
    if(qs('#v23-dna-card'))return;
    var host=qs('#home-recent')||qs('#home-trending');if(!host)return;
    var el=document.createElement('section');el.id='v23-dna-card';el.className='v23-dna v22-reveal';
    el.innerHTML='<div class="v23-section-label">🧬 Game DNA</div><p style="opacity:.72;margin:8px 0 14px">بر اساس بازی‌هایی که در Kraven کشف می‌کنی، DNA گیمینگت شکل می‌گیرد.</p><div class="v23-dna-grid" id="v23-dna-grid"></div>';
    host.parentNode.insertBefore(el,host);var grid=qs('#v23-dna-grid',el);inferDNA().forEach(function(row){var d=document.createElement('div');d.className='v23-dna-row';d.innerHTML='<span>'+row[0]+'</span><span class="v23-dna-bar"><i class="v23-dna-fill" style="width:'+row[1]+'%"></i></span><b>'+row[1]+'%</b>';grid.appendChild(d);});
  }

  /* ---------- 11. Easter egg ---------- */
  function initEgg(){
    var typed='';
    document.addEventListener('keydown',function(e){if(e.key.length!==1)return;typed=(typed+e.key.toLowerCase()).slice(-6);if(typed==='kraven'){typed='';achievement('Kraven Mode','راز Kraven را پیدا کردی 😈',250);document.body.classList.add('kraven-egg');setTimeout(function(){document.body.classList.remove('kraven-egg');},5200);}});
  }

  /* ---------- 12. Global interaction polish + quick actions ---------- */
  function bindInteractions(){
    document.addEventListener('pointerdown',function(e){
      var el=e.target.closest&&e.target.closest('button,a,[role="button"],.game-card,.icon-btn,.v16-primary,.v16-ghost');
      if(el&&!el.closest('#v23-command-overlay')) playClick();
      var p=e.target.closest&&e.target.closest('[data-v23-preview]');if(p){e.preventDefault();e.stopPropagation();var card=p.closest('.game-card');if(p.dataset.v23Preview==='open'){openGameFromCard(card);toast('در حال باز کردن صفحه بازی…','🎮');}else cardFavorite(card);}
    },true);
    document.addEventListener('keydown',function(e){
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openCommand();}
      else if(e.key==='/'&&!/input|textarea|select/i.test(document.activeElement&&document.activeElement.tagName)){e.preventDefault();openCommand();}
      else if(e.key==='Escape'&&commandOpen){closeCommand();}
    });
    document.addEventListener('click',function(e){var page=e.target.closest&&e.target.closest('[data-page]');if(page)setTimeout(syncBottomNav,100);});
  }

  function refresh(){decorateCards();initImageQuality();initDNA();syncBottomNav();}

  ready(function(){
    bindAudioUnlock();bindInteractions();ensureCommand();initHeroParallax();initBottomNav();initThemeObserver();initMagnetic();initEgg();refresh();
    [250,800,1600,3000].forEach(function(ms){setTimeout(refresh,ms);});
    /* SPA-safe periodic rescans without MutationObserver loops. */
    var clicks=0;document.addEventListener('click',function(){clicks++;if(clicks%7===0)setTimeout(refresh,60);},{passive:true});
    /* Surface a welcome micro-UX only on the first V23 run. */
    try{if(localStorage.getItem('kraven_v23_welcomed')!=='1'){setTimeout(function(){toast('Kraven V23 آماده‌ست — Ctrl + K را امتحان کن!','⚡');localStorage.setItem('kraven_v23_welcomed','1');},1200);}}catch(e){}
  });
})();
