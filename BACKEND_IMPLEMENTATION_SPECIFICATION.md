# Medipost AI — MVP Backend Implementation Specification

**Document Version:** 1.0  
**Date:** June 2025  
**Status:** Ready for Development  
**Project:** Healthcare Content Generation Platform  

---

## TABLE OF CONTENTS

1. [MVP Features](#section-1--mvp-features)
2. [Final Tech Stack](#section-2--final-tech-stack)
3. [Database Design](#section-3--database-design)
4. [Storage Requirements](#section-4--storage-requirements)
5. [API Endpoint Design](#section-5--api-endpoint-design)
6. [AI Integration](#section-6--ai-integration)
7. [Authentication Flow](#section-7--authentication-flow)
8. [MVP Development Order](#section-8--mvp-development-order)
9. [Future Features (Phase 2)](#section-9--future-features-phase-2)
10. [Deployment & Infrastructure](#section-10--deployment--infrastructure)

---

# SECTION 1 — MVP FEATURES

## Overview
Medipost AI MVP will enable healthcare professionals to generate, manage, and track medical content with subscription-based usage limits and comprehensive brand customization.

## Feature Breakdown

### 1.1 User Authentication & Authorization
**Purpose:** Secure user access with email-based registration and login.

**Scope:**
- User registration with email validation
- Password-based login with session/JWT tokens
- Forgot password & reset email flow
- Profile management (name, specialty, clinic details)
- Role-based access control (User vs. Admin)
- Account deletion (GDPR compliance)

**Expected Behavior:**
- Users can register with email & password
- Email verification link sent (optional MVP feature: can use auto-verify)
- Login returns authentication token valid for 30 days
- Password hashing with bcrypt (min 10 rounds)
- Session timeout after 24 hours inactivity
- Support for "remember me" with refresh tokens

---

### 1.2 Admin Authentication
**Purpose:** Separate admin-only dashboard access.

**Scope:**
- Admin login with email/password
- Protected admin endpoints requiring admin role
- Admin audit logging

**Expected Behavior:**
- Admins login via dedicated `/admin/login` endpoint
- Only users with `role: 'admin'` can access admin endpoints
- All admin actions logged with timestamp and actor ID
- Session timeout: 12 hours for admins

---

### 1.3 Brand Kit Storage
**Purpose:** Store healthcare professional's clinic/practice branding.

**Scope:**
- Clinic name, doctor name, specialty
- Contact info (phone, website, address)
- Brand colors (primary & secondary)
- Image uploads: clinic logo, doctor photo, clinic photo, cover image, team photo
- Retrieval & updates

**Expected Behavior:**
- Users can upload and update brand kit anytime
- Images stored in blob storage with URL references
- Brand kit applied to all generated content automatically
- Multiple brand kits support for larger clinics (future: Phase 2)
- Validation: phone format, URL format, color hex validation

---

### 1.4 Content Generation
**Purpose:** AI-powered content generation for healthcare professionals.

**Scope:**
- Text-based content generation (Instagram posts, blogs, patient education)
- Image generation with brand kit elements
- Support for multiple content types:
  - Instagram Posts (captions + visual suggestions)
  - Patient Education Articles
  - Blog Articles
  - Story Scripts
  - Reel Scripts
  - Awareness Campaigns
  - Festive Wishes

**Expected Behavior:**
- Generation request includes: type, specialty, tone, topic, audience, additional context
- Gemini API integration for text generation
- Stable Diffusion API for image generation (or alternative)
- Response includes: generated text, image URLs, content metadata
- Generation count deducted from user's monthly quota
- Failed generations don't consume quota
- Response time: <5 seconds for text, <15 seconds for images

---

### 1.5 Content History & Search
**Purpose:** Store and retrieve all user-generated content.

**Scope:**
- Store all generated content with timestamps
- Search by title, content, type
- Filter by date range (last 7 days, 30 days, custom)
- Filter by content type
- Pagination (20 items per page)
- Soft delete (don't permanently remove)

**Expected Behavior:**
- Every generation automatically saved
- Full-text search across title & body
- Chronological ordering with newest first
- Users only see their own content
- Content remains available for 1 year after deletion

---

### 1.6 Subscription Plans & Management
**Purpose:** Enforce usage limits and manage monetization.

**Scope:**
- Three tiers: Starter (50/month), Pro (300/month), Clinic (Unlimited)
- Automatic quota reset on monthly cycle
- Plan upgrades and downgrades
- Payment integration (future: Phase 2)
- Free trial (7 days, all features)

**Expected Behavior:**
- User starts on free trial (30 generations / 7 days)
- Default plan: Starter if trial expires without selection
- Quota checked before each generation
- Out-of-quota: return 429 error with remaining days info
- Plan change effective immediately (prorated for mid-month changes)

---

### 1.7 Usage Tracking & Analytics
**Purpose:** Monitor user behavior and system health.

**Scope:**
- Track generations (count, type, timestamp, success/failure)
- Track quota usage per user
- Track AI API costs
- Track errors and failures
- User engagement metrics

**Expected Behavior:**
- Usage logged in real-time
- Endpoint: `/user/usage-stats` returns current month quota & remaining
- Admin can see system-wide metrics
- Monthly reports sent to users

---

### 1.8 Dashboard Analytics (Admin)
**Purpose:** Platform-wide insights for admins.

**Scope:**
- Total users, active subscriptions, total content generated
- User growth metrics
- Revenue metrics (future: Phase 2)
- Top specialties, content types
- System performance metrics

**Expected Behavior:**
- Admin dashboard shows real-time metrics
- Date range filtering (7 days, 30 days, custom)
- Export reports as CSV/PDF (future: Phase 2)

---

# SECTION 2 — FINAL TECH STACK

## Evaluation Matrix

| Criterion | CodeIgniter 4 + MySQL | Supabase | Winner |
|-----------|----------------------|----------|---------|
| **Development Speed** | Medium (setup, migrations, scaffolding required) | Fast (instant auth, DB, storage) | **Supabase** ✓ |
| **Complexity** | Low (straightforward framework) | Very Low (managed service) | **Supabase** ✓ |
| **Scalability** | Good (with optimization) | Excellent (auto-scaling) | **Supabase** ✓ |
| **Maintenance** | High (server management, updates) | Low (fully managed) | **Supabase** ✓ |
| **MVP Suitability** | ✓ Good | ✓✓ Excellent | **Supabase** ✓ |
| **Cost** | Low (shared hosting) | Low ($25-50/month for MVP) | Comparable |
| **Learning Curve** | Medium | Low | **Supabase** ✓ |
| **Vendor Lock-in** | None | Moderate | CodeIgniter |
| **Real-time Features** | Possible (websockets) | Built-in | **Supabase** ✓ |
| **Built-in Auth** | Manual implementation | Yes | **Supabase** ✓ |
| **Production Readiness** | ✓ Production-ready | ✓✓ Production-ready | **Supabase** ✓ |

## Recommendation: **SUPABASE** ✓

### Why Supabase for MVP?

1. **Speed to Market:** Built-in authentication, PostgreSQL database, storage, and real-time subscriptions eliminate boilerplate. MVP can launch in 2-3 weeks vs. 4-6 weeks with CodeIgniter.

2. **Cost Efficiency:** Pay-as-you-go pricing. MVP scales from free tier ($0) → Pro ($25/month) → Enterprise as user base grows.

3. **Operational Simplicity:** No server management, automatic backups, managed scaling. Focus on feature development, not DevOps.

4. **Feature-Complete:** All MVP features (auth, DB, storage, real-time) available out-of-box without external libraries.

5. **Developer Experience:** PostgreSQL + REST/GraphQL APIs + TypeScript SDKs = familiar, modern stack.

6. **Flexibility:** Can migrate away anytime (PostgreSQL export, REST API standard). Not truly locked in.

### Supabase Tech Stack for Medipost AI MVP

```
Frontend (Existing):
├── React 19 + TypeScript
├── Vite (build tool)
├── TanStack Router (routing)
├── TanStack Query (data fetching)
└── Tailwind CSS + Radix UI (styling)

Backend:
├── Supabase (Auth, PostgreSQL DB, Storage, Real-time)
├── Node.js/Express (lightweight API layer, optional)
├── Gemini API (text generation)
├── Stable Diffusion API (image generation)
└── Supabase Storage (image storage)

Deployment:
├── Frontend: Vercel / Netlify (free tier)
├── Backend: Supabase (managed) + optional Node layer on Railway/Fly.io
└── Database: Supabase PostgreSQL (managed)
```

---

# SECTION 3 — DATABASE DESIGN

## Entity-Relationship Overview

```
Users
├── Brand Kits (1:1)
├── Generated Content (1:N)
├── Usage Logs (1:N)
├── Subscriptions (1:N)
└── Saved Content (1:N)

Admins
└── Audit Logs (1:N)

Subscription Plans (Master data)
└── Subscriptions (1:N)

Generated Content
├── Images (1:N)
└── Content History (1:N for versions)
```

## Database Tables

### 1. `users`
**Purpose:** Core user accounts  
**Primary Key:** `id` (UUID)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | User email |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt hash |
| `first_name` | VARCHAR(100) | NOT NULL | User's first name |
| `last_name` | VARCHAR(100) | NOT NULL | User's last name |
| `role` | ENUM | DEFAULT 'user' | 'user' or 'admin' |
| `status` | ENUM | DEFAULT 'active' | 'active', 'inactive', 'suspended' |
| `email_verified` | BOOLEAN | DEFAULT false | Email verification status |
| `email_verified_at` | TIMESTAMP | NULLABLE | Verification timestamp |
| `phone` | VARCHAR(20) | NULLABLE | User phone |
| `specialty` | VARCHAR(100) | NULLABLE | Medical specialty |
| `profile_complete` | BOOLEAN | DEFAULT false | Onboarding status |
| `last_login_at` | TIMESTAMP | NULLABLE | Last login timestamp |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Account creation time |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update time |
| `deleted_at` | TIMESTAMP | NULLABLE | Soft delete timestamp |

**Indexes:**
- `email` (UNIQUE)
- `role`
- `status`
- `created_at`

---

### 2. `brand_kits`
**Purpose:** Store user's clinic/practice branding  
**Primary Key:** `id` (UUID)  
**Foreign Key:** `user_id` → `users.id`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `user_id` | UUID | FK NOT NULL | Owner user |
| `clinic_name` | VARCHAR(255) | NOT NULL | Clinic/practice name |
| `doctor_name` | VARCHAR(255) | NOT NULL | Doctor's name |
| `specialty` | VARCHAR(100) | NOT NULL | Medical specialty |
| `phone` | VARCHAR(20) | NOT NULL | Contact phone |
| `website` | VARCHAR(255) | NULLABLE | Clinic website URL |
| `address` | TEXT | NOT NULL | Full address |
| `primary_color` | VARCHAR(7) | NOT NULL | Hex color (e.g., #0E7C7B) |
| `secondary_color` | VARCHAR(7) | NOT NULL | Hex color |
| `logo_url` | VARCHAR(500) | NULLABLE | Clinic logo image URL |
| `doctor_photo_url` | VARCHAR(500) | NULLABLE | Doctor photo URL |
| `clinic_photo_url` | VARCHAR(500) | NULLABLE | Clinic photo URL |
| `cover_photo_url` | VARCHAR(500) | NULLABLE | Cover image URL |
| `team_photo_url` | VARCHAR(500) | NULLABLE | Team photo URL |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation time |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update time |

**Indexes:**
- `user_id` (UNIQUE)
- `clinic_name`

---

### 3. `subscription_plans`
**Purpose:** Master data for subscription tiers  
**Primary Key:** `id` (UUID)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `name` | VARCHAR(50) | UNIQUE NOT NULL | Plan name (Starter, Pro, Clinic) |
| `tier` | INT | NOT NULL | Tier level (0=trial, 1=starter, 2=pro, 3=clinic) |
| `monthly_quota` | INT | NOT NULL | Monthly generation limit (-1 for unlimited) |
| `price_inr` | DECIMAL(10,2) | NOT NULL | Monthly price in INR |
| `features` | JSON | NOT NULL | Array of feature strings |
| `max_team_members` | INT | DEFAULT 1 | Max doctors/team seats |
| `is_active` | BOOLEAN | DEFAULT true | Plan availability |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation time |

**Seed Data:**
```json
[
  {
    "name": "Trial",
    "tier": 0,
    "monthly_quota": 30,
    "price_inr": 0,
    "features": ["All content types", "Copy & save"],
    "duration_days": 7
  },
  {
    "name": "Starter",
    "tier": 1,
    "monthly_quota": 50,
    "price_inr": 499,
    "features": ["All content types", "Copy & save", "Email support"]
  },
  {
    "name": "Pro",
    "tier": 2,
    "monthly_quota": 300,
    "price_inr": 1999,
    "features": ["Everything in Starter", "Priority generation", "Content history", "Brand presets"]
  },
  {
    "name": "Clinic",
    "tier": 3,
    "monthly_quota": -1,
    "price_inr": 6999,
    "features": ["Everything in Pro", "Up to 10 seats", "Team library", "Success manager"],
    "max_team_members": 10
  }
]
```

---

### 4. `subscriptions`
**Purpose:** Track user subscriptions  
**Primary Key:** `id` (UUID)  
**Foreign Keys:** `user_id` → `users.id`, `plan_id` → `subscription_plans.id`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `user_id` | UUID | FK NOT NULL | Subscriber |
| `plan_id` | UUID | FK NOT NULL | Selected plan |
| `status` | ENUM | DEFAULT 'active' | 'trial', 'active', 'cancelled', 'expired' |
| `billing_cycle_start` | DATE | NOT NULL | Monthly cycle start |
| `billing_cycle_end` | DATE | NOT NULL | Monthly cycle end |
| `quota_used` | INT | DEFAULT 0 | Current month usage |
| `auto_renew` | BOOLEAN | DEFAULT false | Auto-renewal enabled |
| `started_at` | TIMESTAMP | DEFAULT NOW() | Subscription start |
| `cancelled_at` | TIMESTAMP | NULLABLE | Cancellation timestamp |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update |

**Indexes:**
- `user_id` (unique per active subscription)
- `status`
- `billing_cycle_start`

---

### 5. `generated_content`
**Purpose:** Store all user-generated content  
**Primary Key:** `id` (UUID)  
**Foreign Key:** `user_id` → `users.id`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `user_id` | UUID | FK NOT NULL | Content creator |
| `type` | VARCHAR(50) | NOT NULL | Type: 'instagram_post', 'blog_article', 'patient_education', 'story', 'reel', 'campaign', 'festive' |
| `category` | VARCHAR(50) | NULLABLE | Content category |
| `title` | VARCHAR(255) | NOT NULL | Content title |
| `body` | TEXT | NOT NULL | Generated content text |
| `metadata` | JSON | NOT NULL | `{specialty, tone, audience, topic, context, ...}` |
| `gemini_prompt` | TEXT | NULLABLE | Original prompt for regeneration |
| `status` | ENUM | DEFAULT 'published' | 'draft', 'published', 'archived' |
| `is_saved` | BOOLEAN | DEFAULT false | User saved/favorited |
| `copy_count` | INT | DEFAULT 0 | Times user copied this |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Generation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last edit |
| `deleted_at` | TIMESTAMP | NULLABLE | Soft delete |

**Indexes:**
- `user_id`
- `type`
- `created_at`
- `is_saved`
- Full-text search on `title` + `body`

---

### 6. `generated_images`
**Purpose:** Store generated images for content  
**Primary Key:** `id` (UUID)  
**Foreign Key:** `content_id` → `generated_content.id`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `content_id` | UUID | FK NOT NULL | Parent content |
| `image_url` | VARCHAR(500) | NOT NULL | CDN/storage URL |
| `prompt` | TEXT | NOT NULL | Stable Diffusion prompt |
| `model` | VARCHAR(50) | NOT NULL | Model used (e.g., 'stable-diffusion-3') |
| `seed` | BIGINT | NULLABLE | For reproducibility |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Generation time |

**Indexes:**
- `content_id`

---

### 7. `usage_logs`
**Purpose:** Granular tracking of usage for analytics  
**Primary Key:** `id` (UUID)  
**Foreign Key:** `user_id` → `users.id`, `content_id` → `generated_content.id`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `user_id` | UUID | FK NOT NULL | User who generated |
| `content_id` | UUID | FK NULLABLE | Associated content |
| `action` | VARCHAR(50) | NOT NULL | 'generate', 'regenerate', 'copy', 'delete', 'save' |
| `generation_type` | VARCHAR(50) | NULLABLE | Content type if action='generate' |
| `success` | BOOLEAN | DEFAULT true | Operation success |
| `error_message` | TEXT | NULLABLE | Error details if failed |
| `ai_api_used` | VARCHAR(50) | NULLABLE | 'gemini', 'stable-diffusion' |
| `cost_usd` | DECIMAL(8,4) | NULLABLE | API cost for this action |
| `duration_ms` | INT | NULLABLE | Operation duration in milliseconds |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Timestamp |

**Indexes:**
- `user_id`
- `created_at`
- `action`

---

### 8. `admin_audit_logs`
**Purpose:** Track all admin actions for compliance  
**Primary Key:** `id` (UUID)  
**Foreign Key:** `admin_id` → `users.id`, `target_user_id` → `users.id` (NULLABLE)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `admin_id` | UUID | FK NOT NULL | Admin who performed action |
| `action` | VARCHAR(100) | NOT NULL | 'user_suspended', 'plan_changed', 'quota_reset', etc. |
| `target_user_id` | UUID | FK NULLABLE | User affected by action |
| `details` | JSON | NOT NULL | Action-specific data |
| `ip_address` | VARCHAR(45) | NULLABLE | Admin's IP |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Action timestamp |

**Indexes:**
- `admin_id`
- `target_user_id`
- `created_at`

---

### 9. `password_reset_tokens`
**Purpose:** Forgot password flow  
**Primary Key:** `id` (UUID)  
**Foreign Key:** `user_id` → `users.id`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `user_id` | UUID | FK NOT NULL | User resetting password |
| `token` | VARCHAR(255) | UNIQUE NOT NULL | Reset token |
| `expires_at` | TIMESTAMP | NOT NULL | Token expiration (1 hour) |
| `used_at` | TIMESTAMP | NULLABLE | When token was used |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation time |

**Indexes:**
- `user_id`
- `token` (UNIQUE)
- `expires_at`

---

### 10. `email_verification_tokens`
**Purpose:** Email verification flow  
**Primary Key:** `id` (UUID)  
**Foreign Key:** `user_id` → `users.id`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `user_id` | UUID | FK NOT NULL | User verifying email |
| `token` | VARCHAR(255) | UNIQUE NOT NULL | Verification token |
| `expires_at` | TIMESTAMP | NOT NULL | Token expiration (24 hours) |
| `verified_at` | TIMESTAMP | NULLABLE | When email was verified |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation time |

**Indexes:**
- `user_id`
- `token` (UNIQUE)

---

## Database Constraints & Rules

1. **Cascade Deletes:**
   - User deletion → cascades to brand_kits, subscriptions, generated_content, usage_logs
   - Content deletion → cascades to generated_images

2. **Unique Constraints:**
   - Email per user (global unique)
   - One active subscription per user at a time
   - One brand kit per user

3. **Check Constraints:**
   - Primary/secondary colors valid hex format: `^#[0-9A-F]{6}$`
   - Quota used ≤ plan monthly quota (except unlimited plans)
   - Billing cycle start < billing cycle end

4. **Default Values & Triggers:**
   - `created_at` and `updated_at` auto-populated
   - `updated_at` auto-updated on any row modification
   - Soft deletes use `deleted_at` (never actually delete except admins)

---

## Data Retention Policies

| Table | Retention | Notes |
|-------|-----------|-------|
| `users` | Indefinite | Soft delete after account closure (GDPR: purge after 90 days) |
| `generated_content` | 1 year | After 1 year, mark as `deleted_at` |
| `usage_logs` | 2 years | For analytics & billing reconciliation |
| `admin_audit_logs` | 3 years | For compliance |
| `password_reset_tokens` | Immediate | Delete after use or expiration |

---

# SECTION 4 — STORAGE REQUIREMENTS

## File Types to Store

| File Type | Max Size | Format | CDN Required | Example |
|-----------|----------|--------|--------------|---------|
| Clinic Logo | 2 MB | PNG, JPG, WebP | Yes | clinic_logo.png |
| Doctor Photo | 3 MB | PNG, JPG, WebP | Yes | doctor_photo.jpg |
| Clinic Photo | 5 MB | PNG, JPG, WebP | Yes | clinic_photo.jpg |
| Cover Image | 5 MB | PNG, JPG, WebP | Yes | cover_image.jpg |
| Team Photo | 5 MB | PNG, JPG, WebP | Yes | team_photo.jpg |
| Generated Images (AI) | 2 MB | PNG | Yes | generated_20250621_abc123.png |

**Total Expected Storage:**
- Per user: ~15 MB (5 brand kit images + 10 generated images)
- 1,000 users: ~15 GB
- 10,000 users: ~150 GB

---

## Storage Architecture

### Option 1: Supabase Storage (Recommended for MVP)

```
Storage Bucket: medipost-ai-storage/
├── brand-kits/
│   └── {user_id}/
│       ├── logo.png
│       ├── doctor_photo.jpg
│       ├── clinic_photo.jpg
│       ├── cover_photo.jpg
│       └── team_photo.jpg
├── generated-images/
│   └── {user_id}/
│       ├── generated_20250621_abc123.png
│       ├── generated_20250621_def456.png
│       └── ...
└── admin-uploads/
    ├── plan-images/
    └── promotional/
```

**Features:**
- 50 GB storage included in Pro plan ($25/month)
- RLS (Row Level Security) for user isolation
- Auto CDN via Supabase CDN (caching, compression)
- Signed URLs for private images
- Automatic cleanup for deleted content

**Pricing:**
- Free tier: 1 GB
- Pro tier: 50 GB ($25/month)
- Additional storage: $5 per 100 GB

---

### Upload Workflow

```
User → [React] → [Supabase Storage Direct Upload] → CDN
                    ↓
                [DB: Store URL Reference]
```

**Flow:**
1. Frontend gets signed URL from backend (`POST /storage/get-signed-url`)
2. Frontend uploads directly to Supabase Storage
3. Frontend receives object path
4. Frontend POSTs path to backend (`POST /brand-kit/upload-image`)
5. Backend stores URL in database

**Benefits:**
- Bypasses backend upload bottleneck
- Faster uploads for users
- Backend doesn't store file content

---

## Image Processing Pipeline

### Brand Kit Images:
- Upload: JPG/PNG → Supabase Storage
- Processing: Auto-resize (logo: 200×200, photos: 1920×1080)
- Serve: CDN URL

### Generated Images (AI):
- Generation: Stable Diffusion → binary PNG
- Storage: Direct to Supabase Storage
- Reference: URL + metadata in `generated_images` table
- Lifetime: Delete when parent content deleted (soft delete: 90 days)

---

## Backup & Disaster Recovery

1. **Database Backups:** Supabase handles automatic daily backups (1 week retention)
2. **Storage Backups:** Enable object versioning in Supabase Storage (30-day retention)
3. **Manual Backups:** Weekly export of database (CSV) to separate backup bucket

---

# SECTION 5 — API ENDPOINT DESIGN

## API Overview

- **Base URL:** `https://api.medipost.ai/v1` (or use Supabase auto-generated REST API)
- **Authentication:** Bearer token (JWT) in `Authorization` header
- **Content-Type:** `application/json`
- **Error Format:** Standardized error responses (see below)

---

## Error Response Format

All endpoints use consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token",
    "details": null,
    "timestamp": "2025-06-21T10:30:00Z"
  }
}
```

**Standard HTTP Codes:**
- `200 OK` — Successful GET/PUT
- `201 Created` — Successful POST
- `400 Bad Request` — Validation error
- `401 Unauthorized` — Missing/invalid auth
- `403 Forbidden` — Insufficient permissions
- `404 Not Found` — Resource doesn't exist
- `409 Conflict` — Resource already exists
- `429 Too Many Requests` — Rate limited or quota exceeded
- `500 Internal Server Error` — Server error

---

## Rate Limiting

- **Unauthenticated:** 20 requests/minute per IP
- **Authenticated:** 1,000 requests/minute per user
- **Headers:** `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## Success Response Format

```json
{
  "success": true,
  "data": { /* endpoint-specific data */ },
  "meta": {
    "timestamp": "2025-06-21T10:30:00Z"
  }
}
```

---

## Authentication Endpoints

### POST /auth/register
**Purpose:** Create new user account  
**Auth:** None (public)

**Request:**
```json
{
  "email": "dr.aisha@clinic.in",
  "password": "SecurePass123!",
  "first_name": "Aisha",
  "last_name": "Khan",
  "specialty": "Dentist",
  "phone": "+91-9876543210"
}
```

**Validation:**
- Email: valid format, unique
- Password: min 8 chars, 1 upper, 1 lower, 1 number, 1 special
- Phone: E.164 format
- Specialty: from predefined list

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "email": "dr.aisha@clinic.in",
    "token": "eyJhbGc...",
    "expires_in": 2592000
  }
}
```

**Side Effects:**
- User created with `status: 'active'`
- Default plan: Trial (7 days, 30 generations)
- Email verification link sent
- Session created

---

### POST /auth/login
**Purpose:** Authenticate user  
**Auth:** None (public)

**Request:**
```json
{
  "email": "dr.aisha@clinic.in",
  "password": "SecurePass123!",
  "remember_me": true
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "email": "dr.aisha@clinic.in",
    "first_name": "Aisha",
    "role": "user",
    "token": "eyJhbGc...",
    "refresh_token": "refresh_eyJhbGc...",
    "expires_in": 2592000,
    "profile_complete": false,
    "current_plan": "Trial"
  }
}
```

**Side Effects:**
- `last_login_at` updated
- Refresh token created (if `remember_me: true`)

---

### POST /auth/logout
**Purpose:** Invalidate session  
**Auth:** Required (Bearer token)

**Request:** Empty body

**Response:** `200 OK`
```json
{
  "success": true,
  "data": null
}
```

**Side Effects:**
- Current token invalidated
- Refresh token revoked

---

### POST /auth/refresh
**Purpose:** Get new token using refresh token  
**Auth:** None (refresh token in body)

**Request:**
```json
{
  "refresh_token": "refresh_eyJhbGc..."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "expires_in": 2592000
  }
}
```

---

### POST /auth/forgot-password
**Purpose:** Request password reset  
**Auth:** None (public)

**Request:**
```json
{
  "email": "dr.aisha@clinic.in"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "message": "Password reset link sent to email"
  }
}
```

**Side Effects:**
- Password reset token generated (expires 1 hour)
- Email sent with reset link

---

### POST /auth/reset-password
**Purpose:** Set new password using reset token  
**Auth:** None (token in body)

**Request:**
```json
{
  "token": "reset_token_abc123",
  "password": "NewSecurePass123!"
}
```

**Validation:**
- Token must be valid and not expired
- New password meets requirements

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "message": "Password reset successful"
  }
}
```

**Side Effects:**
- Password hash updated
- Reset token marked as used
- All active sessions invalidated (user must login again)

---

## User Endpoints

### GET /user/profile
**Purpose:** Retrieve current user profile  
**Auth:** Required

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "email": "dr.aisha@clinic.in",
    "first_name": "Aisha",
    "last_name": "Khan",
    "phone": "+91-9876543210",
    "specialty": "Dentist",
    "profile_complete": true,
    "created_at": "2025-06-15T10:00:00Z",
    "current_subscription": {
      "plan": "Pro",
      "status": "active",
      "billing_cycle_start": "2025-06-01",
      "billing_cycle_end": "2025-06-30",
      "quota_used": 45,
      "quota_total": 300,
      "quota_remaining": 255
    }
  }
}
```

---

### PUT /user/profile
**Purpose:** Update user profile  
**Auth:** Required

**Request:**
```json
{
  "first_name": "Aisha",
  "last_name": "Khan",
  "phone": "+91-9876543210",
  "specialty": "Dental Surgeon"
}
```

**Response:** `200 OK` (returns updated profile)

---

### PUT /user/password
**Purpose:** Change password (authenticated user)  
**Auth:** Required

**Request:**
```json
{
  "current_password": "OldPass123!",
  "new_password": "NewPass123!"
}
```

**Validation:**
- Current password must match
- New password meets requirements

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "message": "Password changed successfully"
  }
}
```

---

### DELETE /user/account
**Purpose:** Delete user account and all data (GDPR)  
**Auth:** Required

**Request:**
```json
{
  "password": "ConfirmPass123!",
  "reason": "No longer needed"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "message": "Account scheduled for deletion. Data will be purged in 90 days."
  }
}
```

**Side Effects:**
- User marked as deleted
- Data soft-deleted (scheduled hard delete in 90 days)
- Email notification sent

---

## Brand Kit Endpoints

### GET /brand-kit
**Purpose:** Retrieve user's brand kit  
**Auth:** Required

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "clinic_name": "Bright Smile Dental",
    "doctor_name": "Dr. Aisha Khan",
    "specialty": "Dentist",
    "phone": "+91-9876543210",
    "website": "brightsmile.clinic",
    "address": "12 Linking Rd, Bandra West, Mumbai",
    "primary_color": "#0E7C7B",
    "secondary_color": "#1f4e79",
    "logo_url": "https://cdn.medipost.ai/brand-kits/uuid/logo.png",
    "doctor_photo_url": "https://cdn.medipost.ai/brand-kits/uuid/doctor.jpg",
    "clinic_photo_url": "https://cdn.medipost.ai/brand-kits/uuid/clinic.jpg",
    "cover_photo_url": "https://cdn.medipost.ai/brand-kits/uuid/cover.jpg",
    "team_photo_url": "https://cdn.medipost.ai/brand-kits/uuid/team.jpg",
    "updated_at": "2025-06-20T15:30:00Z"
  }
}
```

---

### PUT /brand-kit
**Purpose:** Update brand kit  
**Auth:** Required

**Request:**
```json
{
  "clinic_name": "Bright Smile Dental Studio",
  "doctor_name": "Dr. Aisha Khan",
  "specialty": "Dental Surgeon",
  "phone": "+91-9876543210",
  "website": "brightsmile.clinic",
  "address": "12 Linking Rd, Bandra West, Mumbai",
  "primary_color": "#0E7C7B",
  "secondary_color": "#1f4e79"
}
```

**Validation:**
- All required fields present
- Colors valid hex format
- Phone E.164 format

**Response:** `200 OK` (returns updated brand kit)

---

### POST /brand-kit/get-signed-url
**Purpose:** Get presigned URL for direct image upload to storage  
**Auth:** Required

**Request:**
```json
{
  "field": "logo",
  "file_name": "clinic_logo.png",
  "file_type": "image/png",
  "file_size": 1024000
}
```

**Validation:**
- Field: one of ['logo', 'doctor_photo', 'clinic_photo', 'cover_photo', 'team_photo']
- File type: image/png, image/jpeg, image/webp
- File size: ≤ 5 MB

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "signed_url": "https://storage.supabase.co/...",
    "upload_path": "brand-kits/uuid/logo.png",
    "expires_in": 3600
  }
}
```

---

### POST /brand-kit/confirm-upload
**Purpose:** Confirm image upload and link to brand kit  
**Auth:** Required

**Request:**
```json
{
  "field": "logo",
  "object_path": "brand-kits/uuid/logo.png"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "field": "logo",
    "url": "https://cdn.medipost.ai/brand-kits/uuid/logo.png"
  }
}
```

**Side Effects:**
- Brand kit's `logo_url` updated
- Timestamp updated

---

## Content Generation Endpoints

### POST /generate/content
**Purpose:** Generate new content  
**Auth:** Required

**Request:**
```json
{
  "type": "instagram_post",
  "specialty": "Dentist",
  "tone": "Friendly",
  "audience": "General",
  "topic": "Daily oral hygiene tips",
  "context": "New patient onboarding",
  "include_hashtags": true,
  "additional_instructions": "Make it lighthearted and fun"
}
```

**Validation:**
- Type: one of ['instagram_post', 'patient_education', 'blog_article', 'story', 'reel', 'campaign', 'festive']
- Specialty: from predefined list
- Tone: from predefined list
- Topic: min 5 chars, max 200
- User has remaining quota

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "content_id": "uuid",
    "type": "instagram_post",
    "title": "5 Habits for a Brighter Smile",
    "body": "✨ A brighter smile starts with small daily habits!...",
    "metadata": {
      "specialty": "Dentist",
      "tone": "Friendly",
      "topic": "Daily oral hygiene tips"
    },
    "created_at": "2025-06-21T10:30:00Z"
  }
}
```

**Side Effects:**
- Content saved to database
- Usage logged
- Quota deducted from subscription
- If generation fails: usage logged but quota NOT deducted

**Performance SLA:** <5 seconds

---

### POST /generate/image
**Purpose:** Generate image for content (optional)  
**Auth:** Required

**Request:**
```json
{
  "content_id": "uuid",
  "style": "modern_healthcare",
  "dimensions": "1080x1080",
  "include_branding": true
}
```

**Validation:**
- Content exists and belongs to user
- Dimensions: one of [1080x1080, 1200x630, 1920x1080, 1080x1350]
- User has remaining quota

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "content_id": "uuid",
    "image_id": "uuid",
    "image_url": "https://cdn.medipost.ai/generated-images/uuid/img.png",
    "generated_at": "2025-06-21T10:35:00Z"
  }
}
```

