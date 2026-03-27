import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ViewTransitions } from "next-view-transitions";
import { Providers } from "@/components/Providers";
import { auth0 } from "@/lib/auth0";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "ApartmentAgent",
  description:
    "AI agent that calls apartment listings on your behalf, asks your specific questions, and only schedules viewings worth your time.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth0.getSession();

  return (
    <ViewTransitions>
      <html lang="en">
        <body className={inter.className}>
          <Providers user={session?.user}>{children}</Providers>
        </body>
      </html>
    </ViewTransitions>
  );
}
