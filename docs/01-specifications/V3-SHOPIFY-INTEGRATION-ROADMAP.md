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
│  Phase 1: Foundation          Feb 2026       ████████████ 100%  ✅     │
│  Phase 2: Core Upload         Mar 2026       ███████░░░░░  60%  🔄     │
│  Phase 3: SKU & Bulk          Apr 2026       ░░░░░░░░░░░░   0%         │
│  Phase 4: SEO & Audit         May 2026       ░░░░░░░░░░░░   0%         │
│  Phase 5: AI Features         Jun 2026       ░░░░░░░░░░░░   0%         │
│  Phase 6: Polish & Launch     Jul 2026       ░░░░░░░░░░░░   0%         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
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
**Status**: 🔄 In Progress (60%)

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
| `productUpdate` mutation | High | Medium | ⬜ Todo | Attach media to product |
| Media ordering | Medium | Low | ⬜ Todo | Position in gallery |
| Variant image assignment | Medium | Medium | ⬜ Todo | Link to specific variant |
| Product search endpoint | High | Medium | ✅ Done | Find by title/SKU/handle |

### 2.3 Frontend: Upload UI
| Task | Priority | Complexity | Status | Notes |
|------|----------|------------|--------|-------|
| ShopifyUploader component | High | Medium | ✅ Done | Main upload panel |
| Destination selector | High | Low | ⬜ Todo | Files vs Product media |
| Product search/select | High | Medium | ⬜ Todo | If uploading to product |
| Upload progress indicator | High | Medium | ✅ Done | Real-time status |
| Success/failure summary | High | Low | ✅ Done | Results display |

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
- [ ] Can attach image to specific product
- [x] Upload progress shown in UI
- [x] Shopify presets available
- [x] Basic error handling working

---

## Phase 3: SKU Mapping & Bulk Operations (4 weeks)
**Target**: April 2026  
**Status**: ⬜ Not Started

### 3.1 Filename Parsing Engine
| Task | Priority | Complexity | Status | Notes |
|------|----------|------------|--------|-------|
| SKU prefix pattern parser | High | Medium | ⬜ Todo | `SKU-xxx.jpg` |
| SKU suffix pattern parser | High | Medium | ⬜ Todo | `xxx-SKU.jpg` |
| Handle pattern parser | High | Medium | ⬜ Todo | `product-handle.jpg` |
| Custom regex support | Medium | High | ⬜ Todo | Advanced users |
| Position extraction | Medium | Medium | ⬜ Todo | `xxx_1.jpg` |
| View/angle extraction | Medium | Medium | ⬜ Todo | `xxx_front.jpg` |

### 3.2 Product Lookup Service
| Task | Priority | Complexity | Status | Notes |
|------|----------|------------|--------|-------|
| Bulk product query | High | Medium | ⬜ Todo | GraphQL with pagination |
| SKU index cache | High | Medium | ⬜ Todo | Fast lookup |
| Handle index cache | High | Medium | ⬜ Todo | Fast lookup |
| Cache invalidation | Medium | Medium | ⬜ Todo | Webhook or TTL |

### 3.3 SKU Mapping UI
| Task | Priority | Complexity | Status | Notes |
|------|----------|------------|--------|-------|
| SkuMapper configuration | High | Medium | ⬜ Todo | Pattern selection |
| SkuPreview component | High | High | ⬜ Todo | Show matches |
| Manual mapping override | High | Medium | ⬜ Todo | Fix unmatched |
| Unmatched files list | High | Low | ⬜ Todo | Clear visibility |
| Mapping confirmation | High | Low | ⬜ Todo | Before upload |

### 3.4 Bulk Upload Job System
| Task | Priority | Complexity | Status | Notes |
|------|----------|------------|--------|-------|
| Job creation endpoint | High | Medium | ⬜ Todo | Start bulk job |
| Job status endpoint | High | Low | ⬜ Todo | Polling |
| Worker process | High | High | ⬜ Todo | BullMQ worker |
| Rate limit handling | High | Medium | ⬜ Todo | Respect Shopify limits |
| Job history | Medium | Low | ⬜ Todo | View past jobs |

### 3.5 ZIP Upload Support
| Task | Priority | Complexity | Status | Notes |
|------|----------|------------|--------|-------|
| ZIP file extraction | Medium | Medium | ⬜ Todo | Client-side |
| Folder structure handling | Medium | Medium | ⬜ Todo | Flatten or preserve |
| Large ZIP support | Medium | High | ⬜ Todo | Streaming extraction |

### Phase 3 Deliverables
- [ ] Filename parsing with 4+ patterns
- [ ] SKU/handle matching working
- [ ] Preview shows matched/unmatched files
- [ ] Bulk upload jobs processing
- [ ] ZIP upload supported

---

## Phase 4: SEO Automation & Audit (3 weeks)
**Target**: May 2026  
**Status**: ⬜ Not Started

### 4.1 SEO Filename Generation
| Task | Priority | Complexity | Status | Notes |
|------|----------|------------|--------|-------|
| Filename template engine | High | Medium | ⬜ Todo | Variables: title, variant, etc. |
| Template configuration UI | High | Low | ⬜ Todo | User customization |
| Slugification utility | High | Low | ⬜ Todo | URL-safe filenames |
| Preview generated names | Medium | Low | ⬜ Todo | Before upload |

### 4.2 Alt Text Automation
| Task | Priority | Complexity | Status | Notes |
|------|----------|------------|--------|-------|
| Template-based alt text | High | Medium | ⬜ Todo | Pattern with variables |
| Alt text template UI | High | Low | ⬜ Todo | Configuration |
| Character limit enforcement | High | Low | ⬜ Todo | Max 125 chars |
| Alt text preview | Medium | Low | ⬜ Todo | Before upload |
| Bulk alt text update | Medium | Medium | ⬜ Todo | For existing images |

### 4.3 Media Quality Audit
| Task | Priority | Complexity | Status | Notes |
|------|----------|------------|--------|-------|
| Audit job endpoint | High | Medium | ⬜ Todo | Start audit |
| Missing alt text check | High | Medium | ⬜ Todo | Query all products |
| Low resolution check | High | Medium | ⬜ Todo | <1000px warning |
| Non-SEO filename check | Medium | Low | ⬜ Todo | IMG_xxx pattern |
| Inconsistent ratio check | Low | Medium | ⬜ Todo | Compare in collection |

### 4.4 Audit Dashboard UI
| Task | Priority | Complexity | Status | Notes |
|------|----------|------------|--------|-------|
| MediaAudit component | High | Medium | ⬜ Todo | Start audit |
| AuditResults component | High | High | ⬜ Todo | Display findings |
| Issue categorization | High | Low | ⬜ Todo | Critical/Warning/Good |
| One-click fixes | High | Medium | ⬜ Todo | Auto-fix button |
| Export report | Low | Medium | ⬜ Todo | PDF/CSV |

### Phase 4 Deliverables
- [ ] SEO filenames generated automatically
- [ ] Alt text populated on upload
- [ ] Media audit scans all products
- [ ] Audit shows actionable issues
- [ ] One-click fixes for common issues

---

## Phase 5: AI Features (4 weeks)
**Target**: June 2026  
**Status**: ⬜ Not Started

### 5.1 Background Removal Integration
| Task | Priority | Complexity | Status | Notes |
|------|----------|------------|--------|-------|
| Evaluate AI providers | High | Medium | ⬜ Todo | Remove.bg, Clipdrop, self-hosted |
| API integration | High | Medium | ⬜ Todo | Selected provider |
| Background removal UI | High | Medium | ⬜ Todo | Toggle, preview |
| Output options | High | Low | ⬜ Todo | Transparent, white, custom |
| Batch background removal | Medium | Medium | ⬜ Todo | Multiple files |

### 5.2 Visual Normalization
| Task | Priority | Complexity | Status | Notes |
|------|----------|------------|--------|-------|
| Subject detection | High | High | ⬜ Todo | Find object bounds |
| Auto-crop to subject | High | Medium | ⬜ Todo | Remove excess space |
| Uniform padding | High | Low | ⬜ Todo | Configurable % |
| Center subject | Medium | Medium | ⬜ Todo | In frame |
| Aspect ratio enforcement | Medium | Medium | ⬜ Todo | Force 1:1, etc. |

### 5.3 AI Alt Text (Optional)
| Task | Priority | Complexity | Status | Notes |
|------|----------|------------|--------|-------|
| Vision AI integration | Medium | High | ⬜ Todo | GPT-4V, Claude, etc. |
| Context-aware generation | Medium | Medium | ⬜ Todo | Product + image |
| Review/edit UI | Medium | Medium | ⬜ Todo | Before applying |
| Bulk generation | Low | Medium | ⬜ Todo | All missing alt text |

### 5.4 Usage Metering
| Task | Priority | Complexity | Status | Notes |
|------|----------|------------|--------|-------|
| AI operation tracking | High | Low | ⬜ Todo | Count bg removal calls |
| Usage limits per tier | High | Medium | ⬜ Todo | Free vs Pro vs Business |
| Overage handling | Medium | Medium | ⬜ Todo | Block or charge |
| Usage dashboard | Medium | Low | ⬜ Todo | Show remaining |

### Phase 5 Deliverables
- [ ] Background removal working
- [ ] Visual normalization pipeline
- [ ] Usage tracking in place
- [ ] (Optional) AI alt text generation

---

## Phase 6: Polish, Testing & Launch (3 weeks)
**Target**: July 2026  
**Status**: ⬜ Not Started

### 6.1 Quality Assurance
| Task | Priority | Complexity | Status | Notes |
|------|----------|------------|--------|-------|
| Unit tests for backend | High | Medium | ⬜ Todo | 80%+ coverage |
| E2E tests with Playwright | High | High | ⬜ Todo | Critical flows |
| OAuth flow testing | High | Medium | ⬜ Todo | Various scenarios |
| Load testing | Medium | Medium | ⬜ Todo | Rate limit handling |
| Security audit | High | Medium | ⬜ Todo | Token handling |

