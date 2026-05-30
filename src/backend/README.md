# Lambda / API 用 Python バックエンド

## 開発ツール（ローカル）

```powershell
cd src/backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install black ruff boto3
```

Cursor Hook（`afterFileEdit`）は `.py` 保存時に **black / ruff --fix** を実行（インストール済みの場合）。

## 配置

- `handler.py` — Lambda エントリ
- `io_intelligence.py` — IO Intelligence API クライアント
- `local_server.py` — ローカル開発用（ポート 8787）
- 秘匿情報 — `.env`（Git 管理外）/ Lambda 環境変数

## ローカル API

```powershell
# プロジェクトルート .env に IO_INTELLIGENCE_API_KEY を設定
cd src/backend
python local_server.py
```

別ターミナルでフロント:

```powershell
cd src/frontend
npm run dev
```

`src/frontend/.env.development` の `VITE_API_URL=/api/deliver` が vite proxy 経由で local_server に接続します。
