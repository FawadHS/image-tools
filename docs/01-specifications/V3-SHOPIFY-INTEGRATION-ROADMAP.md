# Image Tools V3 - Shopify Integration Roadmap

> **Version**: 3.0.0  
> **Created**: January 21, 2026  
> **Target Release**: Q2 2026  
> **Related**: [V3-SHOPIFY-INTEGRATION-SPEC.md](./V3-SHOPIFY-INTEGRATION-SPEC.md)  
> **Parent Platform**: tools.fawadhs.dev (fawadhs-tools)

---

## Integration Strategy

This roadmap adds Shopify capabilities to the **existing fawadhs-tools platform**:

| Component | Approach | Notes |
|-----------|----------|-------|
| Backend | Extend existing api.tools.fawadhs.dev | New `/api/shopify/*` module |
| Frontend | Add to existing Image Tools page | New Shopify panel/tab |
| Database | Extend existing Prisma schema | New models, same PostgreSQL |
| Auth | Use existing JWT system | Shopify features require login |
| Subscriptions | Integrate with existing Stripe | Pro/Business tier gates |
| Dashboard | Add Shopify widgets | Usage stats, connections |
| Admin Panel | Add Shopify metrics | Platform-wide stats |

**Key Principle**: No separate services. Everything in the existing infrastructure.

---

## Release Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Image Tools v3.0 Roadmap                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Phase 1: Foundation          Jan 2026       ████████████ 100%  ✅     │
│  Phase 2: Core Upload         Jan 2026       ████████████ 100%  ✅     │
│  Phase 3: SKU & Bulk          Jan 2026       ████████████ 100%  ✅     │
│  Phase 4: SEO & Audit         TBD            ░░░░░░░░░░░░   -   ⏸️     │
│  Phase 5: AI Features         TBD            ░░░░░░░░░░░░   -   ⏸️     │
│  Phase 6: Polish & Launch     TBD            ░░░░░░░░░░░░   -   ⏸️     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

