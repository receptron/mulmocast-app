# Beat追加時のドロップダウンデフォルト選択を記憶する機能

## 最終対応・検討経緯
- 直前選択の状態保持はせず、既存ビートからタイプを推測する方式に変更
- `getBeatType(beat)` で上のビート種別を取得し、追加ボタンの `currentBeatType` に渡す
- 追加ボタンは「直上のビートと同じタイプ」を初期選択とする
- 追加状態を持たないため、タブ移動の副作用やクリア処理が不要になった

## 概要
Beat / Text タブでbeatを追加した後、新しく表示される追加ボタンのドロップダウンで、直前に選択したbeatタイプがデフォルトで選択された状態にする。

## 現状の動作
- `BeatSelector`コンポーネント（`src/renderer/pages/project/script_editor/beat_selector.vue`）がドロップダウンを管理
- `selectedBeat`は`ref(0)`で初期化され、常にインデックス0（image prompt）がデフォルト選択される
- 各`BeatSelector`インスタンスは独立しており、選択状態を共有していない

## 実装計画

### 修正ファイル
1. **[beat_selector.vue](src/renderer/pages/project/script_editor/beat_selector.vue)** - 主要な変更

### 変更内容

#### 1. script_editor.vue
- `getBeatType(beat)` を使って既存ビートのタイプを取得
- 追加ボタンの `currentBeatType` に上のビートタイプを渡す

#### 2. beat_selector.vue
- `currentBeatType` のみで初期選択を決定
- `currentBeatType` がない場合はインデックス0（image prompt）をデフォルト

### 具体的なコード変更

**script_editor.vue:**
```typescript
const addBeat = (beat: MulmoBeat, index: number) => {
  // 既存のロジック...
};
```

```vue
<!-- BeatSelectorにcurrentBeatTypeを追加（直上のビートタイプを初期選択） -->
<BeatSelector
  @emitBeat="(beat) => addBeat(beat, index)"
  :currentBeatType="getBeatType(beat)"
  buttonKey="insert"
  :isPro="globalStore.userIsPro"
/>
```

**beat_selector.vue:**
```typescript
interface Props {
  buttonKey: string;
  currentBeatType?: string;
  isPro: boolean;
}

onMounted(() => {
  // currentBeatTypeが優先（beat変更時）
  if (props.currentBeatType) {
    const index = templates.value.findIndex((beat) => beat.key === props.currentBeatType);
    if (index !== -1) {
      selectedBeat.value = index;
      return;
    }
  }
  // デフォルトは0
});

const emitBeat = () => {
  const template = templates.value[selectedBeat.value];
  const beat = { ...template.beat };
  emit("emitBeat", beat);
};
```

## 検証方法
1. アプリを起動して、プロジェクトを開く
2. Beat / Text タブまたは Media タブを開く
3. ドロップダウンで「markdown」などimage prompt以外を選択してInsertをクリック
4. 新しく表示された追加ボタンのドロップダウンが「markdown」で選択されていることを確認
5. 別のタイプ（例：textSlide）を選んでInsertをクリック
6. 新しく表示された追加ボタンのドロップダウンが「textSlide」で選択されていることを確認
