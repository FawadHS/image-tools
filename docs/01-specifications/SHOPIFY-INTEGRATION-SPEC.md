# Image Tools v3.0 - Shopify Integration Specification

> **Version**: 3.0.0 (Shopify Integration)  
> **Created**: January 21, 2026  
> **Status**: Planning Phase  
> **Related**: tools.fawadhs.dev/image-tools

---

## Executive Summary

Image Tools v3.0 extends the existing privacy-first image processing platform with native Shopify integration, enabling merchants to directly optimize, upload, and manage product images within their stores. This version positions the tool as a **Shopify-first image operations & visual consistency platform**.

### Key Value Propositions
1. **Direct Shopify Integration** - Upload optimized images directly to Shopify stores
2. **SKU-Based Bulk Operations** - Map images to products via filename parsing
3. **Visual Consistency** - Background removal + uniform padding for professional grids
4. **SEO Automation** - Auto-generated filenames and alt text
5. **Future-Proof** - GraphQL-only API compliance (2025+ ready)

---

## Part 1: Architecture Overview

### 1.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Image Tools v3.0 Architecture                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────┐    ┌──────────────────┐    ┌────────────────────┐   │
│   │   Frontend  │────│  Backend (New)   │────│   Shopify Admin    │   │
│   │   React SPA │    │  Fastify API     │    │   GraphQL API      │   │
│   └─────────────┘    └──────────────────┘    └────────────────────┘   │
│          │                    │                        │               │
│          │                    │                        │               │
│   ┌──────▼──────┐    ┌───────▼────────┐    ┌─────────▼─────────┐     │
│   │  Existing   │    │   New Backend   │    │  Shopify Store    │     │
│   │  Processing │    │   Services      │    │                   │     │
│   │  Engine     │    │                 │    │  - Products       │     │
│   │             │    │  - OAuth Flow   │    │  - Media/Files    │     │
│   │  - Convert  │    │  - Upload Mgr   │    │  - Theme Assets   │     │
│   │  - Crop     │    │  - SKU Mapper   │    │  - Metafields     │     │
│   │  - Filters  │    │  - SEO Engine   │    │                   │     │
│   │  - Overlay  │    │  - Job Queue    │    │                   │     │
│   └─────────────┘    └─────────────────┘    └───────────────────┘     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| **Frontend** | React 18 + TypeScript | Existing Image Tools codebase |
| **State** | React Context + useReducer | Existing pattern |
| **Backend** | Fastify + TypeScript | New service for Shopify integration |
| **Database** | PostgreSQL | Store connections, job history |
| **Queue** | BullMQ + Redis | Background job processing |
| **AI Services** | External API | Background removal (Phase 2) |
| **Shopify API** | GraphQL Admin API | OAuth 2.0 + App Bridge |

### 1.3 Deployment Architecture

```
tools.fawadhs.dev/image-tools     → Frontend (existing)
api.tools.fawadhs.dev/shopify     → Shopify Backend (new)
```

---

## Part 2: Shopify Integration Specifications

### 2.1 OAuth & Authentication Flow

```
User Journey:
1. User clicks "Connect Shopify Store" in Image Tools
2. Redirect to Shopify OAuth authorization
3. User approves app permissions
4. Callback with authorization code
5. Exchange code for access token
6. Store encrypted token in database
7. User can now upload to connected store
```

#### Required OAuth Scopes

| Scope | Purpose | Required |
|-------|---------|----------|
| `write_files` | Upload images to Files section | ✅ Yes |
| `write_products` | Attach images to products | ✅ Yes |
| `read_products` | Fetch product data for SKU mapping | ✅ Yes |
| `write_themes` | Optimize theme assets | ⬜ Phase 2 |
| `write_themes_assets` | Replace theme images | ⬜ Phase 2 |

### 2.2 Upload Flow (GraphQL)

