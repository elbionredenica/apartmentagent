import { redirect } from "next/navigation";
import { NavBar } from "@/components/NavBar";
import { getViewer } from "@/lib/session";

export default async function IntelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const viewer = await getViewer();
  if (!viewer) {
    redirect("/");
  }

  return (
    <div className="flex flex-col h-screen">
      <NavBar viewer={viewer} />
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