**Performance SLA:** <15 seconds

---

### POST /generate/regenerate
**Purpose:** Regenerate content with same or different parameters  
**Auth:** Required

**Request:**
```json
{
  "content_id": "uuid",
  "tone": "Professional",
  "additional_instructions": "Make it shorter and punchier"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "content_id": "uuid",
    "type": "instagram_post",
    "title": "5 Quick Dental Habits",
    "body": "✨ Quick wins for a healthier smile...",
    "version": 2,
    "regenerated_at": "2025-06-21T10:40:00Z"
  }
}
```

**Behavior:**
- Original content retained as version 1
- New version stored
- Quota deducted (even if same parameters)
- User can switch between versions

---

## Content History Endpoints

### GET /content/history
**Purpose:** Retrieve user's generated content  
**Auth:** Required

**Query Parameters:**
- `type` (optional): filter by content type
- `search` (optional): full-text search
- `date_range` (optional): 'all', '7days', '30days', 'custom'
- `date_from` (optional): ISO date
- `date_to` (optional): ISO date
- `page` (default: 1): pagination
- `limit` (default: 20, max: 100): items per page
- `sort` (default: 'newest'): 'newest', 'oldest', 'most_copied'

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "instagram_post",
      "title": "5 Habits for a Brighter Smile",
      "body": "✨ A brighter smile starts...",
      "is_saved": true,
      "copy_count": 3,
      "created_at": "2025-06-21T10:30:00Z"
    }
  ],
  "meta": {
    "total": 142,
    "page": 1,
    "limit": 20,
    "pages": 8
  }
}
```

---

### GET /content/{content_id}
**Purpose:** Retrieve specific content  
**Auth:** Required

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "instagram_post",
    "title": "5 Habits for a Brighter Smile",
    "body": "✨ A brighter smile starts...",
    "metadata": { /* as generated */ },
    "versions": [
      { "version": 1, "body": "..." },
      { "version": 2, "body": "..." }
    ],
    "images": [
      { "image_id": "uuid", "url": "...", "created_at": "..." }
    ],
    "is_saved": true,
    "copy_count": 3,
    "created_at": "2025-06-21T10:30:00Z",
    "updated_at": "2025-06-21T10:40:00Z"
  }
}
```