```graphql
# Step 1: Create staged upload target
mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
  stagedUploadsCreate(input: $input) {
    stagedTargets {
      url
      resourceUrl
      parameters { name value }
    }
  }
}

# Step 2: Binary upload to staged URL (HTTP PUT)

# Step 3: Create file record
mutation fileCreate($files: [FileCreateInput!]!) {
  fileCreate(files: $files) {
    files {
      id
      alt
      createdAt
      ... on MediaImage {
        image { url width height }
      }
    }
  }
}

# Step 4: Attach to product (optional)
mutation productUpdate($input: ProductInput!) {
  productUpdate(input: $input) {
    product {
      media(first: 10) {
        nodes { id }
      }
    }
  }
}
```

### 2.3 Async Status Handling

Images are processed asynchronously by Shopify. Must poll status:

```graphql
query fileStatus($id: ID!) {
  node(id: $id) {
    ... on MediaImage {
      status  # UPLOADED, PROCESSING, READY, FAILED
    }
  }
}
```

**Status Flow**: `UPLOADED` → `PROCESSING` → `READY`

---

## Part 3: Feature Specifications

### 3.1 Shopify-Optimized Export Presets

#### E-commerce Presets (New)

| Preset | Dimensions | Aspect Ratio | Quality | Use Case |
|--------|------------|--------------|---------|----------|
| Collection Thumbnail | 600×600 | 1:1 | 85% | Collection grid |
| Product Detail | 2048×2048 | 1:1 | 90% | Product pages |
| Product Zoom | 4096×4096 | 1:1 | 95% | Zoom feature |
| Hero Banner | 1920×1080 | 16:9 | 90% | Homepage hero |
| Slim Banner | 1200×400 | 3:1 | 85% | Collection headers |

#### Social/Marketing Presets (New)

| Preset | Dimensions | Aspect Ratio | Platform |
|--------|------------|--------------|----------|
| Instagram Feed | 1080×1080 | 1:1 | Instagram |
| Instagram Portrait | 1080×1350 | 4:5 | Instagram |
| Stories/Reels | 1080×1920 | 9:16 | IG/TikTok |
| Pinterest Pin | 1000×1500 | 2:3 | Pinterest |
| Facebook Cover | 1200×630 | 1.91:1 | Facebook |

#### Export Pack Feature

Allow bundled exports:
- "Shopify Complete" → Product + Thumbnail + Zoom
- "Social Pack" → All social media sizes
- "Marketing Pack" → Hero + Banners + Social

### 3.2 SKU-Based Bulk Upload

#### Filename Parsing Rules

```
Pattern Examples:
SKU-ABC123.jpg        → Maps to product with SKU "ABC123"
ABC123_front.jpg      → Product "ABC123", alt: "front view"
ABC123_1.jpg          → Product "ABC123", position 1
handle-blue-dress.jpg → Product with handle "blue-dress"
```

#### Mapping Configuration UI

```typescript
interface SkuMappingConfig {
  pattern: 'sku-prefix' | 'sku-suffix' | 'handle' | 'custom-regex';
  delimiter: string;  // e.g., '-', '_'
  positionField?: 'suffix-number' | 'none';
  altTextField?: 'suffix-text' | 'none';
}
```

#### Batch Upload Flow

1. User uploads ZIP or multiple files
2. System parses filenames using configured pattern
3. Lookup products via `products` query (by SKU or handle)
4. Show mapping preview with matched/unmatched files
5. User confirms or manually adjusts
6. Process: Optimize → Upload → Attach to products
7. Report: Success count, failures, unmatched

### 3.3 SEO Automation

#### Filename Generation

```typescript
// Template: {product_title}-{variant}-{position}.{format}
// Example: "Blue Silk Dress-Navy-1.webp"

interface FilenameTemplate {
  includeProductTitle: boolean;
  includeVariantTitle: boolean;
  includePosition: boolean;
  separator: '-' | '_';
  lowercase: boolean;
  maxLength: number;  // 50-100 chars recommended
}
```

#### Alt Text Generation

**Template-Based**:
```
"{product_title} - {variant_title} - {view_angle}"
Example: "Blue Silk Dress - Navy - Front View"
```

**AI-Enhanced** (Phase 2):
- Use vision AI to describe image content
- Combine with product context
- Max 125 characters
- Avoid keyword stuffing

