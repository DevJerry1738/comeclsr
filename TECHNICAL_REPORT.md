# 📋 ComeClsr Admin-Controlled Chat Application - Technical Report

**Generated**: May 4, 2026  
**Project**: OKComputer ComeClsr Admin-Controlled Chat Application  
**Node Version**: 20 LTS  
**Build Tool**: Vite 7.2.4  
**Styling**: Tailwind CSS 3.4.19

---

## 🧠 1. Project Overview

### What It Does
ComeClsr is an admin-controlled peer-to-peer chat platform that connects users with agents for meaningful conversations. The system includes:
- **User Registration & Authentication** - Local auth + OAuth integration (Kimi)
- **KYC (Know Your Customer) Verification** - Users submit personal preferences, expectations, and documents
- **Payment Processing** - Users upload proof of payment; admins approve/reject
- **Agent Management** - Admins create and assign agents to users
- **Conversation System** - Media and voice message support between users and agents
- **Support Tickets** - Users can create support tickets; admins can respond
- **Admin Dashboard** - Complete management interface for admins to oversee platform operations

### Target Users
- **End Users**: Individuals seeking meaningful conversations with agents
- **Agents**: Assigned users who facilitate conversations
- **Admins**: Platform operators managing users, payments, KYC, and conversations

### Core Purpose
To provide a structured, admin-controlled environment where users can connect with agents through a moderation and approval workflow, ensuring quality control and safety across all interactions.

---

## 🏗️ 2. Architecture & Tech Stack

### Frontend
- **Framework**: React 19.2.0 with TypeScript
- **Build Tool**: Vite 7.2.4 (dev server + production build)
- **Routing**: React Router 7.6.1
- **Styling**: Tailwind CSS 3.4.19 with shadcn/ui components
- **UI Components**: 40+ Radix UI-based shadcn components (buttons, dialogs, forms, tables, etc.)
- **State Management**: TanStack React Query 5.90.16 (data fetching & caching)
- **Forms**: React Hook Form 7.70.0 + Zod 4.3.5 (validation)
- **Charts**: Recharts 2.15.4 (analytics visualization)
- **Notifications**: Sonner 2.0.7 (toast notifications)
- **Icons**: Lucide React 0.562.0
- **Theme Support**: next-themes 0.4.6

### Backend
- **Framework**: Hono 4.8.3 (lightweight HTTP framework)
- **Node Server**: @hono/node-server 1.14.3
- **API Layer**: tRPC 11.8.1 (type-safe RPC framework)
- **Authentication**: JWT (jose 6.1.3) + bcryptjs 3.0.3 for password hashing
- **Session Management**: Cookie-based sessions with JWT tokens

### Database
- **Database Engine**: MySQL (via mysql2 driver)
- **ORM**: Drizzle ORM 0.45.1
- **Schema Management**: Drizzle Kit 0.31.8 (migrations)
- **Database Location**: Cloud MySQL instance (via DATABASE_URL env var)

### File Storage
- **AWS S3**: @aws-sdk/client-s3 & s3-request-presigner (media uploads)

### Authentication
- **Local Auth**: Username/password with bcrypt hashing
- **OAuth**: Kimi OAuth integration (configurable via env)
- **Token Type**: JWT with 1 year TTL
- **Session Cookie**: `kimi_sid` (httpOnly, secure)

### Routing & Middleware
- **API Routing**: tRPC procedures with middleware-based access control
- **Role-based Access**: `authedQuery` (authenticated) / `adminQuery` (admin only)
- **Request Validation**: Zod schemas on all mutations/queries

### Utilities
- **Date Handling**: date-fns 4.1.0
- **ID Generation**: nanoid 5.1.6
- **Type Serialization**: superjson 2.2.6 (for tRPC)
- **CSS Utilities**: clsx + tailwind-merge for dynamic class names

---

## 🔐 3. Authentication System

### Authentication Flows

