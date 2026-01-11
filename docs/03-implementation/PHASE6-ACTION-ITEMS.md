# Phase 6 Post-Audit Action Items

> **Generated**: January 11, 2026  
> **Based on**: Technical Review and Code Audit  
> **Priority**: Defensibility and Quality Assurance

---

## Status Summary

**Completed**: 5/5 documentation fixes  
**Pending**: 5 testing/validation items (optional, non-blocking)

---

## A) Documentation Fixes ✅ COMPLETE

### 1. ✅ Renamed "DPR Handling" → "Natural-Resolution Rendering"
**Issue**: Misleading terminology—not true DPR handling (cssWidth × devicePixelRatio).  
**Fix**: Renamed to accurately reflect "render at natural resolution, display scaled" approach.  
**Files Updated**: PHASE6-AUDIT.md

### 2. ✅ Clarified "Stable File IDs" → "Unique File IDs (Per-Session)"
**Issue**: IDs regenerate on reload (not persistent), so "stable" is misleading.  
**Fix**: Clarified as "unique per session, collision-resistant."  
**Files Updated**: PHASE6-AUDIT.md

### 3. ✅ Added EXIF Boundary Conditions
**Issue**: Audit didn't note failure modes for non-JPEG or malformed data.  
**Fix**: Added explicit note: "Defaults to orientation=1 on parse failure or non-JPEG."  
**Files Updated**: PHASE6-AUDIT.md

### 4. ✅ Clarified Original File Usage
**Issue**: "Never touches original" is too strong—optimization could short-circuit.  
**Fix**: Added caveat: "except when no transforms are applied as optimization."  
**Files Updated**: PHASE6-AUDIT.md

### 5. ✅ Created Render Pipeline Contract (Updated with Technical Review Fixes)
**Issue**: No canonical reference document for coordinate spaces and operation order.  
**Fix**: Created [RENDER-PIPELINE-CONTRACT.md](./RENDER-PIPELINE-CONTRACT.md) with:
- Coordinate space definitions (natural, display, transformed)
- Transform operation order (EXIF→rotate→flip→filters→crop→overlay)
- Export behavior specification
- Integration point documentation
- Validation test cases

**Additional Fixes Applied**:
- ✅ Fixed display→natural conversion formula to use separate scaleX/scaleY (prevents non-square scaling bug)
- ✅ Added explicit coordinate ownership clarification (crop vs overlay spaces)
- ✅ Added TextOverlayTool overlay layer rendering note
- ✅ Made HEIC statement implementation-agnostic
- ✅ Added Contract Assertions section with runtime invariants
- ✅ Defined filter ranges and CSS mappings
- ✅ Specified circle crop export semantics (alpha handling for PNG/WebP/JPEG)
- ✅ Added export format rules (PNG/WebP preserve alpha, JPEG requires background fill)
- ✅ Added non-uniform scaling test case
- ✅ Added circle crop + JPEG export test case
- ✅ Defined "identical output" criteria for regression tests

**Files Created**: RENDER-PIPELINE-CONTRACT.md

---

## B) Validation Tests (Recommended, Non-Blocking)

### Priority: HIGH

#### 1. Unit Tests for Render Pipeline

**Test Strategy**:
- **Jest (unit tests)**: Pure math helpers (coordinate conversion, dimension calculation, crop clamping)
- **Playwright (integration tests)**: Full render pipeline with real canvas/image loading

**Rationale**: Jest/JSDOM doesn't reliably populate `img.naturalWidth`, `img.decode()`, or canvas pixel data. Extract pure functions for unit testing, use Playwright for pixel-perfect validation.

