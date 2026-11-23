"use client";

import { useEffect, type RefObject } from "react";

// 上の帯の小さな枠（「Aa」の枠・テーマの枠）の閉じ方。外を押す・Esc で閉じ、Esc のときはボタンにフォーカスを戻す。
// 「もう一度ボタンを押すと閉じる」は、ボタンが root の中にあるので外を押した扱いにならず、各部品のボタンの onClick で閉じる

/** 開いているあいだ、root の外を押す・Esc で close を呼ぶ */
export function usePopover(
  open: boolean,
  close: () => void,
  root: RefObject<HTMLElement | null>,
  button: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        button.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close, root, button]);
}
