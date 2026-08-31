import Copyable from '../components/Copyable.jsx';
import { EXTENSION_REPO, TEMPLATE_REPO } from '../config.js';
import usePageMeta from '../usePageMeta.js';

const NOTE_SHAPE = `{
  "id":          "uuid",
  "title":       "string",
  "body":        "string (Markdown)",
  "folder":      "string",
  "createdAt":   "ISO 8601",
  "attachments": [ { "name": "string", "url": "string", "mimeType": "string" } ]
}`;

const REMINDER_SHAPE = `{
  "id":        "uuid",
  "title":     "string",
  "notes":     "string (Markdown)",
  "list":      "string",
  "url":       "string",
  "dueDate":   "ISO 8601 | \\"\\"",
  "priority":  "none | low | medium | high",
  "attachments": [ { "name": "string", "url": "string", "mimeType": "image/*" } ],
  "createdAt": "ISO 8601"
}`;

const EVENT_SHAPE = `{
  "id":        "uuid",
  "title":     "string",
  "notes":     "string",
  "calendar":  "string",
  "startDate": "ISO 8601",
  "endDate":   "ISO 8601",
  "allDay":    false,
  "location":  "string",
  "url":       "string",
  "invitees":  [ "string" ],
  "alerts":    [ 15, 60 ],
  "createdAt": "ISO 8601"
}`;

const CURL_QUEUE = `curl -X POST https://YOUR-BACKEND.vercel.app/api/reminders \\
  -H "x-api-key: $APPLE_QUEUE_API_KEY" \\
  -H "content-type: application/json" \\
  -d '{"title":"Renew passport","list":"Inbox","priority":"high"}'`;

const CURL_ROUNDTRIP = `# 1. what's waiting?
curl https://YOUR-BACKEND.vercel.app/api/reminders/pending \\
  -H "x-api-key: $APPLE_QUEUE_API_KEY"

# 2. created them; clear the queue
curl -X POST https://YOUR-BACKEND.vercel.app/api/reminders/ack \\
  -H "x-api-key: $APPLE_QUEUE_API_KEY" \\
  -H "content-type: application/json" \\
  -d '{"ids":["<id>","<id>"]}'`;

const FILENAMES = `Display name:        bowen_img.jpg          ← what you see in the note
Storage identifier:   3f9c…-bowen_img.jpg   ← what's actually stored`;

const SELF_HOST = `git clone ${TEMPLATE_REPO}
cd AppleQueue-Backend
cp .env.example .env      # fill in the values from the setup wizard
npm install
npm run build
npm start`;

const groupRow = { color: 'var(--muted)', fontSize: 13, paddingTop: 16 };