---

### PUT /content/{content_id}
**Purpose:** Update content (save, archive, etc.)  
**Auth:** Required

**Request:**
```json
{
  "is_saved": true,
  "title": "My Custom Title",
  "status": "archived"
}
```

**Response:** `200 OK` (returns updated content)

---

### DELETE /content/{content_id}
**Purpose:** Delete content (soft delete)  
**Auth:** Required

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "deleted",
    "will_be_purged_at": "2025-09-21T10:30:00Z"
  }
}
```

**Side Effects:**
- Content marked as deleted (`deleted_at` set)
- Hard delete scheduled for 90 days

---

### POST /content/{content_id}/copy
**Purpose:** Record copy action  
**Auth:** Required

**Request:** Empty body

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "copied_at": "2025-06-21T10:45:00Z"
  }
}
```

**Side Effects:**
- `copy_count` incremented
- Usage logged with action 'copy'

---

## Subscription Endpoints

### GET /subscriptions/plans
**Purpose:** List all available plans  
**Auth:** Optional (no premium data leaked)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Trial",
      "tier": 0,
      "monthly_quota": 30,
      "price_inr": 0,
      "features": ["All content types", "Copy & save"],
      "duration_days": 7
    },
    {
      "id": "uuid",
      "name": "Starter",
      "tier": 1,
      "monthly_quota": 50,
      "price_inr": 499,
      "features": ["All content types", "Copy & save", "Email support"]
    },
    {
      "id": "uuid",
      "name": "Pro",
      "tier": 2,
      "monthly_quota": 300,
      "price_inr": 1999,
      "features": ["Everything in Starter", "Priority generation", "Content history", "Brand presets"]
    },
    {
      "id": "uuid",
      "name": "Clinic",
      "tier": 3,
      "monthly_quota": -1,
      "price_inr": 6999,
      "features": ["Everything in Pro", "Up to 10 seats", "Team library", "Success manager"],
      "max_team_members": 10
    }
  ]
}
```

---

### GET /subscriptions/current
**Purpose:** Get user's current subscription  
**Auth:** Required

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "subscription_id": "uuid",
    "plan": "Pro",
    "status": "active",
    "billing_cycle_start": "2025-06-01",
    "billing_cycle_end": "2025-06-30",
    "quota_used": 45,
    "quota_total": 300,
    "quota_remaining": 255,
    "quota_reset_date": "2025-07-01",
    "price_inr": 1999,
    "auto_renew": false,
    "started_at": "2025-06-05T10:00:00Z"
  }
}
```

