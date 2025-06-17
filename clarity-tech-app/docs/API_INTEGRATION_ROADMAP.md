# Clarity Pool Platform - API Integration Roadmap

## 🚀 Overview

This document outlines the complete API integration strategy for the Clarity Pool Platform, prioritized by business impact and technical dependencies. Each endpoint includes implementation status, code location, and integration markers for easy tracking.

---

## 🔴 PRIORITY 1: Core Functionality (Week 1-2)
*Essential for MVP launch - blocking all other features*

### Technician Authentication
**Business Impact:** Critical - Cannot function without secure auth  
**Implementation Status:** Mock ready, API integration pending

- [ ] **POST /api/auth/technician/login**
  - Purpose: Secure technician login with JWT tokens
  - Payload: `{ email, password, deviceId }`
  - Response: `{ user, token, refreshToken }`
  - Location: `src/services/api/auth.ts:24`
  - Integration Marker: `[API-INTEGRATION: Auth - Priority 1]`
  - Dependencies: None
  - Test Account: `test@claritypool.com` / `test123`

- [ ] **POST /api/auth/technician/register**
  - Purpose: New technician onboarding
  - Payload: `{ email, password, firstName, lastName, phone, licenseNumber }`
  - Response: `{ user, token, refreshToken }`
  - Location: `src/services/api/auth.ts`
  - Integration Marker: `[API-INTEGRATION: Auth - Priority 1]`
  - Dependencies: Background check API, license verification

- [ ] **POST /api/auth/technician/refresh**
  - Purpose: Silent token refresh for security
  - Payload: `{ refreshToken }`
  - Response: `{ token, refreshToken? }`
  - Location: `src/services/api/auth.ts:32`
  - Integration Marker: `[API-INTEGRATION: Auth - Priority 1]`
  - Dependencies: None

- [ ] **POST /api/auth/technician/logout**
  - Purpose: Secure session termination
  - Payload: `{ refreshToken }`
  - Response: `{ success: true }`
  - Location: `src/services/api/auth.ts:27`
  - Integration Marker: `[API-INTEGRATION: Auth - Priority 1]`
  - Dependencies: None

### Offer Management System
**Business Impact:** Critical - Core revenue driver  
**Implementation Status:** Full context implementation complete, API integration pending

- [ ] **GET /api/offers/technician/:techId**
  - Purpose: Fetch route-based offers with 30-min expiry
  - Query: `?lat=25.7617&lng=-80.1918&radius=50`
  - Response: `{ offers: Offer[], total: number }`
  - Location: `src/contexts/OfferContext.tsx:415`
  - Integration Marker: `[API-INTEGRATION: Offers - Priority 1]`
  - Dependencies: Route optimization algorithm, proximity calculation
  - Algorithm: `Score = (0.6 * (1/distance)) + (0.4 * rating)`

- [ ] **POST /api/offers/:id/accept**
  - Purpose: Accept onboarding offer with optimistic updates
  - Payload: `{ acceptedAt: Date, deviceId: string }`
  - Response: `{ success: true, scheduledFor: Date }`
  - Location: `src/contexts/OfferContext.tsx:220`
  - Integration Marker: `[API-INTEGRATION: Offers - Priority 1]`
  - Dependencies: Poolbrain job creation, calendar sync
  - Rollback: 2-minute undo window implemented

- [ ] **POST /api/offers/:id/decline**
  - Purpose: Decline offer and remove from queue
  - Payload: `{ reason?: string, declinedAt: Date }`
  - Response: `{ success: true }`
  - Location: `src/contexts/OfferContext.tsx:260`
  - Integration Marker: `[API-INTEGRATION: Offers - Priority 1]`
  - Dependencies: None

- [ ] **POST /api/offers/:id/undo**
  - Purpose: Undo acceptance within 2-minute window
  - Payload: `{ undoReason?: string }`
  - Response: `{ success: true, returnedToPending: boolean }`
  - Location: `src/contexts/OfferContext.tsx:285`
  - Integration Marker: `[API-INTEGRATION: Offers - Priority 1]`
  - Dependencies: Poolbrain job cancellation
  - Business Rule: Only available for 120 seconds post-acceptance

