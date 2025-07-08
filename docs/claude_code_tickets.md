# Claude Code Implementation Tickets - Massage Booking MVP

## Project Overview
Build a massage therapy booking system MVP with 5-day timeline for therapist review. Tech stack: Next.js, Supabase, Tailwind CSS, Shadcn UI, Stripe, Google Calendar API.

---

## Phase 1: Project Setup & Foundation (Day 1)

### Ticket 1.1: Project Initialization
**Priority: Critical**
**Estimated Time: 2 hours**

**Prompt for Claude Code:**
```
Create a new Next.js 14 project for a massage therapy booking system with the following requirements:

1. Initialize Next.js 14 with TypeScript and App Router
2. Install and configure Tailwind CSS
3. Install and configure Shadcn UI components
4. Set up the project structure with these folders:
   - app/(auth) - for authentication pages
   - app/(dashboard) - for admin dashboard
   - app/(booking) - for client booking flow
   - components/ui - for Shadcn components
   - components/forms - for custom forms
   - lib/ - for utilities and configurations
   - types/ - for TypeScript definitions

5. Create a basic layout with navigation
6. Set up environment variables template (.env.example)
7. Configure prettier and eslint
8. Create a README with setup instructions

Please create the initial project structure and basic configuration files.
```

**Acceptance Criteria:**
- ✅ Next.js 14 project with TypeScript initialized
- ✅ Tailwind CSS configured and working
- ✅ Shadcn UI installed with basic components
- ✅ Folder structure created
- ✅ Basic layout component
- ✅ Environment variables template

---

### Ticket 1.2: Supabase Setup & Database Schema
**Priority: Critical**
**Estimated Time: 3 hours**

**Prompt for Claude Code:**
```
Set up Supabase integration and create the database schema for the massage booking system:

1. Install Supabase client and configure connection
2. Create database tables with the following schema:

PROFILES table:
- id (uuid, primary key, references auth.users)
- email (text)
- first_name (text)
- last_name (text)
- phone (text)
- role (enum: 'client', 'admin')
- created_at (timestamp)
- updated_at (timestamp)

SERVICES table:
- id (uuid, primary key)
- name (text) - e.g., "Swedish Massage", "Deep Tissue"
- description (text)
- duration_minutes (integer)
- price_cents (integer)
- is_active (boolean)
- created_at (timestamp)

APPOINTMENTS table:
- id (uuid, primary key)
- client_id (uuid, foreign key to profiles)
- service_id (uuid, foreign key to services)
- appointment_date (date)
- start_time (time)
- end_time (time)
- status (enum: 'scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')
- total_price_cents (integer)
- payment_status (enum: 'pending', 'paid', 'refunded')
- stripe_payment_intent_id (text)
- notes (text)
- created_at (timestamp)
- updated_at (timestamp)

INTAKE_FORMS table:
- id (uuid, primary key)
- client_id (uuid, foreign key to profiles)
- appointment_id (uuid, foreign key to appointments)
- health_conditions (text)
- medications (text)
- allergies (text)
- massage_experience (text)
- pressure_preference (enum: 'light', 'medium', 'firm', 'deep')
- focus_areas (text)
- avoid_areas (text)
- goals (text)
- emergency_contact_name (text)
- emergency_contact_phone (text)
- signature (text)
- completed_at (timestamp)
- created_at (timestamp)

3. Set up Row Level Security (RLS) policies
4. Create Supabase client configuration
5. Add TypeScript types for all tables
6. Create database utility functions

Please create the SQL schema, RLS policies, and TypeScript configuration.
```

**Acceptance Criteria:**
- ✅ Supabase client configured
- ✅ Database tables created with proper relationships
- ✅ RLS policies implemented
- ✅ TypeScript types defined
- ✅ Database utility functions created

---

### Ticket 1.3: Authentication System
**Priority: Critical**
**Estimated Time: 2 hours**

**Prompt for Claude Code:**
```
Implement authentication system using Supabase Auth with the following requirements:

1. Create authentication pages:
   - Sign in page (/auth/signin)
   - Sign up page (/auth/signup)
   - Password reset page (/auth/reset-password)

2. Use Shadcn UI components for forms:
   - Input components
   - Button components
   - Form validation with react-hook-form
   - Error handling and display

3. Implement authentication logic:
   - Sign up with email/password
   - Sign in with email/password
   - Password reset functionality
   - Email verification
   - Social login (Google) setup

4. Create protected route middleware
5. Add user context/provider for state management
6. Create user profile creation flow
7. Handle role assignment (client vs admin)

Please create the complete authentication system with proper error handling and validation.
```

