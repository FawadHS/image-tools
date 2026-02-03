# Image Preflight Next Version Spec (v4.0.0 Quality Release)

Date: 2026-02-03
Scope: Quality and correctness improvements only (no new major features). All changes must preserve the central render pipeline.

## Goals
- Fix user-visible correctness issues and preserve output parity between preview and export.
- Reduce memory leaks and improve long-session stability.
- Ensure format support and UI options are accurate and defensible.
- Lock render behavior with targeted tests.

## Non-Goals
- No new tools or major UI redesign.
- No server-side processing.

## Central Pipeline Guardrail
- All image transforms must go through `renderEditsToCanvas` (main) or `renderEditsToOffscreenCanvas` (worker).
- UI components must not apply ad-hoc transforms that bypass these functions.

## Feature Requirements

### 1) Encoding and Copy Fixes
- Replace mojibake in UI strings and docs.
- Standardize file encoding to UTF-8.
- Acceptance: UI text shows correct degrees and dimension separators; no broken glyphs in presets or labels.

### 2) Text Overlay Persistence
- Decide on single-overlay vs multi-overlay persistence.
- If multi-overlay: update `ImageTransform` to store an array; update render pipeline to draw all overlays in order.
- If single-overlay: restrict UI to one overlay and remove multi-overlay UI affordances.
- Acceptance: saved overlay state matches UI, survives conversions, and re-opens correctly.
  - Decision (v4): single overlay only; UI enforces a single overlay and drag behavior is stable.

### 3) Object URL Cleanup
- Revoke `displayPreview` URLs on file removal and clear.
- Ensure HEIC display URLs are revoked even when removing duplicates.
- Acceptance: no growth in blob URLs after add/remove cycles.

### 4) Duplicate Removal Path Cleanup
- Duplicate removal must route through the same cleanup used for manual removal.
- Acceptance: removing duplicates frees preview URLs and does not leak memory.

### 5) Cancel Conversion Behavior
- Cancel must stop the current conversion (worker and main thread).
- Implement a cancellation token and worker termination/recreation.
- Acceptance: cancel halts progress immediately; no late progress updates or result writes.

### 6) Output Format Support Gating
- Detect support for AVIF and WebP at runtime.
- Disable unsupported formats in UI and show a tooltip or inline warning.
- Acceptance: conversion never attempts unsupported formats.

### 7) Strip Metadata Option Accuracy
- Either remove the toggle or implement real metadata preservation (likely remove for now).
- Acceptance: UI options reflect actual behavior; no misleading toggles.

### 8) Enforce Total Size Limit
- Apply `MAX_TOTAL_SIZE` in file selection.
- Provide a clear error message when exceeding the limit.
- Acceptance: add-files blocks when total size would exceed limit.

### 9) Preset Source of Truth
- Consolidate presets into one module and re-export where needed.
- Acceptance: only one preset definition exists; UI uses the same data as conversion logic.

### 10) Quality Polishing
- Prevent "percent smaller" messaging when file grows; show "percent larger" or "no reduction".
- Stop event propagation on remove button to avoid changing active file.
- Use shared preview sizing constants across editor tools.

## Testing Requirements
- Add unit tests for `renderEditsToCanvas` to validate transformation order.
- Add golden-image tests for circle crop and HEIC orientation.
- Add smoke tests for cancel behavior and format gating.

## Rollout
- Release as v4.0.0 (quality-focused major).
- Update README and changelog to highlight stability and parity improvements.
