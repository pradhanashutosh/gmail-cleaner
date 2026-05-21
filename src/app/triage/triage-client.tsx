"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { Card } from "@/components/card";
import { formatBytes, formatRelative } from "@/lib/format";
import type { MessageLite } from "@/lib/gmail";
import { Trash2, Check, Undo2, RefreshCw } from "lucide-react";

type Action = { id: string; decision: "keep" | "trash" };

export function TriageClient() {
  const [messages, setMessages] = useState<MessageLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageToken, setPageToken] = useState<string | undefined>();
  const [history, setHistory] = useState<Action[]>([]);
  const [trashedCount, setTrashedCount] = useState(0);
  const [bytesFreed, setBytesFreed] = useState(0);

  const fetchPage = useCallback(async (token?: string) => {
    setLoading(true);
    const url = new URL("/api/gmail/messages", window.location.origin);
    url.searchParams.set("q", "in:inbox");
    url.searchParams.set("max", "50");
    if (token) url.searchParams.set("pageToken", token);
    const res = await fetch(url);
    const data = (await res.json()) as {
      messages: MessageLite[];
      nextPageToken?: string;
    };
    setMessages((prev) => [...prev, ...(data.messages ?? [])]);
    setPageToken(data.nextPageToken);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  const current = messages[0];
  const next = messages[1];

  const decide = useCallback(
    async (decision: "keep" | "trash") => {
      if (!current) return;
      setHistory((h) => [...h, { id: current.id, decision }]);
      setMessages((m) => m.slice(1));
      if (decision === "trash") {
        setTrashedCount((c) => c + 1);
        setBytesFreed((b) => b + current.sizeEstimate);
        try {
          await fetch("/api/gmail/trash", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: [current.id] }),
          });
        } catch {
          // soft fail; user can refresh
        }
      }
      if (messages.length <= 10 && pageToken) fetchPage(pageToken);
    },
    [current, messages.length, pageToken, fetchPage]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") decide("trash");
      else if (e.key === "ArrowRight") decide("keep");
      else if (e.key === "z" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        // undo not yet implemented (would need un-trash); skip for now
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [decide]);

  if (loading && messages.length === 0) {
    return (
      <div className="text-center py-20 text-zinc-500 flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin" /> Loading inbox…
      </div>
    );
  }

  if (!current) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold">Inbox zero. Nice.</h2>
        <p className="text-zinc-500 mt-2">
          Trashed {trashedCount} · freed ~{formatBytes(bytesFreed)}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4 text-sm text-zinc-500">
        <div>{messages.length} left in batch</div>
        <div>
          Trashed {trashedCount} · ~{formatBytes(bytesFreed)} freed
        </div>
      </div>

      <div className="relative h-[440px]">
        {next && (
          <div className="absolute inset-0 scale-95 opacity-60">
            <MessageCard m={next} static />
          </div>
        )}
        <AnimatePresence>
          <SwipeCard key={current.id} m={current} onDecide={decide} />
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          onClick={() => decide("trash")}
          className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center shadow hover:bg-red-600"
          aria-label="Trash"
        >
          <Trash2 className="w-6 h-6" />
        </button>
        <button
          onClick={() => decide("keep")}
          className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow hover:bg-emerald-600"
          aria-label="Keep"
        >
          <Check className="w-6 h-6" />
        </button>
      </div>
      <p className="text-center text-xs text-zinc-500 mt-3">
        ← trash &nbsp;·&nbsp; → keep &nbsp;·&nbsp; drag the card
      </p>
      {history.length > 0 && (
        <p className="text-center text-xs text-zinc-400 mt-1 flex items-center justify-center gap-1">
          <Undo2 className="w-3 h-3" /> Trashed messages stay in Gmail Trash for 30 days.
        </p>
      )}
    </div>
  );
}

function SwipeCard({
  m,
  onDecide,
}: {
  m: MessageLite;
  onDecide: (d: "keep" | "trash") => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const trashOpacity = useTransform(x, [-150, 0], [1, 0]);
  const keepOpacity = useTransform(x, [0, 150], [0, 1]);

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -120) onDecide("trash");
    else if (info.offset.x > 120) onDecide("keep");
  }

  return (
    <motion.div
      className="absolute inset-0"
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={onDragEnd}
      exit={{ x: x.get() > 0 ? 400 : -400, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <MessageCard m={m} />
      <motion.div
        style={{ opacity: trashOpacity }}
        className="absolute top-6 left-6 rotate-[-18deg] border-2 border-red-500 text-red-500 px-3 py-1 rounded-md font-bold text-lg"
      >
        TRASH
      </motion.div>
      <motion.div
        style={{ opacity: keepOpacity }}
        className="absolute top-6 right-6 rotate-[18deg] border-2 border-emerald-500 text-emerald-500 px-3 py-1 rounded-md font-bold text-lg"
      >
        KEEP
      </motion.div>
    </motion.div>
  );
}

function MessageCard({ m, static: isStatic }: { m: MessageLite; static?: boolean }) {
  return (
    <Card className={`h-full p-5 flex flex-col ${isStatic ? "" : "cursor-grab active:cursor-grabbing"}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-zinc-500 truncate">{m.from}</div>
        <div className="text-xs text-zinc-400 shrink-0">{formatRelative(m.date)}</div>
      </div>
      <h3 className="mt-3 font-semibold text-lg leading-snug line-clamp-2">
        {m.subject}
      </h3>
      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400 flex-1 line-clamp-[10] whitespace-pre-wrap">
        {m.snippet}
      </p>
      <div className="mt-3 flex items-center gap-3 text-xs text-zinc-500">
        <span>{formatBytes(m.sizeEstimate)}</span>
        {m.unread && (
          <span className="text-blue-600 dark:text-blue-400">● unread</span>
        )}
        {m.hasAttachment && <span>📎 attachment</span>}
      </div>
    </Card>
  );
}
