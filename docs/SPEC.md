# HEIC to WEBP Converter - Project Specification

## Overview
A web-based image converter application that converts HEIC and various image formats to WEBP format, optimized for website usage with full control over compression and quality settings.

---

## Core Features

### 1. Image Format Support

#### Input Formats
| Format | Extension | Description |
|--------|-----------|-------------|
| HEIC | `.heic`, `.heif` | Apple High Efficiency Image Format |
| JPEG | `.jpg`, `.jpeg` | Standard web format |
| PNG | `.png` | Lossless format with transparency |
| GIF | `.gif` | Animated and static images |
| BMP | `.bmp` | Bitmap images |
| TIFF | `.tiff`, `.tif` | High-quality print format |
| WebP | `.webp` | Re-compress existing WebP |

#### Output Format
- **WebP** - Modern web format with superior compression

---

### 2. Quality & Compression Controls

#### Quality Settings
| Setting | Range | Default | Description |
|---------|-------|---------|-------------|
| Quality | 1-100 | 80 | Higher = better quality, larger file |
| Lossless | On/Off | Off | Perfect quality, larger files |

#### Compression Presets
| Preset | Quality | Max Width | Use Case |
|--------|---------|-----------|----------|
| **E-commerce Product** | 85 | 1200px | Product images, clear detail for zoom |
| **E-commerce Thumbnail** | 70 | 400px | Product listings, category grids |
| **Hero Banner** | 90 | 1920px | Homepage banners, featured images |
| **Blog/Content** | 75 | 800px | Blog posts, articles |
| **Background** | 60 | 1920px | Decorative backgrounds |
| **Custom** | 1-100 | User-defined | Full control |

#### E-commerce Specific Recommendations
| Image Type | Quality | Dimensions | Expected Size |
|------------|---------|------------|---------------|
| Main Product Image | 85 | 1200 x 1200px | 80-150 KB |
| Product Zoom | 90 | 2000 x 2000px | 200-400 KB |
| Product Thumbnail | 70 | 400 x 400px | 15-30 KB |
| Category Thumbnail | 65 | 300 x 300px | 10-20 KB |
| Cart Thumbnail | 60 | 100 x 100px | 3-8 KB |

#### Advanced Options
- [ ] Preserve metadata (EXIF, IPTC)
- [ ] Strip metadata (reduce file size)
- [ ] Preserve transparency (PNG/GIF sources)
- [ ] Auto-rotate based on EXIF orientation

---

### 3. Batch Processing

#### Limits & Constraints
| Constraint | Value |
|------------|-------|
| Maximum files per batch | 50 |
| Maximum file size per image | 50 MB |
| Maximum total batch size | 500 MB |
| Supported concurrent conversions | 4 (browser limit) |

#### Batch Features
- Select multiple images at once
- Drag & drop support
- Progress indicator per file
- Overall batch progress
- Cancel individual or all conversions
- Retry failed conversions

---

### 4. Output Management

#### Folder/Download Options
- **Individual Download**: Download each converted image separately
- **Batch Download**: ZIP archive of all converted images
- **Auto-naming Convention**:
  - Original: `photo.heic` → `photo.webp`
  - With prefix: `converted_photo.webp`
  - With timestamp: `photo_20260107.webp`

#### File Naming Options
| Option | Example |
|--------|---------|
| Keep original name | `vacation.webp` |
| Add prefix | `web_vacation.webp` |
| Add suffix | `vacation_optimized.webp` |
| Add dimensions | `vacation_1920x1080.webp` |

---

### 5. Image Preview & Information

#### Before Conversion
- Thumbnail preview
- Original file size
- Original dimensions
- Original format

#### After Conversion
- Side-by-side comparison
- Converted file size
- Size reduction percentage
- New dimensions (if resized)

---

### 6. Resize Options (Optional Feature)

