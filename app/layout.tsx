import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ChatHistoryProvider } from "@/contexts/ChatHistoryContext";
import { ApiUsageProvider } from "@/contexts/ApiUsageContext";
import { DeploymentProvider } from "@/contexts/DeploymentContext";
import { ImageHistoryProvider } from "@/contexts/ImageHistoryContext";
import { UserSettingsProvider } from "@/contexts/UserSettingsContext";
import { ProjectsProvider } from "@/contexts/ProjectsContext";

export const metadata: Metadata = {
  title: "Poseidon - AI Dev Command Center",
  description:
    "Poseidon is a cyber-styled AI command center for planning, building, and deploying web applications with confidence.",
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased overflow-x-hidden">
        <ThemeProvider>
          <UserSettingsProvider>
            <ChatHistoryProvider>
              <ApiUsageProvider>
                <ImageHistoryProvider>
                  <DeploymentProvider>
                    <ProjectsProvider>
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
