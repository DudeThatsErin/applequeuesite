import { Link } from 'react-router-dom';
import usePageMeta from '../usePageMeta.js';

const FLOW = `Browser extension          Your backend                 Your iPhone / Mac
─────────────────          ────────────────             ─────────────────
Capture a note      ──▶    Queued (pending)      ──▶    Shortcut fetches pending
                                                        Creates the real Apple item
                           Removed from queue    ◀──    Shortcut acknowledges it`;

export default function Home() {
  usePageMeta(
    'Apple Queue: send anything from your browser to Apple Notes, Reminders, and Calendar',
    "Apple Queue is a browser extension plus your own private backend. Capture notes, reminders, and events from any page; an iOS Shortcut drops them straight into Apple's apps."
  );

  return (
    <div className="wrap">
      <section className="hero">
        <span className="eyebrow">Browser extension + your own backend</span>
        <h1>Capture to Apple Notes,<br />Reminders, and Calendar</h1>
        <p className="sub">
          Grab a selection, a page, or a quick thought from your browser. Apple Queue holds it
          until an iOS Shortcut on your iPhone or Mac files it into the real Apple app. No
          third-party account, no shared server, no one else's database.
        </p>
        <div className="cta">
          <Link className="btn primary" to="/setup">Create your Apple Queue →</Link>
          <a className="btn ghost" href="#how">How it works</a>
        </div>
        <p style={{ marginTop: 18, color: 'var(--muted)', fontSize: 14 }}>
          Free and open source · You deploy your own backend · Your data never touches our servers
        </p>
      </section>

      <section className="block" id="how">
        <h2>How it works</h2>
        <p className="lede">
          Apple has no public write API for Notes, Reminders, or Calendar on the web. Apple Queue
          works around that with a queue and a Shortcut: the browser writes, and your Apple device reads.
        </p>

        <pre><code>{FLOW}</code></pre>

        <div className="grid cols-3" style={{ marginTop: 22 }}>
          <div className="card">
            <span className="icon">🧩</span>
            <h3>Your extension</h3>
            <p>The wizard builds a private v1.8.0 ZIP with your backend, key, modules, and defaults already configured.</p>
          </div>
          <div className="card">
            <span className="icon">☁️</span>
            <h3>Your own backend</h3>
            <p>Deploy the open-source backend template to your Vercel account in a couple of minutes. It's yours.</p>
          </div>
          <div className="card">
            <span className="icon">📱</span>
            <h3>Your Shortcut</h3>
            <p>A personal automation runs on a schedule, drains the queue, and creates real Apple items.</p>
          </div>
        </div>
      </section>

      <section className="block">
        <h2>What you can capture</h2>
        <p className="lede">Enable only the modules you want. The extension hides the rest.</p>
        <div className="grid cols-3">
          <div className="card">
            <h3>📝 Apple Notes</h3>
            <p>Rich text captured as Markdown, a target folder, and arbitrary file attachments that ride along into the note.</p>
          </div>
          <div className="card">
            <h3>✅ Reminders</h3>
            <p>Title, notes, list, URL, due date, priority, and image attachments, straight into the list you choose.</p>
          </div>
          <div className="card">
            <h3>📅 Calendar</h3>
            <p>Start and end, all-day events, location, invitees, and alerts. Invitees also queue a nudge reminder.</p>
          </div>
        </div>
        <div className="grid cols-2" style={{ marginTop: 16 }}>
          <div className="card">
            <h3>✨ Natural-language parsing <span className="pill">optional</span></h3>
            <p>
              Type “lunch with Sam next Thursday at 1” and let a model fill the draft. Choose OpenAI, Anthropic,
              Gemini, or Ollama in the extension, then review everything before adding it.
            </p>
          </div>
          <div className="card">
            <h3>📍 Address autocomplete <span className="pill">optional</span></h3>
            <p>
              Google Places suggestions for event locations, proxied by your backend so the API key never ships
              inside the extension.
            </p>
          </div>
        </div>
      </section>

      <section className="block">
        <h2>Why you deploy it yourself</h2>
        <p className="lede">
          Apple Queue is deliberately not a hosted service. There is no account to create and no
          shared multi-tenant backend to trust.
        </p>
        <div className="grid cols-2">
          <div className="card">
            <h3>Your data stays yours</h3>
            <p>Queued items, attachments, and API keys live in your deployment and its storage, not in a
              database shared with strangers.</p>
          </div>
          <div className="card">
            <h3>Your keys, your usage</h3>
            <p>If you turn on AI parsing or Places autocomplete, you bring the key and you see the bill.
              Nobody can spend your quota, and you can't spend anyone else's.</p>
          </div>
          <div className="card">
            <h3>Secrets stay scoped</h3>
            <p>Google Places stays server-side. AI provider keys stay in local extension storage, not Sync,
              and pass through your authenticated backend only when you test or parse.</p>
          </div>
          <div className="card">
            <h3>Nothing to shut down</h3>
            <p>The project can go quiet and your install keeps working. It's your repository and your
              hosting account.</p>
          </div>
        </div>
      </section>

      <section className="block">
        <h2>Get going</h2>
        <ol className="steps">
          <li>
            <h3>Configure and deploy your backend</h3>
            <p>The setup wizard asks which modules you want and what your defaults should be, generates a
              strong API key in your browser, and hands you a Vercel deploy link plus the exact environment
              variables to paste in.</p>
            <p><Link className="btn small primary" to="/setup">Open the setup wizard</Link></p>
          </li>
          <li>
            <h3>Create and install the extension</h3>
            <p>The wizard builds it locally from the latest public source. Unzip it, load the folder in your
              browser, and press <strong>Test extension connection</strong>.</p>
          </li>
          <li>
            <h3>Build the Shortcut</h3>
            <p>The wizard prints Shortcut instructions for only the modules you enabled, then a personal
              automation to run them on a schedule.</p>
          </li>
        </ol>
      </section>

      <section className="block">
        <h2>Two ways to run it</h2>
        <div className="grid cols-2">
          <div className="card">
            <h3>Hosted on Vercel <span className="pill ok">recommended</span></h3>
            <p>Your backend runs in your Vercel account. Your computer does not need to stay on; captures
              work from any device, any time.</p>
          </div>
          <div className="card">
            <h3>Self-hosted</h3>
            <p>Run the same backend on your own server or home machine. That system has to stay reachable,
              or the queue can't be written to or drained.</p>
          </div>
        </div>
        <div className="note warn">
          <p><strong>About “free.”</strong> Apple Queue can usually be deployed using free-tier services for
            light personal use. Provider limits and terms may change, and you are responsible for usage on
            accounts you connect.</p>
        </div>
      </section>

      <section className="block">
        <h2>Common questions</h2>
        <div className="grid cols-2">
          <div className="card">
            <h3>Does this need a Mac?</h3>
            <p>No. The Shortcut runs on iPhone, iPad, or Mac: anywhere the Shortcuts app can create Notes,
              Reminders, or Calendar items.</p>
          </div>
          <div className="card">
            <h3>How fast does a capture arrive?</h3>
            <p>As fast as your automation runs it. A scheduled personal automation is the hands-off option;
              you can also run the Shortcut manually for an instant flush.</p>
          </div>
          <div className="card">
            <h3>Do I need to keep the project files around?</h3>
            <p>Not with the hosted option. Once deployed, the extension talks to your backend URL, and nothing
              runs on your computer.</p>
          </div>
          <div className="card">
            <h3>Can I turn the AI off entirely?</h3>
            <p>Yes. Leave it disabled in the wizard and the endpoints stay off and the UI hides them. It's
              off unless you deliberately enable it.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
