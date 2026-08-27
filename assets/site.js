/* Apple Queue — shared site behaviour: theme + copy buttons.
   Theme is applied by an inline script in <head> to avoid a flash; this file
   only wires the toggle button and the copy-to-clipboard affordances. */

(function () {
  'use strict';

  // ---- theme ----------------------------------------------------------
  var KEY = 'aq-theme';

  function current() {
    return document.documentElement.getAttribute('data-theme') ||
      (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  }

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(KEY, theme); } catch (e) { /* private mode */ }
    document.querySelectorAll('.theme-toggle').forEach(function (b) {
      b.textContent = theme === 'light' ? '☾' : '☀';
      b.setAttribute('aria-label', theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    });
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.theme-toggle');
    if (btn) apply(current() === 'light' ? 'dark' : 'light');
  });

  // ---- copy buttons ---------------------------------------------------
  // Any <pre class="copyable"> or [data-copy] gets a button.
  function textFor(el) {
    var src = el.getAttribute('data-copy-target');
    if (src) {
      var target = document.querySelector(src);
      if (!target) return '';
      return target.value !== undefined ? target.value : target.textContent;
    }
    var code = el.querySelector('code, textarea, input');
    return code ? (code.value !== undefined ? code.value : code.textContent) : el.textContent;
  }

  function addButtons() {
    document.querySelectorAll('pre.copyable:not([data-copy-ready])').forEach(function (pre) {
      pre.setAttribute('data-copy-ready', '1');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'copy-btn';
      btn.textContent = 'Copy';
      pre.appendChild(btn);
    });
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.copy-btn');
    if (!btn) return;
    var host = btn.closest('[data-copy-target]') || btn.parentElement;
    var text = (textFor(host) || '').replace(/\s+$/, '');
    if (!text) return;

    var done = function () {
      var label = btn.textContent;
      btn.textContent = 'Copied';
      btn.classList.add('done');
      setTimeout(function () {
        btn.textContent = label === 'Copied' ? 'Copy' : label;
        btn.classList.remove('done');
      }, 1400);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else {
      fallback();
    }

    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (err) { /* nothing to do */ }
      document.body.removeChild(ta);
    }
  });

  // ---- init -----------------------------------------------------------
  function init() {
    apply(current());
    addButtons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.AQ = window.AQ || {};
  window.AQ.addCopyButtons = addButtons;
})();
