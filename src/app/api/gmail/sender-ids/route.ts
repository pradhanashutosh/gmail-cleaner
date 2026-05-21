import { withGmail } from "@/lib/api";
import { listMessageIds } from "@/lib/gmail";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const email = sp.get("email");
  if (!email) {
    return Response.json({ error: "missing_email" }, { status: 400 });
  }
  const cap = Math.min(Number(sp.get("cap") ?? "2000"), 10000);
  const q = `from:${email}`;
  return withGmail(async (gmail) => {
    const ids: string[] = [];
    let pageToken: string | undefined;
    while (ids.length < cap) {
      const need = Math.min(500, cap - ids.length);
      const page = await listMessageIds(gmail, q, need, pageToken);
      ids.push(...page.ids);
      pageToken = page.nextPageToken;
      if (!pageToken) break;
    }
    return { ids };
  });
}