Phases 1-3: Complete ✅
Phases 4-6: Deferred - will be scheduled based on user demand
```

---

## Phase 1: Foundation & Infrastructure (4 weeks)
**Target**: February 2026  
**Status**: ✅ Complete

### 1.1 Backend Module Setup (Extend Existing)
| Task | Priority | Complexity | Status | Notes |
|------|----------|------------|--------|-------|
| Create `backend/src/modules/shopify/` | High | Low | ✅ Done | Follow existing module pattern |
| Add Prisma models to schema.prisma | High | Low | ✅ Done | ShopifyConnection, etc. |
| Run Prisma migration | High | Low | ✅ Done | `npx prisma migrate dev` |
| Register shopify routes in app.ts | High | Low | ✅ Done | Like other modules |
| Add `@shopify/shopify-api` package | High | Low | ✅ Done | Official SDK |
| Environment variables for Shopify | High | Low | ✅ Done | Add to .env |

### 1.2 Shopify Partner Setup
| Task | Priority | Complexity | Status | Notes |
|------|----------|------------|--------|-------|
| Register Shopify Partner account | High | Low | ✅ Done | partners.shopify.com |
| Create app in Partner Dashboard | High | Low | ✅ Done | "Preflight Image Tools" |
| Configure OAuth URLs | High | Low | ✅ Done | api.tools.fawadhs.dev/api/shopify |
| Set required scopes | High | Low | ✅ Done | write_files, write_products |
| Create development store | High | Low | ✅ Done | preflight-test-store |
| Get API credentials | High | Low | ✅ Done | Client ID, Secret |

### 1.3 OAuth Implementation
| Task | Priority | Complexity | Status | Notes |
|------|----------|------------|--------|-------|
| `shopify-oauth.service.ts` | High | Medium | ✅ Done | OAuth flow logic |
| Install route `/auth/install` | High | Medium | ✅ Done | Requires logged-in user |
| Callback route `/auth/callback` | High | Medium | ✅ Done | Exchange code for token |
| Token encryption utility | High | Medium | ✅ Done | AES-256-GCM |
| Disconnect endpoint | High | Low | ✅ Done | Revoke + delete record |
| List connections endpoint | High | Low | ✅ Done | User's connected stores |

### 1.4 Frontend: Shopify Panel in Image Tools
| Task | Priority | Complexity | Status | Notes |
|------|----------|------------|--------|-------|
| Create ShopifyContext in Image Tools | High | Medium | ⬜ Todo | Connection state |
| Add "Shopify" tab to ImageToolsPage | High | Low | ⬜ Todo | Tab navigation |
| ShopifyConnect component | High | Medium | ⬜ Todo | Connect button, status |
| Connected store card | High | Low | ⬜ Todo | Show shop domain, status |
| Call fawadhs-tools API | High | Medium | ⬜ Todo | Use existing apiClient |
| Gate behind login | High | Low | ⬜ Todo | Redirect to /login if not auth |

### 1.5 Dashboard Integration
| Task | Priority | Complexity | Status | Notes |
|------|----------|------------|--------|-------|
| Add Shopify section to DashboardPage | Medium | Low | ⬜ Todo | Connected stores widget |
| Show Shopify upload stats | Medium | Low | ⬜ Todo | Monthly usage |
| Link to Image Tools Shopify tab | Medium | Low | ⬜ Todo | Quick action |

### Phase 1 Deliverables
- [x] Shopify module in existing backend
- [x] OAuth flow working end-to-end
- [x] Can connect/disconnect Shopify store
- [x] Connection persisted in database
- [x] Frontend shows connection status
- [ ] Dashboard shows Shopify widget

---

## Phase 2: Core Upload Functionality (4 weeks)
**Target**: March 2026  
**Status**: ✅ Complete

### 2.1 Staged Upload Implementation
| Task | Priority | Complexity | Status | Notes |
|------|----------|------------|--------|-------|
| `stagedUploadsCreate` mutation | High | Medium | ✅ Done | Get upload URLs |
| Multipart form upload to staged URL | High | Medium | ✅ Done | POST request |
| `fileCreate` mutation | High | Medium | ✅ Done | Register file in Shopify |
| Complete upload endpoint | High | Medium | ✅ Done | /api/shopify/upload/complete |
| Error handling | High | Medium | 🔄 Partial | Basic error handling |

### 2.2 Product Media Attachment
| Task | Priority | Complexity | Status | Notes |
|------|----------|------------|--------|-------|
| `productCreateMedia` mutation | High | Medium | ✅ Done | Attach media to product |
| Media ordering | Medium | Low | ⬜ Deferred | Position in gallery (Phase 3) |
| Variant image assignment | Medium | Medium | ⬜ Deferred | Link to specific variant (Phase 3) |
| Product search endpoint | High | Medium | ✅ Done | Fuzzy search with wildcards |
| Product list/browse endpoint | High | Medium | ✅ Done | Paginated browse modal |

### 2.3 Frontend: Upload UI
| Task | Priority | Complexity | Status | Notes |
|------|----------|------------|--------|-------|
| ShopifyUploader component | High | Medium | ✅ Done | Main upload panel |
| Destination selector | High | Low | ✅ Done | Files vs Product media toggle |
| Product search/select | High | Medium | ✅ Done | Fuzzy search + browse modal |
| Upload progress indicator | High | Medium | ✅ Done | Real-time status |
| Success/failure summary | High | Low | ✅ Done | Results display |
| Retry logic | High | Medium | ✅ Done | Exponential backoff, 2 retries |

### 2.4 Shopify Presets
| Task | Priority | Complexity | Status | Notes |
|------|----------|------------|--------|-------|
| Add Shopify presets to settings | High | Low | ✅ Done | Collection, Product, etc. |
| Social media presets | Medium | Low | ✅ Done | Instagram, Pinterest, etc. |
| Export pack feature | Medium | Medium | ⬜ Todo | Multiple sizes at once |
| Preset preview | Low | Medium | ⬜ Todo | Show output dimensions |

### 2.5 Subscription Integration
| Task | Priority | Complexity | Status | Notes |
|------|----------|------------|--------|-------|
| Gate Shopify features behind Pro tier | High | Low | ⬜ Todo | Use existing middleware |
| Track uploads in UsageLog | High | Low | ⬜ Todo | toolName: 'shopify-uploader' |
| Show upload limits in UI | High | Low | ⬜ Todo | "45/500 uploads this month" |
| Upgrade prompts | Medium | Low | ⬜ Todo | When approaching limit |

### Phase 2 Deliverables
- [x] Can upload single image to Shopify Files
- [x] Can attach image to specific product
- [x] Upload progress shown in UI
- [x] Shopify presets available
- [x] Error handling with retry logic
- [x] Fuzzy product search (title, SKU, handle)
- [x] Browse all products modal with pagination

---

## Phase 3: SKU Mapping & Bulk Operations (4 weeks)
**Target**: January 2026  
**Status**: ✅ Complete

### 3.1 Filename Parsing Engine
| Task | Priority | Complexity | Status | Notes |
|------|----------|------------|--------|-------|
| SKU prefix pattern parser | High | Medium | ✅ Done | `SKU-xxx.jpg` |
| SKU suffix pattern parser | High | Medium | ✅ Done | `xxx-SKU.jpg` |
| Handle pattern parser | High | Medium | ✅ Done | `product-handle.jpg` |
| Custom regex support | Medium | High | ✅ Done | Advanced users |
| Position extraction | Medium | Medium | ✅ Done | `xxx_1.jpg` |
| View/angle extraction | Medium | Medium | ✅ Done | `xxx_front.jpg` |

### 3.2 Product Lookup Service
| Task | Priority | Complexity | Status | Notes |
|------|----------|------------|--------|-------|
| Bulk product query | High | Medium | ✅ Done | GraphQL with pagination |
| SKU index cache | High | Medium | ✅ Done | Fast lookup via buildIndex |
| Handle index cache | High | Medium | ✅ Done | Fast lookup via buildIndex |
| Cache invalidation | Medium | Medium | ⏸️ Deferred | Per-request build for now |

### 3.3 SKU Mapping UI
| Task | Priority | Complexity | Status | Notes |
|------|----------|------------|--------|-------|
| SkuMapper configuration | High | Medium | ✅ Done | Pattern selection |
| SkuPreview component | High | High | ✅ Done | Show matches |
| Manual mapping override | High | Medium | ✅ Done | Fix unmatched |
| Unmatched files list | High | Low | ✅ Done | Clear visibility |
| Mapping confirmation | High | Low | ✅ Done | Before upload |

### 3.4 Bulk Upload Job System
| Task | Priority | Complexity | Status | Notes |
|------|----------|------------|--------|-------|
| Job creation endpoint | High | Medium | ⏸️ Deferred | Existing staged upload works |
| Job status endpoint | High | Low | ⏸️ Deferred | Manual polling for now |
| Worker process | High | High | ⏸️ Deferred | Client-side batch for now |
| Rate limit handling | High | Medium | ✅ Done | Exponential backoff in frontend |
| Job history | Medium | Low | ⏸️ Deferred | Not needed initially |

### 3.5 ZIP Upload Support
| Task | Priority | Complexity | Status | Notes |
|------|----------|------------|--------|-------|
| ZIP file extraction | Medium | Medium | ⏸️ Deferred | Future enhancement |
| Folder structure handling | Medium | Medium | ⏸️ Deferred | Future enhancement |
| Large ZIP support | Medium | High | ⏸️ Deferred | Future enhancement |

### Phase 3 Deliverables
- [x] Filename parsing with 5 patterns (sku-prefix, sku-suffix, handle, sku-anywhere, custom)
- [x] SKU/handle matching working with confidence scores
- [x] Preview shows matched/unmatched files with color coding
- [x] Manual product selection for unmatched files
- [x] SkuMapper UI integrated into ShopifyPanel
- [ ] ~~Bulk upload jobs processing~~ (Deferred - using client-side batch)
- [ ] ~~ZIP upload supported~~ (Deferred)

---

## Phases 4-6: Deferred

> **Note**: These phases are deferred until initial Shopify features are validated with real users.
> Will be scheduled based on user demand and feedback.

### Phase 4: SEO Automation & Audit (Deferred)
**Status**: ⏸️ Deferred

Planned features:
- SEO filename template engine
- Alt text automation with templates
- Media quality audit (missing alt text, low resolution)
- Audit dashboard UI

### Phase 5: AI Features (Deferred)
**Status**: ⏸️ Deferred

Planned features:
- AI-powered alt text generation
- Background removal
- Image enhancement
- Smart cropping

### Phase 6: Polish & Launch (Deferred)
**Status**: ⏸️ Deferred

Planned features:
- Shopify App Store submission
- User onboarding flow
- Marketing and documentation
- Performance optimization

---

## Completed Features Summary

### Backend API Endpoints (fawadhs-tools)
All endpoints at `api.tools.fawadhs.dev/api/shopify/`:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/connections` | GET | List user's connected stores |
| `/connections/:id` | GET | Get single connection |
| `/auth/install` | POST | Start OAuth flow |
| `/auth/callback` | GET | OAuth callback (from Shopify) |
| `/auth/disconnect` | POST | Disconnect store |
| `/upload/staged` | POST | Create staged upload targets |
| `/upload/complete` | POST | Complete file registration |
| `/products` | GET | List all products (paginated) |
| `/products/search` | GET | Search products (fuzzy) |
| `/products/:id` | GET | Get single product |
| `/products/attach-media` | POST | Attach media to product |
| `/sku-mapping/parse` | POST | Parse filenames |
| `/sku-mapping/match` | POST | Match files to products |
| `/sku-mapping/index` | GET | Get product index stats |

