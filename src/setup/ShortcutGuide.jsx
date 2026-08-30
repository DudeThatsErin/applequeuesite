import Copyable from '../components/Copyable.jsx';
import { PLACEHOLDER_BACKEND } from './model.js';

const TITLES = {
  notes: '📝 Shortcut: file queued notes',
  reminders: '✅ Shortcut: file queued reminders',
  calendar: '📅 Shortcut: file queued events',
};

const PATHS = { notes: 'apple-notes', reminders: 'reminders', calendar: 'calendar' };
const LIST_KEY = { notes: 'notes', reminders: 'reminders', calendar: 'events' };

function action(kind, s) {
  if (kind === 'notes') {
    return (
      <>
        Create Note, body from <code>body</code>, folder from <code>folder</code> (falls back to{' '}
        <strong>{s.defNotes}</strong>).
      </>
    );
  }
  if (kind === 'reminders') {
    return (
      <>
        Add New Reminder, title from <code>title</code>, notes from <code>notes</code>, due date from{' '}
        <code>dueDate</code>, list from <code>list</code> (falls back to <strong>{s.defList}</strong>).
      </>
    );
  }
  return (
    <>
      Add New Event, title from <code>title</code>, start from <code>startDate</code>, end from{' '}
      <code>endDate</code>, calendar from <code>calendar</code> (falls back to <strong>{s.defCal}</strong>).
    </>
  );
}

function extra(kind, s) {
  if (kind === 'notes') {
    return (
      <p>
        Each item may carry an <code>attachments</code> list of <code>{'{name, url, mimeType}'}</code>. To
        include them, loop the list, <strong>Get Contents of URL</strong> for each <code>url</code>, and
        append the file to the note body.
      </p>
    );
  }
  if (kind === 'reminders') {
    return (
      <p>
        <code>priority</code> is one of <code>none</code>, <code>low</code>, <code>medium</code>,{' '}
        <code>high</code>. <code>url</code> is the page the capture came from, worth putting in the notes
        field.
      </p>
    );
  }
  return (
    <p>
      <code>allDay</code> is a boolean, <code>alerts</code> is a list of minutes-before, and{' '}
      <code>invitees</code> is a list of names. Shortcuts can't send invitations, which is why an invitee
      nudge reminder is queued to <strong>{s.inviteList}</strong> instead.
    </p>
  );
}

export default function ShortcutGuide({ kind, state: s }) {
  const base = s.backendUrl || PLACEHOLDER_BACKEND;
  const key = s.apiKey || '<your API key>';

  const fetchBlock = `${base}/api/${PATHS[kind]}/pending\n\nHeader:  x-api-key\nValue:   ${key}`;
  const ackBlock = `${base}/api/${PATHS[kind]}/ack\n\nHeader:  x-api-key\nValue:   ${key}\n\nBody:    { "ids": [ collected ids ] }`;

  return (
    <>
      <h3 style={{ marginTop: 26 }}>{TITLES[kind]}</h3>
      <ol className="steps">
        <li>
          <h3>Get Contents of URL</h3>
          <p>Method <strong>GET</strong>, and add one header.</p>
          <Copyable text={fetchBlock} />
        </li>
        <li>
          <h3>Get Dictionary Value</h3>
          <p>Get <code>{LIST_KEY[kind]}</code> from the response. That's your list of pending items.</p>
        </li>
        <li>
          <h3>Repeat with Each item</h3>
          <p>{action(kind, s)}</p>
          {extra(kind, s)}
          <p>Collect each item's <code>id</code> into a variable as you go; you need them for the next step.</p>
        </li>
        <li>
          <h3>Get Contents of URL: acknowledge</h3>
          <p>
            Method <strong>POST</strong>, request body <strong>JSON</strong>, with the collected ids.
            Without this step every item gets created again on the next run.
          </p>
          <Copyable text={ackBlock} />
        </li>
      </ol>
    </>
  );
}
