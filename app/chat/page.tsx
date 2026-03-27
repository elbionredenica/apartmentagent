import { redirect } from "next/navigation";
import { getViewer } from "@/lib/session";
import { ChatClient } from "./ChatClient";

export default async function ChatPage() {
  const viewer = await getViewer();
  if (!viewer) {
    redirect("/");
  }

  return <ChatClient />;
}
