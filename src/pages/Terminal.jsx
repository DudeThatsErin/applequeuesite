import { Link } from 'react-router-dom';
import Copyable from '../components/Copyable.jsx';
import {
  CLI_DOTNET_VERSION,
  CLI_INSTALL_DOTNET,
  CLI_ISSUES,
  CLI_NUGET,
  CLI_REPO,
  CLI_UNINSTALL_DOTNET,
  CLI_UPDATE_DOTNET,
} from '../config.js';
import usePageMeta from '../usePageMeta.js';

const FLOW = `Your terminal              Your backend                 Your iPhone / Mac
─────────────              ────────────────             ─────────────────
applequeue note add ──▶    Queued (pending)      ──▶    Shortcut fetches pending
                                                         Creates the real Apple item
                           Removed from queue    ◀──    Shortcut acknowledges it`;

const CONFIGURE = `applequeue configure
# Apple Queue backend URL: https://YOUR-BACKEND.vercel.app
# API key (input hidden): ••••••••

applequeue doctor`;

const EXAMPLES = `applequeue journal add "Today" --body "Long walk, good coffee."
applequeue note add "Trip ideas" --body "Kyoto in spring" --folder Travel
applequeue reminder add "Pick up milk" --list Errands --due "tomorrow 9am" --priority high
applequeue event add "Dentist" --start "2026-09-15T09:00" --duration 90m --location "Main St"

applequeue list reminders
applequeue remove notes <id>`;

const PIPING = `# the body of a note from anything that writes to stdout
git log --oneline -20 | applequeue note add "Release notes" --stdin

# machine-readable output for scripts
applequeue reminder add "Renew passport" --due +7d --json | jq -r '.reminder.id'`;

const ENVIRONMENT = `APPLE_QUEUE_URL=https://YOUR-BACKEND.vercel.app
APPLE_QUEUE_API_KEY=<your Apple Queue API key>
APPLE_QUEUE_TIMEOUT_MS=15000`;

const WINDOWS = `dotnet tool install --global AppleQueueTerminal
# reopen the terminal so applequeue is on your PATH

applequeue configure
applequeue journal add "Windows test" --body "Queued from PowerShell"
applequeue list journal`;

const COMMANDS = [
  { command: 'applequeue configure', purpose: <>Save and verify your backend URL and API key.</> },
  { command: 'applequeue doctor', purpose: <>Connection, enabled modules, defaults, and storage mode.</> },
  { command: 'applequeue journal add', purpose: <><code>--body</code>, <code>--date</code>, <code>--stdin</code>.</> },
  { command: 'applequeue note add', purpose: <><code>--body</code>, <code>--folder</code>, <code>--stdin</code>.</> },
  { command: 'applequeue reminder add', purpose: <><code>--notes</code>, <code>--list</code>, <code>--due</code>, <code>--priority</code>, <code>--url</code>.</> },
  { command: 'applequeue event add', purpose: <><code>--start</code>, <code>--end</code> or <code>--duration</code>, <code>--calendar</code>, <code>--location</code>, <code>--invitee</code>, <code>--alert</code>, <code>--all-day</code>.</> },
  { command: 'applequeue list <kind>', purpose: <>What is still waiting: <code>journal</code>, <code>notes</code>, <code>reminders</code>, <code>events</code>.</> },
  { command: 'applequeue remove <kind> <id>', purpose: <>Discard queued items without creating them.</> },
];

const EXIT_CODES = [
  ['0', 'Success.'],
  ['1', 'Usage or local validation error, such as a missing --start.'],
  ['2', 'Unauthorized. The backend rejected the API key.'],
  ['3', 'That module is disabled on your deployment.'],
  ['4', 'Network failure or timeout.'],
  ['5', 'Any other backend error.'],
  ['6', 'Not configured yet.'],
];

