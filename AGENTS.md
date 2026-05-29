# AGENTS.md

> ハッカソン開発用の AI エージェント指示書。チーム全員で共有・更新する。

## プロジェクト概要

- **大会**: 全日本AIハッカソン 2026
- **参加**: 3rd オフライン大阪 / Aブロック / **2026-05-30**
- **チーム**: 2名（{メンバーA}: 実装 / {メンバーB}: 実装）
- **開発時間**: 10:30〜13:30（3時間）
- **目的**: {テーマ告知後に記入}
- **採用アイデア**: [docs/idea.md](docs/idea.md) — **未決定**（候補 → [docs/ideas/](docs/ideas/)）
- **詳細**: [docs/zenkoku-ai-hackathon-2026-regulation-summary.md](docs/zenkoku-ai-hackathon-2026-regulation-summary.md)

## 公開 URL（作品）

| 項目 | 内容 |
|------|------|
| **作品 URL** | http://otameshi1.s3-website-ap-northeast-1.amazonaws.com/ |
| デプロイ | S3 静的 Web ホスティング（`otameshi1` / ap-northeast-1） |
| 記録先 | [docs/demo-script.md](docs/demo-script.md) |
| 確認 | **Google Chrome**（審査要件）。HTTP のため mixed content に注意 |

**13:00 以降は URL を変えない**方針。デプロイ後は必ず Chrome で公開 URL を開いて確認する。

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

- ブレスト → [docs/ideas/](docs/ideas/) に候補追加、[comparison.md](docs/ideas/comparison.md) で議論
- テーマ確定 → 採用案を [docs/idea.md](docs/idea.md) に記録 → **hackathon-design-md** で [DESIGN.md](DESIGN.md)（UI）→ **hackathon-tasks-plan** で [docs/tasks.md](docs/tasks.md) 初期化
- 開発中 → **hackathon-tasks-sync** で進捗更新
- フロント変更後 → `./infra/deploy-s3.ps1` で再デプロイ → 公開 URL を Chrome 確認
- 審査確認 → [docs/demo-script.md](docs/demo-script.md)
- **Git**: main に直接 push 可
- 議論が5分超えたら MVP を削って決める

## ディレクトリ構成

| パス | 用途 |
|------|------|
| `src/frontend/` | React + Vite フロントエンド |
| `src/backend/` | Python バックエンド（Lambda 等） |
| `infra/deploy-s3.ps1` | S3 へビルド・デプロイ |
| `docs/infrastructure-aws.md` | AWS 構成（Amplify/Lambda は将来） |
| `docs/ideas/` | アイデア候補（1ファイル1案） |
| `docs/ideas/comparison.md` | 比較表・チーム議論 |
| `docs/idea.md` | **採用アイデア**（決定後） |
| `DESIGN.md` / `docs/DESIGN.md` | **UI デザインシステム**（[Google design.md](https://github.com/google-labs-code/design.md)） |
| `docs/demo-script.md` | 審査用デモ・**作品 URL** |
| `docs/tasks.md` | 当日タスク |
| `.cursor/skills/` | ハッカソン用 Agent Skills |
| `assets/` | 画像等 |
| `notes/` | 調査メモ（import 禁止） |
| `.env` | 秘匿情報（Git 管理外） |

## 技術スタック

| 項目 | 採用 | 備考 |
|------|------|------|
| インフラ | **AWS** | ap-northeast-1 |
| フロント | **React + Vite** | `src/frontend/` |
| フロント公開 | **S3 静的 Web ホスティング** | `infra/deploy-s3.ps1` |
| バックエンド | Python + Lambda（予定） | API Gateway 連携予定 |
| AI/LLM | Amazon Bedrock（予定） | Model access 要事前有効化 |
| 秘匿情報 | `.env` / SSM Parameter Store | Lambda から参照予定 |
| 将来 | Amplify Hosting | [docs/infrastructure-aws.md](docs/infrastructure-aws.md) |

## コマンド

### フロント開発

```bash
cd src/frontend
npm install
npm run dev
npm run build
```

### AWS・デプロイ

```bash
cp .env.example .env
aws sts get-caller-identity
```

```powershell
# プロジェクトルートから — 再デプロイ（ビルド + S3 同期）
./infra/deploy-s3.ps1

# 初回（バケット作成 + 公開設定）
./infra/deploy-s3.ps1 -CreateBucket -MakePublic
```

### バックエンド（Python）

```powershell
cd src/backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install black ruff boto3
```

## Cursor Skills

タスクに応じて `.cursor/skills/` を参照:

| Skill | 用途 |
|-------|------|
| `hackathon-ideation` | アイデア出し |
| `hackathon-design-md` | UI デザインシステム（DESIGN.md） |
| `hackathon-tasks-plan` / `hackathon-tasks-sync` | タスク計画・進捗 |
| `hackathon-bedrock` | Bedrock / Lambda / API 実装 |

## 開発方針

- **動く Web 作品**を最優先（アイデアのみは評価されない）
- **3分審査** — ログイン不要・主要操作が3分で完結
- プレゼン準備時間は使わない → 開発に全振り
- フロント UI は `DESIGN.md` の tokens に従う（未作成時は作成を提案）
- テーマ適合・AI活用度・実装度を意識

## コーディング規約

- 変数・関数: 英語
- コメント: 非自明なロジックのみ（日本語可）
- 外部 API: try-catch 必須。キーは `.env` から読む
- `.py` 保存時: Cursor Hook が black / ruff --fix を実行（インストール済みの場合）

## AI エージェント向け指示

### やること

- `docs/idea.md`（採用案）と `DESIGN.md`（UI tokens）を確認してからフロント実装
- 1 依頼 = 1 機能。小さな差分で
- フロント変更後は `./infra/deploy-s3.ps1` でデプロイし、**公開 URL を Chrome で確認**
- **13:30 前**に審査員が操作できる状態にする
- 操作フローを [docs/demo-script.md](docs/demo-script.md) に整理・更新

### やらないこと

- API キー・`.env` をコード・ログ・チャットに出力
- **10:30 前**の本番向け実装（企画・調査・インフラ準備は可）
- スライド・プレゼン資料・QR の作成（不要）
- 大規模リファクタ（提案のみ）
- デモに不要な機能追加
- `git add .env` や force push（Hook がブロック）

### 判断に迷ったら

1. 13:30 に審査員が Chrome で **公開 URL** を操作できるか？
2. 3分以内に体験できるか？
3. 残り時間で終わるか？

## 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-05-29 | 初版（3rd大阪 Aブロック・応募要項準拠） |
| 2026-05-29 | AWS インフラ予定を追記 |
| 2026-05-29 | tasks-plan / tasks-sync Skill 追加 |
| 2026-05-29 | 公開 URL・S3 デプロイ・React/Vite・design-md Skill を反映 |
