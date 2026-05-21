import { withGmail } from "@/lib/api";
import { getMessagesMetadata, listMessageIds } from "@/lib/gmail";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q") ?? "in:inbox";
  const maxResults = Math.min(Number(sp.get("max") ?? "50"), 100);
  const pageToken = sp.get("pageToken") ?? undefined;
  return withGmail(async (gmail) => {
    const { ids, nextPageToken, resultSizeEstimate } = await listMessageIds(
      gmail,
      q,
      maxResults,
      pageToken
    );
    const messages = await getMessagesMetadata(gmail, ids);
    return { messages, nextPageToken, resultSizeEstimate };
  });
}
