/* Apple Queue setup wizard.

   Everything happens client-side: the generated API key never leaves the page,
   and answers persist in localStorage so a trip to Vercel doesn't lose them.

   The only values to change if repos or store listings move: */
var TEMPLATE_REPO = 'https://github.com/DudeThatsErin/AppleQueue-Backend';
var EXTENSION_REPO = 'https://github.com/DudeThatsErin/AppleQueue';
var CHROME_STORE_URL = '';   // set once the Chrome Web Store listing is live
var FIREFOX_ADDON_URL = '';  // set once the Mozilla Add-ons listing is live

(function () {
  'use strict';

  var STORE_KEY = 'aq-setup-v1';
  var STEPS = ['Modules', 'Defaults', 'Optional', 'Deploy', 'Extension', 'Shortcuts', 'Done'];
  var form = document.getElementById('wizard');
  var current = 1;

  // ---------- state ----------------------------------------------------

  function state() {
    var v = function (name) {
      var el = form.elements[name];
      if (!el) return '';
      return el.type === 'checkbox' ? el.checked : el.value.trim();
    };
    return {
      notes: v('mod_notes'),
      reminders: v('mod_reminders'),
      calendar: v('mod_calendar'),
      ai: v('feat_ai'),
      places: v('feat_places'),
      defNotes: v('def_notes') || 'Notes',
      defList: v('def_list') || 'Reminders',
      defCal: v('def_cal') || 'Calendar',
      inviteList: v('invite_list') || 'Inbox',
      aiBase: v('ai_base'),
      aiModel: v('ai_model'),
      backendUrl: normalizeUrl(v('backend_url')),
      apiKey: document.getElementById('apiKey').value
    };
  }

  function save() {
    try {
      var s = state();
      s.step = current;
      localStorage.setItem(STORE_KEY, JSON.stringify(s));
    } catch (e) { /* private mode — the wizard still works, just doesn't resume */ }
  }

  function restore() {
    var s;
    try { s = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) { s = null; }
    if (!s) return;
    var set = function (name, val) {
      var el = form.elements[name];
      if (!el || val === undefined || val === null) return;
      if (el.type === 'checkbox') el.checked = !!val; else el.value = val;
    };
    set('mod_notes', s.notes); set('mod_reminders', s.reminders); set('mod_calendar', s.calendar);
    set('feat_ai', s.ai); set('feat_places', s.places);
    set('def_notes', s.defNotes); set('def_list', s.defList); set('def_cal', s.defCal);
    set('invite_list', s.inviteList);
    set('ai_base', s.aiBase); set('ai_model', s.aiModel);
    set('backend_url', s.backendUrl);
    if (s.apiKey) document.getElementById('apiKey').value = s.apiKey;
    if (s.step >= 1 && s.step <= STEPS.length) current = s.step;
  }

  // ---------- helpers --------------------------------------------------

  function normalizeUrl(raw) {
    if (!raw) return '';
    var u = raw.trim().replace(/\/+$/, '');
    if (u && !/^https?:\/\//i.test(u)) u = 'https://' + u;
    return u;
  }

  function genKey() {
    var bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    var hex = '';
    for (var i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0');
    return 'aq_' + hex;
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function backendOr(placeholder) {
    var s = state();
    return s.backendUrl || placeholder;
  }

  // ---------- env block ------------------------------------------------

  function envLines(s) {
    var lines = [
      'APPLE_QUEUE_API_KEY=' + (s.apiKey || '<generate one above>'),
      '',
      'ENABLE_NOTES=' + s.notes,
      'ENABLE_REMINDERS=' + s.reminders,
      'ENABLE_CALENDAR=' + s.calendar
    ];

    var defaults = [];
    if (s.notes) defaults.push('DEFAULT_NOTES_FOLDER=' + s.defNotes);
    if (s.reminders) defaults.push('DEFAULT_REMINDER_LIST=' + s.defList);
    if (s.calendar) {
      defaults.push('DEFAULT_CALENDAR=' + s.defCal);
      defaults.push('CALENDAR_INVITE_REMINDER_LIST=' + s.inviteList);
    }
    if (defaults.length) lines.push('', defaults.join('\n'));

    lines.push('', 'AI_ENABLED=' + s.ai);
    if (s.ai) {
      lines.push(
        'AI_BASE_URL=' + (s.aiBase || 'https://api.openai.com/v1'),
        'AI_MODEL=' + (s.aiModel || 'gpt-4o-mini'),
        'AI_API_KEY=<your provider key>'
      );
    }

    lines.push('', 'PLACES_ENABLED=' + s.places);
    if (s.places) lines.push('GOOGLE_PLACES_API_KEY=<your Google Places key>');

    return lines.join('\n').replace(/\n{3,}/g, '\n\n');
  }

  function pendingSecrets(s) {
    var out = [];
    if (s.ai) out.push('AI_API_KEY');
    if (s.places) out.push('GOOGLE_PLACES_API_KEY');
    return out;
  }

  // ---------- env var list for the deploy URL --------------------------

  function envNames(s) {
    var names = ['APPLE_QUEUE_API_KEY', 'ENABLE_NOTES', 'ENABLE_REMINDERS', 'ENABLE_CALENDAR'];
    if (s.notes) names.push('DEFAULT_NOTES_FOLDER');
    if (s.reminders) names.push('DEFAULT_REMINDER_LIST');
    if (s.calendar) names.push('DEFAULT_CALENDAR', 'CALENDAR_INVITE_REMINDER_LIST');
    names.push('AI_ENABLED');
    if (s.ai) names.push('AI_BASE_URL', 'AI_MODEL', 'AI_API_KEY');
    names.push('PLACES_ENABLED');
    if (s.places) names.push('GOOGLE_PLACES_API_KEY');
    return names;
  }

  function deployUrl(s) {
    var q = [
      'repository-url=' + encodeURIComponent(TEMPLATE_REPO),
      'project-name=apple-queue',
      'repository-name=apple-queue',
      'env=' + encodeURIComponent(envNames(s).join(',')),
      'envDescription=' + encodeURIComponent('Paste the block from the Apple Queue setup wizard'),
      'envLink=' + encodeURIComponent('https://applequeue.erinskidds.com/docs/#environment')
    ];
    return 'https://vercel.com/new/clone?' + q.join('&');
  }

  // ---------- shortcut guides ------------------------------------------

  function shortcutGuide(kind, s) {
    var base = backendOr('https://YOUR-BACKEND.vercel.app');
    var titles = {
      notes: '📝 Shortcut: file queued notes',
      reminders: '✅ Shortcut: file queued reminders',
      calendar: '📅 Shortcut: file queued events'
    };
    var paths = { notes: 'apple-notes', reminders: 'reminders', calendar: 'calendar' };
    var listKey = { notes: 'notes', reminders: 'reminders', calendar: 'events' };
    var action = {
      notes: 'Create Note — body from <code>body</code>, folder from <code>folder</code> (falls back to <strong>' +
        esc(s.defNotes) + '</strong>).',
      reminders: 'Add New Reminder — title from <code>title</code>, notes from <code>notes</code>, ' +
        'due date from <code>dueDate</code>, list from <code>list</code> (falls back to <strong>' +
        esc(s.defList) + '</strong>).',
      calendar: 'Add New Event — title from <code>title</code>, start from <code>startDate</code>, ' +
        'end from <code>endDate</code>, calendar from <code>calendar</code> (falls back to <strong>' +
        esc(s.defCal) + '</strong>).'
    };
    var extra = {
      notes: '<p>Each item may carry an <code>attachments</code> list of <code>{name, url, mimeType}</code>. ' +
        'To include them, loop the list, <strong>Get Contents of URL</strong> for each <code>url</code>, and ' +
        'append the file to the note body.</p>',
      reminders: '<p><code>priority</code> is one of <code>none</code>, <code>low</code>, <code>medium</code>, ' +
        '<code>high</code>. <code>url</code> is the page the capture came from — worth putting in the notes field.</p>',
      calendar: '<p><code>allDay</code> is a boolean, <code>alerts</code> is a list of minutes-before, and ' +
        '<code>invitees</code> is a list of names. Shortcuts can\'t send invitations, which is why an invitee ' +
        'nudge reminder is queued to <strong>' + esc(s.inviteList) + '</strong> instead.</p>'
    };

    return '' +
      '<h3 style="margin-top:26px">' + titles[kind] + '</h3>' +
      '<ol class="steps">' +
        '<li><h3>Get Contents of URL</h3>' +
          '<p>Method <strong>GET</strong>, and add one header.</p>' +
          '<pre class="copyable"><code>' + esc(base + '/api/' + paths[kind] + '/pending') + '\n\n' +
            'Header:  x-api-key\nValue:   ' + esc(s.apiKey || '<your API key>') + '</code></pre></li>' +
        '<li><h3>Get Dictionary Value</h3>' +
          '<p>Get <code>' + listKey[kind] + '</code> from the response. That\'s your list of pending items.</p></li>' +
        '<li><h3>Repeat with Each item</h3>' +
          '<p>' + action[kind] + '</p>' + extra[kind] +
          '<p>Collect each item\'s <code>id</code> into a variable as you go — you need them for the next step.</p></li>' +
        '<li><h3>Get Contents of URL — acknowledge</h3>' +
          '<p>Method <strong>POST</strong>, request body <strong>JSON</strong>, with the collected ids. ' +
          'Without this step every item gets created again on the next run.</p>' +
          '<pre class="copyable"><code>' + esc(base + '/api/' + paths[kind] + '/ack') + '\n\n' +
            'Header:  x-api-key\nValue:   ' + esc(s.apiKey || '<your API key>') + '\n\n' +
            'Body:    { "ids": [ collected ids ] }</code></pre></li>' +
      '</ol>';
  }

  // ---------- rendering ------------------------------------------------

  function renderNav() {
    var nav = document.getElementById('stepNav');
    nav.innerHTML = STEPS.map(function (label, i) {
      var n = i + 1;
      var cls = n === current ? 'active' : (n < current ? 'done' : '');
      return '<span class="' + cls + '">' + (n < current ? '✓ ' : '') + label + '</span>';
    }).join('');
  }

  function renderConditionals() {
    var s = state();
    document.querySelectorAll('[data-needs]').forEach(function (el) {
      el.hidden = !s[el.getAttribute('data-needs')];
    });
    document.getElementById('aiDetail').hidden = !s.ai;
    document.getElementById('placesDetail').hidden = !s.places;
  }

  function renderStep4() {
    var s = state();
    document.getElementById('envBlock').textContent = envLines(s);

    var secrets = pendingSecrets(s);
    document.getElementById('secretsTodo').hidden = secrets.length === 0;
    document.getElementById('secretsList').textContent = secrets.join('   ');

    document.getElementById('deployBtn').href = deployUrl(s);
    document.getElementById('templateBtn').href = TEMPLATE_REPO;

    var status = document.getElementById('urlStatus');
    if (!s.backendUrl) {
      status.textContent = 'Leave this blank for now if you haven\'t deployed yet — the next steps will show placeholders.';
      status.style.color = '';
    } else if (!/^https:\/\//i.test(s.backendUrl)) {
      status.textContent = '⚠ Use an https:// URL. Browsers block extension requests to plain http.';
      status.style.color = 'var(--warn)';
    } else {
      status.textContent = '✓ Using ' + s.backendUrl;
      status.style.color = 'var(--ok)';
    }
  }

  function renderStep5() {
    var s = state();
    document.getElementById('extBlock').textContent =
      'Server URL:  ' + (s.backendUrl || 'https://YOUR-BACKEND.vercel.app') + '\n' +
      'API Key:     ' + (s.apiKey || '<your API key>');

    if (CHROME_STORE_URL) {
      var c = document.getElementById('chromeBtn');
      c.href = CHROME_STORE_URL;
      c.textContent = 'Chrome Web Store ↗';
      document.getElementById('chromeInstall').textContent =
        'Install from the Chrome Web Store and it updates itself.';
      document.getElementById('unpackedHelp').hidden = true;
    }
    if (FIREFOX_ADDON_URL) {
      var f = document.getElementById('firefoxBtn');
      f.href = FIREFOX_ADDON_URL;
      f.textContent = 'Mozilla Add-ons ↗';
    }
  }

  function renderStep6() {
    var s = state();
    var html = '';
    ['notes', 'reminders', 'calendar'].forEach(function (k) {
      if (s[k]) html += shortcutGuide(k, s);
    });
    if (!html) html = '<p class="note">No modules enabled, so there\'s nothing to build.</p>';
    document.getElementById('shortcutGuides').innerHTML = html;
    if (window.AQ) window.AQ.addCopyButtons();
  }

  function renderSummary() {
    var s = state();
    var on = function (b) { return b ? 'on' : 'off'; };
    var lines = [
      'Backend:      ' + (s.backendUrl || '(not recorded)'),
      'API key:      ' + (s.apiKey ? s.apiKey.slice(0, 7) + '…' + s.apiKey.slice(-4) + '  (full value in your password manager)' : '(none)'),
      '',
      'Notes:        ' + on(s.notes) + (s.notes ? '   → ' + s.defNotes : ''),
      'Reminders:    ' + on(s.reminders) + (s.reminders ? '   → ' + s.defList : ''),
      'Calendar:     ' + on(s.calendar) + (s.calendar ? '   → ' + s.defCal : ''),
      '',
      'AI parsing:   ' + on(s.ai) + (s.ai ? '   ' + s.aiModel + ' @ ' + s.aiBase : ''),
      'Places:       ' + on(s.places)
    ];
    document.getElementById('summaryBlock').textContent = lines.join('\n');
  }

  function show(step) {
    current = step;
    document.querySelectorAll('.step-panel').forEach(function (p) {
      p.hidden = Number(p.getAttribute('data-step')) !== step;
    });
    renderNav();
    if (step === 4) renderStep4();
    if (step === 5) renderStep5();
    if (step === 6) renderStep6();
    if (step === 7) renderSummary();
    save();
    var nav = document.getElementById('stepNav');
    if (nav.getBoundingClientRect().top < 0) nav.scrollIntoView({ block: 'start' });
  }

  // ---------- validation -----------------------------------------------

  function canLeave(step) {
    if (step === 1) {
      var s = state();
      var ok = s.notes || s.reminders || s.calendar;
      document.getElementById('noModules').hidden = ok;
      return ok;
    }
    return true;
  }

  // ---------- wiring ---------------------------------------------------

  form.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-goto]');
    if (!btn) return;
    var target = Number(btn.getAttribute('data-goto'));
    if (target > current && !canLeave(current)) return;
    show(target);
  });

  form.addEventListener('change', function () {
    renderConditionals();
    if (current === 4) renderStep4();
    save();
  });

  form.addEventListener('input', function (e) {
    if (e.target.id === 'backendUrl') {
      renderStep4();
    } else if (current === 4) {
      renderStep4();
    }
    save();
  });

  document.getElementById('backendUrl').addEventListener('blur', function (e) {
    e.target.value = normalizeUrl(e.target.value);
    renderStep4();
    save();
  });

  document.getElementById('regenKey').addEventListener('click', function () {
    document.getElementById('apiKey').value = genKey();
    renderStep4();
    save();
  });

  form.addEventListener('submit', function (e) { e.preventDefault(); });

  // ---------- boot -----------------------------------------------------

  restore();
  if (!document.getElementById('apiKey').value) document.getElementById('apiKey').value = genKey();
  renderConditionals();
  show(current);
})();
