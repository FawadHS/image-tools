# Render Pipeline Contract

> **Version**: 2.0  
> **Date**: January 11, 2026  
> **Status**: Canonical Reference

---

## Purpose

This document defines the **single source of truth** for image transformation in the Image Tools application. All preview and export paths MUST follow this contract to guarantee identical output.

---

## Core Function

```typescript
export const renderEditsToCanvas = (
  img: HTMLImageElement,
  transform: ImageTransform | undefined,
  includeTextOverlay: boolean = true
): HTMLCanvasElement
```

**Location**: `src/utils/imageTransform.ts`

---

## Coordinate Space Definitions

### 1. Natural Pixel Space
**Definition**: The intrinsic pixel dimensions of an image asset, independent of display resolution or CSS sizing.

**Usage**: 
- All transform coordinates (crop, text overlay) are stored in natural pixel space
- `img.naturalWidth` and `img.naturalHeight` define this space
- After EXIF normalization, this becomes the base coordinate system

**Example**: A 4000×3000 photo has naturalWidth=4000, naturalHeight=3000 regardless of how it's displayed.

---

### 2. Display Pixel Space
**Definition**: CSS pixel coordinates used for UI interaction (mouse events, canvas display).

**Usage**:
- Canvas element displayed via `canvas.style.width` and `canvas.style.height`
- Mouse coordinates from `getBoundingClientRect()`
- Converted to natural pixels for storage

**Conversion Formula**:
```typescript
// CORRECT: Use separate scales for X and Y
const rect = canvas.getBoundingClientRect();
const scaleX = img.naturalWidth / rect.width;
const scaleY = img.naturalHeight / rect.height;

const naturalX = (displayX - rect.left) * scaleX;
const naturalY = (displayY - rect.top) * scaleY;
```

**Why Separate Scales**: If canvas is letterboxed, constrained, or has rounding differences in width/height, using a single scale causes coordinate drift. Always use independent X/Y scaling.

---

### 3. Transformed Space
**Definition**: Natural pixel space AFTER rotation and flip are applied (before crop).

**Usage**:
- Crop coordinates are defined in transformed space
- Text overlay coordinates are defined in final space (after crop)
- Rotation by 90° or 270° swaps width and height

**Coordinate Ownership**:
- **Crop rectangle**: Relative to canvas AFTER steps 1–4 (EXIF + rotate + flip + filters), BEFORE crop
- **Text overlay**: Relative to canvas AFTER step 5 (crop), i.e., final export coordinate system
- **Mouse events**: Converted from display space to appropriate coordinate system based on tool context

**Example**: 
- Original: 4000×3000
- After 90° rotation: 3000×4000 (dimensions swapped)
- Crop at (100, 100, 500, 500) is relative to 3000×4000 space

---

## Transform Operation Order

**CRITICAL**: This order MUST be followed in ALL code paths.

```
1. EXIF Normalization  → Reads EXIF orientation (1-8), applies correction
2. User Rotation       → 0°, 90°, 180°, or 270°
3. User Flip           → Horizontal and/or vertical
4. Filters             → Brightness, contrast, saturation, grayscale, sepia
5. Crop                → Extract rectangle from transformed image
6. Text Overlay        → Bake text onto final pixels
```

**Rationale**: 
- EXIF first ensures phone photos display correctly
- Rotation/flip before crop ensures crop coordinates are in final orientation
- Filters before crop avoids edge artifacts
- Text overlay last ensures it's not cropped

---

## Export Behavior

### Text Overlay Inclusion

**Parameter**: `includeTextOverlay: boolean`

**Usage by Component**:

| Component | Value | Reason |
|-----------|-------|--------|
| CropTool | `false` | Don't bake text while cropping |
| TextOverlayTool | `false` | Show base image, overlay text separately |
| Converter (Export) | `true` | Include text in final output |

**Critical Note**: TextOverlayTool MUST render text as a separate overlay layer in preview (via DOM or separate canvas); only export bakes it into the base canvas. This prevents text from being "burned in" during editing.

**Why Optional**: Allows tools to show the image without "burning in" text that may need adjustment.

---

### Canvas Output Specification