---

### POST /subscriptions/upgrade
**Purpose:** Upgrade to higher tier (Phase 2: payment integration)  
**Auth:** Required

**Request:**
```json
{
  "plan_id": "uuid",
  "payment_method": "card",
  "coupon_code": "SAVE10"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "subscription_id": "uuid",
    "plan": "Pro",
    "status": "active",
    "effective_immediately": true
  }
}
```

---

### POST /subscriptions/downgrade
**Purpose:** Downgrade to lower tier  
**Auth:** Required

**Request:**
```json
{
  "plan_id": "uuid"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "message": "Downgrade scheduled for end of current billing cycle"
  }
}
```

**Behavior:**
- Downgrade effective at next billing cycle
- Pro-rated refund if mid-month change

---

### POST /subscriptions/cancel
**Purpose:** Cancel subscription  
**Auth:** Required

**Request:**
```json
{
  "reason": "Too expensive"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "message": "Subscription cancelled",
    "plan_active_until": "2025-06-30",
    "cancellation_effective": "2025-07-01"
  }
}
```

**Side Effects:**
- Status changed to 'cancelled'
- User reverts to Trial plan after cycle end
- Email sent confirming cancellation

---

## Usage & Analytics Endpoints

### GET /user/usage-stats
**Purpose:** Current user's usage statistics  
**Auth:** Required

**Query Parameters:**
- `period` (default: 'current_month'): 'current_month', 'last_month', 'all_time', 'custom'
- `date_from` (optional): ISO date
- `date_to` (optional): ISO date

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "period": "current_month",
    "period_start": "2025-06-01",
    "period_end": "2025-06-30",
    "total_generations": 45,
    "generations_by_type": {
      "instagram_post": 20,
      "blog_article": 15,
      "patient_education": 10
    },
    "images_generated": 8,
    "content_saved": 12,
    "quota_used": 45,
    "quota_total": 300,
    "quota_remaining": 255,
    "success_rate": 98.2,
    "avg_generation_time_ms": 4200
  }
}
```

---

### GET /user/monthly-report
**Purpose:** Email-friendly monthly usage report  
**Auth:** Required

**Query Parameters:**
- `year`: YYYY
- `month`: MM (01-12)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "report_month": "2025-06",
    "user_name": "Dr. Aisha Khan",
    "summary": {
      "total_generations": 45,
      "avg_per_day": 1.5,
      "content_saved": 12,
      "most_used_type": "instagram_post"
    },
    "breakdown": { /* detailed stats */ },
    "trends": {
      "week1": 8,
      "week2": 12,
      "week3": 15,
      "week4": 10
    }
  }
}
```

---

## Admin Endpoints

### GET /admin/stats
**Purpose:** Platform-wide statistics (Admin only)  
**Auth:** Required (Admin role)

**Query Parameters:**
- `period` (default: '30days'): '7days', '30days', '90days', 'all_time'

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "period": "30days",
    "users_total": 1284,
    "users_new": 128,
    "users_active": 892,
    "subscriptions_active": 742,
    "subscriptions_by_plan": {
      "trial": 150,
      "starter": 220,
      "pro": 280,
      "clinic": 92
    },
    "revenue_total_inr": 185400,
    "revenue_by_plan": { /* breakdown */ },
    "content_generated": 48310,
    "content_by_type": { /* breakdown */ },
    "api_costs_usd": 2440,
    "success_rate": 98.5,
    "avg_response_time_ms": 3800
  }
}
```

---

### GET /admin/users
**Purpose:** List all users (Admin only)  
**Auth:** Required (Admin role)

**Query Parameters:**
- `search` (optional): email or name
- `status` (default: 'all'): 'active', 'inactive', 'suspended'
- `plan` (optional): filter by plan
- `page` (default: 1)
- `limit` (default: 50)
- `sort` (default: 'created_desc'): 'created_asc', 'created_desc', 'usage_desc'

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "user_id": "uuid",
      "email": "aisha@clinic.in",
      "first_name": "Aisha",
      "last_name": "Khan",
      "specialty": "Dentist",
      "plan": "Pro",
      "status": "active",
      "created_at": "2025-06-05T10:00:00Z",
      "last_login_at": "2025-06-21T08:30:00Z",
      "total_generations": 145,
      "this_month_generations": 45
    }
  ],
  "meta": {
    "total": 1284,
    "page": 1,
    "limit": 50,
    "pages": 26
  }
}
```

---