### 6.2 Documentation
| Task | Priority | Complexity | Status | Notes |
|------|----------|------------|--------|-------|
| User guide | High | Medium | ⬜ Todo | How to use features |
| API documentation | Medium | Low | ⬜ Todo | For developers |
| Video tutorials | Medium | Medium | ⬜ Todo | Key workflows |
| FAQ page | Low | Low | ⬜ Todo | Common questions |

### 6.3 UI Polish
| Task | Priority | Complexity | Status | Notes |
|------|----------|------------|--------|-------|
| Responsive design review | High | Medium | ⬜ Todo | Mobile/tablet |
| Loading states | High | Low | ⬜ Todo | Skeleton loaders |
| Error messages | High | Low | ⬜ Todo | Clear, actionable |
| Accessibility audit | Medium | Medium | ⬜ Todo | WCAG 2.1 |
| Dark mode review | Medium | Low | ⬜ Todo | All new components |

### 6.4 Launch Preparation
| Task | Priority | Complexity | Status | Notes |
|------|----------|------------|--------|-------|
| Shopify App Store listing | High | Medium | ⬜ Todo | Screenshots, copy |
| Pricing page | High | Medium | ⬜ Todo | Integration with subs |
| Production deployment | High | Medium | ⬜ Todo | Final deploy |
| Monitoring setup | High | Medium | ⬜ Todo | Alerts, logging |
| Launch announcement | Medium | Low | ⬜ Todo | Blog, social |

### 6.5 Platform Integration Final
| Task | Priority | Complexity | Status | Notes |
|------|----------|------------|--------|-------|
| Admin panel: Shopify metrics | High | Medium | ⬜ Todo | Add to /admin/dashboard |
| Admin: Connected stores list | Medium | Low | ⬜ Todo | View all connections |
| Admin: Upload job monitoring | Medium | Medium | ⬜ Todo | Failed jobs, alerts |
| Pricing page: Shopify features | High | Low | ⬜ Todo | Update tier comparison |
| Landing page: Shopify section | Medium | Medium | ⬜ Todo | Feature highlight |

### Phase 6 Deliverables
- [ ] All tests passing
- [ ] Documentation complete
- [ ] App Store listing ready
- [ ] Production deployed
- [ ] Monitoring active
- [ ] Admin panel fully integrated

---

## Integration Checklist (fawadhs-tools)

Before launch, verify all platform integrations:

### Backend Integration
- [ ] Shopify module follows existing module pattern
- [ ] Prisma models added to existing schema
- [ ] Routes registered in app.ts
- [ ] Auth middleware reused
- [ ] Usage logging integrated with existing UsageLog
- [ ] Rate limiting configured

### Frontend Integration
- [ ] Shopify tab in Image Tools page
- [ ] Uses existing auth state (useAuthStore)
- [ ] Uses existing API client
- [ ] Respects subscription tier limits
- [ ] Dark mode compatible

### Dashboard Integration
- [ ] Shopify connections widget
- [ ] Upload statistics card
- [ ] Quick actions to Image Tools

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
| Rate limit issues | Medium | Medium | Implement backoff, queue management |
| AI service costs | Medium | Medium | Set usage limits, monitor spend |
| OAuth token expiry | Low | Medium | Refresh token handling |
| Large file handling | Medium | Low | Chunked uploads, client processing |

---

## Resource Requirements

### Development
- **Frontend**: React/TypeScript developer (existing expertise)
- **Backend**: Node.js/Fastify developer (existing expertise)
- **DevOps**: Deployment, monitoring (1-2 days/phase)

### External Services
- **Shopify Partner**: Free tier sufficient for development
- **AI Background Removal**: ~$0.05-0.20 per image
- **Redis**: Existing infrastructure
- **PostgreSQL**: Existing infrastructure

### Infrastructure
- **Backend Server**: Existing CPX11 (may need upgrade for AI processing)
- **Storage**: Temporary staging only (images not stored long-term)

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Connected Stores | 100 in first month | Database count |
| Images Uploaded | 10,000 in first month | Job tracking |
| Conversion Rate | 10% free → paid | Subscription data |
| User Satisfaction | 4.5+ rating | Shopify App Store |
| Error Rate | <1% | Monitoring |

---

## Post-Launch Roadmap (v3.1+)

### Q3 2026
- Theme asset optimization
- Webhook-based auto-optimization
- Multiple store management

### Q4 2026
- Marketplace compliance modes (Amazon, Google Shopping)
- Advanced automation rules
- White-label option

### 2027
- API access for developers
- Shopify Flow integration
- Multi-language alt text

---

**Document Version**: 1.0.0  
**Last Updated**: January 21, 2026  
**Author**: Image Tools Team
