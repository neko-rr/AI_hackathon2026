---
version: alpha
name: 意外発送タービン
description: 質問を流体に変え、タービンを通して答えを届ける — IT素人向け・ワクワクUI
colors:
  primary: "#38bdf8"
  secondary: "#94a3b8"
  accent: "#fbbf24"
  accent-warm: "#fde68a"
  neutral: "#0f1419"
  surface: "#1a2332"
  surface-raised: "#1e293b"
  on-surface: "#e8eef7"
  on-muted: "#94a3b8"
  border: "#334155"
  fluid-start: "#7ec8e3"
  fluid-end: "#38bdf8"
  success-glow: "#facc15"
typography:
  h1:
    fontFamily: system-ui, "Hiragino Sans", "Segoe UI", sans-serif
    fontSize: 28px
    fontWeight: 700
    lineHeight: 1.35
  body-md:
    fontFamily: system-ui, "Hiragino Sans", "Segoe UI", sans-serif
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: system-ui, "Hiragino Sans", sans-serif
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.5
  label-md:
    fontFamily: system-ui, "Hiragino Sans", sans-serif
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.4
  eyebrow:
    fontFamily: system-ui, "Hiragino Sans", sans-serif
    fontSize: 13px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0.12em
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
rounded:
  sm: 8px
  md: 12px
  lg: 16px
  pill: 999px
components:
  button-primary:
    backgroundColor: "linear-gradient(135deg, #f59e0b, #d97706)"
    textColor: "#1a1200"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    minHeight: 52px
    padding: 14px 16px
  button-sample:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-muted}"
    borderColor: "{colors.border}"
    rounded: "{rounded.pill}"
    minHeight: 44px
    padding: 8px 14px
  input-field:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-surface}"
    borderColor: "{colors.border}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    minHeight: 48px
    padding: 14px 16px
  status-banner:
    backgroundColor: "#2a2210"
    textColor: "{colors.accent-warm}"
    borderColor: "{colors.accent}"
    rounded: "{rounded.sm}"
  delivery-box:
    backgroundColor: "#0c1220"
    borderColor: "{colors.border}"
    borderReceived: "{colors.accent}"
    rounded: "{rounded.lg}"
  delivery-card:
    backgroundColor: "{colors.surface-raised}"
    borderColor: "{colors.border}"
    accentBorder: "{colors.accent}"
    rounded: "{rounded.md}"
  turbine-badge:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.accent-warm}"
    borderColor: "{colors.accent}"
    rounded: "{rounded.sm}"
  fluid-pipe:
    backgroundColor: "{colors.surface-raised}"
    borderColor: "#475569"
    rounded: "{rounded.pill}"
---

# 意外発送タービン

## Overview

**ブランド人格:** やさしい案内人。難しい仕組みを「見て楽しい配達」に変える、夜の仕掛けショー。

**ターゲット:** IT に不慣れな審査員・初見ユーザー。口頭説明なしで「質問 → 押す → 届く」まで迷わない。

** evoke する感情:** **ワクワク**（流体が動く・タービンが回る・箱から答えが届く驚き）と **安心**（大きな文字・平易な日本語・次に何をすればよいか常に1つ）。

**Must 画面:** ①質問入力 ②流体＋3タービン演出 ③📬届いたアイデア（回答）

**世界観キーワード:** 配達・仕掛け・光る配達口・毎回ちがうタービン — テーマ「タービン」を「変換の魔法」として見せる。

## Colors

| 役割 | token | 使い方 |
|------|-------|--------|
| 背景 | `neutral` | ページ全体。夜のステージ感 |
| パネル | `surface` / `surface-raised` | 入力欄・カード・パイプ |
| 本文 | `on-surface` | 見出し・回答 |
| 補助 | `on-muted` | 説明文・プレースホルダ |
| **ワクワク** | `accent` / `accent-warm` | 届いた瞬間・タービンラベル・eyebrow。**成功・驚きのみ** |
| 流体・信頼 | `primary` / `fluid-*` | 流体・リンク・質問ラベル |
| 境界 | `border` | カード・入力の枠 |
| 配達成功 | `success-glow` | 電球・配達口の光（box-shadow に使用） |