export default function Terminal() {
  usePageMeta(
    'Apple Queue in the terminal: the applequeue CLI',
    'Queue Apple Journal entries, Notes, Reminders, and Calendar events from a shell with the applequeue command. Install it as a .NET tool; no browser extension required.'
  );

  return (
    <div className="wrap narrow">
      <section className="hero" style={{ textAlign: 'left', paddingBottom: 12 }}>
        <span className="eyebrow">Terminal client</span>
        <h1 style={{ fontSize: 'clamp(30px,5vw,44px)' }}>Capture from the command line</h1>
        <p className="sub" style={{ margin: 0 }}>
          <code>applequeue</code> talks to the same backend as the browser extension, using the same
          API key and the same queues. No browser, no extension, and nothing new to deploy — if your
          Apple Queue already works, the CLI works.
        </p>
      </section>

      <div className="toc-inline">
        <a href="#install">Install</a>
        <a href="#configure">Configure</a>
        <a href="#commands">Commands</a>
        <a href="#scripting">Scripting</a>
        <a href="#windows">Windows</a>
        <a href="#security">Security</a>
      </div>

      <section className="block" id="install">
        <h2>Install</h2>
        <p className="lede">
          One command on macOS, Linux, and Windows. It gives you an <code>applequeue</code> command.
        </p>

        <Copyable text={CLI_INSTALL_DOTNET} />

        <p>
          <code>applequeue</code> is a .NET tool, so it needs the{' '}
          <a href="https://dotnet.microsoft.com/download/dotnet/8.0" target="_blank" rel="noopener">
            {CLI_DOTNET_VERSION} SDK ↗
          </a>{' '}
          and nothing else. <code>--global</code> installs it under your own home directory, so no
          administrator rights are involved.
        </p>

        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Task</th><th>Command</th></tr>
            </thead>
            <tbody>
              <tr><td>Install</td><td><code>{CLI_INSTALL_DOTNET}</code></td></tr>
              <tr><td>Upgrade</td><td><code>{CLI_UPDATE_DOTNET}</code></td></tr>
              <tr><td>Remove</td><td><code>{CLI_UNINSTALL_DOTNET}</code></td></tr>
            </tbody>
          </table>
        </div>

        <p>
          If your shell reports <code>command not found</code> straight after installing, the .NET global
          tools directory is not on your <code>PATH</code>. Add <code>~/.dotnet/tools</code> on macOS and
          Linux, or <code>%USERPROFILE%\.dotnet\tools</code> on Windows, then open a new terminal.
        </p>

        <div className="note">
          <p>
            <strong>The CLI is a client, not a second backend.</strong> It queues items exactly like the
            extension does; your Apple Shortcut still creates the real Notes, Reminders, Calendar events,
            and Journal entries. If you have not set that up yet, start with the{' '}
            <Link to="/setup">setup wizard</Link> and the <Link to="/shortcuts">Shortcuts guide</Link>.
          </p>
        </div>
      </section>

      <section className="block" id="configure">
        <h2>Configure</h2>
        <p className="lede">
          One prompt for your backend URL and API key. The key is never echoed back or printed.
        </p>
        <Copyable text={CONFIGURE} />

        <div className="note">
          <p>
            <strong>Use your backend URL, not this site.</strong> It is whatever host serves{' '}
            <code>/api</code> for your install — the same URL your extension and Shortcuts already use.
            That may be a <code>.vercel.app</code> deployment or your own domain. Pointing somewhere else
            makes <code>doctor</code> report that no Apple Queue API was found there.
          </p>
        </div>

        <p>
          <code>configure</code> stores the values in <code>%APPDATA%\applequeue\config.json</code> on
          Windows, locked to your user account, or <code>~/.config/applequeue/config.json</code> with mode{' '}
          <code>0600</code> on macOS and Linux. <code>doctor</code> then reports the backend it reached,
          which modules are enabled, and the defaults it will use.
        </p>

        <p>
          Installs that predate the standalone backend template have the queue endpoints but no{' '}
          <code>/api/config</code> or <code>/api/health</code>. That is supported: the CLI skips the
          preflight, asks each queue directly, and lets the backend apply its own defaults.
        </p>

        <h3>Environment overrides</h3>
        <p>For CI, servers, and dotfiles, the environment wins over the saved file.</p>
        <Copyable text={ENVIRONMENT} />
      </section>

      <section className="block" id="commands">
        <h2>Commands</h2>
        <Copyable text={EXAMPLES} />

        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Command</th><th>What it does</th></tr>
            </thead>
            <tbody>
              {COMMANDS.map(({ command, purpose }) => (
                <tr key={command}>
                  <td><code>{command}</code></td>
                  <td>{purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          Dates accept ISO values read as local time (<code>2026-09-15T09:00</code>), relative offsets
          (<code>+2h</code>, <code>+30m</code>, <code>+3d</code>), and shorthand (<code>today</code>,{' '}
          <code>tonight</code>, <code>tomorrow 9am</code>, <code>yesterday</code>). Events default to an
          hour when you give neither <code>--end</code> nor <code>--duration</code>.
        </p>

        <p>
          Destinations you leave out fall back to the defaults your backend reports, so{' '}
          <code>applequeue note add "Idea"</code> lands in your configured folder. A module that is turned
          off on your deployment fails before anything is sent, rather than queueing into the void.
        </p>

        <p>
          <code>applequeue --help</code> lists every command, and each command documents its own flags
          and examples: <code>applequeue event add --help</code>.
        </p>
      </section>

      <section className="block" id="scripting">
        <h2>Scripting</h2>
        <p className="lede">
          The point of a CLI: capture from things a browser extension can never see.
        </p>
        <Copyable text={PIPING} />

        <p>
          <code>--json</code> prints the backend's raw response on stdout and nothing else, so progress
          messages never contaminate a pipe. Exit codes are stable, which makes failures branchable.
        </p>

        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Exit code</th><th>Meaning</th></tr>
            </thead>
            <tbody>
              {EXIT_CODES.map(([code, meaning]) => (
                <tr key={code}><td><code>{code}</code></td><td>{meaning}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="block" id="windows">
        <h2>Windows</h2>
        <p className="lede">
          The same .NET tool works in PowerShell, cmd.exe, and Git Bash, with no admin rights.
        </p>
        <Copyable text={WINDOWS} />

        <ul>
          <li>Quote anything containing spaces: <code>--due "tomorrow 9am"</code>.</li>
          <li>If PowerShell swallows a flag value, use the equals form: <code>--title="Trip ideas"</code>.</li>
          <li>Pipe with <code>Get-Content notes.md | applequeue note add "Notes" --stdin</code>.</li>
          <li>In cmd.exe, set overrides with <code>set APPLE_QUEUE_URL=...</code> rather than <code>$env:</code>.</li>
        </ul>
      </section>

      <section className="block" id="security">
        <h2>Security</h2>
        <div className="grid cols-2">
          <div className="card">
            <h3>The key stays a header</h3>
            <p>
              It is sent only as <code>x-api-key</code> to the backend you configured — never in a URL,
              never in a log, and never in an error message or <code>--json</code> output.
            </p>
          </div>
          <div className="card">
            <h3>HTTPS or localhost</h3>
            <p>
              Plain <code>http://</code> is refused for anything but <code>localhost</code>, so a mistyped
              backend cannot quietly send your captures in the clear.
            </p>
          </div>
          <div className="card">
            <h3>Same trust boundary</h3>
            <p>
              The CLI adds no server and no third party. It is your machine talking to your deployment
              with your key, exactly like the extension.
            </p>
          </div>
          <div className="card">
            <h3>Rotating a key</h3>
            <p>
              Change <code>APPLE_QUEUE_API_KEY</code> on your deployment, then re-run{' '}
              <code>applequeue configure</code>. Never paste a key into a bug report.
            </p>
          </div>
        </div>
      </section>

      <section className="block">
        <h2>Source and support</h2>
        <div className="row-actions" style={{ justifyContent: 'flex-start', flexWrap: 'wrap' }}>
          <a className="btn small" href={CLI_REPO} target="_blank" rel="noopener">GitHub repository ↗</a>
          <a className="btn small" href={CLI_NUGET} target="_blank" rel="noopener">NuGet package ↗</a>
          <a className="btn small" href={CLI_ISSUES} target="_blank" rel="noopener">Report a CLI bug ↗</a>
        </div>
      </section>

      <div className="row-actions">
        <Link className="btn ghost" to="/shortcuts">← Shortcuts guide</Link>
        <span className="spacer" />
        <Link className="btn" to="/docs">API reference →</Link>
      </div>
    </div>
  );
}