### 3.4 Background Removal & Visual Normalization

#### Processing Pipeline

```
Input Image
    ↓
[Background Removal AI]
    ↓
[Smart Object Detection] → Detect subject bounds
    ↓
[Auto-Crop to Subject] → Remove excess transparent area
    ↓
[Uniform Padding] → Add configurable padding (5-15%)
    ↓
[Background Fill] → Transparent PNG or solid white
    ↓
Output Image
```

#### Configuration Options

```typescript
interface BackgroundRemovalConfig {
  outputMode: 'transparent' | 'white' | 'custom-color';
  autoCrop: boolean;
  paddingPercent: number;  // 0-20%
  centerSubject: boolean;
  targetAspectRatio?: '1:1' | '4:3' | 'original';
}
```

### 3.5 Media Quality Audit

#### Audit Checks

| Check | Severity | Auto-Fix Available |
|-------|----------|-------------------|
| Missing alt text | High | ✅ Template-based |
| Short alt text (<10 chars) | Medium | ✅ Regenerate |
| Low resolution (<1000px) | High | ⬜ Manual replace |
| Non-SEO filename (IMG_xxxx) | Medium | ✅ Rename |
| Inconsistent aspect ratios | Low | ⬜ Manual |
| Oversized files (>5MB) | Medium | ✅ Recompress |
| Duplicate images | Low | ⬜ Manual remove |
| Missing zoom image | Medium | ⬜ Upload larger |

#### Audit Report UI

```
┌─────────────────────────────────────────────────┐
│ Media Quality Audit - mystore.myshopify.com     │
├─────────────────────────────────────────────────┤
│ Scanned: 1,247 images                           │
│                                                 │
│ 🔴 Critical (12)                                │
│    └─ 12 images missing alt text                │
│                                                 │
│ 🟡 Warning (45)                                 │
│    └─ 23 non-SEO filenames                      │
│    └─ 22 low resolution images                  │
│                                                 │
│ 🟢 Good (1,190)                                 │
│                                                 │
│ [Fix All Critical] [Export Report] [Ignore]     │
└─────────────────────────────────────────────────┘
```

---

## Part 4: Data Models

### 4.1 Database Schema (New Tables)

```sql
-- Shopify store connections
CREATE TABLE shopify_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  shop_domain VARCHAR(255) NOT NULL UNIQUE,
  access_token_encrypted TEXT NOT NULL,
  scopes TEXT[],
  installed_at TIMESTAMP DEFAULT NOW(),
  last_sync_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active'
);

-- Upload jobs
CREATE TABLE shopify_upload_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES shopify_connections(id),
  status VARCHAR(20) DEFAULT 'pending',
  total_files INTEGER,
  processed_files INTEGER DEFAULT 0,
  failed_files INTEGER DEFAULT 0,
  config JSONB,
  results JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Upload job files
CREATE TABLE shopify_upload_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES shopify_upload_jobs(id),
  original_filename VARCHAR(255),
  processed_filename VARCHAR(255),
  shopify_file_id VARCHAR(255),
  shopify_product_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',
  error_message TEXT,
  metadata JSONB
);

-- Audit reports
CREATE TABLE shopify_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES shopify_connections(id),
  audit_type VARCHAR(50),
  results JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4.2 TypeScript Interfaces

```typescript
// Shopify connection state
interface ShopifyConnection {
  id: string;
  shopDomain: string;
  isConnected: boolean;
  scopes: string[];
  lastSyncAt?: Date;
}

// Upload job configuration
interface UploadJobConfig {
  destination: 'files' | 'product-media';
  skuMapping?: SkuMappingConfig;
  optimization: {
    format: 'webp' | 'jpeg' | 'png';
    quality: number;
    maxDimension?: number;
  };
  seo: {
    generateFilename: boolean;
    filenameTemplate?: FilenameTemplate;
    generateAltText: boolean;
    altTextTemplate?: string;
  };
  backgroundRemoval?: BackgroundRemovalConfig;
}

