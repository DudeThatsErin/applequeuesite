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
  aiBase: 'https://api.openai.com/v1',
  aiModel: 'gpt-4o-mini',
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

export function genKey() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let hex = '';
  for (const b of bytes) hex += b.toString(16).padStart(2, '0');
  return `aq_${hex}`;
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

export function save(state, step) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ ...state, step }));
  } catch {
    /* private mode: the wizard still works, it just doesn't resume */
  }
}

// ---------- generated output ------------------------------------------------

export function envLines(s) {
  const lines = [
    `APPLE_QUEUE_API_KEY=${s.apiKey || '<generate one above>'}`,
    '',
    `ENABLE_NOTES=${s.notes}`,
    `ENABLE_REMINDERS=${s.reminders}`,
    `ENABLE_CALENDAR=${s.calendar}`,
  ];

  const defaults = [];
  if (s.notes) defaults.push(`DEFAULT_NOTES_FOLDER=${s.defNotes}`);
  if (s.reminders) defaults.push(`DEFAULT_REMINDER_LIST=${s.defList}`);
  if (s.calendar) {
    defaults.push(`DEFAULT_CALENDAR=${s.defCal}`);
    defaults.push(`CALENDAR_INVITE_REMINDER_LIST=${s.inviteList}`);
  }
  if (defaults.length) lines.push('', defaults.join('\n'));

  lines.push('', `AI_ENABLED=${s.ai}`);
  if (s.ai) {
    lines.push(
      `AI_BASE_URL=${s.aiBase}`,
      `AI_MODEL=${s.aiModel}`,
      'AI_API_KEY=<your provider key>'
    );
  }

  lines.push('', `PLACES_ENABLED=${s.places}`);
  if (s.places) lines.push('GOOGLE_PLACES_API_KEY=<your Google Places key>');

  return lines.join('\n').replace(/\n{3,}/g, '\n\n');
}

export function pendingSecrets(s) {
  const out = [];
  if (s.ai) out.push('AI_API_KEY');
  if (s.places) out.push('GOOGLE_PLACES_API_KEY');
  return out;
}

function envNames(s) {
  const names = ['APPLE_QUEUE_API_KEY', 'ENABLE_NOTES', 'ENABLE_REMINDERS', 'ENABLE_CALENDAR'];
  if (s.notes) names.push('DEFAULT_NOTES_FOLDER');
  if (s.reminders) names.push('DEFAULT_REMINDER_LIST');
  if (s.calendar) names.push('DEFAULT_CALENDAR', 'CALENDAR_INVITE_REMINDER_LIST');
  names.push('AI_ENABLED');
  if (s.ai) names.push('AI_BASE_URL', 'AI_MODEL', 'AI_API_KEY');
  names.push('PLACES_ENABLED');
  if (s.places) names.push('GOOGLE_PLACES_API_KEY');
  return names;
}

// Vercel's clone URL can say which variables to prompt for, but not prefill
// their values. Hence the copy-paste block on step 4.
export function deployUrl(s) {
  const q = [
    `repository-url=${encodeURIComponent(TEMPLATE_REPO)}`,
    'project-name=apple-queue',
    'repository-name=apple-queue',
    `env=${encodeURIComponent(envNames(s).join(','))}`,
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
    `AI parsing:   ${on(s.ai)}${s.ai ? `   ${s.aiModel} @ ${s.aiBase}` : ''}`,
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

  if (step === 3 && s.ai) {
    if (blank(s.aiBase)) {
      errors.aiBase = 'Enter the base URL of your AI provider.';
    } else if (!/^https?:\/\/\S+$/i.test(s.aiBase.trim())) {
      errors.aiBase = 'Use a full URL starting with http:// or https://.';
    }
    if (blank(s.aiModel)) errors.aiModel = 'Enter the model id to send requests to.';
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
