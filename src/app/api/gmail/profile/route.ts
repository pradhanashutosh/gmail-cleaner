import { withGmail } from "@/lib/api";
import { getProfile } from "@/lib/gmail";

export async function GET() {
  return withGmail(async (gmail) => {
    const p = await getProfile(gmail);
    return {
      emailAddress: p.emailAddress,
      messagesTotal: p.messagesTotal,
      threadsTotal: p.threadsTotal,
      historyId: p.historyId,
    };
  });
}