### Onboarding Session Management
**Business Impact:** Critical - Core service delivery  
**Implementation Status:** UI complete, API integration pending

- [ ] **GET /api/onboarding/sessions/technician/:techId**
  - Purpose: Fetch today's scheduled onboarding sessions
  - Query: `?date=2024-06-13&status=pending,in_progress`
  - Response: `{ sessions: OnboardingSession[], total: number }`
  - Location: `src/services/api/onboarding.ts`
  - Integration Marker: `[API-INTEGRATION: Onboarding - Priority 1]`
  - Dependencies: Poolbrain schedule sync

- [ ] **GET /api/onboarding/sessions/:sessionId**
  - Purpose: Get detailed session information
  - Response: `{ session: OnboardingSession, customer: Customer }`
  - Location: `src/services/api/onboarding.ts`
  - Integration Marker: `[API-INTEGRATION: Onboarding - Priority 1]`
  - Dependencies: Customer data sync

- [ ] **PUT /api/onboarding/sessions/:sessionId/start**
  - Purpose: Mark session as started with GPS verification
  - Payload: `{ startedAt: Date, location: GeoLocation }`
  - Response: `{ success: true, session: OnboardingSession }`
  - Location: `src/screens/onboarding/StartScreen.tsx`
  - Integration Marker: `[API-INTEGRATION: Onboarding - Priority 1]`
  - Dependencies: GPS verification, geofencing

- [ ] **PUT /api/onboarding/sessions/:sessionId/complete**
  - Purpose: Complete session and trigger report generation
  - Payload: `{ completedAt: Date, duration: number }`
  - Response: `{ success: true, reportId: string }`
  - Location: `src/screens/onboarding/CompletionScreen.tsx`
  - Integration Marker: `[API-INTEGRATION: Onboarding - Priority 1]`
  - Dependencies: AI report generation, customer notification

---

## 🟡 PRIORITY 2: Data Collection & AI (Week 3)
*Enhanced data capture and intelligent processing*

### Onboarding Data Collection
**Business Impact:** High - Enables AI insights and customer value  
**Implementation Status:** Forms complete, file upload pending

- [ ] **PUT /api/onboarding/sessions/:sessionId/water-chemistry**
  - Purpose: Submit water test results
  - Payload: `{ waterChemistry: WaterChemistry, testedAt: Date }`
  - Response: `{ success: true, recommendations?: string[] }`
  - Location: `src/screens/onboarding/WaterChemistryStep.tsx`
  - Integration Marker: `[API-INTEGRATION: Onboarding - Priority 2]`
  - Dependencies: AI recommendation engine

- [ ] **PUT /api/onboarding/sessions/:sessionId/equipment**
  - Purpose: Submit equipment inventory and conditions
  - Payload: `{ equipment: Equipment[], notes?: string }`
  - Response: `{ success: true, repairEstimates?: RepairEstimate[] }`
  - Location: `src/screens/onboarding/EquipmentStep.tsx`
  - Integration Marker: `[API-INTEGRATION: Onboarding - Priority 2]`
  - Dependencies: Equipment database, pricing API

- [ ] **PUT /api/onboarding/sessions/:sessionId/pool-details**
  - Purpose: Submit pool specifications and measurements
  - Payload: `{ poolDetails: PoolDetails, measuredAt: Date }`
  - Response: `{ success: true, volumeCalculation: number }`
  - Location: `src/screens/onboarding/PoolDetailsStep.tsx`
  - Integration Marker: `[API-INTEGRATION: Onboarding - Priority 2]`
  - Dependencies: Volume calculation service

- [ ] **POST /api/onboarding/sessions/:sessionId/photos**
  - Purpose: Upload and analyze equipment/pool photos
  - Payload: `FormData with images and metadata`
  - Response: `{ success: true, uploadedFiles: FileRef[], analysis?: AIAnalysis }`
  - Location: `src/screens/onboarding/PhotoCaptureStep.tsx`
  - Integration Marker: `[API-INTEGRATION: Onboarding - Priority 2]`
  - Dependencies: Cloud storage, Gemini Vision API

