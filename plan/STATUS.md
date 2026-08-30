# Apple Queue public release: build status

Last updated: 2026-08-30.

Not served: nginx's root is `dist/`, so this file and `backend/` are outside the
document root entirely. `/plan/anything` falls through to the SPA's 404 page.

---

## ⚠️ Do this first, before anything ships

**Rotate `APPLE_NOTES_API_KEY` on dashboard.erinskidds.com.**
`/home/ubuntu/projects/apple-notes-extension/background.js:38-40` hardcodes a live
dashboard API key as the default value for `apiKey`, and that repo is public on GitHub
(`github.com/DudeThatsErin/AppleQueue`). Treat the current key as compromised. The
bring-your-own-backend model fixes the design; rotating fixes the existing exposure.

---

## Done

### The public site, `/var/www/applequeue.erinskidds.com/`

**React + Vite**, built to `dist/`, which is all nginx exposes. It was a set of
hand-written static HTML pages until 2026-08-30; the rewrite kept the content and
the stylesheet verbatim and moved the behaviour into components.

| Route | File | What it is |
|---|---|---|
| `/` | `src/pages/Home.jsx` | Landing page: what it is, how the queue/Shortcut round trip works, modules, why self-deploy, hosted vs self-hosted, free-tier caveat, FAQ |
| `/setup` | `src/pages/Setup.jsx` + `src/setup/*` | The 6-step wizard (see below) |
| `/docs` | `src/pages/Docs.jsx` | Reference: data model, full HTTP API table, every env var, storage, security model, self-hosting, troubleshooting |
| `*` | `src/pages/NotFound.jsx` | In-app 404, reached through nginx's SPA fallback |

- `src/site.css` is the original stylesheet, unchanged apart from the invalid-field
  styles. `src/config.js` holds the four constants worth editing (repo URLs, store
  listing URLs).
- `src/components/` : `TopBar`, `Footer`, `ThemeToggle`, `Copyable`, `CopyButton`.
- `src/usePageMeta.js` sets title/description per route. A crawler that doesn't run
  JS only sees the shell's defaults, which is the one real cost of the SPA.
- **Build with `npm run build`.** Editing a file does nothing until you do; there is
  no watcher on the server.

**The wizard** is entirely client-side and persists answers to `localStorage`
(`aq-setup-v1`). Steps: modules → defaults → optional features → deploy → extension →
Shortcuts → summary. It generates a 32-byte API key with `crypto.getRandomValues`
(never transmitted), renders a paste-ready env block, builds the Vercel clone URL, and
prints Shortcut instructions filtered to only the modules that were enabled.

**Step gating**: `validate(step, state)` in `src/setup/model.js` is the single source
of truth. You cannot advance past a step with anything required left blank: at least
one module; the default folder/list/calendar for each enabled module; a valid base URL
and model id when AI is on; a valid `https://` backend URL on step 4. Errors appear on
the failed Continue and clear as you type. Going backwards is never gated. Verified
end to end with a jsdom harness.

**Em dashes**: the site is kept to at most one per page. New copy should follow that.

**nginx**: `/etc/nginx/sites-available/applequeue.erinskidds.com.conf`, symlinked into
`sites-enabled`. Root is `dist/`, `try_files $uri $uri/ /index.html` for client-side
routes, `no-cache` on `index.html`, one year immutable on the fingerprinted
`/assets/`. Reuses the `erinskidds.com` Let's Encrypt cert for the Cloudflare→origin
hop.

**Favicon**: the extension's own icon, copied from
`apple-notes-extension/icons/` into `public/` as `favicon-{16,48,128}.png` plus
`apple-touch-icon.png`.

### The backend template, `/var/www/applequeue.erinskidds.com/backend/`

Moved here from `~/projects/AppleQueue-Backend` and **initialized as its own git
repo** (one commit on `main`, `origin` already set to
`https://github.com/DudeThatsErin/AppleQueue-Backend.git`). It is git-ignored by the
site repo, so the two never entangle.

Next.js App Router, plain JS. Complete and building:

- `src/lib/` : `config.js` (every env var + the secret-free `publicConfig()`),
  `http.js` (JSON helpers, `requireAuth` failing closed with no key set, `readJson`,
  in-memory `rateLimit`), `store.js` (Upstash Redis REST when tokened, atomic
  write-then-rename JSON otherwise), `attachments.js` (Vercel Blob or filesystem,
  20 MB cap, MIME whitelist, traversal rejection), `items.js`, `routes.js`
- Routes: `api/health`, `api/config`, `api/{apple-notes,reminders,calendar}/{route,pending,ack}`,
  `api/apple-notes/upload`, `api/apple-notes/files/[name]`, `api/places/autocomplete`,
  `api/ai/parse`, plus an inert `src/app/page.js`
- `package.json`, `jsconfig.json` (the `@/*` alias every route depends on),
  `.env.example`, `.gitignore`, `vercel.json`, `README.md`, `LICENSE`
- `npm run build` is clean and `npm audit` reports **0 vulnerabilities** (next 16,
  react 19, `@vercel/blob` 2; the older pins carried postcss/undici advisories).
- Smoke-tested locally in filesystem mode: 401 without a key, health, config, queue
  POST/pending/ack for all three kinds, the invitee nudge reminder, upload plus
  attachment fetch, path-traversal rejection, and the 503s when AI and Places are off.

## Not done

1. **Publish the backend repo.** `gh` CLI is still not installed on this box. Create
   `DudeThatsErin/AppleQueue-Backend` (public), `git push -u origin main` from
   `backend/`, and mark it a **template repository** in the GitHub settings.
   - `TEMPLATE_REPO` in `src/config.js` already points there; change that one constant
     if the repo is named anything else.
2. **DNS.** `applequeue.erinskidds.com` has no record yet, so the public URL does not
   resolve. Add an orange-clouded A record for `applequeue` in Cloudflare pointing at
   this server (same as `fonts`). If you later switch it to SSL "Full (strict)" or
   grey-cloud it, add the name to the cert with certbot.
3. **Make the extension backend-agnostic.** It currently hardcodes
   `https://dashboard.erinskidds.com` in `background.js:38`, `popup.js:190`,
   `settings.js:2`, and `settings.html:52`, and `host_permissions` is scoped to that
   one host. Needs: first-run setup screen, a **Test connection** button hitting
   `/api/health`, reading `/api/config` to hide disabled modules, and
   `host_permissions` widened (or `optional_host_permissions` requested at runtime) so
   an arbitrary user backend is reachable. Remove the hardcoded key default entirely.
4. **Publish the extension** to the Chrome Web Store and Mozilla Add-ons. Once each
   listing is live, set `CHROME_STORE_URL` / `FIREFOX_ADDON_URL` in `src/config.js`
   and rebuild: step 5 automatically swaps to store buttons and hides the "load
   unpacked" instructions.
5. **Optional, deferred.** The dashboard's own Notes-backup feature (sqlite) and the
   `/api/ai/transform` actions were intentionally left out of the template; decide
   whether they belong in the public product at all.

## Notable decisions worth not re-litigating

- `/pending` is **non-destructive**: items come back until `/ack`. Protects a Shortcut
  that dies halfway; means a Shortcut missing its ack step duplicates forever.
  Documented prominently in both `/docs` and the wizard.
- **Vercel's clone URL cannot prefill env *values***, only which vars to prompt for. So
  the wizard hands over a copy-paste `.env` block (Vercel's env field accepts a pasted
  block and splits it) rather than pretending to prefill.
- Attachment URLs are **capability URLs**: unguessable, unauthenticated, because a
  Shortcut fetching one mid-run can't reliably attach a header. Called out as a caveat
  in the security section rather than papered over.
- Boolean env vars are true unless the value is literally `false`, matching the
  existing dashboard convention.
- `/api/config` requires the key like everything else. The extension reads it *after*
  the user has entered their credentials, so nothing needs it to be public.
- An SPA fallback answers unknown paths with `200` and the in-app 404 page. That is
  the standard trade for client-side routing and is not worth pre-rendering to fix.
