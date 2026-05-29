# 全日本AIハッカソン 2026

3rd オフライン大阪（Aブロック）向けのハッカソン開発リポジトリ。

## 公開 URL（作品）

| 項目 | 内容 |
|------|------|
| **作品 URL** | http://otameshi1.s3-website-ap-northeast-1.amazonaws.com/ |
| デプロイ先 | AWS S3 静的 Web ホスティング（`otameshi1` / ap-northeast-1） |
| 確認 | **Google Chrome** でアクセス（審査要件） |

## 参加情報

| 項目 | 内容 |
|------|------|
| 大会 | [全日本AIハッカソン 2026](https://www.aifestival.jp/hackathon) |
| ラウンド | 3rd オフライン大阪 |
| 日時 | **2026年5月30日（土）** |
| ブロック | **A**（10:15 集合） |
| 会場 | TKPガーデンシティ大阪梅田 |
| 開発 | 10:30〜13:30（3時間） |
| 審査 | 13:30〜（審査員が Chrome で操作・3分/チーム） |

当日タスク → [docs/tasks.md](docs/tasks.md)  
審査デモ確認 → [docs/demo-script.md](docs/demo-script.md)

## 技術スタック

| 項目 | 採用 | 備考 |
|------|------|------|
| フロント | **React + Vite** | `src/frontend/` |
| バックエンド | Python（予定） | `src/backend/` — Lambda 等 |
| AI/LLM | Amazon Bedrock（予定） | ap-northeast-1 |
| インフラ | **AWS** | 現状: S3 静的ホスティング |
| 将来 | Amplify / API Gateway + Lambda | [docs/infrastructure-aws.md](docs/infrastructure-aws.md) |

## クイックスタート

### フロント開発

```bash
cd src/frontend
npm install
npm run dev
```

### AWS 認証

```bash
cp .env.example .env
aws sts get-caller-identity
```

### デプロイ（S3）

PowerShell（プロジェクトルートから）:

```powershell
# 初回（バケット作成 + 公開設定）
./infra/deploy-s3.ps1 -CreateBucket -MakePublic

# 2回目以降（ビルド + 同期）
./infra/deploy-s3.ps1
```

詳細 → [infra/deploy-s3.ps1](infra/deploy-s3.ps1)

## ディレクトリ

| パス | 用途 |
|------|------|
| `src/frontend/` | React（Vite）フロントエンド |
| `src/backend/` | Python バックエンド（Lambda 等） |
| `infra/` | デプロイスクリプト（`deploy-s3.ps1`） |
| `docs/ideas/` | アイデア候補・比較・議論 |
| `docs/idea.md` | **採用アイデア**（決定後） |
| `docs/` | 要約・tasks・demo-script |
| `assets/` | 画像等 |
| `notes/` | 調査メモ |
| `.cursor/skills/` | Cursor Agent Skills（ハッカソン用） |
| `AGENTS.md` | AI エージェント向け指示書 |

## ドキュメント

| ファイル | 内容 |
|---------|------|
| [docs/zenkoku-ai-hackathon-2026-summary.md](docs/zenkoku-ai-hackathon-2026-summary.md) | 大会要約 |
| [docs/zenkoku-ai-hackathon-2026-regulation-summary.md](docs/zenkoku-ai-hackathon-2026-regulation-summary.md) | レギュレーション要約 |
| [docs/541e41_4d0b0cf38e33481e95ba992d25d2ac5d.pdf](docs/541e41_4d0b0cf38e33481e95ba992d25d2ac5d.pdf) | レギュレーション原文（[公式URL](https://85f0713d-c3eb-4af4-873c-6f22c38c681b.filesusr.com/ugd/541e41_4d0b0cf38e33481e95ba992d25d2ac5d.pdf)） |
| [docs/ideas/](docs/ideas/) | アイデア候補・比較 |
| [docs/idea.md](docs/idea.md) | 採用アイデア（**未決定**） |
| [docs/tasks.md](docs/tasks.md) | 当日タスク・役割分担 |
| [docs/demo-script.md](docs/demo-script.md) | 審査用デモ確認 |
| [docs/infrastructure-aws.md](docs/infrastructure-aws.md) | AWS 構成（予定） |
| [notes/aws-prep-checklist.md](notes/aws-prep-checklist.md) | AWS 事前準備 |
| [AGENTS.md](AGENTS.md) | AI エージェント指示書 |

## Cursor Skills

`.cursor/skills/` にハッカソン用 Skill を配置:

| Skill | 用途 |
|-------|------|
| `hackathon-ideation` | アイデア出し |
| `hackathon-design-md` | UI デザインシステム（[Google design.md](https://github.com/google-labs-code/design.md)） |
| `hackathon-tasks-plan` / `hackathon-tasks-sync` | タスク計画・進捗更新 |
| `hackathon-bedrock` | Bedrock / Lambda パターン |

## チーム運用（概要）

1. ブレスト → `docs/ideas/` + `comparison.md`
2. テーマ確定 → `docs/idea.md` → `DESIGN.md`（UI）→ `docs/tasks.md`
3. 開発 → デプロイ → 公開 URL を `docs/demo-script.md` に記録
4. 審査後 → 作品 URL を事務局に提出

## ライセンス

ハッカソン作品用。大会ルールに従う。