**Backing Store Resolution**: Natural pixels (not CSS pixels)

```typescript
// Output canvas is sized to actual pixel dimensions
canvas.width = finalWidth;   // Natural pixels
canvas.height = finalHeight; // Natural pixels
```

**Quality Settings**:
```typescript
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';
```

**Alpha Channel**: Preserved via `{ alpha: true }` context option.

---

## EXIF Orientation Handling

### Supported Formats
- ✅ JPEG (reads EXIF from binary)
- ❌ PNG (no EXIF orientation)
- ❌ WebP (no EXIF orientation in most cases)
- ⚠️ HEIC (converted to raster format prior to pipeline; orientation must be normalized either during conversion or immediately after load)

### Orientation Values

| Value | Transform | Description |
|-------|-----------|-------------|
| 1 | None | Normal (default) |
| 2 | Flip H | Mirrored |
| 3 | Rotate 180° | Upside down |
| 4 | Flip V | Flipped vertically |
| 5 | Rotate 90° + Flip H | Transposed |
| 6 | Rotate 90° CW | Rotated right |
| 7 | Rotate 270° + Flip H | Transverse |
| 8 | Rotate 270° CW | Rotated left |

### Failure Mode
**Default**: Orientation = 1 (no transform) on parse error or non-JPEG.

---

## Boundary Conditions

### Large Images
**Current Behavior**: No size limit enforced; renders at full natural resolution.

**Risk**: Very large images (>10,000px) may cause memory issues.

**Recommendation**: Consider adding optional max dimension clamp for export (e.g., 8192px).

### Empty/Zero-Dimension Crops
**Current Behavior**: Validates crop bounds and clamps to at least 1×1 pixel.

```typescript
const cropWidth = Math.max(1, Math.min(crop.width, workingWidth - cropX));
const cropHeight = Math.max(1, Math.min(crop.height, workingHeight - cropY));
```

**Result**: Cannot create zero-dimension canvases.

### No Transforms Applied
**Current Behavior**: Still passes through `renderEditsToCanvas()` for consistency.

**Optimization Opportunity**: Could short-circuit and return original blob if `transform === undefined`. Currently NOT implemented (all exports go through canvas).

---

## Integration Points

### Preview Components

**CropTool**:
```typescript
// Load image with rotation/flip/filters (NO crop)
const transformWithoutCrop = { 
  ...activeFile.transform, 
  crop: undefined 
};
const canvas = renderEditsToCanvas(img, transformWithoutCrop, false);
// User draws crop rectangle on this canvas
```

**TextOverlayTool**:
```typescript
// Load image with ALL transforms EXCEPT text overlay
const canvas = renderEditsToCanvas(img, activeFile.transform, false);
// User adds text overlay on this canvas
```

### Export Path

**converter.ts**:
```typescript
// Load image with EXIF normalization
const img = await loadImageWithExif(blob);

// Apply ALL transforms INCLUDING text overlay
const processedCanvas = renderEditsToCanvas(img, options.transform, true);

// Export canvas to blob
const outputBlob = await new Promise<Blob>((resolve, reject) => {
  processedCanvas.toBlob(resolve, mimeType, quality);
});
```

---

## Contract Assertions (Runtime Invariants)

These invariants MUST hold at all times. Add assertions in dev builds:

```typescript
// Canvas dimensions
assert(canvas.width > 0 && Number.isInteger(canvas.width), 'Canvas width must be positive integer');
assert(canvas.height > 0 && Number.isInteger(canvas.height), 'Canvas height must be positive integer');

// Rotation dimension swap
if (rotation === 90 || rotation === 270) {
  assert(workingWidth === img.naturalHeight, 'Width should be swapped for 90°/270° rotation');
  assert(workingHeight === img.naturalWidth, 'Height should be swapped for 90°/270° rotation');
}

// Crop bounds
if (transform?.crop) {
  const { x, y, width, height } = transform.crop;
  assert(x >= 0 && x < workingWidth, 'Crop X must be within bounds');
  assert(y >= 0 && y < workingHeight, 'Crop Y must be within bounds');
  assert(width > 0 && width <= workingWidth - x, 'Crop width must be valid');
  assert(height > 0 && height <= workingHeight - y, 'Crop height must be valid');
}

// Text overlay bounds (allow overflow, but document it)
if (transform?.textOverlay) {
  const { x, y } = transform.textOverlay;
  // Note: Text MAY overflow canvas bounds (clipped during render)
  // Document if overflow should be an error or allowed
}

// Filter ranges
if (transform?.filters) {
  const { brightness, contrast, saturation } = transform.filters;
  assert(brightness >= 0 && brightness <= 200, 'Brightness must be 0-200%');
  assert(contrast >= 0 && contrast <= 200, 'Contrast must be 0-200%');
  assert(saturation >= 0 && saturation <= 200, 'Saturation must be 0-200%');
}
```

