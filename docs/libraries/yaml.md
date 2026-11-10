# yaml

書いた時点のバージョン：2.9.1

## 何か

YAML を読み書きするライブラリ。

- 公式：https://eemeli.org/yaml/

## このプロジェクトで使っている部分

- `src/lib/markdown.ts` で、ノートのフロントマターを `parse` で読み、`title` だけを取り出す。読めない YAML は例外になるので、受け止めて「title なし」として扱う
