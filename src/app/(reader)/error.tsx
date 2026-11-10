"use client";

import { LoadError } from "@/components/load-error";

// ノートは notes/[...path]/error.tsx が受け持つので、ここに来るのはホーム。
// 同じ階層のレイアウトは包まないので、上の帯とノートの一覧は残る
export default function HomeError({ retry }: { error: unknown; retry: () => void }) {
  return <LoadError title="ノートの一覧を読み込めませんでした" retry={retry} />;
}
