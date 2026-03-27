import { redirect } from "next/navigation";
import { NavBar } from "@/components/NavBar";
import { resolveBackendUserForViewer } from "@/lib/backend-user";
import { getViewer } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const viewer = await getViewer();
  if (!viewer) {
    redirect("/");
  }

  const backendUser = await resolveBackendUserForViewer(viewer);
  if (!backendUser) {
    redirect("/");
  }
  if (!backendUser.onboarding_complete) {
    redirect("/chat");
  }

  return (
    <div className="flex flex-col h-screen">
      <NavBar viewer={viewer} />
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
