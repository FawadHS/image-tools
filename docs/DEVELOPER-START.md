# Image Preflight - Developer Start

Last updated: February 6, 2026

This guide orients new developers on the Image Preflight codebase, workflows, and current status.

## Repo

- Local: C:\Users\Hussain\Fawad-Software-Projects\Image Preflight
- GitHub: https://github.com/FawadHS/image-preflight

## What this is

Image Preflight is a privacy-first, client-side image conversion + editing tool. It is:

- A standalone Vite + React + TypeScript web app.
- A reusable npm package: @fawadhs/image-preflight.

Optional AI enhancements are provided via a server-side proxy, but normal conversion remains entirely client-side.

## Current status (high level)

- Version: 3.1.0 (see package.json)
- Quality + UI uplift work is complete per docs/ROADMAP.md. Phase 9 editing upgrades are complete. Phase 10 UI layout is planned.
- AI Smart Compression is enabled.
- AI Upscale is temporarily disabled (UI + backend).

## Quick start

```bash
npm install
npm run dev
```

Build and preview:

```bash
npm run build
npm run preview
```

Tests:

```bash
npm test
npm run test:e2e
```

## Key architecture (must understand)

### Central render pipeline

- Single source of truth: renderEditsToCanvas() in src/utils/imageTransform.ts.
- Preview and export both use this pipeline.
- This is critical for correctness and should not be bypassed.

### Conversion flow

High-level path:

UI -> useImageConverter -> convertImage -> renderEditsToCanvas -> encode -> output

Files:

- src/hooks/useImageConverter.ts
- src/utils/converter.ts
- src/utils/imageTransform.ts
- src/components/FileList.tsx / FileItem.tsx

### Per-file state

- SelectedFile shape: src/types/index.ts
- Managed in ConverterContext: src/context/ConverterContext.tsx

Each file has independent transform state to avoid cross-contamination in batch runs.

### AI flow (async)

- Frontend: src/utils/aiEnhance.ts
- Backend proxy: Preflight Utility Suite backend
- Uses async queue + polling:
  - POST /api/ai/openai/image-async
  - GET /api/ai/openai/image-async/:id
  - GET /api/ai/openai/image-async/:id/result

Upscale is disabled; compress mode only.

## Repo layout

Key folders:

- src/components: UI panels + tools
- src/utils: conversion + transform pipeline
- src/hooks: conversion orchestration, file selection
- docs: specs, roadmaps, testing, changelog
- tests: jest tests
- playwright.config.ts: E2E test config

## Env configuration

- .env.development / .env.production
- VITE_AI_IMAGE_API_URL: enable AI proxy (compress only)

## Deployment

Deployment is handled from the main Preflight Utility Suite repo:

- C:\Users\Hussain\Fawad-Software-Projects\Preflight Utility Suite\scripts\deploy\deploy-image-preflight.ps1

Backend AI proxy deploy:

- deploy-backend.ps1 (same scripts folder)

## Roadmap + specs

- docs/ROADMAP.md
- docs/ROADMAP-QUALITY.md
- docs/01-specifications/
- CHANGELOG.md

## Known constraints

- All exports must use the unified render pipeline.
- HEIC conversion is lazy-loaded and must remain optional.
- Large AI payloads are sensitive to proxy timeouts and must be handled via async queue.

## Getting help

If you're unsure where to start:

- Review docs/ROADMAP.md for current priorities.
- Skim docs/ROADMAP-QUALITY.md for quality gates.
- Use src/utils/converter.ts + src/utils/imageTransform.ts to understand the core flow.