- [ ] **POST /api/onboarding/sessions/:sessionId/voice-note**
  - Purpose: Upload voice memo with automatic transcription
  - Payload: `FormData with audio file`
  - Response: `{ success: true, fileId: string, transcription?: string }`
  - Location: `src/screens/onboarding/VoiceNoteStep.tsx`
  - Integration Marker: `[API-INTEGRATION: Onboarding - Priority 2]`
  - Dependencies: Audio processing, transcription service

### AI Integration Services
**Business Impact:** High - Competitive differentiation through intelligence  
**Implementation Status:** Not started, high complexity

- [ ] **POST /api/ai/analyze-equipment-photo**
  - Purpose: Gemini Vision analysis of equipment condition
  - Payload: `{ image: base64, equipment_type: string }`
  - Response: `{ condition: string, issues: string[], confidence: number }`
  - Location: `src/services/ai/visionAnalysis.ts`
  - Integration Marker: `[API-INTEGRATION: AI - Priority 2]`
  - Dependencies: Gemini Vision API, equipment training data
  - Cost: ~$0.002 per image

- [ ] **POST /api/ai/transcribe-voice**
  - Purpose: Convert voice memos to structured notes
  - Payload: `{ audio: base64, duration: number }`
  - Response: `{ transcription: string, summary: string, tags: string[] }`
  - Location: `src/services/ai/transcription.ts`
  - Integration Marker: `[API-INTEGRATION: AI - Priority 2]`
  - Dependencies: Claude/Whisper API
  - Cost: ~$0.01 per minute

- [ ] **POST /api/ai/generate-report**
  - Purpose: Claude-generated comprehensive onboarding report
  - Payload: `{ sessionData: OnboardingData, template: string }`
  - Response: `{ report: string, recommendations: string[], priority_items: string[] }`
  - Location: `src/services/ai/reportGeneration.ts`
  - Integration Marker: `[API-INTEGRATION: AI - Priority 2]`
  - Dependencies: Claude API, report templates
  - Cost: ~$0.50 per report

- [ ] **POST /api/ai/generate-pricing**
  - Purpose: AI-powered repair and service pricing
  - Payload: `{ equipment: Equipment[], issues: string[], location: GeoLocation }`
  - Response: `{ estimates: PricingEstimate[], total_range: { min: number, max: number } }`
  - Location: `src/services/ai/pricingEngine.ts`
  - Integration Marker: `[API-INTEGRATION: AI - Priority 2]`
  - Dependencies: Claude API, pricing database, market data
  - Cost: ~$0.10 per estimate

---

## 🟢 PRIORITY 3: Platform Features (Week 4)
*Enhanced technician experience and engagement*

### Technician Dashboard & Profile
**Business Impact:** Medium - Improves retention and performance  
**Implementation Status:** Basic UI, detailed features pending

- [ ] **GET /api/technician/profile**
  - Purpose: Comprehensive technician profile and stats
  - Response: `{ profile: TechProfile, stats: PerformanceStats, certifications: Cert[] }`
  - Location: `src/screens/profile/ProfileScreen.tsx`
  - Integration Marker: `[API-INTEGRATION: Profile - Priority 3]`
  - Dependencies: Performance calculation service

- [ ] **GET /api/technician/earnings**
  - Purpose: Detailed earnings breakdown and projections
  - Query: `?period=week,month,year&year=2024`
  - Response: `{ earnings: EarningsData, projections: ProjectionData }`
  - Location: `src/screens/profile/EarningsScreen.tsx`
  - Integration Marker: `[API-INTEGRATION: Profile - Priority 3]`
  - Dependencies: Payroll system integration

- [ ] **GET /api/technician/ratings**
  - Purpose: Customer ratings and feedback analysis
  - Query: `?limit=50&offset=0`
  - Response: `{ ratings: Rating[], average: number, trends: TrendData }`
  - Location: `src/screens/profile/RatingsScreen.tsx`
  - Integration Marker: `[API-INTEGRATION: Profile - Priority 3]`
  - Dependencies: Customer feedback system

