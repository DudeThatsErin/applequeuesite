import { Link } from 'react-router-dom';
import Copyable from '../components/Copyable.jsx';
import ShortcutGuide from '../setup/ShortcutGuide.jsx';
import { INITIAL, PLACEHOLDER_BACKEND, loadSavedSetup } from '../setup/model.js';
import usePageMeta from '../usePageMeta.js';

// Paste the published iCloud Shortcut URLs here when they are ready.
const SHORTCUT_DOWNLOADS = {
  notes: '',
  reminders: '',
  calendar: '',
};

const MODULES = [
  ['notes', 'Apple Notes', '📝'],
  ['reminders', 'Reminders', '✅'],
  ['calendar', 'Calendar', '📅'],
];

function DownloadLink({ kind, label, icon }) {
  const href = SHORTCUT_DOWNLOADS[kind];
  return (
    <a
      className="btn small"
      href={href || undefined}
      aria-disabled={!href}
      onClick={!href ? (event) => event.preventDefault() : undefined}
      rel="noopener"
    >
      {icon} Download {label} Shortcut {href ? '↗' : '(coming soon)'}
    </a>
  );
}

export default function Shortcuts() {
  usePageMeta(
    'Set up Apple Shortcuts · Apple Queue',
    'Detailed Apple Queue Shortcut setup for Notes, Reminders, Calendar, attachments, acknowledgements, and automation.'
  );

  const saved = loadSavedSetup();
  const state = saved || { ...INITIAL, backendUrl: '', apiKey: '' };
  const enabled = MODULES.filter(([kind]) => state[kind]);
  const shown = saved ? enabled : MODULES;
  const connection = `Backend:  ${state.backendUrl || PLACEHOLDER_BACKEND}\nAPI key:  ${state.apiKey || '<your Apple Queue API key>'}`;

  return (
    <div className="wrap narrow">
      <section className="hero" style={{ textAlign: 'left', paddingBottom: 12 }}>
        <span className="eyebrow">Apple Shortcuts</span>
        <h1 style={{ fontSize: 'clamp(30px,5vw,44px)' }}>Connect your queue to Apple apps</h1>
        <p className="sub" style={{ margin: 0 }}>
          This is the Apple-side half of setup. Plan on taking your time: build and test one Shortcut before
          starting the next, and do not add the automation until manual runs work.
        </p>
      </section>

      {!saved && (
        <div className="note warn">
          <p>
            <strong>No saved setup was found in this browser.</strong> The examples use placeholders. Complete
            the <Link to="/setup">setup wizard</Link> here first, or replace the backend and key manually in
            every Shortcut action.
          </p>
        </div>
      )}

      <section className="block">
        <h2>Before you begin</h2>
        <p className="lede">Have these ready on the iPhone, iPad, or Mac where the Shortcuts will run.</p>
        <ol className="steps">
          <li><h3>Open this guide beside the Shortcuts app</h3><p>A Mac or second device makes the URL and API-key copying much easier.</p></li>
          <li><h3>Confirm your destinations exist</h3><p>Create the Notes folders, Reminders lists, and calendars named in your setup. Apple actions can silently fail when a destination does not exist.</p></li>
          <li><h3>Copy your connection details</h3><Copyable text={connection} /></li>
          <li><h3>Understand acknowledge</h3><p>Fetching is non-destructive. A Shortcut must acknowledge only the items it successfully created. Missing acknowledgement causes duplicates; acknowledging failed items loses them.</p></li>
        </ol>
      </section>

      <section className="block">
        <h2>Downloadable templates</h2>
        <p className="lede">These buttons are ready for the iCloud links when template Shortcuts are published.</p>
        <div className="row-actions" style={{ justifyContent: 'flex-start', flexWrap: 'wrap' }}>
          {MODULES.map(([kind, label, icon]) => <DownloadLink key={kind} kind={kind} label={label} icon={icon} />)}
        </div>
      </section>

      {shown.map(([kind]) => (
        <section className="block" id={kind} key={kind}>
          <ShortcutGuide kind={kind} state={state} />
          <div className="note">
            <p><strong>Test before continuing.</strong> Add one item from your backend dashboard, run this Shortcut manually, confirm it appears in the Apple app, then refresh the backend queue and verify it disappeared.</p>
          </div>
        </section>
      ))}

      <section className="block" id="automation">
        <h2>Run the finished Shortcuts automatically</h2>
        <ol className="steps">
          <li><h3>Open Shortcuts → Automation</h3><p>Create a Personal Automation. <strong>Time of Day</strong> is the simplest trigger; opening Notes or Reminders can also work.</p></li>
          <li><h3>Choose a practical schedule</h3><p>Hourly is a reasonable starting point. Apple limits how frequently some automation types can run, so the queue is eventually consistent rather than instant.</p></li>
          <li><h3>Add Run Shortcut actions</h3><p>Add one action for each module you enabled. Run them separately so one failed queue does not prevent the others from draining.</p></li>
          <li><h3>Turn off Ask Before Running</h3><p>This is required. Also turn off unnecessary completion notifications if the device offers that option.</p></li>
          <li><h3>Watch the first automatic run</h3><p>Leave test items queued, wait for the trigger, then confirm the Apple items were created once and the backend pending counts returned to zero.</p></li>
        </ol>
      </section>

      <div className="row-actions">
        <Link className="btn ghost" to="/setup">← Back to setup</Link>
        <span className="spacer" />
        <Link className="btn" to="/docs">API reference →</Link>
      </div>
    </div>
  );
}
