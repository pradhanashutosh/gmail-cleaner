<div align="center">

# 📬 Gmail Cleaner

**The Gmail cleanup app that doesn't want your firstborn — just your fork.**

Swipe-to-trash triage. Bulk unsubscribe. Sender grouping. Attachment hunter. Runs entirely on your laptop. Zero subscriptions, zero servers, zero data harvesting.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Auth.js](https://img.shields.io/badge/Auth.js-v5-green)](https://authjs.dev/)
[![Gmail API](https://img.shields.io/badge/Gmail%20API-googleapis-red?logo=gmail)](https://developers.google.com/gmail/api)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](#license)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#contributing)

[Quickstart](#-quickstart-5-steps-10-minutes) · [Features](#-features) · [Why?](#-why-does-this-exist) · [FAQ](#-faq) · [Roadmap](#-roadmap)

</div>

---

## 🧨 Why does this exist?

> I had 38,000 unread emails. The "inbox cleaner" apps in the App Store wanted **$14.99/month**, my **Gmail password**, and probably my **firstborn** — to run `DELETE FROM inbox WHERE sender = 'noreply'`.

So I built my own. In a weekend. It runs locally. Your emails never touch my (or anyone else's) servers. Source is small enough to read in one sitting.

| | Paid SaaS cleaners | **Gmail Cleaner** |
|---|---|---|
| **Price** | $9–15 / month, forever | **$0** |
| **Where your email goes** | Their servers | **Your laptop** |
| **Account access** | You give them OAuth (or worse, your password) | **You own the OAuth app** |
| **Data retention** | "We pinky promise to delete it" | **No storage. No DB.** |
| **Source code** | 🤷 | **MIT, ~1k LOC, audit it** |
| **Permanent delete** | "Pro tier" | **Trash-only by design** |
| **Bring your own Gmail** | ✅ | ✅ |
| **Bring your own conscience** | ❌ | ✅ |

---

## ✨ Features

### 🃏 Swipe Triage
Tinder, but for email. **Left = trash. Right = keep.** Arrow keys too if your trackpad is broken. Bulk actions queued and committed in one Gmail API round-trip.

### 📊 By Sender
Group your inbox by sender. See **counts + total storage** per sender. Nuke the entire LinkedIn notification dynasty in one click.

### 🚪 One-Click Unsubscribe
Reads RFC 8058 `List-Unsubscribe` and `List-Unsubscribe-Post` headers. **POSTs the unsubscribe URL** where supported — no opening 14 tabs. Optionally trash everything else from that sender as a parting gift.

### 📎 Attachment Hunter
Find files ≥ **1 / 2 / 5 / 10 / 25 MB**, sorted biggest first. The 80MB PDF your aunt forwarded in 2017? It's still in there. Now you can find it.

### 🔒 Privacy by design
- **No server. No database. No analytics.** Just your browser → Google → your Gmail.
- The OAuth client is **yours** — you create it in your own Google Cloud project (Step 3 below).
- Uses the narrowest practical Gmail scope (`gmail.modify`). Can't send mail. Can't permanently delete. Can't read attachment bodies.
- All destructive actions move to **Gmail Trash** (Gmail keeps trash 30 days — built-in undo).
- Read [`src/lib/gmail.ts`](src/lib/gmail.ts) — every Gmail API call this app makes lives in one file.

---

## 🎬 Screenshots

> Drop screenshots in `docs/screenshots/` and they'll render below. Suggested shots: triage swipe view, senders table, unsubscribe list, attachment finder.

| Triage | Senders | Unsubscribe | Attachments |
|--------|---------|-------------|-------------|
| _coming soon_ | _coming soon_ | _coming soon_ | _coming soon_ |

---

## 🛠️ Tech Stack

- **[Next.js 16](https://nextjs.org/)** App Router + Turbopack
- **TypeScript** (strict)
- **[Tailwind CSS v4](https://tailwindcss.com/)**
- **[Auth.js v5](https://authjs.dev/)** (NextAuth) — Google OAuth + encrypted JWT sessions
- **[googleapis](https://www.npmjs.com/package/googleapis)** — official Google Node SDK
- **[framer-motion](https://www.framer.com/motion/)** — swipe gestures
- **[zod](https://zod.dev/)** — runtime input validation
- **[lucide-react](https://lucide.dev/)** — icons

Total bundle: small. Total external services: just Google.

---

## 📋 Prerequisites

Install these first if you don't have them:

| Tool | Why | Check |
|------|-----|-------|
| **Node.js 20+** | Runs Next.js | `node -v` |
| **npm** (or pnpm/yarn) | Installs deps | `npm -v` |
| **git** | Clone repo | `git --version` |
| **A Google account** | The Gmail account you want to clean | — |

> 🍎 macOS: `brew install node git` · 🪟 Windows: [nodejs.org](https://nodejs.org/), [git-scm.com](https://git-scm.com/) · 🐧 Linux: your package manager.

---

## 🚀 Quickstart (5 steps, ~10 minutes)

### Step 1 — Fork or clone

**Option A: Fork** (recommended if you want your edits in your own GitHub):

1. Click **Fork** at the top of [this repo](https://github.com/pradhanashutosh/gmail-cleaner).
2. Clone your fork:
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

~30 seconds the first time.

### Step 3 — Create your own Google OAuth credentials

You need a Google OAuth Client ID + Secret so the app can ask **your** Google account for permission. These are **personal** — never share, never commit.

1. **Open Google Cloud Console** → <https://console.cloud.google.com/>

2. **Create a project** (top-left selector → **New Project**):
   - Name: anything, e.g. `Gmail Cleaner (personal)`.
   - Click **Create**, then make sure that project is selected.

3. **Enable the Gmail API**:
   - **APIs & Services → Library** → search **Gmail API** → **Enable**.

4. **Configure the OAuth consent screen**:
   - **APIs & Services → OAuth consent screen**.
   - **User type**: **External** → Create.
   - Fill the minimum required fields:
     - **App name**: `Gmail Cleaner (local)` (only you will see it).
     - **User support email**: ✏️ **your own Gmail address**.
     - **Developer contact email**: ✏️ **your own Gmail address**.
   - Save and continue through Scopes (nothing to add — the app requests `gmail.modify` at runtime).
   - On the **Test users** screen → **+ Add Users** → ✏️ **enter the Gmail address(es) you want to clean**. Add multiple if needed.
   - Save. **Leave the app in Testing mode** — that's correct for personal local use. No Google verification needed.

5. **Create OAuth credentials**:
   - **APIs & Services → Credentials → + Create Credentials → OAuth client ID**.
   - **Application type**: **Web application**.
   - **Name**: `Gmail Cleaner local`.
   - **Authorized redirect URIs** → **+ Add URI**:
     ```
     http://localhost:3000/api/auth/callback/google
     ```
   - Click **Create**.
   - A dialog shows your **Client ID** and **Client secret**. Keep this tab open — you'll paste them in Step 4.

### Step 4 — Configure your environment

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in three values:

```bash
# Generate a random session secret:
#   macOS/Linux:      openssl rand -base64 32
#   Windows (PWSH):   [Convert]::ToBase64String((1..32 | %{ Get-Random -Maximum 256 }))
AUTH_SECRET=PASTE_THE_RANDOM_STRING_HERE

# From the Google Cloud Console dialog (Step 3.5):
AUTH_GOOGLE_ID=PASTE_YOUR_CLIENT_ID_HERE
AUTH_GOOGLE_SECRET=PASTE_YOUR_CLIENT_SECRET_HERE

# Leave as-is for local dev:
NEXTAUTH_URL=http://localhost:3000
```

> ⚠️ **Never commit `.env.local`.** It's already in `.gitignore`. Treat it like a password.

### Step 5 — Run

```bash
npm run dev
```

Open <http://localhost:3000>.

1. Click **Sign in with Google**.
2. Pick the Gmail account you added as a **Test user** in Step 3.
3. Google warns *"Google hasn't verified this app"* — expected (your app is in Testing mode). Click **Continue** → **Continue**.
4. Approve the `gmail.modify` permission.
5. You're in. Start with **Triage**, **Senders**, **Unsubscribe**, or **Attachments**.

Done. 🎉

---

## 💡 Daily use

Just run `npm run dev` from the project folder. Sign-in persists in a cookie — you usually won't re-authenticate.

To **sign out**: clear cookies for `localhost:3000` (or use the sign-out link in the nav).

**Tip**: alias it in your shell —
```bash
alias mail-clean='cd ~/gmail-cleaner && npm run dev'
```

---

## 🩹 Troubleshooting

| Symptom | Fix |
|---------|-----|
| `redirect_uri_mismatch` on Google sign-in | The redirect URI in Google Cloud Console must be **exactly** `http://localhost:3000/api/auth/callback/google` — no trailing slash, no `https`. |
| "Access blocked: Gmail Cleaner has not completed the Google verification process" | You forgot to add your Gmail as a **Test user** (Step 3.4). Add it and try again. |
| "Error 403: access_denied" | Either the Gmail API isn't enabled (Step 3.3) or your Gmail isn't in the test users list. |
| `AUTH_SECRET` errors | `AUTH_SECRET` missing or too short. Re-run `openssl rand -base64 32` and paste the full output. |
| `EADDRINUSE: port 3000` | `lsof -ti :3000 \| xargs kill -9` (macOS/Linux) or `PORT=3001 npm run dev`. |
| Session weirdness / auth loops | Delete the cookie for `localhost:3000` and sign in again. |
| Token refresh failing repeatedly | Sign out and back in once — refresh token may have been revoked from Google Account → Security → Third-party apps. |
| Rate limit (429) | Gmail API has per-user quotas. Slow down or wait a minute. Bulk operations already batch — this is rare. |

---

## 🏗️ How it works

```
┌──────────────────┐      ┌─────────────────┐      ┌──────────────┐
│  Your browser    │◄────►│  Next.js (you)  │◄────►│  Gmail API   │
│  (cookie holds   │      │   localhost     │      │   (Google)   │
│   encrypted JWT) │      │                 │      │              │
└──────────────────┘      └─────────────────┘      └──────────────┘
        ↑                          ↑
        │                          │
   You + UI                  src/lib/gmail.ts
                            (every API call)
```

- **Auth** (`src/auth.ts`): Auth.js v5 handles OAuth dance. Access + refresh tokens encrypted in JWT cookie. Refresh handled in `jwt` callback.
- **Gmail client** (`src/lib/gmail.ts`): wraps the `googleapis` SDK. Bulk ops use `users.messages.batchModify` — trashing 1,000 messages is **one** round-trip.
- **API routes** (`src/app/api/gmail/*`): guarded by the `withGmail` session helper, return JSON.
- **UI**: React + framer-motion. Optimistic updates so triage feels instant.

Read `src/lib/gmail.ts` to audit every Gmail API call.

---

## 📁 Project layout

```
src/
  auth.ts                    # NextAuth: providers, callbacks, token refresh
  app/
    page.tsx                 # Landing / sign-in
    triage/                  # Swipe-to-trash UI
    senders/                 # Group-by-sender view
    unsubscribe/             # Unsubscribe list
    attachments/             # Large-attachment finder
    api/auth/[...nextauth]/  # NextAuth route handler
    api/gmail/*              # Gmail API wrappers (server-side only)
  components/                # nav, card
  lib/
    gmail.ts                 # All Gmail API calls (audit this)
    api.ts                   # withGmail helper
    cn.ts                    # classnames util
    format.ts                # date/size formatters
```

---

## 🔐 Security & privacy deep-dive

| Concern | Answer |
|---------|--------|
| Where does my email content live? | **Nowhere persistent.** Pages render server-side from the Gmail API and stream to your browser. No DB. No disk writes of message content. |
| Where do my OAuth tokens live? | In an **HTTP-only, signed JWT cookie** in your browser. Auth.js encrypts using your `AUTH_SECRET`. |
| Who can see my Gmail? | **Only you and Google.** The OAuth app you created in Step 3 is owned by your Google account. |
| What scopes does it request? | `https://www.googleapis.com/auth/gmail.modify` — read, label, move to trash. **Cannot** send. **Cannot** permanently delete. **Cannot** read attachment bytes. |
| Can it accidentally nuke my inbox? | Destructive actions hit Gmail Trash. Gmail keeps trash 30 days. Empty Trash is **not** wired up (intentional). |
| Can I revoke access? | Yes — <https://myaccount.google.com/permissions> → revoke the OAuth client you created. Takes effect within minutes. |

---

## ❓ FAQ

<details>
<summary><b>Will this delete my emails forever?</b></summary>

No. Everything goes to Gmail **Trash**, which Gmail keeps for **30 days** before purging. You have a month to undo.
</details>

<details>
<summary><b>Why not use the official Gmail filters?</b></summary>

You absolutely should, for **future** mail. This app is for the **38,000 emails already sitting there**. Gmail's web UI is great for one-by-one but tedious for bulk.
</details>

<details>
<summary><b>Is this safe to use with my work Gmail?</b></summary>

Probably check with your IT/security team first — most corp Google Workspaces disable third-party OAuth or require admin approval. If your org allows it, the app is read-modify-trash and runs locally.
</details>

<details>
<summary><b>Can I host this so my mom can use it too?</b></summary>

You'd need to move the OAuth consent screen to **Production**, which requires Google verification for the `gmail.modify` scope (non-trivial). Easier path: have your mom run it locally on her machine, same as you. Two installs, two OAuth clients, total isolation.
</details>

<details>
<summary><b>Does it work with Outlook / Yahoo / iCloud Mail?</b></summary>

Not yet. The Gmail API is Gmail-specific. PRs welcome for IMAP support.
</details>

<details>
<summary><b>Why Next.js and not a CLI?</b></summary>

Because swiping cards on the command line isn't fun. Also: Auth.js handles the OAuth refresh-token rotation, which I didn't want to write from scratch.
</details>

<details>
<summary><b>How big is the codebase?</b></summary>

~1,000 lines of TypeScript across UI + API. You can read every Gmail API call in `src/lib/gmail.ts` in five minutes.
</details>

<details>
<summary><b>Why "Testing" mode in Google Cloud — won't it expire?</b></summary>

Google warns test-mode refresh tokens expire after 7 days. In practice, this app refreshes the access token on every API call, and you'll re-sign-in occasionally. Fine for personal use.
</details>

---

## 🌐 Hosting it for others (optional)

This is designed for local, single-user use — you authorize your own OAuth client against your own Gmail. If you really want to host it:

- Move OAuth consent screen → **Production**. Google requires app verification for `gmail.modify` (non-trivial; expect a security review).
- Set `NEXTAUTH_URL` to your real domain.
- Add a matching production redirect URI in the OAuth client.
- Deploy to Vercel / Fly / your platform of choice. Stateless aside from session cookies.

For most people: **just keep it local.**

---

## 🗺️ Roadmap

- [ ] Undo (un-trash) in triage
- [ ] Saved searches and filters
- [ ] Auto-rules: "always trash from X"
- [ ] Empty Trash one-click (with a very loud "are you sure?" dialog)
- [ ] Storage quota readout from Drive (Gmail shares the 15 GB pool)
- [ ] IMAP support (Outlook / Yahoo / iCloud / generic)
- [ ] Keyboard-only mode for power users
- [ ] Dark mode (currently follows system)

---

## 🤝 Contributing

PRs welcome. Issues welcome. "Why is this stupid?" comments welcome.

1. Fork.
2. `git checkout -b feature/your-thing`.
3. Make it work. `npm run lint` should pass.
4. Open a PR with a screenshot/GIF if it's a UI change.

No CLA. No bureaucracy. Just code.

---

## 📜 License

[MIT](LICENSE). Fork it, change it, ship it. Attribution appreciated, not required.

---

## 🙏 Credits

- The Gmail team for shipping an API that lets a weekend project replace a $14.99/month SaaS.
- Auth.js maintainers for making OAuth refresh-token rotation not be my problem.
- Whoever invented Tinder for inventing swipe gestures.
- The 38,000 unread emails for the motivation.

---

<div align="center">

**Built because $14.99/month to delete emails felt insulting.**

If this saved you a subscription, [⭐ the repo](https://github.com/pradhanashutosh/gmail-cleaner/stargazers).
If it didn't, [file an issue](https://github.com/pradhanashutosh/gmail-cleaner/issues) and tell me why.

</div>
