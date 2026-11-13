import type { Metadata, Viewport } from "next";
import { readingSizeScript } from "@/components/reading-size";
import { themeScript } from "@/components/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "md-leaf", template: "%s - md-leaf" },
  description: "Obsidian で書いた Markdown のノートを読むためのアプリ",
  // ホーム画面のアイコンから、ブラウザの枠のない全画面で開く（iPhone の Safari が読む。Android はマニフェストの display）。
  // statusBarStyle は default にする（black-translucent は本文が時刻や電池の部分の下にもぐり、時刻の文字がいつも白で
  // ライトの地に見えなくなる）。時刻や電池の部分の色は src/components/theme.ts が bg に合わせる
  appleWebApp: { capable: true, title: "md-leaf", statusBarStyle: "default" },
};

// ページを画面の下の端まで描く。付けないと、Android の Chrome がホーム画面から開いたとき、下のジェスチャーの横線の部分を
// 白で塗る（bg の色にならない）。下の端に置くものは、その部分の高さ（トークンの safe-bottom）だけ上げる。
// 前提（崩れたら見直す）：上の時刻や電池の部分は、cover でもブラウザがよけて描き、上の帯はもぐらない（iPhone は
// statusBarStyle が default のため。Android の Chrome は下の端だけをページに渡す）。もぐるなら上にも safe-area の余白が要る
export const viewport: Viewport = { viewportFit: "cover" };

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
