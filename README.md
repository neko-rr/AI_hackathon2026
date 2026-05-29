# 全日本AIハッカソン 2026

ハッカソン用プロジェクト。

## 参加予定

| 項目 | 内容 |
|------|------|
| ラウンド | 3rd オフライン大阪 |
| 日時 | 2026年5月30日（土） |
| ブロック | **A**（10:15集合） |
| 会場 | TKPガーデンシティ大阪梅田 |

当日タスク → [docs/tasks.md](docs/tasks.md)

## ドキュメント

| ファイル | 内容 |
|---------|------|
| [docs/zenkoku-ai-hackathon-2026-summary.md](docs/zenkoku-ai-hackathon-2026-summary.md) | 大会要約 |
| [docs/zenkoku-ai-hackathon-2026-regulation-summary.md](docs/zenkoku-ai-hackathon-2026-regulation-summary.md) | レギュレーション要約 |
| [docs/541e41_4d0b0cf38e33481e95ba992d25d2ac5d.pdf](docs/541e41_4d0b0cf38e33481e95ba992d25d2ac5d.pdf) | レギュレーション原文（[公式URL](https://85f0713d-c3eb-4af4-873c-6f22c38c681b.filesusr.com/ugd/541e41_4d0b0cf38e33481e95ba992d25d2ac5d.pdf)） |
| [docs/idea.md](docs/idea.md) | アイデア・コンセプト |
| [docs/tasks.md](docs/tasks.md) | 当日タスク・役割分担 |
| [docs/demo-script.md](docs/demo-script.md) | 審査用デモ確認 |
| [docs/infrastructure-aws.md](docs/infrastructure-aws.md) | AWS インフラ構成（予定） |
| [notes/aws-prep-checklist.md](notes/aws-prep-checklist.md) | AWS 事前準備チェックリスト |
| [AGENTS.md](AGENTS.md) | AIエージェント指示書 |

## インフラ（予定）

**AWS**（ap-northeast-1）— Amplify Hosting + Lambda + Bedrock  
詳細 → [docs/infrastructure-aws.md](docs/infrastructure-aws.md)

## セットアップ

```bash
cp .env.example .env
aws sts get-caller-identity   # AWS 認証確認
```

## ディレクトリ

- `src/frontend/` — フロントエンド
- `src/backend/` — Lambda 等
- `infra/` — AWS デプロイ設定
- `assets/` — 画像等
- `notes/` — 調査メモ
