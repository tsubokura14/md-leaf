type SkeletonProps = {
  /** 大きさ（幅・高さ） */
  className: string;
};

/** 読み込み中の灰色の枠。ゆっくり点滅させる（docs/ui.md の「状態の見せ方」） */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={`
        animate-pulse rounded-md bg-surface
        ${className}
      `}
    />
  );
}

/** 本文の位置に、出る形のスケルトンを並べる枠。読み上げでは「読み込み中」とだけ伝える */
export function SkeletonPage({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="status"
      aria-label="読み込み中"
      className="
        px-4 pt-6 pb-12
        lg:px-10 lg:pt-10
      "
    >
      <div className="mx-auto max-w-prose">{children}</div>
    </div>
  );
}