---

## Filter Definitions

All filter values MUST use these ranges:

| Filter | Type | Range | Default | Units | CSS Mapping |
|--------|------|-------|---------|-------|-------------|
| brightness | number | 0–200 | 100 | Percent | `brightness({value}%)` |
| contrast | number | 0–200 | 100 | Percent | `contrast({value}%)` |
| saturation | number | 0–200 | 100 | Percent | `saturate({value}%)` |
| grayscale | boolean | true/false | false | N/A | `grayscale(100%)` or `grayscale(0%)` |
| sepia | boolean | true/false | false | N/A | `sepia(100%)` or `sepia(0%)` |

**Implementation**:
```typescript
ctx.filter = [
  `brightness(${filters.brightness}%)`,
  `contrast(${filters.contrast}%)`,
  `saturate(${filters.saturation}%)`,
  filters.grayscale ? 'grayscale(100%)' : '',
  filters.sepia ? 'sepia(100%)' : ''
].filter(Boolean).join(' ');
```

**Critical**: UI sliders MUST constrain to these ranges. Any refactor that changes slider behavior risks breaking preview/export parity.

---

## Crop Shape Handling

### Rectangle Crop
**Behavior**: Output canvas resized to crop rect dimensions.

```typescript
canvas.width = cropWidth;
canvas.height = cropHeight;
ctx.drawImage(transformCanvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
```

**Result**: Rectangular region extracted, full opacity.

---

### Circle Crop
**Behavior**: Output canvas resized to bounding box of circle, with circular clip mask.

```typescript
canvas.width = cropWidth;
canvas.height = cropHeight;

// Create circular clip path
ctx.save();
ctx.beginPath();
ctx.arc(cropWidth / 2, cropHeight / 2, Math.min(cropWidth, cropHeight) / 2, 0, Math.PI * 2);
ctx.clip();

// Draw image
ctx.drawImage(transformCanvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
ctx.restore();
```

**Result**: 
- **PNG/WebP**: Pixels outside circle are transparent (alpha = 0)
- **JPEG**: Pixels outside circle are filled with background color (no alpha support)

**Background Fill for JPEG**:
```typescript
if (outputFormat === 'jpeg') {
  // Fill background before clipping
  ctx.fillStyle = '#FFFFFF'; // White background (or make configurable)
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
```

---

## Export Format Rules

### PNG
- **Alpha Channel**: ✅ Preserved
- **Circle Crop**: Transparent outside circle
- **Quality Parameter**: Ignored (lossless)
- **Use Case**: Circle crops, transparent overlays

### WebP
- **Alpha Channel**: ✅ Preserved
- **Circle Crop**: Transparent outside circle
- **Quality Parameter**: 0–100 (lossy) or ignored if lossless flag set
- **Use Case**: Best compression with transparency

### JPEG
- **Alpha Channel**: ❌ NOT supported
- **Circle Crop**: **MUST fill background** (recommend white, make configurable)
- **Quality Parameter**: 0–100 (always lossy)
- **Use Case**: Photos without transparency, maximum compatibility

**Critical Implementation**:
```typescript
if (outputFormat === 'jpeg' && transform?.crop?.shape === 'circle') {
  // MUST fill background before clipping
  ctx.fillStyle = options.jpegBackgroundColor || '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Then apply circular clip
}
```

**Test Requirement**: Validate JPEG circle crop produces expected background color (not black or undefined).

---

## Validation Tests

### Definition of "Identical Output"

For preview/export parity tests, "identical" means:

