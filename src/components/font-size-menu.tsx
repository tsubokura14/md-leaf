"use client";

import { useEffect, useId, useRef, useState } from "react";
import { currentReadingSize, READING_SIZES, setReadingSize } from "@/components/reading-size";

// 上の帯の「Aa」と、本文の文字の大きさを選ぶ枠。
// - 「Aa」は、本文があるとき（ページに隠されていない .reading があるとき）だけ、CSS の reading の変形（src/app/globals.css）で出す。
//   上の帯はレイアウトにあってどのページを出しているかを知らないため。CSS なら、サーバーで作る HTML のままで正しく出し分けられ、
//   React がつながる前後で出たり消えたりしない
// - 前提（崩れたら見直す）：本文は .reading の中に出し（src/components/note-body.tsx）、本文がない画面
//   （見つからない・読み込み中・読み込めなかった・index.md がないホーム・ノートが1つもないホーム）では .reading を使わない
// - 枠は選んでも閉じない（選び比べられるように）。外を押す・Esc・もう一度「Aa」で閉じる
// - 大きさを変えても、スクロールの位置には手を付けない（仕様で「読んでいた位置を保たない」と決めた）

/** 上の帯の「Aa」と、本文の文字の大きさの枠 */
export function FontSizeMenu() {
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState<number | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const headingId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const toggle = () => {
    // 枠は押したあとにしか開かないので、開くときに今の大きさを読む
    if (!open) setSize(currentReadingSize());
    setOpen(!open);
  };

  const choose = (value: number) => {
    setReadingSize(value);
    setSize(value);
  };

  return (
    <div
      ref={root}
      className="
        relative hidden
        reading:block
      "
    >
      <button
        ref={button}
        type="button"
        aria-label="文字の大きさ"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
        className="
          flex size-10 items-center justify-center rounded-md font-ui text-lg
          font-bold text-muted transition-colors
          hover:bg-surface
        "
      >
        Aa
      </button>
      {open ? (
        <div
          id={panelId}
          className="
            absolute top-full right-0 z-20 mt-2 w-64 rounded-lg border
            border-border bg-bg p-3 shadow-popover
          "
        >
          <p id={headingId} className="mb-2 text-xs font-bold text-muted">
            本文の文字の大きさ
          </p>
          <div
            role="radiogroup"
            aria-labelledby={headingId}
            className="flex gap-1 rounded-md bg-surface p-1"
          >
            {READING_SIZES.map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={size === value}
                onClick={() => choose(value)}
                className={`
                  flex-1 rounded-sm py-2 text-center font-mono text-sm
                  ${size === value ? "bg-bg font-bold text-accent" : "text-muted"}
                `}
              >
                {value}px
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
