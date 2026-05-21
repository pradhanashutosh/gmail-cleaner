import { auth } from "@/auth";
import { TriageClient } from "./triage-client";

export default async function TriagePage() {
  const session = await auth();
  if (!session?.accessToken) {
    return (
      <p className="text-zinc-600 dark:text-zinc-400">
        Sign in to start triaging.
      </p>
    );
  }
  return <TriageClient />;
}
