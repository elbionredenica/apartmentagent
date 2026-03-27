import { redirect } from "next/navigation";
import { getViewer, hasStartedSearch } from "@/lib/session";
import { ChatClient } from "./ChatClient";

export default async function ChatPage() {
  const viewer = await getViewer();
  if (!viewer) {
    redirect("/");
  }

  if (await hasStartedSearch(viewer.userId)) {
    redirect("/dashboard");
  }

  return <ChatClient />;
}
