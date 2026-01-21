# Image Tools V3 - Shopify Integration Specification

> **Version**: 3.0.0 (Shopify Integration)  
> **Created**: January 21, 2026  
> **Status**: Planning Phase  
> **Related**: tools.fawadhs.dev/image-tools  
> **Parent Platform**: fawadhs-tools (tools.fawadhs.dev)

---

## Executive Summary

Image Tools v3.0 extends the existing privacy-first image processing platform with native Shopify integration, enabling merchants to directly optimize, upload, and manage product images within their stores. This version positions the tool as a **Shopify-first image operations & visual consistency platform**.

**Critical Integration Point**: This feature integrates with the broader **fawadhs-tools** platform at tools.fawadhs.dev, leveraging:
- Existing Fastify backend at `api.tools.fawadhs.dev`
- User authentication system (JWT-based)
- Subscription tiers (Free → Pro → Business)
- Dashboard and usage tracking
- PostgreSQL + Redis infrastructure

### Key Value Propositions
1. **Direct Shopify Integration** - Upload optimized images directly to Shopify stores
2. **SKU-Based Bulk Operations** - Map images to products via filename parsing
3. **Visual Consistency** - Background removal + uniform padding for professional grids
4. **SEO Automation** - Auto-generated filenames and alt text
5. **Future-Proof** - GraphQL-only API compliance (2025+ ready)
6. **Platform Integration** - Seamless with tools.fawadhs.dev subscriptions

---

## Part 1: Architecture Overview

### 1.1 System Architecture (Integrated with fawadhs-tools)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    tools.fawadhs.dev Platform Architecture                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────────┐  │
│   │                         FRONTEND (React SPA)                              │  │
│   │                         tools.fawadhs.dev                                 │  │
│   ├──────────────────────────────────────────────────────────────────────────┤  │
│   │  /                  │  /dashboard        │  /image-tools    │  /account  │  │
│   │  Landing            │  User Dashboard    │  Image Converter │  Settings  │  │
│   │  Pricing            │  Usage Stats       │  + Shopify Panel │  Billing   │  │
│   │  Auth Pages         │  Subscription      │  + Media Audit   │  Profile   │  │
│   └──────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                           │
│                                      ▼                                           │
│   ┌──────────────────────────────────────────────────────────────────────────┐  │
│   │                    EXISTING BACKEND (api.tools.fawadhs.dev)               │  │
│   │                           Fastify + PostgreSQL + Redis                    │  │
│   ├──────────────────────────────────────────────────────────────────────────┤  │
│   │                                                                           │  │
│   │  EXISTING MODULES          │     NEW SHOPIFY MODULE                       │  │
│   │  ┌─────────────────────┐  │     ┌─────────────────────────────────────┐  │  │
│   │  │  auth/              │  │     │  shopify/                           │  │  │
│   │  │  - register         │  │     │  - shopify.routes.ts                │  │  │
│   │  │  - login            │  │     │  - shopify.service.ts               │  │  │
│   │  │  - jwt tokens       │  │     │  - shopify-oauth.service.ts         │  │  │
│   │  ├─────────────────────┤  │     │  - shopify-upload.service.ts        │  │  │
│   │  │  subscription/      │  │     │  - shopify-sku.service.ts           │  │  │
│   │  │  - Stripe           │  │     │  - shopify-audit.service.ts         │  │  │
│   │  │  - Plans            │  │     └─────────────────────────────────────┘  │  │
│   │  │  - Discounts        │  │                     │                         │  │
│   │  ├─────────────────────┤  │                     ▼                         │  │
│   │  │  usage/             │◄─┼─────────────────────┤                         │  │
│   │  │  - Track uploads    │  │     NEW PRISMA MODELS                        │  │
│   │  │  - Statistics       │  │     ┌─────────────────────────────────────┐  │  │
│   │  ├─────────────────────┤  │     │  ShopifyConnection                  │  │  │
│   │  │  admin/             │  │     │  ShopifyUploadJob                   │  │  │
│   │  │  - User management  │  │     │  ShopifyUploadFile                  │  │  │
│   │  │  - Platform stats   │  │     │  ShopifyAudit                       │  │  │
│   │  │  - Discounts        │  │     └─────────────────────────────────────┘  │  │
│   │  └─────────────────────┘  │                                               │  │
│   │                            │                                               │  │
│   └──────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                           │
│                                      ▼                                           │
│   ┌──────────────────────────────────────────────────────────────────────────┐  │
│   │                          EXTERNAL SERVICES                                │  │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│   │  │   Shopify    │  │    Stripe    │  │    Resend    │  │  AI Service  │  │  │
│   │  │ GraphQL API  │  │   Payments   │  │    Email     │  │ (Bg Removal) │  │  │
│   │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │  │
│   └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack (Leveraging Existing Infrastructure)

