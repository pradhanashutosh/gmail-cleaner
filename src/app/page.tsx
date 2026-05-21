import { auth } from "@/auth";
import { gmailClient, getProfile } from "@/lib/gmail";
import { formatBytes } from "@/lib/format";
import { Card } from "@/components/card";
import Link from "next/link";
import { Inbox, Users, MailX, Paperclip } from "lucide-react";

const tools = [
  {
    href: "/triage",
    title: "Swipe Triage",
    desc: "Tinder-style keep or trash, one message at a time.",
    Icon: Inbox,
  },
  {
    href: "/senders",
    title: "By Sender",
    desc: "Group inbox by sender. Bulk-trash noisy ones.",
    Icon: Users,
  },
  {
    href: "/unsubscribe",
    title: "Unsubscribe",
    desc: "One-click unsub from newsletters using List-Unsubscribe.",
    Icon: MailX,
  },
  {
    href: "/attachments",
    title: "Large Attachments",
    desc: "Find files >5MB hogging your quota.",
    Icon: Paperclip,
  },
];

export default async function Home() {
  const session = await auth();
  if (!session?.accessToken) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-semibold tracking-tight">
          Clean up your Gmail inbox.
        </h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
          Sign in with Google to triage, group by sender, unsubscribe, and find
          large attachments. Runs locally — nothing leaves your machine.
        </p>
        <p className="mt-6 text-sm text-zinc-500">
          Use the &quot;Sign in with Google&quot; button in the top right.
        </p>
      </div>
    );
  }

  let profile:
    | { emailAddress?: string | null; messagesTotal?: number | null; threadsTotal?: number | null }
    | null = null;
  try {
    profile = await getProfile(gmailClient(session.accessToken));
  } catch {
    profile = null;
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">
          Hi {session.user?.name?.split(" ")[0] ?? "there"} 👋
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Signed in as {profile?.emailAddress ?? session.user?.email}
        </p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat label="Total messages" value={profile?.messagesTotal?.toLocaleString() ?? "—"} />
        <Stat label="Threads" value={profile?.threadsTotal?.toLocaleString() ?? "—"} />
        <Stat
          label="Est. inbox bytes"
          value={
            profile?.messagesTotal
              ? formatBytes(profile.messagesTotal * 40_000)
              : "—"
          }
          hint="rough estimate"
        />
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tools.map((t) => (
          <Link key={t.href} href={t.href} className="group">
            <Card className="p-5 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors h-full">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-2.5">
                  <t.Icon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-medium">{t.title}</h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                    {t.desc}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="p-4">
      <div className="text-xs text-zinc-500 uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {hint && <div className="text-xs text-zinc-500 mt-1">{hint}</div>}
    </Card>
  );
}
