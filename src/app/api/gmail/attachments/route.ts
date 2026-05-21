import { withGmail } from "@/lib/api";
import {
  collectAttachments,
  listMessageIds,
} from "@/lib/gmail";
import { senderDisplay } from "@/lib/format";
import type { NextRequest } from "next/server";

export type AttachmentRow = {
  messageId: string;
  filename: string;
  mimeType: string;
  size: number;
  subject: string;
  fromName: string;
  fromEmail: string;
  date: number;
};

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const minMB = Math.max(Number(sp.get("minMB") ?? "5"), 1);
  const cap = Math.min(Number(sp.get("cap") ?? "200"), 500);
  const q = `has:attachment larger:${minMB}M`;

  return withGmail(async (gmail) => {
    const rows: AttachmentRow[] = [];
    let pageToken: string | undefined;
    while (rows.length < cap) {
      const page = await listMessageIds(
        gmail,
        q,
        Math.min(50, cap - rows.length),
        pageToken
      );
      if (page.ids.length === 0) break;
      const results = await Promise.all(
        page.ids.map((id) =>
          gmail.users.messages
            .get({ userId: "me", id, format: "full" })
            .then((r) => r.data)
            .catch(() => null)
        )
      );
      for (const m of results) {
        if (!m) continue;
        const headers = m.payload?.headers ?? [];
        const subject =
          headers.find((h) => h.name?.toLowerCase() === "subject")?.value ??
          "(no subject)";
        const from =
          headers.find((h) => h.name?.toLowerCase() === "from")?.value ?? "";
        const { name, email } = senderDisplay(from);
        for (const a of collectAttachments(m)) {
          rows.push({
            messageId: m.id!,
            filename: a.filename,
            mimeType: a.mimeType,
            size: a.size,
            subject,
            fromName: name,
            fromEmail: email,
            date: Number(m.internalDate ?? 0),
          });
        }
      }
      pageToken = page.nextPageToken;
      if (!pageToken) break;
    }
    rows.sort((a, b) => b.size - a.size);
    return { rows };
  });
}
