import type { Metadata } from "next";
import "./globals.css";
import ThemeWrapper from "@/components/ThemeWrapper";

export const metadata: Metadata = {
  title: "CampusNest - Intelligent Hostel Management System",
  description: "Centralized campus hostel management portal with roommate matching, visual mapping, and AI-enabled assistance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="min-h-screen">
        <ThemeWrapper>{children}</ThemeWrapper>
      </body>
    </html>
  );
}
