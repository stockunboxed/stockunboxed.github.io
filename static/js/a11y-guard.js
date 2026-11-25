/**
 * StockUnboxed Accessibility & Live Ticker Guard (WCAG 2.2 AA)
 */
(function () {
  'use strict';

  // 1. Live Ticker Pause State
  const TICKER_STORAGE_KEY = 'stockunboxed_ticker_paused';
  let isTickerPaused = localStorage.getItem(TICKER_STORAGE_KEY) === 'true';

  function applyTickerPauseState() {
    const tickerTrack = document.getElementById('live-ticker-track');
    const pauseBtn = document.getElementById('ticker-pause-btn');

    if (isTickerPaused) {
      document.body.classList.add('motion-paused');
      if (tickerTrack) {
        tickerTrack.style.animationPlayState = 'paused';
      }
      if (pauseBtn) {
        pauseBtn.setAttribute('aria-pressed', 'true');
        pauseBtn.innerHTML = '▶ Resume Live Ticker';
        pauseBtn.title = 'Resume live market ticker scroll';
      }
    } else {
      document.body.classList.remove('motion-paused');
      if (tickerTrack) {
        tickerTrack.style.animationPlayState = 'running';
      }
      if (pauseBtn) {
        pauseBtn.setAttribute('aria-pressed', 'false');
        pauseBtn.innerHTML = '⏸ Pause Live Ticker';
        pauseBtn.title = 'Pause live market ticker scroll (WCAG 2.2.2)';
      }
    }
  }

  // 2. Global Accessibility Live Announcer for Screen Readers
  window.announceForAccessibility = function (message) {
    let announcer = document.getElementById('a11y-live-announcer');
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'a11y-live-announcer';
      announcer.className = 'sr-only';
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      document.body.appendChild(announcer);
    }
    announcer.textContent = '';
    setTimeout(function () {
      announcer.textContent = message;
    }, 50);
  };

  // 3. Document Ready Initialization
  document.addEventListener('DOMContentLoaded', function () {
    const pauseBtn = document.getElementById('ticker-pause-btn');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', function () {
        isTickerPaused = !isTickerPaused;
        localStorage.setItem(TICKER_STORAGE_KEY, isTickerPaused ? 'true' : 'false');
        applyTickerPauseState();
        window.announceForAccessibility(
          isTickerPaused ? 'Market ticker paused' : 'Market ticker resumed'
        );
      });
    }

    applyTickerPauseState();

    // 4. Tab Visibility Detection (Suspends live polling when backgrounded)
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        window.isPageHidden = true;
      } else {
        window.isPageHidden = false;
      }
    });

    // 5. System Reduced Motion Detection
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionQuery.matches) {
      isTickerPaused = true;
      applyTickerPauseState();
    }
  });
})();