### GET /admin/users/{user_id}
**Purpose:** Detailed user info (Admin only)  
**Auth:** Required (Admin role)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "email": "aisha@clinic.in",
    "first_name": "Aisha",
    "last_name": "Khan",
    "status": "active",
    "profile": { /* user details */ },
    "subscription": { /* current plan */ },
    "usage": { /* 30-day stats */ },
    "created_at": "2025-06-05T10:00:00Z",
    "last_login_at": "2025-06-21T08:30:00Z"
  }
}
```

---

### PUT /admin/users/{user_id}/status
**Purpose:** Change user status (Admin only)  
**Auth:** Required (Admin role)

**Request:**
```json
{
  "status": "suspended",
  "reason": "Violating terms of service"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "status": "suspended"
  }
}
```

**Side Effects:**
- User access revoked
- Current sessions invalidated
- Audit log entry created

---

### POST /admin/users/{user_id}/quota-reset
**Purpose:** Manually reset user's monthly quota (Admin only)  
**Auth:** Required (Admin role)

**Request:**
```json
{
  "reason": "Account migration"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "quota_used": 0,
    "quota_remaining": 300
  }
}
```

---

### GET /admin/audit-logs
**Purpose:** View all admin actions (Admin only)  
**Auth:** Required (Admin role)

**Query Parameters:**
- `admin_id` (optional): filter by admin
- `target_user_id` (optional): filter by affected user
- `action` (optional): filter by action type
- `date_from`, `date_to` (optional): date range
- `page` (default: 1)
- `limit` (default: 50)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "admin_id": "uuid",
      "admin_name": "Admin User",
      "action": "user_suspended",
      "target_user_id": "uuid",
      "target_user_email": "user@clinic.in",
      "details": { /* action-specific data */ },
      "timestamp": "2025-06-21T10:30:00Z"
    }
  ],
  "meta": { /* pagination */ }
}
```

---

### POST /admin/system/health
**Purpose:** System health check (Admin only)  
**Auth:** Required (Admin role)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "database": {
      "status": "connected",
      "response_time_ms": 45
    },
    "storage": {
      "status": "connected",
      "used_gb": 87,
      "available_gb": 463
    },
    "gemini_api": {
      "status": "operational",
      "last_check": "2025-06-21T10:28:00Z"
    },
    "image_api": {
      "status": "operational",
      "last_check": "2025-06-21T10:28:00Z"
    },
    "uptime_percent": 99.92,
    "timestamp": "2025-06-21T10:30:00Z"
  }
}
```

---

# SECTION 6 — AI INTEGRATION

## Overview

Medipost AI uses two AI services:

1. **Google Gemini API** — Text generation (healthcare content)
2. **Stable Diffusion API** (or Midjourney) — Image generation

---

## Gemini API Integration

### Setup

1. **API Key Management:**
   - Store in environment variable: `GOOGLE_GEMINI_API_KEY`
   - Use Supabase secrets/environment variables
   - Rotate keys quarterly

2. **Model Version:**
   - Use latest: `gemini-2.0-flash` or newer
   - Fallback: `gemini-1.5-pro`

3. **Pricing:**
   - Input: $0.0375/1M tokens
   - Output: $0.15/1M tokens
   - Estimated cost per generation: $0.01-0.03

---

### Text Generation Flow

```
User Request
  ↓
[Build System Prompt] → Brand Kit + Specialty + Tone + Audience
  ↓
[Build User Prompt] → Topic + Context + Instructions
  ↓
[Call Gemini API] → temperature: 0.7, max_tokens: 2000
  ↓
[Parse Response] → Extract text, validate quality
  ↓
[Save to Database] → Store content + metadata
  ↓
[Deduct Quota] → Update subscription usage
  ↓
Response to User
```

---

### System Prompt Template

```
You are an expert healthcare content creator specializing in {specialty} content.

Your style:
- Tone: {tone}
- Audience: {audience}
- Format: {type}

Brand Information:
- Clinic: {clinic_name}
- Doctor: {doctor_name}
- Colors: {primary_color}, {secondary_color}

Guidelines:
1. Use simple, accessible language
2. Include relevant medical terminology but explain it
3. Add engaging elements (emojis for social, statistics for education)
4. Always include call-to-action or next steps
5. Keep content original and avoid copy-paste generic content
6. Include {clinic_name} branding naturally

Output Instructions:
- Start with an attention-grabbing hook
- Use short paragraphs (2-3 lines max for social)
- End with a clear CTA (e.g., "Book now", "Learn more", "Ask your doctor")
- Format: Markdown where appropriate
```

---

### Content Type Specific Prompts

#### Instagram Post
```
Generate an Instagram post (150-300 words max) about {topic}.

Include:
- Hook/attention grabber (1-2 lines)
- 2-3 key points
- Call-to-action
- 5-10 relevant hashtags
- Emoji suggestions in parentheses

Format as single continuous text, not bullet points.
```

#### Patient Education Article
```
Generate a patient-friendly article (400-600 words) about {topic}.

Structure:
- Title (5-10 words)
- 1-2 sentence intro
- 3-4 body sections with subheadings
- Conclusion with CTA
- Avoid medical jargon; explain all terms

Use markdown for formatting.
```

#### Blog Article
```
Generate a blog article (800-1200 words) about {topic}.

Requirements:
- Title + meta description
- 4-5 sections with subheadings
- Include statistics/research references (fabricate if needed for MVP)
- SEO: include target keywords naturally
- Professional tone
- Include doctor byline

Use markdown for formatting.
```

---

### Request/Response Example

**Request to Gemini:**
```python
import anthropic
from google import genai

response = genai.Client(api_key=GEMINI_KEY).models.generate_content(
  model="gemini-2.0-flash",
  contents=[
    {
      "role": "user",
      "parts": [
        {
          "text": system_prompt + user_prompt
        }
      ]
    }
  ],
  generation_config={
    "temperature": 0.7,
    "max_output_tokens": 2000,
  }
)

content = response.text
```

**Response:**
```
✨ A brighter smile starts with small daily habits!

1. Brush twice a day (2 min each!)
2. Floss before bed
3. Swap soda for water
4. Visit your dentist every 6 months
5. Replace your toothbrush every 3 months

Which one will you start today? 🦷💙

#DentalCare #HealthySmile #OralHealth
```

---

### Error Handling & Retries

```
Generation Request
  ↓
Try Gemini API
  ├─ Success (200) → Store content → Return to user
  ├─ Rate limit (429) → Wait 60s → Retry (max 3x)
  ├─ Invalid request (400) → Log error → Return 400 to user
  ├─ Timeout (>30s) → Retry once → Return 500 if fails
  └─ API down (500+) → Use cached template → Return degraded response

Side Effect:
- If generation fails: Log usage, DON'T deduct quota
- User sees: "Generation failed. Try again. No quota used."
```

---

## Image Generation Integration

### Setup

**Option A: Stable Diffusion (Recommended for MVP)**
- Provider: Replicate, Hugging Face, or self-hosted
- Cost: $0.025-0.10 per image
- Quality: Good for healthcare content
- Speed: 15-30 seconds per image

**Option B: Midjourney (Slower, Premium)**
- Cost: $0.10-0.30 per image
- Quality: Excellent
- Speed: 30-60 seconds
- Not suitable for real-time MVP

### Recommended: Replicate (Stable Diffusion 3)

```python
import replicate

# Get API key from environment
REPLICATE_API_KEY = os.getenv("REPLICATE_API_KEY")

# Generate image
output = replicate.run(
  "stability-ai/stable-diffusion-3",
  input={
    "prompt": image_prompt,
    "negative_prompt": "blurry, low quality, watermark",
    "guidance_scale": 7.5,
    "num_inference_steps": 50,
    "width": 1080,
    "height": 1080,
    "num_outputs": 1
  }
)

image_url = output[0]  # Direct URL to generated image
```

---

### Image Generation Flow

```
User Request (with content_id)
  ↓
[Build Image Prompt] → Brand colors + Clinic branding + Topic
  ↓
[Call Stable Diffusion] → Send to Replicate/API
  ↓
[Wait for Generation] → Poll status (timeout: 60s)
  ↓
[Download Image] → Save to Supabase Storage
  ↓
[Create Reference] → Store URL in generated_images table
  ↓
[Return Image URL] → Send to frontend
```

---

### Image Prompt Template

```
Generate a professional healthcare image for Instagram.

Subject: {topic}
Specialty: {specialty}
Style: Modern, clean, professional

Colors: Use {primary_color} and {secondary_color} as accents
Branding: Include subtle clinic branding/logo if possible

Include: Doctor/clinic professional imagery, patient-friendly visuals
Avoid: Unrealistic medical imagery, offensive content, watermarks

Dimensions: 1080x1080 (square, Instagram format)
```

---

### Pricing & Cost Tracking

| Source | Per Image | Monthly (100 images) | Annual |
|--------|-----------|----------------------|---------|
| Stable Diffusion | $0.05 | $5 | $60 |
| Midjourney | $0.15 | $15 | $180 |
| In-house (GPU) | $0.10 | $10 | $120 |

**Recommendation:** Start with Replicate ($0.05/image), scale to self-hosted if >1000 images/month.

---

### Error Handling

```
Image Generation Request
  ↓
Call Stable Diffusion
  ├─ Success → Download to storage → Return URL
  ├─ Timeout (>60s) → Return error, retry async
  ├─ API error → Use placeholder, log for admin
  └─ Storage error → Save attempt, retry later

Side Effect:
- Image generation fails: No quota deducted (user can retry)
- Log entry created with error details
```

---

## Cost Optimization

### Caching
- Cache generated images for 7 days (same prompt = same output)
- Skip regeneration if cache hit

### Prompt Optimization
- Use shorter, focused prompts
- Avoid unnecessary context
- Batch requests when possible (Phase 2)

### Rate Limiting
- Limit to 100 generations/user/day (unless Clinic plan)
- Batch requests in off-peak hours
- Prioritize paid users

---

## Monitoring & Logging

### Track:
1. API call count (daily/monthly)
2. Success/failure rate
3. Average latency
4. Cost (USD per day)
5. Quality feedback (user thumbs up/down)

### Dashboard (Admin):
```
Gemini API:
- Today: 2,340 calls | $28.40
- Month: 68,000 calls | $850

Stable Diffusion:
- Today: 180 images | $9.00
- Month: 5,200 images | $260

Total AI Cost: $1,110 (month)
```

---

# SECTION 7 — AUTHENTICATION FLOW

## Registration Flow

### Steps:

```
1. User visits frontend → /register
2. Fills form: email, password, name, specialty
3. Frontend validates (email format, password strength)
4. Frontend POSTs /auth/register
5. Backend validates:
   - Email not already registered
   - Password meets requirements
   - Specialty in predefined list
6. Backend creates user:
   - Hash password with bcrypt (10 rounds)
   - Create user record (status: 'active', email_verified: false)
   - Create default subscription (Trial plan, expires in 7 days)
   - Create default brand kit (with placeholder values)
