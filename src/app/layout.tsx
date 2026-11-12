import type { Metadata } from "next";
import { themeScript } from "@/components/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "md-leaf", template: "%s - md-leaf" },
  description: "Obsidian で書いた Markdown のノートを読むためのアプリ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // ライト/ダークは <head> のスクリプトが <html> の class を変える（src/components/theme.ts）
    <html lang="ja" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-bg font-ui text-text">{children}</body>
    </html>
  );
}
