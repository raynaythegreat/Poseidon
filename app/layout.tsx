import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ChatHistoryProvider } from "@/contexts/ChatHistoryContext";
import { ApiUsageProvider } from "@/contexts/ApiUsageContext";
import { DeploymentProvider } from "@/contexts/DeploymentContext";
import { ImageHistoryProvider } from "@/contexts/ImageHistoryContext";
import { UserSettingsProvider } from "@/contexts/UserSettingsContext";
import { ProjectsProvider } from "@/contexts/ProjectsContext";
import ProjectSyncProvider from "@/components/ProjectSyncProvider";

export const metadata: Metadata = {
  title: "Poseidon - AI Dev Command Center",
  description:
    "Poseidon is a cyber-styled AI command center for planning, building, and deploying web applications with confidence.",
  icons: {
    icon: [{ url: "/trident.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// Theme initialization script - runs before page paint to prevent flash
const themeInitScript = `
  (function() {
    try {
      const theme = localStorage.getItem('theme');
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (theme === 'dark' || (!theme && systemDark)) {
        document.documentElement.classList.add('dark');
      }
    } catch (e) {
      // localStorage may not be available in all environments
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemDark) {
        document.documentElement.classList.add('dark');
      }
    }
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className="antialiased overflow-x-hidden">
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <ThemeProvider>
          <UserSettingsProvider>
            <ChatHistoryProvider>
              <ApiUsageProvider>
                <ImageHistoryProvider>
                  <DeploymentProvider>
                    <ProjectsProvider>
                      <ProjectSyncProvider />
                      {children}
                    </ProjectsProvider>
                  </DeploymentProvider>
                </ImageHistoryProvider>
              </ApiUsageProvider>
            </ChatHistoryProvider>
          </UserSettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
