import "katex/dist/katex.min.css";
import "./note-body.css";
import type { Heading } from "@/lib/markdown";
import { NoteBodyContent } from "./note-body-content";
import { NoteToc } from "./toc";

type NoteBodyProps = {
  title: string;
  /** src/lib/markdown.ts が作った HTML。ノートの中の HTML のタグは、そこで文字にしてある */
  html: string;
  /** 目次に出す見出し（src/lib/markdown.ts。kinari-md の見出しの一覧） */
  headings: Heading[];
};

/** ノートの題と本文と目次。本文の要素の見た目は note-body.css */
export function NoteBody({ title, html, headings }: NoteBodyProps) {
  return (
    // data-note は、目次が押された見出しを探す範囲（src/components/toc.tsx）
    <div
      data-note=""
      className="
        px-4 pt-6 pb-12
        lg:px-10 lg:pt-10
      "
    >
      {/* 広い PC では、本文と右の目次を横に並べ、2つを合わせた幅で中央に寄せる */}
      <div
        className="
          xl:flex xl:justify-center xl:gap-10
        "
      >
        {/* .reading は本文の文字の大きさ（tokens.css）を当てる場所で、上の帯の「Aa」を出す目印にもなる
            （src/components/font-size-menu.tsx）。本文がない画面では .reading を使わない。
            目次は .reading の外に置き、本文の文字の大きさで変わらないようにする */}
        <article
          className="
            reading mx-auto max-w-prose font-body
            xl:mx-0 xl:max-w-wide xl:min-w-0 xl:flex-1
          "
        >
          <h1 className="text-2xl leading-tight font-bold">{title}</h1>
          <NoteBodyContent html={html} />
        </article>
        <NoteToc headings={headings} />
      </div>
    </div>
  );
}
