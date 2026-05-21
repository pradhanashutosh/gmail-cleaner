import { auth } from "@/auth";
import { UnsubClient } from "./unsub-client";

export default async function UnsubscribePage() {
  const session = await auth();
  if (!session?.accessToken) {
    return (
      <p className="text-zinc-600 dark:text-zinc-400">
        Sign in to find newsletters.
      </p>
    );
  }
  return <UnsubClient />;
}
