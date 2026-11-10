import "./note-body.css";

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
      <article className="reading mx-auto max-w-prose font-body">
        <h1 className="text-2xl leading-tight font-bold">{title}</h1>
        <div className="note-body mt-6" dangerouslySetInnerHTML={{ __html: html }} />
      </article>
    </div>
  );
}
