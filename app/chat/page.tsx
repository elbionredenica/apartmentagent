import { redirect } from "next/navigation";
import { getUserId } from "@/lib/session";
import { ChatClient } from "./ChatClient";

export default async function ChatPage() {
  const userId = await getUserId();
  if (!userId) {
    redirect("/");
  }

  return <ChatClient />;
}