// Upload job status
interface UploadJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalFiles: number;
  processedFiles: number;
  failedFiles: number;
  files: UploadJobFile[];
  createdAt: Date;
  completedAt?: Date;
}
```

---

## Part 5: API Endpoints (Backend)

### 5.1 OAuth Endpoints

```
GET  /api/shopify/auth/install?shop={domain}
     → Redirect to Shopify OAuth

GET  /api/shopify/auth/callback
     → Handle OAuth callback, store token

POST /api/shopify/auth/disconnect
     → Revoke access, remove connection

GET  /api/shopify/connection
     → Get current connection status
```

### 5.2 Upload Endpoints

```
POST /api/shopify/upload/stage
     → Create staged upload URLs
     Body: { files: [{ filename, mimeType, size }] }

POST /api/shopify/upload/complete
     → Finalize uploads after binary transfer
     Body: { stagedUrls: [...], config: UploadJobConfig }

POST /api/shopify/upload/bulk
     → Start bulk upload job
     Body: { files: File[], config: UploadJobConfig }

GET  /api/shopify/upload/jobs
     → List upload jobs

GET  /api/shopify/upload/jobs/:id
     → Get job status and results
```

### 5.3 Product Endpoints

```
GET  /api/shopify/products/search?q={query}
     → Search products by title, SKU, handle

GET  /api/shopify/products/:id/media
     → Get product media

POST /api/shopify/products/:id/media
     → Attach uploaded images to product
```

### 5.4 Audit Endpoints

```
POST /api/shopify/audit/start
     → Start media quality audit

GET  /api/shopify/audit/:id
     → Get audit results

POST /api/shopify/audit/:id/fix
     → Apply auto-fixes
```

---

## Part 6: Frontend Components (New)

### 6.1 Component Hierarchy

```
src/components/shopify/
├── ShopifyConnect.tsx       # OAuth connection button/status
├── ShopifyDashboard.tsx     # Main Shopify integration panel
├── UploadToShopify.tsx      # Upload configuration UI
├── SkuMapper.tsx            # SKU mapping configuration
├── SkuPreview.tsx           # Show matched/unmatched files
├── UploadProgress.tsx       # Real-time upload progress
├── MediaAudit.tsx           # Audit dashboard
├── AuditResults.tsx         # Detailed audit findings
├── ProductMediaManager.tsx  # Variant image assignment
└── PresetSelector.tsx       # Shopify-specific presets
```

### 6.2 State Management

```typescript
// New Shopify context
interface ShopifyState {
  connection: ShopifyConnection | null;
  isConnecting: boolean;
  activeJob: UploadJob | null;
  jobs: UploadJob[];
  audit: AuditReport | null;
}

type ShopifyAction =
  | { type: 'SET_CONNECTION'; payload: ShopifyConnection }
  | { type: 'DISCONNECT' }
  | { type: 'START_JOB'; payload: UploadJob }
  | { type: 'UPDATE_JOB'; payload: Partial<UploadJob> }
  | { type: 'SET_AUDIT'; payload: AuditReport };
```

---

## Part 7: Security & Compliance

### 7.1 Security Measures

| Area | Implementation |
|------|----------------|
| Token Storage | AES-256 encryption at rest |
| Token Transmission | HTTPS only, never in URLs |
| API Calls | Server-side only (no client exposure) |
| Rate Limiting | Respect Shopify limits (40 req/s) |
| Webhook Verification | HMAC signature validation |
| CORS | Strict origin allowlist |

### 7.2 Data Handling

- **Original images**: Processed in browser, not stored on server
- **Processed images**: Temporarily staged, deleted after upload
- **Tokens**: Encrypted, deletable on disconnect
- **Logs**: No PII in logs, audit trail for compliance

### 7.3 App Lifecycle

- **Install**: Clear onboarding, permission explanations
- **Uninstall**: Clean removal via webhook, delete all data
- **Update**: Graceful migration, re-authorization if needed

---

## Part 8: Integration with Existing System

### 8.1 How It Fits

```
Current Image Tools (v2.7.1)
├── Convert images (HEIC, JPEG, PNG → WebP, AVIF)
├── Edit images (crop, rotate, filters, overlay)
├── Batch processing (up to 50 files)
├── Download (single or ZIP)
└── Privacy-first (client-side processing)

