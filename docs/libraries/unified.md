# unified（remark）

書いた時点のバージョン：unified 11.0.5、remark-parse 11.0.0、remark-gfm 4.0.1、remark-frontmatter 5.0.0、remark-math 6.0.0

## 何か

文章を構文の木にして、プラグインで加工し、文字に戻す仕組み。Markdown の木（mdast）を扱うプラグインを remark と呼ぶ。

- 公式：https://unifiedjs.com/
- remark：https://github.com/remarkjs/remark

## このプロジェクトで使っている部分

アプリの表示の変換（Markdown から HTML）は kinari-md の中で unified を使う（`docs/libraries/kinari-md.md`）。md-leaf が直接使うのは、保管庫の検査（`scripts/check-content.mjs`）だけ。

- `unified().use(remarkParse).use(remarkGfm).use(remarkFrontmatter).use(remarkMath)` の `parse` で、ノートを mdast にする（HTML にはしない）
  - `remark-frontmatter`：先頭の `---` で囲んだ部分を `yaml` の節にする。中の `title` は `yaml` で読む（`docs/libraries/yaml.md`）
  - `remark-gfm`・`remark-math`：表や数式の中の文字を、リンクや `[[ ]]` と見間違えないように、表示と同じ読み方で木にする（`docs/libraries/remark-math.md`）
- 木の `link`・`image` の節の `url` からリンク切れ・画像切れを探し、`code`・`inlineCode`・`math`・`inlineMath`・`yaml` の節の範囲を伏せてから `[[ ]]` を探す
- 版は kinari-md の依存と同じにしてあり、`node_modules` には1つだけ入る