- [ ] **GET /api/technician/performance**
  - Purpose: Performance metrics and improvement suggestions
  - Query: `?period=30d`
  - Response: `{ metrics: PerformanceMetrics, suggestions: ImprovementSuggestion[] }`
  - Location: `src/screens/profile/PerformanceScreen.tsx`
  - Integration Marker: `[API-INTEGRATION: Profile - Priority 3]`
  - Dependencies: Analytics engine, ML recommendations

### Push Notification System
**Business Impact:** Medium - Critical for real-time engagement  
**Implementation Status:** Infrastructure ready, backend integration pending

- [ ] **POST /api/notifications/register-token**
  - Purpose: Register device for push notifications
  - Payload: `{ token: string, platform: 'ios'|'android'|'web', preferences: NotificationPrefs }`
  - Response: `{ success: true, registered: boolean }`
  - Location: `src/services/pushNotifications.ts:95`
  - Integration Marker: `[API-INTEGRATION: Push - Priority 3]`
  - Dependencies: FCM/APNs setup, notification service

- [ ] **POST /api/notifications/update-preferences**
  - Purpose: Update notification preferences and schedules
  - Payload: `{ preferences: NotificationPrefs, quietHours: TimeRange }`
  - Response: `{ success: true, updated: NotificationPrefs }`
  - Location: `src/screens/profile/NotificationSettings.tsx`
  - Integration Marker: `[API-INTEGRATION: Push - Priority 3]`
  - Dependencies: Preference management service

- [ ] **Notification Triggers**
  - New offers available (immediate)
  - Offer expiring in 5 minutes
  - Session starting in 30 minutes
  - Payment processed
  - New customer rating received
  - Location: Various trigger points throughout app
  - Integration Marker: `[API-INTEGRATION: Push - Priority 3]`

---

## 🔵 PRIORITY 4: Poolbrain Integration (Week 5)
*Third-party service management platform integration*

### Route Management
**Business Impact:** High - Enables efficient scheduling and routing  
**Implementation Status:** Mock data ready, integration complex

- [ ] **GET /api/poolbrain/technicians/:id/routes**
  - Purpose: Fetch weekly route schedules and optimization
  - Query: `?week=2024-W24&include_alternates=true`
  - Response: `{ routes: RouteData[], optimization_score: number }`
  - Location: `src/services/poolbrain/routes.ts`
  - Integration Marker: `[API-INTEGRATION: Poolbrain - Priority 4]`
  - Dependencies: Poolbrain API credentials, webhook setup

- [ ] **GET /api/poolbrain/routes/:id/stops**
  - Purpose: Detailed stop information for route planning
  - Response: `{ stops: RouteStop[], total_distance: number, estimated_duration: number }`
  - Location: `src/services/poolbrain/routes.ts`
  - Integration Marker: `[API-INTEGRATION: Poolbrain - Priority 4]`
  - Dependencies: Route optimization service

- [ ] **POST /api/poolbrain/jobs**
  - Purpose: Create new onboarding job in Poolbrain system
  - Payload: `{ customer_id: string, service_type: 'onboarding', scheduled_for: Date }`
  - Response: `{ job_id: string, scheduled: boolean, route_updated: boolean }`
  - Location: `src/contexts/OfferContext.tsx:225`
  - Integration Marker: `[API-INTEGRATION: Poolbrain - Priority 4]`
  - Dependencies: Poolbrain job creation API, customer sync

### Customer Data Synchronization
**Business Impact:** High - Ensures data consistency across platforms  
**Implementation Status:** Data models ready, sync logic pending

- [ ] **POST /api/poolbrain/customers**
  - Purpose: Create customer record in Poolbrain
  - Payload: `{ customer: Customer, pool_details: PoolDetails }`
  - Response: `{ poolbrain_customer_id: string, synced: boolean }`
  - Location: `src/services/poolbrain/customers.ts`
  - Integration Marker: `[API-INTEGRATION: Poolbrain - Priority 4]`
  - Dependencies: Customer data validation, duplicate detection

