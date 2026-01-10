# Image Transform Pipeline

## Overview
The image transform pipeline ensures that each editing tool displays the accumulated transforms from all previous tools. This prevents the issue where tools show different states of the same image.

## Transform Order (Critical!)

```
Original Image
     ↓
ImageEditor (Step 1)
  - Rotation (0°, 90°, 180°, 270°)
  - Flip Horizontal
  - Flip Vertical
  - Filters (brightness, contrast, saturation, grayscale, sepia)
     ↓
CropTool (Step 2)
  - Crop area (x, y, width, height)
  - Crop shape (rectangle, circle)
  - Aspect ratio locking
     ↓
TextOverlayTool (Step 3)
  - Text overlay (text, position, font, color, opacity)
     ↓
Final Converted Image
```

## How Each Tool Works

### 1. ImageEditor
- **Input**: Original image
- **Output**: Rotated, flipped, and filtered image (local preview only)
- **State**: Stores `transform.rotation`, `transform.flipHorizontal`, `transform.flipVertical`, `transform.filters`
- **Apply Action**: Commits changes to global state

### 2. CropTool
- **Input**: Image with rotation/flip applied (NOT original!)
- **Output**: Cropped area from the transformed image
- **State**: Stores `transform.crop` coordinates in transformed image space
- **Apply Action**: Commits crop coordinates to global state
- **Important**: User crops what they see (already rotated/flipped)

### 3. TextOverlayTool
- **Input**: Image with rotation/flip/filters/crop all applied
- **Output**: Text positioned on the fully transformed image
- **State**: Stores `transform.textOverlay` coordinates in cropped image space
- **Apply Action**: Commits text overlay to global state
- **Important**: Text is positioned on the final transformed+cropped image

## Implementation Details

### State Structure
```typescript
interface ImageTransform {
  rotation?: 0 | 90 | 180 | 270;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  filters?: {
    brightness: number;      // 0-200 (100 = no change)
    contrast: number;        // 0-200 (100 = no change)
    saturation: number;      // 0-200 (100 = no change)
    grayscale: boolean;
    sepia: boolean;
  };
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  textOverlay?: {
    text: string;
    x: number;
    y: number;
    fontSize: number;
    fontFamily: string;
    color: string;
    opacity: number;
  };
}
```

### Preview vs Committed State

Each tool maintains TWO states:
1. **Preview State** (local): Uncommitted changes shown in canvas
2. **Committed State** (global): Applied changes stored in `ConverterContext`

**Workflow:**
1. User makes changes → Updates preview state → Shows in canvas
2. User clicks "Apply" → Dispatches action → Updates committed state
3. Other tools detect committed state change → Reload with new transforms
4. User clicks "Discard" → Resets preview to match committed state

### Coordinate Spaces

#### Original Space
- Used by: Initial file upload
- Dimensions: Original image width × height

#### Transformed Space (after rotation/flip)
- Used by: CropTool
- Dimensions: May be swapped if rotated 90° or 270°
- Example: 1920×1080 image rotated 90° → 1080×1920 in transformed space

#### Cropped Space (after crop)
- Used by: TextOverlayTool
- Dimensions: Crop width × height
- Coordinates: Relative to top-left of crop area (0,0)

## Synchronization

### When ImageEditor Applies Changes
```typescript
// ImageEditor applies rotation/flip/filters
dispatch({
  type: 'SET_OPTIONS',
  payload: {
    transform: {
      rotation: 90,
      flipHorizontal: true,
      filters: { brightness: 120, ... }
    }
  }
});

// CropTool detects change via useEffect
useEffect(() => {
  // Reloads image with new rotation/flip applied
  // Resets crop area to full transformed image
}, [state.options.transform?.rotation, state.options.transform?.flipHorizontal, ...]);

// TextOverlayTool also reloads
useEffect(() => {
  // Reloads with rotation/flip applied (no crop yet)
}, [state.options.transform]);
```

