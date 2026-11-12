import type { Metadata } from "next";
import { readingSizeScript } from "@/components/reading-size";
import { themeScript } from "@/components/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "md-leaf", template: "%s - md-leaf" },
  description: "Obsidian で書いた Markdown のノートを読むためのアプリ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // <head> のスクリプトが、ライト/ダークは <html> の class を、本文の文字の大きさは style を変える
    // （src/components/theme.ts・src/components/reading-size.ts）
    <html lang="ja" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: readingSizeScript }} />
      </head>
      <body className="bg-bg font-ui text-text">{children}</body>
    </html>
  );
}