7. Backend generates email verification token
8. Backend sends verification email:
   - Link: https://medipost.ai/verify-email?token=abc123
   - Valid for 24 hours
9. Frontend redirects to /verify-email-sent
10. User clicks email link (or auto-verifies in MVP)
11. Email marked as verified (email_verified: true)
12. User automatically logged in OR redirected to login

Side Effects:
- Audit log entry (user_registered)
- Welcome email sent
- Onboarding email scheduled (day 1, day 3)
```

---

## Login Flow

### Steps:

```
1. User visits frontend → /login
2. Enters email + password
3. Frontend POSTs /auth/login
4. Backend validates:
   - User exists
   - Password correct (bcrypt verify)
   - User status = 'active' (not suspended/deleted)
5. Backend generates JWT token:
   - Payload: user_id, email, role, iat, exp (30 days)
   - Signed with SECRET_KEY
6. If "Remember me" checked:
   - Generate refresh token (valid 90 days)
   - Store in database
7. Backend returns:
   - JWT access token
   - Refresh token (in httpOnly cookie if web)
   - User profile
   - Current subscription
8. Frontend stores token (localStorage or memory)
9. Frontend sets Authorization header for future requests
10. User redirected to /dashboard
11. last_login_at updated in database

Side Effects:
- Audit log entry (user_login)
- IP address logged (for fraud detection)
- Session created
```

---

## Session Management

### Token Storage:
- **Access Token (JWT):** 
  - Lifetime: 30 days
  - Storage: localStorage (or memory for higher security)
  - Used in: `Authorization: Bearer {token}` header
  
- **Refresh Token:**
  - Lifetime: 90 days
  - Storage: httpOnly cookie (secure, not accessible via JS)
  - Used in: `/auth/refresh` endpoint
  - Rotated on each use (old token invalidated)

### Backend Token Validation:

```python
@app.middleware("http")
async def verify_token(request: Request, call_next):
    # Skip for public endpoints
    if request.url.path in ["/auth/login", "/auth/register", ...]:
        return await call_next(request)
    
    # Get token from header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return 401_Unauthorized()
    
    token = auth_header.split(" ")[1]
    
    try:
        # Verify JWT signature
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        request.user_id = payload["user_id"]
        request.user_role = payload["role"]
    except jwt.ExpiredSignatureError:
        return 401_Token_Expired()  # Client should refresh
    except jwt.InvalidSignatureError:
        return 401_Unauthorized()
    
    return await call_next(request)
```

---

## Logout Flow

### Steps:

```
1. User clicks "Logout"
2. Frontend POSTs /auth/logout with current token
3. Backend:
   - Marks token as invalidated in redis/blocklist
   - Deletes refresh token from database
   - Clears session
4. Frontend:
   - Removes access token from localStorage
   - Removes refresh token cookie
   - Redirects to /login
5. User must login again to get new token

