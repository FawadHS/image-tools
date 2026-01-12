# Tools Platform v3.0 Specification
**Product:** tools.fawadhs.dev  
**Version:** 3.0.0  
**Status:** Planning  
**Date:** January 12, 2026

## Executive Summary
Transform the standalone Image Tools application into a comprehensive **Multi-Tool Platform** with user authentication, subscription management, and support for multiple productivity tools. The platform will maintain the current free image converter while adding premium tools behind a subscription paywall.

---

## Vision & Goals

### Primary Objectives
1. **Multi-Tool Architecture**: Scalable framework supporting unlimited tool additions
2. **Freemium Model**: Free image tools + Premium subscription tools
3. **User Management**: Complete auth system with user profiles
4. **Monetization**: Stripe-powered subscription management
5. **Privacy-First**: Maintain zero-server-processing for sensitive operations

### Success Metrics
- User registration rate: 15% of visitors
- Free-to-paid conversion: 5% within 30 days
- Premium subscriber retention: >85% monthly
- Tool usage: Average 2+ tools per premium user

---

## Architecture Overview

### System Architecture

```
tools.fawadhs.dev/
├── / (Landing Page)
│   ├── Hero with tool showcase
│   ├── Pricing tiers
│   └── Feature comparison
│
├── /auth/
│   ├── /register
│   ├── /login
│   ├── /forgot-password
│   ├── /reset-password
│   └── /verify-email
│
├── /dashboard (Protected - Authenticated Users)
│   ├── User profile
│   ├── Subscription status
│   ├── Usage statistics
│   └── Tool access grid
│
├── /tools/
│   ├── /image-converter (FREE)
│   └── /[tool-name] (PREMIUM - To be determined)
│
└── /account/
    ├── /settings
    ├── /billing
    └── /subscription
```

### Technology Stack

#### Frontend (Existing)
- **Framework**: React 18 + TypeScript
- **Routing**: React Router v6 (upgrade from current)
- **Styling**: Tailwind CSS
- **State Management**: React Context + Zustand (new)
- **Forms**: React Hook Form + Zod validation

#### Backend (NEW)
- **Runtime**: Node.js 20+ / Bun
- **Framework**: Express.js or Fastify
- **Database**: PostgreSQL 15+ (Supabase recommended)
- **ORM**: Prisma
- **Auth**: Supabase Auth or Auth.js (NextAuth)
- **Payments**: Stripe
- **Email**: Resend or SendGrid
- **Storage**: Cloudflare R2 (for user files if needed)

#### Infrastructure
- **Frontend**: Cloudflare Pages (current)
- **Backend API**: Cloudflare Workers or Vercel
- **Database**: Supabase (Postgres + Auth + Storage)
- **CDN**: Cloudflare
- **Monitoring**: Sentry + Plausible Analytics

---

## User Authentication System

### Authentication Flow

#### 1. Registration
```typescript
POST /api/auth/register
{
  name: string;
  email: string;
  password: string; // min 8 chars, 1 uppercase, 1 number
}

Response:
{
  user: { id, email, name, createdAt },
  message: "Verification email sent"
}
```

**Features:**
- Email verification required
- Password strength validation
- Google OAuth (optional social login)
- GitHub OAuth (optional social login)
- CAPTCHA protection (Cloudflare Turnstile)

#### 2. Login
```typescript
POST /api/auth/login
{
  email: string;
  password: string;
}

Response:
{
  user: { id, email, name, subscription },
  accessToken: string;
  refreshToken: string;
}
```

**Features:**
- JWT-based authentication
- Refresh token rotation
- Remember me option (30-day session)
- Rate limiting (5 attempts per 15 min)

#### 3. Password Reset
```typescript
POST /api/auth/forgot-password
{ email: string }

POST /api/auth/reset-password
{
  token: string;
  newPassword: string;
}
```

**Features:**
- Time-limited reset tokens (1 hour)
- Secure token generation
- Email notification on password change

#### 4. Email Verification
```typescript
GET /api/auth/verify-email?token={token}

Response: Redirect to /dashboard with success message
```