#### Local Authentication
- **Endpoint**: `localAuth.register` / `localAuth.login`
- **Process**:
  1. User registers with email, username, password, and KYC details
  2. Password hashed with bcrypt (salt rounds: 12)
  3. JWT token generated with `userId` and `role`
  4. Token stored in `kimi_sid` cookie
  5. Initial user status: `pending` (requires payment + KYC approval)

#### OAuth (Kimi)
- **Endpoint**: `/api/oauth/callback` (handled in `createOAuthCallbackHandler`)
- **Supported for**: Third-party integration
- **Configuration**: `KIMI_AUTH_URL`, `KIMI_OPEN_URL`, `APP_ID`, `APP_SECRET`

### User Roles & Access Control

| Role | Permissions |
|------|------------|
| **user** | View own profile, conversations, tickets, payments, KYC status; send messages; create requests |
| **agent** | View assigned users, send messages in conversations, access conversations list |
| **admin** | Full access to all management features: users, agents, payments, KYC, conversations, tickets, settings, notifications |

### Session Management
- **Session Cookie**: `kimi_sid`
- **Cookie Options**: HttpOnly, Secure (in production), SameSite=Lax, 1-year max age
- **Middleware**: `requireAuth` verifies user context; `requireRole("admin")` for admin operations
- **Token Refresh**: Implicit via React Query (no explicit refresh logic; relies on session validation)

### User Statuses
- `pending` - Initial status; awaiting payment approval
- `active` - Approved user; can access platform
- `suspended` - Temporarily blocked by admin
- `blocked` - Permanently blocked by admin

---

## 📦 4. Data Models & Database Structure

### Users Table
```
- id (serial, primary key)
- unionId (varchar, unique) - OAuth identifier
- username (varchar, unique, required)
- password (varchar, hashed)
- fullName (varchar, required)
- email (varchar, unique, required)
- phone (varchar)
- gender (enum: male, female, other)
- age (int)
- location (varchar)
- profilePhoto (text - URL)
- interests (text - JSON or CSV)
- bio (text)
- role (enum: user, admin, agent; default: user)
- status (enum: active, suspended, blocked, pending; default: pending)
- paymentStatus (enum: pending, approved, rejected; default: pending)
- kycStatus (enum: pending, submitted, approved, rejected; default: pending)
- conversationStatus (enum: pending, assigned, active, stopped; default: pending)
- assignedAgentId (bigint, foreign key to agents)
- avatar (text)
- createdAt (timestamp)
- updatedAt (timestamp)
- lastSignInAt (timestamp)
```

### Agents Table
```
- id (serial, primary key)
- userId (bigint, unique, foreign key to users)
- username (varchar, unique, required)
- password (varchar, hashed, required)
- displayName (varchar, required)
- profilePhoto (text)
- bio (text)
- status (enum: active, inactive, suspended; default: active)
- assignedUserId (bigint, nullable, foreign key to users)
- createdAt (timestamp)
- updatedAt (timestamp)
```

### KYC Submissions Table
```
- id (serial, primary key)
- userId (bigint, unique, foreign key to users)
- peopleType (text) - "entrepreneur", "investor", etc.
- conversationType (text) - "professional", "casual", etc.
- personalityPrefs (text) - User personality preferences
- expectations (text) - What user expects from interaction
- idDocument (text - URL)
- selfiePhoto (text - URL)
- status (enum: pending, approved, rejected; default: pending)
- adminNotes (text)
- createdAt (timestamp)
- updatedAt (timestamp)
```

### Payments Table
```
- id (serial, primary key)
- userId (bigint, foreign key to users)
- amount (decimal 10.2)
- method (varchar) - "bank_transfer", "card", etc.
- status (enum: pending, approved, rejected; default: pending)
- proofImage (text - URL)
- transactionRef (varchar)
- adminNotes (text)
- createdAt (timestamp)
- updatedAt (timestamp)
```