| Preset | Max Width | Use Case |
|--------|-----------|----------|
| Original | - | Keep original size |
| 4K | 3840px | Ultra high resolution |
| Full HD | 1920px | Desktop screens |
| HD | 1280px | Standard web |
| Medium | 800px | Blog images |
| Thumbnail | 400px | Thumbnails |
| Custom | User-defined | Specific requirements |

- Maintain aspect ratio (default: on)
- Only downscale, never upscale (default: on)

---

## User Interface Design

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│  🖼️ HEIC to WEBP Converter                    [Dark Mode]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │     📁 Drop images here or click to browse         │   │
│  │        Supports: HEIC, JPEG, PNG, GIF, BMP         │   │
│  │              Maximum 50 files                       │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────┬──────────────────────────────┐   │
│  │  QUALITY SETTINGS    │   SELECTED FILES (0/50)      │   │
│  │                      │                              │   │
│  │  Preset: [Balanced▼] │   ┌────┐ ┌────┐ ┌────┐      │   │
│  │                      │   │img1│ │img2│ │img3│      │   │
│  │  Quality: ───●─── 75 │   └────┘ └────┘ └────┘      │   │
│  │                      │                              │   │
│  │  □ Lossless          │   File: photo.heic          │   │
│  │  ☑ Strip metadata    │   Size: 4.2 MB              │   │
│  │  ☑ Auto-rotate       │   Dims: 4032 x 3024         │   │
│  │                      │                              │   │
│  │  RESIZE (optional)   │                              │   │
│  │  [Original Size ▼]   │                              │   │
│  │                      │                              │   │
│  └──────────────────────┴──────────────────────────────┘   │
│                                                             │
│  [ Clear All ]              [ Convert All (3 files) 🚀 ]   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  CONVERSION RESULTS                                 │   │
│  │                                                     │   │
│  │  ✅ photo1.webp   4.2MB → 892KB  (79% smaller) [⬇]│   │
│  │  ✅ photo2.webp   3.1MB → 654KB  (79% smaller) [⬇]│   │
│  │  🔄 photo3.webp   Converting... 45%                │   │
│  │                                                     │   │
│  │            [ Download All as ZIP 📦 ]               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### UI Components
1. **Header** - App name, dark mode toggle
2. **Drop Zone** - Drag & drop area with file input
3. **Settings Panel** - Quality controls and options
4. **File List** - Selected files with thumbnails
5. **Progress Area** - Conversion status and results
6. **Action Buttons** - Convert, clear, download

---

## Technical Architecture

### Technology Stack
| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | React 18+ | Component-based UI |
| Build Tool | Vite | Fast development & bundling |
| Language | TypeScript | Type safety & better DX |
| Styling | Tailwind CSS | Utility-first styling |
| State Management | React Context + useReducer | App state handling |
| HEIC Decode | `heic2any` library | Convert HEIC to standard format |
| Image Processing | Canvas API | Resize and manipulate |
| WebP Encode | Canvas `toBlob('image/webp')` | Final conversion |
| ZIP Creation | `JSZip` library | Batch download |
| File Handling | react-dropzone | Drag & drop file selection |
| Icons | Lucide React | Modern icon set |
| Notifications | React Hot Toast | User feedback |

### Key Libraries
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "heic2any": "^0.0.4",
    "jszip": "^3.10.1",
    "react-dropzone": "^14.2.3",
    "lucide-react": "^0.294.0",
    "react-hot-toast": "^2.4.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

### Browser Compatibility
| Browser | Minimum Version | Notes |
|---------|-----------------|-------|
| Chrome | 32+ | Full WebP support |
| Firefox | 65+ | Full WebP support |
| Safari | 14+ | WebP support added |
| Edge | 18+ | Full WebP support |

---