### Session Management
- **Access Token**: JWT, 15-minute expiry
- **Refresh Token**: 30-day expiry, stored in httpOnly cookie
- **Token Storage**: localStorage (access) + httpOnly cookie (refresh)
- **Auto-refresh**: Silent refresh before token expiry

---

## Subscription Tiers

### Free Tier
**Price:** $0/month

**Features:**
- ✅ Image Converter (unlimited)
  - All formats (HEIC, JPEG, PNG, WebP, AVIF)
  - Batch processing (up to 50 files)
  - Quality control
  - Resize & crop
  - Filters & text overlay
- ✅ Conversion history (browser storage)
- ✅ Community support
- ❌ No cloud storage
- ❌ No API access

**Limits:**
- Max file size: 50MB
- Batch limit: 50 files per conversion
- No user account required (but can register for dashboard)

### Pro Tier
**Price:** $9/month or $90/year (save 16%)

**Features:**
- ✅ Everything in Free
- ✅ **Premium Tools** (to be announced)
  - Multiple productivity tools
  - Advanced processing capabilities
  - Enhanced features beyond free tier
- ✅ **Cloud Storage**: 10GB
- ✅ **Priority Support**
- ✅ **No Ads**

**Limits:**
- Max file size: 500MB
- Batch limit: 200 files

### Business Tier
**Price:** $29/month or $290/year (save 17%)

**Features:**
- ✅ Everything in Pro
- ✅ **API Access**
  - 10,000 requests/month
  - Webhook support
  - SDK (Node.js, Python, PHP)
- ✅ **Advanced Tools**
  - Background removal
  - AI image upscaling
  - Document OCR
  - Watermark removal
- ✅ **Cloud Storage**: 100GB
- ✅ **Team Collaboration**: Up to 5 users
- ✅ **White-label options**
- ✅ **Priority email support**
- ✅ **Custom branding**

**Limits:**
- Max file size: 2GB
- Batch limit: 1000 files
- API: 10K requests/month

### Enterprise Tier
**Price:** Custom (starting at $99/month)

**Features:**
- ✅ Everything in Business
- ✅ **Unlimited API requests**
- ✅ **Dedicated server**
- ✅ **Custom integrations**
- ✅ **Unlimited storage**
- ✅ **Unlimited team members**
- ✅ **SLA guarantee (99.9% uptime)**
- ✅ **Priority phone support**
- ✅ **Custom development**

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP,
  avatar_url TEXT,
  subscription_tier VARCHAR(50) DEFAULT 'free',
  subscription_status VARCHAR(50) DEFAULT 'inactive',
  stripe_customer_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe ON users(stripe_customer_id);
```

### Subscriptions Table
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_price_id VARCHAR(255) NOT NULL,
  tier VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL, -- active, canceled, past_due, trialing
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
```

### Usage Tracking Table
```sql
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tool_name VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL, -- convert, compress, merge, etc.
  file_count INTEGER DEFAULT 1,
  input_size BIGINT, -- bytes
  output_size BIGINT, -- bytes
  processing_time INTEGER, -- milliseconds
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_usage_user ON usage_logs(user_id);
CREATE INDEX idx_usage_created ON usage_logs(created_at);
CREATE INDEX idx_usage_tool ON usage_logs(tool_name);
```

### API Keys Table (Business/Enterprise)
```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  key_prefix VARCHAR(20) NOT NULL, -- First 8 chars for display
  permissions JSONB DEFAULT '[]', -- Array of allowed operations
  rate_limit INTEGER DEFAULT 1000, -- Requests per hour
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
```

### Email Verification Tokens
```sql
CREATE TABLE verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL, -- email_verify, password_reset
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tokens_token ON verification_tokens(token);
CREATE INDEX idx_tokens_user ON verification_tokens(user_id);
```

---

## API Structure

### Base URL
- **Production**: `https://api.tools.fawadhs.dev`
- **Development**: `http://localhost:3000`

### Authentication Endpoints
```
POST   /api/auth/register          # Create new account
POST   /api/auth/login             # Login with credentials
POST   /api/auth/logout            # Logout and invalidate token
POST   /api/auth/refresh           # Refresh access token
POST   /api/auth/forgot-password   # Request password reset
POST   /api/auth/reset-password    # Reset password with token
GET    /api/auth/verify-email      # Verify email with token
POST   /api/auth/resend-verification # Resend verification email
```

### User Endpoints
```
GET    /api/user/profile           # Get user profile
PUT    /api/user/profile           # Update profile
GET    /api/user/subscription      # Get subscription details
GET    /api/user/usage             # Get usage statistics
DELETE /api/user/account           # Delete account
```

### Subscription Endpoints
```
POST   /api/subscription/create-checkout   # Create Stripe checkout
POST   /api/subscription/create-portal     # Create customer portal
GET    /api/subscription/status            # Get subscription status
POST   /api/subscription/upgrade           # Upgrade plan
POST   /api/subscription/cancel            # Cancel subscription
POST   /api/subscription/resume            # Resume canceled subscription
```

### Tool Endpoints (Generic Example)
```
POST   /api/tools/[tool-name]/[action]   # Tool-specific actions
GET    /api/tools/[tool-name]/status      # Check processing status
GET    /api/tools/available               # List available tools
```

### API Key Endpoints (Business+)
```
GET    /api/api-keys               # List API keys
POST   /api/api-keys               # Create API key
DELETE /api/api-keys/:id           # Revoke API key
PUT    /api/api-keys/:id           # Update API key
```

---

## Frontend Structure Reorganization

### New Directory Structure
```
src/
├── main.tsx
├── App.tsx
├── routes/
│   ├── index.tsx                    # Route configuration
│   ├── ProtectedRoute.tsx           # Auth guard
│   └── SubscriptionRoute.tsx        # Subscription guard
│
├── pages/
│   ├── landing/
│   │   ├── LandingPage.tsx          # New landing page
│   │   ├── PricingSection.tsx
│   │   └── ToolShowcase.tsx
│   │
│   ├── auth/
│   │   ├── LoginPage.tsx            # NEW
│   │   ├── RegisterPage.tsx         # NEW
│   │   ├── ForgotPasswordPage.tsx   # NEW
│   │   ├── ResetPasswordPage.tsx    # NEW
│   │   └── VerifyEmailPage.tsx      # NEW
│   │
│   ├── dashboard/
│   │   ├── DashboardPage.tsx        # NEW - User dashboard
│   │   ├── SubscriptionPage.tsx     # NEW - Manage subscription
│   │   ├── UsageStatsPage.tsx       # NEW - Usage analytics
│   │   └── SettingsPage.tsx         # NEW - Account settings
│   │
│   └── tools/
│       ├── ImageToolsPage.tsx       # EXISTING (refactored)
│       └── [PremiumToolPages]       # NEW - To be developed
│
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx               # Updated with auth menu
│   │   ├── Footer.tsx               # EXISTING
│   │   └── Sidebar.tsx              # NEW - Dashboard sidebar
│   │
│   ├── auth/
│   │   ├── LoginForm.tsx            # NEW
│   │   ├── RegisterForm.tsx         # NEW
│   │   ├── SocialLogin.tsx          # NEW - OAuth buttons
│   │   └── PasswordStrength.tsx     # NEW
│   │
│   ├── subscription/
│   │   ├── PricingCard.tsx          # NEW
│   │   ├── SubscriptionBadge.tsx    # NEW
│   │   ├── UpgradePrompt.tsx        # NEW
│   │   └── PaymentMethodCard.tsx    # NEW
│   │
│   └── tools/
│       ├── image/                   # EXISTING components
│       └── shared/                  # Shared tool components
│
├── contexts/
│   ├── AuthContext.tsx              # NEW - Auth state management
│   ├── SubscriptionContext.tsx      # NEW - Subscription state
│   ├── ConverterContext.tsx         # EXISTING
│   └── ThemeContext.tsx             # EXISTING
│
├── hooks/
│   ├── useAuth.ts                   # NEW - Auth operations
│   ├── useSubscription.ts           # NEW - Subscription operations
│   ├── useUser.ts                   # NEW - User data
│   ├── useImageConverter.ts         # EXISTING
│   └── useApiClient.ts              # NEW - API client wrapper
│
├── lib/
│   ├── api/
│   │   ├── client.ts                # NEW - Axios/Fetch wrapper
│   │   ├── auth.ts                  # NEW - Auth API calls
│   │   ├── subscription.ts          # NEW - Subscription API
│   │   └── tools.ts                 # NEW - Tool API calls
│   │
│   ├── stripe/
│   │   ├── client.ts                # NEW - Stripe client
│   │   └── checkout.ts              # NEW - Checkout helpers
│   │
│   └── validation/
│       ├── auth.schemas.ts          # NEW - Zod schemas
│       └── user.schemas.ts          # NEW
│
├── utils/
│   ├── auth.ts                      # NEW - Auth helpers
│   ├── storage.ts                   # NEW - Token storage
│   ├── permissions.ts               # NEW - Permission checks
│   └── ...existing utils
│
└── types/
    ├── auth.types.ts                # NEW
    ├── subscription.types.ts        # NEW
    ├── user.types.ts                # NEW
    └── ...existing types
```

---

## Stripe Integration

### Products & Prices Setup

#### Stripe Products
1. **Pro Monthly**: `prod_pro_monthly`
   - Price: $9/month
   - Billing: Monthly recurring
   - Trial: 7 days free

2. **Pro Yearly**: `prod_pro_yearly`
   - Price: $90/year
   - Billing: Annual recurring
   - Save: 16%

3. **Business Monthly**: `prod_business_monthly`
   - Price: $29/month
   - Billing: Monthly recurring

4. **Business Yearly**: `prod_business_yearly`
   - Price: $290/year
   - Billing: Annual recurring
   - Save: 17%

### Webhook Events
```typescript
// Handle Stripe webhooks
POST /api/webhooks/stripe

Events to handle:
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.paid
- invoice.payment_failed
- checkout.session.completed
- customer.subscription.trial_will_end
```

### Checkout Flow
1. User clicks "Upgrade to Pro"
2. Frontend calls `/api/subscription/create-checkout`
3. Backend creates Stripe Checkout Session
4. Redirect to Stripe hosted checkout
5. On success, Stripe webhook updates database
6. User redirected to dashboard with active subscription

---

## Security Considerations

### Authentication Security
- **Password Hashing**: bcrypt with 12 rounds
- **JWT Signing**: HS256 with strong secret (min 256 bits)
- **Token Expiry**: Short-lived access tokens (15 min)
- **Refresh Tokens**: Rotation on each use
- **Rate Limiting**: Per endpoint and per user
- **CORS**: Strict origin whitelist
- **CSRF Protection**: Double-submit cookie pattern

### Data Privacy
- **GDPR Compliance**: Data export, deletion, consent
- **Encryption at Rest**: Database encryption
- **Encryption in Transit**: TLS 1.3
- **PII Handling**: Minimal storage, anonymization
- **Audit Logs**: Track sensitive operations

### Payment Security
- **PCI Compliance**: No card data storage (Stripe handles)
- **Webhook Validation**: Verify Stripe signatures
- **Idempotency**: Prevent duplicate charges
- **Secure Redirect**: HTTPS only, no referrer leaking

---

## Migration Path (v2 → v3)

### Phase 1: Backend Setup (Week 1-2)
- [ ] Set up Supabase project
- [ ] Create database schema
- [ ] Set up authentication endpoints
- [ ] Implement JWT auth flow
- [ ] Add email service (Resend)
- [ ] Deploy API to Cloudflare Workers

### Phase 2: Frontend Auth (Week 3-4)
- [ ] Create AuthContext and hooks
- [ ] Build login/register pages
- [ ] Implement password reset flow
- [ ] Add email verification
- [ ] Create protected routes
- [ ] Build user dashboard

### Phase 3: Subscription System (Week 5-6)
- [ ] Set up Stripe account
- [ ] Create products and prices
- [ ] Implement checkout flow
- [ ] Build webhook handler
- [ ] Create subscription management UI
- [ ] Add usage tracking

### Phase 4: Premium Tools (Week 7-10)
- [ ] Design tool architecture framework
- [ ] Define premium tool requirements
- [ ] Build first premium tool (TBD)
- [ ] Add subscription gates
- [ ] Implement usage limits
- [ ] Create tool template for future additions

