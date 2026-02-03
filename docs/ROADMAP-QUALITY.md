# Image Preflight Quality Roadmap (Next Version)

Date: 2026-02-03

## Milestone 1: Pipeline and UX Correctness
- Fix encoding/mojibake in UI strings and docs.
- Text overlay persistence decision + implementation.
- Enforce central render pipeline usage in all tools.
- Adjust "percent smaller" messaging for size increases.
- Stop remove-button click propagation.

## Milestone 2: Memory and Stability
- Revoke display preview URLs on remove/clear.
- Ensure duplicate removal uses cleanup path.
- Implement conversion cancel token and worker termination.

## Milestone 3: Format and Options Accuracy
- Runtime format support gating (AVIF/WebP).
- Remove or implement metadata preservation toggle.
- Enforce total size limit on add.

## Milestone 4: Consistency and Maintainability
- Consolidate presets into one module.
- Standardize preview sizing constants across tools.

## Milestone 5: Testing and Release
- Unit tests for render pipeline order.
- Golden-image tests for circle crop and HEIC orientation.
- Smoke tests for cancel behavior and format gating.
- Update README + CHANGELOG; tag quality release.

## Milestone 6: Build Hygiene (Optional)
- Address bundle size warning for image-tools-utils via manualChunks or dynamic import.

### Split Plan (image-tools-utils)
Goal: reduce the single ~2.6 MB `image-tools-utils` chunk by splitting rarely used or heavy modules, without breaking the central render pipeline.

Phase A: Identify heavy imports (analysis only)
- Run `vite build --report` or add `rollup-plugin-visualizer` to inspect chunk composition.
- Note top modules by size (likely filters, HEIC decode, presets, crop/overlay helpers).
- Confirm which are used on initial load vs. lazy paths.

Phase A Findings (report mode, 2026-02-03)
- Dominant module: `heic-to/dist/heic-to.js` (~2465 kB rendered). This is the primary driver of the 2.6 MB utils chunk.
- Other notable modules: `jszip/dist/jszip.min.js` (~96 kB), `react-dropzone` (~37 kB), `file-selector` (~49 kB).
- Shopify UI components are sizable (ShopifyUploader ~33 kB, SkuMapper ~25 kB, ProductSearch ~18 kB).
- Core editor pieces are moderate (TextOverlayTool ~23 kB, CropTool ~22 kB, ImageEditor ~16 kB).

Phase B: Manual chunking (safe, low-risk)
- Add `build.rollupOptions.output.manualChunks` in `vite.config.ts`.
- Split into stable buckets:
  - `image-tools-vendor`: third-party deps (heic2any, jszip, etc.)
  - `image-tools-editor`: crop/filters/text overlay helpers
  - `image-tools-encode`: conversion/format helpers
  - `image-tools-history`: history/stat logic (if bundled)
- Verify lazy route still works and chunks load in correct order.

Phase C: Dynamic imports (targeted)
- Convert heavy optional features to `import()`:
  - HEIC decode path only when file is HEIC.
  - Optional tools (comparison slider, history panels) on demand.
- Keep `renderEditsToCanvas` and worker pipeline in the base chunk.

Phase D: Validate
- Ensure core flow (upload -> preview -> convert -> download) works.
- Check no regressions in text overlay, crop, or worker pipeline.
- Confirm chunk warning resolved or reduced.

Exit Criteria
- Largest chunk < 1 MB or warning resolved.
- No behavior regressions in render pipeline or worker conversions.
