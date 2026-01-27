# GitHub Copilot Instructions for Image Preflight

> **Version**: 3.0.0 (Shopify Integration)  
> **Last Updated**: January 27, 2026  
> **Parent Platform**: Preflight Utility Suite (tools.fawadhs.dev)  
> **Folder Name**: `Image Preflight/` (renamed from `Image Tools/`)

---

## 🏷️ Branding (CRITICAL)

### Brand Hierarchy
```
Preflight Utility Suite          ← Umbrella brand (tools.fawadhs.dev)
├── Image Preflight              ← THIS PROJECT ✅
├── Spreadsheet Preflight        ← Future tool
├── Data Preflight               ← Future tool
└── Document Preflight           ← Future tool
```

### Folder Structure
```
Fawad-Software-Projects/
├── Preflight Utility Suite/     ← Platform backend + frontend
├── Image Preflight/             ← THIS PROJECT (standalone app)
└── Spreadsheet Preflight/       ← Future tool
```

### Naming Rules
- **This Tool**: `Image Preflight` (NOT "Image Tools" - deprecated)
- **Platform**: `Preflight Utility Suite` or `Preflight Suite`
- **Subtitle format**: "part of Preflight Suite"

### Where Branding Appears
| Location | Correct Name |
|----------|--------------|
| Header title | Image Preflight |
| Header subtitle | part of Preflight Suite |
| Page title | Image Preflight - ... \| Preflight Suite |
| manifest.json | Image Preflight |
| SEO/meta tags | Image Preflight |

### DO NOT USE (Deprecated):
- ❌ "Image Tools" (old folder name)
- ❌ "Preflight Image Tools" (verbose)
- ❌ "fawadhs.tools" (just domain, not brand)
- ❌ "fawadhs-tools" (old platform folder name)

---

## 🎯 Project Overview

**Image Preflight** is a modern, privacy-first image conversion platform that runs entirely in the browser. Part of the **Preflight Utility Suite**.

**Current Version**: v3.0.0 (Shopify integration complete - Phases 1-3)

### Platform Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   Preflight Utility Suite                        │
│                   (tools.fawadhs.dev)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  /                  → Landing, Auth, Pricing (Preflight Suite)  │
│  /dashboard         → User Dashboard (Preflight Suite)          │
│  /image-tools       → Image Preflight (THIS PROJECT)            │
│                     └── + Shopify Panel ✅                      │
│                                                                  │
│  api.tools.fawadhs.dev                                          │
│  ├── /api/auth/*       → Auth module (existing)                 │
│  ├── /api/subscription/*→ Stripe (existing)                     │
│  ├── /api/usage/*      → Usage tracking (existing)              │
│  └── /api/shopify/*    → Shopify module ✅                      │
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
| **Backend API** | Preflight Suite API | For auth, Shopify features |

---

## 🚀 Shopify Integration Status

### Phases 1-3: Complete ✅

| Phase | Features | Status |
|-------|----------|--------|
| Phase 1: Foundation | OAuth, connection management | ✅ Complete |
| Phase 2: Core Upload | Uploads, product search, attach media | ✅ Complete |
| Phase 3: SKU Mapping | Filename parsing, product matching | ✅ Complete |
| Phase 4: SEO Automation | - | ⏸️ Deferred |
| Phase 5: AI Features | - | ⏸️ Deferred |
| Phase 6: Launch | - | ⏸️ Deferred |

### Test Store Connected ✅
- **Store**: `preflight-test-store.myshopify.com`
- **Partner App**: "Preflight Image Tools" 
- **Client ID**: `43216d9e7e35a146e6e53f0b4cd4e934`

### Implemented Features
- **OAuth Connection** - Connect user's Shopify stores
- **File Upload** - Upload to Shopify Files and Product Media
- **Product Search** - Fuzzy search and browse products
- **SKU Mapping** - Parse filenames and match to products (5 patterns)

### Shopify Components (Frontend)
```
src/
├── context/
│   └── ShopifyContext.tsx        # Shopify connection state
├── components/
│   └── shopify/
│       ├── index.ts              # Component exports
│       ├── ShopifyPanel.tsx      # Main panel with tabs (Stores, Upload, Bulk SKU)
│       ├── ShopifyConnect.tsx    # OAuth connection flow
│       ├── ShopifyUploader.tsx   # Upload to Shopify
│       ├── SkuMapper.tsx         # Filename → product mapping
│       └── ProductSearch.tsx     # Search/select products
└── services/
    └── shopifyApi.ts             # API client (calls Preflight Suite backend)
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

### Preflight Suite Backend Endpoints
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
import { apiClient } from './api';  // From Preflight Suite

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
- **Hosting**: Hetzner CPX11 (with Preflight Suite)
- **Nginx**: Reverse proxy config
- **Deploy**: `scripts/deploy/deploy-all.ps1` (Preflight Suite)

### Build Commands
```bash
# Local development
npm run dev

# Production build
npm run build

# Deploy (via Preflight Suite)
cd "../Preflight Utility Suite"
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

## 🏪 Shopify Integration (CRITICAL)

### Single Source of Truth
**The Shopify backend is in Preflight Utility Suite, NOT here.**
Image Preflight only has frontend components that call the shared API.

### Architecture
```
Image Preflight Frontend ─► api.tools.fawadhs.dev/api/shopify/* ─► PostgreSQL
                       (Preflight Suite backend)
```

### DO NOT:
- ❌ Create any Shopify backend code in Image Preflight
- ❌ Store Shopify tokens locally
- ❌ Create duplicate API endpoints
- ❌ Hardcode API URLs

### Files in This Project (Frontend Only)
| File | Purpose |
|------|---------|
| `src/components/shopify/ShopifyPanel.tsx` | Main Shopify panel UI with tabs |
| `src/components/shopify/ShopifyConnect.tsx` | Connection status & OAuth flow |
| `src/components/shopify/ShopifyUploader.tsx` | Upload to Shopify Files/Products |
| `src/components/shopify/ProductSearch.tsx` | Search & select products |
| `src/components/shopify/SkuMapper.tsx` | Filename parsing & product matching |
| `src/components/shopify/index.ts` | Component exports |
| `src/services/shopifyApi.ts` | API client (calls Preflight Suite API) |
| `src/context/ShopifyContext.tsx` | State management |

### Authentication
Image Preflight reads the auth token from localStorage set by Preflight Suite:
```typescript
// Reads from Preflight Suite auth storage
const token = localStorage.getItem('token') 
           || JSON.parse(localStorage.getItem('auth-storage')).state.token;
```

### API Base URL
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'https://api.tools.fawadhs.dev';
```

### Related Docs
- **Backend Architecture**: See `Preflight Utility Suite/docs/04-development/SHOPIFY-ARCHITECTURE.md`

---

**Last Updated**: January 26, 2026 (v3.0.0 - Shopify Integration)