**Acceptance Criteria:**
- ✅ Sign in/up pages with Shadcn UI
- ✅ Password reset functionality
- ✅ Protected routes middleware
- ✅ User context provider
- ✅ Profile creation flow
- ✅ Role-based access control

---

## Phase 2: Core Booking System (Day 2)

### Ticket 2.1: Service Management & Display
**Priority: High**
**Estimated Time: 2 hours**

**Prompt for Claude Code:**
```
Create the service management system for massage types:

1. Create an admin interface to manage services:
   - Add/edit/delete massage services
   - Set pricing and duration
   - Toggle service availability
   - Service descriptions and details

2. Create a client-facing service selection page:
   - Display available services in a grid layout
   - Show service details (name, description, duration, price)
   - Use Shadcn UI Card components
   - Mobile-responsive design with Tailwind CSS
   - Service filtering and search functionality

3. Implement service CRUD operations:
   - Create new services
   - Update existing services
   - Soft delete services (mark inactive)
   - Fetch services with proper caching

4. Add service validation:
   - Required fields validation
   - Price format validation
   - Duration constraints

Please create the complete service management system with both admin and client interfaces.
```

**Acceptance Criteria:**
- ✅ Admin service management interface
- ✅ Client service selection page
- ✅ CRUD operations for services
- ✅ Form validation and error handling
- ✅ Responsive design with Tailwind CSS

---

### Ticket 2.2: Calendar Integration & Availability
**Priority: Critical**
**Estimated Time: 4 hours**

**Prompt for Claude Code:**
```
Implement Google Calendar integration and availability system:

1. Set up Google Calendar API:
   - Configure Google Cloud Console project
   - Set up OAuth 2.0 credentials
   - Install Google Calendar API client

2. Create availability management:
   - Sync with therapist's Google Calendar
   - Block booked times automatically
   - Set working hours and days
   - Add buffer time between appointments
   - Handle timezone conversions

3. Build calendar UI components:
   - Month/week view for availability
   - Time slot selection interface
   - Available time highlighting
   - Unavailable time blocking
   - Mobile-friendly calendar picker

4. Implement availability logic:
   - Check real-time availability
   - Prevent double bookings
   - Handle appointment conflicts
   - Update calendar in real-time

5. Create admin calendar management:
   - View upcoming appointments
   - Block time for breaks/personal events
   - Modify working hours
   - Set vacation/holiday periods

Please create the complete calendar integration system with real-time availability checking.
```

**Acceptance Criteria:**
- ✅ Google Calendar API integration
- ✅ Real-time availability checking
- ✅ Calendar UI components
- ✅ Admin availability management
- ✅ Timezone handling
- ✅ Conflict prevention

---

### Ticket 2.3: Booking Flow Implementation
**Priority: Critical**
**Estimated Time: 3 hours**

**Prompt for Claude Code:**
```
Create the complete client booking flow:

1. Multi-step booking wizard:
   - Step 1: Service selection
   - Step 2: Date and time selection
   - Step 3: Client information (if not logged in)
   - Step 4: Intake form (new clients)
   - Step 5: Payment information
   - Step 6: Confirmation

2. Booking form components:
   - Use Shadcn UI form components
   - Progressive disclosure for complex forms
   - Form validation and error handling
   - Save progress between steps
   - Mobile-optimized design

3. Booking logic:
   - Create appointment records
   - Update calendar availability
   - Generate confirmation numbers
   - Handle booking conflicts
   - Implement booking confirmation

4. Guest booking option:
   - Allow booking without account creation
   - Collect minimal required information
   - Optional account creation after booking

5. Booking management:
   - View booking details
   - Reschedule appointments
   - Cancel appointments
   - Booking history

Please create the complete booking flow with proper validation and user experience.
```

**Acceptance Criteria:**
- ✅ Multi-step booking wizard
- ✅ Form validation and error handling
- ✅ Guest booking functionality
- ✅ Booking management features
- ✅ Mobile-responsive design

---

## Phase 3: Intake Forms & Payment (Day 3)

### Ticket 3.1: Digital Intake Form System
**Priority: High**
**Estimated Time: 4 hours**

