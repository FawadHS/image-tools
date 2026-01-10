# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-01-10

### 🎉 Major Release - Image Editing Suite

This release introduces a complete image editing suite with crop, rotate, filters, and text overlay capabilities. All editing tools work together seamlessly through a unified transform pipeline.

### Added

#### Image Editing Tools
- **Crop Tool** - Interactive cropping with rectangle and circle shapes
  - Aspect ratio presets (Free, 1:1, 16:9, 4:3, 3:2)
  - Drag-to-select crop area
  - Preview before applying
  - Coordinates stored in transformed image space

- **Rotate & Flip Tool** - Transform images with ease
  - Rotation: 0°, 90°, 180°, 270°
  - Horizontal and vertical flip
  - Live canvas preview
  - Dimensions automatically adjusted

- **Filters** - Professional image adjustments
  - Brightness control (0-200%)
  - Contrast control (0-200%)
  - Saturation control (0-200%)
  - Grayscale toggle
  - Sepia tone toggle
  - Real-time preview

- **Text Overlay** - Add watermarks and captions
  - Custom text with drag-to-position
  - Font family selection (Arial, Georgia, Courier, etc.)
  - Font size adjustment (10-200px)
  - Color picker with hex input
  - Opacity control (0-100%)
  - Multiple overlays support (currently limited to 1)

#### Core Features
- **Transform Pipeline Architecture** - All edits work together seamlessly
  - Order: Original → Rotate/Flip/Filter → Crop → Text Overlay
  - Each tool sees accumulated transforms from previous steps
  - State synchronization across all tools
  - Preview/Apply pattern for all editing tools

- **Active File Selection** - Edit multiple images
  - Click any image to make it active
  - All tools work on the active image
  - Visual feedback (blue ring) for active file
  - Automatic selection of first uploaded file

- **Before/After Comparison** - Interactive slider
  - Compare original vs converted images
  - Side-by-side view with draggable divider
  - File size comparison
  - Dimensions display

- **Conversion History** - Track your work
  - LocalStorage-based history
  - Statistics (total conversions, files processed, data saved)
  - Recent conversions list
  - Clear history option

- **Advanced File Naming** - Flexible naming options
  - Custom prefix
  - Custom suffix
  - Timestamp inclusion
  - Dimension tags ([WIDTHxHEIGHT])
  - Original filename preservation

### Improved

- **UX/UI Enhancements**
  - Preview/Apply pattern for all editing tools
  - "Unsaved changes" indicators
  - Discard changes option
  - Better button states and feedback
  - Improved dark mode consistency

- **State Management**
  - Refactored ConverterContext with activeFileId
  - Deep object comparison using JSON.stringify
  - Proper state synchronization
  - Memory cleanup on file removal

- **Performance**
  - Web Worker for background image processing
  - OffscreenCanvas support with fallback
  - Sequential processing to prevent memory issues
  - Efficient transform application

- **Accessibility**
  - WCAG 2.1 Level AA compliance
  - Keyboard navigation support
  - ARIA labels on interactive elements
  - Focus management
  - Screen reader friendly

### Fixed

- Transform pipeline synchronization - All tools now show accumulated transforms
- Text overlay apply button - Correctly saves text to global state
- Crop tool coordinate space - Works on transformed image, not original
- State sync across editing tools - Deep comparison for nested objects
- Memory leaks - Proper cleanup of blob URLs

### Documentation

- **README.md** - Comprehensive update
  - Detailed e-commerce use cases
  - Admin panel integration examples
  - WordPress/WooCommerce integration
  - Shopify Admin integration
  - Self-hosting guide
  - Contribution guidelines

- **TRANSFORM-PIPELINE.md** - New documentation
  - Transform order explanation
  - Coordinate space documentation
  - Synchronization mechanism
  - Testing checklist
  - Common issues and solutions

- **ROADMAP.md** - Updated
  - v2.0 features marked complete
  - Future features outlined
  - Sprint planning for v3.0

### Technical

- React 18 with TypeScript 5
- Vite 6 for lightning-fast builds
- Tailwind CSS for styling
- Web Workers for background processing
- Canvas API for image manipulation
- PWA support with service worker

---

## [1.0.0] - 2025-01-XX

### Initial Release

#### Features
- HEIC to WebP/JPEG/PNG/AVIF conversion
- Batch processing (up to 50 files)
- Quality control slider
- E-commerce presets
- Resize presets
- Dark mode support
- PWA support
- Privacy-first (100% client-side)

[2.0.0]: https://github.com/FawadHS/image-tools/releases/tag/v2.0.0
[1.0.0]: https://github.com/FawadHS/image-tools/releases/tag/v1.0.0