↓ Extended in v3.0 ↓

Image Tools v3.0 (Shopify Integration)
├── All existing features
├── Shopify connection (OAuth)
├── Direct upload to Shopify
├── SKU-based product mapping
├── SEO automation
├── Media audit
└── Background removal (AI)
```

### 8.2 UI Integration

The Shopify panel appears as a new section in the existing UI:

```
┌─────────────────────────────────────────────────────────────────┐
│  Image Tools                                    [☀️] [Connect]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Drop Zone - Existing]                                         │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Selected Files (3)              │  Image Editing [Existing]    │
│  ├─ file1.jpg                    │  ├─ Crop                     │
│  ├─ file2.heic                   │  ├─ Rotate/Flip              │
│  └─ file3.png                    │  └─ Filters                  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Conversion Settings [Existing]  │  Shopify Upload [NEW]        │
│  ├─ Output Format                │  ├─ Store: mystore.shop      │
│  ├─ Quality                      │  ├─ Upload to: Products      │
│  └─ Presets                      │  ├─ SKU Mapping: Enabled     │
│                                  │  └─ [Upload to Shopify]      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Convert All]  [Download ZIP]   [Upload to Shopify]            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.3 Subscription Integration (Future)

```
tools.fawadhs.dev subscription tiers:

Free:
- 50 conversions/month
- Local download only

Pro ($9/mo):
- Unlimited conversions
- Shopify connection (1 store)
- Basic SKU mapping
- 500 uploads/month

Business ($29/mo):
- Everything in Pro
- Multiple stores
- Background removal
- Media audit
- Unlimited uploads
- Priority processing
```

---

## Part 9: Error Handling

### 9.1 Error Categories

| Category | Example | User Action |
|----------|---------|-------------|
| OAuth | Token expired | Re-authenticate |
| Rate Limit | 429 Too Many Requests | Wait, auto-retry |
| Upload | File too large | Resize image |
| SKU Match | Product not found | Manual mapping |
| Shopify | API error | Retry or contact support |

### 9.2 Error Display

```typescript
interface UploadError {
  code: string;
  message: string;
  file?: string;
  recoverable: boolean;
  suggestedAction?: string;
}

// Example error handling
{
  code: 'SKU_NOT_FOUND',
  message: 'No product found with SKU "ABC123"',
  file: 'ABC123_front.jpg',
  recoverable: true,
  suggestedAction: 'Map manually or check SKU in Shopify'
}
```

---

## Part 10: Testing Strategy

### 10.1 Test Categories

| Type | Coverage | Tools |
|------|----------|-------|
| Unit Tests | Business logic, parsers | Jest |
| Integration | API endpoints | Supertest |
| E2E | Full upload flow | Playwright |
| OAuth Mock | Shopify auth flow | Mock server |
| Load Test | Rate limit handling | k6 |

### 10.2 Test Shopify Stores

- Development store for testing
- Populated with sample products
- Various SKU patterns for mapping tests

---

## Appendix A: Competitive Analysis

| Feature | TinyIMG | Crush.pics | Image Tools v3 |
|---------|---------|------------|----------------|
| Compression | ✅ | ✅ | ✅ |
| WebP/AVIF | ✅ | ⬜ | ✅ |
| Background Removal | ⬜ | ⬜ | ✅ |
| SKU Mapping | ⬜ | ⬜ | ✅ |
| Visual Normalization | ⬜ | ⬜ | ✅ |
| Social Presets | ⬜ | ⬜ | ✅ |
| GraphQL API | ⬜ | ⬜ | ✅ |
| Privacy-First | ⬜ | ⬜ | ✅ |
| Open Source | ⬜ | ⬜ | ✅ |

---

## Appendix B: GraphQL Queries Reference

See [shopify-graphql-reference.md](./shopify-graphql-reference.md) for complete query documentation.

---

**Document Version**: 1.0.0  
**Last Updated**: January 21, 2026  
**Author**: Image Tools Team