## File Structure
```
heic-to-webp/
├── public/
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Slider.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Checkbox.tsx
│   │   │   └── ProgressBar.tsx
│   │   ├── DropZone.tsx           # File upload area
│   │   ├── FileList.tsx           # Selected files display
│   │   ├── FileItem.tsx           # Individual file card
│   │   ├── SettingsPanel.tsx      # Quality & resize controls
│   │   ├── PresetSelector.tsx     # E-commerce presets dropdown
│   │   ├── ConversionResults.tsx  # Results list
│   │   ├── ResultItem.tsx         # Individual result row
│   │   ├── Header.tsx             # App header with dark mode
│   │   └── Footer.tsx             # App footer
│   ├── hooks/
│   │   ├── useImageConverter.ts   # Conversion logic hook
│   │   ├── useFileSelection.ts    # File handling hook
│   │   └── useDarkMode.ts         # Theme toggle hook
│   ├── context/
│   │   └── ConverterContext.tsx   # Global state management
│   ├── utils/
│   │   ├── converter.ts           # Core conversion functions
│   │   ├── imageUtils.ts          # Resize, crop utilities
│   │   ├── fileUtils.ts           # File naming, ZIP creation
│   │   └── presets.ts             # E-commerce preset configs
│   ├── types/
│   │   └── index.ts               # TypeScript interfaces
│   ├── constants/
│   │   └── index.ts               # App constants & limits
│   ├── App.tsx                    # Main app component
│   ├── main.tsx                   # Entry point
│   └── index.css                  # Tailwind imports
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── package.json
├── SPEC.md
└── README.md
```

---

## Conversion Workflow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  1. SELECT   │────▶│  2. DECODE   │────▶│  3. PROCESS  │
│   Images     │     │   (if HEIC)  │     │  (resize/    │
│              │     │              │     │   quality)   │
└──────────────┘     └──────────────┘     └──────────────┘
                                                  │
                                                  ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  6. DOWNLOAD │◀────│  5. DISPLAY  │◀────│  4. ENCODE   │
│  (single/ZIP)│     │   Results    │     │   to WebP    │
└──────────────┘     └──────────────┘     └──────────────┘
```

---

## Performance Considerations

### Optimization Strategies
1. **Web Workers** - Offload conversion to background threads
2. **Lazy Loading** - Load images as needed
3. **Memory Management** - Release blobs after download
4. **Chunked Processing** - Process 4 images at a time
5. **Progressive UI** - Show results as each file completes

### Memory Limits
- Clear converted blobs after download
- Limit preview sizes to max 200x200px
- Process in batches for large selections

---

## Error Handling

| Error Type | User Message | Action |
|------------|--------------|--------|
| Unsupported format | "This file format is not supported" | Skip file |
| File too large | "File exceeds 50MB limit" | Skip file |
| Conversion failed | "Could not convert [filename]" | Offer retry |
| Browser unsupported | "Your browser doesn't support WebP" | Show alternatives |
| Too many files | "Maximum 50 files allowed" | Trim selection |

---

## React Component Architecture

```
                    ┌─────────────────┐
                    │      App        │
                    │  (Dark Mode)    │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼───────┐ ┌────▼─────┐ ┌─────▼──────┐
     │    Header      │ │  Main    │ │   Footer   │
     └────────────────┘ └────┬─────┘ └────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────┐        ┌──────▼──────┐     ┌──────▼──────┐
   │DropZone │        │SettingsPanel│     │Conversion   │
   │         │        │             │     │Results      │
   └────┬────┘        └──────┬──────┘     └──────┬──────┘
        │                    │                   │
   ┌────▼────┐        ┌──────▼──────┐     ┌──────▼──────┐
   │FileList │        │PresetSelect │     │ResultItem   │
   └────┬────┘        │QualitySlider│     │(per file)   │
        │             │ResizeOptions│     └─────────────┘
   ┌────▼────┐        └─────────────┘
   │FileItem │
   │(per file)│
   └─────────┘
