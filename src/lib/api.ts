import { auth } from "@/auth";
import { gmailClient, type GmailClient } from "@/lib/gmail";
import { NextResponse } from "next/server";

export async function withGmail<T>(
  handler: (gmail: GmailClient) => Promise<T>
): Promise<Response> {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (session.error === "RefreshAccessTokenError") {
    return NextResponse.json({ error: "reauth_required" }, { status: 401 });
  }
  try {
    const gmail = gmailClient(session.accessToken);
    const data = await handler(gmail);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
