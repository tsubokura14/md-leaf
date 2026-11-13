import type { MetadataRoute } from "next";
import { readAppColors } from "@/lib/token-colors";

// ホーム画面に追加するときにブラウザが読む。ログインしていなくても返す（src/proxy.ts の matcher）
export default function manifest(): MetadataRoute.Manifest {
  const { lightBg } = readAppColors();
  return {
    name: "md-leaf",
    short_name: "md-leaf",
    start_url: "/",
    scope: "/",
    display: "standalone",
    // 開いた直後、ページを読む前の色。アイコンと同じく1つだけなので、ライトの bg にする
    background_color: lightBg,
    theme_color: lightBg,
    // URL は src/app/icon.tsx の generateImageMetadata の id
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