| Layer | Technology | Notes |
|-------|------------|-------|
| **Frontend** | React 18 + TypeScript | Existing tools.fawadhs.dev frontend |
| **State** | Zustand + React Context | Existing auth store pattern |
| **Backend** | Fastify + TypeScript | **EXISTING** api.tools.fawadhs.dev |
| **Database** | PostgreSQL 16 | **EXISTING** Docker container |
| **Cache/Queue** | Redis 7 | **EXISTING** Docker container |
| **ORM** | Prisma 5.22 | **EXISTING** - add new models |
| **Auth** | JWT (access + refresh) | **EXISTING** auth module |
| **Payments** | Stripe SDK | **EXISTING** subscription module |
| **Email** | Resend | **EXISTING** for notifications |
| **AI Services** | External API | NEW - Background removal |
| **Shopify API** | GraphQL Admin API | NEW - OAuth 2.0 |

### 1.3 Deployment Architecture (Single Server)

```
Server: 142.132.168.16 (Hetzner CPX11)
├── Nginx (reverse proxy + SSL)
│
├── tools.fawadhs.dev              → Frontend SPA (static files)
│   └── /image-tools              → Image Tools (existing + Shopify UI)
│
├── api.tools.fawadhs.dev          → Fastify Backend
│   ├── /api/auth/*               → Auth module (existing)
│   ├── /api/user/*               → User module (existing)
│   ├── /api/subscription/*       → Subscription module (existing)
│   ├── /api/usage/*              → Usage tracking (existing)
│   ├── /api/admin/*              → Admin panel (existing)
│   └── /api/shopify/*            → Shopify module (NEW)
│
├── PostgreSQL (Docker, 127.0.0.1:5432)
├── Redis (Docker, 127.0.0.1:6379)
└── PM2 (process manager)
```

**Key Benefit**: No new infrastructure needed. Shopify module adds to existing backend.

---

## Part 1.5: Integration with fawadhs-tools Platform

### 1.5.1 Subscription Tier Integration

Shopify features are gated by subscription tier:

| Feature | Free | Pro ($9/mo) | Business ($29/mo) |
|---------|------|-------------|-------------------|
| Local conversion | ✅ Unlimited | ✅ Unlimited | ✅ Unlimited |
| Shopify connection | ❌ | ✅ 1 store | ✅ 5 stores |
| Direct upload | ❌ | ✅ 500/mo | ✅ Unlimited |
| SKU mapping | ❌ | ✅ Basic | ✅ Advanced + regex |
| SEO automation | ❌ | ✅ Templates | ✅ + AI alt text |
| Background removal | ❌ | ❌ | ✅ 100/mo |
| Media audit | ❌ | ❌ | ✅ |
| Priority processing | ❌ | ❌ | ✅ |

### 1.5.2 Dashboard Integration

Add Shopify status to existing Dashboard:

```tsx
// DashboardPage.tsx additions
<Card title="Shopify Connections">
  {shopifyConnections.length > 0 ? (
    <div className="space-y-2">
      {shopifyConnections.map(conn => (
        <div key={conn.id} className="flex justify-between">
          <span>{conn.shopDomain}</span>
          <Badge variant={conn.status === 'active' ? 'success' : 'warning'}>
            {conn.status}
          </Badge>
        </div>
      ))}
    </div>
  ) : (
    <EmptyState 
      icon={Store}
      title="No Shopify stores connected"
      action={<Link to="/image-tools?tab=shopify">Connect Store</Link>}
    />
  )}
</Card>

<StatCard 
  title="Shopify Uploads (This Month)"
  value={shopifyStats.uploadsThisMonth}
  limit={subscriptionLimits.shopifyUploads}
  icon={Upload}
/>
```

### 1.5.3 Usage Tracking Integration

Leverage existing `UsageLog` model for Shopify operations:

```typescript
// Usage log entries for Shopify
await prisma.usageLog.create({
  data: {
    userId: user.id,
    toolName: 'shopify-uploader',
    action: 'bulk-upload',
    fileCount: files.length,
    inputSize: totalInputSize,
    outputSize: totalOutputSize,
    metadata: {
      shopDomain: connection.shopDomain,
      jobId: job.id,
      skuMatches: matchedCount,
    }
  }
});
```

### 1.5.4 Admin Panel Integration

Add Shopify statistics to admin dashboard:

