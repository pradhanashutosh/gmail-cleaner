import Link from "next/link";
import { auth, signIn, signOut } from "@/auth";
import { Inbox, Users, MailX, Paperclip, LogIn, LogOut } from "lucide-react";

const links = [
  { href: "/", label: "Dashboard", icon: Inbox },
  { href: "/triage", label: "Triage", icon: Inbox },
  { href: "/senders", label: "Senders", icon: Users },
  { href: "/unsubscribe", label: "Unsubscribe", icon: MailX },
  { href: "/attachments", label: "Attachments", icon: Paperclip },
];

export async function Nav() {
  const session = await auth();
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold tracking-tight">
            Gmail Cleaner
          </Link>
          {session?.accessToken && (
            <nav className="hidden md:flex items-center gap-1 text-sm">
              {links.slice(1).map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="px-3 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm">
          {session?.user ? (
            <>
              <span className="hidden sm:inline text-zinc-500 dark:text-zinc-400">
                {session.user.email}
              </span>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </form>
            </>
          ) : (
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/" });
              }}
            >
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90">
                <LogIn className="w-4 h-4" /> Sign in with Google
              </button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}
