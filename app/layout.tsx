import type { Metadata, Viewport } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "./globals.css";

import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { TradeDataProvider } from "@/lib/hooks/useTradeData";
import { AuthProvider } from "@/lib/hooks/useAuth";
import { AuthGate } from "@/components/auth/AuthGate";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export const metadata: Metadata = {
  title: "Trading Journal",
  description: "A discipline-first trading journal — every metric is computed from your trades.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAFC" },
    { media: "(prefers-color-scheme: dark)", color: "#0D0D14" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">
        <ThemeProvider>
          <AuthProvider>
            <AuthGate>
              <TradeDataProvider>
                <Sidebar />
                <div className="flex min-h-screen flex-col pb-16 lg:pb-0 lg:pl-[76px]">
                  <TopBar />
                  <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">{children}</main>
                </div>
              </TradeDataProvider>
            </AuthGate>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
