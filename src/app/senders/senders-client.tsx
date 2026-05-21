"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/card";
import { formatBytes, formatRelative } from "@/lib/format";
import type { SenderGroup } from "@/app/api/gmail/senders/route";
import { RefreshCw, Trash2, AlertTriangle } from "lucide-react";

export function SendersClient() {
  const [groups, setGroups] = useState<SenderGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanned, setScanned] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [working, setWorking] = useState(false);
  const [trashed, setTrashed] = useState(0);

  const load = useCallback(async (scan = 500) => {
    setLoading(true);
    const res = await fetch(`/api/gmail/senders?scan=${scan}`);
    const data = (await res.json()) as { groups: SenderGroup[]; scanned: number };
    setGroups(data.groups ?? []);
    setScanned(data.scanned ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (email: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });

  const selectedGroups = groups.filter((g) => selected.has(g.email));
  const selectedCount = selectedGroups.reduce((n, g) => n + g.count, 0);
  const selectedBytes = selectedGroups.reduce((n, g) => n + g.totalBytes, 0);

  async function trashSelected() {
    setWorking(true);
    let total = 0;
    for (const g of selectedGroups) {
      const idsRes = await fetch(`/api/gmail/sender-ids?email=${encodeURIComponent(g.email)}&cap=5000`);
      const { ids } = (await idsRes.json()) as { ids: string[] };
      if (ids.length === 0) continue;
      await fetch("/api/gmail/trash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      total += ids.length;
    }
    setTrashed((t) => t + total);
    setSelected(new Set());
    setConfirming(false);
    setWorking(false);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">Senders</h1>
          <p className="text-sm text-zinc-500">
            Scanned {scanned.toLocaleString()} messages · {groups.length} unique senders
            {trashed > 0 && ` · ${trashed.toLocaleString()} trashed this session`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => load(1000)}
            disabled={loading}
            className="text-sm px-3 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
          >
            Scan more
          </button>
          {selected.size > 0 && (
            <button
              onClick={() => setConfirming(true)}
              className="text-sm px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 inline-flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              Trash {selected.size} sender{selected.size > 1 ? "s" : ""}
            </button>
          )}
        </div>
      </div>

      {loading && groups.length === 0 ? (
        <div className="text-center py-20 text-zinc-500 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" /> Grouping inbox…
        </div>
      ) : (
        <Card>
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {groups.map((g) => (
              <li
                key={g.email}
                className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              >
                <input
                  type="checkbox"
                  checked={selected.has(g.email)}
                  onChange={() => toggle(g.email)}
                  className="w-4 h-4 accent-red-600"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{g.name}</div>
                  <div className="text-xs text-zinc-500 truncate">{g.email}</div>
                </div>
                <div className="text-right text-sm shrink-0 hidden sm:block">
                  <div>
                    {g.count} msg{g.count > 1 ? "s" : ""}
                    {g.unread > 0 && (
                      <span className="text-blue-600 dark:text-blue-400 ml-1.5">
                        · {g.unread} unread
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {formatBytes(g.totalBytes)} · {formatRelative(g.lastDate)}
                  </div>
                </div>
                <div className="text-right text-sm shrink-0 sm:hidden">
                  <div>{g.count}</div>
                  <div className="text-xs text-zinc-500">{formatBytes(g.totalBytes)}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {confirming && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-red-100 dark:bg-red-950 p-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Trash {selectedCount} messages?</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  From {selected.size} sender{selected.size > 1 ? "s" : ""} · ~
                  {formatBytes(selectedBytes)} freed. Messages move to Gmail Trash
                  and auto-delete in 30 days. You can restore them before then.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setConfirming(false)}
                disabled={working}
                className="px-4 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={trashSelected}
                disabled={working}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 text-sm inline-flex items-center gap-1.5"
              >
                {working && <RefreshCw className="w-4 h-4 animate-spin" />}
                {working ? "Trashing…" : "Move to Trash"}
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