### When CropTool Applies Crop
```typescript
// CropTool applies crop
dispatch({
  type: 'SET_OPTIONS',
  payload: {
    transform: {
      ...existingTransform,
      crop: { x: 100, y: 100, width: 800, height: 600 }
    }
  }
});

// TextOverlayTool detects change
useEffect(() => {
  // Reloads image with rotation/flip/crop all applied
  // Shows only the cropped area with transforms
}, [state.options.transform]);

// ImageEditor stays unchanged (it only shows rotation/flip/filters)
```

### When TextOverlayTool Applies Text
```typescript
// TextOverlay applies text
dispatch({
  type: 'SET_OPTIONS',
  payload: {
    transform: {
      ...existingTransform,
      textOverlay: { text: 'Watermark', x: 50, y: 50, ... }
    }
  }
});

// Other tools don't reload (text is last step)
// Text is only visible in TextOverlayTool preview and final conversion
```

## Web Worker Conversion

The final conversion in `converter.worker.ts` applies ALL transforms in order:

```typescript
// 1. Load original image
const img = await loadImage(file);

// 2. Apply rotation, flip, filters → creates canvas
const canvas = applyTransformationsToCanvas(img, transform);

// 3. Crop is applied within applyTransformationsToCanvas
// 4. Text is applied within applyTransformationsToCanvas

// 5. Convert to output format
const blob = await canvas.convertToBlob({ type: outputFormat, quality });
```

## Common Issues & Solutions

### Issue: Crop shows wrong orientation
**Cause**: CropTool loading original image instead of transformed image  
**Solution**: CropTool must apply rotation/flip before showing canvas

### Issue: Text appears in wrong position
**Cause**: Text coordinates stored in wrong space (e.g., original instead of cropped)  
**Solution**: Store text coordinates relative to the image shown in TextOverlayTool (transformed+cropped)

### Issue: Tools show different states
**Cause**: Tools not reloading when other tools apply changes  
**Solution**: Each tool must have `useEffect` that depends on `state.options.transform`

### Issue: Apply button doesn't sync other tools
**Cause**: Missing or incorrect useEffect dependencies  
**Solution**: Use `JSON.stringify(state.options.transform?.rotation)` for deep object comparison

## Testing Checklist

✅ **Test 1: Flip then Crop**
1. Upload image
2. Go to ImageEditor → Flip Horizontal → Apply
3. Go to CropTool → Verify image shows FLIPPED
4. Select crop area → Apply Crop
5. Go to TextOverlay → Verify shows FLIPPED and CROPPED

✅ **Test 2: Rotate then Crop**
1. Upload image (portrait)
2. Go to ImageEditor → Rotate 90° → Apply
3. Go to CropTool → Verify dimensions are swapped (landscape)
4. Crop → Apply
5. Verify aspect ratio correct

✅ **Test 3: Full Pipeline**
1. ImageEditor → Rotate 90° + Flip H + Brightness 150% → Apply
2. CropTool → Crop center square → Apply
3. TextOverlay → Add "WATERMARK" at center → Apply
4. Convert → Download → Verify all transforms present

✅ **Test 4: Multi-Image Selection**
1. Upload 3 images
2. Apply different transforms to each
3. Click between images in file list
4. Verify each tool shows correct state for each image

## File References

- [src/utils/imageTransform.ts](../src/utils/imageTransform.ts) - Transform utilities
- [src/components/ImageEditor.tsx](../src/components/ImageEditor.tsx) - Rotation/flip/filters
- [src/components/CropTool.tsx](../src/components/CropTool.tsx) - Crop with transforms
- [src/components/TextOverlayTool.tsx](../src/components/TextOverlayTool.tsx) - Text with transforms
- [src/workers/converter.worker.ts](../src/workers/converter.worker.ts) - Final conversion

---

**Last Updated**: January 10, 2026  
**Maintained by**: Fawad Hussain
