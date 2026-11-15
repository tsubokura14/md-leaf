# remark-cjk-friendly

書いた時点のバージョン：2.3.4

## 何か

CommonMark の強調（`**`・`*`）を、日本語・中国語・韓国語の括弧・句読点の前後でも強調として読ませる remark のプラグイン。中身は micromark の拡張（micromark-extension-cjk-friendly）で、Markdown の仕様に日本語の強調を足す提案（commonmark-spec の issue 650）の実装。

- 公式：https://github.com/tats-u/markdown-cjk-friendly

## このプロジェクトで使っている部分

- `src/lib/markdown.ts` で、`remarkParse` のすぐあとに `.use(remarkCjkFriendly)` で足す（オプションは既定のまま）
- `_`・`__` は、語の中の `_` で閉じない CommonMark の決まりのままなので、`__用語（読み）__とは` は強調にならない（仕様の「やらないこと」）
- 取り消し線（`~~`）には効かない（別のパッケージが要る。使っていない）
