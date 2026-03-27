import { redirect } from "next/navigation";
import { resolveBackendUserForViewer } from "@/lib/backend-user";
import { getViewer } from "@/lib/session";
import { ChatClient } from "./ChatClient";

export default async function ChatPage() {
  const viewer = await getViewer();
  if (!viewer) {
    redirect("/");
  }

  const backendUser = await resolveBackendUserForViewer(viewer);
  if (backendUser?.onboarding_complete) {
    redirect("/dashboard");
  }

  return <ChatClient />;
}