### Conversations Table
```
- id (serial, primary key)
- userId (bigint, foreign key to users)
- agentId (bigint, foreign key to agents)
- status (enum: pending, active, stopped, closed; default: pending)
- adminApproved (boolean; default: false)
- welcomeMessageSent (boolean; default: false)
- lastMessageAt (timestamp)
- createdAt (timestamp)
```

### Messages Table
```
- id (serial, primary key)
- conversationId (bigint, foreign key to conversations)
- senderId (bigint, foreign key to users)
- senderRole (enum: user, agent, admin)
- type (enum: media, voice) - message type
- content (text)
- mediaUrl (text - S3 URL)
- duration (int - seconds, for voice)
- isRead (boolean; default: false)
- createdAt (timestamp)
```

### Tickets Table
```
- id (serial, primary key)
- userId (bigint, foreign key to users)
- subject (varchar, required)
- category (enum: general, payment, agent, technical, other; default: general)
- status (enum: open, in_progress, resolved, closed; default: open)
- priority (enum: low, medium, high; default: medium)
- createdAt (timestamp)
- updatedAt (timestamp)
```

### Ticket Replies Table
```
- id (serial, primary key)
- ticketId (bigint, foreign key to tickets)
- senderId (bigint, foreign key to users)
- senderRole (enum: user, admin)
- message (text, required)
- createdAt (timestamp)
```

### Settings Table
```
- id (serial, primary key)
- key (varchar, unique, required)
- value (text)
- category (enum: general, payment, email, homepage, popup; default: general)
- updatedAt (timestamp)
```

### Notifications Table
```
- id (serial, primary key)
- userId (bigint, foreign key to users)
- type (enum: payment, kyc, agent, conversation, ticket, system)
- title (varchar, required)
- message (text, required)
- isRead (boolean; default: false)
- createdAt (timestamp)
```

### Agent Messages Table
```
- id (serial, primary key)
- agentId (bigint, foreign key to agents)
- content (text, required)
- isDefault (boolean; default: false)
- createdAt (timestamp)
```

### User Requests Table
```
- id (serial, primary key)
- userId (bigint, foreign key to users)
- type (enum: agent_change, report_inactivity, other)
- message (text)
- status (enum: pending, approved, rejected; default: pending)
- createdAt (timestamp)
```

---

## 🔌 5. API Endpoints (tRPC Routers)

### Auth Router (`auth.*`)
| Endpoint | Auth | Method | Purpose |
|----------|------|--------|---------|
| `auth.me` | Required | Query | Get current authenticated user |
| `auth.logout` | Required | Mutation | Logout and clear session |

### Local Auth Router (`localAuth.*`)
| Endpoint | Auth | Method | Purpose |
|----------|------|--------|---------|
| `localAuth.register` | Public | Mutation | Register new user |
| `localAuth.login` | Public | Mutation | Login existing user |

### User Router (`user.*`)
| Endpoint | Auth | Method | Purpose |
|----------|------|--------|---------|
| `user.profile` | Required | Query | Get user's profile with relations |
| `user.updateProfile` | Required | Mutation | Update user profile fields |
| `user.notifications` | Required | Query | Get user's notifications (last 50) |
| `user.markNotificationRead` | Required | Mutation | Mark notification as read |
| `user.createRequest` | Required | Mutation | Create request (agent_change, report_inactivity, other) |

### Payment Router (`payment.*`)
| Endpoint | Auth | Method | Purpose |
|----------|------|--------|---------|
| `payment.create` | Required | Mutation | Create new payment submission |
| `payment.myPayments` | Required | Query | Get user's payment history |
| `payment.allPayments` | Admin | Query | Get all payments (admin) |
| `payment.updateStatus` | Admin | Mutation | Approve/reject payment (admin) |

### KYC Router (`kyc.*`)
| Endpoint | Auth | Method | Purpose |
|----------|------|--------|---------|
| `kyc.submit` | Required | Mutation | Submit KYC data |
| `kyc.myKyc` | Required | Query | Get user's KYC submission |
| `kyc.allKyc` | Admin | Query | Get all KYC submissions (admin) |
| `kyc.updateStatus` | Admin | Mutation | Approve/reject KYC (admin) |

