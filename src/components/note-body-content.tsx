"use client";

import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";

type NoteBodyContentProps = {
  html: string;
};

// 本文は src/lib/markdown.ts が作った HTML の文字列なので、リンクを next/link にできない。
// そこで本文のクリックを1か所で受け、ノートへのリンク（data-note-link。markdown.ts が、ノートの URL に
// 書き換えたリンクにだけ付ける）なら router.push で、ページを読み込み直さずに移る。
// href は markdown.ts が作った「/」か「/notes/...」だけなので、router.push に渡してよい（javascript: などは来ない）。
// 新しいタブで開く（Ctrl・⌘・Shift・Alt 付き、中ボタン）や、ほかで止めたクリック（defaultPrevented）は、
// ブラウザに任せる。React がつながる前に押したときも、ふつうのリンクとして移る

function isPlainLeftClick(event: MouseEvent): boolean {
  return (
    event.button === 0 &&
    !event.defaultPrevented &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

/** ノートの本文（HTML）。ノートへのリンクを押すと、読み込み直さずに移る */
export function NoteBodyContent({ html }: NoteBodyContentProps) {
  const router = useRouter();

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    if (!isPlainLeftClick(event)) return;
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest("a[data-note-link]");
    if (!(link instanceof HTMLAnchorElement) || !event.currentTarget.contains(link)) return;
    const href = link.getAttribute("href");
    if (!href) return;
    event.preventDefault();
    router.push(href);
  }

  return (
    // クリックはリンク（a）で起きたものだけを扱い、キーボードの Enter もリンクのクリックとして届くので、
    // div 自身にキー操作や役割は要らない
    <div
      className="note-body mt-6"
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