const API_ROWS = [
  { group: null, method: 'GET', path: '/api/config', purpose: <>Enabled modules, defaults, and feature flags, with no provider secrets.</> },
  { group: null, method: 'GET', path: '/api/health', purpose: <>Liveness, token, and storage check.</> },
  { group: null, method: 'GET', path: '/api/extension', purpose: <>A private extension ZIP configured with this backend, key, modules, and defaults.</> },
  { group: 'Notes' },
  { method: 'POST', path: '/api/apple-notes', purpose: <>Queue a note. <code>title</code> required.</> },
  { method: 'GET', path: '/api/apple-notes', purpose: <>List queued notes (the extension's queue view).</> },
  { method: 'DELETE', path: '/api/apple-notes', purpose: <>Drop items by id without creating them.</> },
  { method: 'GET', path: '/api/apple-notes/pending', purpose: <>What the Shortcut fetches.</> },
  { method: 'POST', path: '/api/apple-notes/ack', purpose: <><code>{'{"ids": [...]}'}</code>, meaning created, so remove them.</> },
  { method: 'POST', path: '/api/apple-notes/upload', purpose: <>Multipart field <code>file</code>. Returns a durable attachment URL.</> },
  { group: 'Reminders' },
  { method: 'POST / GET / DELETE', path: '/api/reminders', purpose: <>Same shape as notes.</> },
  { method: 'GET', path: '/api/reminders/pending', purpose: <>Shortcut fetch.</> },
  { method: 'POST', path: '/api/reminders/ack', purpose: <>Acknowledge.</> },
  { group: 'Calendar' },
  { method: 'POST / GET / DELETE', path: '/api/calendar', purpose: <><code>title</code>, <code>startDate</code>, <code>endDate</code> required.</> },
  { method: 'GET', path: '/api/calendar/pending', purpose: <>Shortcut fetch.</> },
  { method: 'POST', path: '/api/calendar/ack', purpose: <>Acknowledge.</> },
  { group: 'Optional' },
  { method: 'POST', path: '/api/places/autocomplete', purpose: <><code>{'{"input": "…"}'}</code> → suggestions. <code>503</code> when Places is off.</> },
  { method: 'POST', path: '/api/ai/test', purpose: <>Test the provider configuration entered in the extension. <code>503</code> when AI is off.</> },
  { method: 'POST', path: '/api/ai/parse', purpose: <>Free text → typed, titled, dated capture. <code>503</code> when AI is off.</> },
];

const ENV_ROWS = [
  ['APPLE_QUEUE_API_KEY', <em>required</em>, <>Your per-install token. No default, and the backend refuses to serve queue endpoints without it.</>],
  ['ENABLE_NOTES', <code>true</code>, <>Turn the Notes module on or off.</>],
  ['ENABLE_REMINDERS', <code>true</code>, <>Turn the Reminders module on or off.</>],
  ['ENABLE_CALENDAR', <code>true</code>, <>Turn the Calendar module on or off.</>],
  ['DEFAULT_NOTES_FOLDER', <code>Notes</code>, <>Folder for captures that don't name one.</>],
  ['DEFAULT_REMINDER_LIST', <code>Reminders</code>, <>List for reminders that don't name one.</>],
  ['DEFAULT_CALENDAR', <code>Calendar</code>, <>Calendar for events that don't name one.</>],
  ['CALENDAR_INVITE_REMINDER_LIST', <code>Inbox</code>, <>Where invitee nudge reminders go.</>],
  ['AI_ENABLED', <code>false</code>, <>Master switch for parsing. Off means the endpoints return <code>503</code>.</>],
  ['PLACES_ENABLED', <code>false</code>, <>Master switch for address autocomplete.</>],
  ['GOOGLE_PLACES_API_KEY', 'none', <>Server-side only. Never goes near the extension.</>],
  [['KV_REST_API_URL', 'KV_REST_API_TOKEN'], 'none', <>Queue storage. Set for you automatically if you attach a Vercel/Upstash Redis store.</>],
  ['BLOB_READ_WRITE_TOKEN', 'none', <>Attachment storage. Set for you automatically if you attach a Vercel Blob store.</>],
  ['PUBLIC_BASE_URL', 'auto', <>Only needed if the URL your Shortcut uses differs from what the platform reports.</>],
];

export default function Docs() {
  usePageMeta(
    'Apple Queue docs: API, configuration, self-hosting',
    'Apple Queue reference: HTTP API, environment variables, storage, security model, self-hosting, and troubleshooting.'
  );

  return (
    <div className="wrap">
      <section className="hero" style={{ textAlign: 'left', paddingBottom: 10 }}>
        <span className="eyebrow">Reference</span>
        <h1 style={{ fontSize: 'clamp(28px,5vw,40px)' }}>Apple Queue documentation</h1>
        <p className="sub" style={{ margin: 0 }}>
          Everything the backend exposes, every variable that configures it, and what to check when
          something doesn't arrive.
        </p>
      </section>

      <div className="toc-inline">
        <a href="#model">Data model</a>
        <a href="#api">HTTP API</a>
        <a href="#environment">Environment</a>
        <a href="#storage">Storage</a>
        <a href="#security">Security</a>
        <a href="#self-hosting">Self-hosting</a>
        <a href="#troubleshooting">Troubleshooting</a>
      </div>

      <section className="block" id="model">
        <h2>Data model</h2>
        <p className="lede">
          Three independent queues. An item is created by the extension, read once by your
          Shortcut, then acknowledged and deleted.
        </p>

        <h3>Note</h3>
        <pre><code>{NOTE_SHAPE}</code></pre>

        <h3>Reminder</h3>
        <pre><code>{REMINDER_SHAPE}</code></pre>

        <h3>Event</h3>
        <pre><code>{EVENT_SHAPE}</code></pre>

        <p>
          <code>alerts</code> is minutes before the start, deduplicated and sorted. Shortcuts cannot send
          calendar invitations, so any <code>invitees</code> also enqueue a reminder to{' '}
          <code>CALENDAR_INVITE_REMINDER_LIST</code> 24 hours before the event.
        </p>
      </section>

      <section className="block" id="api">
        <h2>HTTP API</h2>
        <p className="lede">
          Every endpoint requires your per-install token, sent as an <code>x-api-key</code> header (or a{' '}
          <code>?key=</code> query parameter for tools that can't set headers). Anything unauthenticated
          gets a <code>401</code>.
        </p>

        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Method</th><th>Path</th><th>Purpose</th></tr>
            </thead>
            <tbody>
              {API_ROWS.map((row, i) =>
                row.group ? (
                  <tr key={i}><td colSpan={3} style={groupRow}>{row.group}</td></tr>
                ) : (
                  <tr key={i}>
                    <td>{row.method}</td>
                    <td><code>{row.path}</code></td>
                    <td>{row.purpose}</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>

        <h3>Example: queue a reminder</h3>
        <Copyable text={CURL_QUEUE} />

        <h3>Example: the Shortcut round trip</h3>
        <Copyable text={CURL_ROUNDTRIP} />

        <div className="note">
          <p>
            <strong>Acknowledge or duplicate.</strong> <code>/pending</code> is not destructive; it returns
            the same items until you acknowledge them. That's deliberate, so a Shortcut that dies halfway
            doesn't lose your capture. It also means a Shortcut missing its ack step will create every item
            again on every run.
          </p>
        </div>
      </section>

      <section className="block" id="environment">
        <h2>Environment variables</h2>
        <p className="lede">
          The whole configuration surface. Change any of these in your hosting project's
          settings and redeploy. If you change enabled modules, regenerate your custom extension so its tabs match.
        </p>

        <div className="table-wrap">
          <table>
            <thead><tr><th>Variable</th><th>Default</th><th>Meaning</th></tr></thead>
            <tbody>
              {ENV_ROWS.map(([name, def, meaning]) => (
                <tr key={Array.isArray(name) ? name[0] : name}>
                  <td>
                    {Array.isArray(name)
                      ? name.map((n, i) => <span key={n}>{i > 0 && <br />}<code>{n}</code></span>)
                      : <code>{name}</code>}
                  </td>
                  <td>{def}</td>
                  <td>{meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>Boolean variables read as true unless the value is literally <code>false</code>.</p>
      </section>

      <section className="block" id="storage">
        <h2>Storage</h2>
        <p className="lede">Serverless functions get a throwaway filesystem, so nothing durable can live on disk.</p>
        <div className="grid cols-2">
          <div className="card">
            <h3>Queues</h3>
            <p>A Redis/KV store, and Vercel's Upstash integration is the default. The pending-item model is
              small and short-lived, so a key-value store is a better fit than a relational database.
              Neon, Supabase, or plain Postgres work too if you'd rather.</p>
          </div>
          <div className="card">
            <h3>Attachments</h3>
            <p>Object storage: Vercel Blob by default, or any S3-compatible bucket (R2, S3, MinIO).
              Uploads are capped at 20&nbsp;MB. Notes accept any browser-provided file; Reminder attachments
              are restricted to images.</p>
          </div>
        </div>
        <h3>Filenames</h3>
        <p>Two names are tracked per attachment, on purpose:</p>
        <pre><code>{FILENAMES}</code></pre>
        <p>The stored name is prefixed with a random identifier so two uploads can't collide, and sanitized
          so a crafted filename can't escape its prefix. The display name is what the note shows.</p>
      </section>

      <section className="block" id="security">
        <h2>Security model</h2>
        <p className="lede">
          Short version: the extension holds one token for one backend. Google Places stays server-side;
          AI provider keys stay in local extension storage and are sent only through authenticated AI requests.
        </p>
        <div className="grid cols-2">
          <div className="card">
            <h3>What the extension knows</h3>
            <p>Your backend URL, Apple Queue token, defaults, and, when enabled, the provider/model/API key
              you enter for AI. Provider keys use local extension storage rather than browser Sync.</p>
          </div>
          <div className="card">
            <h3>What stays on the server</h3>
            <p>Your Google Places key and queued data. The backend receives an AI provider key only for the
              provider call it is proxying and does not persist it.</p>
          </div>
        </div>
        <h3>What the backend enforces</h3>
        <ul>
          <li>authentication on every queue read, write, acknowledge, and delete;</li>
          <li>rate limits on the endpoints that proxy paid APIs;</li>
          <li>upload size validation and image-only Reminder attachment validation;</li>
          <li>filename sanitizing and path-traversal rejection;</li>
          <li>request-body validation on every route;</li>
          <li>unguessable attachment URLs, and no directory listing.</li>
        </ul>
        <div className="note warn">
          <p>
            <strong>Attachment URLs are capability URLs.</strong> They're long and random, but anyone
            holding one can fetch that file, which is exactly what makes them work inside a Shortcut. Don't
            attach anything you'd be unhappy to have readable by a link holder.
          </p>
        </div>
        <h3>Rotating your token</h3>
        <p>Change <code>APPLE_QUEUE_API_KEY</code> in your project settings, redeploy, then update the
          extension's settings and the <code>x-api-key</code> header in each Shortcut. The old token stops
          working the moment the new deployment goes live.</p>
      </section>

      <section className="block" id="self-hosting">
        <h2>Self-hosting</h2>
        <p className="lede">Same code, your own box. Worth knowing what changes.</p>
        <div className="grid cols-2">
          <div className="card">
            <h3>Hosted on Vercel</h3>
            <p>Your backend runs on Vercel. Your computer does not need to stay on.</p>
          </div>
          <div className="card">
            <h3>Self-hosted</h3>
            <p>Your backend runs on your own server or computer. That system must remain available for
              Apple Queue to work.</p>
          </div>
        </div>
        <Copyable text={SELF_HOST} />
        <p>Then put it behind HTTPS with a real certificate. Browsers block extension requests to plain
          <code>http://</code>, and your Shortcut will be carrying your API key over the network.</p>
        <p>Self-hosting also lets you keep filesystem-backed storage instead of Redis and Blob, and use a
          local Ollama URL in the extension. A serverless deployment cannot reach Ollama on your home network.</p>
      </section>

      <section className="block" id="troubleshooting">
        <h2>Troubleshooting</h2>

        <div className="grid cols-2">
          <div className="card">
            <h3>Test connection fails</h3>
            <p>Check the URL has no trailing slash and no <code>/api</code> on the end, that it's
              <code>https://</code>, and that the key matches <code>APPLE_QUEUE_API_KEY</code> exactly:
              a trailing space pasted from a terminal is the usual culprit.</p>
          </div>
          <div className="card">
            <h3>401 from the Shortcut</h3>
            <p>The header name is <code>x-api-key</code>, not <code>Authorization</code>. Shortcuts silently
              drops a header with an empty value, so confirm the value is actually there.</p>
          </div>
          <div className="card">
            <h3>Items arrive twice, or forever</h3>
            <p>Your acknowledge step isn't running or is posting an empty <code>ids</code> array. Call
              <code>/pending</code> by hand after a run. If the item is still listed, the ack didn't land.</p>
          </div>
          <div className="card">
            <h3>Queue is empty but I captured something</h3>
            <p>Confirm the module is enabled in <code>/api/config</code>, and that the extension is pointed
              at the backend you think it is. A capture against a stale URL fails quietly.</p>
          </div>
          <div className="card">
            <h3>Shortcut runs but nothing appears</h3>
            <p>Usually a folder, list, or calendar name that doesn't exist on the device. Apple's actions
              don't always error on a bad name. Match your defaults to the real names, exactly.</p>
          </div>
          <div className="card">
            <h3>Attachments don't attach</h3>
            <p>The note's <code>attachments</code> list has to be looped explicitly; a Shortcut that only
              reads <code>body</code> won't fetch them. Verify one URL in a browser first.</p>
          </div>
          <div className="card">
            <h3>The automation never fires</h3>
            <p><strong>Ask Before Running</strong> is still on, or the device was locked and low on battery.
              Run the Shortcut manually to prove the Shortcut itself works, then fix the automation.</p>
          </div>
          <div className="card">
            <h3>AI parsing returns 503 or 429</h3>
            <p><code>503</code> means <code>AI_ENABLED</code> is off. A provider error names the selected
              service; <code>429</code> means the deployment's per-minute AI proxy limit was reached.</p>
          </div>
        </div>

        <div className="note">
          <p>
            <strong>Still stuck?</strong> Open an issue on{' '}
            <a href={EXTENSION_REPO} target="_blank" rel="noopener">GitHub</a>. Include your{' '}
            <code>/api/config</code> response and the failing step, and redact your API key.
          </p>
        </div>
      </section>
    </div>
  );
}
