# アイデア候補（docs/ideas/）

チームで **複数案を並べて議論** するためのフォルダ。

## フォルダ構成

```
docs/ideas/
├── README.md           ← このファイル（使い方）
├── comparison.md       ← 比較表・議論メモ・投票
├── template.md         ← 新規アイデアの雛形
├── 01-yosegi-diary.md  ← 候補アイデア（1ファイル1案）
├── 02-{slug}.md
└── ...

docs/idea.md            ← 【採用案のみ】決定後に更新
```

## ワークフロー

```
1. ブレスト → 候補を docs/ideas/NN-slug.md に追加
2. 採点     → comparison.md の比較表を更新
3. 議論     → shortlisted（上位3）を決める
4. 決定     → 1案を selected → docs/idea.md に反映
5. 開発     → idea.md の MVP を実装
```

## ファイル命名

| 形式 | 例 |
|------|-----|
| `{NN}-{slug}.md` | `01-yosegi-diary.md`, `02-voice-memo-ai.md` |

- `NN`: 2桁連番（01, 02, …）
- `slug`: 英小写・ハイフン区切り

## ステータス

| 値 | 意味 |
|----|------|
| `candidate` | 候補（発散直後） |
| `shortlisted` | 議論対象（上位3） |
| `selected` | 採用（1案のみ） |
| `rejected` | 却下（理由を comparison.md に記録） |

## 新規アイデアの追加

```bash
cp docs/ideas/template.md docs/ideas/02-my-idea.md
# 編集後、comparison.md の行を追加
```

Cursor では:

```
hackathon-ideation live でブレスト → docs/ideas/ に候補ファイルを追加
```

## 関連

- 採用案: [idea.md](../idea.md)
- 比較・議論: [comparison.md](comparison.md)
- Skill: [.cursor/skills/hackathon-ideation/](../../.cursor/skills/hackathon-ideation/SKILL.md)
