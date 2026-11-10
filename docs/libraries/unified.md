# unified（remark・rehype）

書いた時点のバージョン：unified 11.0.5、remark-parse 11.0.0、remark-gfm 4.0.1、remark-frontmatter 5.0.0、remark-rehype 11.1.2、rehype-stringify 10.0.1

## 何か

文章を構文の木にして、プラグインで加工し、文字に戻す仕組み。Markdown の木（mdast）を扱うプラグインを remark、HTML の木（hast）を扱うプラグインを rehype と呼ぶ。

- 公式：https://unifiedjs.com/
- remark：https://github.com/remarkjs/remark 、rehype：https://github.com/rehypejs/rehype

## このプロジェクトで使っている部分

`src/lib/markdown.ts` の1か所だけで、次の順に通す。

1. `remark-parse`：Markdown を mdast にする
2. `remark-frontmatter`（`["yaml"]`）：先頭の `---` で囲んだ部分を `yaml` の節にする。この節は自前のプラグインで木から外し、`title` を読む（読むのは `yaml`。`docs/libraries/yaml.md`）
3. `remark-gfm`：表・打ち消し線・タスクリストなど、GitHub の書き方を読めるようにする
4. `remark-rehype`：mdast を hast にする。`handlers.html` を差し替え、ノートの中の HTML のタグを文字にしている
5. 自前のプラグインで、`http(s)://` のリンクに `target`・`rel` を付ける
6. `rehype-stringify`：hast を HTML の文字にする

- `processSync` で同期のまま変換する（どのプラグインも同期で動くため）
- 木の型は `@types/mdast`・`@types/hast`、`file.data` の型は `vfile` から読む（どれも unified の依存として引き込まれるが、`src/lib/markdown.ts` が直接読むので `package.json` の devDependencies に明示してある。書いた時点のバージョン：@types/mdast 4.0.4、@types/hast 3.0.5、vfile 6.0.3）
