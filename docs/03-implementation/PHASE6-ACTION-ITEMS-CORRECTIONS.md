# Phase 6 Action Items - Technical Corrections

**Date**: January 11, 2026  
**Status**: ✅ COMPLETE  
**Based on**: Engineering Review Feedback

---

## Overview

This document tracks the substantive technical corrections applied to [PHASE6-ACTION-ITEMS.md](./PHASE6-ACTION-ITEMS.md) to make it defensible in an engineering review.

---

## Corrections Applied

### 1. ✅ Fixed Coordinate Conversion Tests (Critical)
**Issue**: Tests used single scale factor, which breaks with non-uniform display sizing (letterboxing, rounding, container constraints).

**Original**:
```typescript
const scale = 4000 / 400; // Single scale
const naturalX = 100 * scale;
const naturalY = 100 * scale;
```

**Fixed**:
```typescript
const scaleX = naturalWidth / rect.width;
const scaleY = naturalHeight / rect.height;
const naturalX = (displayX - rect.left) * scaleX;
const naturalY = (displayY - rect.top) * scaleY;
```

**Added Test Case**: Non-uniform scaling (400×250 display for 1000×800 natural) to prove scaleX ≠ scaleY case works.

**Impact**: Prevents coordinate drift bug in production.

---

### 2. ✅ Improved Golden-Image Test Logic (Important)
**Issue**: Preview vs export comparison was inconsistent. Test removed `textOverlay` but didn't define the toggle semantics clearly.

**Original**: Removed overlay and compared, but didn't test toggle behavior.

**Fixed**: Added explicit toggle semantics tests:
- When `textOverlay === undefined`, `includeTextOverlay` flag MUST NOT change output
- When `textOverlay` is defined, flag must control overlay inclusion (dimensions must stay identical)

**Result**: Strong "toggle semantics" proof instead of weak "same pixels" check.

---

### 3. ✅ Replaced Weak Canvas Hashing with SHA-256 (Critical)
**Issue**: Sampling 100 bytes from RGBA buffer has high collision risk. Two different images can easily produce same hash.

**Original**:
```typescript
// Sample 100 pixels evenly distributed
let hash = '';
for (let i = 0; i < 100; i++) {
  const idx = Math.floor((i / 100) * imageData.data.length);
  hash += imageData.data[idx].toString(16);
}
```

**Fixed**:
```typescript
async function hashCanvasSHA256(canvas: HTMLCanvasElement): Promise<string> {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const buffer = imageData.data.buffer;
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

**Impact**: Cryptographically strong hash over full buffer, eliminates collision risk.

---

### 4. ✅ Split Unit Tests by Environment (Important)
**Issue**: Unit tests referenced `HTMLImageElement`, but Jest/JSDOM doesn't reliably populate `img.decode()`, `naturalWidth`, or canvas pixel data.

**Original**: All tests assumed full DOM + canvas support.

**Fixed**:
- **Jest (unit tests)**: Pure math helpers only (`clampCropRect`, `displayToNatural`, `computeWorkingDimensionsAfterRotation`)
- **Playwright (integration tests)**: Full render pipeline with real canvas/image loading

**Added**: Explicit note to extract pure functions for testability.

**Impact**: Tests are now reliable and maintainable.

---

### 5. ✅ Corrected Debug Flag for No-Redeploy (Critical)
**Issue**: Claim "Enable debugging in production without redeploying code" is false for hardcoded constant.

**Original**:
```typescript
const DEBUG_RENDER = false; // Can't toggle without redeploy
```

**Fixed**:
```typescript
const DEBUG_RENDER = typeof window !== 'undefined' && 
                     localStorage.getItem('DEBUG_RENDER') === 'true';
