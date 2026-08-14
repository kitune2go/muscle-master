# Muscle Master

育成ゲーム風トレーニング記録PWA。

## Product concept

**現実の身体を育成するスマホRPG。** その日のトレーニングをセット単位で記録し、筋力・体幹・柔軟・持久力のステータス、XP、レベル、称号として可視化します。

## Design system

- **Visual language:** レトロ育成ゲーム × 現代的モバイルUI
- **Palette:** クリーム / 深い赤 / 墨色 / ゴールド
- **Character role:** 応援トレーナー。名前はユーザーが自由に変更可能
- **UI principles:** 大きなタップ領域、1画面1目的、数値の即時フィードバック、過度な追い込みを煽らない
- **Navigation:** ホーム / クエスト / ステータス / 記録

## v3 Features

- 曜日別トレーニングプログラム
  - 月：全身A
  - 火：モビリティ
  - 水：全身B
  - 木：体幹・回復
  - 金：全身C
  - 土：選択チャレンジ
  - 日：回復日
- トレーニング選択画面
  - 筋力 / 体幹 / 柔軟 / 持久力のカテゴリ絞り込み
  - 回数・時間 / 獲得XP / セット完了数をカード内に表示
  - カテゴリに該当しない日の空状態表示
- セット完了ごとの +10 XP
- レベルアップ演出 / 紙吹雪
- Web Audio APIによる軽い効果音（ON/OFF可能）
- トレーナーの応援アニメーション
- ユーザー名・トレーナー名設定
- 達成率 / 継続日数 / 累計セット
- 筋力 / 体幹 / 柔軟 / 持久力
- 称号・実績
- 直近14日のトレーニング履歴
- 旧v1記録からの自動移行
- `localStorage` による端末内保存
- PWA / オフラインキャッシュ
- ブランドロゴ / PWAアイコン（通常・maskable）
- 前日までの継続記録を当日の開始前にも保持
- GitHub Actionsによる依存なしのPWA検証

## Files

- `index.html` — アプリ画面
- `design-match.css` — UIコンセプトシート準拠の画面構成・デザインシステム・ゲーム演出（実行時に読み込む単一CSS）
- `style.css` / `v3.css` — 旧UIの履歴ファイル（実行時は未使用）
- `app.js` — 記録・曜日別メニュー・育成ロジック
- `app-core.js` — XP・レベル・継続日数などの共通ロジック
- `assets/trainer.svg` — オリジナルトレーナー素材
- `manifest.json` — PWA設定
- `sw.js` — オフラインキャッシュ
- `docs/MASTER_SPEC_UPDATE_2026-08-15.md` — 現行MASTER_SPECの実装状況・優先順位更新
- `docs/QUEST_ARCHITECTURE.md` — クエストの追加方式、報酬、演出の拡張方針
- `docs/UI_TRAINING_SELECTION_QA.md` — トレーニング選択画面の確認基準

## GitHub Pages

`main` ブランチのルートをGitHub Pagesで公開する構成です。

## Validation

```sh
npm run check
```