**Test Cases (Pure Math Helpers)**:
```typescript
// Extract testable helpers:
export function clampCropRect(
  crop: CropRect,
  maxWidth: number,
  maxHeight: number
): CropRect {
  return {
    x: Math.max(0, crop.x),
    y: Math.max(0, crop.y),
    width: Math.min(crop.width, maxWidth - crop.x),
    height: Math.min(crop.height, maxHeight - crop.y)
  };
}

export function computeWorkingDimensionsAfterRotation(
  width: number,
  height: number,
  rotation: number
): { width: number; height: number } {
  if (rotation === 90 || rotation === 270) {
    return { width: height, height: width };
  }
  return { width, height };
}

describe('crop clamping', () => {
  test('clamps crop extending beyond bounds', () => {
    const result = clampCropRect(
      { x: 900, y: 700, width: 200, height: 200 },
      1000, 800
    );
    expect(result).toEqual({ x: 900, y: 700, width: 100, height: 100 });
  });
  
  test('ensures minimum 1×1 crop', () => {
    const result = clampCropRect(
      { x: 1000, y: 800, width: 0, height: 0 },
      1000, 800
    );
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
  });
});

describe('rotation dimension swap', () => {
  test('90° rotation swaps dimensions', () => {
    const result = computeWorkingDimensionsAfterRotation(1000, 800, 90);
    expect(result).toEqual({ width: 800, height: 1000 });
  });
  
  test('180° rotation keeps dimensions', () => {
    const result = computeWorkingDimensionsAfterRotation(1000, 800, 180);
    expect(result).toEqual({ width: 1000, height: 800 });
  });
});
```

**Test Cases (Playwright Integration)**:
```typescript
describe('renderEditsToCanvas (Playwright)', () => {
  test('rotate 90° + crop corner', () => {
    // Original: 1000×800
    // After 90° rotation: 800×1000
    // Crop (0, 0, 100, 100) should extract top-left 100×100
    const result = renderEditsToCanvas(img, {
      rotation: 90,
      crop: { x: 0, y: 0, width: 100, height: 100 }
    });
    expect(result.width).toBe(100);
    expect(result.height).toBe(100);
  });

  test('flip horizontal + crop right half', () => {
    // Original: 1000×800
    // After flip: still 1000×800 but mirrored
    // Crop (500, 0, 500, 800) should get left half of original
    const result = renderEditsToCanvas(img, {
      flipHorizontal: true,
      crop: { x: 500, y: 0, width: 500, height: 800 }
    });
    expect(result.width).toBe(500);
    expect(result.height).toBe(800);
    // Manual: Visual check that it's the left half of original
  });
});
```

**Estimated Effort**: 2 days (Jest helpers) + 2 days (Playwright integration) = 4 days  
**Suggested Phase**: Phase 7

---

#### 1b. Circle Crop Export Tests (Critical Missing Coverage)
**Test Cases (Playwright)**:
```typescript
describe('circle crop export format behavior', () => {
  test('PNG with circle crop preserves alpha', async () => {
    const img = loadTestImage('1000x800-solid-blue.png');
    const transform = {
      crop: { x: 250, y: 150, width: 500, height: 500, shape: 'circle' }
    };
    
    const canvas = renderEditsToCanvas(img, transform);
    const blob = await canvasToBlob(canvas, 'image/png');
    
    // Load exported image and check alpha channel
    const exportedImg = await loadImage(blob);
    const ctx = canvas.getContext('2d')!;
    const centerPixel = ctx.getImageData(250, 250, 1, 1).data; // Inside circle
    const cornerPixel = ctx.getImageData(0, 0, 1, 1).data;     // Outside circle
    
    expect(centerPixel[3]).toBe(255); // Opaque inside
    expect(cornerPixel[3]).toBe(0);   // Transparent outside
  });
  
  test('WebP with circle crop preserves alpha', async () => {
    const img = loadTestImage('1000x800-solid-blue.webp');
    const transform = {
      crop: { x: 250, y: 150, width: 500, height: 500, shape: 'circle' }
    };
    
    const canvas = renderEditsToCanvas(img, transform);
    const blob = await canvasToBlob(canvas, 'image/webp');
    
    const exportedImg = await loadImage(blob);
    const ctx = canvas.getContext('2d')!;
    const centerPixel = ctx.getImageData(250, 250, 1, 1).data;
    const cornerPixel = ctx.getImageData(0, 0, 1, 1).data;
    
    expect(centerPixel[3]).toBe(255); // Opaque inside
    expect(cornerPixel[3]).toBe(0);   // Transparent outside
  });
  
  test('JPEG with circle crop fills white background', async () => {
    const img = loadTestImage('1000x800-solid-blue.jpg');
    const transform = {
      crop: { x: 250, y: 150, width: 500, height: 500, shape: 'circle' }
    };
    
    // Note: JPEG export path in converter.ts should fill background
    const blob = await convertToFormat(img, transform, 'image/jpeg');
    
    const exportedImg = await loadImage(blob);
    const canvas = document.createElement('canvas');
    canvas.width = exportedImg.naturalWidth;
    canvas.height = exportedImg.naturalHeight;
    const ctx = canvas.getContext('2d', { alpha: false })!;
    ctx.drawImage(exportedImg, 0, 0);
    
    const centerPixel = ctx.getImageData(250, 250, 1, 1).data; // Inside circle (blue)
    const cornerPixel = ctx.getImageData(0, 0, 1, 1).data;     // Outside circle (white)
    
    expect(cornerPixel[0]).toBe(255); // R = 255
    expect(cornerPixel[1]).toBe(255); // G = 255
    expect(cornerPixel[2]).toBe(255); // B = 255
    // JPEG has no alpha channel, so cornerPixel[3] is not tested
  });
  
  test('rectangle crop still works (regression)', async () => {
    const img = loadTestImage('1000x800-solid-blue.png');
    const transform = {
      crop: { x: 100, y: 100, width: 400, height: 300, shape: 'rectangle' }
    };
    
    const canvas = renderEditsToCanvas(img, transform);
    expect(canvas.width).toBe(400);
    expect(canvas.height).toBe(300);
    
    // All pixels should be opaque (no circular mask)
    const ctx = canvas.getContext('2d')!;
    const cornerPixel = ctx.getImageData(0, 0, 1, 1).data;
    expect(cornerPixel[3]).toBe(255); // Rectangle doesn't clip corners
  });
});
```