```

## Key React Hooks

### useImageConverter
```typescript
const {
  convert,           // (file: File, options: ConvertOptions) => Promise<Blob>
  convertBatch,      // (files: File[], options) => Promise<ConvertResult[]>
  progress,          // number (0-100)
  isConverting,      // boolean
  cancelConversion,  // () => void
} = useImageConverter();
```

### useFileSelection  
```typescript
const {
  files,             // SelectedFile[]
  addFiles,          // (files: File[]) => void
  removeFile,        // (id: string) => void
  clearFiles,        // () => void
  totalSize,         // number (bytes)
  isOverLimit,       // boolean
} = useFileSelection({ maxFiles: 50, maxSize: 50 * 1024 * 1024 });
```

## TypeScript Interfaces

```typescript
interface ConvertOptions {
  quality: number;           // 1-100
  lossless: boolean;
  maxWidth?: number;
  maxHeight?: number;
  maintainAspectRatio: boolean;
  stripMetadata: boolean;
  preset?: PresetType;
}

interface SelectedFile {
  id: string;
  file: File;
  preview: string;           // Object URL for thumbnail
  status: 'pending' | 'converting' | 'completed' | 'error';
  progress: number;
  result?: ConvertResult;
  error?: string;
}

interface ConvertResult {
  blob: Blob;
  originalSize: number;
  convertedSize: number;
  reduction: number;         // Percentage
  dimensions: { width: number; height: number };
  filename: string;
}

type PresetType = 
  | 'ecommerce-product'
  | 'ecommerce-thumbnail'
  | 'hero-banner'
  | 'blog-content'
  | 'background'
  | 'custom';
```

---

## Future Enhancements (v2.0)

- [ ] PWA support (offline capability)
- [ ] Cloud storage integration (Google Drive, Dropbox)
- [ ] Image editing (crop, rotate, filters)
- [ ] Multiple output formats (JPEG, PNG, AVIF)
- [ ] Comparison slider (before/after)
- [ ] Conversion history with localStorage
- [ ] API endpoint for programmatic use
- [ ] Electron desktop app version
- [ ] React Native mobile app

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Average conversion time | < 2 seconds per image |
| Average size reduction | 60-80% for photos |
| Maximum batch completion | < 60 seconds for 50 images |
| Browser crash rate | 0% |
| User satisfaction | 4.5+ stars |

---

## Development Phases

### Phase 1: Project Setup & Core UI
- [ ] Initialize Vite + React + TypeScript project
- [ ] Configure Tailwind CSS
- [ ] Create base UI components (Button, Slider, Select)
- [ ] Build DropZone component with react-dropzone
- [ ] Implement dark mode toggle
- [ ] Basic responsive layout

### Phase 2: Core Conversion Engine
- [ ] HEIC to blob conversion (heic2any)
- [ ] WebP encoding via Canvas API
- [ ] Quality control implementation
- [ ] Single file download
- [ ] useImageConverter hook

### Phase 3: Batch Processing & State
- [ ] ConverterContext for global state
- [ ] Multiple file selection (up to 50)
- [ ] FileList and FileItem components
- [ ] Progress tracking per file
- [ ] ZIP download with JSZip
- [ ] Error handling & retry logic

### Phase 4: E-commerce Presets & Resize
- [ ] PresetSelector component
- [ ] E-commerce preset configurations
- [ ] Image resize functionality
- [ ] Maintain aspect ratio option
- [ ] Custom dimensions input

### Phase 5: Polish & Optimization
- [ ] Web Workers for background processing
- [ ] Memory management (blob cleanup)
- [ ] Toast notifications
- [ ] Mobile responsiveness
- [ ] Accessibility (WCAG 2.1)
- [ ] Cross-browser testing
- [ ] Build optimization

---

## Appendix: WebP Quality Reference

| Quality | File Size | Visual Quality | Best For |
|---------|-----------|----------------|----------|
| 100 | Largest | Perfect | Archival |
| 90-95 | Large | Excellent | Photography |
| 80-89 | Medium | Very Good | Product images |
| 70-79 | Small | Good | Blog images |
| 60-69 | Smaller | Acceptable | Thumbnails |
| 50-59 | Smallest | Noticeable loss | Backgrounds |
| < 50 | Tiny | Significant loss | Placeholders |

---

*Specification Version: 1.0*  
*Created: January 7, 2026*  
*Author: Project Team*
