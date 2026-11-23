import {
  type Heading,
  renderMarkdown as renderWithKinari,
  type RenderedMarkdown,
  type Resolve,
} from "kinari-md/markdown";
import { imageContentType } from "./note-files";
import { resolveImageSrc } from "./note-images";
import { resolveNoteLink } from "./note-links";

export type { Heading, RenderedMarkdown };

export type NoteLinkContext = {
  /** リンクを書いたノートのパス（コンテンツフォルダから、.md を除く） */
  fromPath: string;
  /** 一覧にある全部のノートのパス（ホームの index を含む） */
  notePaths: ReadonlySet<string>;
  /** コンテンツフォルダの中の、対象の拡張子の画像のパス（コンテンツフォルダから、拡張子つき） */
  filePaths: ReadonlySet<string>;
};

// 相対のリンクと画像の行き先を、md-leaf の決まり（ノートの URL・コンテンツフォルダ）で決める
function noteResolver(links: NoteLinkContext): Resolve {
  return ({ kind, href }) => {
    if (kind === "link") {
      const resolved = resolveNoteLink(href, links.fromPath);
      if (!resolved) return undefined;
      return {
        href: resolved.href,
        missing: resolved.path === undefined || !links.notePaths.has(resolved.path),
      };
    }
    const resolved = resolveImageSrc(href, links.fromPath);
    if (!resolved) return undefined;
    return {
      href: resolved.src,
      missing:
        resolved.path === undefined ||
        imageContentType(resolved.path) === undefined ||
        !links.filePaths.has(resolved.path),
    };
  };
}

/** links がなければ、リンクと画像を書き換えない（一覧の名前を読むときは要らないため） */
export function renderMarkdown(source: string, links?: NoteLinkContext): RenderedMarkdown {
  return renderWithKinari(source, links ? { resolve: noteResolver(links) } : {});
}
