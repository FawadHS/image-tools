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
