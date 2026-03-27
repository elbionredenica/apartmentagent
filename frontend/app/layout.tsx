import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ApartmentAgent",
  description: "AI agent that calls apartment listings and schedules viewings",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