```
/admin/dashboard
├── Platform Stats (existing)
│   ├── Total Users
│   ├── Active Subscriptions
│   └── Revenue
│
└── Shopify Stats (NEW)
    ├── Connected Stores
    ├── Total Uploads (24h / 7d / 30d)
    ├── Popular Upload Patterns
    └── Error Rate
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

## Part 4: Data Models (Prisma - Extends Existing Schema)

### 4.1 New Prisma Models (Add to existing schema.prisma)

```prisma
// ==================== SHOPIFY INTEGRATION ====================

model ShopifyConnection {
  id                  String    @id @default(uuid()) @db.Uuid
  userId              String    @map("user_id") @db.Uuid
  shopDomain          String    @unique @map("shop_domain") @db.VarChar(255)
  accessTokenEncrypted String   @map("access_token_encrypted") @db.Text
  scopes              String[]
  shopName            String?   @map("shop_name") @db.VarChar(255)
  shopEmail           String?   @map("shop_email") @db.VarChar(255)
  installedAt         DateTime  @default(now()) @map("installed_at")
  lastSyncAt          DateTime? @map("last_sync_at")
  status              String    @default("active") @db.VarChar(20) // active, disconnected, expired

  user       User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  uploadJobs ShopifyUploadJob[]
  audits     ShopifyAudit[]

  @@index([userId])
  @@index([shopDomain])
  @@map("shopify_connections")
}

model ShopifyUploadJob {
  id              String    @id @default(uuid()) @db.Uuid
  connectionId    String    @map("connection_id") @db.Uuid
  userId          String    @map("user_id") @db.Uuid
  status          String    @default("pending") @db.VarChar(20) // pending, processing, completed, failed
  totalFiles      Int       @map("total_files")
  processedFiles  Int       @default(0) @map("processed_files")
  failedFiles     Int       @default(0) @map("failed_files")
  config          Json      // UploadJobConfig
  results         Json?     // Summary results
  errorMessage    String?   @map("error_message") @db.Text
  createdAt       DateTime  @default(now()) @map("created_at")
  startedAt       DateTime? @map("started_at")
  completedAt     DateTime? @map("completed_at")

  connection ShopifyConnection    @relation(fields: [connectionId], references: [id], onDelete: Cascade)
  files      ShopifyUploadFile[]

  @@index([connectionId])
  @@index([userId])
  @@index([status])
  @@map("shopify_upload_jobs")
}

model ShopifyUploadFile {
  id                String   @id @default(uuid()) @db.Uuid
  jobId             String   @map("job_id") @db.Uuid
  originalFilename  String   @map("original_filename") @db.VarChar(255)
  processedFilename String?  @map("processed_filename") @db.VarChar(255)
  shopifyFileId     String?  @map("shopify_file_id") @db.VarChar(255)
  shopifyProductId  String?  @map("shopify_product_id") @db.VarChar(255)
  matchedSku        String?  @map("matched_sku") @db.VarChar(100)
  status            String   @default("pending") @db.VarChar(20) // pending, uploading, attached, failed
  errorMessage      String?  @map("error_message") @db.Text
  inputSize         BigInt?  @map("input_size")
  outputSize        BigInt?  @map("output_size")
  metadata          Json?
  createdAt         DateTime @default(now()) @map("created_at")

  job ShopifyUploadJob @relation(fields: [jobId], references: [id], onDelete: Cascade)

  @@index([jobId])
  @@index([status])
  @@map("shopify_upload_files")
}

model ShopifyAudit {
  id            String   @id @default(uuid()) @db.Uuid
  connectionId  String   @map("connection_id") @db.Uuid
  userId        String   @map("user_id") @db.Uuid
  auditType     String   @map("audit_type") @db.VarChar(50) // media-quality, seo, all
  status        String   @default("pending") @db.VarChar(20)
  totalImages   Int?     @map("total_images")
  criticalCount Int?     @map("critical_count")
  warningCount  Int?     @map("warning_count")
  results       Json?    // Detailed audit findings
  createdAt     DateTime @default(now()) @map("created_at")
  completedAt   DateTime? @map("completed_at")

  connection ShopifyConnection @relation(fields: [connectionId], references: [id], onDelete: Cascade)

  @@index([connectionId])
  @@index([userId])
  @@map("shopify_audits")
}
```

### 4.2 Update Existing User Model

Add relation to ShopifyConnection in existing User model:

```prisma
model User {
  // ... existing fields ...
  
  // Add this relation
  shopifyConnections ShopifyConnection[]
  
  // ... existing relations ...
}
```

### 4.3 TypeScript Interfaces

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

## Part 5: API Endpoints (New Module in Existing Backend)

All endpoints require JWT authentication via existing auth middleware.

### 5.1 Module Structure (backend/src/modules/shopify/)

```
backend/src/modules/shopify/
├── shopify.routes.ts          # Route definitions
├── shopify.service.ts         # Main service
├── shopify.controller.ts      # Request handlers
├── shopify-oauth.service.ts   # OAuth flow
├── shopify-graphql.service.ts # GraphQL client
├── shopify-upload.service.ts  # Upload logic
├── shopify-sku.service.ts     # SKU parsing & matching
├── shopify-audit.service.ts   # Media audit
├── shopify.types.ts           # TypeScript types
└── shopify.schemas.ts         # Zod validation schemas
```

### 5.2 OAuth Endpoints

```typescript
// shopify.routes.ts
fastify.get('/api/shopify/auth/install', {
  preHandler: [fastify.authenticate],  // Requires logged-in user
  handler: shopifyController.initiateOAuth
});
// → Redirects to Shopify OAuth with state containing userId

