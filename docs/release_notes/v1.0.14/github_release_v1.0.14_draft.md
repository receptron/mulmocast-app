# GitHub Release Draft for v1.0.14

Phase 4b（リリース PR マージ後）に `gh release create` で公開する想定。Phase 2 では作成せず、md ドラフトとして保管する。

## Tag

`1.0.14`（過去フォーマット踏襲、`v` プレフィックスなし）

## Title

`1.0.14`

## Target

リリース PR (#1649) マージ後の `main` の最新コミット。

## Highlights（`--notes` に含める内容）

```markdown
## Highlights

- **19 new AI models** — 13 image (gpt-image-2, gpt-image-1-mini, Flux 2, Ideogram V3, SD 3.5 Large, Luma Photon, etc.) and 6 video (Seedance 2.0, Hailuo 2.3, PixVerse v5, etc.) models added to the dropdowns
- **Concurrency settings UI** — Set image/video/audio generation concurrency per project or as a default, to tune for your API plan's rate limits
- **Windows beat rendering fix** — HTML / Markdown / Chart / Mermaid beat generation now works reliably on Windows after Vite v8 migration
- **Model lineup updated** — dall-e-3 and Imagen 4.0 are no longer available. Onboarding default switched to gpt-image-1-mini

---
```

## Phase 4b で実行するコマンド（参考）

```bash
HIGHLIGHTS=$(cat <<'EOF'
## Highlights

- **19 new AI models** — 13 image (gpt-image-2, gpt-image-1-mini, Flux 2, Ideogram V3, SD 3.5 Large, Luma Photon, etc.) and 6 video (Seedance 2.0, Hailuo 2.3, PixVerse v5, etc.) models added to the dropdowns
- **Concurrency settings UI** — Set image/video/audio generation concurrency per project or as a default, to tune for your API plan's rate limits
- **Windows beat rendering fix** — HTML / Markdown / Chart / Mermaid beat generation now works reliably on Windows after Vite v8 migration
- **Model lineup updated** — dall-e-3 and Imagen 4.0 are no longer available. Onboarding default switched to gpt-image-1-mini

---
EOF
)

gh release create 1.0.14 \
  --title "1.0.14" \
  --generate-notes \
  --notes "$HIGHLIGHTS"
```

- `--generate-notes`: 前回タグ (`1.0.13`) からの PR 一覧を自動追加
- `--notes` の内容は `--generate-notes` の出力の**前に**挿入される
