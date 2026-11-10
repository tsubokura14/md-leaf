"use client";

import { LoadError } from "@/components/load-error";

export default function NoteError({ retry }: { error: unknown; retry: () => void }) {
  return <LoadError title="ノートを読み込めませんでした" retry={retry} />;
}
