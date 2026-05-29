# AWS 事前準備チェックリスト

ハッカソン当日（10:30 開発開始）前に完了すること。

## アカウント・権限

- [ ] AWS アカウント作成済み
- [ ] 請求アラート設定（例: 上限 $20）
- [ ] デプロイ用 IAM ユーザー作成（root 不使用）
- [ ] 必要権限: Amplify, Lambda, API Gateway, Bedrock, SSM, CloudWatch
- [ ] **PC 2台** とも `aws sts get-caller-identity` が成功

## Bedrock

- [ ] リージョン ap-northeast-1 で Model access 有効化
- [ ] 使用モデルを決定（例: Claude）
- [ ] ローカル or Lambda から 1 リクエスト成功を確認

## デプロイ動作確認（最重要）

- [ ] Amplify で Hello World をデプロイ
- [ ] 公開 URL を Chrome で表示確認
- [ ] デプロイ手順を 1 コマンド化（`git push` or `sam deploy`）
- [ ] URL を [docs/demo-script.md](../docs/demo-script.md) にメモ

## 会場対策

- [ ] モバイルテザリング動作確認
- [ ] `.env` を両 PC に用意（Git 管理外）
- [ ] 13:00 以降は URL を変更しない方針をチームで共有

## メモ

- Amplify アプリ名:
- 公開 URL:
- Bedrock モデル ID:
