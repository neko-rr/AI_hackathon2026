# AGENTS.md

> ハッカソン開発用の AI エージェント指示書。チーム全員で共有・更新する。

## プロジェクト概要

- **大会**: 全日本AIハッカソン 2026
- **参加**: 3rd オフライン大阪 / Aブロック / **2026-05-30**
- **チーム**: 2名（{メンバーA}: 実装 / {メンバーB}: 実装）
- **開発時間**: 10:30〜13:30（3時間）
- **目的**: {テーマ告知後に記入}
- **詳細**: [docs/zenkoku-ai-hackathon-2026-regulation-summary.md](docs/zenkoku-ai-hackathon-2026-regulation-summary.md)

## ハッカソン制約

正: [3rdラウンド応募要項](https://www.aifestival.jp/hackathon/entry-2026-3)

| 項目 | 内容 |
|------|------|
| 作品 | **Google Chrome** で体験できる Web 作品 |
| 審査 | 審査員が作品を操作（**3分/チーム**、質疑含む） |
| プレゼン | **不要**（スライド・登壇なし） |
| 提出 | ハッカソン終了後、**Web作品URL**を事務局に提出 |
| 開発開始 | **10:30**（テーマ告知後） |
| 審査前 | **13:30** までに公開 URL で Chrome 動作確認 |

## 当日マイルストーン（Aブロック）

| 時刻 | 内容 |
|------|------|
| 10:15 | 集合 |
| 10:30 | 開発開始 |
| 12:00 | Chrome で MVP 動作確認 |
| 13:00 | 公開 URL 確定 |
| 13:30 | 審査開始 |
| 終了後 | URL を事務局に提出 |

## チーム運用

- テーマ確定 → [docs/idea.md](docs/idea.md) に MVP を記録
- 進捗 → [docs/tasks.md](docs/tasks.md)
- 審査確認 → [docs/demo-script.md](docs/demo-script.md)
- **Git**: main に直接 push 可
- 議論が5分超えたら MVP を削って決める

## ディレクトリ構成

| パス | 用途 |
|------|------|
| `src/frontend/` | フロントエンド |
| `src/backend/` | Lambda 等バックエンド |
| `infra/` | AWS デプロイ設定 |
| `docs/infrastructure-aws.md` | AWS 構成・事前準備 |
| `docs/` | 要約・idea・tasks・demo-script |
| `assets/` | 画像等 |
| `notes/` | 調査メモ（import 禁止） |
| `.env` | 秘匿情報（Git 管理外） |

## 技術スタック

| 項目 | 採用 | 備考 |
|------|------|------|
| インフラ | **AWS** | ap-northeast-1 |
| フロント | Amplify Hosting | {言語/FW は 10:30 前に決定} |
| バックエンド | API Gateway + Lambda | |
| AI/LLM | Amazon Bedrock | Model access 要事前有効化 |
| 秘匿情報 | SSM Parameter Store | Lambda から参照 |

詳細 → [docs/infrastructure-aws.md](docs/infrastructure-aws.md)

## コマンド

```bash
cp .env.example .env

# AWS 認証確認
aws sts get-caller-identity

# {TODO: スタック確定後に追記}
# cd infra && sam deploy
```

## 開発方針

- **動く Web 作品**を最優先（アイデアのみは評価されない）
- **3分審査** — ログイン不要・主要操作が3分で完結
- プレゼン準備時間は使わない → 開発に全振り
- 新規 FW より既知スタックを優先
- テーマ適合・AI活用度・実装度を意識

## コーディング規約

- 変数・関数: 英語
- コメント: 非自明なロジックのみ（日本語可）
- 外部 API: try-catch 必須。キーは `.env` から読む

## AI エージェント向け指示

### やること

- `docs/idea.md` の MVP を確認してから実装
- 1 依頼 = 1 機能。小さな差分で
- **13:30 前**に Chrome + 公開 URL で動作確認
- 審査員が触る操作フローを `docs/demo-script.md` に整理

### やらないこと

- API キー・`.env` をコード・ログに出力
- **10:30 前**の実装コード（企画・調査のみ可）
- スライド・プレゼン資料・QR の作成（不要）
- 大規模リファクタ（提案のみ）
- デモに不要な機能追加

### 判断に迷ったら

1. 13:30 に審査員が Chrome で操作できるか？
2. 3分以内に体験できるか？
3. 残り時間で終わるか？

## 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-05-29 | 初版（3rd大阪 Aブロック・応募要項準拠） |
| 2026-05-29 | AWS インフラ予定を追記 |
