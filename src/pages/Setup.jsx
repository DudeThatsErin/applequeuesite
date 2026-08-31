import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Copyable from '../components/Copyable.jsx';
import CopyButton from '../components/CopyButton.jsx';
import Check from '../setup/Check.jsx';
import Field from '../setup/Field.jsx';
import { downloadExtension } from '../setup/extension.js';
import usePageMeta from '../usePageMeta.js';
import {
  CHROME_STORE_URL,
  EXTENSION_RELEASES,
  FIREFOX_ADDON_URL,
  TEMPLATE_REPO,
} from '../config.js';
import {
  LAST_STEP,
  PLACEHOLDER_BACKEND,
  STEPS,
  deployUrl,
  envLines,
  envPairs,
  genKey,
  load,
  normalizeUrl,
  pendingSecrets,
  save,
  summaryLines,
  validate,
} from '../setup/model.js';

export default function Setup() {
  usePageMeta(
    'Set up Apple Queue',
    'Choose your Apple Queue modules and defaults, deploy your own backend, connect the extension, and build your iOS Shortcuts.'
  );

  // Read the saved answers (and generate a key, if there isn't one) exactly once.
  const initial = useRef(null);
  if (!initial.current) initial.current = load();

  const [state, setState] = useState(initial.current.state);
  const [step, setStep] = useState(initial.current.step);
  // Errors only appear once you've tried to leave a step, not while typing
  // into a field you haven't finished yet.
  const [errors, setErrors] = useState({});
  const [extensionStatus, setExtensionStatus] = useState({ kind: '', text: '' });
  const navRef = useRef(null);

  const set = (patch) => setState((s) => ({ ...s, ...patch }));

  useEffect(() => save(state, step), [state, step]);

  // Once a step is showing errors, re-check on every keystroke so they clear
  // as soon as the problem is fixed.
  useEffect(() => {
    if (Object.keys(errors).length) setErrors(validate(step, state));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function go(target) {
    if (target > step) {
      const found = validate(step, state);
      setErrors(found);
      if (Object.keys(found).length) return;
    }
    setErrors({});
    setStep(target);
    const nav = navRef.current;
    if (nav && nav.getBoundingClientRect().top < 0) nav.scrollIntoView({ block: 'start' });
  }

  const pairs = useMemo(() => envPairs(state), [state]);
  const secrets = useMemo(() => pendingSecrets(state), [state]);
  const env = useMemo(() => envLines(state), [state]);

  async function createExtension() {
    setExtensionStatus({ kind: '', text: 'Building your private extension…' });
    try {
      await downloadExtension(state);
      setExtensionStatus({ kind: 'ok', text: '✓ Downloaded apple-queue-custom.zip.' });
    } catch (error) {
      setExtensionStatus({
        kind: 'bad',
        text: error instanceof Error ? error.message : 'Could not build the extension.',
      });
    }
  }

  const Nav = ({ back, next, nextLabel = 'Continue →' }) => (
    <div className="row-actions">
      {back ? (
        <button className="btn ghost" type="button" onClick={() => go(back)}>← Back</button>
      ) : (
        <span />
      )}
      <span className="spacer" />
      <button className="btn primary" type="button" onClick={() => go(next)}>{nextLabel}</button>
    </div>
  );

  return (
    <div className="wrap narrow">
      <section className="hero" style={{ paddingBottom: 0, textAlign: 'left' }}>
        <span className="eyebrow">Setup wizard</span>
        <h1 style={{ fontSize: 'clamp(28px,5vw,40px)' }}>Create your own Apple Queue</h1>
        <p className="sub" style={{ margin: 0 }}>
          Six steps, mostly copy-and-paste. Nothing you type here is sent anywhere. The wizard runs
          entirely in your browser and remembers your answers locally so you can come back to it.
        </p>
      </section>

      <div className="wizard-steps" id="stepNav" ref={navRef} aria-label="Progress">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const cls = n === step ? 'active' : n < step ? 'done' : '';
          return <span key={label} className={cls}>{n < step ? '✓ ' : ''}{label}</span>;
        })}
      </div>

      <form onSubmit={(e) => e.preventDefault()} autoComplete="off">

        {/* ---------- 1 · modules ---------- */}
        {step === 1 && (
          <div className="step-panel">
            <h2>1 · What should Apple Queue support?</h2>
            <p className="lede">Pick any combination. You can change this later by editing environment variables.</p>

            <div className="grid" style={{ gap: 10 }}>
              <Check
                checked={state.notes} onChange={(v) => set({ notes: v })}
                title="📝 Apple Notes"
                description="Markdown notes into a folder, with arbitrary file attachments."
              />
              <Check
                checked={state.reminders} onChange={(v) => set({ reminders: v })}
                title="✅ Reminders"
                description="Title, notes, list, URL, due date, priority, and image attachments."
              />
              <Check
                checked={state.calendar} onChange={(v) => set({ calendar: v })}
                title="📅 Calendar"
                description="Events with start and end, location, invitees, and alerts."
              />
            </div>

            {errors.modules && (
              <p className="note warn" role="alert"><strong>{errors.modules}</strong></p>
            )}

            <Nav next={2} />
          </div>
        )}

        {/* ---------- 2 · defaults ---------- */}
        {step === 2 && (
          <div className="step-panel">
            <h2>2 · Choose your defaults</h2>
            <p className="lede">
              Where items land when you don't pick something specific at capture time. These must match the
              names in your Apple apps exactly. A folder or list that doesn't exist will make the Shortcut fail.
            </p>

            {state.notes && (
              <Field
                id="defNotes" label="Default Notes folder"
                hint="The folder name as it appears in Apple Notes."
                value={state.defNotes} onChange={(v) => set({ defNotes: v })} error={errors.defNotes}
              />
            )}
            {state.reminders && (
              <Field
                id="defList" label="Default Reminders list"
                hint="Many people use a catch-all list like “Inbox”."
                value={state.defList} onChange={(v) => set({ defList: v })} error={errors.defList}
              />
            )}
            {state.calendar && (
              <Field
                id="defCal" label="Default calendar"
                hint="The calendar new events go on."
                value={state.defCal} onChange={(v) => set({ defCal: v })} error={errors.defCal}
              />
            )}
            {state.calendar && (
              <Field
                id="inviteList" label="Reminders list for invitee nudges"
                hint="When an event has invitees, Apple Queue also queues a “remember to invite…” reminder 24 hours before it starts."
                value={state.inviteList} onChange={(v) => set({ inviteList: v })} error={errors.inviteList}
              />
            )}

            <Nav back={1} next={3} />
          </div>
        )}

        {/* ---------- 3 · optional features ---------- */}
        {step === 3 && (
          <div className="step-panel">
            <h2>3 · Optional features</h2>
            <p className="lede">Both are off by default. Turn on only the features you want in your backend and custom extension.</p>

            <div className="grid" style={{ gap: 10 }}>
              <Check
                checked={state.ai} onChange={(v) => set({ ai: v })}
                title="✨ Natural-language parsing"
                description="Turn “call the vet tomorrow at 9” into a typed, titled, dated item."
              />
              <Check
                checked={state.places} onChange={(v) => set({ places: v })}
                title="📍 Google address autocomplete"
                description="Location suggestions for calendar events, proxied through your backend."
              />
            </div>

            {state.ai && (
              <div>
                <hr />
                <div className="note">
                  <p>
                    <strong>Provider settings now live in the extension.</strong> After installing, choose
                    OpenAI, Anthropic, Gemini, or Ollama in Settings and enter the exact model there. The
                    provider key stays in local browser storage and is sent through your authenticated backend
                    only for a test or parse request. It is not a Vercel environment variable.
                  </p>
                </div>
              </div>
            )}

            {state.places && (
              <div>
                <hr />
                <h3 style={{ margin: '0 0 6px', fontSize: 16 }}>Google Places</h3>
                <p className="hint" style={{ marginTop: 0 }}>
                  Create a key in Google Cloud with the <strong>Places API</strong> enabled. Restrict it to
                  that API. You'll paste it into Vercel as <code>GOOGLE_PLACES_API_KEY</code>.
                </p>
              </div>
            )}

            <Nav back={2} next={4} />
          </div>
        )}

        {/* ---------- 4 · deploy ---------- */}
        {step === 4 && (
          <div className="step-panel">
            <h2>4 · Deploy your backend</h2>
            <p className="lede">
              Vercel will copy the backend template into your own Git account, create a project, and ask you
              for environment variables. Everything you configured is in the block below.
            </p>

            <h3 style={{ marginTop: 0 }}>Your API key</h3>
            <p className="hint" style={{ marginTop: 0 }}>
              Generated in your browser with <code>crypto.getRandomValues</code>: 128 random bits, never
              sent anywhere. This is the only secret shared between your extension, your Shortcut, and your
              backend.
            </p>
            <div className="field">
              <input type="text" id="apiKey" className="mono" value={state.apiKey} readOnly />
              <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                <button className="btn small" type="button" onClick={() => set({ apiKey: genKey() })}>
                  Generate a new one
                </button>
                <CopyButton
                  text={state.apiKey}
                  label="Copy key"
                  className="btn small copy-btn"
                  style={{ opacity: 1, position: 'static' }}
                />
                <span className="hint" style={{ margin: 0 }}>Save it in your password manager.</span>
              </div>
            </div>

            <hr />

            <h3>Environment variables</h3>
            <p className="hint" style={{ marginTop: 0 }}>
              Vercel's deploy screen gives you one field per variable, already named, and fills nothing in.
              Copy each value across. It does not split a pasted block, whatever it looks like it might do.
            </p>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Name</th><th>Value</th><th /></tr>
                </thead>
                <tbody>
                  {pairs.map(({ name, value, supply }) => (
                    <tr key={name}>
                      <td><code>{name}</code></td>
                      <td>
                        {supply
                          ? <em style={{ color: 'var(--warn)' }}>paste {supply}</em>
                          : <code>{value}</code>}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {!supply && (
                          <CopyButton
                            text={value}
                            className="btn small copy-btn"
                            style={{ opacity: 1, position: 'static' }}
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {secrets.length > 0 && (
              <div className="note warn">
                <p>
                  <strong>
                    {secrets.length === 1
                      ? 'One of these is yours to supply,'
                      : `${secrets.length} of these are yours to supply,`}
                  </strong>{' '}
                  and the wizard deliberately never sees {secrets.length === 1 ? 'it' : 'them'}:
                </p>
                <p className="mono-out">{secrets.join('   ')}</p>
              </div>
            )}

            <details style={{ marginTop: 16 }}>
              <summary>Or take the whole thing as a <code>.env</code> file</summary>
              <p className="hint">
                Use this when you're self-hosting, or after the project exists: Vercel's{' '}
                <strong>Settings → Environment Variables</strong> screen has an import that does accept a
                pasted block. The deploy screen does not.
              </p>
              <Copyable text={env} />
            </details>

            <hr />

            <h3>Deploy</h3>
            <p className="hint" style={{ marginTop: 0 }}>Opens Vercel in a new tab. Come back here when it finishes.</p>
            <p>
              <a className="btn primary" href={deployUrl(state)} target="_blank" rel="noopener">
                Deploy My Apple Queue ↗
              </a>{' '}
              <a className="btn ghost" href={TEMPLATE_REPO} target="_blank" rel="noopener">
                View the template repo ↗
              </a>
            </p>

            <div className="note">
              <p>
                <strong>Prefer to self-host?</strong> Clone the same template, set the same variables in{' '}
                <code>.env</code>, and run it behind your own HTTPS. See{' '}
                <Link to="/docs#self-hosting">self-hosting in the docs</Link>.
              </p>
            </div>

            <hr />

            <h3>Where did it land?</h3>
            <Field
              id="backendUrl" type="url" mono label="Your backend URL"
              hint="Required. Paste the production URL Vercel gave you; the wizard uses it to fill in the rest of the steps."
              placeholder="https://my-apple-queue.vercel.app"
              value={state.backendUrl}
              onChange={(v) => set({ backendUrl: v })}
              error={errors.backendUrl}
            />
            <p className="hint" style={{ marginTop: 0 }}>
              {state.backendUrl && !errors.backendUrl
                ? `✓ Using ${normalizeUrl(state.backendUrl)}`
                : 'Browsers block extension requests to plain http, so this has to be https.'}
            </p>

            <Nav back={3} next={5} />
          </div>
        )}

        {/* ---------- 5 · extension ---------- */}
        {step === 5 && (
          <div className="step-panel">
            <h2>5 · Create and install your extension</h2>
            <p className="lede">
              Build a private copy of Apple Queue v1.8.0 for this backend. The ZIP is assembled entirely in
              your browser; your URL and API key are never uploaded to this site.
            </p>

            <div className="card">
              <h3>Your configured extension</h3>
              <p>
                It includes the modules and defaults you chose, enables AI only if you selected it, and grants
                network access only to <code>{normalizeUrl(state.backendUrl) || PLACEHOLDER_BACKEND}</code>.
              </p>
              <p style={{ marginTop: 14 }}>
                <button className="btn primary" type="button" onClick={createExtension}>
                  Create My Extension ↓
                </button>
              </p>
              {extensionStatus.text && (
                <p
                  role="status"
                  style={{
                    marginTop: 10,
                    color: extensionStatus.kind === 'ok'
                      ? 'var(--ok)'
                      : extensionStatus.kind === 'bad'
                        ? 'var(--bad)'
                        : 'var(--muted)',
                  }}
                >
                  {extensionStatus.text}
                </p>
              )}
            </div>

            <div className="note warn">
              <p>
                <strong>Keep the generated ZIP private.</strong> It contains your Apple Queue API key so the
                extension works immediately after installation. Regenerate it here after rotating the key or
                changing the backend URL.
              </p>
            </div>

            <hr />

            <h3>Install the ZIP</h3>

            <div className="grid cols-2">
              <div className="card">
                <h3>Chrome, Edge, Brave</h3>
                <p>
                  Unzip it, open <code>chrome://extensions</code>, enable <strong>Developer mode</strong>, choose{' '}
                  <strong>Load unpacked</strong>, and select the extracted folder.
                </p>
              </div>
              <div className="card">
                <h3>Firefox</h3>
                <p>
                  Unzip it, open <code>about:debugging#/runtime/this-firefox</code>, choose{' '}
                  <strong>Load Temporary Add-on</strong>, and select <code>manifest.json</code>. Temporary
                  installs must be loaded again after Firefox restarts.
                </p>
              </div>
            </div>

            <hr />

            <h3>Verify and finish settings</h3>
            <p className="hint" style={{ marginTop: 0 }}>
              Open the extension's Settings page. Your backend, key, defaults, and AI on/off choice are already
              filled in. Press <strong>Test extension connection</strong>. If you enabled AI, also choose a
              provider and model, enter that provider's key, save, then press <strong>Test AI connection</strong>.
            </p>
            <Copyable
              text={`Server URL:        ${state.backendUrl || PLACEHOLDER_BACKEND}\nAPI Key:           ${state.apiKey || '<your API key>'}\nNotes folder:      ${state.defNotes}\nReminders list:    ${state.defList}\nCalendar:          ${state.defCal}\nAI parsing:        ${state.ai ? 'on — finish provider settings in the extension' : 'off'}`}
            />
            <p className="hint">
              Prefer the unconfigured public build? You can still use the{' '}
              <a href={CHROME_STORE_URL || FIREFOX_ADDON_URL || EXTENSION_RELEASES} target="_blank" rel="noopener">
                latest release
              </a>{' '}
              and enter everything manually, but its fixed host permission may not allow a custom backend.
            </p>

            <Nav back={4} next={6} />
          </div>
        )}

        {/* ---------- 6 · shortcuts ---------- */}
        {step === 6 && (
          <div className="step-panel">
            <h2>6 · Set up your Apple Shortcuts</h2>
            <p className="lede">
              This is the longest part, so it now has a dedicated guide you can keep open while working in
              the Shortcuts app. Your saved backend, key, enabled modules, and destination names carry over.
            </p>

            <div className="note">
              <p>
                The guide includes detailed Notes, Reminders, and Calendar actions, attachment handling,
                acknowledgement, testing, automation, and placeholder download buttons for future template
                Shortcuts.
              </p>
            </div>

            <p style={{ margin: '24px 0' }}>
              <Link className="btn primary" to="/shortcuts">Open the Shortcut setup guide →</Link>
            </p>

            <Nav back={5} next={LAST_STEP} nextLabel="Finish →" />
          </div>
        )}

        {/* ---------- done ---------- */}
        {step === 7 && (
          <div className="step-panel">
            <h2>You're done 🎉</h2>
            <p className="lede">Your Apple Queue is yours: your repository, your hosting, your keys, your data.</p>

            <h3 style={{ marginTop: 0 }}>Your setup, for reference</h3>
            <Copyable text={summaryLines(state)} />

            <div className="note warn">
              <p>
                <strong>Keep your API key private.</strong> Anyone who has it and your backend URL can read
                and write your queue. If it leaks, change <code>APPLE_QUEUE_API_KEY</code> in your Vercel
                project, redeploy, and update the extension and your Shortcuts.
              </p>
            </div>

            <div className="grid cols-2" style={{ marginTop: 18 }}>
              <div className="card">
                <h3>Something not working?</h3>
                <p>
                  The <Link to="/docs#troubleshooting">troubleshooting section</Link> covers empty queues,
                  duplicated items, 401s, and attachments that don't attach.
                </p>
              </div>
              <div className="card">
                <h3>Changed your mind?</h3>
                <p>
                  Every choice here is an environment variable. Edit them in your Vercel project settings
                  and redeploy. No need to reinstall anything.
                </p>
              </div>
            </div>

            <div className="row-actions">
              <button className="btn ghost" type="button" onClick={() => go(1)}>Start over</button>
              <span className="spacer" />
              <Link className="btn" to="/docs">Read the docs →</Link>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