### Phase 5: Polish & Launch (Week 11-12)
- [ ] Update landing page
- [ ] Add onboarding flow
- [ ] Write documentation
- [ ] Set up monitoring
- [ ] Performance optimization
- [ ] Beta testing
- [ ] Public launch

### Backward Compatibility
- ✅ Image tools remain 100% free
- ✅ No breaking changes to existing features
- ✅ Anonymous usage still allowed for free tier
- ✅ Existing npm package unaffected
- ✅ Browser storage preserved

---

## Performance Targets

### Frontend
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.0s
- **Bundle Size**: < 500KB (gzipped)
- **Core Web Vitals**: All "Good" ratings

### Backend API
- **Response Time (p95)**: < 200ms
- **Response Time (p99)**: < 500ms
- **Throughput**: 1000 req/s per instance
- **Uptime**: 99.9% SLA

### Database
- **Query Time (p95)**: < 50ms
- **Connection Pool**: 20-100 connections
- **Replication**: Multi-region read replicas

---

## Monitoring & Analytics

### Application Monitoring
- **Error Tracking**: Sentry
- **Performance**: Web Vitals + Custom metrics
- **Uptime**: Pingdom/UptimeRobot
- **Logs**: Cloudflare Logs + structured logging

### Business Metrics
- **User Analytics**: Plausible Analytics
- **Conversion Tracking**: Custom events
- **Subscription Metrics**: Stripe Dashboard + Custom
- **Revenue Tracking**: MRR, ARR, churn rate

### Key Dashboards
1. **User Growth**: Registrations, MAU, retention
2. **Revenue**: MRR, ARR, LTV, churn
3. **Product Usage**: Tool usage by tier
4. **Performance**: API latency, error rates
5. **Support**: Ticket volume, response time

---

## Open Questions & Decisions Needed

### Technical Decisions
- [ ] Use Supabase or custom auth + Postgres?
- [ ] Cloudflare Workers or Vercel for API?
- [ ] Monorepo or separate repos for frontend/backend?
- [ ] Progressive Web App (PWA) support?
- [ ] Mobile app in future roadmap?

### Business Decisions
- [ ] Free trial duration (7 days vs 14 days)?
- [ ] Annual discount percentage (current: 16-17%)?
- [ ] Grace period for failed payments?
- [ ] Refund policy?
- [ ] Enterprise pricing strategy?

### Feature Prioritization
- [ ] Which premium tools to develop? (Research user needs)
- [ ] What should be the first premium tool?
- [ ] API access in Pro tier or Business only?
- [ ] Team collaboration features scope?
- [ ] White-label options details?

---

## Success Criteria

### Launch Readiness
- [ ] All auth flows working (register, login, reset)
- [ ] Stripe checkout functional
- [ ] At least 2 premium tools available
- [ ] Dashboard fully functional
- [ ] Email notifications working
- [ ] Mobile responsive
- [ ] Security audit passed
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] Legal pages (ToS, Privacy) updated

### Post-Launch Goals (30 days)
- 500+ registered users
- 25+ paying subscribers ($200+ MRR)
- 5% free-to-paid conversion
- <2% subscription churn
- >4.5 star average rating
- <1% error rate
- >99% uptime

---

## Next Steps

1. **Review & Approval**: Team review of this spec
2. **Technical Design**: Detailed API and database design docs
3. **Project Setup**: Initialize backend repo, set up Supabase
4. **Sprint Planning**: Break down into 2-week sprints
5. **Begin Phase 1**: Backend authentication system

---

## Appendix

### Related Documents
- [Current v2.6 Spec](./SPEC-V2.md)
- [Architecture Decision Records](../02-architecture/)
- [API Documentation](./API-DOCS.md) *(to be created)*
- [Stripe Integration Guide](./STRIPE-SETUP.md) *(to be created)*

### External References
- [Stripe Documentation](https://stripe.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [React Router v6](https://reactrouter.com)
- [Zod Validation](https://zod.dev)

---

**Document Version:** 1.0  
**Last Updated:** January 12, 2026  
**Author:** Fawad Hussain Syed  
**Status:** Draft - Pending Review
