import { redirect } from "next/navigation";
import { getViewer, hasStartedSearch } from "@/lib/session";
import { LoginClient } from "./LoginClient";

export default async function LoginPage() {
  const viewer = await getViewer();
  if (viewer) {
    redirect((await hasStartedSearch(viewer.userId)) ? "/dashboard" : "/chat");
  }

  return <LoginClient />;
}
