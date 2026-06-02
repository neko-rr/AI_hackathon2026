<#
.SYNOPSIS
    deliver API を Lambda + HTTP API Gateway にデプロイする。

.DESCRIPTION
    1. src/backend を zip 化（依存パッケージなし・stdlib のみ）
    2. Lambda 関数を作成または更新
    3. HTTP API (API Gateway v2) に POST /deliver を公開
    4. CORS を有効化
    5. エンドポイント URL を表示（VITE_API_URL に設定）

.EXAMPLE
    ./infra/deploy-lambda.ps1

.EXAMPLE
    # 関数名・リージョンを指定
    ./infra/deploy-lambda.ps1 -FunctionName hackathon-deliver -Region ap-northeast-1
#>

[CmdletBinding()]
param(
    [string]$FunctionName = "hackathon-deliver",
    [string]$BackendDir = "src/backend",
    [string]$Handler = "handler.lambda_handler",
    [string]$Runtime = "python3.11",
    [int]$TimeoutSec = 25,
    [int]$MemoryMb = 256,
    [string]$Region = "ap-northeast-1",
    [string]$Profile,
    [string]$ApiName = "hackathon-deliver-api",
    [string]$StageName = "prod",
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$awsCommon = @("--region", $Region)
if ($Profile) { $awsCommon += @("--profile", $Profile) }

function Invoke-Aws {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Args)
    $all = $Args + $awsCommon
    Write-Verbose ("aws " + ($all -join " "))
    & aws @all
    if ($LASTEXITCODE -ne 0) { throw "aws $($Args -join ' ') が失敗しました (exit $LASTEXITCODE)" }
}

function Read-DotEnv {
    param([string]$Path)
    $map = @{}
    if (-not (Test-Path -LiteralPath $Path)) { return $map }
    Get-Content -LiteralPath $Path -Encoding UTF8 | ForEach-Object {
        $line = $_.Trim()
        if (-not $line -or $line.StartsWith("#")) { return }
        $idx = $line.IndexOf("=")
        if ($idx -lt 1) { return }
        $key = $line.Substring(0, $idx).Trim()
        $val = $line.Substring($idx + 1).Trim().Trim('"').Trim("'")
        if ($key) { $map[$key] = $val }
    }
    return $map
}

Write-Host "=== Lambda デプロイ: $FunctionName ($Region) ===" -ForegroundColor Cyan

if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    throw "AWS CLI が見つかりません。"
}

$repoRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")
$backendPath = Resolve-Path -LiteralPath (Join-Path $repoRoot $BackendDir)
$envPath = Join-Path $repoRoot ".env"
$envVars = Read-DotEnv $envPath

$lambdaEnv = @{
    IO_INTELLIGENCE_LLM_MODEL     = if ($envVars["IO_INTELLIGENCE_LLM_MODEL"]) { $envVars["IO_INTELLIGENCE_LLM_MODEL"] } else { "meta-llama/Llama-3.3-70B-Instruct" }
    IO_INTELLIGENCE_FALLBACK_MODEL = if ($envVars["IO_INTELLIGENCE_FALLBACK_MODEL"]) { $envVars["IO_INTELLIGENCE_FALLBACK_MODEL"] } else { "mistralai/Mistral-Large-Instruct-2411" }
}
if ($envVars["IO_INTELLIGENCE_API_KEY"]) {
    $lambdaEnv["IO_INTELLIGENCE_API_KEY"] = $envVars["IO_INTELLIGENCE_API_KEY"]
} else {
    Write-Warning ".env に IO_INTELLIGENCE_API_KEY がありません。Lambda はルールベース fallback のみ動作します。"
}

$pyFiles = @(
    "handler.py", "io_intelligence.py", "prompts.py", "schemas.py",
    "fallback.py", "__init__.py"
)
foreach ($f in $pyFiles) {
    if (-not (Test-Path -LiteralPath (Join-Path $backendPath $f))) {
        throw "バックエンドファイルが見つかりません: $f"
    }
}

$zipPath = Join-Path $env:TEMP "hackathon-deliver-$(Get-Date -Format 'yyyyMMddHHmmss').zip"
if (Test-Path -LiteralPath $zipPath) { Remove-Item -LiteralPath $zipPath -Force }

