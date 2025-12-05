# MulmoCast App Version 1.0.8 - Internal Developer Release Notes

**Release Date:** December 5, 2025
**Base Version:** 1.0.7 (PR #1309)
**Total PRs:** 27

## Overview

Version 1.0.8 includes 27 merged PRs with major new features (Kotodama TTS, voice-over beats, beat referencing), enhanced media handling, validation improvements, bug fixes, and security updates.

---

## PR-by-PR Details

### Dependencies & Core Updates

#### PR #1310: Update mulmocast@2.0.7
- **Type:** Dependency Update
- **Branch:** `receptron/mulmocast@2.0.7`
- **Files:** `package.json`, `yarn.lock`
- **Changes:** Updated core MulmoCast library with latest features and fixes
- **Impact:** Enables new features in subsequent PRs (kotodama, voice-over, reference beats)

#### PR #1367: Bump @modelcontextprotocol/sdk 1.21.1 → 1.24.1
- **Type:** Dependency Update (Dependabot)
- **Files:** `yarn.lock`
- **Changes:** Updated MCP SDK dependency
- **Impact:** Internal dependency update, no user-facing changes

#### PR #1382: Bump jws 4.0.0 → 4.0.1
- **Type:** Security Update (Dependabot)
- **Files:** `yarn.lock`
- **Changes:** Security patch for JSON Web Signature library
- **Impact:** Improved security posture

---

### Major Features

#### PR #1311: Kotodama TTS Service Integration
- **Type:** Feature
- **Branch:** `receptron/kotodama`
- **Files Modified:**
  - `package.json` - Updated mulmocast version
  - `src/shared/constants.ts` - Added KOTODAMA_API_KEY, VOICE_LISTS.kotodama, DECORATION_LISTS.kotodama
  - `src/renderer/i18n/en.ts`, `ja.ts` - Added kotodama translations
  - `src/renderer/pages/project/script_editor/styles/speech_speaker.vue` - Added kotodama voice selection UI
  - `src/renderer/pages/project/script_editor/settings_alert.vue` - Added settings alert for missing API key
- **New Constants:**
  - `KOTODAMA_API_KEY` environment variable
  - Voices: `atla`, `poporo`, `jikkyo_baby`
  - Decorations: `neutral`, `happy`, `angry` (with English variants `neutral_en`, `happy_en`, `angry_en`)
- **Technical Details:** New Japanese TTS service with 3 voices and emotion decorations
- **User Impact:** New high-quality Japanese TTS option for content creation

#### PR #1315: Voice-Over Beat Type
- **Type:** Feature
- **Branch:** `receptron/voice_over`
- **Files Modified:**
  - `src/shared/beat_data.ts` - Added voice_over beat template
  - `src/renderer/i18n/en.ts`, `ja.ts` - Added voice_over translations
  - `src/renderer/pages/project/script_editor/beat_editor.vue` - Added voice_over UI support
  - `src/renderer/pages/project/script_editor/beat_preview_image.vue` - Added voice_over preview handling
- **New Beat Type:** `voice_over` - audio-only narration without image generation
- **Technical Details:** New beat type in beat_data schema, UI displays microphone icon for voice_over type
- **User Impact:** Create narration-only beats, save on image generation costs

#### PR #1316: Reference Beat System
- **Type:** Feature
- **Branch:** `receptron/referenceBeat`
- **Files Modified:**
  - `src/shared/beat_data.ts` - Added beat reference template
  - `src/renderer/i18n/en.ts`, `ja.ts` - Added reference beat translations
  - `src/renderer/pages/project/script_editor.vue` - Added beat list for selection
  - `src/renderer/pages/project/script_editor/beat_editor.vue` - Added reference beat selector UI
  - `src/renderer/pages/project/script_editor/beat_preview_image.vue` - Added reference beat preview logic
- **New Fields:** Beat objects can now have `beat` field referencing another beat's ID
- **Technical Details:** Beats can reference image/movie from other beats, UI includes dropdown selector
- **User Impact:** Reuse generated media across beats, maintain visual consistency

#### PR #1374: Beat Copy with Media Files
- **Type:** Feature
- **Branch:** `receptron/copy-251204`
- **Files Modified:**
  - `src/main/ipc_handler.ts` - Added `copyBeatMediaFiles` IPC handler
  - `src/main/project_manager.ts` - Implemented `copyBeatMediaFiles(projectId, fromBeatId, toBeatId)` function
  - `src/preload/preload.ts` - Exposed `copyBeatMediaFiles` API
  - `src/renderer/lib/project_api.ts` - Added API wrapper
  - `src/renderer/pages/project.vue` - Added `handleCopyBeat` function and refresh logic
  - `src/renderer/pages/project/script_editor.vue` - Connected copy button to IPC
  - `src/types/electron.d.ts` - Added type definition
- **New IPC Handler:** `'project:copyBeatMediaFiles'` - copies image, movie, lipSync, audio files
- **Technical Details:** Copies all media files (image, movie, lipSync, audio) from source beat to destination beat across IPC bridge
- **User Impact:** Duplicate beats with all their generated content intact

---

### Media Handling Features

#### PR #1325: Image Support for Movie Generation
- **Type:** Feature
- **Branch:** `receptron/imageSupportMovie`
- **Files Modified:**
  - `src/renderer/lib/beat_util.ts` - Added `enableMovieType()` utility function
  - `src/renderer/pages/project/script_editor/beat_editor.vue` - Added movie prompt support for image types
  - `src/renderer/pages/project/script_editor/beat_preview_movie.vue` - Refactored movie handling
- **New Utility:** `enableMovieType(beatType)` - returns true for image and upload_image types
- **Technical Details:** Image beats can now generate movies with custom motion prompts
- **User Impact:** Convert static images to animated videos

#### PR #1352: Uploaded Movie Lip-Sync Support
- **Type:** Feature
- **Branch:** `receptron/movieSupportLipSync`
- **Files Modified:**
  - `src/renderer/lib/beat_util.ts` - Added `enableLipSyncType()` utility
  - `src/renderer/pages/project/script_editor/beat_editor.vue` - Added lip-sync UI for uploaded movies
- **New Utility:** `enableLipSyncType(beatType)` - returns true for upload_movie type
- **Technical Details:** Uploaded videos can now have lip-sync applied via MulmoCast pipeline
- **User Impact:** Add lip-synced narration to uploaded videos

#### PR #1317 & #1324: Duration Controls Enhancement
- **Type:** Enhancement
- **Branches:** `receptron/moreDuration`, `receptron/durationAll`
- **Files Modified:**
  - `src/renderer/pages/project/script_editor/beat_editor.vue` - Enhanced duration input controls
- **Technical Details:** Improved duration settings UI for all beat types
- **User Impact:** Better control over beat timing with clearer UI

---

### Validation & Error Handling

#### PR #1372: Beat Reference Validation
- **Type:** Feature
- **Branch:** `receptron/feature/validate-beat-reference`
- **Files Modified:**
  - `src/renderer/i18n/en.ts`, `ja.ts` - Added `invalidReference` translation
  - `src/renderer/pages/project/script_editor/beat_editor.vue` - Added `isReferencedBeatValid` computed property, error display
- **New Validation:** Checks if referenced beat still exists in script
- **Technical Details:** Computed property validates beat reference, displays error message if invalid
- **User Impact:** Clear error messages when beat references are broken

#### PR #1375: Script-Level Beat Reference Validation
- **Type:** Feature
- **Branch:** `receptron/feature/validate-beat-reference-in-store`
- **Files Modified:**
  - `src/renderer/store/mulmo_script_history.ts` - Added validation to `isValidScript`
- **Technical Details:** Beat reference validation added to overall script validation in Pinia store
- **User Impact:** Prevents script execution with invalid references

---

### Refactoring & Code Quality

#### PR #1293: Media File Extensions Refactor
- **Type:** Refactor
- **Branch:** `receptron/MEDIA_FILE_EXTENSIONS`
- **Files Modified:**
  - `src/shared/constants.ts` - Enhanced `MEDIA_FILE_EXTENSIONS`, added MIME type mappings
  - `src/main/mulmo/fetch_url.ts` - Refactored to use new constants
- **Technical Details:**
  - Added `MIME_TO_EXTENSION` map for content-type to extension conversion
  - Added `EXTENSION_TO_MIME` map for extension to MIME type conversion
  - Centralized media type handling
- **User Impact:** None (internal improvement for maintainability)

#### PR #1357: Refactor Voice-Over Type Detection
- **Type:** Refactor
- **Branch:** `receptron/refactor-251201-2`
- **Files Modified:**
  - `src/renderer/pages/project/script_editor/beat_editor.vue` - Moved type detection to computed property
- **Technical Details:** Converted inline type checking to reactive computed property
- **User Impact:** None (internal improvement for code quality)

#### PR #1371: Refactor Beat Deletion
- **Type:** Refactor
- **Branch:** `receptron/refactorBeatDelete`
- **Files Modified:**
  - `src/renderer/pages/composable.ts` - Added `deleteImageData()`, `deleteAudioData()` utilities
  - `src/renderer/pages/project.vue` - Moved `deleteBeat` logic here from script_editor
  - `src/renderer/pages/project/script_editor.vue` - Changed to emit `deleteBeat` event
- **Technical Details:**
  - Centralized beat deletion logic in parent component
  - Added proper media cleanup utilities
  - Deletes image, movie, lipSync, and audio files when beat is deleted
- **User Impact:** Cleaner project directories, no orphaned media files

---

### UI/UX Improvements

#### PR #1335: Open Log Folder Menu Item
- **Type:** Feature
- **Branch:** `receptron/openLogFolder`
- **Files Modified:**
  - `src/main/logger.ts` - Exposed log directory path via `getLogDirectory()`
  - `src/main/menu.ts` - Added "Open Log Folder" menu item under Help menu
  - `src/renderer/i18n/en.ts`, `ja.ts` - Added menu translations
- **New Menu Item:** Help → Open Log Folder
- **Technical Details:** Opens system file browser to log directory
- **User Impact:** Easy access to logs for troubleshooting

#### PR #1337: Native Menu Cleanup
- **Type:** Enhancement
- **Branch:** `receptron/cleanupNativeMenu`
- **Files Modified:**
  - `src/main/menu.ts` - Reorganized menu structure
- **Technical Details:** Cleaned up native application menu organization
- **User Impact:** More intuitive menu layout

#### PR #1354: Voice-Over UI Design
- **Type:** Enhancement
- **Branch:** `receptron/design-251201-2`
- **Files Modified:**
  - `src/renderer/i18n/en.ts`, `ja.ts` - Added voice-over UI strings
  - `src/renderer/pages/project/script_editor/beat_editor.vue` - Hid duration and movie prompt for voice_over type
  - `src/renderer/pages/project/script_editor/beat_preview_image.vue` - Updated voice_over preview
- **Technical Details:** Conditional UI rendering based on beat type
- **User Impact:** Cleaner UI for voice-over beats (hides irrelevant fields)

---

### Internationalization (i18n)

#### PR #1358: i18n Audio Spillover
- **Type:** i18n
- **Branch:** `receptron/i18n-251201`
- **Files Modified:**
  - `src/renderer/i18n/en.ts`, `ja.ts` - Added spillover explanation strings
- **New Translations:** `project.spilloverExplain`
- **User Impact:** Better explanation of audio generation spillover feature

#### PR #1369: i18n Reference Beat
- **Type:** i18n
- **Branch:** `receptron/i18n-251204`
- **Files Modified:**
  - `src/renderer/i18n/en.ts`, `ja.ts` - Added reference beat strings
  - `src/renderer/pages/project/script_editor/beat_editor.vue` - Added tooltips
  - `src/renderer/pages/project/script_editor/beat_preview_image.vue` - Updated labels
  - `src/renderer/pages/project/script_editor/charactor.vue` - Updated text
- **New Translations:** Reference beat explanations and tooltips
- **User Impact:** Clearer UI guidance for reference beat feature

#### PR #1373: i18n Reference Beat Note
- **Type:** i18n
- **Branch:** `receptron/i18n-251204-2`
- **Files Modified:**
  - `src/renderer/i18n/en.ts`, `ja.ts` - Added reference beat note
  - `src/renderer/pages/project/script_editor/beat_editor.vue` - Added informational note
- **New Translations:** `project.referenceBeatNote`
- **User Impact:** Added note explaining reference beat behavior

---

### Bug Fixes

#### PR #1359: Fix Movie Generation
- **Type:** Bug Fix
- **Branch:** `receptron/fixMovieGenrerate`
- **Files Modified:**
  - `src/renderer/pages/project/script_editor/beat_editor.vue` - Fixed movie generation logic
  - `src/renderer/pages/project/script_editor/beat_preview_movie.vue` - Removed redundant code
- **Issue:** Movie generation failing in certain scenarios
- **Fix:** Corrected conditional logic for movie generation triggers
- **User Impact:** More reliable movie generation

#### PR #1370: Fix Reference Beat Selection
- **Type:** Bug Fix
- **Branch:** `receptron/notReference`
- **Files Modified:**
  - `src/renderer/pages/project/script_editor/beat_editor.vue` - Fixed reference logic
- **Issue:** Reference beat selection not working correctly
- **Fix:** Corrected beat reference selection behavior
- **User Impact:** Reference beat selection works as expected

#### PR #1376: Fix Extension Matching
- **Type:** Bug Fix
- **Branch:** `receptron/mime-251205`
- **Files Modified:**
  - `src/main/mulmo/fetch_url.ts` - Removed leading dot from extension matching
- **Issue:** Extension detection failing in `fetchAndSave()`
- **Fix:** Changed `extensions.includes(`.${ext}`)` to `extensions.includes(ext)`
- **User Impact:** More reliable media file downloads from URLs

#### PR #1380: Remove Unsupported Video Formats
- **Type:** Bug Fix / Cleanup
- **Branch:** `receptron/feature/remove-unsupported-video-formats`
- **Files Modified:**
  - `src/shared/constants.ts` - Removed OGG, OGV, MPEG, MPG, MP2T from `MEDIA_FILE_EXTENSIONS.video` and MIME mappings
  - `src/renderer/pages/project/script_editor/beat_editors/media.vue` - Updated file accept types
- **Issue:** Unsupported video formats shown in UI causing user confusion
- **Fix:** Removed formats that were never fully supported by MulmoCast pipeline
- **User Impact:** Only supported formats (MP4, MOV, WebM) shown in file picker

#### PR #1381: Fix Image Reference Preview
- **Type:** Bug Fix
- **Branch:** `receptron/fixImageReferencePreview`
- **Files Modified:**
  - `src/renderer/lib/utils.ts` - Enhanced image reference handling
  - `src/renderer/pages/project/script_editor/charactor.vue` - Fixed preview display logic
- **Issue:** Referenced beat images not displaying correctly in preview
- **Fix:** Improved image reference resolution logic
- **User Impact:** Referenced images display correctly in preview pane

---

## Technical Summary

### Architecture Changes

1. **New IPC Handler:**
   - `project:copyBeatMediaFiles` - Copies all media files between beats

2. **New Utilities in `beat_util.ts`:**
   - `enableMovieType(beatType)` - Determines if beat type supports movie generation
   - `enableLipSyncType(beatType)` - Determines if beat type supports lip-sync

3. **New Beat Types:**
   - `voice_over` - Audio-only narration beat
   - Beat reference system via `beat` field

4. **Enhanced Constants:**
   - `KOTODAMA_API_KEY` environment variable
   - Voice lists for Kotodama (atla, poporo, jikkyo_baby)
   - Decoration lists with English variants
   - Improved MIME type mappings

5. **Enhanced Validation:**
   - Beat reference validation at component level (PR #1372)
   - Beat reference validation at store level (PR #1375)

### Code Quality Improvements

- Centralized media type handling (PR #1293)
- Proper media file cleanup on beat deletion (PR #1371)
- Computed properties for better reactivity (PR #1357)
- Consistent i18n coverage (PRs #1358, #1369, #1373)

### Files Most Modified

1. `src/renderer/pages/project/script_editor/beat_editor.vue` - Core beat editing UI (modified in 12+ PRs)
2. `src/renderer/i18n/en.ts`, `ja.ts` - Internationalization (modified in 7 PRs)
3. `src/shared/constants.ts` - Application constants (modified in 4 PRs)
4. `src/shared/beat_data.ts` - Beat templates (modified in 3 PRs)
5. `src/renderer/pages/project/script_editor/beat_preview_image.vue` - Image preview (modified in 5 PRs)

---

## Statistics

- **Total PRs:** 27
- **Features:** 9
- **Bug Fixes:** 6
- **Refactoring:** 4
- **i18n:** 4
- **Dependencies:** 3
- **UI/UX:** 3

---

## Testing Recommendations

1. **Kotodama TTS:**
   - Test all 3 voices (atla, poporo, jikkyo_baby)
   - Test all decorations (neutral, happy, angry, and English variants)
   - Verify API key handling

2. **Voice-Over Beats:**
   - Create voice-over beat and verify no image generation
   - Test audio generation for voice-over type
   - Verify UI hides irrelevant fields

3. **Reference Beats:**
   - Create beat that references another beat's image
   - Delete referenced beat and verify validation error
   - Test beat reference preview display

4. **Beat Copying:**
   - Copy beat with all media files (image, audio, movie, lipSync)
   - Verify all files are copied correctly
   - Test cross-beat-type copying

5. **Media Handling:**
   - Upload image and convert to movie
   - Upload movie and apply lip-sync
   - Test duration controls

6. **File Format Validation:**
   - Verify only MP4, MOV, WebM shown in video file picker
   - Test that unsupported formats are rejected

7. **Deletion:**
   - Delete beats and verify all media files are removed
   - Check for orphaned files in project directory

---

## Migration Notes

- No breaking changes
- Fully backward compatible with 1.0.7 projects
- New beat types available immediately
- Kotodama requires separate API key (optional)

---

## Known Issues

- Reference beats cannot reference other reference beats (by design)
- Beat references not automatically updated if source beat changes
- Video format support limited to MP4, MOV, WebM

---

**Version:** 1.0.8
**Released:** December 5, 2025
**Previous Version:** 1.0.7
**Commit:** e64d35f