fastify.get('/api/shopify/auth/callback', {
  handler: shopifyController.handleCallback
});
// → Exchanges code for token, stores encrypted, redirects to dashboard

fastify.post('/api/shopify/auth/disconnect', {
  preHandler: [fastify.authenticate],
  handler: shopifyController.disconnect
});
// → Revokes token, deletes connection record

fastify.get('/api/shopify/connections', {
  preHandler: [fastify.authenticate],
  handler: shopifyController.listConnections
});
// → Returns user's Shopify connections with status
```

### 5.3 Upload Endpoints

```typescript
fastify.post('/api/shopify/upload/prepare', {
  preHandler: [fastify.authenticate, fastify.checkSubscription('pro')],
  handler: shopifyController.prepareUpload
});
// Body: { connectionId, files: [{ filename, mimeType, size }] }
// Returns: { stagedTargets: [...] }

fastify.post('/api/shopify/upload/start', {
  preHandler: [fastify.authenticate, fastify.checkSubscription('pro')],
  handler: shopifyController.startBulkUpload
});
// Body: { connectionId, config: UploadJobConfig, fileMetadata: [...] }
// Returns: { jobId, status }

fastify.get('/api/shopify/upload/jobs', {
  preHandler: [fastify.authenticate],
  handler: shopifyController.listJobs
});
// Query: ?connectionId=xxx&status=completed&limit=20
// Returns: { jobs: [...], total, hasMore }

fastify.get('/api/shopify/upload/jobs/:jobId', {
  preHandler: [fastify.authenticate],
  handler: shopifyController.getJob
});
// Returns: { job, files }
```

### 5.4 Product Endpoints

```typescript
fastify.get('/api/shopify/products/search', {
  preHandler: [fastify.authenticate, fastify.checkSubscription('pro')],
  handler: shopifyController.searchProducts
});
// Query: ?connectionId=xxx&q=shirt&field=sku|handle|title
// Returns: { products: [...], hasMore, cursor }

fastify.post('/api/shopify/products/:productId/media', {
  preHandler: [fastify.authenticate, fastify.checkSubscription('pro')],
  handler: shopifyController.attachMedia
});
// Body: { connectionId, mediaUrls: [...], positions: [...] }
```

### 5.5 Audit Endpoints

```typescript
fastify.post('/api/shopify/audit/start', {
  preHandler: [fastify.authenticate, fastify.checkSubscription('business')],
  handler: shopifyController.startAudit
});
// Body: { connectionId, auditType: 'media-quality' | 'seo' | 'all' }
// Returns: { auditId, status: 'processing' }

fastify.get('/api/shopify/audit/:auditId', {
  preHandler: [fastify.authenticate],
  handler: shopifyController.getAudit
});
// Returns: { audit, findings: {...} }

fastify.post('/api/shopify/audit/:auditId/fix', {
  preHandler: [fastify.authenticate, fastify.checkSubscription('business')],
  handler: shopifyController.applyFixes
});
// Body: { fixes: ['missing-alt', 'non-seo-filename'] }
```

### 5.6 Usage Limit Middleware

```typescript
// Integrated with existing subscription system
fastify.decorate('checkShopifyLimits', async (request, reply) => {
  const user = request.user;
  const limits = getSubscriptionLimits(user.subscriptionTier);
  
  const monthlyUploads = await prisma.usageLog.count({
    where: {
      userId: user.id,
      toolName: 'shopify-uploader',
      createdAt: { gte: startOfMonth() }
    }
  });
  
  if (monthlyUploads >= limits.shopifyUploads) {
    return reply.status(429).send({
      error: 'UPLOAD_LIMIT_REACHED',
      message: `Monthly upload limit (${limits.shopifyUploads}) reached`,
      upgradeUrl: '/pricing'
    });
  }
});
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
