import type { ReactNode } from "react";

type BannerProps = {
  tone: "warning" | "danger";
  title: string;
  children: ReactNode;
};

const toneClasses: Record<BannerProps["tone"], string> = {
  warning: "border-warning/50 bg-warning/10",
  danger: "border-danger/50 bg-danger/10",
};

/** 状態を知らせる帯。地と枠はその色を薄くしたもの */
export function Banner({ tone, title, children }: BannerProps) {
  return (
    <div
      role="alert"
      data-tone={tone}
      className={`
        rounded-md border p-4 text-left text-sm
        ${toneClasses[tone]}
      `}
    >
      <p className="font-bold">{title}</p>
      <p className="mt-2 leading-relaxed text-muted">{children}</p>
    </div>
  );
}
