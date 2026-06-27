import "../styles/globals.css";
import { type Metadata } from "next";
import { ThemeProvider } from "~/components/ui/theme-provider";

export const metadata: Metadata = {
  title: "CollabDoc — Collaborative Document Editor",
  description: "Local-first collaborative document editor with AI assistance",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
