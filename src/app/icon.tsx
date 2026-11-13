import { appIconImage } from "@/components/app-icon";

// マニフェストのアイコン（src/app/manifest.ts）。id がそのまま URL（/icon/192・/icon/512）になる
export function generateImageMetadata() {
  return [192, 512].map((width) => ({
    id: String(width),
    size: { width, height: width },
    contentType: "image/png",
  }));
}

export default async function Icon({ id }: { id: Promise<string> }) {
  return appIconImage(Number(await id));
}
