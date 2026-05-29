# AWS インフラ構成（予定）

> 3rd 大阪 Aブロック / 2026-05-30  
> レギュレーション: Chrome で体験できる Web 作品 + 公開 URL

## 方針

| 項目 | 内容 |
|------|------|
| クラウド | **AWS** |
| リージョン | **ap-northeast-1**（東京） |
| 原則 | 3時間開発向けに**最小構成**。当日初見のサービスは使わない |

## アーキテクチャ（予定）

```
[審査員 Chrome]
      │
      ▼
┌─────────────────┐
│ Amplify Hosting │  ← フロント（HTTPS 公開 URL）
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ API Gateway     │
│ + Lambda        │  ← API / AI 連携
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Amazon Bedrock  │  ← LLM（自己契約・要 Model access）
└─────────────────┘
```

| レイヤ | サービス | 役割 |
|--------|---------|------|
| フロント | Amplify Hosting | 静的/SPA 配信、審査用 URL |
| API | API Gateway + Lambda | バックエンド・AI 呼び出し |
| AI | Bedrock | 生成 AI（モデルは事前に選定） |
| 秘匿情報 | SSM Parameter Store | API キー等（Lambda から参照） |

### 当日使わない（スコープ外）

- VPC / NAT Gateway / RDS / ECS / EKS
- カスタムドメイン（Amplify デフォルト URL で十分）

## 公開 URL

| 項目 | 内容 |
|------|------|
| **現在** | http://otameshi1.s3-website-ap-northeast-1.amazonaws.com/ |
| 方式 | S3 静的 Web ホスティング（`infra/deploy-s3.ps1`） |
| 将来 | Amplify Hosting（`https://xxxxx.amplifyapp.com` 等） |
| 確定期限 | **13:00**（審査 13:30 開始） |
| 記録 | [docs/demo-script.md](demo-script.md) に URL を記載 |

## 事前準備チェックリスト

詳細 → [notes/aws-prep-checklist.md](../notes/aws-prep-checklist.md)

- [ ] AWS CLI 設定（2台の PC）
- [ ] IAM デプロイユーザー（root 不使用）
- [ ] 請求アラート設定
- [ ] Bedrock Model access 有効化
- [ ] Hello World を Amplify へデプロイ成功
- [ ] `aws sts get-caller-identity` 確認

## ディレクトリ

| パス | 用途 |
|------|------|
| `src/frontend/` | フロントエンド |
| `src/backend/` | Lambda 関数等 |
| `infra/` | デプロイ設定（SAM / Amplify 等） |
| `notes/aws-prep-checklist.md` | 事前準備メモ |

## デプロイ（スタック確定後に追記）

```bash
# {TODO: 10:30 前に確定}
# 例: cd infra && sam deploy
# 例: git push → Amplify 自動デプロイ
```

## 関連

- [AGENTS.md](../AGENTS.md)
- [レギュレーション要約](zenkoku-ai-hackathon-2026-regulation-summary.md)
