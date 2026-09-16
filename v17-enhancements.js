/* =========================================================
   KRAVEN GAME V17 — Motion Background + Tactile Click Sound
   No external libraries. Delegated events. Single RAF scheduler.
   ========================================================= */
(function () {
  'use strict';

  var reducedMotion = false;
  try {
    reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (_) {}

  function onReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  }

  function make(tag, attrs, parent) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (key) {
      if (key === 'text') el.textContent = attrs[key];
      else el.setAttribute(key, attrs[key]);
    });
    if (parent) parent.appendChild(el);
    return el;
  }

  /* ---------------------------------------------------------
     1) Motion Background
     --------------------------------------------------------- */
  function initMotionBackground() {
    if (reducedMotion || !window.DeviceOrientationEvent) return;

    var isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    if (!isTouch) return;

    var layer = document.createElement('div');
    layer.id = 'kraven-motion-layer';
    layer.setAttribute('aria-hidden', 'true');

    var orb = make('div', { class: 'kraven-motion-orb' }, layer);
    make('div', { class: 'kraven-motion-core' }, orb);

    // Insert behind the app without touching existing page markup.
    document.body.insertBefore(layer, document.body.firstChild);

    var control = make('div', { id: 'kraven-motion-control', 'data-state': 'off' }, document.body);
    make('span', { text: '📱 حرکت پس‌زمینه' }, control);
    var action = make('button', { type: 'button', text: 'فعال‌سازی' }, control);

    var targetX = 0;
    var targetY = 0;
    var currentX = 0;
    var currentY = 0;
    var rafId = 0;
    var listening = false;
    var enabled = false;
    var maxX = 42;
    var maxY = 34;

    function paint() {
      rafId = 0;
      currentX += (targetX - currentX) * 0.14;
      currentY += (targetY - currentY) * 0.14;
      orb.style.setProperty('--mx', currentX.toFixed(2) + 'px');
      orb.style.setProperty('--my', currentY.toFixed(2) + 'px');
      orb.style.setProperty('--m-scale', (1 + Math.min(0.045, (Math.abs(currentX) + Math.abs(currentY)) / 2200)).toFixed(4));

      if (Math.abs(targetX - currentX) > 0.08 || Math.abs(targetY - currentY) > 0.08) {
        rafId = window.requestAnimationFrame(paint);
      }
    }

    function schedulePaint() {
      if (!rafId) rafId = window.requestAnimationFrame(paint);
    }

    function onOrientation(e) {
      if (!enabled) return;
      var gamma = Number.isFinite(e.gamma) ? e.gamma : 0; // left/right
      var beta = Number.isFinite(e.beta) ? e.beta : 0;   // front/back
      var x = Math.max(-1, Math.min(1, gamma / 45));
      var y = Math.max(-1, Math.min(1, (beta - 45) / 45));
      targetX = x * maxX;
      targetY = y * maxY;
      schedulePaint();
    }

    function startListening() {
      if (listening) return;
      window.addEventListener('deviceorientation', onOrientation, { passive: true });
      listening = true;
      enabled = true;
      control.dataset.state = 'on';
      action.textContent = 'فعال شد ✓';
      schedulePaint();
    }

    function showControl() {
      // Only show the chip on mobile/touch devices. On browsers that expose
      // permission APIs, the chip is the user's activation gesture.
      control.classList.add('show');
    }

    function enableMotion() {
      if (window.DeviceOrientationEvent && typeof window.DeviceOrientationEvent.requestPermission === 'function') {
        window.DeviceOrientationEvent.requestPermission()
          .then(function (state) {
            if (state === 'granted') startListening();
            else action.textContent = 'اجازه لازم است';
          })
          .catch(function () { action.textContent = 'دوباره امتحان کن'; });
      } else {
        startListening();
      }
    }

    action.addEventListener('click', enableMotion, { passive: true });

    // iOS Safari needs a user gesture; other browsers can start immediately.
    if (typeof window.DeviceOrientationEvent.requestPermission === 'function') {
      showControl();
    } else {
      try { startListening(); } catch (_) { showControl(); }
    }

    window.addEventListener('pagehide', function () {
      if (listening) {
        window.removeEventListener('deviceorientation', onOrientation);
        listening = false;
      }
      if (rafId) { window.cancelAnimationFrame(rafId); rafId = 0; }
    }, { once: true, passive: true });
  }

  /* ---------------------------------------------------------
     2) Tactile Click Sound
     Uses the user's supplied local MP3. One HTMLAudioElement,
     delegated click listener, and an 85ms rate limit.
     --------------------------------------------------------- */
  function initClickSound() {
    var SOUND_URL = './assets/sfx/kraven-click.mp3';
    var audioFallback = new Audio(SOUND_URL);
    audioFallback.preload = 'auto';
    audioFallback.volume = 0.38;
    audioFallback.setAttribute('aria-hidden', 'true');

    var AudioCtx = window.AudioContext || window.webkitAudioContext;
    var ctx = null;
    var buffer = null;
    var loading = null;
    var lastPlayed = -Infinity;
    var minGap = 38; // very small guard; repeated taps remain responsive

    function shouldPlay(target) {
      if (!target || !target.closest) return false;
      var el = target.closest('button, a, [role="button"], summary, select, input[type="button"], input[type="submit"], .game-card, .icon-btn, .page-btn, .sidebar-nav a');
      if (!el) return false;
      if (el.disabled || el.getAttribute('aria-disabled') === 'true') return false;
      if (el.dataset && el.dataset.noClickSound === 'true') return false;
      return el;
    }

    function ensureContext() {
      if (!AudioCtx) return null;
      if (!ctx) {
        try { ctx = new AudioCtx(); } catch (_) { return null; }
      }
      if (ctx.state === 'suspended') {
        try { ctx.resume(); } catch (_) {}
      }
      return ctx;
    }

    // Decode in advance so normal clicks never wait for MP3 decoding.
    function preloadBuffer() {
      if (!AudioCtx || loading || buffer) return;
      loading = fetch(SOUND_URL, { cache: 'force-cache' })
        .then(function (r) { if (!r.ok) throw new Error('sfx fetch failed'); return r.arrayBuffer(); })
        .then(function (data) {
          var c = ensureContext();
          if (!c) return null;
          return c.decodeAudioData(data);
        })
        .then(function (decoded) { if (decoded) buffer = decoded; })
        .catch(function () {})
        .finally(function () { loading = null; });
    }

    function fallbackPlay() {
      try {
        audioFallback.currentTime = 0;
        var promise = audioFallback.play();
        if (promise && typeof promise.catch === 'function') promise.catch(function () {});
      } catch (_) {}
    }

    function playNow() {
      try { if (localStorage.getItem('kraven_v18_state')) { var st = JSON.parse(localStorage.getItem('kraven_v18_state')); if (st && st.audio === false) return; } } catch (_) {}
      var now = performance.now();
      if (now - lastPlayed < minGap) return;
      lastPlayed = now;

      var c = ensureContext();
      if (c && buffer) {
        try {
          var src = c.createBufferSource();
          var gain = c.createGain();
          src.buffer = buffer;
          gain.gain.value = 0.52;
          src.connect(gain);
          gain.connect(c.destination);
          src.start(0); // start immediately on this user gesture
          return;
        } catch (_) {}
      }
      fallbackPlay();
    }

    function handlePointerDown(e) {
      var el = shouldPlay(e.target);
      if (!el) return;
      // pointerdown fires at physical press/touch time — noticeably earlier than click.
      playNow();

      if (!reducedMotion && el.classList && !el.classList.contains('game-card')) {
        el.classList.remove('kraven-sfx-pop');
        el.style.setProperty('--kraven-sfx-scale', '1');
        window.requestAnimationFrame(function () { el.classList.add('kraven-sfx-pop'); });
      }
    }

    document.addEventListener('pointerdown', handlePointerDown, { passive: true, capture: true });

    // Keyboard activation still gets an instant sound.
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var active = document.activeElement;
      if (active && shouldPlay(active)) playNow();
    }, { passive: true, capture: true });

    // Start decoding immediately while the browser is idle; no playback occurs here.
    preloadBuffer();
    try { audioFallback.load(); } catch (_) {}
  }

  onReady(function () {
    initClickSound();
    initMotionBackground();
  });
})();
