// アイコンは数が少ないので、ライブラリを入れずに SVG を手で書く。色は currentColor（文字の色）に従う
type IconProps = { className?: string };

function Svg({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

/** 若葉。アプリの印 */
export function LeafIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 20c0-8 5-14 16-16 0 9-5 16-16 16Z" />
      <path d="M4 20 13 11" />
    </Svg>
  );
}

/** 人。ログインのボタン */
export function PersonIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </Svg>
  );
}

/** ログアウト。外へ出る矢印 */
export function LogoutIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      <path d="M15 12H4" />
      <path d="m8 8-4 4 4 4" />
    </Svg>
  );
}
