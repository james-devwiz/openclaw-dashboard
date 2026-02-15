import type { Metadata } from "next";

import "./globals.css";
import { LayoutProvider } from "@/components/layout/LayoutProvider";
import Sidebar from "@/components/layout/Sidebar";
import SearchDialog from "@/components/search/SearchDialog";
import { SITE_CONFIG } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `${SITE_CONFIG.dashboardTitle} — ${SITE_CONFIG.aiName}`,
  description: "OpenClaw Command Centre Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <LayoutProvider>
          <div className="flex min-h-screen w-full bg-background text-foreground">
            <Sidebar />
            <main className="flex-1 p-6 pt-16 md:pt-6 overflow-auto">
              {children}
            </main>
          </div>
          <SearchDialog />
        </LayoutProvider>
      </body>
    </html>
  );
}
