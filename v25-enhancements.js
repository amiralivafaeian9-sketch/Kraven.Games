(function(){
  'use strict';
  function init(){
    var root=document.getElementById('page-home');
    if(!root) return;
    var reduced=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var candidates=root.querySelectorAll('section, .section, .home-section, .section-block, .content-section, .game-card, .news-card, .content-card, .featured-card, .panel, #kraven-mini-arcade, #kraven-mini-arcade .kraven-arcade-card, .v23-card-preview, .v22-typewriter-wrap');
    var idx=0;
    for(var i=0;i<candidates.length;i++){
      var el=candidates[i];
      if(!el || el.closest('.kraven-arcade-modal')) continue;
      if(el.classList.contains('v25-reveal')) continue;
      el.classList.add('v25-reveal');
      idx=(idx%6)+1;
      el.setAttribute('data-v25-delay',String(idx));
    }
    if(reduced){for(var j=0;j<candidates.length;j++)candidates[j].classList.add('v25-visible');return;}
    if(!('IntersectionObserver' in window)){
      for(var k=0;k<candidates.length;k++)candidates[k].classList.add('v25-visible');
      return;
    }
    var io=new IntersectionObserver(function(entries){
      for(var z=0;z<entries.length;z++){
        var e=entries[z];
        if(e.isIntersecting){
          e.target.classList.add('v25-visible');
          io.unobserve(e.target);
        }
      }
    },{root:null,rootMargin:'0px 0px -10% 0px',threshold:.08});
    for(var q=0;q<candidates.length;q++)io.observe(candidates[q]);

    /* Add gentle stagger wrappers to dense card grids without cloning or rendering. */
    var grids=root.querySelectorAll('.game-grid, .games-grid, .news-grid, .cards-grid, .kraven-arcade-grid');
    for(var g=0;g<grids.length;g++){
      var children=grids[g].children;
      for(var c=0;c<children.length;c++){
        children[c].classList.add('v25-reveal');
        children[c].setAttribute('data-v25-delay',String((c%6)+1));
      }
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
