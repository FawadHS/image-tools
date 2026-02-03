# Image Preflight improvement review (2026-02-03)

This document summarizes quality and correctness improvements found during a code review of Image Preflight. The focus is on tightening existing features before adding new ones.

## High priority fixes (user visible or correctness)
- Preserve and respect the central render pipeline. The single source of truth is `renderEditsToCanvas` in `src/utils/imageTransform.ts`, with the worker mirror in `src/workers/converter.worker.ts`. Any improvements must go through this pipeline so previews, exports, and worker conversions stay identical. Avoid adding ad-hoc transforms in UI components that bypass these functions.
- Fix mojibake / encoding issues in UI strings and comments. Several files show broken characters like "90Adeg", "Ax", and "A->" that appear to be UTF-8 text saved or read with the wrong encoding. This affects user visible labels and preset descriptions.
  - Examples: `src/components/ImageEditor.tsx`, `src/components/CropTool.tsx`, `src/components/DropZone.tsx`, `src/components/FileItem.tsx`, `src/constants/index.ts`, `src/utils/converter.ts`, `src/utils/imageTransform.ts`, `src/workers/converter.worker.ts`.
  - Fix by replacing the text with ASCII equivalents or correct UTF-8 characters, and ensure the repo is saved as UTF-8.
- Text overlay UI allows multiple overlays, but only the first overlay is persisted to the file transform. This causes data loss and confusing behavior.
  - `src/components/TextOverlayTool.tsx` saves only `overlays[0]` into `transform.textOverlay`.
  - Decide: either restrict the UI to a single overlay or update `ImageTransform` to store an array and render all overlays in preview and export.
- HEIC display preview object URLs are not revoked on file removal or clear, only on component unmount. This leaks memory, especially with large batches.
  - `src/hooks/useHeicConversion.ts` creates `displayPreview` URLs but only revokes on unmount, and the unmount cleanup closes over the initial `state.files` (often empty).
  - `src/hooks/useFileSelection.ts` revokes `preview` but not `displayPreview`.
- Removing duplicates bypasses cleanup. The duplicate removal path dispatches `REMOVE_FILE` directly, skipping preview URL cleanup.
  - `src/components/FileList.tsx` should call `removeFile` or a shared cleanup routine.
- Cancel conversion does not cancel the current conversion job; it only prevents the next file from starting. If a worker is running, it continues and may still update UI.
  - `src/hooks/useImageConverter.ts` uses `abortRef` only between files and does not signal the worker.
  - Add worker cancellation (terminate and recreate) or track a conversion token and ignore late results.
- Output format support is not checked at selection time. AVIF can be selected even if the browser does not support it.
  - `src/utils/converter.ts` has `isFormatSupported` but UI does not use it.
  - Use feature detection to disable unsupported formats and show a tooltip or warning.

## Medium priority fixes (quality, maintainability)
- Strip metadata option is misleading. All conversions go through canvas, which already strips metadata, so the toggle does not do anything meaningful.
  - `src/components/SettingsPanel.tsx` exposes the option; `src/utils/converter.ts` does not apply it.
  - Either remove the option or rework conversion to optionally preserve metadata (requires a different pipeline).
- Total size limit is defined but not enforced. You have `MAX_TOTAL_SIZE` but no guard on combined file sizes.
  - `src/constants/index.ts`, `src/hooks/useFileSelection.ts`.
- Hard coded conversion delays instead of constants.
  - `src/hooks/useImageConverter.ts` uses literal 50 and 100 while `UI_UPDATE_DELAY_MS` and `CONVERSION_DELAY_MS` exist.
- Duplicate preset definitions can drift. Presets are defined in both `src/constants/index.ts` and `src/utils/presets.ts`.
  - Consolidate to one source of truth.
- Remove button in file list propagates click to the file item and changes the active file before removal.
  - `src/components/FileItem.tsx` should call `e.stopPropagation()` for remove.
- Negative reduction is shown as "X percent smaller" even if the output is larger.
  - `src/components/FileItem.tsx` shows reduction without clamping or handling growth.

## UX polish and feature quality
- Crop tool interaction is draw only, no move or resize handles. Users cannot adjust an existing crop without re drawing it.
  - Consider drag to move and drag handles to resize, or add numeric inputs.
- Text overlay usability is basic. Consider adding alignment, outline or shadow options, and snapping to bounds.
- Image preview consistency could improve: use the same max width constant everywhere (ImageEditor uses `CANVAS_PREVIEW_MAX_WIDTH` but other tools use local values).
- Consider a background color option for circle crop to allow non white JPEG outputs.

## Performance and reliability
- HEIC conversion is done twice: once for preview and again for conversion. You could cache the converted blob per file and reuse it for conversion.
- Convert in worker: use `transfer` for large blobs if possible, and consider a progress event for more accurate UI.
- For large batches, consider slicing conversions with `requestIdleCallback` or an async queue to reduce UI jank.

## Testing and QA gaps
- There are TODOs for golden image tests and circle crop tests. These are important to lock the render pipeline behavior.
  - `docs/ROADMAP.md` and `docs/04-testing/TESTING-RESULTS.md` already call this out.
- Add unit tests for `renderEditsToCanvas` to validate transform order and for HEIC orientation normalization.

## Suggested order of fixes
1. Encoding cleanup (user visible text) and text overlay persistence.
2. Object URL cleanup and duplicate removal cleanup.
3. Worker cancel behavior and format support gating.
4. Strip metadata option and total size limit enforcement.
5. Consolidate presets and small UI polish.
