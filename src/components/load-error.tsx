"use client";

import { Banner } from "@/components/banner";
import { Button } from "@/components/button";
import { AlertIcon } from "@/components/icons";

type LoadErrorProps = {
  title: string;
  /** error.tsx の retry。ページの中身を、もう一度読み込んで組み立て直す */
  retry: () => void;
};

/** 読み込めなかったときの、本文の上の danger の帯（docs/ui.md の「状態の見せ方」） */
export function LoadError({ title, retry }: LoadErrorProps) {
  return (
    <div
      className="
        px-4 pt-6 pb-12
        lg:px-10 lg:pt-10
      "
    >
      <div className="mx-auto max-w-prose">
        <Banner
          tone="danger"
          title={title}
          icon={<AlertIcon className="size-5" />}
          action={<Button onClick={() => retry()}>もう一度読み込む</Button>}
        >
          通信が切れている可能性があります。
        </Banner>
      </div>
    </div>
  );
}
