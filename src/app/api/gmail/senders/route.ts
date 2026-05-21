import { withGmail } from "@/lib/api";
import {
  getMessagesMetadata,
  listMessageIds,
  type MessageLite,
} from "@/lib/gmail";
import { senderDisplay } from "@/lib/format";
import type { NextRequest } from "next/server";

export type SenderGroup = {
  email: string;
  name: string;
  count: number;
  totalBytes: number;
  unread: number;
  lastDate: number;
  sampleIds: string[];
};

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q") ?? "in:inbox";
  const scanCap = Math.min(Number(sp.get("scan") ?? "500"), 2000);

  return withGmail(async (gmail) => {
    const all: MessageLite[] = [];
    let pageToken: string | undefined;
    while (all.length < scanCap) {
      const need = Math.min(100, scanCap - all.length);
      const page = await listMessageIds(gmail, q, need, pageToken);
      if (page.ids.length === 0) break;
      const meta = await getMessagesMetadata(gmail, page.ids);
      all.push(...meta);
      pageToken = page.nextPageToken;
      if (!pageToken) break;
    }

    const groups = new Map<string, SenderGroup>();
    for (const m of all) {
      const { name, email } = senderDisplay(m.from);
      const g = groups.get(email) ?? {
        email,
        name,
        count: 0,
        totalBytes: 0,
        unread: 0,
        lastDate: 0,
        sampleIds: [],
      };
      g.count += 1;
      g.totalBytes += m.sizeEstimate;
      if (m.unread) g.unread += 1;
      if (m.date > g.lastDate) g.lastDate = m.date;
      if (g.sampleIds.length < 10) g.sampleIds.push(m.id);
      groups.set(email, g);
    }

    const sorted = [...groups.values()].sort((a, b) => b.count - a.count);
    return { scanned: all.length, groups: sorted };
  });
}
