# infra/

AWS デプロイ設定を置くディレクトリ。

## デプロイ（現状）

| 方式 | 用途 |
|------|------|
| **S3 静的 Web ホスティング** | フロント公開（`deploy-s3.ps1`） |
| AWS Amplify | フロント（将来） |
| AWS SAM | Lambda + API Gateway（必要時） |

```powershell
./infra/deploy-s3.ps1              # 再デプロイ
./infra/deploy-s3.ps1 -CreateBucket -MakePublic   # 初回
```

公開 URL: http://otameshi1.s3-website-ap-northeast-1.amazonaws.com/

## スタック確定後

1. `template.yaml`（SAM）または Amplify 設定をここに追加
2. [docs/infrastructure-aws.md](../docs/infrastructure-aws.md) にデプロイコマンドを追記
3. [AGENTS.md](../AGENTS.md) のコマンドセクションを更新

## 参照

- [docs/infrastructure-aws.md](../docs/infrastructure-aws.md)
- [notes/aws-prep-checklist.md](../notes/aws-prep-checklist.md)
