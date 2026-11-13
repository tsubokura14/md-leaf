import { appIconImage } from "@/components/app-icon";

// iPhone のホーム画面のアイコン。iPhone はマニフェストのアイコンではなく、これを使う
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return appIconImage(size.width);
}
