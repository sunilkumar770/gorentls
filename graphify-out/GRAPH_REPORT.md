# Graph Report - .  (2026-04-11)

## Corpus Check
- 148 files · ~53,138 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1258 nodes · 1408 edges · 61 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `Listing` - 43 edges
2. `Builder` - 40 edges
3. `BusinessOwner` - 35 edges
4. `OwnerRegistrationRequest` - 31 edges
5. `Booking` - 31 edges
6. `UserProfile` - 29 edges
7. `User` - 26 edges
8. `ListingRequest` - 23 edges
9. `Conversation` - 23 edges
10. `AdminService` - 23 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities

### Community 0 - "Community 0"
Cohesion: 0.02
Nodes (13): AdminAuditLogRepository, adminSignIn(), setToken(), signIn(), signUp(), ListingResponse, createListing(), getListing() (+5 more)

### Community 1 - "Community 1"
Cohesion: 0.03
Nodes (6): BookingRepository, PaymentController, PaymentInitiateRequest, Builder, PaymentService, PaymentVerificationRequest

### Community 2 - "Community 2"
Cohesion: 0.03
Nodes (8): BookingStatistics, CategoryStat, CityStat, GrowthStatistics, MonthlyStat, PlatformAnalytics, RevenueStatistics, UserStatistics

### Community 3 - "Community 3"
Cohesion: 0.04
Nodes (11): AuthResponse, Builder, ErrorResponse, GlobalExceptionHandler, KYCSubmissionRequest, SuccessResponse, UpdateProfileRequest, UpdateSettingsRequest (+3 more)

### Community 4 - "Community 4"
Cohesion: 0.05
Nodes (3): Conversation, ConversationRepository, ConversationResponse

### Community 5 - "Community 5"
Cohesion: 0.05
Nodes (1): Listing

### Community 6 - "Community 6"
Cohesion: 0.05
Nodes (2): BusinessOwner, BusinessOwnerRepository

### Community 7 - "Community 7"
Cohesion: 0.05
Nodes (4): BookingController, BookingRequest, BookingResponse, UserResponse

### Community 8 - "Community 8"
Cohesion: 0.05
Nodes (1): Builder

### Community 9 - "Community 9"
Cohesion: 0.05
Nodes (2): Builder, BusinessOwnerResponse

### Community 10 - "Community 10"
Cohesion: 0.07
Nodes (3): Message, MessageRepository, MessageResponse

### Community 11 - "Community 11"
Cohesion: 0.08
Nodes (5): ConversationController, MessageController, ReadRequest, MessageService, SendMessageRequest

### Community 12 - "Community 12"
Cohesion: 0.07
Nodes (6): AuthChannelInterceptor, AuthController, AuthService, JwtAuthenticationFilter, SecurityConfig, WebSocketConfig

### Community 13 - "Community 13"
Cohesion: 0.06
Nodes (2): ListingController, ListingRequest

### Community 14 - "Community 14"
Cohesion: 0.06
Nodes (2): AdminDashboardStats, Builder

### Community 15 - "Community 15"
Cohesion: 0.06
Nodes (1): OwnerRegistrationRequest

### Community 16 - "Community 16"
Cohesion: 0.06
Nodes (4): Notification, NotificationRepository, NotificationResponse, NotificationService

### Community 17 - "Community 17"
Cohesion: 0.06
Nodes (1): Booking

### Community 18 - "Community 18"
Cohesion: 0.07
Nodes (1): UserProfile

### Community 19 - "Community 19"
Cohesion: 0.08
Nodes (2): Builder, TransactionResponse

### Community 20 - "Community 20"
Cohesion: 0.08
Nodes (1): User

### Community 21 - "Community 21"
Cohesion: 0.13
Nodes (1): AdminService

### Community 22 - "Community 22"
Cohesion: 0.09
Nodes (1): ListingRepository

### Community 23 - "Community 23"
Cohesion: 0.1
Nodes (1): Payment

### Community 24 - "Community 24"
Cohesion: 0.2
Nodes (1): JwtUtil

