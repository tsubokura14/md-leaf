"use client";

import { MoonIcon, SunIcon } from "@/components/icons";
import { setTheme } from "@/components/theme";

// 月と太陽のボタンを両方描いておき、<html> の data-theme が dark かで CSS（dark の変形）でどちらかを隠す。
// サーバーで作る HTML はどちらが選ばれているかを知らないため、React の状態で出し分けると、つながる前に違うアイコンが出る。
// CSS なら、<head> のスクリプトが data-theme を付けた時点で正しいほうが出る。隠したほう（display: none）は読み上げにも出ない
// 前提（崩れたら見直す）：今出している色は <html> の data-theme だけで決まる（src/components/theme.ts）

const buttonClass = `
  size-10 items-center justify-center rounded-md text-muted transition-colors
  hover:bg-surface
`;

/** 上の帯のライト/ダークの切り替え */
export function ThemeToggle() {
  return (
    <>
      <button
        type="button"
        aria-label="ダークにする"
        onClick={toggleTheme}
        className={`
          flex
          dark:hidden
          ${buttonClass}
        `}
      >
        <MoonIcon className="size-6" />
      </button>
      <button
        type="button"
        aria-label="ライトにする"
        onClick={toggleTheme}
        className={`
          hidden
          dark:flex
          ${buttonClass}
        `}
      >
        <SunIcon className="size-6" />
      </button>
    </>
  );
}

/** 今出している色と逆のほうを選ぶ（3択の枠に替えるまでの、2択の入れ替え） */
function toggleTheme() {
  setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
}
