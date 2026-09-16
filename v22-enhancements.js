/* KRAVEN V22 — typography, typewriter, cinematic scroll reveal */
(function(){
  'use strict';
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raf = 0;
  var scrollY = 0;

  function ready(fn){
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',fn,{once:true});
    else fn();
  }

  function typeText(el, text, opts){
    if(!el || el.dataset.v22Typed === '1') return;
    opts = opts || {};
    if(reduced){ el.textContent=text; el.dataset.v22Typed='1'; return; }
    var speed = opts.speed || 42;
    var startDelay = opts.startDelay || 260;
    var wrap = document.createElement('span');
    wrap.className='v22-typewriter-wrap';
    var dyn = document.createElement('span');
    dyn.className='v22-typewriter-dynamic v22-typewriter-ready';
    var caret = document.createElement('span');
    caret.className='v22-caret';
    caret.setAttribute('aria-hidden','true');
    wrap.appendChild(dyn); wrap.appendChild(caret);
    el.textContent=''; el.appendChild(wrap); el.classList.add('v22-typing-target');
    el.dataset.v22Typed='1';
    var i=0;
    window.setTimeout(function tick(){
      dyn.textContent=text.slice(0,i++);
      if(i<=text.length) window.setTimeout(tick,speed);
      else window.setTimeout(function(){caret.style.opacity='.55';},700);
    },startDelay);
  }

  function markRevealCandidates(){
    var selectors = [
      '#page-home > .page-header',
      '#v16-hero', '#v16-hero + .v16-metrics',
      '.featured-section-title', '#featured-slider',
      '.ad-slot', '.search-bar', '.games-grid', '.news-list',
      '.k21-shell', '.k21-panel', '.k21-grid', '.game-detail',
      '.empty-state', '.page-header', '.content-section', '.section',
      '[class*="section-title"]'
    ];
    var seen = new Set();
    selectors.forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(el){
        if(seen.has(el) || el.id==='loading-screen' || el.closest('#main-header')) return;
        seen.add(el);
        if(!el.classList.contains('v22-reveal')) el.classList.add('v22-reveal');
        if(el.matches('.featured-slider,.games-grid,.news-list,.k21-grid')) el.classList.add('v22-card-stagger');
        if(el.matches('.featured-section-title,[class*="section-title"],.page-header h1')) el.classList.add('v22-section-heading');
      });
    });
  }

  function initObserver(){
    markRevealCandidates();
    var items = document.querySelectorAll('.v22-reveal:not([data-v22-observed])');
    if(reduced){items.forEach(function(el){el.classList.add('v22-visible');});return;}
    if(!('IntersectionObserver' in window)) {items.forEach(function(el){el.classList.add('v22-visible');});return;}
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('v22-visible');
          entry.target.dataset.v22Observed='1';
          io.unobserve(entry.target);
        }
      });
    },{root:null,rootMargin:'0px 0px -8% 0px',threshold:.10});
    items.forEach(function(el){io.observe(el);});
  }

  function initTyping(){
    var pageHome = document.getElementById('page-home');
    if(!pageHome) return;
    var headerTitle = pageHome.querySelector('.page-header h1');
    if(headerTitle && headerTitle.dataset.v22Typed!=='1') typeText(headerTitle,'دنیای بی‌کران بازی‌ها را فتح کن',{speed:34,startDelay:220});
    var heroKicker = pageHome.querySelector('.v16-kicker');
    if(heroKicker && !heroKicker.classList.contains('v22-reveal')) heroKicker.classList.add('v22-reveal');
    var desc = pageHome.querySelector('.page-header p');
    if(desc && desc.dataset.v22Typed!=='1'){
      desc.dataset.v22Typed='1';
      desc.classList.add('v22-type-desc');
      var txt=desc.textContent.trim();
      desc.textContent='';
      var span=document.createElement('span');span.textContent=txt;span.style.display='inline-block';span.style.opacity='0';span.style.transform='translateY(5px)';span.style.transition='opacity .6s var(--v22-ease),transform .7s var(--v22-spring)';
      desc.appendChild(span);
      requestAnimationFrame(function(){setTimeout(function(){span.style.opacity='1';span.style.transform='none';},900)});
    }
  }

  function initScrollAtmosphere(){
    var bg=document.querySelector('.soft-rgb-bg');
    if(!bg || reduced) return;
    bg.classList.add('v22-scroll-atmosphere');
    function update(){
      raf=0;
      var y=Math.min(window.scrollY,1400);
      scrollY=y;
      bg.style.setProperty('--v22-scroll-y',(y*-.035).toFixed(2)+'px');
    }
    function onScroll(){if(!raf) raf=requestAnimationFrame(update);}
    window.addEventListener('scroll',onScroll,{passive:true});
    update();
  }

  function refreshLater(){
    initObserver();
  }

  ready(function(){
    initTyping();
    initObserver();
    initScrollAtmosphere();
    [300,900,1600].forEach(function(ms){setTimeout(refreshLater,ms);});

    /* Re-scan when SPA navigation swaps pages, without a permanent mutation observer. */
    document.addEventListener('click',function(e){
      var target=e.target.closest && e.target.closest('[data-page]');
      if(target) setTimeout(refreshLater,120);
    },{passive:true});

    /* Ensure dynamically-rendered content becomes reveal-ready after common renders. */
    var hooks=['renderGames','renderNews','renderFavorites','renderHomeExtras','renderGameDetail'];
    hooks.forEach(function(name){
      var fn=window[name];
      if(typeof fn!=='function' || fn.__v22Wrapped) return;
      var wrapped=function(){var r=fn.apply(this,arguments); setTimeout(refreshLater,40); return r;};
      wrapped.__v22Wrapped=true; wrapped.__v22Original=fn; window[name]=wrapped;
    });
  });
})();