### Frontend Components (Image Tools)
All components in `src/components/shopify/`:

| Component | Purpose |
|-----------|---------|
| `ShopifyPanel` | Main Shopify UI with tabs |
| `ShopifyConnect` | OAuth connection flow |
| `ShopifyUploader` | Upload to Shopify |
| `ProductSearch` | Product search/browse modal |
| `SkuMapper` | SKU-based file matching |

---

## Integration Checklist (fawadhs-tools)

Platform integration status:

### Backend Integration
- [x] Shopify module follows existing module pattern
- [x] Prisma models added to existing schema
- [x] Routes registered in app.ts
- [x] Auth middleware reused
- [ ] ~~Usage logging integrated with existing UsageLog~~ (Deferred)
- [x] Rate limiting via frontend retry logic

### Frontend Integration
- [x] Shopify panel in Image Tools settings
- [x] Uses existing auth state (localStorage token)
- [x] Uses existing API client pattern
- [x] Gated behind subscription tier check
- [x] Dark mode compatible

### Dashboard Integration (Deferred)
- [ ] ~~Shopify connections widget~~ (Deferred)
- [ ] ~~Upload statistics card~~ (Deferred)
- [ ] ~~Quick actions to Image Tools~~ (Deferred)

### Admin Panel Integration
- [ ] Shopify stats in admin dashboard
- [ ] Connection management (view/revoke)
- [ ] Job monitoring
- [ ] Error tracking

