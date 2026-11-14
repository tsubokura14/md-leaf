個人の開発で、ブランチをどう切ってどう片付けるかのメモ。迷ったらここに戻ってくる。詳しいリリースの流れは [リリースの手順](リリースの手順.md) に分けた。

> [!tip]
> main には直接コミットしない。小さな修正でもブランチを切ると、あとで履歴を追いやすい。

## 流れ

Issue からブランチを作り、PR でまとめて main へ入れる。

```mermaid
flowchart LR
  Issue --> ブランチ --> PR --> main
```

## よく使うコマンド

```sh
# ブランチを作って移る
git switch -c 12-due-date-input

# main の変更を取り込む
git fetch origin
git rebase origin/main

# マージ済みのブランチを消す
git branch -d "12-due-date-input"
```

## ブランチ名の決まり

| 種類 | 形 | 例 |
| --- | --- | --- |
| 機能 | `番号-名前` | `12-due-date` |
| 修正 | `番号-fix-名前` | `15-fix-login` |
| 試し | `try-名前` | `try-mermaid` |

### 番号を先に書く理由

一覧で並べたときに Issue の順になり、どの話のブランチかがすぐ分かる。

## 注意

> [!warning]
> push したあとのブランチで rebase をしない。ほかの端末の作業とずれる。

> [!info]- 消してしまったブランチを戻すには
> `git reflog` で消す前のコミットを探し、`git switch -c <名前> <コミット>` で作り直す。

## かかる時間の見積もり

タスクごとの時間を足し、見直しの分として 1.2 倍にする。

$$
T = 1.2 \times \sum_{i=1}^{n} t_i
$$

## ブランチの図

![ブランチの図](branch-graph.png)
