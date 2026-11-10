import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { icon?: ReactNode };

/** 主なボタン以外のボタン。bg の地に border の枠（docs/ui.md の「部品の使い分け」） */
export function Button({ icon, children, className = "", ...props }: ButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={`
        flex items-center justify-center gap-3 rounded-md border border-border
        bg-bg px-4 py-3 text-sm font-medium text-text transition-colors
        hover:bg-surface
        ${className}
      `}
    >
      {icon}
      {children}
    </button>
  );
}
