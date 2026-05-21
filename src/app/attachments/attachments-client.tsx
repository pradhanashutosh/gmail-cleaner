"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/card";
import { formatBytes, formatRelative } from "@/lib/format";
import type { AttachmentRow } from "@/app/api/gmail/attachments/route";
import { RefreshCw, Trash2, Paperclip } from "lucide-react";

export function AttachmentsClient() {
  const [rows, setRows] = useState<AttachmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [minMB, setMinMB] = useState(5);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [working, setWorking] = useState(false);
  const [freed, setFreed] = useState(0);

  const load = useCallback(async (mb: number) => {
    setLoading(true);
    const res = await fetch(`/api/gmail/attachments?minMB=${mb}&cap=200`);
    const data = (await res.json()) as { rows: AttachmentRow[] };
    setRows(data.rows ?? []);
    setSelected(new Set());
    setLoading(false);
  }, []);

  useEffect(() => {
    load(minMB);
  }, [load, minMB]);

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  async function trashSelected() {
    setWorking(true);
    const ids = [...selected];
    const bytes = rows
      .filter((r) => selected.has(r.messageId))
      .reduce((n, r) => n + r.size, 0);
    await fetch("/api/gmail/trash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    setFreed((f) => f + bytes);
    setWorking(false);
    load(minMB);
  }

  const totalSelectedBytes = rows
    .filter((r) => selected.has(r.messageId))
    .reduce((n, r) => n + r.size, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">Large Attachments</h1>
          <p className="text-sm text-zinc-500">
            {rows.length} attachments ≥ {minMB}MB
            {freed > 0 && ` · freed ~${formatBytes(freed)} this session`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-zinc-500">Min size</label>
          <select
            value={minMB}
            onChange={(e) => setMinMB(Number(e.target.value))}
            className="text-sm px-2 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
          >
            {[1, 2, 5, 10, 25].map((v) => (
              <option key={v} value={v}>
                {v}MB
              </option>
            ))}
          </select>
          {selected.size > 0 && (
            <button
              onClick={trashSelected}
              disabled={working}
              className="text-sm px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              {working ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Trash {selected.size} · ~{formatBytes(totalSelectedBytes)}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-zinc-500 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" /> Scanning attachments…
        </div>
      ) : rows.length === 0 ? (
        <Card className="p-10 text-center text-zinc-500">
          <Paperclip className="w-8 h-8 mx-auto mb-2 opacity-60" />
          No attachments ≥ {minMB}MB.
        </Card>
      ) : (
        <Card>
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.map((r) => (
              <li
                key={`${r.messageId}-${r.filename}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              >
                <input
                  type="checkbox"
                  checked={selected.has(r.messageId)}
                  onChange={() => toggle(r.messageId)}
                  className="w-4 h-4 accent-red-600"
                />
                <Paperclip className="w-4 h-4 text-zinc-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{r.filename}</div>
                  <div className="text-xs text-zinc-500 truncate">
                    {r.subject} · {r.fromName}
                  </div>
                </div>
                <div className="text-right text-sm shrink-0">
                  <div className="font-medium">{formatBytes(r.size)}</div>
                  <div className="text-xs text-zinc-500">
                    {formatRelative(r.date)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
