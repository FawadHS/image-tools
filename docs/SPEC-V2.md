# Image Tools - Version 2.0 Specification

> **Version**: 2.0 Draft  
> **Status**: Planning  
> **Target Release**: Q2 2026

---

## Overview

Version 2.0 builds on the solid foundation of v1.0 by adding **image editing capabilities**, **cloud integrations**, and **advanced batch operations**. This transforms Image Tools from a converter into a complete image optimization workflow.

---

## New Features for v2.0

### 1. Image Editing Suite

#### Crop Tool
**Description**: Non-destructive cropping with common aspect ratios and freeform selection.

**Features**:
- Rectangle, circle, and freeform crop
- Aspect ratio presets (1:1, 4:3, 16:9, 3:2, custom)
- Lock aspect ratio toggle
- Crop handles with visual guides
- Grid overlay (rule of thirds)
- Reset to original button

**UI Components**:
- Canvas-based interactive crop area
- Aspect ratio dropdown
- Crop handle dragging
- Preview with before/after

#### Rotate & Flip
**Description**: Quick rotation and mirroring operations.

**Features**:
- Rotate: 90° CW, 90° CCW, 180°
- Flip: Horizontal, Vertical
- Auto-rotate based on EXIF orientation
- Preserve EXIF data option

#### Filters
**Description**: Apply common image adjustments.

**Filters**:
| Filter | Range | Default | Description |
|--------|-------|---------|-------------|
| Brightness | -100 to 100 | 0 | Lighten or darken |
| Contrast | -100 to 100 | 0 | Increase/decrease contrast |
| Saturation | -100 to 100 | 0 | Color intensity |
| Grayscale | On/Off | Off | Black and white |
| Sepia | On/Off | Off | Vintage brown tone |
| Blur | 0-10 | 0 | Gaussian blur |
| Sharpen | 0-10 | 0 | Edge enhancement |

**Implementation**:
- Canvas filters API for real-time preview
- Non-destructive editing (apply on convert)
- Slider controls with live preview
- Reset individual filters or all

#### Text Overlay (Watermark)
**Description**: Add text watermarks or captions to images.

**Features**:
- Text input with font family selection
- Font size, color, opacity
- Position presets (center, corners, custom)
- Text stroke/outline
- Shadow effects
- Rotation angle

---

### 2. Cloud Storage Integration

#### Google Drive
**Features**:
- OAuth 2.0 authentication
- File picker to select images from Drive
- Upload converted images back to Drive
- Create folders for organized output
- Batch operations from Drive folders

**Permissions Needed**:
- `https://www.googleapis.com/auth/drive.file` (created files only)
- `https://www.googleapis.com/auth/drive.readonly` (read user files)

#### Dropbox
**Features**:
- OAuth authentication
- File chooser integration
- Upload to specific folders
- Maintain folder structure in batch
- Share links for uploaded files

#### URL Import
**Features**:
- Paste URL to fetch image
- Support for direct image URLs
- CORS proxy for restricted URLs
- Bulk URL import (paste list)
- Validate image before adding

---

### 3. Saved Presets & Batch Operations

#### Preset Manager
**Description**: Save and manage custom conversion settings.

**Features**:
- Name and save current settings
- Preset categories (Personal, E-commerce, Social Media)
- Star/favorite frequently used presets
- Import/Export presets as JSON
- Share presets via URL
- Default preset selection

**Preset Data Structure**:
```json
{
  "name": "Instagram Post",
  "category": "Social Media",
  "settings": {
    "outputFormat": "jpeg",
    "quality": 85,
    "maxWidth": 1080,
    "maxHeight": 1080,
    "maintainAspectRatio": true,
    "stripMetadata": true
  },
  "favorite": true,
  "createdAt": "2026-01-15T10:00:00Z"
}
```

#### Batch Rename Patterns
**Description**: Advanced naming for batch conversions.

**Patterns**:
- Sequential numbering: `image_001.webp`, `image_002.webp`
- Original + suffix: `photo_optimized.webp`
- Date-based: `2026-01-15_photo.webp`
- Custom template: `{prefix}_{original}_{width}x{height}_{timestamp}.{ext}`

**Variables**:
- `{original}` - Original filename
- `{prefix}` - User-defined prefix
- `{suffix}` - User-defined suffix
- `{date}` - Current date (YYYY-MM-DD)
- `{time}` - Current time (HH-MM-SS)
- `{timestamp}` - Unix timestamp
- `{index}` - Sequential number (001, 002, etc.)
- `{width}` - Image width in pixels
- `{height}` - Image height in pixels
- `{format}` - Output format
- `{quality}` - Quality setting

---

### 4. Enhanced UI/UX

#### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + V` | Paste image from clipboard |
| `Ctrl/Cmd + O` | Open file picker |
| `Delete` | Remove selected file |
| `Ctrl/Cmd + A` | Select all files |
| `Esc` | Cancel conversion / Close modal |
| `Space` | Preview selected file |
| `Enter` | Start conversion |
| `Ctrl/Cmd + Z` | Undo edit |
| `Ctrl/Cmd + Y` | Redo edit |

