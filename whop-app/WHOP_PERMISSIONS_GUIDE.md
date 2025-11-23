# 🎯 Whop App Permissions Guide for BubbleType Game

## 🚨 **CRITICAL PERMISSIONS** (Must Have)

### **1. Checkout & Payment Management**
- ✅ **`company:manage_checkout`** - **CRITICAL** - Create and manage checkout sessions for $2 game continue payments
- ✅ **`payment:basic:read`** - Read payment information to verify successful payments
- ✅ **`payment:charge`** - Process payments (if needed for direct charging)

### **2. Plan Management**
- ✅ **`plan:basic:read`** - Read plan information (your $2 access pass plan)
- ✅ **`plan:create`** - Create new plans if needed
- ✅ **`plan:update`** - Update existing plans

### **3. Webhook Management**
- ✅ **`webhook_receive:payments`** - **CRITICAL** - Receive payment success/failure webhooks
- ✅ **`webhook_receive:app_payments`** - Receive app-specific payment webhooks
- ✅ **`developer:manage_webhook`** - Manage webhook endpoints

### **4. Member Management**
- ✅ **`member:basic:read`** - Read member information (user data)
- ✅ **`member:manage`** - Manage member accounts

## 🔧 **RECOMMENDED PERMISSIONS** (Good to Have)

### **5. Company & App Management**
- ✅ **`company:basic:read`** - Read company information
- ✅ **`developer:basic:read`** - Read developer/app information
- ✅ **`developer:manage_api_key`** - Manage API keys

### **6. Analytics & Stats**
- ✅ **`payment:basic:export`** - Export payment data for analytics
- ✅ **`member:stats:read`** - Read member statistics
- ✅ **`stats:read`** - Read general statistics

## 🎮 **JUSTIFICATION FOR EACH PERMISSION**

### **`company:manage_checkout`** - **MOST CRITICAL**
**Why:** This is the permission that's currently missing and causing your 403 error. Your app needs to create checkout sessions when users click "PAY $2 TO CONTINUE".

**What it does:** Allows your app to create Whop checkout sessions for the $2 game continue payment.

### **`webhook_receive:payments`** - **CRITICAL**
**Why:** When a user completes payment, Whop sends a webhook to your app to notify you of the successful payment.

**What it does:** Allows your app to receive real-time notifications when payments are completed, so you can add lives to the user's account.

### **`payment:basic:read`** - **CRITICAL**
**Why:** Your app needs to verify payment status and read payment details.

**What it does:** Allows your app to check if a payment was successful and get payment details.

### **`plan:basic:read`** - **CRITICAL**
**Why:** Your app needs to read the $2 access pass plan details.

**What it does:** Allows your app to fetch plan information for the checkout session.

### **`member:basic:read`** - **IMPORTANT**
**Why:** Your app needs to read user information to identify who made the payment.

**What it does:** Allows your app to get user details for payment processing.

## 🚫 **PERMISSIONS YOU DON'T NEED** (Skip These)

- ❌ `access_pass:*` - You're not using access passes
- ❌ `chat:*` - No chat functionality
- ❌ `forum:*` - No forum functionality
- ❌ `livestream:*` - No livestream functionality
- ❌ `courses:*` - No course functionality
- ❌ `affiliate:*` - No affiliate system
- ❌ `ad_campaign:*` - No advertising
- ❌ `content_rewards:*` - No content rewards
- ❌ `tracking_link:*` - No tracking links
- ❌ `invoice:*` - No invoicing
- ❌ `shipment:*` - No physical products

## 📋 **QUICK CHECKLIST - SELECT THESE PERMISSIONS**

Copy and paste this list to quickly find the permissions you need:

```
company:manage_checkout
payment:basic:read
payment:charge
plan:basic:read
plan:create
plan:update
webhook_receive:payments
webhook_receive:app_payments
developer:manage_webhook
member:basic:read
member:manage
company:basic:read
developer:basic:read
developer:manage_api_key
payment:basic:export
member:stats:read
stats:read
```

## 🎯 **STEP-BY-STEP SETUP**

### **Step 1: Select Permissions**
1. Go to your Whop app permissions page
2. Search for each permission from the list above
3. Check the box for each one

### **Step 2: Save Changes**
1. Click "Save" or "Update Permissions"
2. Wait for the changes to take effect (usually immediate)

### **Step 3: Test Your App**
1. Go to: `http://localhost:3000/debug-checkout`
2. Click "Test Create Checkout"
3. Should work without 403 error

### **Step 4: Test in Game**
1. Play game until bubbles hit bottom
2. Click "PAY $2 TO CONTINUE"
3. Should open Whop checkout page

## 🚨 **MOST IMPORTANT PERMISSION**

**`company:manage_checkout`** is the one that's currently missing and causing your 403 error. Make sure to select this one first!

## 🎉 **Expected Result**

After selecting these permissions:
- ✅ No more 403 Forbidden errors
- ✅ Checkout sessions created successfully
- ✅ Whop checkout page opens
- ✅ Users can complete $2 payments
- ✅ Webhooks received for payment confirmations
- ✅ Lives added to user accounts automatically

**Select these permissions and your payment system will work perfectly!** 🚀
