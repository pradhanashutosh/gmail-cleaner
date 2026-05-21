"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/card";
import { formatRelative } from "@/lib/format";
import type { Newsletter } from "@/app/api/gmail/unsubscribe/route";
import { RefreshCw, MailX, ExternalLink, Trash2, Check } from "lucide-react";

type Row = Newsletter & { status?: "unsubscribed" | "trashed" | "both" | "failed" };

export function UnsubClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/gmail/unsubscribe?scan=300");
    const data = (await res.json()) as { newsletters: Newsletter[] };
    setRows((data.newsletters ?? []).map((n) => ({ ...n })));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function unsubscribe(row: Row, alsoTrash: boolean) {
    setWorking(row.fromEmail);
    let unsubOk = false;
    if (row.unsubscribeHttp) {
      const res = await fetch("/api/gmail/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: row.unsubscribeHttp, oneClick: row.oneClick }),
      });
      const json = (await res.json()) as { ok?: boolean };
      unsubOk = Boolean(json.ok);
    } else if (row.unsubscribeMailto) {
      window.location.href = row.unsubscribeMailto;
      unsubOk = true;
    }

    let trashed = false;
    if (alsoTrash) {
      const idsRes = await fetch(
        `/api/gmail/sender-ids?email=${encodeURIComponent(row.fromEmail)}&cap=5000`
      );
      const { ids } = (await idsRes.json()) as { ids: string[] };
      if (ids.length > 0) {
        await fetch("/api/gmail/trash", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });
        trashed = true;
      }
    }

    setRows((rs) =>
      rs.map((r) =>
        r.fromEmail === row.fromEmail
          ? {
              ...r,
              status: !unsubOk
                ? "failed"
                : trashed
                  ? "both"
                  : "unsubscribed",
            }
          : r
      )
    );
    setWorking(null);
  }

  if (loading) {
    return (
      <div className="text-center py-20 text-zinc-500 flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin" /> Finding newsletters…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Unsubscribe</h1>
        <p className="text-sm text-zinc-500">
          {rows.length} newsletters found. One-click uses RFC 8058 where supported.
        </p>
      </div>

      {rows.length === 0 ? (
        <Card className="p-10 text-center text-zinc-500">
          <MailX className="w-8 h-8 mx-auto mb-2 opacity-60" />
          No newsletters with unsubscribe headers found in your recent inbox.
        </Card>
      ) : (
        <Card>
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.map((r) => (
              <li
                key={r.fromEmail}
                className="px-4 py-3 flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate flex items-center gap-2">
                    {r.fromName}
                    {r.oneClick && (
                      <span className="text-[10px] uppercase tracking-wide bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                        1-click
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-500 truncate">
                    {r.fromEmail} · {r.count} msg{r.count > 1 ? "s" : ""} · last {formatRelative(r.lastDate)}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {r.status && (
                    <span className="text-xs inline-flex items-center gap-1 text-emerald-600">
                      <Check className="w-3.5 h-3.5" />
                      {r.status === "both"
                        ? "unsubbed + trashed"
                        : r.status === "trashed"
                          ? "trashed"
                          : r.status === "failed"
                            ? "failed"
                            : "unsubscribed"}
                    </span>
                  )}
                  {!r.status && r.unsubscribeHttp && (
                    <button
                      onClick={() => unsubscribe(r, false)}
                      disabled={working === r.fromEmail}
                      className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 inline-flex items-center gap-1 disabled:opacity-50"
                    >
                      <ExternalLink className="w-3 h-3" /> Unsub
                    </button>
                  )}
                  {!r.status && (
                    <button
                      onClick={() => unsubscribe(r, true)}
                      disabled={working === r.fromEmail || (!r.unsubscribeHttp && !r.unsubscribeMailto)}
                      className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 inline-flex items-center gap-1 disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3" /> Unsub + trash
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
