# kinari-md

書いた時点のバージョン：0.1.1（`github:tsubokura14/kinari-md#v0.1.1`）

## 何か

シリーズのアプリ（md-leaf、memory-forge）で共有する、Markdown の変換と本文の見た目のパッケージ。中で unified（remark・rehype）・highlight.js・KaTeX・yaml・mermaid を使う。npm には出しておらず、GitHub のタグを指定して入れる。TypeScript のまま配っている。

- リポジトリ：https://github.com/tsubokura14/kinari-md （使い方は README、動きは `docs/specs/markdown.md`、版ごとの違いは `CHANGELOG.md`）

## このプロジェクトで使っている部分

- `next.config.ts` の `transpilePackages: ["kinari-md"]` で、アプリのビルドの中で TypeScript を変換する。Vitest は設定を足さずに読める
- `kinari-md/markdown`：`src/lib/markdown.ts` が `renderMarkdown(source, { resolve })` を呼ぶ
  - `resolve` は、相対のリンクと画像ごとに呼ばれる関数。md-leaf の決まり（`src/lib/note-links.ts` の `resolveNoteLink`、`src/lib/note-images.ts` の `resolveImageSrc`）で行き先を決め、`{ href, missing }` を返す。`missing` のものは `brokenLinks`・`brokenImages` に入る
  - 書き換えたリンクには `data-internal-link` が付く。`src/components/note-body-content.tsx` がこれを見て `router.push` で移る
  - 題（フロントマターの `title`）と見出しの一覧（型 `Heading`）も一緒に返る
- `kinari-md/body.css`：`src/components/note-body.tsx` が読む。本文の入れ物 `.kinari-body` の中の見た目（KaTeX の CSS も中で読む）。本文の文字の大きさは `--reading-size` を読む
- `kinari-md/tokens.css`：`src/app/globals.css` が md-leaf のトークンのあとに読む。Markdown だけが使う色（コードの色分け・コールアウトの abstract・important・caution）と表の列の幅。`<html>` の `data-theme` でライト・ダークが切り替わる
- `kinari-md/mermaid`：`src/components/note-body-content.tsx` が `useEffect` で `drawMermaid(本文の入れ物)` を呼び、返った関数で後片付けする。`data-theme` が変わると描き直す
- 版を上げるときは `npm install github:tsubokura14/kinari-md#<タグ>` で入れ直す