### Conversation Router (`conversation.*`)
| Endpoint | Auth | Method | Purpose |
|----------|------|--------|---------|
| `conversation.myConversations` | Required | Query | Get user's conversations with latest message |
| `conversation.getMessages` | Required | Query | Get all messages in a conversation |
| `conversation.sendMessage` | Required | Mutation | Send media or voice message |
| `conversation.markRead` | Required | Mutation | Mark conversation messages as read |
| `conversation.allConversations` | Admin | Query | Get all conversations (admin) |

### Agent Router (`agent.*`)
| Endpoint | Auth | Method | Purpose |
|----------|------|--------|---------|
| `agent.list` | Admin | Query | List all agents |
| `agent.create` | Admin | Mutation | Create new agent |
| `agent.assignToUser` | Admin | Mutation | Assign agent to user |
| `agent.approveConversation` | Admin | Mutation | Approve conversation; sends welcome message |

### Ticket Router (`ticket.*`)
| Endpoint | Auth | Method | Purpose |
|----------|------|--------|---------|
| `ticket.create` | Required | Mutation | Create support ticket |
| `ticket.myTickets` | Required | Query | Get user's tickets |
| `ticket.allTickets` | Admin | Query | Get all tickets (admin) |
| `ticket.updateStatus` | Admin | Mutation | Change ticket status (admin) |
| `ticket.addReply` | Auth | Mutation | Reply to ticket (user or admin) |
| `ticket.getReplies` | Auth | Query | Get ticket replies |

### Settings Router (`settings.*`)
| Endpoint | Auth | Method | Purpose |
|----------|------|--------|---------|
| `settings.get` | Public | Query | Get all settings |
| `settings.getByCategory` | Public | Query | Get settings by category |
| `settings.update` | Admin | Mutation | Update setting (admin) |

### Admin Router (`admin.*`)
| Endpoint | Auth | Method | Purpose |
|----------|------|--------|---------|
| `admin.dashboardStats` | Admin | Query | Dashboard statistics (users, payments, agents, conversations, etc.) |
| `admin.allUsers` | Admin | Query | Get all users with KYC and payment relations |
| `admin.updateUser` | Admin | Mutation | Update user status, KYC status, payment status, role, etc. |
| `admin.deleteUser` | Admin | Mutation | Delete user |
| `admin.resetPassword` | Admin | Mutation | Reset user password |
| `admin.createNotification` | Admin | Mutation | Send system notification to user |
| `admin.userRequests` | Admin | Query | Get all user requests |
| `admin.updateRequestStatus` | Admin | Mutation | Approve/reject user request |

---

## 📄 6. Frontend Routes & Pages

### Public Routes
| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `Home` | Landing page |
| `/login` | `Login` | User login |
| `/register` | `Register` | User registration |

### Protected Routes (Authenticated Users)
| Route | Component | Purpose |
|-------|-----------|---------|
| `/dashboard` | `Dashboard` | User dashboard |
| `/messages` | `Messages` | Conversations & messaging interface |
| `/tickets` | `Tickets` | Support tickets |

### Protected Routes (Admin Only)
| Route | Component | Purpose |
|-------|-----------|---------|
| `/admin` | `AdminDashboard` | Admin overview dashboard |
| `/admin/users` | `AdminUsers` | Manage users |
| `/admin/agents` | `AdminAgents` | Manage agents |
| `/admin/payments` | `AdminPayments` | Review & approve payments |
| `/admin/kyc` | `AdminKyc` | Review KYC submissions |
| `/admin/conversations` | `AdminConversations` | Monitor conversations |
| `/admin/tickets` | `AdminTickets` | Handle support tickets |
| `/admin/settings` | `AdminSettings` | Platform settings |

### ProtectedRoute Component
- Checks user authentication state
- Redirects unauthenticated users to `/login`
- Redirects non-admins from admin routes to `/dashboard`
- Shows loading screen while fetching auth state

