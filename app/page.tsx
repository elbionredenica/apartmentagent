import { redirect } from "next/navigation";
import { getUserId } from "@/lib/session";
import { LoginClient } from "./LoginClient";

export default async function LoginPage() {
  const userId = await getUserId();
  if (userId) {
    redirect("/dashboard");
  }

  return <LoginClient />;
}
