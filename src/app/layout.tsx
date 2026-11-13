import type { Metadata } from "next";
import { readingSizeScript } from "@/components/reading-size";
import { themeScript } from "@/components/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "md-leaf", template: "%s - md-leaf" },
  description: "Obsidian で書いた Markdown のノートを読むためのアプリ",
  // ホーム画面のアイコンから、ブラウザの枠のない全画面で開く（iPhone の Safari が読む。Android はマニフェストの display）。
  // viewport-fit=cover は付けない。付けると上の帯が時刻や電池の部分の下にもぐり、env(safe-area-inset-*) の余白が要る。
  // 付けなければ、ブラウザが時刻や電池の部分をよけて描く。statusBarStyle は default にする（black-translucent は本文が下にもぐり、
  // 時刻の文字がいつも白でライトの地に見えなくなる）。時刻や電池の部分の色は src/components/theme.ts が bg に合わせる
  appleWebApp: { capable: true, title: "md-leaf", statusBarStyle: "default" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // <head> のスクリプトが、ライト/ダークは <html> の class（と theme-color の <meta>）を、本文の文字の大きさは style を変える
    // （src/components/theme.ts・src/components/reading-size.ts）
    <html lang="ja" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript() }} />
        <script dangerouslySetInnerHTML={{ __html: readingSizeScript }} />
      </head>
      <body className="bg-bg font-ui text-text">{children}</body>
    </html>
  );
}
