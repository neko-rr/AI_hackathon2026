# アイデア比較・チーム議論

> 全候補のスコアと議論メモ。**最終決定後** → [idea.md](../idea.md) を更新。

## 議論ルール（目安）

| 開発時間 | 議論上限 |
|----------|----------|
| 3時間以下 | 5分 |
| 半日 | 15分 |
| 1日 | 30分 |

超えたら **A（時間内完結）が最も高い案** を優先。

## テーマ解釈（2026-05-30 合意前の案）

| 解釈 | 内容 | 作品例 |
|------|------|--------|
| **直球** | 風力・水力・蒸気などの**ターボ機械** | 02, 04, 06 |
| **比喩** | **入力→回転→出力**のエネルギー変換 | 03, 04, 07 |
| **循環** | 止まらない流れ・世界が回る（平沢進「世界タービン」的） | 03 — 説明コスト高 |

**やらないこと:** タービンと無関係の機能、審査員向け専門用語だらけのUI

出典: [コトバンク](https://kotobank.jp/word/%E3%81%9F%E3%83%BC%E3%81%B3%E3%82%93-3158401) / [ターボ機械協会](https://www.turbo-so.jp/turbo-kids1.html)

## 比較表

| ID | 名称 | ピッチ（短） | A | B | C | D | E | 計 | ステータス | ファイル |
|----|------|-------------|---|---|---|---|---|-----|-----------|----------|
| 01 | 寄木日記 | 日記→木目ピースで寄木細工完成 | 3 | 0 | 3 | 3 | 2 | 11 | rejected | [01-yosegi-diary.md](01-yosegi-diary.md) |
| 02 | かぜでうごく発電タービン | 風を選ぶ→回転→AIが発電を解説 | 3 | 3 | 3 | 3 | 2 | 14 | shortlisted | [02-wind-turbine-demo.md](02-wind-turbine-demo.md) |
| 03 | 言葉タービン | モヤモヤ→回転→今日の一歩 | 3 | 2 | 3 | 2 | 2 | 12 | shortlisted | [03-word-turbine.md](03-word-turbine.md) |
| 04 | 蒸気タービン要約 | 長文→蒸気で回転→3行要約 | 3 | 2 | 3 | 3 | 2 | 13 | shortlisted | [04-steam-summary-turbine.md](04-steam-summary-turbine.md) |
| 05 | アイデアタービン | 困りごと→3案ルーレット | 2 | 2 | 2 | 2 | 2 | 10 | candidate | [05-idea-spin-turbine.md](05-idea-spin-turbine.md) |
| 06 | タービン組み立て図鑑 | 3種類から選んで仕組み学習 | 3 | 3 | 3 | 2 | 2 | 13 | candidate | [06-turbine-builder.md](06-turbine-builder.md) |
| 07 | タービン日記 | 日記で羽根が光る | 2 | 2 | 3 | 2 | 2 | 11 | candidate | [07-turbine-diary.md](07-turbine-diary.md) |
| 08 | ことば連鎖タービン | 文章→ピタゴラ連鎖→タービン→電気 | 2 | 3 | 3 | 2 | 2 | 12 | shortlisted | [08-pythagora-turbine-chain.md](08-pythagora-turbine-chain.md) |

**ステータス:** `candidate` → `shortlisted`（上位3）→ `selected`（1案）/ `rejected`

## スコア凡例

[mvp-scorer.md](../../.cursor/skills/hackathon-ideation/mvp-scorer.md) — 各3点満点、合計15点。9点未満は非推奨。

## チーム投票・議論メモ

### 第1回（2026-05-30）

- **テーマ:** **タービン**
- **開発:** 10:30〜13:30
- **参加者:**
- **shortlisted:** 02, 04, **08**（08=ピタゴラ連鎖案。デモ映え最大だがアニメ工数に注意）
- **メモ:** 01 rejected。08は02+04+03の合成。連鎖は固定4段に絞れば3時間可。

### 最終決定（{日付}）

- **selected:** 
- **理由:**
- **却下案と理由:**

## 次のアクション

- [ ] `comparison.md` で shortlisted を確定
- [ ] 採用案を [idea.md](../idea.md) に反映
- [ ] [demo-script.md](../demo-script.md) を更新
- [ ] [tasks.md](../tasks.md) にタスク分解
