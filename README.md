# Gmail Cleaner

Clean your Gmail inbox fast. Swipe-to-trash triage, sender grouping, one-click unsubscribe (RFC 8058), and large-attachment finder — all running **locally** on your own machine.

Built with Next.js 16 (App Router), TypeScript, Tailwind, Auth.js v5, and the Gmail API.

> **Runs locally. No server. No database. No email content stored on disk.** Your Google access token lives only in an HTTP-only session cookie in your browser. Uses the narrowest practical Gmail scope (`gmail.modify`). Never sends mail. Never permanently deletes — trash only (Gmail keeps trash 30 days).

---

## Features

- **Swipe triage** — Tinder-style cards. Left = trash, right = keep. Arrow keys work too.
- **By sender** — Group inbox by sender, see counts + total size, bulk-trash noisy senders in one click.
- **Unsubscribe** — Detects `List-Unsubscribe` headers. One-click POST where supported, optional trash everything else from that sender.
- **Large attachments** — Find files ≥ 1 / 2 / 5 / 10 / 25 MB, sorted biggest first.

---

## Prerequisites

Install these first if you don't have them:

| Tool | Why | Check |
|------|-----|-------|
| **Node.js 20+** | Runs Next.js | `node -v` |
| **npm** (or pnpm/yarn) | Installs deps | `npm -v` |
| **git** | Clone repo | `git --version` |
| **A Google account** | The Gmail account you want to clean | — |

