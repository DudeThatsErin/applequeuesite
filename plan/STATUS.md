# Apple Queue public release — build status

Last updated: 2026-08-27. Stopped mid-build at the user's request.

---

## ⚠️ Do this first, before anything ships

**Rotate `APPLE_NOTES_API_KEY` on dashboard.erinskidds.com.**
`/home/ubuntu/projects/apple-notes-extension/background.js:38-40` hardcodes a live
dashboard API key as the default value for `apiKey`, and that repo is public on GitHub
(`github.com/DudeThatsErin/AppleQueue`). Treat the current key as compromised. The
bring-your-own-backend model fixes the design; rotating fixes the existing exposure.

---

## Done

### The public site — live on the origin, `/var/www/applequeue.erinskidds.com/`

| Path | File | What it is |
|---|---|---|
| `/` | `index.html` | Landing page: what it is, how the queue/Shortcut round trip works, modules, why self-deploy, hosted vs self-hosted, free-tier caveat, FAQ |
| `/setup/` | `setup/index.html` + `setup/wizard.js` | The 6-step wizard (see below) |
| `/docs/` | `docs/index.html` | Reference: data model, full HTTP API table, every env var, storage, security model, self-hosting, troubleshooting |
| `/plan/` | `plan/index.html` | The original planning document, kept for reference |
| — | `assets/site.css`, `assets/site.js` | Shared styles (dark/light), theme toggle, copy-to-clipboard |

All pages verified `200` over the local HTTPS hop; `/nope` correctly `404`s.

**The wizard** is entirely client-side and persists answers to `localStorage`
(`aq-setup-v1`), so a trip to Vercel and back doesn't lose them. Steps: modules →
defaults → optional features → deploy → extension → Shortcuts → summary. It generates
a 32-byte API key with `crypto.getRandomValues` (never transmitted), renders a
paste-ready env block, builds the Vercel clone URL, and prints Shortcut instructions
filtered to only the modules that were enabled.

**nginx**: `/etc/nginx/sites-available/applequeue.erinskidds.com.conf`, symlinked into
`sites-enabled`. Static root, HTTP→HTTPS redirect, `try_files $uri $uri/ $uri.html`,
`no-cache` on HTML and a 1-hour window on `/assets/` (they aren't fingerprinted).
Reuses the `erinskidds.com` Let's Encrypt cert for the Cloudflare→origin hop.

### PICK UP HERE: The backend template — partial, `/home/ubuntu/projects/AppleQueue-Backend/`

**IMPORTANT: Move the backend to this site, the backend and frontend should all live at applequeue.erinskidds.com**

Next.js App Router, plain JS (no TypeScript, to keep the template's dependency
surface small). Written so far:

- `src/lib/config.js` — every env var, plus `publicConfig()` (the secret-free shape `/api/config` returns)
- `src/lib/http.js` — JSON helpers, `requireAuth` (fails closed with no key set), `readJson`, best-effort in-memory `rateLimit`
- `src/lib/store.js` — queue persistence; Upstash Redis REST when `KV_REST_API_URL`/`TOKEN` exist, atomic write-then-rename JSON file otherwise
- `src/lib/attachments.js` — Vercel Blob when tokened, filesystem otherwise; 20 MB cap, MIME whitelist, display-name vs storage-identifier split, traversal rejection
- `src/lib/items.js` — request body → validated queue item for all three kinds, plus the invitee nudge reminder
- `src/lib/routes.js` — one factory generating POST/GET/DELETE, `/pending`, and `/ack` for all three queues
- Routes: `api/health`, `api/config`, `api/{apple-notes,reminders,calendar}/{route,pending,ack}`, `api/apple-notes/upload`, `api/apple-notes/files/[name]`, `api/places/autocomplete`, `api/ai/parse`

## Not done at all

1. **Finish the template repo.** Still missing, and it will not build without these:
   - `package.json` (next, react, react-dom, `@vercel/blob`; `@upstash/redis` is *not*
     needed — `store.js` talks to the Upstash REST API with `fetch`)
   - `jsconfig.json` with the `@/*` → `src/*` path alias — **every route file imports
     via `@/lib/...`, so nothing resolves until this exists**
   - `src/app/layout.js` + a minimal `src/app/page.js` (a landing page that links back
     to applequeue.erinskidds.com and shows nothing sensitive)
   - `.env.example`, `.gitignore`, `README.md`, `LICENSE`, `vercel.json`
   - `npm install && npm run build` to prove it compiles, and a smoke test of each
     route locally in filesystem mode
2. **Publish it.** `gh` CLI is not installed on this box, so the repo could not be
   created or pushed. Create `DudeThatsErin/AppleQueue-Backend` (public), push, and mark
   it a **template repository** in the GitHub settings.
   - The wizard already points at `https://github.com/DudeThatsErin/AppleQueue-Backend`
     via `TEMPLATE_REPO` at the top of `setup/wizard.js` — change that one constant if
     the repo is named anything else.
3. **DNS.** `applequeue.erinskidds.com` has no record yet, so the public URL does not
   resolve. Add an orange-clouded A record for `applequeue` in Cloudflare pointing at
   this server (same as `fonts`). If you later switch it to SSL "Full (strict)" or
   grey-cloud it, add the name to the cert with certbot.
4. **Make the extension backend-agnostic.** It currently hardcodes
   `https://dashboard.erinskidds.com` in `background.js:38`, `popup.js:190`,
   `settings.js:2`, and `settings.html:52`, and `host_permissions` is scoped to that one
   host. Needs: first-run setup screen, a **Test connection** button hitting
   `/api/health`, reading `/api/config` to hide disabled modules, and
   `host_permissions` widened (or `optional_host_permissions` requested at runtime) so
   an arbitrary user backend is reachable. Remove the hardcoded key default entirely.
5. **Publish the extension** to the Chrome Web Store and Mozilla Add-ons. Once each
   listing is live, set `CHROME_STORE_URL` / `FIREFOX_ADDON_URL` at the top of
   `setup/wizard.js` — step 5 automatically swaps to store buttons and hides the
   "load unpacked" instructions.
6. **Optional, deferred.** The dashboard's own Notes-backup feature (sqlite) and the
   `/api/ai/transform` actions were intentionally left out of the template; decide
   whether they belong in the public product at all.

## Notable decisions worth not re-litigating

- `/pending` is **non-destructive** — items come back until `/ack`. Protects a Shortcut
  that dies halfway; means a Shortcut missing its ack step duplicates forever. Documented
  prominently in both `/docs/` and the wizard.
- **Vercel's clone URL cannot prefill env *values*** — only which vars to prompt for. So
  the wizard hands over a copy-paste `.env` block (Vercel's env field accepts a pasted
  block and splits it) rather than pretending to prefill.
- Attachment URLs are **capability URLs**: unguessable, unauthenticated, because a
  Shortcut fetching one mid-run can't reliably attach a header. Called out as a caveat in
  the security section rather than papered over.
- Boolean env vars are true unless the value is literally `false`, matching the existing
  dashboard convention.