#### Drag & Drop Enhancements
- Drag to reorder files in queue
- Drop directly onto preset to auto-apply
- Visual drop zones with highlights
- Multi-file drag support

#### Copy to Clipboard
- Copy converted image to clipboard
- One-click paste into other apps
- Supported in modern browsers
- Fallback: download prompt

---

### 5. EXIF Data Management

#### EXIF Viewer
**Display**:
- Camera make/model
- Date taken
- GPS coordinates (with privacy warning)
- ISO, aperture, shutter speed
- Focal length
- Dimensions
- File size

**Actions**:
- View detailed EXIF data modal
- Strip all metadata checkbox
- Strip GPS only (preserve camera info)
- Copy EXIF to new files option

#### Auto-Rotation
- Read EXIF orientation tag
- Automatically rotate images correctly
- Option to disable auto-rotation
- Preview orientation before conversion

---

### 6. Advanced Settings

#### Multi-Quality Export
**Description**: Generate multiple versions in one pass.

**Example**:
- Original quality (100%)
- High quality (85%)
- Medium quality (70%)
- Thumbnail (50%)

**Output**: ZIP with organized folders by quality level

#### Format-Specific Options

**JPEG**:
- Progressive encoding
- Chroma subsampling (4:4:4, 4:2:2, 4:2:0)
- Optimize Huffman tables

**PNG**:
- Compression level (0-9)
- Interlacing

**WebP**:
- Lossless/lossy toggle
- Alpha quality (for transparency)
- Auto-filter selection

**AVIF**:
- Speed vs quality tradeoff
- Chroma subsampling

---

## Technical Implementation

### Architecture Changes

#### State Management Enhancement
- Add `EditingContext` for non-destructive edits
- Persist edit history for undo/redo
- Separate concerns: editing vs conversion

#### New Components
```
src/
├── components/
│   ├── editor/
│   │   ├── CropTool.tsx
│   │   ├── FilterPanel.tsx
│   │   ├── TextOverlay.tsx
│   │   ├── RotateFlip.tsx
│   │   └── EditorCanvas.tsx
│   ├── cloud/
│   │   ├── GoogleDrivePicker.tsx
│   │   ├── DropboxChooser.tsx
│   │   └── URLImport.tsx
│   ├── presets/
│   │   ├── PresetManager.tsx
│   │   ├── PresetCard.tsx
│   │   └── PresetImportExport.tsx
│   └── exif/
│       ├── EXIFViewer.tsx
│       └── MetadataStrip.tsx
├── utils/
│   ├── editor.ts
│   ├── cloudAuth.ts
│   └── exifParser.ts
```

#### New Dependencies
```json
{
  "exifr": "^7.1.3",          // EXIF parsing
  "fabric": "^5.3.0",          // Canvas manipulation
  "google-auth-library": "^9.0.0",
  "dropbox": "^10.34.0",
  "canvas-filters": "^1.0.0"
}
```

---

## Performance Targets

| Metric | v1.0 | v2.0 Target |
|--------|------|-------------|
| Conversion Speed | ~1.0s | ~0.8s (WASM) |
| Edit Apply | N/A | < 500ms |
| Cloud Upload | N/A | < 5s for 5MB |
| UI Response | 60 FPS | 60 FPS maintained |
| Memory Usage | ~100MB | < 150MB with editing |

---

## Browser Compatibility

Same as v1.0:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Additional requirements for editing:
- Canvas Filter API support
- Clipboard API (for paste)
- File System Access API (optional enhancement)

---

## Security Considerations

### Cloud Integration
- OAuth tokens stored in secure httpOnly cookies
- Token refresh handled automatically
- Revoke access option in settings
- Clear privacy policy for data access

### URL Import
- Validate image content type
- File size limits (50MB)
- CORS proxy security measures
- Prevent XSS via user-uploaded URLs

---

## Migration Path (v1.0 → v2.0)

### Backward Compatibility
- All v1.0 features remain unchanged
- History format extends, doesn't break
- Presets in new format, old settings preserved

### Data Migration
```typescript
// Auto-migrate v1 history to v2
const migrateHistory = (v1History) => {
  return v1History.map(record => ({
    ...record,
    edits: [], // New field for v2
    preset: record.preset || 'custom'
  }));
};
```

---

## Release Strategy

### Beta Phase (March 2026)
- Limited feature rollout
- Editor + Presets only
- Collect user feedback
- Performance testing

### v2.0 Launch (June 2026)
- Full feature release
- Documentation update
- Video tutorials
- Blog announcement

### v2.1 Patches (July-August 2026)
- Bug fixes
- Performance improvements
- User-requested enhancements

---

## Success Metrics

| Metric | Target |
|--------|--------|
| User Adoption (v2 features) | 40% within 1 month |
| Cloud Integration Usage | 20% of users |
| Saved Presets Created | Avg 3 per user |
| Edit Tool Usage | 30% of conversions |
| Positive Feedback | > 4.5 stars |

---

*Specification Version: 2.0 Draft*  
*Last Updated: January 2026*  
*Author: Fawad Hussain*