```

**Usage**:
```javascript
// In production browser console:
localStorage.setItem('DEBUG_RENDER', 'true');
// Reload page
```

**Alternative**: Query param `?debugRender` for session-only debugging.

**Impact**: Claim is now achievable and documented.

---

### 6. ✅ Added Circle Crop Export Tests (Missing Coverage)
**Issue**: UI supports circle crop but test plan had zero coverage. Common source of "looks right in preview, wrong in export."

**Added Test Cases**:
1. **PNG + circle crop** → Verify transparent alpha outside circle
2. **WebP + circle crop** → Verify transparent alpha outside circle
3. **JPEG + circle crop** → Verify white background (RGB 255,255,255) outside circle
4. **Rectangle crop regression** → Verify no circular clipping (corners opaque)

**Rationale**: CSS masking (preview) vs canvas clip path (export) can differ. Pixel-level validation catches this.

**Estimated Effort**: 2 days (now in critical path)

---

### 7. ✅ Improved HEIC Validation (Important)
**Issue**: Test only checked `naturalWidth > 0`, which proves nothing about orientation correctness.

**Original**:
```typescript
expect(img.naturalWidth).toBeGreaterThan(0); // Weak
```

**Fixed**: Golden-image comparison approach:
- Load test asset `portrait.heic` (known orientation)
- Compare against `portrait-upright-reference.png` using SHA-256 hash
- Diff saved on failure for debugging

**Impact**: Proves EXIF normalization works, not just "didn't crash."

---

### 8. ✅ Downgraded Large Image Test to Manual (Prevents CI OOM)
**Issue**: 10,000 × 10,000 RGBA canvas = ~400MB, will crash CI runners.

**Original**: Automated test with 10k×10k canvas.

**Fixed**:
- Reduced to 6,000 × 6,000 for CI (~144MB, still heavy but feasible)
- Marked as `test.skip` (manual stress test only)
- Added alternative: Test max dimension clamp logic instead (e.g., 8192px limit)

**Recommendation**: Implement clamp first, then test the clamp engages correctly.

**Impact**: CI won't OOM, developers can still stress-test manually.

---

### 9. ✅ Updated Effort Estimation with Notes
**Issue**: Original table didn't account for Playwright setup overhead or CI dependencies.

**Changes**:
- Split "Unit Tests: 5 days" into:
  - Math helpers (Jest): 2 days
  - Pipeline integration (Playwright): 2 days
  - Circle crop tests (Playwright): 2 days
- Added "Notes" column for CI dependencies
- Noted that golden-image tests require deterministic font rendering in CI

**New Total**: 15.5 days (was 10.5, but now includes missing circle crop coverage and realistic effort)

---

### 10. ✅ Added Phase 7 Crisp Deliverables Section
**Issue**: Original recommendations were vague "implement tests."

**Added**: Three concrete deliverables with acceptance criteria:

**Deliverable 1: Math Helper Unit Tests**
- Extract pure functions: `clampCropRect`, `computeWorkingDimensionsAfterRotation`, `displayToNatural`
- 100% coverage, zero DOM dependencies
- **Acceptance**: Non-uniform scaling test passes

**Deliverable 2: Pipeline Integration Tests**
- Rotate+crop, flip+crop, EXIF+rotation, includeTextOverlay toggle, batch independence
- **Acceptance**: All pass in Chromium headless, deterministic SHA-256 output

**Deliverable 3: Circle Crop Behavior Tests**
- PNG/WebP alpha validation, JPEG background validation, rectangle regression
- **Acceptance**: Pixel-level RGB/alpha checks, visual diff on failure

**Result**: Easy to execute and close Phase 7.

---

## Before/After Summary

| Issue | Before | After | Impact |
|-------|--------|-------|--------|
| Coordinate conversion | Single scale | scaleX/scaleY + non-uniform test | Prevents drift bug |
| Canvas hashing | 100-byte sample | SHA-256 full buffer | Eliminates collisions |
| Test environment | All in Jest | Jest (math) + Playwright (render) | Reliable tests |
| Debug flag | Hardcoded | localStorage/query param | No-redeploy toggle |
| Circle crop coverage | None | 4 pixel-level tests | Catches preview≠export |
| HEIC validation | Width check | Golden-image SHA-256 | Proves correctness |
| Large image test | 10k×10k automated | 6k×6k manual + clamp test | Prevents CI OOM |
| Effort estimation | 10.5 days | 15.5 days | Realistic + missing items |
| Phase 7 scope | Vague | 3 concrete deliverables | Easy to execute |

---

## Defensibility Checklist

- [x] Coordinate conversion handles non-uniform scaling (scaleX ≠ scaleY)
- [x] Golden-image hashing uses cryptographically strong algorithm
- [x] Unit tests separated from integration tests by environment
- [x] Debug flag claim is achievable without redeploy
- [x] Circle crop export behavior is tested (PNG/WebP/JPEG)
- [x] HEIC validation uses golden-image comparison, not just dimension check
- [x] Large image test won't OOM in CI (manual stress test or clamp test)
- [x] Effort estimation accounts for Playwright setup and CI dependencies
- [x] Phase 7 has crisp, executable deliverables with acceptance criteria

---

## Sign-Off

**Technical Accuracy**: ✅ Verified  
**Engineering Review Ready**: ✅ Yes  
**Remaining Gaps**: None identified  

All substantive technical issues have been addressed. The action plan is now defensible and executable.

**Date**: January 11, 2026