- [ ] **PUT /api/poolbrain/customers/:id/pool-details**
  - Purpose: Update pool specifications in Poolbrain
  - Payload: `{ pool_details: PoolDetails, equipment: Equipment[] }`
  - Response: `{ success: true, updated_fields: string[] }`
  - Location: `src/services/poolbrain/customers.ts`
  - Integration Marker: `[API-INTEGRATION: Poolbrain - Priority 4]`
  - Dependencies: Field mapping, data transformation

- [ ] **POST /api/poolbrain/service-records**
  - Purpose: Create service record after onboarding completion
  - Payload: `{ session_id: string, services_performed: string[], notes: string }`
  - Response: `{ record_id: string, next_service_date: Date }`
  - Location: `src/screens/onboarding/CompletionScreen.tsx`
  - Integration Marker: `[API-INTEGRATION: Poolbrain - Priority 4]`
  - Dependencies: Service mapping, scheduling logic

---

## ⚪ PRIORITY 5: Customer App APIs (Phase 2)
*Future customer-facing features - not blocking technician MVP*

### Customer Experience Features
**Business Impact:** Medium - Revenue expansion through customer engagement  
**Implementation Status:** Future phase, spec only

- [ ] **GET /api/customer/onboarding-status**
  - Purpose: Real-time onboarding progress for customers
  - Response: `{ status: string, estimated_completion: Date, technician: PublicTechInfo }`
  - Location: Future customer app
  - Integration Marker: `[API-INTEGRATION: Customer - Priority 5]`
  - Dependencies: Customer portal, real-time updates

- [ ] **GET /api/customer/reports/:id**
  - Purpose: Access to onboarding reports and recommendations
  - Response: `{ report: CustomerReport, photos: string[], recommendations: string[] }`
  - Location: Future customer app
  - Integration Marker: `[API-INTEGRATION: Customer - Priority 5]`
  - Dependencies: Report formatting, customer portal auth

- [ ] **POST /api/customer/repairs/approve**
  - Purpose: Approve repair work and pricing
  - Payload: `{ repair_id: string, approved: boolean, payment_method: string }`
  - Response: `{ success: true, scheduled_date: Date }`
  - Location: Future customer app
  - Integration Marker: `[API-INTEGRATION: Customer - Priority 5]`
  - Dependencies: Payment processing, scheduling system

- [ ] **POST /api/customer/membership/select**
  - Purpose: Choose ongoing service membership plan
  - Payload: `{ plan_id: string, billing_cycle: string, auto_renew: boolean }`
  - Response: `{ success: true, membership_id: string, next_billing: Date }`
  - Location: Future customer app
  - Integration Marker: `[API-INTEGRATION: Customer - Priority 5]`
  - Dependencies: Subscription management, billing system

- [ ] **Additional Customer Features:**
  - Digital agreement signing
  - Payment authorization and management
  - Weekly pool health insights
  - Invoice access and payment
  - Chat/messaging with technician
  - Service scheduling and rescheduling

---

## 🔧 UI ENHANCEMENTS TO RESTORE

### Timer Displays (HIGH PRIORITY - This Week)
**Business Impact:** High - User experience and urgency communication  
**Implementation Status:** Temporarily removed due to React re-render issues

- [ ] **Offer expiration countdown (30 min visual timer)**
  - Purpose: Show real-time countdown until offer expires
  - Requirement: Update every second without causing re-renders
  - Location: `src/components/dashboard/EnhancedOfferModal.tsx`
  - Integration Marker: `[UI-FIX: Timers - Temporarily removed to fix crash]`
  - Status: Core functionality works, visual timers need restoration
  - Technical Challenge: Fix useEffect dependency issues causing infinite renders

- [ ] **Undo countdown (2 min visual timer)**
  - Purpose: Show remaining time to undo offer acceptance
  - Requirement: Visual countdown for 2-minute window
  - Location: `src/components/dashboard/EnhancedOfferModal.tsx`
  - Integration Marker: `[UI-FIX: Timers - Temporarily removed to fix crash]`
  - Status: Core functionality works, visual timers need restoration
  - Technical Challenge: Integrate with acceptance timestamp from context

