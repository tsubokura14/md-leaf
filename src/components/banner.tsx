import type { ReactNode } from "react";

type BannerProps = {
  tone: "warning" | "danger";
  title: string;
  children: ReactNode;
  /** 見出しの左に置くアイコン（色は帯の色） */
  icon?: ReactNode;
  /** 本文の下に置くボタン */
  action?: ReactNode;
};

const toneClasses: Record<BannerProps["tone"], string> = {
  warning: "border-warning/50 bg-warning/10",
  danger: "border-danger/50 bg-danger/10",
};

const iconClasses: Record<BannerProps["tone"], string> = {
  warning: "text-warning",
  danger: "text-danger",
};

/** 状態を知らせる帯。地と枠はその色を薄くしたもの */
export function Banner({ tone, title, children, icon, action }: BannerProps) {
  return (
    <div
      role="alert"
      data-tone={tone}
      className={`
        flex gap-3 rounded-md border p-4 text-left text-sm
        ${toneClasses[tone]}
      `}
    >
      {icon ? <div className={`shrink-0 ${iconClasses[tone]}`}>{icon}</div> : null}
      <div className="min-w-0 flex-1">
        <p className="font-bold">{title}</p>
        <p className="mt-2 leading-relaxed text-muted">{children}</p>
        {action ? <div className="mt-3">{action}</div> : null}
      </div>
    </div>
  );
}