- **Primary（CTA グラデ）:** オレンジ `#f59e0b → #d97706` — 「仕掛けを動かす」**1画面1つ**。押したくなる温かさ。
- 暗背景 × 金の光で「届いた！」を強調。装飾の乱用はしない。

## Typography

| スタイル | 用途 |
|----------|------|
| `eyebrow` | 作品名（意外発送タービン）。accent 色 |
| `h1` | 画面タイトル1つ。`clamp` でモバイル可読 |
| `body-md` | 入力・回答本文。**16px 以上** |
| `body-sm` | サブコピー・recap |
| `label-md` | ボタン・フォームラベル |

- 日本語のみ。英語・略語・API名は UI に出さない。
- 専門語の代わり: 「流体」「タービン」「届いたアイデア」など画面内ラベルで統一。

## Layout

- **max-width:** 760px 中央。1カラム縦積み（審査員がスクロールだけで完走）。
- **spacing:** 8px 基準。セクション間 `lg`（24px）、カード内 `md`（16px）。
- **タップ領域:** ボタン・サンプル **最小 44px 高**。primary は **52px**。
- **情報密度:** 1画面に primary CTA は1つ。サンプル質問は横並び最大2つ。
- **視線の流れ:** ヘッダー → 入力 → ステータス → 流体パイプ → タービン3 → 配達口 → 📬

## Elevation & Depth

- 基本は **フラット + border**。暗背景で疲れにくく。
- **届いた瞬間のみ** glow: `delivery-box.received` に accent の box-shadow、`bulb.on` に `success-glow`。
- 流体は blur で奥行き。カードは border-left accent で「届いた荷物」感。
- 影は控えめ。ワクワクは **光と動き** で出す（色の塗り足しよりアニメーション優先）。

## Shapes

- **角丸 friendly:** 入力 `sm`、パネル・カード `md`、届き先 `lg`、サンプルボタン `pill`。
- タービン・流体パイプは **丸み**（pipe は pill、流体 blob は有機的な border-radius）。
- シャープな角・細い線は避ける。IT素人に「触っていい」印象。

## Components

| コンポーネント | 要点 |
|----------------|------|
| **button-primary** | 全文「仕掛けを動かす」。disabled 時は wait カーソル＋文言変更 |
| **button-sample** | 「お試し：〜」で入力を代行。迷った人の入口 |
| **input-field** | 1行・placeholder に具体例2つ |
| **status-banner** | 今何が起きているか（例:「難易度：やさしい — 流体が変わりました」） |
| **fluid-pipe** | 質問が流体として流れる。色変化でタービン通過を実感 |
| **turbine-badge** | 軸名＋抽選値（難易度／対象／場面）。highlight 時 pulse |
| **delivery-box** | 📬 +「届いたアイデア」。waiting / received の2状態 |
| **delivery-card** | 回答1〜3。順番に fade-in。badge「回答 N」 |

**文言トーン:** です・ます。命令形は「〜してください」まで。感嘆符は届いた瞬間のみ可。

**アイコン:** 📬 📦 など絵文字は **届き・配達** に限定（過剰使用しない）。

## Do's and Don'ts

**Do**

- DESIGN.md の tokens のみ使用（CSS 変数は tokens と同名でマッピング）
- 初見で **2クリック**（お試し → 仕掛けを動かす）でデモ完走
- ローディング中は status-banner と delivery-box.waiting で「動いている」と伝える
- 通過タービン条件を recap 表示（今回の答えの理由が分かる）
- コントラスト **WCAG AA（4.5:1）** — 本文 `on-surface` on `neutral` / `surface`
- アニメーションは **0.4〜0.9s**。通過・届きでワクワク、常時点滅は避ける

**Don't**

- API・モデル名・技術略語を UI に表示しない
- primary CTA を複数並べない
- accent を本文背景に広げない（ギラつき・疲れの原因）
- 10px 未満のボタン・リンク
- ユーザーに「難易度を選んで」等の設定を求めない（ランダムは演出内で完結）
- プレゼン用スライド・QR（大会レギュレーション外）

---

*UI 実装時は本ファイルを正とする。変更時は tokens と Components を同期すること。*