Write-Host "zip 作成中: $zipPath" -ForegroundColor Gray
Push-Location $backendPath
try {
    Compress-Archive -Path $pyFiles -DestinationPath $zipPath -Force
} finally {
    Pop-Location
}

$zipBytes = [System.IO.File]::ReadAllBytes($zipPath)
Write-Host "  $($pyFiles.Count) ファイル / $([math]::Round($zipBytes.Length / 1KB, 1)) KB" -ForegroundColor Gray

if ($DryRun) {
    Write-Host "DryRun のため AWS へのデプロイはスキップします。" -ForegroundColor Yellow
    Remove-Item -LiteralPath $zipPath -Force -ErrorAction SilentlyContinue
    return
}

Write-Host "AWS 認証を確認中..." -ForegroundColor Gray
$caller = Invoke-Aws sts get-caller-identity --output json | ConvertFrom-Json
Write-Host "  Account: $($caller.Account)" -ForegroundColor Gray

$roleName = "$FunctionName-role"
$roleArn = $null

try {
    $roleArn = (Invoke-Aws iam get-role --role-name $roleName --output json | ConvertFrom-Json).Role.Arn
    Write-Host "IAM ロール使用: $roleArn" -ForegroundColor Gray
} catch {
    Write-Host "IAM ロール '$roleName' を作成中..." -ForegroundColor Yellow
    $trust = @{
        Version   = "2012-10-17"
        Statement = @(
            @{
                Effect    = "Allow"
                Principal = @{ Service = "lambda.amazonaws.com" }
                Action    = "sts:AssumeRole"
            }
        )
    } | ConvertTo-Json -Depth 5 -Compress

    $trustFile = New-TemporaryFile
    # PowerShell 5.1 の -Encoding utf8 は BOM 付きになり AWS CLI が読めないため BOM なしで書く
    [System.IO.File]::WriteAllText($trustFile.FullName, $trust, (New-Object System.Text.UTF8Encoding($false)))
    try {
        $roleJson = Invoke-Aws iam create-role `
            --role-name $roleName `
            --assume-role-policy-document "file://$($trustFile.FullName)" `
            --output json | ConvertFrom-Json
        $roleArn = $roleJson.Role.Arn
        Invoke-Aws iam attach-role-policy `
            --role-name $roleName `
            --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        Write-Host "  ロール作成完了。反映待ち 10 秒..." -ForegroundColor Gray
        Start-Sleep -Seconds 10
    } finally {
        Remove-Item -LiteralPath $trustFile -Force -ErrorAction SilentlyContinue
    }
}

$functionExists = $false
try {
    Invoke-Aws lambda get-function --function-name $FunctionName --output json | Out-Null
    $functionExists = $true
} catch {
    $functionExists = $false
}

# Lambda の --environment は {"Variables":{"KEY":"VALUE"}} のマップ形式。
# クォート付きJSONを native exe に直接渡すと壊れるため、一時ファイル経由(file://)で渡す。
$varsMap = @{}
foreach ($kv in $lambdaEnv.GetEnumerator()) { $varsMap[$kv.Key] = [string]$kv.Value }
$envObj = @{ Variables = $varsMap } | ConvertTo-Json -Compress -Depth 5
$envFile = New-TemporaryFile
[System.IO.File]::WriteAllText($envFile.FullName, $envObj, (New-Object System.Text.UTF8Encoding($false)))
$envPayload = "file://$($envFile.FullName)"

if (-not $functionExists) {
    Write-Host "Lambda 関数 '$FunctionName' を作成中..." -ForegroundColor Cyan
    Invoke-Aws lambda create-function `
        --function-name $FunctionName `
        --runtime $Runtime `
        --role $roleArn `
        --handler $Handler `
        --timeout $TimeoutSec `
        --memory-size $MemoryMb `
        --environment $envPayload `
        --zip-file "fileb://$zipPath"
} else {
    Write-Host "Lambda 関数 '$FunctionName' を更新中..." -ForegroundColor Cyan
    Invoke-Aws lambda update-function-code `
        --function-name $FunctionName `
        --zip-file "fileb://$zipPath"
    Start-Sleep -Seconds 3
    Invoke-Aws lambda update-function-configuration `
        --function-name $FunctionName `
        --handler $Handler `
        --timeout $TimeoutSec `
        --memory-size $MemoryMb `
        --environment $envPayload
}

Remove-Item -LiteralPath $zipPath -Force -ErrorAction SilentlyContinue

$fnArn = (Invoke-Aws lambda get-function --function-name $FunctionName --output json | ConvertFrom-Json).Configuration.FunctionArn
Write-Host "Lambda ARN: $fnArn" -ForegroundColor Green

# --- API Gateway HTTP API ---
$apiId = $null
$apis = Invoke-Aws apigatewayv2 get-apis --output json | ConvertFrom-Json
$existingApi = $apis.Items | Where-Object { $_.Name -eq $ApiName } | Select-Object -First 1
if ($existingApi) {
    $apiId = $existingApi.ApiId
    Write-Host "既存 HTTP API: $ApiName ($apiId)" -ForegroundColor Gray
} else {
    Write-Host "HTTP API '$ApiName' を作成中..." -ForegroundColor Cyan
    $apiId = (Invoke-Aws apigatewayv2 create-api `
        --name $ApiName `
        --protocol-type HTTP `
        --cors-configuration "AllowOrigins=*,AllowMethods=POST,OPTIONS,AllowHeaders=Content-Type,Authorization" `
        --output json | ConvertFrom-Json).ApiId
}

$integrationId = $null
$integrations = Invoke-Aws apigatewayv2 get-integrations --api-id $apiId --output json | ConvertFrom-Json
$existingIntegration = $integrations.Items | Where-Object { $_.IntegrationUri -like "*$FunctionName*" } | Select-Object -First 1
if ($existingIntegration) {
    $integrationId = $existingIntegration.IntegrationId
} else {
    $integrationId = (Invoke-Aws apigatewayv2 create-integration `
        --api-id $apiId `
        --integration-type AWS_PROXY `
        --integration-uri "arn:aws:apigateway:${Region}:lambda:path/2015-03-31/functions/${fnArn}/invocations" `
        --payload-format-version "2.0" `
        --output json | ConvertFrom-Json).IntegrationId
}

$routes = Invoke-Aws apigatewayv2 get-routes --api-id $apiId --output json | ConvertFrom-Json
$hasDeliver = $routes.Items | Where-Object { $_.RouteKey -eq "POST /deliver" }
if (-not $hasDeliver) {
    Invoke-Aws apigatewayv2 create-route `
        --api-id $apiId `
        --route-key "POST /deliver" `
        --target "integrations/$integrationId" | Out-Null
}

$hasOptions = $routes.Items | Where-Object { $_.RouteKey -eq "OPTIONS /deliver" }
if (-not $hasOptions) {
    Invoke-Aws apigatewayv2 create-route `
        --api-id $apiId `
        --route-key "OPTIONS /deliver" `
        --target "integrations/$integrationId" | Out-Null
}

$stages = Invoke-Aws apigatewayv2 get-stages --api-id $apiId --output json | ConvertFrom-Json
$hasStage = $stages.Items | Where-Object { $_.StageName -eq $StageName }
if (-not $hasStage) {
    Invoke-Aws apigatewayv2 create-stage `
        --api-id $apiId `
        --stage-name $StageName `
        --auto-deploy | Out-Null
}

# Lambda invoke permission for API Gateway
$sourceArn = "arn:aws:execute-api:${Region}:$($caller.Account):${apiId}/*/*"
try {
    Invoke-Aws lambda add-permission `
        --function-name $FunctionName `
        --statement-id "apigw-$apiId" `
        --action lambda:InvokeFunction `
        --principal apigateway.amazonaws.com `
        --source-arn $sourceArn | Out-Null
} catch {
    Write-Host "  add-permission は既存の可能性があります（続行）" -ForegroundColor DarkYellow
}

$apiEndpoint = (Invoke-Aws apigatewayv2 get-api --api-id $apiId --output json | ConvertFrom-Json).ApiEndpoint
$deliverUrl = "$apiEndpoint/$StageName/deliver"

Write-Host ""
Write-Host "=== Lambda デプロイ完了 ===" -ForegroundColor Green
Write-Host "POST URL: $deliverUrl" -ForegroundColor Green
Write-Host ""
Write-Host "次のステップ:" -ForegroundColor Cyan
Write-Host "  1. .env に VITE_API_URL=$deliverUrl を設定"
Write-Host "  2. ./infra/deploy-s3.ps1 でフロントを再ビルド・デプロイ"
Write-Host "  3. Chrome で公開 URL を確認"
