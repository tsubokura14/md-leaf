import { appIconImage } from "@/components/app-icon";

// ブラウザのタブのファビコン（32）と、マニフェストのアイコン（src/app/manifest.ts。192・512）。
// id がそのまま URL（/icon/32・/icon/192・/icon/512）になる。id を変えたら src/proxy.ts の matcher も合わせる
const FAVICON_SIZE = 32;

export function generateImageMetadata() {
  return [FAVICON_SIZE, 192, 512].map((width) => ({
    id: String(width),
    size: { width, height: width },
    contentType: "image/png",
  }));
}

export default async function Icon({ id }: { id: Promise<string> }) {
  const size = Number(await id);
  return appIconImage(
    size,
    size === FAVICON_SIZE ? { leafRatio: 0.875, transparent: true } : undefined,
  );
}
