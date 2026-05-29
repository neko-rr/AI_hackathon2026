<#
.SYNOPSIS
    React (Vite) フロントをビルドし、S3 バケット "otameshi1" に同期して静的 Web ホスティングとして公開する。

.DESCRIPTION
    1. AWS CLI / 認証を確認
    2. React フロントを npm でビルド（-SkipBuild でスキップ可）
    3. バケットの存在を確認（なければ -CreateBucket で作成）
    4. ビルド出力（dist/）を s3://otameshi1 に同期（aws s3 sync）
    5. 静的 Web ホスティングを設定し、公開 URL を表示
    -MakePublic を付けると Block Public Access 解除 + バケットポリシーで一般公開する
    （静的 Web サイトとしてブラウザからアクセスするには公開設定が必須）。

.EXAMPLE
    # ビルド→同期→公開（初回はバケット作成＋公開設定込み）
    ./infra/deploy-s3.ps1 -CreateBucket -MakePublic

.EXAMPLE
    # 既に公開設定済みのバケットへ再デプロイ（ビルド + 差分同期）
    ./infra/deploy-s3.ps1

.EXAMPLE
    # ビルド済み dist をそのまま上げる（ビルドはスキップ）
    ./infra/deploy-s3.ps1 -SkipBuild

.EXAMPLE
    # ビルドして差分だけ確認（アップロードはしない）
    ./infra/deploy-s3.ps1 -DryRun
#>

[CmdletBinding()]
param(
    # ARN: arn:aws:s3:::otameshi1 のバケット名部分
    [string]$Bucket = "otameshi1",

    # React フロント（package.json があるフォルダ）
    [string]$FrontendDir = "src/frontend",

    # アップロードするフォルダ。既定は Vite のビルド出力 dist/
    [string]$SourceDir = "src/frontend/dist",

    [string]$Region = "ap-northeast-1",

    # 名前付き AWS プロファイルを使う場合に指定
    [string]$Profile,

    [string]$IndexDocument = "index.html",

    # SPA 想定で 404 も index.html に寄せる。別ページがあれば error.html 等に変更
    [string]$ErrorDocument = "index.html",

    # npm ビルドをスキップ（既存の dist をそのまま上げる）
    [switch]$SkipBuild,

    # バケットが無ければ作成する
    [switch]$CreateBucket,

    # Block Public Access 解除 + 公開バケットポリシーを適用する
    [switch]$MakePublic,

    # アップロード時に S3 側の余分なファイルを削除する（デフォルト有効）
    [switch]$NoDelete,

    # 差分表示のみ。実際の変更はしない
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

# すべての aws 呼び出しに共通で付けるオプション（--profile を任意指定）
$awsCommon = @("--region", $Region)
if ($Profile) { $awsCommon += @("--profile", $Profile) }

function Invoke-Aws {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Args)
    $all = $Args + $awsCommon
    Write-Verbose ("aws " + ($all -join " "))
    & aws @all
    if ($LASTEXITCODE -ne 0) { throw "aws $($Args -join ' ') が失敗しました (exit $LASTEXITCODE)" }
}

Write-Host "=== S3 デプロイ: s3://$Bucket ($Region) ===" -ForegroundColor Cyan

# --- 1. 前提チェック ----------------------------------------------------------
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    throw "AWS CLI が見つかりません。https://aws.amazon.com/cli/ からインストールしてください。"
}

Write-Host "AWS 認証を確認中..." -ForegroundColor Gray
$caller = Invoke-Aws sts get-caller-identity --output json | ConvertFrom-Json
Write-Host "  Account: $($caller.Account) / $($caller.Arn)" -ForegroundColor Gray

# リポジトリルート（このスクリプトは infra/ 配下にある想定）
$repoRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")

# --- 2. React フロントのビルド ------------------------------------------------
if (-not $SkipBuild) {
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        throw "npm が見つかりません。Node.js をインストールするか、-SkipBuild を付けてください。"
    }
    $frontPath = Resolve-Path -LiteralPath (Join-Path $repoRoot $FrontendDir) -ErrorAction SilentlyContinue
    if (-not $frontPath) { throw "フロントエンドフォルダが見つかりません: $FrontendDir" }
    if (-not (Test-Path -LiteralPath (Join-Path $frontPath "package.json"))) {
        throw "package.json が見つかりません: $frontPath"
    }

    Push-Location $frontPath
    try {
        # lockfile があれば再現性のため npm ci、無ければ npm install
        if (Test-Path -LiteralPath (Join-Path $frontPath "package-lock.json")) {
            Write-Host "依存をインストール中 (npm ci)..." -ForegroundColor Cyan
            & npm ci
        } else {
            Write-Host "依存をインストール中 (npm install)..." -ForegroundColor Cyan
            & npm install
        }
        if ($LASTEXITCODE -ne 0) { throw "npm install が失敗しました (exit $LASTEXITCODE)" }

        Write-Host "ビルド中 (npm run build)..." -ForegroundColor Cyan
        & npm run build
        if ($LASTEXITCODE -ne 0) { throw "npm run build が失敗しました (exit $LASTEXITCODE)" }
    } finally {
        Pop-Location
    }
    Write-Host "  ビルド完了" -ForegroundColor Green
} else {
    Write-Host "ビルドをスキップしました (-SkipBuild)" -ForegroundColor DarkYellow
}