---

## ⚡ 7. Current Functionality Status

### ✅ Fully Implemented

#### Authentication & User Management
- Local registration with validation
- Local login with password hashing
- JWT-based session management
- User profile viewing & updating
- OAuth integration (Kimi) - callback handler in place
- Role-based access control (user/agent/admin)

#### KYC (Know Your Customer)
- KYC submission form with personal preferences
- Document upload support (ID + selfie)
- Admin KYC review & approval workflow
- Status tracking (pending → submitted → approved/rejected)

#### Payments
- Payment submission with proof image
- Admin payment review & approval
- Status tracking & notifications
- Revenue tracking in admin dashboard

#### Conversations & Messaging
- User-Agent conversation creation
- Admin assignment of agents to users
- Message sending (media & voice types)
- Message read status tracking
- Conversation status workflow (pending → active → stopped → closed)
- Welcome message system (sent by agent on approval)
- Notification system on new messages

#### Support Tickets
- User ticket creation with categories & priority
- Ticket reply system (user & admin)
- Ticket status management (open → in_progress → resolved → closed)
- Ticket categorization (general, payment, agent, technical, other)

#### Admin Dashboard
- Statistics: total users, active users, pending payments, total agents, active conversations, total tickets
- User management (list, update, delete, reset password)
- Agent management (create, list, assign to users)
- Payment approval workflow
- KYC review interface
- Conversation monitoring
- Notification creation & delivery
- User request handling (agent changes, inactivity reports)
- Platform settings management

#### Frontend UI
- Modern UI with Tailwind CSS + shadcn components
- Forms with React Hook Form + Zod validation
- Responsive design
- Toast notifications (Sonner)
- Admin charts & statistics (Recharts)
- Loading states & error handling

### ⚠️ Partially Implemented

#### OAuth/Kimi Integration
- OAuth callback handler exists
- Token validation logic may be incomplete
- User linking between OAuth and local accounts (unclear)
- OAuth user profile mapping (needs verification)

#### Media Upload
- S3 SDK imported but actual upload logic not fully reviewed
- URL storage in database works
- Pre-signing URLs implemented

#### Voice Messages
- Message type enum supports "voice"
- Duration field exists in messages table
- Actual voice recording/playback UI (not reviewed)

#### Real-Time Updates
- No WebSocket or real-time subscription mechanism visible
- Messages and conversations require manual refresh (React Query)
- Notifications delivered asynchronously only

### ❌ Not Yet Implemented / Unknown

#### Features Not Found
- **Video calls** - No video infrastructure visible
- **Voice calls** - Callback infrastructure exists but not full implementation
- **Typing indicators** - Not implemented
- **User online status** - Not implemented
- **Message search** - No search endpoints
- **Conversation export** - No export functionality
- **Email notifications** - Email service not set up
- **SMS notifications** - SMS service not set up
- **Rate limiting** - No rate limiting middleware
- **Analytics/Logging** - No analytics tracking
- **File sharing** - Limited to media URLs only
- **Conversation archiving** - No archive feature
- **User blocking** - No block functionality
- **Two-factor authentication** - Not implemented
- **Mobile app** - Only web application

#### Areas Needing Verification
- **Chat UI implementation** - Frontend message display not reviewed
- **Real-time delivery** - Messages may require polling
- **Error handling** - Frontend error boundaries not fully reviewed
- **Input validation** - Some user inputs may need stricter validation
- **Security** - CORS, CSRF, SQL injection protections not explicitly verified
- **Performance** - Database query optimization not reviewed
- **Scalability** - Horizontal scaling strategy unknown

---

## 🐞 8. Known Issues & Limitations

### Architecture & Design

1. **Single Admin Role Limitation**
   - Only one global "admin" role exists
   - No role hierarchy (moderators, support staff, etc.)
   - Admin can perform any action on any user/conversation

