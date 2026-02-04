# V4.1 Feature Expansion Specification

Date: 2026-02-04
Status: Draft

## Summary
V4.1 adds workflow-oriented features and performance upgrades on top of the V4 quality baseline. It preserves the unified render pipeline and adds batch tooling, metadata visibility, URL import, parallelism, and optional AI enhancements.

## Goals
- Add batch rename with e-commerce templates.
- Allow drag-reorder of the file queue.
- Provide EXIF viewer and optional metadata preservation path.
- Support URL import with clear CORS guidance (and optional proxy flow).
- Improve throughput with multi-worker parallelism and safe throttling.
- Add faster WebP/AVIF encoders via WASM when available.
- Integrate AI upscaling / smart compression via the existing AI API.

## Non-Goals
- Do not replace the central render pipeline.
- Do not change core UI layout unless required for new features.
- Avoid any server-side storage of user images (keep privacy-first).

## Architecture Principles
- `renderEditsToCanvas` remains the single source of truth for preview/export.
- Worker mirror must stay equivalent to the main render pipeline.
- Any metadata preservation is explicit, opt-in, and only when the output format supports it.
- Performance features must fail gracefully in unsupported browsers.

---

## Feature Requirements

### 1) Batch Rename
Scope:
- Prefix / suffix / sequence number / timestamp / dimensions.
- E-commerce templates (e.g. `{product}-{variant}-{size}` presets).

Requirements:
- Add a rename pattern input with template tokens.
- Show a live filename preview for the active file and an example for batch.
- Ensure filenames remain unique; auto-suffix with `-1`, `-2` if necessary.
- Persist rename settings in local storage.

Acceptance:
- Batch converts use the generated names in downloads and ZIP.
- Works with both single and multi-file export.

### 2) Drag Reorder Queue
Scope:
- Allow reordering of the file list before conversion.

Requirements:
- Drag handle per file row.
- Reordering updates conversion order and ZIP order.
- Keyboard accessible: move up/down shortcuts for focused file.

Acceptance:
- Convert order matches UI order.

### 3) EXIF Viewer + Metadata Preservation
Scope:
- Display key EXIF info for the selected file (camera, orientation, date, GPS if present).
- Optional metadata preservation for supported formats.

Requirements:
- EXIF panel in the right column or within file details.
- Metadata toggle is opt-in and disabled when not supported.
- If metadata preservation is enabled, use a compatible pipeline (no canvas re-encode for formats that can preserve metadata).

Acceptance:
- EXIF data shows for JPEG/HEIC when present.
- When preservation is disabled (default), output remains current behavior.

### 4) URL Import
Scope:
- Add image URL input with CORS guidance.
- Optional proxy flow (manual toggle), if configured.

Requirements:
- Validate URLs, show errors clearly.
- Provide a CORS explanation tooltip.
- For unsupported CORS, show explicit next steps.

Acceptance:
- Imports work for CORS-friendly URLs.

### 5) Multi-Worker Parallelism
Scope:
- Use multiple workers to process the queue faster.

Requirements:
- Configurable concurrency (auto: min(cores-1, 3)).
- Throttle to avoid UI hangs and memory spikes.
- Cancel should terminate all active workers and clean up state.

Acceptance:
- Conversion throughput improves without UI lockups.

### 6) WASM Encoders
Scope:
- Optional WASM path for WebP/AVIF when available.

Requirements:
- Detect availability and fallback to canvas.
- Maintain quality parity with existing output.

Acceptance:
- WebP/AVIF export works with or without WASM.

### 7) AI Upscaling / Smart Compression
Scope:
- Integrate with existing AI API (client-side request).

Requirements:
- Add UI choice between standard and AI mode.
- Define max file size and rate limits.
- Clear privacy notice and cost implications if applicable.

Acceptance:
- AI mode produces a valid output with predictable latency and error handling.

---

## UX / UI Notes
- Keep primary conversion flow unchanged.
- New controls appear in Settings or a new "Advanced" section.
- Non-critical panels (EXIF, history, Shopify) remain lazy-loaded.

## Data & State
- Add `renamePattern` and `renameTemplateId` to settings state.
- Store reorder state in `files` order in context.
- Preserve per-file overrides for rename and AI options.

## Testing
- Unit tests for rename token generation.
- E2E tests:
  - Drag reorder affects conversion order.
  - URL import happy path + error states.
  - EXIF viewer renders for a known fixture.
  - Parallel conversion does not break cancel.

## Rollout
- Implement as topic-based sprints (see roadmap).
- Each sprint includes tests, git push, and deployment.
