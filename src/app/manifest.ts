import type { MetadataRoute } from "next";
import { readAppColors } from "@/lib/token-colors";

// ホーム画面に追加するときにブラウザが読む。ログインしていなくても返す（src/proxy.ts の matcher）
export default function manifest(): MetadataRoute.Manifest {
  const { darkBg } = readAppColors();
  return {
    name: "md-leaf",
    short_name: "md-leaf",
    start_url: "/",
    scope: "/",
    display: "standalone",
    // 開いた直後の画面と、Android でホーム画面から開いたときの画面のいちばん下の帯（ジェスチャーの横線の部分）の色。
    // 帯は Chrome がこの色で塗り、ページからは変えられない（viewport-fit=cover でも変わらなかった。#29）。
    // 色は1つしか書けないので、ダークの bg にする（ダークで帯を目立たせないため。ライトでは帯が黒く見えるのを受け入れた）。
    // 前提：Chrome がどちらの項目で帯を塗るかは版で違うので、両方を同じ色にしておく。今のアイコンには、Chrome が
    // アプリの情報を更新するまで届かない（すぐ確かめるには、追加し直す）
    background_color: darkBg,
    theme_color: darkBg,
    // URL は src/app/icon.tsx の generateImageMetadata の id
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
