import { google, gmail_v1 } from "googleapis";

export type GmailClient = gmail_v1.Gmail;

export function gmailClient(accessToken: string): GmailClient {
  const oauth2 = new google.auth.OAuth2();
  oauth2.setCredentials({ access_token: accessToken });
  return google.gmail({ version: "v1", auth: oauth2 });
}

export type MessageLite = {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  fromEmail: string;
  date: number;
  sizeEstimate: number;
  unread: boolean;
  listUnsubscribe?: string;
  listUnsubscribePost?: string;
  hasAttachment: boolean;
};

const HEADER_KEYS = [
  "Subject",
  "From",
  "Date",
  "List-Unsubscribe",
  "List-Unsubscribe-Post",
];

function header(
  headers: gmail_v1.Schema$MessagePartHeader[] | undefined,
  name: string
): string | undefined {
  return headers?.find(
    (h) => h.name?.toLowerCase() === name.toLowerCase()
  )?.value ?? undefined;
}

function parseFromEmail(from: string): string {
  const m = from.match(/<([^>]+)>/);
  return (m?.[1] ?? from).trim().toLowerCase();
}

function hasAttachmentPart(parts?: gmail_v1.Schema$MessagePart[]): boolean {
  if (!parts) return false;
  for (const p of parts) {
    if (p.filename && p.filename.length > 0) return true;
    if (p.parts && hasAttachmentPart(p.parts)) return true;
  }
  return false;
}

export function toMessageLite(m: gmail_v1.Schema$Message): MessageLite {
  const h = m.payload?.headers ?? [];
  const from = header(h, "From") ?? "";
  return {
    id: m.id!,
    threadId: m.threadId!,
    snippet: m.snippet ?? "",
    subject: header(h, "Subject") ?? "(no subject)",
    from,
    fromEmail: parseFromEmail(from),
    date: Number(m.internalDate ?? 0),
    sizeEstimate: m.sizeEstimate ?? 0,
    unread: (m.labelIds ?? []).includes("UNREAD"),
    listUnsubscribe: header(h, "List-Unsubscribe"),
    listUnsubscribePost: header(h, "List-Unsubscribe-Post"),
    hasAttachment: hasAttachmentPart(m.payload?.parts),
  };
}

export async function listMessageIds(
  gmail: GmailClient,
  q: string,
  maxResults = 50,
  pageToken?: string
) {
  const res = await gmail.users.messages.list({
    userId: "me",
    q,
    maxResults,
    pageToken,
  });
  return {
    ids: (res.data.messages ?? []).map((m) => m.id!).filter(Boolean),
    nextPageToken: res.data.nextPageToken ?? undefined,
    resultSizeEstimate: res.data.resultSizeEstimate ?? 0,
  };
}

export async function getMessagesMetadata(
  gmail: GmailClient,
  ids: string[]
): Promise<MessageLite[]> {
  if (ids.length === 0) return [];
  const out: MessageLite[] = [];
  const concurrency = 10;
  for (let i = 0; i < ids.length; i += concurrency) {
    const batch = ids.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map((id) =>
        gmail.users.messages
          .get({
            userId: "me",
            id,
            format: "metadata",
            metadataHeaders: HEADER_KEYS,
          })
          .then((r) => r.data)
          .catch(() => null)
      )
    );
    for (const r of results) if (r) out.push(toMessageLite(r));
  }
  return out;
}

export async function getMessagesWithParts(
  gmail: GmailClient,
  ids: string[]
): Promise<MessageLite[]> {
  if (ids.length === 0) return [];
  const out: MessageLite[] = [];
  const concurrency = 5;
  for (let i = 0; i < ids.length; i += concurrency) {
    const batch = ids.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map((id) =>
        gmail.users.messages
          .get({ userId: "me", id, format: "full" })
          .then((r) => r.data)
          .catch(() => null)
      )
    );
    for (const r of results) if (r) out.push(toMessageLite(r));
  }
  return out;
}

export async function batchTrash(
  gmail: GmailClient,
  ids: string[]
): Promise<{ trashed: number }> {
  if (ids.length === 0) return { trashed: 0 };
  const chunkSize = 1000;
  let trashed = 0;
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    await gmail.users.messages.batchModify({
      userId: "me",
      requestBody: { ids: chunk, addLabelIds: ["TRASH"], removeLabelIds: ["INBOX"] },
    });
    trashed += chunk.length;
  }
  return { trashed };
}

export async function trashOne(gmail: GmailClient, id: string) {
  await gmail.users.messages.trash({ userId: "me", id });
}

export async function getProfile(gmail: GmailClient) {
  const res = await gmail.users.getProfile({ userId: "me" });
  return res.data;
}

export type AttachmentInfo = {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
};

export function collectAttachments(
  msg: gmail_v1.Schema$Message
): AttachmentInfo[] {
  const out: AttachmentInfo[] = [];
  function walk(parts?: gmail_v1.Schema$MessagePart[]) {
    if (!parts) return;
    for (const p of parts) {
      if (p.filename && p.body?.attachmentId) {
        out.push({
          filename: p.filename,
          mimeType: p.mimeType ?? "application/octet-stream",
          size: p.body.size ?? 0,
          attachmentId: p.body.attachmentId,
        });
      }
      if (p.parts) walk(p.parts);
    }
  }
  walk(msg.payload?.parts);
  return out;
}

export function parseUnsubscribeUrls(header: string | undefined): {
  http?: string;
  mailto?: string;
} {
  if (!header) return {};
  const urls = header
    .split(",")
    .map((s) => s.trim())
    .map((s) => s.replace(/^<|>$/g, ""));
  const http = urls.find((u) => u.startsWith("http"));
  const mailto = urls.find((u) => u.startsWith("mailto:"));
  return { http, mailto };
}
