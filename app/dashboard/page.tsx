import { redirect } from "next/navigation";
import { getUserId } from "@/lib/session";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const userId = await getUserId();
  if (!userId) {
    redirect("/");
  }

  return <DashboardClient />;
}