### Subscription Integration
- [ ] Pro tier gates Shopify connection
- [ ] Business tier gates advanced features
- [ ] Upload limits enforced
- [ ] Upgrade prompts shown

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Shopify API changes | High | Low | Monitor changelog, GraphQL versioning |
| Rate limit issues | Medium | Medium | ✅ Implemented exponential backoff |
| AI service costs | Medium | Medium | Deferred (no AI features yet) |
| OAuth token expiry | Low | Medium | Manual reconnect required |
| Large file handling | Medium | Low | ✅ Client-side processing, staged uploads |

---

## Success Metrics

| Metric | Target | Status |
|--------|--------|--------|
| OAuth Flow Working | 100% | ✅ Complete |
| Upload to Files | 100% | ✅ Complete |
| Upload to Product | 100% | ✅ Complete |
| SKU Matching | 100% | ✅ Complete |
| Test Store Connected | Yes | ✅ preflight-test-store.myshopify.com |

---

## Post-Launch Roadmap (Deferred)

Future enhancements to be prioritized based on user feedback:

- Theme asset optimization
- AI background removal
- Webhook-based auto-optimization  
- Multiple store management
- Marketplace compliance modes
- API access for developers

---

**Document Version**: 1.1.0  
**Last Updated**: January 26, 2026  
**Author**: Image Tools Team