### Community 25 - "Community 25"
Cohesion: 0.13
Nodes (1): AdminAuditLog

### Community 26 - "Community 26"
Cohesion: 0.11
Nodes (1): Builder

### Community 27 - "Community 27"
Cohesion: 0.11
Nodes (2): AdminUser, AdminUserRepository

### Community 28 - "Community 28"
Cohesion: 0.16
Nodes (1): AdminController

### Community 29 - "Community 29"
Cohesion: 0.16
Nodes (1): ListingService

### Community 30 - "Community 30"
Cohesion: 0.13
Nodes (1): PaymentRepository

### Community 31 - "Community 31"
Cohesion: 0.15
Nodes (1): PaymentResponse

### Community 32 - "Community 32"
Cohesion: 0.15
Nodes (1): UserRepository

### Community 33 - "Community 33"
Cohesion: 0.23
Nodes (1): BookingService

### Community 34 - "Community 34"
Cohesion: 0.23
Nodes (7): acceptBooking(), cancelBooking(), completeBooking(), createBooking(), mapBookingResponse(), mapListingResponseSlim(), rejectBooking()

### Community 35 - "Community 35"
Cohesion: 0.17
Nodes (1): RegisterRequest

### Community 36 - "Community 36"
Cohesion: 0.2
Nodes (2): getToken(), WebSocketService

### Community 37 - "Community 37"
Cohesion: 0.43
Nodes (1): UserController

### Community 38 - "Community 38"
Cohesion: 0.25
Nodes (0): 

### Community 39 - "Community 39"
Cohesion: 0.52
Nodes (1): NotificationController

### Community 40 - "Community 40"
Cohesion: 0.33
Nodes (1): LoginRequest

### Community 41 - "Community 41"
Cohesion: 0.33
Nodes (1): StartConversationRequest

### Community 42 - "Community 42"
Cohesion: 0.4
Nodes (0): 

### Community 43 - "Community 43"
Cohesion: 0.67
Nodes (0): 

### Community 44 - "Community 44"
Cohesion: 0.67
Nodes (1): HashGenerator

### Community 45 - "Community 45"
Cohesion: 0.67
Nodes (0): 

### Community 46 - "Community 46"
Cohesion: 0.67
Nodes (0): 

### Community 47 - "Community 47"
Cohesion: 0.67
Nodes (0): 

### Community 48 - "Community 48"
Cohesion: 0.67
Nodes (0): 

### Community 49 - "Community 49"
Cohesion: 0.67
Nodes (0): 

### Community 50 - "Community 50"
Cohesion: 0.67
Nodes (0): 

### Community 51 - "Community 51"
Cohesion: 0.67
Nodes (0): 

### Community 52 - "Community 52"
Cohesion: 0.67
Nodes (0): 

### Community 53 - "Community 53"
Cohesion: 0.67
Nodes (0): 

### Community 54 - "Community 54"
Cohesion: 0.67
Nodes (1): GoRentals

### Community 55 - "Community 55"
Cohesion: 0.67
Nodes (1): AsyncConfig

### Community 56 - "Community 56"
Cohesion: 1.0
Nodes (2): decodeJwtPayload(), middleware()

### Community 57 - "Community 57"
Cohesion: 1.0
Nodes (0): 

### Community 58 - "Community 58"
Cohesion: 1.0
Nodes (0): 

### Community 59 - "Community 59"
Cohesion: 1.0
Nodes (0): 

### Community 60 - "Community 60"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **6 isolated node(s):** `KYCSubmissionRequest`, `ListingResponse`, `UpdateProfileRequest`, `UpdateSettingsRequest`, `UserProfileResponse` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 57`** (1 nodes): `START.ps1`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (1 nodes): `next.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (1 nodes): `not-found.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Listing` connect `Community 5` to `Community 0`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `Booking` connect `Community 17` to `Community 1`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **What connects `KYCSubmissionRequest`, `ListingResponse`, `UpdateProfileRequest` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.02 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.03 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.03 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._