1. **Same pixel dimensions**: `preview.width === export.width && preview.height === export.height`
2. **Same pixel values within tolerance**:
   - Exact match for most pixels: `pixelDiff === 0`
   - Allow ±1 LSB difference for filter rounding (e.g., brightness calculations)
   - Maximum 0.1% of pixels may differ due to browser rendering variations
3. **Deterministic in single runtime**: Use controlled environment (e.g., Playwright + Chromium) for regression tests

**Why Tolerance**: Canvas filter operations may have minor floating-point rounding differences across runs. Structural similarity is what matters.

### Critical Test Cases

1. **Rotation + Crop Correctness**
   - Rotate 90°, crop top-left corner
   - Export dimensions should match crop rect in rotated space
   - Visual inspection: cropped region should match preview

2. **EXIF Orientation + User Rotation**
   - Load phone photo with EXIF orientation 6 (90° CW)
   - Apply additional user rotation
   - Combined rotation should be correct

3. **Flip + Crop**
   - Flip horizontal, crop right half
   - Export should show left half of original (flipped)

4. **Text Overlay Positioning**
   - Add text at (100, 100)
   - Crop to exclude text area
   - Text should NOT appear in export

5. **Batch Processing Independence**
   - Process 3 files with different transforms
   - Each export should match its preview (no cross-contamination)

6. **Non-Uniform Preview Scaling** ⚠️ CRITICAL
   - Force preview canvas into container with mismatched aspect ratio (e.g., 400×250 for 1000×800 image)
   - Apply rounding or letterboxing that creates different scaleX vs scaleY
   - Draw crop rectangle with mouse interaction
   - **Expected**: Crop coordinates use independent scaleX/scaleY; export matches preview exactly
   - **Failure Mode**: Single scale causes vertical or horizontal drift

7. **Circle Crop + JPEG Export**
   - Apply circle crop to image
   - Export as JPEG
   - **Expected**: Background outside circle is filled (white or configured color), not black/undefined
   - **Test**: Load exported JPEG, verify background pixels are expected color

---

## Debug Logging

### Recommended Debug Flag

Add to `renderEditsToCanvas()`:

```typescript
const DEBUG_RENDER = false; // Set true for diagnosis

if (DEBUG_RENDER) {
  console.log('🎨 Render Pipeline:', {
    originalDimensions: { w: img.naturalWidth, h: img.naturalHeight },
    rotation: transform?.rotation || 0,
    workingDimensions: { w: workingWidth, h: workingHeight },
    cropRect: transform?.crop || 'none',
    finalDimensions: { w: canvas.width, h: canvas.height },
    includeTextOverlay,
  });
}
```

**Usage**: Enable for production bug diagnosis without deploying new code.

---

## Performance Considerations

### Canvas Creation Overhead
- Each `renderEditsToCanvas()` call creates 2 canvases (transform + final)
- For large images, this is ~50-200ms per render
- Acceptable for on-demand export, but not for real-time preview dragging

### Memory Management
- Canvases are NOT explicitly cleaned up (relies on GC)
- Preview components hold references to processed images
- Consider `URL.revokeObjectURL()` for intermediate blobs

---

## Change Protocol

### To Modify Transform Order
1. Update this document first
2. Update `renderEditsToCanvas()` implementation
3. Run all validation tests
4. Update CROP-FIX-IMPLEMENTATION.md

### To Add New Transform Type
1. Add to `ImageTransform` interface in `types/index.ts`
2. Add to operation order in this document
3. Implement in `renderEditsToCanvas()`
4. Update preview components (CropTool, TextOverlayTool)
5. Add validation tests

---

## References

- **Implementation**: [src/utils/imageTransform.ts](../src/utils/imageTransform.ts)
- **Types**: [src/types/index.ts](../src/types/index.ts)
- **Technical Details**: [CROP-FIX-IMPLEMENTATION.md](./CROP-FIX-IMPLEMENTATION.md)
- **Audit**: [PHASE6-AUDIT.md](./PHASE6-AUDIT.md)

---

## Sign-Off

**Contract Version**: 2.0  
**Last Updated**: January 11, 2026  
**Status**: Active and Enforced
