# GitHub Copilot Instructions for Image Tools

## Project Overview
This is **Image Tools** - a modern, privacy-first image conversion tool that runs entirely in the browser. Part of the tools.fawadhs.dev suite.

## Tech Stack
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite 6+
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React Context + useReducer
- **Image Processing**: Canvas API, heic2any
- **File Handling**: react-dropzone, JSZip

## Design Philosophy

### Visual Design Principles
1. **Minimalist & Clean** - Remove visual clutter, focus on content
2. **Modern & Refined** - Use subtle shadows, smooth gradients, micro-interactions
3. **Dark Mode First** - Design for dark mode, ensure light mode works well
4. **Information Rich** - Show useful stats without overwhelming
5. **Consistent Spacing** - Use Tailwind's spacing scale consistently

### Color Palette
```
Primary: Blue-600 (#2563eb) - Actions, highlights
Success: Emerald-500 (#10b981) - Completed states
Warning: Amber-500 (#f59e0b) - Warnings
Error: Red-500 (#ef4444) - Errors
Neutral: Gray scale for backgrounds and text
```

### UI Components Guidelines
- **Buttons**: Rounded-lg, clear hierarchy (primary, secondary, ghost)
- **Cards**: Subtle borders, slight shadows, rounded-xl
- **Inputs**: Clean borders, focus states with ring
- **Animations**: Subtle, 200-300ms transitions
- **Icons**: Lucide React, consistent 20-24px sizes

## Code Style

### TypeScript
- Use strict typing, avoid `any`
- Define interfaces in `src/types/`
- Use discriminated unions for state

### React Patterns
- Functional components with hooks
- Custom hooks for reusable logic
- Context for global state only
- Memoize expensive computations

### File Organization
```
src/
├── components/     # UI components
│   ├── ui/        # Reusable primitives
│   └── *.tsx      # Feature components
├── hooks/         # Custom hooks
├── context/       # React contexts
├── utils/         # Pure utility functions
├── types/         # TypeScript interfaces
└── constants/     # App constants
```

## Feature Requirements

### Image Conversion
- Input: HEIC, HEIF, JPEG, PNG, GIF, BMP, TIFF, WebP
- Output: WebP, JPEG, PNG, AVIF (when supported)
- Quality control: 1-100 slider
- Resize options with aspect ratio lock
- Batch processing up to 50 images

### E-commerce Presets
- Product images (85 quality, 1200px)
- Thumbnails (70 quality, 400px)
- Hero banners (90 quality, 1920px)

### Privacy
- All processing happens client-side
- No server uploads
- No tracking or analytics that compromise privacy

## Testing Considerations
- Test with various image formats
- Test large files (up to 50MB)
- Test batch processing performance
- Test memory cleanup after conversions

## Deployment
- Subdomain: tools.fawadhs.dev
- Static hosting compatible
- Optimized bundle size
