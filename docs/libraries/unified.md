# unified（remark・rehype）

書いた時点のバージョン：unified 11.0.5、remark-parse 11.0.0、remark-gfm 4.0.1、remark-frontmatter 5.0.0、remark-math 6.0.0、remark-rehype 11.1.2、rehype-stringify 10.0.1

## 何か

文章を構文の木にして、プラグインで加工し、文字に戻す仕組み。Markdown の木（mdast）を扱うプラグインを remark、HTML の木（hast）を扱うプラグインを rehype と呼ぶ。

- 公式：https://unifiedjs.com/
- remark：https://github.com/remarkjs/remark 、rehype：https://github.com/rehypejs/rehype

## このプロジェクトで使っている部分

`src/lib/markdown.ts` の1か所だけで、次の順に通す。自前のプラグインは、ブロックごとに `src/lib/` の別のファイルに分けてある。

1. `remark-parse`：Markdown を mdast にする
2. `remark-frontmatter`（`["yaml"]`）：先頭の `---` で囲んだ部分を `yaml` の節にする。この節は自前のプラグインで木から外し、`title` を読む（読むのは `yaml`。`docs/libraries/yaml.md`）
3. `remark-gfm`：表・打ち消し線・タスクリストなど、GitHub の書き方を読めるようにする
4. `remark-math`：`$...$`・`$$...$$` を数式の節にする（`docs/libraries/remark-math.md`）
5. 自前のプラグイン（`src/lib/callouts.ts`）：`[!種類]` で始まる `blockquote` に、`data.hName`・`data.hProperties` でコールアウトの hast の形を指定する
6. `remark-rehype`：mdast を hast にする。`handlers.html` を差し替え、ノートの中の HTML のタグを文字にしている
7. 自前のプラグインで、hast を加工する
   - `http(s)://` のリンクに `target`・`rel` を付ける（`markdown.ts`）
   - `.md` の相対リンクをノートの URL に書き換える（`markdown.ts`。決め方は `src/lib/note-links.ts`）
   - 画像の相対パスを `/files/` の URL に書き換え、画像だけの段落を `figure` にする（`src/lib/note-images.ts`）
   - 数式を KaTeX で HTML にする（`src/lib/math.ts`。`docs/libraries/katex.md`）
   - コードを highlight.js で色分けし、mermaid のコードに印を付ける（`src/lib/highlight.ts`。`docs/libraries/highlight.js.md`）
   - 表を横にスクロールする枠で包む（`src/lib/tables.ts`）
8. `rehype-stringify`（`allowDangerousHtml: true`）：hast を HTML の文字にする。KaTeX と highlight.js の結果は `raw` ノード（HTML の文字列）で入れてあり、そのまま出す

- リンクと画像の書き換えに要るもの（ノートのパス、ノートと画像のパスの一覧）は、呼ぶたびに違うので、processor を作り直さずに `VFile` の `data` で渡す
- `processSync` で同期のまま変換する（どのプラグインも同期で動くため）
- 木の型は `@types/mdast`・`@types/hast`、`file.data` の型は `vfile` から読む（どれも unified の依存として引き込まれるが、`src/lib/markdown.ts` が直接読むので `package.json` の devDependencies に明示してある。書いた時点のバージョン：@types/mdast 4.0.4、@types/hast 3.0.5、vfile 6.0.3）