> macOS install: `brew install node git` &nbsp;•&nbsp; Windows: [nodejs.org](https://nodejs.org/), [git-scm.com](https://git-scm.com/) &nbsp;•&nbsp; Linux: use your package manager.

---

## Quickstart (5 steps, ~10 minutes)

### Step 1 — Fork or clone

**Option A: Fork** (recommended if you want to keep your edits in your own GitHub):

1. Click **Fork** at the top of [this repo](https://github.com/pradhanashutosh/gmail-cleaner).
2. Then clone your fork:
   ```bash
   git clone https://github.com/<YOUR-GITHUB-USERNAME>/gmail-cleaner.git
   cd gmail-cleaner
   ```

**Option B: Plain clone** (no GitHub account needed):

```bash
git clone https://github.com/pradhanashutosh/gmail-cleaner.git
cd gmail-cleaner
```

### Step 2 — Install dependencies

```bash
npm install
```

Takes ~30 seconds the first time.

### Step 3 — Create your own Google OAuth credentials

You need a Google OAuth Client ID + Secret so the app can ask **your** Google account for permission. These are **personal** — do not share or commit them.

1. **Open the Google Cloud Console**: <https://console.cloud.google.com/>

2. **Create a project** (top-left project selector → **New Project**):
   - Name it anything, e.g. `Gmail Cleaner (personal)`.
   - Click **Create**, then make sure that project is selected.

3. **Enable the Gmail API**:
   - Go to **APIs & Services → Library**.
   - Search for **Gmail API** → click it → click **Enable**.

4. **Configure the OAuth consent screen**:
   - Go to **APIs & Services → OAuth consent screen**.
   - **User type**: choose **External** → Create.
   - Fill the minimum required fields:
     - **App name**: `Gmail Cleaner (local)` (anything is fine — only you will see it).
     - **User support email**: **enter your own Gmail address.**
     - **Developer contact email**: **enter your own Gmail address** again.
   - Save and continue through the Scopes screen (no scopes need to be added here — the app requests `gmail.modify` at runtime).
   - On the **Test users** screen, click **+ Add Users** and **enter the Gmail address(es) you want to clean**. This is the email account this app will sign you into. You can add multiple if you have several Gmail accounts.
   - Save. Leave the app in **Testing** mode — that's the right setting for personal local use, and it means no Google verification is needed.

5. **Create OAuth credentials**:
   - Go to **APIs & Services → Credentials → + Create Credentials → OAuth client ID**.
   - **Application type**: **Web application**.
   - **Name**: `Gmail Cleaner local`.
   - **Authorized redirect URIs** → **+ Add URI**:
     ```
     http://localhost:3000/api/auth/callback/google
     ```
   - Click **Create**.
   - A dialog shows your **Client ID** and **Client secret**. Keep this tab open — you'll paste these in the next step.

### Step 4 — Configure your environment

Copy the example env file:

```bash
cp .env.local.example .env.local
```

Open `.env.local` in your editor and fill in three values:

```bash
# Generate a random session secret. macOS/Linux:
#   openssl rand -base64 32
# Windows PowerShell:
#   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
AUTH_SECRET=PASTE_THE_RANDOM_STRING_HERE

# From the Google Cloud Console dialog you just saw:
AUTH_GOOGLE_ID=PASTE_YOUR_CLIENT_ID_HERE
AUTH_GOOGLE_SECRET=PASTE_YOUR_CLIENT_SECRET_HERE

# Leave this as-is for local development:
NEXTAUTH_URL=http://localhost:3000
```

> ⚠️ **Never commit `.env.local`.** It is already in `.gitignore`. Treat the secret like a password.

### Step 5 — Run

```bash
npm run dev
```

Open <http://localhost:3000>.

1. Click **Sign in with Google**.
2. Pick the Gmail account you added as a **test user** in Step 3.
3. Google will warn "Google hasn't verified this app" — that's expected because your app is in Testing mode. Click **Continue** → **Continue**.
4. Approve the `gmail.modify` permission.
5. You're in. Start with **Triage**, **Senders**, **Unsubscribe**, or **Attachments**.

Done. 🎉

---

## Daily use

Just run `npm run dev` from the project folder. Sign-in persists in a cookie, so you usually won't need to re-authenticate.

To **sign out**, clear cookies for `localhost:3000` (or use the sign-out link in the nav).

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `redirect_uri_mismatch` on Google sign-in | The redirect URI in Google Cloud Console must be **exactly** `http://localhost:3000/api/auth/callback/google` (no trailing slash, no `https`). |
| "Access blocked: Gmail Cleaner has not completed the Google verification process" | You forgot to add your Gmail address as a **Test user** in Step 3. Add it and try again. |
| "Error 403: access_denied" | Either the Gmail API is not enabled (Step 3.3) or your Gmail is not in the test users list. |
| `AUTH_SECRET` errors | You didn't set `AUTH_SECRET` in `.env.local`, or you set it to a short/empty value. Re-run `openssl rand -base64 32` and paste the full output. |
| Port 3000 already in use | `lsof -ti :3000 \| xargs kill -9` (macOS/Linux) or use `PORT=3001 npm run dev`. |
| Session won't refresh / weird auth loops | Delete the cookie for `localhost:3000` and sign in again. |

---

## How it works

- **Auth**: Auth.js (NextAuth v5) handles the OAuth dance. Access + refresh tokens live in an encrypted JWT cookie. Token refresh is handled in the `jwt` callback.
- **Gmail client**: `src/lib/gmail.ts` wraps the `googleapis` SDK. Bulk operations use `users.messages.batchModify` — trashing 1000 messages is one round-trip.
- **API routes** live under `src/app/api/gmail/*`. The `withGmail` helper guards them with the session and returns JSON.
- **UI** is React + framer-motion for swipe gestures.

Read `src/lib/gmail.ts` to audit every Gmail API call the app makes.

---

## Project layout

```
src/
  auth.ts                    # NextAuth config: providers, callbacks, token refresh
  app/
    page.tsx                 # Landing / sign-in
    triage/                  # Swipe triage UI
    senders/                 # Group-by-sender view
    unsubscribe/             # Unsubscribe list
    attachments/             # Large-attachment finder
    api/auth/[...nextauth]/  # NextAuth route handler
    api/gmail/*              # Gmail API wrappers (server-side only)
  components/                # nav, card
  lib/
    gmail.ts                 # All Gmail API calls
    api.ts                   # withGmail helper
    cn.ts                    # classnames util
    format.ts                # date/size formatters
```

---

## Hosting it for others (optional)

This project is designed for local, single-user use — you authorize your own OAuth client against your own Gmail. If you want to host it for other people:

- Move the OAuth consent screen to **Production**. Google will require app verification for the `gmail.modify` scope, which is a non-trivial process.
- Set `NEXTAUTH_URL` to your real domain.
- Add a matching production redirect URI in the OAuth client.
- Deploy to Vercel / Fly / your platform of choice. The app is stateless apart from session cookies.

For most people: just keep it local.

---

## Roadmap

- [ ] Undo (un-trash) in triage
- [ ] Saved searches and filters
- [ ] Auto-rules: "always trash from X"
- [ ] Empty Trash one-click
- [ ] Storage quota readout from Drive (Gmail shares the 15 GB pool)

---

## License

MIT. Fork it, change it, ship it.