2. **No Real-Time Communication**
   - All messaging requires polling via React Query
   - No live notifications for new messages
   - Conversation status updates may be stale
   - High latency for interactive conversations

3. **Session Management**
   - No explicit token refresh mechanism
   - Session expires after 1 year (very long)
   - No logout tracking on backend
   - Cookie-only session (no HTTP header alternative)

### Data & Business Logic

4. **KYC Data Integrity**
   - KYC can be created during registration but updated separately
   - No validation that user completes KYC before conversation starts
   - No document expiration tracking

5. **Agent Assignment Workflow**
   - One agent can be assigned to multiple users
   - One user can only have one agent at a time
   - No automatic agent availability checking
   - Agent workload not balanced

6. **Payment Without Clear Terms**
   - Payment amount entered but no pricing structure defined
   - No invoice generation
   - No payment method validation
   - Admin must manually verify proof images

7. **Conversation Status Flow**
   - Status can transition to "stopped" but no termination logic defined
   - No conversation timeout mechanism
   - "Closed" status appears unused

### Frontend / UX

8. **Missing Implementations**
   - No real-time message delivery confirmation
   - No "last seen" timestamps for users
   - No read receipts for agents
   - Loading states may not cover all async operations
   - No skeleton screens for large data loads

9. **Error Handling**
   - Generic error messages to users
   - No retry logic for failed operations
   - Network errors may not display properly

### Security Concerns

10. **Potential Issues**
    - No rate limiting on auth endpoints (brute force risk)
    - S3 URLs exposed without expiration in some cases
    - OAuth user profile data validation may be insufficient
    - No CORS security review
    - JWT secrets not rotated
    - Admin password reset not logged or audited

11. **File Upload Security**
    - No file type validation (only URL storage)
    - No virus scanning for uploaded files
    - No file size limits documented
    - S3 bucket permissions unknown

### Performance Concerns

12. **Database Query Optimization**
    - Multiple nested `with` clauses could cause N+1 queries
    - No pagination on large result sets (users, payments, etc.)
    - `limit(50)` on notifications may truncate data silently
    - No database indexing strategy visible

13. **Frontend Performance**
    - 40+ UI components loaded upfront
    - No code splitting by route
    - React Query may cache stale data
    - Admin Dashboard may load too much data at once

---

## 🚧 9. Suggested Next Steps

### High Priority (Core Functionality)

1. **Implement Real-Time Messaging**
   - Add WebSocket support (Socket.io or Hono Websockets)
   - Implement message delivery acknowledgments
   - Add typing indicators
   - Add presence tracking

2. **Complete OAuth Integration**
   - Verify Kimi OAuth user mapping
   - Handle OAuth user first-time login (account linking)
   - Test end-to-end OAuth flow
   - Add OAuth user profile sync

3. **Implement KYC Validation Rules**
   - Require KYC approval before conversation starts
   - Add document verification workflow
   - Implement expiration logic for documents
   - Add manual review checklist for admins

4. **Improve Payment Processing**
   - Integrate real payment gateway (Stripe, PayPal, etc.)
   - Add invoice generation & download
   - Implement refund workflow
   - Add payment history export

5. **Add Conversation Controls**
   - Implement conversation escalation workflow
   - Add agent transfer mechanism
   - Implement conversation archiving
   - Add conversation rating/feedback system

### Medium Priority (User Experience)

6. **Enhance Real-Time Updates**
   - Implement conversation status notifications
   - Add delivery status for messages
   - Show agent availability status
   - Add last-seen timestamps

7. **Implement Role Management**
   - Add support tier levels (gold, silver, bronze)
   - Create moderator role for ticket handling
   - Add permission matrix for fine-grained control
   - Implement role audit logs

8. **Add User Blocking & Reporting**
   - Implement user blocking mechanism
   - Add content reporting workflow
   - Create abuse review dashboard
   - Add automatic ban for repeated violations

9. **Implement Search & Filtering**
   - Add user search by name, email, username
   - Add conversation search by content
   - Add payment search by amount, date, status
   - Add full-text search for tickets

