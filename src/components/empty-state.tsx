import type { ReactNode } from "react";

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description: string;
  /** 戻る先があるときのボタン */
  action?: ReactNode;
};

/** 0件・見つからないときの、画面の中央の案内（docs/ui.md の「状態の見せ方」） */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center px-6 pt-24 pb-12 text-center">
      <div className="text-muted">{icon}</div>
      <h1 className="mt-6 text-lg font-bold">{title}</h1>
      <p className="mt-3 text-sm leading-normal text-muted">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
