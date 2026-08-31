/* The wizard's pure logic: defaults, persistence, generated output, and the
   per-step validation rules. Nothing here touches the DOM, and nothing here
   sends anything anywhere: the API key is generated in the browser and stays
   in the browser. */

import { TEMPLATE_REPO } from '../config.js';

export const STORE_KEY = 'aq-setup-v1';
export const STEPS = ['Modules', 'Defaults', 'Optional', 'Deploy', 'Extension', 'Shortcuts', 'Done'];
export const LAST_STEP = STEPS.length;

export const PLACEHOLDER_BACKEND = 'https://YOUR-BACKEND.vercel.app';

export const INITIAL = {
  notes: true,
  reminders: true,
  calendar: true,
  ai: false,
  places: false,
  defNotes: 'Notes',
  defList: 'Reminders',
  defCal: 'Calendar',
  inviteList: 'Inbox',
  backendUrl: '',
  apiKey: '',
};

// ---------- helpers ---------------------------------------------------------

export function normalizeUrl(raw) {
  if (!raw) return '';
  let u = raw.trim().replace(/\/+$/, '');
  if (u && !/^https?:\/\//i.test(u)) u = `https://${u}`;
  return u;
}

/* 16 random bytes, base64url, giving `aq_` plus 22 characters.
   128 bits is not brute-forceable, and this has to be retyped into a Shortcut
   by hand, so the old 32-byte hex key was 64 characters of no extra safety. */
export function genKey() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const b64 = btoa(String.fromCharCode(...bytes));
  return `aq_${b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`;
}

// ---------- persistence -----------------------------------------------------

export function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (!saved) return { state: { ...INITIAL, apiKey: genKey() }, step: 1 };
    const step = Number(saved.step);
    return {
      state: { ...INITIAL, ...saved, apiKey: saved.apiKey || genKey() },
      step: step >= 1 && step <= LAST_STEP ? step : 1,
    };
  } catch {
    // Private mode, or a corrupted entry. Start clean rather than break.
    return { state: { ...INITIAL, apiKey: genKey() }, step: 1 };
  }
}

// Read setup answers without inventing a new key. This is used by the
// standalone Shortcuts guide, where a made-up key would be actively harmful.
export function loadSavedSetup() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    return saved ? { ...INITIAL, ...saved } : null;
  } catch {
    return null;
  }
}

export function save(state, step) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ ...state, step }));
  } catch {
    /* private mode: the wizard still works, it just doesn't resume */
  }
}

// ---------- generated output ------------------------------------------------

/* The configuration as name/value pairs. Vercel's clone screen prompts for one
   variable at a time, so the wizard has to be able to hand over each value on
   its own; the .env block is derived from the same list. A pair marked `supply`
   is one the wizard can't know: you paste it in yourself. */
export function envPairs(s) {
  const pairs = [
    { name: 'APPLE_QUEUE_API_KEY', value: s.apiKey },
    { name: 'ENABLE_NOTES', value: String(s.notes) },
    { name: 'ENABLE_REMINDERS', value: String(s.reminders) },
    { name: 'ENABLE_CALENDAR', value: String(s.calendar) },
  ];

  if (s.notes) pairs.push({ name: 'DEFAULT_NOTES_FOLDER', value: s.defNotes });
  if (s.reminders) pairs.push({ name: 'DEFAULT_REMINDER_LIST', value: s.defList });
  if (s.calendar) {
    pairs.push({ name: 'DEFAULT_CALENDAR', value: s.defCal });
    pairs.push({ name: 'CALENDAR_INVITE_REMINDER_LIST', value: s.inviteList });
  }

  pairs.push({ name: 'AI_ENABLED', value: String(s.ai) });

  pairs.push({ name: 'PLACES_ENABLED', value: String(s.places) });
  if (s.places) {
    pairs.push({ name: 'GOOGLE_PLACES_API_KEY', value: '', supply: 'your Google Places key' });
  }

  return pairs;
}

/* A .env file, for self-hosting and for Vercel's Settings screen (which, unlike
   the deploy screen, does split a pasted block). One pair per line, no blank
   lines, so it survives being pasted anywhere. */
export function envLines(s) {
  return envPairs(s)
    .map(({ name, value, supply }) => `${name}=${supply ? `<${supply}>` : value}`)
    .join('\n');
}

export function pendingSecrets(s) {
  return envPairs(s).filter((p) => p.supply).map((p) => p.name);
}

// Vercel's clone URL can say which variables to prompt for, but not prefill
// their values, so step 4 hands over each value with its own copy button.
export function deployUrl(s) {
  const q = [
    `repository-url=${encodeURIComponent(TEMPLATE_REPO)}`,
    'project-name=apple-queue',
    'repository-name=apple-queue',
    `env=${encodeURIComponent(envPairs(s).map((p) => p.name).join(','))}`,
    `envDescription=${encodeURIComponent('Paste the block from the Apple Queue setup wizard')}`,
    `envLink=${encodeURIComponent('https://applequeue.erinskidds.com/docs#environment')}`,
  ];
  return `https://vercel.com/new/clone?${q.join('&')}`;
}

export function summaryLines(s) {
  const on = (b) => (b ? 'on' : 'off');
  const masked = s.apiKey
    ? `${s.apiKey.slice(0, 7)}…${s.apiKey.slice(-4)}  (full value in your password manager)`
    : '(none)';

  return [
    `Backend:      ${s.backendUrl || '(not recorded)'}`,
    `API key:      ${masked}`,
    '',
    `Notes:        ${on(s.notes)}${s.notes ? `   → ${s.defNotes}` : ''}`,
    `Reminders:    ${on(s.reminders)}${s.reminders ? `   → ${s.defList}` : ''}`,
    `Calendar:     ${on(s.calendar)}${s.calendar ? `   → ${s.defCal}` : ''}`,
    '',
    `AI parsing:   ${on(s.ai)}${s.ai ? '   (provider configured in the extension)' : ''}`,
    `Places:       ${on(s.places)}`,
  ].join('\n');
}

// ---------- validation ------------------------------------------------------

/* Returns a map of field name to error message for the given step. An empty
   map means the step is complete and the wizard will let you move forward. */
export function validate(step, s) {
  const errors = {};
  const blank = (v) => !String(v || '').trim();

  if (step === 1 && !s.notes && !s.reminders && !s.calendar) {
    errors.modules = 'Pick at least one module. With everything off, the backend has nothing to queue.';
  }

  if (step === 2) {
    if (s.notes && blank(s.defNotes)) {
      errors.defNotes = 'Enter the Apple Notes folder new notes should land in.';
    }
    if (s.reminders && blank(s.defList)) {
      errors.defList = 'Enter the Reminders list new reminders should land in.';
    }
    if (s.calendar && blank(s.defCal)) {
      errors.defCal = 'Enter the calendar new events should land on.';
    }
    if (s.calendar && blank(s.inviteList)) {
      errors.inviteList = 'Enter the Reminders list that invitee nudges should go to.';
    }
  }

  if (step === 4) {
    const url = normalizeUrl(s.backendUrl);
    if (!url) {
      errors.backendUrl =
        'Deploy first, then paste the production URL Vercel gave you. The remaining steps need it.';
    } else if (!/^https:\/\/[^\s/]+\.[^\s/]+/i.test(url)) {
      errors.backendUrl = 'Use a full https:// URL, for example https://my-apple-queue.vercel.app.';
    }
  }

  return errors;
}