**Prompt for Claude Code:**
```
Create a comprehensive digital intake form system for massage therapy:

1. New client intake form with sections:
   - Personal Information (auto-filled if logged in)
   - Health History (medical conditions, surgeries, injuries)
   - Current Health (pain levels, areas of concern)
   - Medications and Allergies
   - Massage Experience and Preferences
   - Specific Goals for Treatment
   - Emergency Contact Information
   - Consent and Liability Waiver

2. Form features:
   - Multi-section form with progress indicator
   - Conditional questions based on previous answers
   - Digital signature capture
   - Form validation and required fields
   - Save as draft functionality
   - Mobile-optimized design

3. Returning client forms:
   - Quick health update form
   - Changes since last visit
   - New concerns or goals
   - Medication updates

4. Form management:
   - Send intake forms via email before appointments
   - Track form completion status
   - Reminder system for incomplete forms
   - Admin review of completed forms

5. Integration with booking:
   - Trigger intake form for new clients
   - Link forms to specific appointments
   - Update client profiles with form data

Please create the complete intake form system with proper validation and user experience.
```

**Acceptance Criteria:**
- ✅ Comprehensive intake form with all health sections
- ✅ Digital signature capture
- ✅ Conditional form logic
- ✅ Form completion tracking
- ✅ Integration with booking system
- ✅ Mobile-responsive design

---

### Ticket 3.2: Stripe Payment Integration
**Priority: Critical**
**Estimated Time: 3 hours**

**Prompt for Claude Code:**
```
Implement Stripe payment processing for appointment bookings:

1. Stripe setup and configuration:
   - Install Stripe SDK and dependencies
   - Configure Stripe API keys
   - Set up webhook endpoints for payment events

2. Payment flow integration:
   - Collect payment during booking process
   - Create Stripe Payment Intents
   - Handle payment confirmation
   - Store payment status in database
   - Generate payment receipts

3. Payment components:
   - Stripe Elements integration
   - Credit card form with validation
   - Payment processing indicators
   - Error handling for failed payments
   - Success confirmation

4. Payment management:
   - Process refunds for cancellations
   - Handle partial payments/deposits
   - Track payment history
   - Generate financial reports

5. Security and compliance:
   - PCI DSS compliance through Stripe
   - Secure payment data handling
   - Payment webhook verification
   - Error logging and monitoring

Please create the complete Stripe payment integration with proper error handling and security.
```

**Acceptance Criteria:**
- ✅ Stripe payment processing
- ✅ Payment form with validation
- ✅ Webhook handling
- ✅ Refund functionality
- ✅ Payment security measures

---

## Phase 4: Admin Dashboard & Notifications (Day 4)

### Ticket 4.1: Admin Dashboard
**Priority: High**
**Estimated Time: 4 hours**

**Prompt for Claude Code:**
```
Create a comprehensive admin dashboard for the massage therapist:

1. Dashboard overview:
   - Today's appointments summary
   - Revenue metrics (daily, weekly, monthly)
   - Recent bookings and cancellations
   - Pending intake forms
   - Quick action buttons

2. Appointment management:
   - Calendar view (daily, weekly, monthly)
   - Appointment details with client information
   - Modify/reschedule/cancel appointments
   - Add appointment notes
   - Mark appointments as completed/no-show

3. Client management:
   - Client database with search and filtering
   - Individual client profiles
   - Appointment history per client
   - View completed intake forms
   - Contact information and preferences
   - Client communication tools

4. Business analytics:
   - Revenue reporting and charts
   - Popular services analysis
   - Client retention metrics
   - Booking patterns and trends
   - Export capabilities for reports

5. Settings and configuration:
   - Business hours and availability
   - Service management
   - Notification preferences
   - Payment settings
   - Profile management

Please create the complete admin dashboard with all management features.
```

**Acceptance Criteria:**
- ✅ Dashboard overview with key metrics
- ✅ Appointment management interface
- ✅ Client database and profiles
- ✅ Business analytics and reporting
- ✅ Settings and configuration

---

### Ticket 4.2: Notification System
**Priority: High**
**Estimated Time: 3 hours**

