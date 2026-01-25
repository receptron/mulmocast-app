# Beat追加時のドロップダウンデフォルト選択を記憶する機能

## 最終対応・検討経緯
- 計画自体は「直前に選んだビートタイプを初期値に使う」方向で正しかった
- ただし当初案ではタブ移動時に全追加ボタンが直近選択に変わる副作用が判明
- そのため「新規に追加されたボタンだけ」に適用する方式に変更
- 直近で追加したビートIDを記録し、該当ボタンにのみ初期選択を反映
- タブ移動時は直近追加IDをクリアして既存ボタンが変わらないようにした

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
- `lastSelectedBeatType`というrefを追加して、最後に選択されたbeatタイプを保持
- `addBeat`関数内で選択されたbeatタイプを記憶
- `BeatSelector`に`lastSelectedBeatType` propsを渡す
- 直近追加ビートIDを保持し、該当する追加ボタンだけにpropsを渡す

#### 2. beat_selector.vue
- 新しいprops `lastSelectedBeatType?: string` を追加
- `onMounted`のロジックを修正：
  - `currentBeatType`（既存beat変更用）がある場合はそれを使用
  - `lastSelectedBeatType`（追加ボタン用）がある場合はそれを使用
  - どちらもない場合はインデックス0（image prompt）をデフォルト

### 具体的なコード変更

**script_editor.vue:**
```typescript
// 追加
const lastSelectedBeatType = ref<string | undefined>(undefined);

const addBeat = (beat: MulmoBeat, index: number, beatType: string) => {
  lastSelectedBeatType.value = beatType;  // 追加
  // 既存のロジック...
};
```

```vue
<!-- BeatSelectorにlastSelectedBeatTypeを追加（新規追加分だけ） -->
<BeatSelector
  @emitBeat="(beat, beatType) => addBeat(beat, index, beatType)"
  :lastSelectedBeatType="beat?.id === lastInsertedBeatId ? lastSelectedBeatType : undefined"
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
  lastSelectedBeatType?: string;  // 追加
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
  // 次にlastSelectedBeatType（追加ボタン用）
  if (props.lastSelectedBeatType) {
    const index = templates.value.findIndex((beat) => beat.key === props.lastSelectedBeatType);
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
  emit("emitBeat", beat, template.key);  // keyも一緒にemit
};
```

## 検証方法
1. アプリを起動して、プロジェクトを開く
2. Beat / Text タブまたは Media タブを開く
3. ドロップダウンで「markdown」などimage prompt以外を選択してInsertをクリック
4. 新しく表示された追加ボタンのドロップダウンが「markdown」で選択されていることを確認
5. 別のタイプ（例：textSlide）を選んでInsertをクリック
6. 新しく表示された追加ボタンのドロップダウンが「textSlide」で選択されていることを確認