# SourceDir を絶対パスに解決し、中身があるか確認
$srcPath = Resolve-Path -LiteralPath (Join-Path $repoRoot $SourceDir) -ErrorAction SilentlyContinue
if (-not $srcPath) {
    # 相対指定がリポジトリルート基準でない場合は、そのまま解決を試みる
    $srcPath = Resolve-Path -LiteralPath $SourceDir -ErrorAction SilentlyContinue
}
if (-not $srcPath) { throw "アップロード元フォルダが見つかりません: $SourceDir （先にビルドが必要です）" }

$files = Get-ChildItem -LiteralPath $srcPath -Recurse -File -ErrorAction SilentlyContinue
if (-not $files -or $files.Count -eq 0) {
    throw "アップロードするファイルがありません: $srcPath （ビルドが成功しているか確認してください）"
}
$indexPath = Join-Path $srcPath $IndexDocument
if (-not (Test-Path -LiteralPath $indexPath)) {
    Write-Warning "$IndexDocument が $srcPath にありません。静的 Web ホスティングのトップページが表示されない可能性があります。"
}
Write-Host "アップロード元: $srcPath ($($files.Count) ファイル)" -ForegroundColor Gray

# --- 3. バケットの存在確認 / 作成 ---------------------------------------------
$bucketExists = $true
& aws s3api head-bucket --bucket $Bucket @awsCommon 2>$null
if ($LASTEXITCODE -ne 0) { $bucketExists = $false }

if (-not $bucketExists) {
    if (-not $CreateBucket) {
        throw "バケット '$Bucket' が存在しないかアクセスできません。作成する場合は -CreateBucket を付けて実行してください。"
    }
    Write-Host "バケット '$Bucket' を作成中..." -ForegroundColor Yellow
    # ap-northeast-1 など us-east-1 以外は LocationConstraint が必須
    if ($Region -eq "us-east-1") {
        Invoke-Aws s3api create-bucket --bucket $Bucket
    } else {
        Invoke-Aws s3api create-bucket --bucket $Bucket --create-bucket-configuration "LocationConstraint=$Region"
    }
    Write-Host "  作成完了" -ForegroundColor Green
}

# --- 4. ファイル同期 ----------------------------------------------------------
$syncArgs = @("s3", "sync", "$srcPath", "s3://$Bucket")
if (-not $NoDelete) { $syncArgs += "--delete" }
if ($DryRun)        { $syncArgs += "--dryrun" }

Write-Host "ファイルを同期中..." -ForegroundColor Cyan
Invoke-Aws @syncArgs

if ($DryRun) {
    Write-Host "DryRun のため、ここで終了します（実変更なし）。" -ForegroundColor Yellow
    return
}

# --- 5. 静的 Web ホスティング設定 --------------------------------------------
Write-Host "静的 Web ホスティングを設定中..." -ForegroundColor Cyan
Invoke-Aws s3 website "s3://$Bucket" --index-document $IndexDocument --error-document $ErrorDocument

# --- 6. 公開設定（任意） ------------------------------------------------------
if ($MakePublic) {
    Write-Host "公開設定を適用中 (Block Public Access 解除 + バケットポリシー)..." -ForegroundColor Yellow
    Invoke-Aws s3api put-public-access-block --bucket $Bucket `
        --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

    # 全オブジェクトを読み取り許可する公開ポリシー
    $policy = @{
        Version   = "2012-10-17"
        Statement = @(
            @{
                Sid       = "PublicReadGetObject"
                Effect    = "Allow"
                Principal = "*"
                Action    = "s3:GetObject"
                Resource  = "arn:aws:s3:::$Bucket/*"
            }
        )
    } | ConvertTo-Json -Depth 5 -Compress

    # 一時ファイル経由で渡す（PowerShell の引用符崩れを避ける）
    $tmp = New-TemporaryFile
    Set-Content -LiteralPath $tmp -Value $policy -Encoding utf8
    try {
        Invoke-Aws s3api put-bucket-policy --bucket $Bucket --policy "file://$($tmp.FullName)"
    } finally {
        Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue
    }
    Write-Host "  公開設定 完了" -ForegroundColor Green
} else {
    Write-Host "※ ブラウザで開くにはバケットの一般公開が必要です。公開する場合は -MakePublic を付けて再実行してください。" -ForegroundColor DarkYellow
}

# --- 完了 ---------------------------------------------------------------------
$websiteUrl = "http://$Bucket.s3-website-$Region.amazonaws.com"
Write-Host ""
Write-Host "=== デプロイ完了 ===" -ForegroundColor Green
Write-Host "公開 URL: $websiteUrl" -ForegroundColor Green
