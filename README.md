# Gmail Cleaner

Clean up your Gmail inbox the fast way. Swipe-to-trash triage, sender grouping, one-click unsubscribe (RFC 8058), and large-attachment finder — all running locally on your machine. Inspired by storage-cleaner apps like Cleaner Guru, but for your inbox.

Built with Next.js 16 (App Router), TypeScript, Tailwind, Auth.js, and the Gmail API.

## Features

- **Swipe triage** — Tinder-style cards. Left = trash, right = keep. Arrow-key support.
- **By sender** — Group inbox by sender, see counts + size, bulk-trash noisy senders.
- **Unsubscribe** — Detects `List-Unsubscribe` and `List-Unsubscribe-Post` headers. One-click POST where supported, then optionally trash everything else from that sender.
- **Large attachments** — Finds files ≥ 1/2/5/10/25 MB, sorted biggest first.

All destructive actions move messages to **Gmail Trash** (30-day undo via Gmail).

## Privacy & security

- **Runs locally.** No server. No database. No email content stored on disk.
- Your Google access token lives only in an HTTP-only session cookie in your browser.
- The app uses the narrowest practical scope (`gmail.modify`). It never sends, never reads attachment bodies, never permanently deletes — trash only.
- Source is small and auditable. Read `src/lib/gmail.ts` to see every Gmail API call.

## Setup

### 1. Get Google OAuth credentials

1. Open <https://console.cloud.google.com/>. Create a new project (or reuse one).
2. **APIs & Services → Library** → enable **Gmail API**.
3. **APIs & Services → OAuth consent screen**:
   - User type: **External**.
   - App name: "Gmail Cleaner (local)" — anything is fine.
   - Add yourself as a **test user** while the app stays in *Testing* mode. Test mode is the right setting for a personal local tool — no verification needed.
   - Add scope: `https://www.googleapis.com/auth/gmail.modify`.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**.
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   - Copy the **Client ID** and **Client secret**.

### 2. Configure env

```bash
cp .env.local.example .env.local
```

Fill `.env.local`:

```bash
AUTH_SECRET=$(openssl rand -base64 32)   # paste the output
AUTH_GOOGLE_ID=...                       # OAuth client ID
AUTH_GOOGLE_SECRET=...                   # OAuth client secret
NEXTAUTH_URL=http://localhost:3000
```

### 3. Run

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. Sign in with the Google account that's in your test users list. Done.

## How it works

- **Auth**: Auth.js (NextAuth v5) handles the OAuth dance. Tokens (access + refresh) live in an encrypted JWT cookie. The session callback exposes `accessToken` to server routes. Refresh-token rotation handled in the `jwt` callback.
- **Gmail client**: `src/lib/gmail.ts` wraps the `googleapis` SDK. Bulk operations use `users.messages.batchModify` so trashing 1000 messages is one round-trip.
- **API routes** live under `src/app/api/gmail/*`. The `withGmail` helper guards them with the session and returns JSON.
- **UI** is plain React + framer-motion for swipe gestures.

## Production

This is designed to run locally — you're the only user, you authorize your own OAuth client. If you want to host it for others:

- Move app to **Production** in the OAuth consent screen (Google may require verification for the `gmail.modify` scope).
- Set a real `NEXTAUTH_URL` and the corresponding redirect URI.
- Deploy to Vercel / Fly / your platform of choice. The app is stateless aside from session cookies.

## Roadmap

- [ ] Undo button (un-trash) in triage
- [ ] Saved searches and filters
- [ ] Auto-rules: "always trash from X"
- [ ] Empty Trash one-click
- [ ] Storage quota readout from Drive (Gmail shares the 15GB pool)

## License

MIT
