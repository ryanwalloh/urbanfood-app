# Stripe Payment Integration - Comprehensive Plan

## 🎯 Overview
Integrate Stripe payment processing into the Soti Delivery customer app with test mode support. This will allow customers to pay via credit/debit cards through Stripe's secure payment gateway.

## 📋 Current System Analysis

### Existing Payment Flow
1. **Checkout Page** (`mobileapp/customer-app/components/Checkout.js`)
   - Payment methods: Cash on Delivery, Visa, GCash, PayMaya (static display only)
   - Selected payment stored in `selectedPayment` state
   - "Place Order" button calls `onPlaceOrder` handler

2. **Order Placement** (`mobileapp/customer-app/components/Cart.js`)
   - Calls `apiService.placeOrder()` with payment_method
   - Backend: `core/views.py` → `place_order()` endpoint
   - Creates Order with `payment_method` field
   - No payment processing - just records the method

3. **Order Model** (`orders/models.py`)
   - Field: `payment_method = CharField(max_length=50, default='COD')`
   - No payment status or Stripe-specific fields

### Dependencies Already Installed
✅ `@stripe/stripe-react-native` (frontend)
✅ `stripe` (backend)
✅ Stripe plugin configured in `app.json`
✅ API keys configured

## 🎨 UI/UX Design Approach

### Payment Method Selection
**Current:** Simple radio buttons with icons
**Enhanced:** 
- Show Stripe as primary payment option
- Visual distinction for card payment (Stripe logo/badge)
- Keep Cash on Delivery as secondary option
- Show security badges (PCI compliant, encrypted)

### Payment Flow
1. **User selects payment method**
   - If "Card Payment" (Stripe): Show additional info (secure, PCI compliant)
   - If "Cash on Delivery": Keep existing flow

2. **User clicks "Place Order"**
   - If Stripe: Initiate payment flow
   - If COD: Proceed to order creation (existing flow)

3. **Stripe Payment Flow**
   - Create payment intent on backend
   - Show Stripe payment sheet
   - Handle payment confirmation
   - Create order upon successful payment
   - Show order confirmation

## 📝 Implementation Plan

### Phase 1: Backend Foundation
**Goal:** Set up Stripe server-side infrastructure

#### Step 1.1: Database Schema Updates
**File:** `orders/models.py`
- Add `stripe_payment_intent_id` (CharField, nullable)
- Add `stripe_client_secret` (CharField, nullable)
- Add `payment_status` field with choices (pending, succeeded, failed, cancelled, refunded)
- Add `stripe_charge_id` (CharField, nullable)

#### Step 1.2: Environment Configuration
**Files:** `.env`, Railway dashboard
- ✅ Configured: `STRIPE_PUBLISHABLE_KEY`
- ✅ Configured: `STRIPE_SECRET_KEY`
- ✅ Configured: `STRIPE_WEBHOOK_SECRET`

#### Step 1.3: Backend API Endpoints
**File:** `core/views.py`

**New Endpoints:**
1. **`create_payment_intent`** (POST `/api/stripe/create-payment-intent/`)
   - Input: `user_id`, `restaurant_id`, `total_amount`
   - Create Stripe PaymentIntent
   - Return: `client_secret`, `payment_intent_id`

2. **`confirm_payment`** (POST `/api/stripe/confirm-payment/`)
   - Input: `payment_intent_id`, `order_id`
   - Confirm payment with Stripe
   - Update order with payment status
   - Return: success/failure

3. **`stripe_webhook`** (POST `/api/stripe/webhook/`)
   - Handle Stripe webhook events
   - Verify webhook signature
   - Process `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Update order status based on webhook

#### Step 1.4: Update Order Creation
**File:** `core/views.py` → `place_order()`
- Handle Stripe payment method
- Create order with payment status "pending"
- Store stripe_payment_intent_id
- Don't clear cart until payment confirmed

### Phase 2: Frontend Integration
**Goal:** Implement Stripe payment UI and flow

#### Step 2.1: Stripe Initialization
**File:** `mobileapp/customer-app/components/Checkout.js`
- Import Stripe provider and hooks
- Initialize Stripe with publishable key
- Set up error handling

#### Step 2.2: Payment Method UI Enhancement
**File:** `mobileapp/customer-app/components/Checkout.js`
- Add "Card Payment" option with Stripe branding
- Update payment method selection logic
- Add loading states

#### Step 2.3: Payment Flow Implementation
**File:** `mobileapp/customer-app/components/Checkout.js`

**New Functions:**
1. `handleStripePayment()`
   - Call backend to create payment intent
   - Initialize Stripe Payment Sheet
   - Handle payment confirmation

2. `handlePlaceOrder()`
   - Check selected payment method
   - If Stripe: call `handleStripePayment()`
   - If COD: proceed with existing flow

3. `handlePaymentSuccess()`
   - Show success message
   - Navigate to order tracking

#### Step 2.4: Update API Service
**File:** `mobileapp/customer-app/services/api.js`
- Add `createPaymentIntent()` function
- Add `confirmPayment()` function

### Phase 3: Testing & Validation
**Goal:** Ensure secure and reliable payment processing

#### Step 3.1: Backend Testing
- Test payment intent creation
- Test webhook handling
- Test error scenarios

#### Step 3.2: Frontend Testing
- Test payment sheet display
- Test payment flow
- Test error handling
- Test with test cards

#### Step 3.3: Integration Testing
- End-to-end payment flow
- Multiple payment methods
- Order creation verification
- Cart clearing verification

## 🔒 Security Considerations
1. Never expose secret key in frontend
2. Validate webhook signatures
3. Use HTTPS for all API calls
4. Store sensitive data securely
5. Handle PCI compliance (Stripe handles this)

## 📊 Success Metrics
- ✅ Payment successful rate
- ✅ Error handling effectiveness
- ✅ User experience (time to complete payment)
- ✅ Order creation accuracy

## 🚀 Deployment Checklist
- [x] Backend database schema updated (Phase 1.1)
- [x] Backend API endpoints created (Phase 1.2)
- [x] URL routes configured (Phase 1.3)
- [ ] Database migration applied (python manage.py migrate)
- [ ] Backend endpoints tested locally
- [ ] Frontend payment flow tested
- [ ] Webhook endpoint tested with Stripe CLI
- [ ] Railway environment variables configured
- [ ] Mobile app rebuilt with Stripe dependencies
- [ ] End-to-end testing completed
- [ ] Error handling verified
- [ ] Security review completed

## ✅ Completed Tasks
- ✅ Created comprehensive integration plan
- ✅ Updated Order model with Stripe fields
- ✅ Created migration file
- ✅ Added Stripe API endpoints (create_payment_intent, confirm_payment, stripe_webhook)
- ✅ Configured URL routes for Stripe endpoints

## 📝 Notes
- Use Stripe test cards: `4242 4242 4242 4242`
- Webhook URL: `https://soti-delivery.up.railway.app/api/stripe/webhook/`
- Test mode: Enabled (pk_test_...)
- Rebuild required: Yes (native Stripe SDK)
