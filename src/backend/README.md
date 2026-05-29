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

- `handler.py` 等 — Lambda エントリ
- 秘匿情報 — `.env`（Git 管理外）/ Lambda 環境変数
