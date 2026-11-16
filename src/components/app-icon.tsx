import { ImageResponse } from "next/og";
import { LEAF_PATHS } from "@/components/icons";
import { readAppColors } from "@/lib/token-colors";

/**
 * アイコンの画像（src/app/icon.tsx・src/app/apple-icon.tsx）。
 * - 地が要るもの（ホーム画面のアイコン。iPhone は透明な所を塗りつぶし、maskable は地ごと切り抜かれる）：
 *   ダークの bg（黒系）の地の中央に、ダークの accent の若葉の線。ホーム画面のアイコンは1つだけなので、ライト・ダークで変えない
 * - 地が要らないもの（ブラウザのタブのファビコン）：地を塗らず、若葉の線だけ。タブの地はライトにもダークにもなるので、
 *   どちらでも見える中ほどの明るさのライトの accent で描く
 * 若葉は既定でアイコンの幅の半分にする。Android が maskable として丸などに切り抜いても（中央の直径 80% が残る）、若葉が切れない。
 * ファビコンは小さく、切り抜かれないので、leafRatio を大きくして若葉を見やすくする
 */
export function appIconImage(
  size: number,
  { leafRatio = 0.5, transparent = false }: { leafRatio?: number; transparent?: boolean } = {},
): ImageResponse {
  const { lightAccent, darkBg, darkAccent } = readAppColors();
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...(transparent ? {} : { background: darkBg }),
      }}
    >
      <svg
        width={size * leafRatio}
        height={size * leafRatio}
        viewBox="0 0 24 24"
        fill="none"
        stroke={transparent ? lightAccent : darkAccent}
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
