import { auth } from "@/auth";
import { SendersClient } from "./senders-client";

export default async function SendersPage() {
  const session = await auth();
  if (!session?.accessToken) {
    return (
      <p className="text-zinc-600 dark:text-zinc-400">
        Sign in to group your inbox.
      </p>
    );
  }
  return <SendersClient />;
}
