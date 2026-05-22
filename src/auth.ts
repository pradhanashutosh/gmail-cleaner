import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";

const GMAIL_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.modify",
].join(" ");

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    error?: "RefreshAccessTokenError";
    user: DefaultSession["user"];
  }
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    error?: "RefreshAccessTokenError";
  }
}

async function refreshAccessToken(refreshToken: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.AUTH_GOOGLE_ID!,
      client_secret: process.env.AUTH_GOOGLE_SECRET!,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) throw new Error("refresh_failed");
  return (await res.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  };
}

type TokenShape = {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  error?: "RefreshAccessTokenError";
  [k: string]: unknown;
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          scope: GMAIL_SCOPES,
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      const t = token as TokenShape;
      if (account) {
        t.accessToken = account.access_token ?? undefined;
        t.refreshToken = account.refresh_token ?? undefined;
        t.expiresAt = account.expires_at
          ? Number(account.expires_at) * 1000
          : Date.now() + 3600 * 1000;
        return t;
      }
      if (t.expiresAt && Date.now() < t.expiresAt - 60_000) {
        return t;
      }
      if (!t.refreshToken) return t;
      try {
        const refreshed = await refreshAccessToken(t.refreshToken);
        t.accessToken = refreshed.access_token;
        t.expiresAt = Date.now() + refreshed.expires_in * 1000;
        if (refreshed.refresh_token) t.refreshToken = refreshed.refresh_token;
        t.error = undefined;
      } catch {
        t.error = "RefreshAccessTokenError";
      }
      return t;
    },
    async session({ session, token }) {
      const t = token as TokenShape;
      session.accessToken = t.accessToken;
      session.error = t.error;
      return session;
    },
  },
  pages: { signIn: "/" },
  trustHost: true,
});

export const { GET, POST } = handlers;
