import "katex/dist/katex.min.css";
import "./note-body.css";
import { NoteBodyContent } from "./note-body-content";

type NoteBodyProps = {
  title: string;
  /** src/lib/markdown.ts が作った HTML。ノートの中の HTML のタグは、そこで文字にしてある */
  html: string;
};

/** ノートの題と本文。本文の要素の見た目は note-body.css */
export function NoteBody({ title, html }: NoteBodyProps) {
  return (
    <div
      className="
        px-4 pt-6 pb-12
        lg:px-10 lg:pt-10
      "
    >
      {/* .reading は本文の文字の大きさ（tokens.css）を当てる場所で、上の帯の「Aa」を出す目印にもなる
          （src/components/font-size-menu.tsx）。本文がない画面では .reading を使わない */}
      <article className="reading mx-auto max-w-prose font-body">
        <h1 className="text-2xl leading-tight font-bold">{title}</h1>
        <NoteBodyContent html={html} />
      </article>
    </div>
  );
}