**Prompt for Claude Code:**
```
Implement a comprehensive notification system for appointments:

1. Email notifications:
   - Booking confirmations
   - Appointment reminders (24hr, 2hr before)
   - Cancellation confirmations
   - Rescheduling notifications
   - Intake form reminders
   - Follow-up emails

2. Email service integration:
   - Set up SendGrid or Resend
   - Create email templates
   - Personalized email content
   - HTML and plain text versions
   - Email delivery tracking

3. SMS notifications (optional for MVP):
   - Twilio integration
   - Text appointment reminders
   - Booking confirmations
   - Last-minute availability

4. Notification scheduling:
   - Automated reminder system
   - Customizable timing
   - Queue management
   - Retry logic for failed sends

5. Admin notification controls:
   - Configure notification preferences
   - Template customization
   - Delivery status monitoring
   - Unsubscribe handling

Please create the complete notification system with email and optional SMS capabilities.
```

**Acceptance Criteria:**
- ✅ Email notification system
- ✅ Automated reminder scheduling
- ✅ Template customization
- ✅ Delivery tracking
- ✅ Admin notification controls

---

## Phase 5: Testing & Polish (Day 5)

### Ticket 5.1: Testing & Bug Fixes
**Priority: Critical**
**Estimated Time: 3 hours**

**Prompt for Claude Code:**
```
Implement comprehensive testing and bug fixes:

1. Create test suite:
   - Unit tests for utility functions
   - Integration tests for API routes
   - End-to-end tests for booking flow
   - Form validation testing
   - Payment flow testing

2. Error handling improvements:
   - Graceful error handling throughout app
   - User-friendly error messages
   - Error logging and monitoring
   - Fallback UI components

3. Performance optimization:
   - Code splitting and lazy loading
   - Image optimization
   - Database query optimization
   - Caching strategies

4. Accessibility improvements:
   - WCAG 2.1 compliance
   - Keyboard navigation
   - Screen reader compatibility
   - Color contrast validation

5. Mobile optimization:
   - Touch-friendly interfaces
   - Responsive design testing
   - Performance on mobile devices
   - Offline capabilities

Please create comprehensive tests and optimize the application for production.
```

**Acceptance Criteria:**
- ✅ Test suite with good coverage
- ✅ Error handling improvements
- ✅ Performance optimization
- ✅ Accessibility compliance
- ✅ Mobile optimization

---

### Ticket 5.2: Deployment & Documentation
**Priority: High**
**Estimated Time: 2 hours**

**Prompt for Claude Code:**
```
Prepare the application for deployment and create documentation:

1. Deployment setup:
   - Configure Vercel deployment
   - Set up environment variables
   - Database migrations
   - Production build optimization

2. Documentation:
   - User guide for massage therapist
   - Admin dashboard walkthrough
   - Client booking instructions
   - Technical documentation
   - API documentation

3. Security review:
   - Environment variable security
   - Authentication flow review
   - Data protection measures
   - Payment security validation

4. Final testing:
   - Production environment testing
   - Cross-browser compatibility
   - Mobile device testing
   - Performance monitoring setup

Please prepare the application for production deployment with complete documentation.
```

**Acceptance Criteria:**
- ✅ Production deployment ready
- ✅ Complete user documentation
- ✅ Security measures validated
- ✅ Cross-browser testing completed

---

## Development Guidelines for Claude Code

### Code Quality Standards
- Use TypeScript for all components and functions
- Follow React best practices and hooks patterns
- Use Tailwind CSS utility classes consistently
- Implement proper error boundaries
- Add loading states for all async operations

### UI/UX Guidelines
- Use Shadcn UI components consistently
- Maintain design system consistency
- Ensure mobile-first responsive design
- Implement smooth loading states and transitions
- Add proper form validation feedback

### Security Requirements
- Implement proper authentication checks
- Use RLS policies for database access
- Validate all inputs server-side
- Secure API endpoints
- Follow OWASP security guidelines

### Performance Requirements
- Optimize bundle size and loading times
- Implement proper caching strategies
- Use database indexing appropriately
- Minimize API calls and payload sizes
- Add performance monitoring

---

## Timeline Summary

**Day 1:** Project setup, database schema, authentication
**Day 2:** Service management, calendar integration, booking flow
**Day 3:** Intake forms, payment processing
**Day 4:** Admin dashboard, notifications
**Day 5:** Testing, polish, deployment preparation

**Target:** Functional MVP ready for therapist review on Day 5

---

## Post-Review Iteration Plan

After the 5-day review with your wife:
1. Collect feedback on user experience
2. Identify priority improvements
3. Plan additional features for next iteration
4. Optimize based on real user testing
5. Prepare for production launch

This ticket system provides Claude Code with clear, actionable prompts for building the complete massage therapy booking MVP within the 5-day timeline.