Side Effects:
- Audit log entry (user_logout)
- All other sessions remain active (unless globally logout)
```

---

## Admin Authentication

### Admin Registration:
- Admins created by system admin only
- Email + temporary password sent
- Admin must change password on first login
- 2FA enforced (TOTP, SMS, or WebAuthn) - Phase 2

### Admin Login:
- Same flow as regular users
- JWT token issued with `role: 'admin'`
- All requests to `/admin/*` endpoints check role

### Admin Session:
- Shorter timeout: 12 hours (vs. 30 days for users)
- More frequent re-authentication for sensitive operations
- All actions logged in `admin_audit_logs`

---

## Role-Based Access Control (RBAC)

### User Roles:

| Role | Permissions |
|------|-------------|
| `user` | Generate content, manage brand kit, view own history, manage subscription |
| `admin` | All user permissions + view all users, suspend accounts, view analytics, audit logs, manage admins |
| `superadmin` | All admin permissions + system configuration, database access |

### Authorization Check:

```python
def require_role(*roles):
    def decorator(func):
        async def wrapper(request: Request, *args, **kwargs):
            if request.user_role not in roles:
                return 403_Forbidden()
            return await func(request, *args, **kwargs)
        return wrapper
    return decorator

@app.get("/admin/stats")
@require_role("admin", "superadmin")
async def get_admin_stats(request: Request):
    # Only admins can access
    pass
```

---

## Protected Routes (Frontend)

### Route Guards:

```typescript
// React Router example
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  return children;
};

// Usage:
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

### Admin Routes:

```typescript
const AdminRoute = ({ children }) => {
  const { isAuthenticated, role, isLoading } = useAuth();
  
  if (isLoading) return <Spinner />;
  if (!isAuthenticated || role !== "admin") {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};
```

---

## Token Refresh Flow

### When Access Token Expires:

```
1. Frontend makes API request with expired token
2. Backend returns 401 + error code "TOKEN_EXPIRED"
3. Frontend catches error
4. Frontend POSTs /auth/refresh with refresh token
5. Backend validates refresh token:
   - Token exists in database
   - Not expired
   - Not revoked
6. Backend generates new access token
7. Backend rotates refresh token:
   - Old token invalidated
   - New refresh token created
8. Frontend stores new tokens
9. Frontend retries original request with new token
10. Request succeeds

Side Effects:
- Usage logged
- Old refresh token deleted
```

---

## Forgot Password Flow

### Steps:

```
1. User clicks "Forgot Password"
2. User enters email
3. Frontend POSTs /auth/forgot-password
4. Backend:
   - Finds user by email
   - Generates reset token (32 random bytes)
   - Stores token in password_reset_tokens table (expires 1 hour)
   - Sends email with reset link
5. Frontend shows "Check your email"
6. User receives email with link:
   - https://medipost.ai/reset-password?token=abc123def456
7. User clicks link → frontend navigates to reset form
8. User enters new password
9. Frontend POSTs /auth/reset-password with token + new password
10. Backend:
    - Finds token in database
    - Validates: not expired, not already used
    - Updates user password
    - Marks token as used
    - Invalidates all active sessions
11. Frontend redirects to login
12. User must login again with new password

Side Effects:
- Audit log entry (password_reset)
- Email sent
- All sessions invalidated
```

---

## Security Best Practices

### Password Storage:
- Hash with bcrypt (10 rounds minimum)
- Never store plaintext passwords
- Salt automatically included in bcrypt hash

### Token Security:
- Tokens signed with strong SECRET_KEY (32+ bytes)
- HTTPS only (prevent man-in-the-middle)
- Short expiration times (30 days for access, 90 for refresh)
- Refresh tokens rotated on use

### Session Security:
- httpOnly cookies for refresh tokens (not accessible via JS)
- CSRF protection for form submissions
- Rate limit login attempts (5 attempts/15 minutes per IP)
- Account lockout after 10 failed attempts

### GDPR Compliance:
- Email verification before account activation
- "Remember me" requires explicit consent
- Delete account endpoint for user data removal
- Audit logs for compliance

---

# SECTION 8 — MVP DEVELOPMENT ORDER

## Phase: Foundation (Weeks 1-2)

### Week 1: Infrastructure & Database

| Task | Est. Hours | Owner | Notes |
|------|-----------|-------|-------|
| 1.1 Set up Supabase project | 3 | Backend | Create organization, add team members |
| 1.2 Design & create database schema | 8 | Backend | Tables, indexes, constraints, seed data |
| 1.3 Set up authentication in Supabase | 4 | Backend | Create auth policies, test |
| 1.4 Configure storage buckets | 2 | Backend | Set up brand-kits, generated-images folders |
| 1.5 Set up CI/CD pipeline | 6 | DevOps | GitHub Actions for deployment |
| 1.6 Create backend project structure | 3 | Backend | Express/Node setup (if using), environment variables |
| 1.7 Set up error logging (Sentry) | 2 | Backend | Track errors, get alerts |
| **Week 1 Total** | **28 hours** | | |

### Week 2: Core Authentication

| Task | Est. Hours | Owner | Notes |
|------|-----------|-------|-------|
| 2.1 Implement /auth/register endpoint | 5 | Backend | Email validation, password hashing, email verification |
| 2.2 Implement /auth/login endpoint | 4 | Backend | JWT generation, session management |
| 2.3 Implement /auth/logout endpoint | 2 | Backend | Token invalidation |
| 2.4 Implement /auth/refresh endpoint | 3 | Backend | Refresh token rotation |
| 2.5 Implement /auth/forgot-password & reset | 5 | Backend | Email templates, token validation |
| 2.6 Frontend: Auth integration | 8 | Frontend | Login/Register forms, token storage, redirects |
| 2.7 Frontend: Protected routes setup | 4 | Frontend | Route guards, role-based access |
| 2.8 End-to-end testing (auth flow) | 4 | QA | Test all auth scenarios |
| **Week 2 Total** | **35 hours** | | |

---

## Phase: MVP Features (Weeks 3-5)

### Week 3: Brand Kit Management

| Task | Est. Hours | Owner | Notes |
|------|-----------|-------|-------|
| 3.1 Implement GET /brand-kit endpoint | 3 | Backend | Fetch user's brand kit |
| 3.2 Implement PUT /brand-kit endpoint | 3 | Backend | Update brand kit fields |
| 3.3 Implement storage upload endpoints | 6 | Backend | Signed URL generation, image upload handling |
| 3.4 Frontend: Brand Kit form | 6 | Frontend | Form inputs, image uploads, preview |
| 3.5 Connect frontend to backend | 3 | Frontend | API calls, state management |
| 3.6 Testing (brand kit) | 3 | QA | CRUD operations, image handling |
| **Week 3 Total** | **24 hours** | | |

### Week 4: Content Generation (Phase 1)

| Task | Est. Hours | Owner | Notes |
|------|-----------|-------|-------|
| 4.1 Set up Gemini API integration | 4 | Backend | API key, authentication, test calls |
| 4.2 Implement text generation logic | 6 | Backend | Prompt building, API calls, error handling |
| 4.3 Implement POST /generate/content endpoint | 5 | Backend | Quota checking, content saving, usage logging |
| 4.4 Frontend: Generation form | 6 | Frontend | Type selection, parameters, API integration |
| 4.5 Frontend: Generated content display | 4 | Frontend | Formatted output, copy button |
| 4.6 Testing (content generation) | 4 | QA | Happy path, quota limits, error handling |
| **Week 4 Total** | **29 hours** | | |

### Week 5: Content History & Subscriptions

| Task | Est. Hours | Owner | Notes |
|------|-----------|-------|-------|
| 5.1 Implement GET /content/history endpoint | 5 | Backend | Filtering, search, pagination |
| 5.2 Implement GET /subscriptions/plans & current | 4 | Backend | Plan details, quota status |
| 5.3 Implement usage tracking endpoints | 3 | Backend | GET /user/usage-stats |
| 5.4 Frontend: History page | 6 | Frontend | List, search, filters, pagination |
| 5.5 Frontend: Subscription page (read-only) | 4 | Frontend | Display plans, current status |
| 5.6 Testing (history, subscriptions) | 4 | QA | Pagination, filtering, calculations |
| **Week 5 Total** | **26 hours** | | |

---

## Phase: Polish & Launch (Weeks 6-7)

### Week 6: Admin Dashboard & Final Integration

| Task | Est. Hours | Owner | Notes |
|------|-----------|-------|-------|
| 6.1 Implement admin auth check | 3 | Backend | Role validation, admin endpoints |
| 6.2 Implement GET /admin/stats endpoint | 4 | Backend | Metrics aggregation |
| 6.3 Implement GET /admin/users endpoint | 3 | Backend | User listing, search, filtering |
| 6.4 Frontend: Admin Dashboard | 6 | Frontend | Charts, stats, user list |
| 6.5 End-to-end testing (full app) | 6 | QA | All features, integration tests |
| 6.6 Performance testing & optimization | 4 | Backend | Load testing, query optimization |
| 6.7 Security audit | 5 | DevOps/Backend | CORS, CSP, SQL injection checks |
| **Week 6 Total** | **31 hours** | | |

### Week 7: Deployment & Launch

| Task | Est. Hours | Owner | Notes |
|------|-----------|-------|-------|
| 7.1 Staging environment setup | 3 | DevOps | Mirror production, test deployment |
| 7.2 Database migration strategy | 3 | Backend | Backup plan, rollback procedures |
| 7.3 Production deployment | 4 | DevOps | Deploy to production, verify |
| 7.4 Monitoring & alerts setup | 3 | DevOps | Error tracking, performance monitoring, uptime |
| 7.5 User documentation | 4 | Technical Writer | README, API docs, FAQ |
| 7.6 Marketing page setup | 4 | Frontend | Landing page, pricing, features |
| 7.7 Soft launch (beta users) | 3 | Product | Invite 50-100 beta users, gather feedback |
| 7.8 Bug fixes & polish | 4 | Backend/Frontend | Address beta feedback |
| **Week 7 Total** | **28 hours** | | |

---

## Development Roadmap Summary

```
WEEK 1-2: FOUNDATION
├─ Database design & schema
├─ Supabase setup
├─ Authentication (register, login, logout)
└─ Protected routes

WEEK 3: BRAND KIT
├─ Brand kit CRUD
├─ Image upload
└─ Storage integration

WEEK 4: CONTENT GENERATION
├─ Gemini API integration
├─ Text generation engine
├─ Content generation endpoints
└─ Generator UI

WEEK 5: HISTORY & SUBSCRIPTIONS
├─ Content history
├─ Search & filtering
├─ Usage tracking
└─ Subscription display

WEEK 6: ADMIN & QA
├─ Admin authentication
├─ Admin dashboard
├─ Analytics endpoints
└─ Full integration testing

WEEK 7: LAUNCH
├─ Staging deployment
├─ Production deployment
├─ Monitoring setup
└─ Beta launch

TOTAL: ~7 WEEKS TO MVP LAUNCH
```

---

## Parallel Work Tracks

To accelerate development:

1. **Backend Track:** Authentication → Brand Kit → Generation → Admin (Weeks 1-6)
2. **Frontend Track:** Auth UI → Brand Kit UI → Generation UI → History UI (Weeks 2-6)
3. **QA Track:** Test plan → Unit tests → Integration tests → E2E tests (Weeks 2-7)
4. **DevOps Track:** Infrastructure setup → CI/CD → Monitoring → Deployment (Weeks 1-7)

---

## Success Metrics for MVP Launch

| Metric | Target |
|--------|--------|
| Authentication Success Rate | >99% |
| Content Generation Speed | <5 seconds |
| Page Load Time | <2 seconds |
| Database Query Latency | <100ms (p95) |
| API Uptime | >99.9% |
| Error Rate | <0.5% |
| User Signup Completion | >85% |
| Free Trial Conversion | >20% |

---

# SECTION 9 — FUTURE FEATURES (PHASE 2)

Features explicitly NOT included in MVP, planned for Phase 2 (Q3-Q4 2025):

---

## Phase 2A: Social Media Integration (Weeks 8-10)

### 9.1 Instagram Auto-Posting
- **What:** One-click post to Instagram from Medipost
- **Implementation:**
  - Instagram Graph API integration
  - OAuth 2.0 for user authorization
  - Scheduled posting
  - Caption + image upload
- **Endpoints:**
  - `POST /social/instagram/authorize`
  - `POST /content/{id}/post-to-instagram`
  - `GET /social/instagram/posts`
- **Complexity:** Medium
- **MVP Reason:** Adds no core value; can post manually in 2 clicks

---

### 9.2 Facebook Auto-Posting
- **Similar to Instagram:** OAuth, scheduled posting, analytics
- **Additional:** Group posting, page posting
- **MVP Reason:** Low user demand for MVP phase

---

### 9.3 LinkedIn Auto-Posting
- **What:** Post to LinkedIn directly
- **Implementation:** LinkedIn API, OAuth
- **Audience:** Professional healthcare providers
- **MVP Reason:** Lower priority than content generation

---

## Phase 2B: Content Enhancement (Weeks 11-12)

### 9.4 Canva API Integration
- **What:** Export generated content to Canva for design
- **Implementation:**
  - Canva API for template creation
  - OAuth for user authentication
  - Template library management
- **MVP Reason:** Design not core to MVP; users can use Canva independently

---

### 9.5 Image Generation Enhancements
- **Advanced Style Control:** More style options (anime, photorealistic, watercolor)
- **Brand Logo Integration:** Auto-insert clinic logo into generated images
- **Template Library:** Pre-designed templates + AI fill

---

## Phase 2C: Collaboration & Teams (Weeks 13-15)

### 9.6 Multi-Doctor Accounts
- **What:** Clinic plan allows multiple doctor accounts sharing library
- **Implementation:**
  - Team management endpoints
  - Shared content library
  - Role-based permissions (admin, editor, viewer)
- **MVP Reason:** Single doctor focus for MVP; team feature post-validated

---

### 9.7 Content Approval Workflow
- **What:** Clinic admin approves doctor's content before posting
- **Implementation:**
  - Approval status field
  - Notification system
  - Audit trail

---

## Phase 2D: Mobile App (Weeks 16-20)

### 9.8 iOS & Android Native Apps
- **What:** Native mobile apps for on-the-go generation
- **Technologies:** React Native or Flutter
- **Features:** Reduced set (generation, history, settings)
- **MVP Reason:** Web app sufficient for MVP; mobile post-web validation

---

## Phase 2E: Advanced Analytics (Weeks 21-23)

### 9.9 Content Performance Analytics
- **What:** Track content engagement (likes, comments, shares)
- **Implementation:**
  - Social media API integration
  - Analytics dashboard
  - Best-performing content insights
- **MVP Reason:** Requires social posting integration first

---

### 9.10 User Behavior Analytics
- **What:** Heatmaps, user flows, retention analysis
- **Tools:** Mixpanel, Amplitude, custom analytics
- **MVP Reason:** PostHog integration for MVP; advanced analysis later

---

## Phase 2F: Payment & Billing (Weeks 24-26)

### 9.11 Payment Processing
- **What:** Stripe integration for plan payments
- **Implementation:**
  - Stripe checkout
  - Subscription management
  - Invoice generation
  - Billing portal
- **MVP Reason:** Manual billing acceptable for MVP; auto-payment Phase 2

---

### 9.12 Coupon & Promo Codes
- **What:** Discount codes, affiliate referrals
- **Implementation:**
  - Coupon generation & validation
  - Affiliate tracking
- **MVP Reason:** Launch with single price; promotions later

---

### 9.13 Usage-Based Billing
- **What:** Pay-per-generation instead of monthly plans
- **MVP Reason:** Fixed pricing clearer for MVP; PPG Phase 2

---

## Phase 2G: AI Enhancements (Weeks 27-29)

### 9.14 Content Optimization
- **What:** AI suggestions to improve content (readability, SEO, engagement)
- **Implementation:**
  - Readability scoring
  - SEO analysis
  - A/B testing recommendations

---

### 9.15 Multi-Language Support
- **What:** Generate content in Hindi, Tamil, Marathi, etc.
- **Implementation:**
  - Language selection in generation
  - Localized prompts per specialty

---

### 9.16 Video Generation
- **What:** AI-generated videos (Synthesia, Runway)
- **Technologies:** Video generation APIs
- **MVP Reason:** Complex, low priority for MVP

---

## Phase 2H: Integrations & Partnerships

### 9.17 EMR/HIS Integration
- **What:** Integrate with clinic management systems
- **Partners:** Practo, Credihealth, NeedyMeds
- **MVP Reason:** B2B feature; MVP focused on standalone SaaS

---

### 9.18 CRM Integration
- **What:** Sync contacts, patient lists
- **Platforms:** HubSpot, Salesforce, Zoho

---

## Phase 2 Development Timeline

```
Phase 2A: Social Media (Q3)  — 3 weeks
  ├─ Instagram & Facebook
  └─ LinkedIn

Phase 2B: Content Enhancement (Q3) — 2 weeks
  ├─ Canva integration
  └─ Advanced image generation

Phase 2C: Teams (Q3/Q4) — 3 weeks
  ├─ Multi-doctor accounts
  └─ Approval workflows

Phase 2D: Mobile (Q4) — 4 weeks
  ├─ iOS app
  └─ Android app

Phase 2E: Analytics (Q4) — 3 weeks
  ├─ Content performance
  └─ User behavior

Phase 2F: Payment (Q4) — 3 weeks
  ├─ Stripe integration
  ├─ Coupons
  └─ Usage-based billing

Phase 2G: AI Enhancements (Q4) — 3 weeks
  ├─ Content optimization
  ├─ Multi-language
  └─ Video generation

TOTAL: ~21 WEEKS (5+ MONTHS)
```

---

## Reason: Why These Are Phase 2

| Feature | Why Not MVP |
|---------|------------|
| Social Posting | Adds UI complexity; manual posting works |
| Canva | Nice-to-have; independent tool exists |
| Teams | Target single doctor first; validate product |
| Mobile App | Web app sufficient; mobile adds dev cost |
| Advanced Analytics | Requires social integration first |
| Payment | Manual invoicing works for MVP |
| Multi-language | Hindi support Phase 2; English MVP |
| Video | High complexity, low user demand |
| EMR Integration | B2B feature; MVP is B2C SaaS |

---

# SECTION 10 — DEPLOYMENT & INFRASTRUCTURE

## Production Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Users (Web Browser)                         │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│         Frontend (Vercel / Netlify)                             │
│  ├─ React 19 + TypeScript (SPA)                                │
│  ├─ TanStack Router + Query                                    │
│  ├─ Tailwind CSS + Radix UI                                   │
│  ├─ Served from CDN globally                                  │
│  └─ Environment: .env.production                              │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS API Calls
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│         Backend (Optional: Express on Railway/Fly.io)           │
│  ├─ Node.js + Express.js                                       │
│  ├─ Authentication middleware                                  │
│  ├─ AI integration layer (Gemini, Stable Diffusion)           │
│  ├─ Request validation & error handling                        │
│  ├─ Rate limiting, logging, monitoring                         │
│  └─ Horizontal scaling (multiple instances)                    │
│                                                                  │
│  OR: Use Supabase REST API directly (simpler for MVP)          │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
   ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐
   │  Supabase   │  │  Supabase    │  │  Supabase         │
   │             │  │              │  │  Storage (CDN)    │
   │ - Auth      │  │ - PostgreSQL │  │                   │
   │ - API       │  │ - Backups    │  │ - Brand Kit Images│
   │ - Real-time │  │ - Monitoring │  │ - Generated Images│
   └─────────────┘  └──────────────┘  └───────────────────┘
        
        ┌────────────────────┬────────────────────┐
        ▼                    ▼                    ▼
   ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐
   │  Google     │  │  Replicate   │  │  Sentry / PostHog │
   │  Gemini API │  │  (Stable     │  │                   │
   │             │  │   Diffusion) │  │  Error Tracking & │
   │ - Text Gen  │  │              │  │  Event Analytics  │
   │ - Streaming │  │ - Image Gen  │  │                   │
   └─────────────┘  └──────────────┘  └───────────────────┘
```

---

## Deployment Strategy

### Frontend Deployment (Vercel)

```yaml
# vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "REACT_APP_API_URL": "@api_url_prod",
    "REACT_APP_ENVIRONMENT": "production"
  },
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html",
      "status": 200
    }
  ]
}
```

**Steps:**
1. Push to GitHub main branch
2. Vercel auto-deploys on every commit
3. URL: https://medipost.ai
4. Auto-generates preview URLs for PR reviews
5. Automatic rollback available

**Benefits:**
- Zero downtime deployments
- Global CDN
- Automatic SSL/HTTPS
- Built-in environment variables

---

### Backend Deployment (Railway / Fly.io)

**Option 1: Railway** (Recommended)
```yaml
# railway.json
{
  "buildCommand": "npm install && npm run build",
  "startCommand": "npm start",
  "env": {
    "DATABASE_URL": "${{DATABASE_URL}}",
    "GOOGLE_GEMINI_API_KEY": "${{GEMINI_KEY}}",
    "NODE_ENV": "production"
  }
}
```

**Steps:**
1. Connect GitHub repo
2. Railway auto-deploys on commit
3. Auto-scaling based on load
4. Automatic backups

---

**Option 2: Fly.io**
```toml
# fly.toml
[app]
primary_region = "del"
[[services]]
internal_port = 3000
protocol = "tcp"
```

**Features:**
- Global edge deployment (faster latency)
- Automatic HTTPS
- Built-in monitoring

---

### Database (Supabase PostgreSQL)

**Automatic Backups:**
- Daily backups (1 week retention)
- Point-in-time recovery available
- Auto-scaling storage

**Monitoring:**
- Built-in database monitoring
- Query performance insights
- Connection pooling

---

## Environment Configuration

### Frontend (.env.production)
```env
REACT_APP_API_URL=https://api.medipost.ai/v1
REACT_APP_SUPABASE_URL=https://xxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGc...
REACT_APP_ENVIRONMENT=production
REACT_APP_LOG_LEVEL=error
```

### Backend (.env.production)
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@db.supabase.co:5432/postgres
GOOGLE_GEMINI_API_KEY=sk-xxx...
REPLICATE_API_KEY=r8_xxx...
JWT_SECRET=very-long-random-key-32-chars-min
SENTRY_DSN=https://xxx@sentry.io/xxx
CORS_ORIGIN=https://medipost.ai
REDIS_URL=redis://cache.redis.render.com:6380
API_PORT=3000
```

---

## CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Unit tests
        run: npm run test
      
      - name: Build
        run: npm run build
      
      - name: Integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: vercel/action@v4
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
      
      - name: Deploy backend to Railway
        run: |
          npm install -g @railway/cli
          railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
      
      - name: Run smoke tests
        run: npm run test:smoke
        env:
          BASE_URL: https://medipost.ai
          API_URL: https://api.medipost.ai/v1
      
      - name: Slack notification
        uses: slackapi/slack-github-action@v1
        if: always()
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "Deployment ${{ job.status }}",
              "blocks": [{
                "type": "section",
                "text": {
                  "type": "mrkdwn",
                  "text": "*Medipost AI Deploy*\nStatus: ${{ job.status }}\nCommit: ${{ github.sha }}"
                }
              }]
            }
```

---

## Monitoring & Alerting

### Health Checks

```typescript
// Backend health check endpoint
app.get("/health", async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    gemini_api: await checkGeminiAPI(),
    storage: await checkStorage(),
  };
  
  const allHealthy = Object.values(checks).every(c => c.healthy);
  
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? "healthy" : "degraded",
    checks,
    timestamp: new Date()
  });
});
```

### Monitoring with Sentry

```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

app.use(Sentry.Handlers.errorHandler());
```

**Alerts:**
- Error rate > 5%
- Response time > 5s (p95)
- Database connection errors
- AI API failures
- Storage errors

---

## Scaling Strategy

### MVP (0-1,000 users)
- Single Supabase project
- Single backend instance
- Shared database
- Estimated cost: $50-100/month

### Growth (1,000-10,000 users)
- Multiple backend instances (load balanced)
- Database read replicas
- Redis for caching
- CDN for static assets
- Estimated cost: $300-500/month

### Scale (10,000+ users)
- Multi-region deployment
- Database sharding
- Microservices architecture
- Dedicated Kubernetes cluster
- Estimated cost: $2,000+/month

---

## Disaster Recovery

### RTO/RPO Targets
- RTO (Recovery Time Objective): 1 hour
- RPO (Recovery Point Objective): 15 minutes

### Backup Strategy
1. **Database:** Daily automated backups (Supabase)
2. **Files:** Versioned storage with 30-day retention
3. **Code:** Backed up to GitHub (infinite retention)

### Disaster Recovery Plan

```
SCENARIO: Database corruption
├─ Detection (Sentry alert)
├─ Impact: Generate API down
├─ Recovery Steps:
│  1. Restore from yesterday's backup (15 min)
│  2. Replay transactions from logs (30 min)
│  3. Verify data integrity (10 min)
│  4. Re-deploy backend (5 min)
└─ Total RTO: 1 hour

SCENARIO: Backend crash
├─ Detection (Health check fails)
├─ Recovery Steps:
│  1. Auto-restart on Railway (1 min)
│  2. Manual rollback if needed (5 min)
└─ Total RTO: 5 minutes

SCENARIO: Data breach
├─ Detection: Security scan or report
├─ Response:
│  1. Take affected service offline
│  2. Notify affected users
│  3. Rotate credentials
│  4. Deploy fix
│  5. Re-enable service
└─ Total RTO: 4 hours (worst case)
```

---

## Production Checklist

Before launching to production:

- [ ] All tests passing (unit, integration, e2e)
- [ ] API documentation complete
- [ ] Database indexes optimized
- [ ] Error handling in place
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] SSL/HTTPS enforced
- [ ] Environment variables set
- [ ] Monitoring & alerting active
- [ ] Backup strategy verified
- [ ] CDN configured
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Legal: Privacy policy updated
- [ ] Legal: Terms of service finalized
- [ ] Support system configured
- [ ] Runbooks written for common issues
- [ ] On-call rotation established

---

## Cost Projection

### Monthly Costs (MVP)

| Service | Estimated Cost | Notes |
|---------|---------------|-------|
| Supabase | $25 | Pro plan: 50GB storage, auto-scaling |
| Vercel | Free | Hobby plan (included) |
| Railway | $40 | Starter backend, auto-scaling |
| Gemini API | $50 | ~10,000 generations/month |
| Stable Diffusion | $20 | ~500 images/month |
| Sentry | Free | Free tier sufficient for MVP |
| Domain | $12 | .ai domain |
| Email (SendGrid) | Free | Free tier: 100 emails/day |
| **Total** | **~$147/month** | |

### Scaling Costs (10,000 users)

| Service | Estimated Cost | Notes |
|---------|---------------|-------|
| Supabase | $150 | Scale with usage |
| Backend | $300 | Multiple instances |
| Gemini API | $2,000 | 500,000+ generations |
| Storage | $100 | CDN, more images |
| **Total** | **~$2,550/month** | |

---

## Production Go-Live Checklist

```
DAY -3: Staging Testing
├─ Full E2E test suite
├─ Load testing (1,000 concurrent users)
├─ Failover testing
└─ Team sign-off

DAY -1: Pre-launch
├─ Final data migration
├─ Backup verification
├─ Monitoring verification
├─ Team on-call briefing
└─ Status page setup

DAY 0: Launch
├─ 8am: Team standup
├─ 9am: Deploy to production
├─ 9:30am: Smoke tests
├─ 10am: Open for users (private link)
├─ 2pm: Public announcement
└─ Team monitoring 24/7

DAY +1: Post-launch
├─ Monitor metrics closely
├─ Address any issues immediately
├─ Collect user feedback
└─ Celebrate! 🎉
```

---

# CONCLUSION

This specification provides a complete roadmap for building Medipost AI's MVP backend. The document covers:

✅ **MVP Features:** 8 core features with detailed specifications  
✅ **Tech Stack:** Recommendation for Supabase (fastest path to market)  
✅ **Database Design:** 10 tables with relationships, constraints, and retention policies  
✅ **Storage:** Image handling for brand kit & generated content  
✅ **API Design:** 40+ endpoints with request/response examples  
✅ **AI Integration:** Gemini + Stable Diffusion with error handling  
✅ **Authentication:** Complete flow from registration to logout  
✅ **Development Order:** Week-by-week implementation roadmap (7 weeks to launch)  
✅ **Future Features:** 16+ Phase 2 features deferred for post-MVP  
✅ **Deployment:** Production architecture, CI/CD, monitoring, disaster recovery  

---

## Next Steps

1. **Week 1:** Set up Supabase, create database schema, start authentication implementation
2. **Week 2:** Complete authentication, integrate with frontend
3. **Weeks 3-5:** Build brand kit, content generation, history management
4. **Weeks 6-7:** Admin dashboard, testing, deployment

**Estimated Launch Date:** 7 weeks from start of development  
**Estimated Initial Cost:** $150/month (MVP)  
**Estimated Initial Team:** 2-3 backend engineers, 1-2 frontend engineers, 1 DevOps engineer

---

**Document Status:** ✅ Ready for Development  
**Last Updated:** June 21, 2025  
**Version:** 1.0 (MVP Specification)

