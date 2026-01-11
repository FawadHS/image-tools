# Test Fixtures

This directory contains test images and reference files for E2E testing.

## Structure

```
fixtures/
├── README.md          # This file
├── images/           # Test images (PNG, JPEG, HEIC, etc.)
└── references/       # Golden reference images for comparison
```

## Test Image Requirements

### Smoke Tests
- `test-1000x800.png` - Basic gradient image for dimension validation
- `test-500x500.png` - Square image for crop testing

### Circle Crop Tests
- `red-500x500.png` - Solid red 500×500 for alpha channel testing
- `blue-500x500.png` - Solid blue 500×500 for JPEG background testing

### Golden Image Tests
- `portrait.heic` - HEIC with EXIF orientation 6 (rotate 90° CW)
- `portrait-upright.png` - Reference PNG showing correct upright rendering
- `no-orientation.heic` - HEIC without orientation metadata

## Creating Test Images

Use the browser console or Node.js canvas to generate test images programmatically:

```javascript
// Example: Create solid red 500×500 PNG
const canvas = document.createElement('canvas');
canvas.width = 500;
canvas.height = 500;
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#FF0000';
ctx.fillRect(0, 0, 500, 500);

// Download
const link = document.createElement('a');
link.download = 'red-500x500.png';
link.href = canvas.toDataURL('image/png');
link.click();
```

## Best Practices

1. **Keep Fixtures Small**: Use minimal dimensions (500×500 or smaller)
2. **Solid Colors**: Easier to validate pixel values
3. **Deterministic**: Avoid gradients that may render differently across browsers
4. **Document**: Add comments explaining what each fixture tests