- [ ] **Fix React re-render issues with timers**
  - Purpose: Implement timers without infinite render loops
  - Solutions: Use useRef for timer state, proper useEffect dependencies
  - Location: `src/components/dashboard/EnhancedOfferModal.tsx`
  - Integration Marker: `[UI-FIX: Timers - Temporarily removed to fix crash]`
  - Status: Research needed for React timer best practices
  - Alternative: Move timer logic to custom hook

### Timer Implementation Strategy
1. **Create custom useTimer hook** - Encapsulate timer logic
2. **Use useRef for timer state** - Avoid re-render triggers
3. **Implement proper cleanup** - Prevent memory leaks
4. **Add visual progress indicators** - Circular progress or countdown text
5. **Test with React DevTools** - Ensure no infinite renders

### Success Metrics
- **Timer accuracy** - ±1 second precision
- **No performance impact** - <1ms render time
- **Zero crashes** - No infinite render loops
- **User clarity** - Clear visual countdown indicators

---

## 📊 Integration Tracking System

### Search Markers
Use these markers to find integration points in the codebase:

**API Integration Markers:**
- `[API-INTEGRATION: Auth - Priority 1]` - Authentication endpoints
- `[API-INTEGRATION: Offers - Priority 1]` - Offer management system
- `[API-INTEGRATION: Onboarding - Priority 1]` - Core onboarding flow
- `[API-INTEGRATION: Onboarding - Priority 2]` - Data collection features
- `[API-INTEGRATION: AI - Priority 2]` - AI processing services
- `[API-INTEGRATION: Profile - Priority 3]` - Technician features
- `[API-INTEGRATION: Push - Priority 3]` - Push notifications
- `[API-INTEGRATION: Poolbrain - Priority 4]` - Third-party integration
- `[API-INTEGRATION: Customer - Priority 5]` - Future customer features

**UI Enhancement Markers:**
- `[UI-FIX: Timers - Temporarily removed to fix crash]` - Timer display issues

### NPM Scripts for Tracking
```bash
npm run todo:api          # Find all API integration points
npm run todo:priority     # Find specific priority items
npm run todo:auth         # Find authentication integrations
npm run todo:ai           # Find AI integration points
npm run todo:ui           # Find UI enhancement issues
npm run todo:all          # Comprehensive overview
```

### Integration Status Legend
- ✅ **Complete** - Fully integrated and tested
- 🟡 **In Progress** - Implementation started
- 🔴 **Blocked** - Waiting on dependencies
- ⚪ **Not Started** - Future development
- 🧪 **Mock Ready** - Mock implementation complete

---

## 🚨 Critical Dependencies

### External Services Required
1. **Poolbrain API Access** - Route management and customer sync
2. **Gemini Vision API** - Equipment photo analysis
3. **Claude API** - Report generation and transcription
4. **Push Notification Service** - FCM/APNs setup
5. **Cloud Storage** - Photo and audio file storage
6. **Payment Processing** - Stripe/Square integration

### Infrastructure Requirements
1. **Database** - PostgreSQL for persistent data
2. **Redis** - Session management and caching
3. **Background Jobs** - Queue processing for AI tasks
4. **File Storage** - S3-compatible storage for media
5. **Monitoring** - Error tracking and performance monitoring

### Security Considerations
1. **API Authentication** - JWT with refresh token rotation
2. **Data Encryption** - End-to-end for sensitive customer data
3. **PCI Compliance** - For payment information handling
4. **GDPR Compliance** - For customer data protection
5. **Audit Logging** - All API interactions tracked

---

## 📈 Success Metrics

### Technical Metrics
- API response time < 500ms (95th percentile)
- 99.9% uptime for Priority 1 endpoints
- < 1% error rate across all integrations
- Successful offline sync rate > 98%

### Business Metrics
- Offer acceptance rate > 70%
- Session completion rate > 95%
- Average onboarding time < 45 minutes
- Customer satisfaction score > 4.5/5

### Performance Targets
- App startup time < 3 seconds
- Photo upload time < 10 seconds
- Report generation time < 30 seconds
- Real-time updates < 2 seconds

---

*Last Updated: December 2024*  
*Next Review: Weekly during development*