# yaml

書いた時点のバージョン：2.9.1

## 何か

YAML を読み書きするライブラリ。

- 公式：https://eemeli.org/yaml/

## このプロジェクトで使っている部分

- 保管庫の検査（`scripts/check-content.mjs`）で、ノートのフロントマター（`remark-frontmatter` が作った `yaml` の節）を `parse` で読み、`title` があるかを確かめる。読めない YAML は例外になるので、受け止めて「title なし」として扱う
- 表示のときにフロントマターから題を読むのは kinari-md の中（`docs/libraries/kinari-md.md`）
