import { redirect } from "next/navigation";
import { NavBar } from "@/components/NavBar";
import { getViewer, hasStartedSearch } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const viewer = await getViewer();
  if (!viewer) {
    redirect("/");
  }

  if (!(await hasStartedSearch(viewer.userId))) {
    redirect("/chat");
  }

  return (
    <div className="flex flex-col h-screen">
      <NavBar viewer={viewer} />
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
