import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NoteBody } from "@/components/note-body";
import { getNote, getNotePaths } from "../../data";

// 一番上の index.md はホームなので、ノートとしては開けない（src/lib/notes.ts）。
// ノートが1つもないとき、空の配列を返すとビルドが止まる（Cache Components）ので、この値を代わりに返す
const PLACEHOLDER_PATH = ["index"];

export async function generateStaticParams() {
  const paths = await getNotePaths();
  if (paths.length === 0) return [{ path: PLACEHOLDER_PATH }];
  return paths.map((path) => ({ path }));
}

export async function generateMetadata({
  params,
}: PageProps<"/notes/[...path]">): Promise<Metadata> {
  const note = await getNote((await params).path);
  return note ? { title: note.title } : {};
}

// 一覧にない URL も App Shell を先に返せるよう、params は loading.tsx（Suspense）の中で待つ（partialPrefetching）。
// App Shell にはスケルトンが入るので、ノートへ移るあいだはスケルトンが出る
export default async function NotePage({ params }: PageProps<"/notes/[...path]">) {
  const note = await getNote((await params).path);
  if (!note) notFound();
  return <NoteBody title={note.title} html={note.html} headings={note.headings} />;
}
