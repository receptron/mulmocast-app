# fix: reduce `yarn lint:vue` (vue-tsc) errors without changing behaviour

Refs #1711

## Problem

`yarn lint:vue` has never run in CI, so `.vue` files were never type-checked and type errors accumulated
(`yarn type-check` is `tsc`, which skips `.vue`).

## Scope of this change

Only fixes whose runtime behaviour is unchanged for every value the UI can produce:

- Shared declarations brought in line with what the code already does:
  `ElectronAPI` (preload members), `Settings` (sort/view keys, top-level API keys), `MulmoProgressLog.cause`,
  multilingual prop type (`MulmoStudioMultiLingual`), media prop types accepting `null`/`undefined`.
- reka-ui emits (`AcceptableValue` / `StringOrNumber` / `boolean | "indeterminate"`) narrowed inside handlers.
- Optional-key lookups (`obj?.[maybeUndefined]`) routed through `valueForKey`.
- `beat.image` union narrowed with `imageOfType` / `urlSourceOf` / `pathSourceOf` where the parent already
  guarantees the type.
- Null guards placed exactly where the old code would throw a TypeError.
- `isValud` -> `isValid` (written and read consistently; `Project.isValid` already exists).

New pure helpers (`lib/key_lookup.ts`, `lib/type_guards.ts`, additions to `lib/beat_util.ts`, `toErrorCause`)
are covered by `test/test_renderer_type_helpers.ts`.

## Left out (needs a decision, listed on #1711)

Errors whose fix changes behaviour or needs a design choice: IPC/GraphAI result typing, `APP_LANGUAGE`
fallback, `keyName` vs `ENV_KEYS`, bugs revealed by the checker (lost `loadedmetadata` handlers, the
`mulmoEvent` watcher that never fires, `localeCompare(undefined)`), chat.vue (also touched by draft #1489),
parked `v-if="false"` UI.

Because `lint:vue` is still not clean, it is **not** added to CI in this change.
