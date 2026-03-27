import { redirect } from "next/navigation";
import { resolveBackendUserForViewer } from "@/lib/backend-user";
import { getViewer } from "@/lib/session";
import { LoginClient } from "./LoginClient";

export default async function LoginPage() {
  const viewer = await getViewer();
  if (viewer) {
    const backendUser = await resolveBackendUserForViewer(viewer);
    redirect(backendUser?.onboarding_complete ? "/dashboard" : "/chat");
  }

  return <LoginClient />;
}
