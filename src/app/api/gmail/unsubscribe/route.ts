import { withGmail } from "@/lib/api";
import {
  getMessagesWithParts,
  listMessageIds,
  parseUnsubscribeUrls,
} from "@/lib/gmail";
import { senderDisplay } from "@/lib/format";
import type { NextRequest } from "next/server";
import { z } from "zod";

export type Newsletter = {
  fromEmail: string;
  fromName: string;
  count: number;
  sampleSubject: string;
  unsubscribeHttp?: string;
  unsubscribeMailto?: string;
  oneClick: boolean;
  lastDate: number;
};

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const scanCap = Math.min(Number(sp.get("scan") ?? "300"), 1000);
  const q = sp.get("q") ?? "in:inbox category:promotions OR unsubscribe";

  return withGmail(async (gmail) => {
    const ids: string[] = [];
    let pageToken: string | undefined;
    while (ids.length < scanCap) {
      const page = await listMessageIds(
        gmail,
        q,
        Math.min(100, scanCap - ids.length),
        pageToken
      );
      ids.push(...page.ids);
      pageToken = page.nextPageToken;
      if (!pageToken) break;
    }
    const msgs = await getMessagesWithParts(gmail, ids);
    const map = new Map<string, Newsletter>();
    for (const m of msgs) {
      if (!m.listUnsubscribe) continue;
      const urls = parseUnsubscribeUrls(m.listUnsubscribe);
      const { name, email } = senderDisplay(m.from);
      const existing = map.get(email);
      const oneClick =
        m.listUnsubscribePost?.toLowerCase().includes("one-click") ?? false;
      if (existing) {
        existing.count += 1;
        if (m.date > existing.lastDate) existing.lastDate = m.date;
      } else {
        map.set(email, {
          fromEmail: email,
          fromName: name,
          count: 1,
          sampleSubject: m.subject,
          unsubscribeHttp: urls.http,
          unsubscribeMailto: urls.mailto,
          oneClick,
          lastDate: m.date,
        });
      }
    }
    const list = [...map.values()].sort((a, b) => b.count - a.count);
    return { newsletters: list };
  });
}

const ActBody = z.object({
  url: z.string().url(),
  oneClick: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = ActBody.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }
  const { url, oneClick } = parsed.data;
  try {
    const res = await fetch(url, {
      method: oneClick ? "POST" : "GET",
      headers: oneClick
        ? { "Content-Type": "application/x-www-form-urlencoded" }
        : undefined,
      body: oneClick ? "List-Unsubscribe=One-Click" : undefined,
      redirect: "follow",
    });
    return Response.json({ ok: res.ok, status: res.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "fetch_failed";
    return Response.json({ ok: false, error: message }, { status: 502 });
  }
}
