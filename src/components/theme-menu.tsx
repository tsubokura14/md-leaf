"use client";

import { useCallback, useId, useRef, useState, type ComponentType } from "react";
import { MoonIcon, SunIcon, SystemThemeIcon } from "@/components/icons";
import { currentTheme, setTheme, type ThemeChoice } from "@/components/theme";
import { usePopover } from "@/components/use-popover";

// 上の帯のテーマのボタンと、「端末に合わせる」「ライト」「ダーク」から選ぶ枠。
// - ボタンには3つのアイコンを両方とも描いておき、<html> の data-theme-choice に合わせた CSS の変形
//   （theme-system・theme-light・theme-dark。src/app/globals.css）で1つだけ出す。
//   サーバーで作る HTML はどれを選んでいるかを知らないため、React の状態で出し分けると、つながる前に違うアイコンが出る。
//   CSS なら、<head> のスクリプトが印を付けた時点で正しいものが出る。隠したもの（display: none）は読み上げにも出ない
// - 枠は「Aa」の枠（src/components/font-size-menu.tsx）と同じ見た目と閉じ方。選んでも閉じない（選び比べられるように）
// 前提（崩れたら見直す）：選んでいるものは <html> の data-theme-choice だけで決まる（src/components/theme.ts）

type IconComponent = ComponentType<{ className?: string }>;

const CHOICES: { value: ThemeChoice; label: string; Icon: IconComponent }[] = [
  { value: "system", label: "端末に合わせる", Icon: SystemThemeIcon },
  { value: "light", label: "ライト", Icon: SunIcon },
  { value: "dark", label: "ダーク", Icon: MoonIcon },
];

// ボタンのアイコンを出す変形。クラスの名前を組み立てると Tailwind が見つけられないので、そのまま書く
const BUTTON_ICON_CLASS: Record<ThemeChoice, string> = {
  system: `
    hidden
    theme-system:block
  `,
  light: `
    hidden
    theme-light:block
  `,
  dark: `
    hidden
    theme-dark:block
  `,
};

/** 上の帯のテーマのボタンと枠 */
export function ThemeMenu() {
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<ThemeChoice | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const headingId = useId();

  const close = useCallback(() => setOpen(false), []);
  usePopover(open, close, root, button);

  const toggle = () => {
    // 枠は押したあとにしか開かないので、開くときに今選んでいるものを読む
    if (!open) setChoice(currentTheme());
    setOpen(!open);
  };

  const choose = (value: ThemeChoice) => {
    setTheme(value);
    setChoice(value);
  };

  return (
    <div ref={root} className="relative">
      <button
        ref={button}
        type="button"
        aria-label="テーマ"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
        className="
          flex size-10 items-center justify-center rounded-md text-muted
          transition-colors
          hover:bg-surface
        "
      >
        {CHOICES.map(({ value, Icon }) => (
          <span key={value} data-theme-icon={value} className={BUTTON_ICON_CLASS[value]}>
            <Icon className="size-6" />
          </span>
        ))}
      </button>
      {open ? (
        <div
          id={panelId}
          className="
            absolute top-full right-0 z-20 mt-2 w-56 rounded-lg border
            border-border bg-bg p-3 shadow-popover
          "
        >
          <p id={headingId} className="mb-2 text-xs font-bold text-muted">
            テーマ
          </p>
          <div role="radiogroup" aria-labelledby={headingId} className="flex flex-col gap-1">
            {CHOICES.map(({ value, label, Icon }) => {
              const selected = choice === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => choose(value)}
                  className={`
                    flex h-11 items-center gap-3 rounded-md px-3 font-ui text-sm
                    transition-colors
                    hover:bg-surface
                    ${selected ? "bg-surface font-bold text-accent" : "text-muted"}
                  `}
                >
                  <Icon className="size-5 shrink-0" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