**Rationale**: UI supports circle crop, but preview can differ from export (CSS mask vs canvas clip path). This is a frequent source of "looks right in editor, wrong in external viewer."

**Estimated Effort**: 2 days  
**Suggested Phase**: Phase 7
```

**Estimated Effort**: 2 days  
**Suggested Phase**: Phase 7

---

#### 2. Coordinate Conversion Tests (Pure Math Helpers)
**Test Cases**:
```typescript
describe('displayToNatural coordinate conversion', () => {
  test('uniform scaling (square container)', () => {
    // Natural: 4000×3000, Display rect: 400×300
    // Click at (100, 100) display
    const canvas = { getBoundingClientRect: () => ({ 
      width: 400, height: 300, left: 0, top: 0 
    })};
    const scaleX = 4000 / 400; // 10
    const scaleY = 3000 / 300; // 10
    const naturalX = (100 - 0) * scaleX; // = 1000
    const naturalY = (100 - 0) * scaleY; // = 1000
    expect(naturalX).toBe(1000);
    expect(naturalY).toBe(1000);
  });

  test('non-uniform scaling (letterboxed/constrained)', () => {
    // Natural: 1000×800, Display rect: 400×250 (rounding or constraint)
    // This tests the critical scaleX ≠ scaleY case
    const canvas = { getBoundingClientRect: () => ({ 
      width: 400, height: 250, left: 0, top: 0 
    })};
    const scaleX = 1000 / 400; // 2.5
    const scaleY = 800 / 250;  // 3.2
    
    // Click at display (200, 100)
    const naturalX = 200 * scaleX; // 500
    const naturalY = 100 * scaleY; // 320
    expect(naturalX).toBe(500);
    expect(naturalY).toBe(320);
    expect(scaleX).not.toBe(scaleY); // Prove non-uniform case
  });
  
  test('offset container (scrolled/positioned)', () => {
    // Natural: 2000×1500, Display rect at (50, 30) with 400×300 size
    const canvas = { getBoundingClientRect: () => ({ 
      width: 400, height: 300, left: 50, top: 30 
    })};
    const scaleX = 2000 / 400; // 5
    const scaleY = 1500 / 300; // 5
    
    // Mouse at screen position (150, 130) = display position (100, 100)
    const naturalX = (150 - 50) * scaleX; // 500
    const naturalY = (130 - 30) * scaleY; // 500
    expect(naturalX).toBe(500);
    expect(naturalY).toBe(500);
  });
});
```

**Implementation Note**: Extract `displayToNatural()` as pure function for testability:
```typescript
export function displayToNatural(
  displayX: number, displayY: number,
  rect: DOMRect,
  naturalWidth: number, naturalHeight: number
): { x: number; y: number } {
  const scaleX = naturalWidth / rect.width;
  const scaleY = naturalHeight / rect.height;
  return {
    x: (displayX - rect.left) * scaleX,
    y: (displayY - rect.top) * scaleY
  };
}
```

**Test Environment**: Jest (pure math, no DOM dependencies)

**Estimated Effort**: 1 day  
**Suggested Phase**: Phase 7

---

#### 3. EXIF Orientation Tests
**Test Cases**:
```typescript
describe('EXIF orientation', () => {
  test.each([
    [1, 'no transform'],
    [2, 'flip horizontal'],
    [3, 'rotate 180'],
    [4, 'flip vertical'],
    [5, 'rotate 90 + flip'],
    [6, 'rotate 90 CW'],
    [7, 'rotate 270 + flip'],
    [8, 'rotate 270 CW'],
  ])('handles EXIF orientation %d (%s)', async (orientation, description) => {
    const mockJpegBlob = createMockJpegWithOrientation(orientation);
    const img = await loadImageWithExif(mockJpegBlob);
    
    // All orientations should normalize to upright image
    // Visual inspection or dimension check required
    expect(img.naturalWidth).toBeGreaterThan(0);
    expect(img.naturalHeight).toBeGreaterThan(0);
  });

  test('defaults to orientation 1 for non-JPEG', async () => {
    const pngBlob = new Blob([pngData], { type: 'image/png' });
    const img = await loadImageWithExif(pngBlob);
    // Should not throw, should load normally
    expect(img).toBeDefined();
  });

  test('handles malformed EXIF data', async () => {
    const corruptedJpeg = createCorruptedJpegBlob();
    const img = await loadImageWithExif(corruptedJpeg);
    // Should default to orientation 1, not throw
    expect(img).toBeDefined();
  });
});
```

**Estimated Effort**: 2 days (includes creating mock JPEG data)  
**Suggested Phase**: Phase 7

---

### Priority: MEDIUM

#### 4. Golden-Image Regression Tests (Playwright)
**Approach**:
```typescript
describe('render determinism', () => {
  test('includeTextOverlay toggle semantics', async () => {
    // When textOverlay is undefined, flag must not change output
    const transformWithoutText = { rotation: 90, crop: {...} };
    const canvas1 = renderEditsToCanvas(img, transformWithoutText, false);
    const canvas2 = renderEditsToCanvas(img, transformWithoutText, true);
    
    const hash1 = await hashCanvasSHA256(canvas1);
    const hash2 = await hashCanvasSHA256(canvas2);
    expect(hash1).toBe(hash2); // Must be identical
  });
  
  test('includeTextOverlay=true includes overlay', async () => {
    const transformWithText = { 
      rotation: 90, 
      textOverlay: { text: 'Test', x: 10, y: 10 } 
    };
    
    // With overlay off
    const canvasWithout = renderEditsToCanvas(img, transformWithText, false);
    // With overlay on
    const canvasWith = renderEditsToCanvas(img, transformWithText, true);
    
    // Dimensions must match
    expect(canvasWithout.width).toBe(canvasWith.width);
    expect(canvasWithout.height).toBe(canvasWith.height);
    
    // Pixels must differ (overlay present)
    const hash1 = await hashCanvasSHA256(canvasWithout);
    const hash2 = await hashCanvasSHA256(canvasWith);
    expect(hash1).not.toBe(hash2);
  });

  test('same input produces same output', async () => {
    const canvas1 = renderEditsToCanvas(img, transform);
    const canvas2 = renderEditsToCanvas(img, transform);
    
    const hash1 = await hashCanvasSHA256(canvas1);
    const hash2 = await hashCanvasSHA256(canvas2);
    expect(hash1).toBe(hash2);
  });
});

