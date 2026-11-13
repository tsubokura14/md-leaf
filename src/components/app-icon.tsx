import { ImageResponse } from "next/og";
import { LEAF_PATHS } from "@/components/icons";
import { readAppColors } from "@/lib/token-colors";

/**
 * ホーム画面のアイコンの画像（src/app/icon.tsx・src/app/apple-icon.tsx）。bg の地の中央に、accent の若葉の線。
 * ホーム画面のアイコンは1つだけなので、ライトの色で描く。
 * 若葉はアイコンの幅の半分にする。Android が maskable として丸などに切り抜いても（中央の直径 80% が残る）、若葉が切れない
 */
export function appIconImage(size: number): ImageResponse {
  const { lightBg, lightAccent } = readAppColors();
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: lightBg,
      }}
    >
      <svg
        width={size / 2}
        height={size / 2}
        viewBox="0 0 24 24"
        fill="none"
        stroke={lightAccent}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {LEAF_PATHS.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    </div>,
    { width: size, height: size },
  );
}