10. **Add Pagination**
    - Paginate user lists in admin dashboard
    - Paginate conversation histories
    - Paginate payment records
    - Paginate ticket lists

### Lower Priority (Polish & Optimization)

11. **Monitoring & Analytics**
    - Add application logging (Winston or Pino)
    - Track user funnel (register → payment → KYC → conversation)
    - Monitor agent activity & response times
    - Add performance metrics dashboard

12. **Email & Notifications**
    - Implement email service (SendGrid, Mailgun)
    - Send confirmation emails on registration
    - Send payment approval/rejection emails
    - Send KYC status updates
    - Add SMS notifications (Twilio)

13. **Security Enhancements**
    - Implement rate limiting on auth endpoints
    - Add CSRF protection
    - Add input sanitization
    - Implement API key rotation
    - Add security headers

14. **Documentation**
    - API documentation (Swagger/OpenAPI)
    - User guide & FAQ
    - Admin dashboard walkthrough
    - Deployment guide
    - Database schema diagram

15. **Testing**
    - Unit tests for auth logic
    - Integration tests for API endpoints
    - E2E tests for critical user flows
    - Performance tests for database queries

### Architectural Improvements

16. **Scalability**
    - Add message queue (Bull, RabbitMQ) for async tasks
    - Implement Redis caching for frequently accessed data
    - Add database read replicas
    - Implement horizontal scaling strategy

17. **Code Organization**
    - Extract business logic into services
    - Create shared types for frontend/backend
    - Add utility helper functions
    - Implement dependency injection

18. **Error Handling**
    - Centralized error handler for all routers
    - Custom error codes for different scenarios
    - Better error messages for frontend
    - Error logging & alerting

---

## 🎯 10. Architectural Recommendations

### 1. **Add Message Queue for Async Tasks**
Currently, all operations are synchronous. Implement a message queue for:
- Sending notifications
- Processing payment confirmations
- Generating documents/invoices
- Cleaning up abandoned conversations

**Recommendation**: Bull.js with Redis backend

### 2. **Implement Caching Layer**
Reduce database load:
- Cache user profiles (5 min TTL)
- Cache agent list (10 min TTL)
- Cache settings (1 hour TTL)
- Cache conversation lists (1 min TTL)

**Recommendation**: Redis with Drizzle cache adapter

### 3. **Separate Concerns into Services**
Extract business logic:
- `AuthService` - Auth & token management
- `UserService` - User CRUD & profile
- `PaymentService` - Payment workflow
- `KYCService` - KYC submission & approval
- `ConversationService` - Messaging logic
- `NotificationService` - Notification delivery

### 4. **Add API Versioning**
Allow future breaking changes:
- Implement `/api/v1/trpc` versioning
- Maintain backward compatibility
- Document deprecations

### 5. **Implement Event-Driven Architecture**
Replace direct mutations with events:
- "UserRegistered" event → trigger welcome email
- "PaymentApproved" event → create notification
- "KYCApproved" event → allow conversation start
- "MessageSent" event → trigger notifications

---

## 📋 11. How to Initialize and Run the Project

### Prerequisites
- **Node.js**: 20 LTS or higher
- **npm** or **yarn**: Latest version
- **MySQL**: Cloud instance with connection string
- **Git**: For version control (optional)

### Environment Setup

1. **Create `.env` file** in project root:
```bash
# Copy from .env.example
cp .env.example .env

# Edit .env with your values:
```

2. **Required Environment Variables**:
```env
# Backend Auth
APP_ID=your_app_id
APP_SECRET=your_app_secret

# Database
DATABASE_URL=mysql://user:password@host:port/database_name

# Frontend (Vite)
VITE_KIMI_AUTH_URL=https://auth.kimi.com
VITE_APP_ID=your_app_id

# Backend OAuth
KIMI_AUTH_URL=https://auth.kimi.com
KIMI_OPEN_URL=https://open.kimi.com

# Admin Override (optional)
OWNER_UNION_ID=your_union_id  # This user gets admin role on first login
```