// Strong hash over full RGBA buffer (prevents collisions)
async function hashCanvasSHA256(canvas: HTMLCanvasElement): Promise<string> {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // Hash entire Uint8ClampedArray
  const buffer = imageData.data.buffer;
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

**Test Environment**: Playwright (Chromium) for real canvas rendering  
**CI Requirements**: Headless browser, deterministic fonts

**Estimated Effort**: 3 days (includes CI setup)  
**Suggested Phase**: Phase 7

---

#### 5. HEIC + EXIF Validation (Golden-Image)
**Test Case**:
```typescript
test('HEIC orientation matches known upright reference', async () => {
  // Test asset: portrait.heic (1000×1500 with orientation metadata)
  // Expected: After conversion, image displays upright
  
  const heicFile = loadTestFile('portrait.heic');
  const blob = await convertHeicToBlob(heicFile);
  const img = await loadImageWithExif(blob);
  
  // Render to canvas
  const canvas = renderEditsToCanvas(img, undefined);
  
  // Compare against known-good reference
  const goldenImage = loadTestFile('portrait-upright-reference.png');
  const goldenCanvas = await imageToCanvas(goldenImage);
  
  const hash1 = await hashCanvasSHA256(canvas);
  const hash2 = await hashCanvasSHA256(goldenCanvas);
  
  expect(hash1).toBe(hash2);
  // If hash differs, save diff: saveDiffImage(canvas, goldenCanvas, 'portrait-diff.png')
});

test('HEIC without orientation metadata loads correctly', async () => {
  const heicFile = loadTestFile('no-orientation.heic');
  const blob = await convertHeicToBlob(heicFile);
  const img = await loadImageWithExif(blob);
  
  // Should default to orientation=1 and not throw
  expect(img.naturalWidth).toBeGreaterThan(0);
  expect(img.naturalHeight).toBeGreaterThan(0);
});
```

**Test Assets Required**:
- `portrait.heic` - Known HEIC with orientation metadata
- `portrait-upright-reference.png` - Expected output after normalization
- `no-orientation.heic` - HEIC without EXIF

**Estimated Effort**: 2 days (includes creating test assets)  
**Suggested Phase**: Phase 7

---

### Priority: LOW

#### 6. Large Image Memory Test (Manual Stress Test)
**Test Case**:
```typescript
// NOTE: 10k×10k = ~400MB RGBA buffer, will OOM in CI
// Run manually or implement max dimension clamp first

test.skip('handles 6k×6k images gracefully', () => {
  // 6,000 × 6,000 = ~144MB (still heavy, but CI-feasible)
  const largeCanvas = document.createElement('canvas');
  largeCanvas.width = 6000;
  largeCanvas.height = 6000;
  const ctx = largeCanvas.getContext('2d');
  ctx.fillStyle = 'blue';
  ctx.fillRect(0, 0, 6000, 6000);
  
  const largeImg = new Image();
  largeImg.src = largeCanvas.toDataURL();
  
  // Should not crash (may be slow)
  const result = renderEditsToCanvas(largeImg, { rotation: 90 });
  expect(result.width).toBe(6000);
  expect(result.height).toBe(6000);
});

test('max dimension clamp prevents OOM', () => {
  // If MAX_DIMENSION = 8192 is implemented:
  const hugeCanvas = document.createElement('canvas');
  hugeCanvas.width = 12000;
  hugeCanvas.height = 12000;
  
  // Should clamp to 8192×8192 and not allocate 12k×12k
  const result = renderEditsToCanvas(hugeImg, undefined);
  expect(result.width).toBeLessThanOrEqual(8192);
  expect(result.height).toBeLessThanOrEqual(8192);
});
```

**Recommendation**: Implement max dimension clamp (e.g., 8192px) and test the clamp logic instead of raw 10k×10k processing.

**Estimated Effort**: 1 day  
**Suggested Phase**: Phase 8

---

## C) Production Observability (Optional)

### Debug Flag Implementation (Runtime Toggle)
**Add to `renderEditsToCanvas()`**:

```typescript
// Runtime toggle - enable in production browser console:
// localStorage.setItem('DEBUG_RENDER', 'true')
const DEBUG_RENDER = typeof window !== 'undefined' && 
                     localStorage.getItem('DEBUG_RENDER') === 'true';

export const renderEditsToCanvas = (
  img: HTMLImageElement,
  transform: ImageTransform | undefined,
  includeTextOverlay: boolean = true
): HTMLCanvasElement => {
  
  if (DEBUG_RENDER) {
    console.group('🎨 Render Pipeline');
    console.log('Original dimensions:', { 
      w: img.naturalWidth, 
      h: img.naturalHeight 
    });
    console.log('Rotation:', transform?.rotation || 0);
    console.log('Flip:', { 
      h: transform?.flipHorizontal || false, 
      v: transform?.flipVertical || false 
    });
    console.log('Working dimensions:', { w: workingWidth, h: workingHeight });
    console.log('Crop rect:', transform?.crop || 'none');
    console.log('Final dimensions:', { w: canvas.width, h: canvas.height });
    console.log('Text overlay:', includeTextOverlay);
    console.groupEnd();
  }
  
  // ... existing implementation
}
```

**Usage in Production**:
```javascript
// In browser console:
localStorage.setItem('DEBUG_RENDER', 'true');
// Reload page and perform conversion
// To disable:
localStorage.removeItem('DEBUG_RENDER');
```

**Alternative (Query Param)**:
```typescript
const DEBUG_RENDER = new URLSearchParams(window.location.search).has('debugRender');
// Usage: https://tools.fawadhs.dev?debugRender
```

**Benefit**: Enable debugging in production without redeploying code.  
**Estimated Effort**: 1 hour  
**Suggested Phase**: Phase 7

---

## Summary of Effort

| Category | Priority | Estimated Days | Phase | Notes |
|----------|----------|----------------|-------|-------|
| Documentation Fixes | HIGH | ✅ DONE | 6 | |
| Math Helper Unit Tests (Jest) | HIGH | 2 days | 7 | Pure functions, no DOM |
| Render Pipeline Integration (Playwright) | HIGH | 2 days | 7 | Full canvas rendering |
| Circle Crop Export Tests (Playwright) | HIGH | 2 days | 7 | Critical missing coverage |
| Coordinate Conversion Tests (Jest) | HIGH | 1 day | 7 | scaleX/scaleY validation |
| Golden-Image Regression (Playwright) | MEDIUM | 3 days | 7 | SHA-256 hashing, CI setup |
| HEIC + EXIF Golden Image (Playwright) | MEDIUM | 2 days | 7 | Requires test assets |
| Debug Flag (Runtime Toggle) | MEDIUM | 0.5 day | 7 | localStorage toggle |
| Large Image Test (Manual) | LOW | 1 day | 8 | 6k×6k or clamp test |
| **TOTAL** | | **15.5 days** | 7-8 | |

**CI Dependencies**: Playwright setup, headless browser, deterministic font rendering

---

## Phase 7 Testing Deliverables (Crisp Scope)

### Deliverable 1: Math Helper Unit Tests (Jest)
**Functions to Extract & Test**:
- `clampCropRect(crop, maxW, maxH)` → Boundary clamping
- `computeWorkingDimensionsAfterRotation(w, h, rotation)` → Dimension swap
- `displayToNatural(displayX, displayY, rect, naturalW, naturalH)` → Coordinate conversion with scaleX/scaleY

**Acceptance Criteria**:
- 100% coverage of pure math helpers
- Non-uniform scaling test case passes
- Zero DOM dependencies (runs in Node.js)

**Effort**: 2 days

---

### Deliverable 2: Pipeline Integration Tests (Playwright)
**Test Scenarios**:
- Rotate 90° + crop corner
- Flip horizontal + crop right half
- EXIF normalize + user rotation (compound transform)
- `includeTextOverlay` toggle behavior (dimensions + pixel diff)
- Batch independence (2 files with same transform produce identical output)

**Acceptance Criteria**:
- All scenarios pass in Chromium headless
- Runs in CI without flakiness
- Deterministic output (same input → same SHA-256 hash)

**Effort**: 2 days

---

### Deliverable 3: Circle Crop Behavior Tests (Playwright)
**Test Scenarios**:
- PNG + circle crop → transparent outside circle
- WebP + circle crop → transparent outside circle
- JPEG + circle crop → white background outside circle (RGB 255,255,255)
- Rectangle crop regression → no circular clipping

**Acceptance Criteria**:
- Alpha channel validation (PNG/WebP)
- RGB validation (JPEG background)
- Visual diff saves on failure for debugging

**Effort**: 2 days

---

**Total Core Testing Effort**: 6 days (Jest + Playwright)  
**With Golden-Image + HEIC**: 11 days  
**Full Phase 7 with Debug Flag**: 11.5 days

---

## Recommendations

### Immediate Actions (Phase 6 Close-out)
1. ✅ Update audit document terminology
2. ✅ Create render pipeline contract
3. ✅ Update outstanding items list
4. Commit all documentation changes
5. Tag release as v2.0

### Next Phase (Phase 7: Testing)
1. Implement unit tests (5 days)
2. Add debug flag (0.5 day)
3. Implement golden-image tests (3 days)
4. Set up CI/CD pipeline for automated testing

### Future Phases (Phase 8: Refinements)
1. Add large image handling
2. Consider EXIF.js library migration
3. Add telemetry for production monitoring

---

## Sign-Off

**Documentation**: ✅ Complete  
**Validation Tests**: Recommended (non-blocking)  
**Production Ready**: ✅ Yes  
**Next Phase**: Testing & CI/CD (Phase 7)

**Date**: January 11, 2026
