# GitHub Copilot Instructions for Image Tools

> **Version**: 3.0.0 (Shopify Integration)  
> **Last Updated**: January 21, 2026  
> **Parent Platform**: fawadhs-tools (tools.fawadhs.dev)

---

## 🎯 Project Overview

**Image Tools** is a modern, privacy-first image conversion platform that runs entirely in the browser. Part of the **tools.fawadhs.dev** suite.

**Current Version**: v2.7.1 (standalone)  
**Target Version**: v3.0.0 (Shopify integration with fawadhs-tools platform)

### Platform Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   tools.fawadhs.dev Platform                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  /                  → Landing, Auth, Pricing (fawadhs-tools)    │
│  /dashboard         → User Dashboard (fawadhs-tools)            │
│  /image-tools       → Image Tools (THIS PROJECT)                │
│                     └── + Shopify Panel (v3.0)                  │
│                                                                  │
│  api.tools.fawadhs.dev                                          │
│  ├── /api/auth/*       → Auth module (existing)                 │
│  ├── /api/subscription/*→ Stripe (existing)                     │
│  ├── /api/usage/*      → Usage tracking (existing)              │
│  └── /api/shopify/*    → Shopify module (NEW - v3.0)            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| **Framework** | React 18+ | TypeScript strict mode |
| **Build** | Vite 6+ | Fast HMR, optimized builds |
| **Styling** | Tailwind CSS | Custom design system |
| **State** | React Context + useReducer | ConverterContext pattern |
| **Image Processing** | Canvas API, heic2any | Client-side only |
| **File Handling** | react-dropzone, JSZip | Batch support |
| **Icons** | Lucide React | Consistent 20-24px |
| **Backend API** | fawadhs-tools API | For auth, Shopify features |

---

## 🚀 V3.0 Shopify Integration Roadmap

### Current Phase: **Phase 1 - Foundation** (Feb 2026)

| Phase | Target | Status |
|-------|--------|--------|
| Phase 1: Foundation | Feb 2026 | ⬜ Not Started |
| Phase 2: Core Upload | Mar 2026 | ⬜ Not Started |
| Phase 3: SKU Mapping | Apr 2026 | ⬜ Not Started |
| Phase 4: SEO Automation | May 2026 | ⬜ Not Started |
| Phase 5: AI Features | Jun 2026 | ⬜ Not Started |
| Phase 6: Launch | Jul 2026 | ⬜ Not Started |

### Key V3.0 Features
- **Direct Shopify Integration** - Upload optimized images to Shopify stores
- **SKU-Based Bulk Operations** - Map images to products via filename
- **SEO Automation** - Auto-generated filenames and alt text
- **Subscription Gating** - Pro/Business tier features

### V3.0 Frontend Components to Add
```
src/
├── context/
│   └── ShopifyContext.tsx        # NEW - Shopify connection state
├── components/
│   └── shopify/                   # NEW - Shopify-specific components
│       ├── ShopifyPanel.tsx      # Main Shopify tab
│       ├── ShopifyConnect.tsx    # OAuth connection flow
│       ├── ShopifyUploader.tsx   # Upload to Shopify
│       ├── SkuMapper.tsx         # Filename → product mapping
│       └── ProductSearch.tsx     # Search/select products
├── hooks/
│   └── useShopify.ts             # NEW - Shopify API hook
└── services/
    └── shopifyApi.ts             # NEW - Shopify API calls
```

---

## 📁 Current File Structure

```
src/
├── components/     # UI components
│   ├── ActionBar.tsx
│   ├── CropTool.tsx
│   ├── DropZone.tsx
│   ├── FileList.tsx
│   ├── Header.tsx
│   ├── ImageEditor.tsx
│   ├── SettingsPanel.tsx
│   └── ...
├── context/
│   ├── ConverterContext.tsx    # Main state management
│   └── ThemeContext.tsx
├── hooks/          # Custom hooks
├── pages/
│   └── ImageToolsPage.tsx      # Main page
├── types/
│   └── index.ts                # TypeScript interfaces
├── utils/          # Pure utility functions
└── constants/
    └── index.ts                # App constants
```

---

## 🎨 Design Philosophy

### Visual Design Principles
1. **Minimalist & Clean** - Remove visual clutter, focus on content
2. **Modern & Refined** - Subtle shadows, smooth gradients, micro-interactions
3. **Dark Mode First** - Design for dark, ensure light works well
4. **Information Rich** - Show useful stats without overwhelming
5. **Consistent Spacing** - Use Tailwind's spacing scale

### Color Palette
```
Primary:  Blue-600 (#2563eb)    - Actions, highlights
Success:  Emerald-500 (#10b981) - Completed states
Warning:  Amber-500 (#f59e0b)   - Warnings
Error:    Red-500 (#ef4444)     - Errors
Shopify:  Green-500 (#22c55e)   - Shopify-specific UI (v3.0)
Neutral:  Gray scale            - Backgrounds and text
```

### UI Components Guidelines
- **Buttons**: Rounded-lg, clear hierarchy (primary, secondary, ghost)
- **Cards**: Subtle borders, slight shadows, rounded-xl
- **Inputs**: Clean borders, focus states with ring
- **Animations**: Subtle, 200-300ms transitions
- **Icons**: Lucide React, consistent 20-24px sizes
- **Tabs**: For Shopify panel navigation (v3.0)

---

## 💻 Code Style

### TypeScript
- Use strict typing, avoid `any`
- Define interfaces in `src/types/`
- Use discriminated unions for state

### React Patterns
- Functional components with hooks
- Custom hooks for reusable logic
- Context for global state only
- Memoize expensive computations

### Shopify-Specific Patterns (v3.0)
```typescript
// Shopify connection state
interface ShopifyConnection {
  id: string;
  shopDomain: string;
  accessToken: string;  // Encrypted
  status: 'active' | 'disconnected' | 'expired';
  connectedAt: Date;
}

// Upload to Shopify flow
interface ShopifyUploadState {
  destination: 'files' | 'product';
  productId?: string;
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;
}
```

---

## ✅ Feature Requirements

### Image Conversion (Current)
- **Input**: HEIC, HEIF, JPEG, PNG, GIF, BMP, TIFF, WebP
- **Output**: WebP, JPEG, PNG, AVIF (when supported)
- **Quality**: 1-100 slider
- **Resize**: With aspect ratio lock
- **Batch**: Up to 50 images

### E-commerce Presets
| Preset | Dimensions | Quality | Use Case |
|--------|------------|---------|----------|
| Product (existing) | 1200px | 85% | Product pages |
| Thumbnail (existing) | 400px | 70% | Grid views |
| Hero Banner (existing) | 1920px | 90% | Banners |
| **Collection Thumbnail** (v3.0) | 600×600 | 85% | Shopify collections |
| **Product Detail** (v3.0) | 2048×2048 | 90% | Shopify product |
| **Social Media** (v3.0) | Various | 85% | Instagram/Pinterest |

### Shopify Integration (v3.0)
- OAuth connection to Shopify stores
- Upload to Files or Product Media
- SKU-based filename mapping
- SEO filename/alt text generation
- Bulk upload with progress tracking

### Privacy Requirements
- All image processing happens client-side
- Shopify tokens encrypted at rest
- No tracking that compromises privacy
- User controls data retention

---

## 🔌 API Integration (v3.0)

### fawadhs-tools Backend Endpoints
```typescript
// Shopify OAuth
POST /api/shopify/auth/install     // Start OAuth flow
GET  /api/shopify/auth/callback    // OAuth callback
POST /api/shopify/auth/disconnect  // Disconnect store

// Shopify Upload
POST /api/shopify/upload/staged    // Get staged upload URL
POST /api/shopify/upload/complete  // Complete upload
GET  /api/shopify/upload/:id/status // Check upload status

// Product Search
GET  /api/shopify/products/search  // Search by title/SKU
GET  /api/shopify/products/:id     // Get product details
```

### API Client Pattern
```typescript
// src/services/shopifyApi.ts
import { apiClient } from './api';  // From fawadhs-tools

export const shopifyApi = {
  connect: (shopDomain: string) => 
    apiClient.post('/api/shopify/auth/install', { shopDomain }),
  
  uploadToFiles: (files: File[], connectionId: string) =>
    apiClient.post('/api/shopify/upload/staged', { files, connectionId }),
  
  searchProducts: (query: string, connectionId: string) =>
    apiClient.get('/api/shopify/products/search', { query, connectionId }),
};
```

---

## 🧪 Testing Considerations

### Image Processing
- Test with various image formats
- Test large files (up to 50MB)
- Test batch processing performance
- Test memory cleanup after conversions

### Shopify Integration (v3.0)
- Test OAuth flow with development store
- Test upload progress tracking
- Test SKU matching accuracy
- Test rate limit handling
- Test error recovery

---

## 📦 Deployment

### Current Setup
- **URL**: tools.fawadhs.dev/image-tools
- **Hosting**: Hetzner CPX11 (with fawadhs-tools)
- **Nginx**: Reverse proxy config
- **Deploy**: `scripts/deploy/deploy-all.ps1` (fawadhs-tools)

### Build Commands
```bash
# Local development
npm run dev

# Production build
npm run build

# Deploy (via fawadhs-tools)
cd ../fawadhs-tools
.\scripts\deploy\deploy-all.ps1 frontend
```

---

## 📚 Key Documentation

| Document | Path | Description |
|----------|------|-------------|
| V3 Spec | `docs/01-specifications/V3-SHOPIFY-INTEGRATION-SPEC.md` | Full technical spec |
| V3 Roadmap | `docs/01-specifications/V3-SHOPIFY-INTEGRATION-ROADMAP.md` | Phase-by-phase plan |
| Progress | `docs/01-specifications/SHOPIFY-PROGRESS.md` | Implementation tracking |
| Architecture | `docs/02-architecture/` | System design docs |

---

## ⚠️ Important Rules

1. **Don't break existing functionality** - v3.0 features are additive
2. **Gate Shopify behind auth** - Requires login + Pro/Business tier
3. **Client-side first** - Image processing stays in browser
4. **Use existing patterns** - Follow ConverterContext pattern for ShopifyContext
5. **Keep bundle size low** - Lazy load Shopify components
6. **Test with development store** - Never use production for testing

---

**Last Updated**: January 21, 2026 (v3.0.0 Roadmap Start)
