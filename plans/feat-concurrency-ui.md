# feat: concurrency 設定 UI

## 関連

- Issue: receptron/mulmocast-app#1618
- 上流対応: receptron/mulmocast-cli#1334 (concurrency フィールド追加)

## 背景

mulmocast-cli で `imageParams.concurrency` / `movieParams.concurrency` / `audioParams.concurrency` が追加された。
GUI からこれらを設定できるようにする。

## 設計方針

各 params に分散させる代わりに、**Concurrency 専用セクションを新設**する。

### 理由

- image / movie は GraphAI グラフを共有しており、実行時には `min(imageParams.concurrency, movieParams.concurrency)` が適用される
- このため別々の入力欄を提供するとユーザー混乱を招く
- 関連設定をまとめて表示することで挙動を直感的に伝える

### UI

新規コンポーネント `src/renderer/pages/project/script_editor/styles/concurrency_params.vue` を追加し、
`presentation_style.vue` の Card 群の末尾に配置する。

入力欄は 2 つ：

| ラベル      | 書き込み先                                                |
| ----------- | --------------------------------------------------------- |
| 画像/動画   | `imageParams.concurrency` と `movieParams.concurrency` の両方 |
| 音声        | `audioParams.concurrency`                                 |

### 値の扱い

- 空欄 / 0 以下 → `undefined`（プロバイダごとの自動検出にフォールバック）
- 正の整数 → 明示的な並列度として保存

### Props / Emits

```ts
defineProps<{
  imageParams?: MulmoImageParams;
  movieParams?: MulmoPresentationStyle["movieParams"];
  audioParams?: MulmoPresentationStyle["audioParams"];
}>();

defineEmits<{
  "update:imageParams": [imageParams: MulmoImageParams];
  "update:movieParams": [movieParams: MulmoPresentationStyle["movieParams"]];
  "update:audioParams": [audioParams: MulmoPresentationStyle["audioParams"]];
}>();
```

「画像/動画」入力時は `update:imageParams` と `update:movieParams` の両方を emit する。

### i18n

`parameters.concurrencyParams.*` を en / ja に新設：

- `title` — セクションタイトル
- `imageMovie` / `audio` — ラベル
- `imageMovieDescription` — 画像と動画は内部的に共通のグラフを使うため両方に同じ値が適用される旨
- `autoDetectNote` — 未指定時はプロバイダごとに自動検出される旨

## 影響範囲

- 既存の `image_params.vue` / `movie_params.vue` / `audio_params.vue` には手を入れない
- 新規ファイル 1 つ + `presentation_style.vue` のマウント追加
- i18n に新セクション追加

## 動作確認

1. 数値を入れて保存 → script.json の `imageParams.concurrency`, `movieParams.concurrency`, `audioParams.concurrency` が更新される
2. 画像/動画欄に値を入れた場合、image と movie の両方に同じ値が入る
3. 空欄に戻すと該当フィールドが `undefined` になる（または削除される）
4. 動画生成を走らせて concurrency が反映されることを確認（mulmocast 側のログで確認）
