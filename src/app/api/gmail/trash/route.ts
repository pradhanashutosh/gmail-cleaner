import { withGmail } from "@/lib/api";
import { batchTrash } from "@/lib/gmail";
import type { NextRequest } from "next/server";
import { z } from "zod";

const Body = z.object({ ids: z.array(z.string().min(1)).min(1).max(5000) });

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }
  return withGmail(async (gmail) => batchTrash(gmail, parsed.data.ids));
}
