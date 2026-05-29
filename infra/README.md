# infra/

AWS デプロイ設定を置くディレクトリ。

## 予定

| 方式 | 用途 |
|------|------|
| AWS Amplify | フロントエンド Hosting |
| AWS SAM | Lambda + API Gateway（必要時） |

## スタック確定後

1. `template.yaml`（SAM）または Amplify 設定をここに追加
2. [docs/infrastructure-aws.md](../docs/infrastructure-aws.md) にデプロイコマンドを追記
3. [AGENTS.md](../AGENTS.md) のコマンドセクションを更新

## 参照

- [docs/infrastructure-aws.md](../docs/infrastructure-aws.md)
- [notes/aws-prep-checklist.md](../notes/aws-prep-checklist.md)
