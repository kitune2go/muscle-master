# CHARACTER_RIO_SOURCE — リオ

Version: 1.0
Status: CANONICAL
Project: マッスルマスター / MUSCLE MASTER

## Identity
- trainerId: `rio`
- 表示名: リオ
- 役割: メイントレーナー
- 性格: 元気・熱血・距離が近い
- 台詞方向: 明るくフレンドリー。少しタメ口。
- テーマカラー: Red

## Canonical visual identity
固定要素:
- 赤〜赤褐色の長いハイポニーテール
- 赤いシュシュ
- 琥珀色の目
- アスレチックで筋肉の輪郭が分かる体格
- 赤いオープントラックジャケット＋白い袖ライン
- 黒スポーツトップ
- 黒ショートパンツ＋白トリム＋赤ドローコード
- 赤・黒・白のスポーツシューズ
- 黒赤のリストバンド
- 金色のMMクラウンエンブレム

変更禁止:
- 髪色・髪型・目色の大幅変更
- メイン衣装の赤黒配色変更
- MMクラウン意匠の別ブランド化
- 極端な体格変更

## Canonical asset IDs
Base / key poses:
- `base-master`
- `hero`
- `portrait`
- `level-up`

Expressions:
- `neutral`
- `smile`
- `cheer`
- `blush`
- `serious`
- `tired`
- `angry`
- `achieved`

Chibi:
- `normal`
- `cheer`
- `struggle`
- `rest`
- `achieved`

## Runtime paths
```text
assets/trainers/rio/base-master.webp
assets/trainers/rio/hero.webp
assets/trainers/rio/portrait.webp
assets/trainers/rio/level-up.webp
assets/trainers/rio/expressions/*.webp
assets/trainers/rio/chibi/*.webp
assets/trainers/rio/manifest.json
```

## Approval state
- Base Master: APPROVED / CANONICAL
- Expressions 8: APPROVED
- Chibi 5: APPROVED
- Hero: APPROVED
- Portrait: APPROVED
- Level Up: APPROVED
- Runtime manifest: GENERATED

## Implementation rule
表示名と`trainerId`を分離する。
画像ファイル名をUIへ散在してハードコードせず、`manifest.json`または同等のTrainerデータ層から参照する。
台詞は画像へ焼き込まず、HTML/CSSまたはアプリデータとして保持する。

## Source hierarchy
1. 最新のユーザー明示指示
2. `00_MASTER_SPEC`
3. `UI_REFERENCE — マッスルマスター UIコンセプトシート`
4. `ASSET_PRODUCTION_STANDARD`
5. 本資料
6. GitHub実装
