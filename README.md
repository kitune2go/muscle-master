# Muscle Master

育成ゲーム風トレーニング記録PWA。

## Product concept

**現実の身体を育成するスマホRPG。** その日のトレーニングをセット単位で記録し、筋力・体幹・柔軟・持久力のステータス、XP、レベル、称号として可視化します。

## Design system v1

- **Visual language:** レトロ育成ゲーム × 現代的モバイルUI
- **Palette:** クリーム / 深い赤 / 墨色 / ゴールド
- **Character role:** 応援トレーナー。名前はユーザーが自由に変更可能
- **UI principles:** 大きなタップ領域、1画面1目的、数値の即時フィードバック、過度な追い込みを煽らない
- **Navigation:** ホーム / クエスト / ステータス / 記録

## Features

- 今日のトレーニングとセット完了記録
- ユーザー名・トレーナー名設定
- 達成率 / 継続日数 / 累計セット
- XP / プレイヤーレベル
- 筋力 / 体幹 / 柔軟 / 持久力
- 称号・実績
- 直近14日のトレーニング履歴
- `localStorage` による端末内保存
- PWA / オフラインキャッシュ

## Files

- `index.html` — アプリ画面
- `style.css` — UI / デザインシステム
- `app.js` — 記録・育成ロジック
- `assets/trainer.svg` — オリジナルトレーナー素材
- `manifest.json` — PWA設定
- `sw.js` — オフラインキャッシュ

## GitHub Pages

`main` ブランチのルートをGitHub Pagesで公開する構成です。
