import { redirect } from "next/navigation";
import { getViewer } from "@/lib/session";
import { LoginClient } from "./LoginClient";

export default async function LoginPage() {
  const viewer = await getViewer();
  if (viewer) {
    redirect("/dashboard");
  }

  return <LoginClient />;
}
