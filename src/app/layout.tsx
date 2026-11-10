import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "md-leaf", template: "%s - md-leaf" },
  description: "Obsidian で書いた Markdown のノートを読むためのアプリ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja">
      <body className="bg-bg font-ui text-text">{children}</body>
    </html>
  );
}
