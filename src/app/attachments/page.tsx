import { auth } from "@/auth";
import { AttachmentsClient } from "./attachments-client";

export default async function AttachmentsPage() {
  const session = await auth();
  if (!session?.accessToken) {
    return (
      <p className="text-zinc-600 dark:text-zinc-400">
        Sign in to find large attachments.
      </p>
    );
  }
  return <AttachmentsClient />;
}