3. **Get Database Connection String**:
   - Obtain MySQL connection string from your cloud provider
   - Format: `mysql://username:password@hostname:port/dbname`
   - Ensure connection is allowed from your IP

### Installation

1. **Navigate to project directory**:
```bash
cd app
```

2. **Install dependencies**:
```bash
npm install
# or
npm ci  # for exact versions
```

3. **Verify TypeScript compilation**:
```bash
npm run check
```

### Database Setup

1. **Generate migration files** (if schema changed):
```bash
npm run db:generate
```

2. **Run migrations**:
```bash
npm run db:migrate
```

3. **Push schema to database** (one-time setup):
```bash
npm run db:push
```

4. **Verify connection**:
   - Check MySQL logs for successful connection
   - Query database: `SELECT * FROM users;`

### Development

1. **Start development server**:
```bash
npm run dev
```

This starts:
- **Vite dev server**: Frontend (HMR on http://localhost:3000)
- **Hono dev server**: Backend API (http://localhost:3000/api/trpc)
- **Database connection**: Auto-connected via `DATABASE_URL`

2. **Access application**:
   - Frontend: http://localhost:3000
   - Default routes available at `/`, `/login`, `/register`

3. **Code changes**:
   - Frontend: Auto-reloads on save (Vite HMR)
   - Backend: Auto-reloads on save (Vite dev server)
   - Database schema: Run `npm run db:generate && npm run db:migrate`

### Building for Production

1. **Build application**:
```bash
npm run build
```

This creates:
- `dist/public/` - Frontend static files
- `dist/boot.js` - Backend server bundle

2. **Start production server**:
```bash
npm start
```

This runs:
- Node.js production server on port 3000 (or `$PORT` env var)
- Serves frontend from `dist/public/`
- Serves API from `/api/trpc`

### Quality Checks

1. **Run TypeScript check**:
```bash
npm run check
```

2. **Lint code**:
```bash
npm run lint
```

3. **Format code** (Prettier):
```bash
npm run format
```

4. **Run tests** (Vitest):
```bash
npm test
```

### Docker Deployment

1. **Build Docker image**:
```bash
docker build -t comeclsr:latest .
```

2. **Run container**:
```bash
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e APP_ID=xxx \
  -e APP_SECRET=xxx \
  -e DATABASE_URL=mysql://... \
  -e KIMI_AUTH_URL=https://auth.kimi.com \
  -e KIMI_OPEN_URL=https://open.kimi.com \
  comeclsr:latest
```

### Troubleshooting

| Issue | Solution |
|-------|----------|
| "DATABASE_URL is required" | Set `DATABASE_URL` in `.env` |
| Database connection timeout | Check MySQL credentials & firewall rules |
| "Cannot find module '@hono/node-server'" | Run `npm install` again |
| Port 3000 already in use | Kill process or change: `PORT=3001 npm run dev` |
| OAuth fails | Verify `KIMI_AUTH_URL` and `APP_ID` are correct |
| TypeScript errors | Run `npm run check` and fix type errors |

---

## 📊 Summary

| Aspect | Details |
|--------|---------|
| **Status** | MVP-ready with admin controls |
| **Frontend** | React 19 + TypeScript + Tailwind |
| **Backend** | Hono + tRPC + Drizzle ORM |
| **Database** | MySQL with full schema |
| **Authentication** | Local + OAuth (Kimi) |
| **Key Features** | Users, Agents, KYC, Payments, Conversations, Tickets, Admin Dashboard |
| **Real-Time** | Not yet implemented (polling-based) |
| **Deployment** | Docker-ready, Node.js 20 |
| **Next Steps** | WebSocket implementation, OAuth completion, payment gateway integration |

---

**Report Generated**: May 4, 2026  
**Last Updated**: N/A  
**Maintainer**: ComeClsr Development Team
