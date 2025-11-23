# 🔄 Real-time CRUD Operations Guide

## Overview
This guide explains how all database operations (Create, Read, Update, Delete) are monitored and updated in real-time across your entire application.

## 🎯 What's Monitored in Real-time

### ✅ **Complete CRUD Coverage**
- **CREATE** - New records inserted
- **READ** - Data fetched (handled by subscriptions)
- **UPDATE** - Existing records modified
- **DELETE** - Records removed

### 📊 **Tables Monitored**
1. **`users`** - User data, scores, spending, lives
2. **`payments`** - Payment records (if exists)
3. **`user_purchases`** - Purchase history (if exists)

## 🚀 **Real-time Subscriptions**

### 1. **User Changes** (`subscribeToUserChanges`)
```typescript
// Monitors: INSERT, UPDATE, DELETE on users table
const userChannel = subscribeToUserChanges(userId, (user) => {
  console.log('User updated:', user)
  // Update UI immediately
})
```

### 2. **Spending Stats** (`subscribeToSpendingStatsChanges`)
```typescript
// Monitors: total_spent, lives changes
const spendingChannel = subscribeToSpendingStatsChanges(userId, (stats) => {
  console.log('Spending updated:', stats)
  // Update spending display immediately
})
```

### 3. **Game Scores** (`subscribeToGameScoresChanges`)
```typescript
// Monitors: best_score, best_combo changes
const scoresChannel = subscribeToGameScoresChanges((leaderboard) => {
  console.log('Leaderboard updated:', leaderboard)
  // Update leaderboard immediately
})
```

### 4. **Payment Changes** (`subscribeToUserPaymentChanges`)
```typescript
// Monitors: payment_count, last_payment_date changes
const paymentChannel = subscribeToUserPaymentChanges(userId, (paymentStats) => {
  console.log('Payment stats updated:', paymentStats)
  // Update payment info immediately
})
```

### 5. **Top Spender** (`subscribeToTopSpenderChanges`)
```typescript
// Monitors: total_spent changes across all users
const topSpenderChannel = subscribeToTopSpenderChanges((topSpender) => {
  console.log('Top spender updated:', topSpender)
  // Update top spender display immediately
})
```

### 6. **All Tables** (`subscribeToAllTableChanges`)
```typescript
// Monitors: ALL tables for ANY changes
const allTablesChannel = subscribeToAllTableChanges((tableName, eventType, data) => {
  console.log(`${tableName} ${eventType}:`, data)
  // Handle any table change
})
```

## 🔧 **Event Types Handled**

### **INSERT Events**
```typescript
case 'INSERT':
  console.log('✅ New record created:', payload.new)
  // Handle new data
  break
```

### **UPDATE Events**
```typescript
case 'UPDATE':
  console.log('📝 Record updated:', payload.new)
  // Handle updated data
  break
```

### **DELETE Events**
```typescript
case 'DELETE':
  console.log('⚠️ Record deleted:', payload.old)
  // Handle deletion
  break
```

## 📱 **Component Integration**

### **MobileGamePage.tsx**
```typescript
useEffect(() => {
  // Set up all real-time subscriptions
  const userChannel = subscribeToUserChanges(user.username, onUserUpdate)
  const spendingChannel = subscribeToSpendingStatsChanges(user.username, onSpendingUpdate)
  const scoresChannel = subscribeToGameScoresChanges(onLeaderboardUpdate)
  const topSpenderChannel = subscribeToTopSpenderChanges(onTopSpenderUpdate)
  const paymentChannel = subscribeToUserPaymentChanges(user.username, onPaymentUpdate)
  
  // Store channels for cleanup
  realtimeChannelsRef.current = [
    userChannel, spendingChannel, scoresChannel, 
    topSpenderChannel, paymentChannel
  ]
  
  return () => {
    // Cleanup all subscriptions
    realtimeChannelsRef.current.forEach(unsubscribeFromChannel)
  }
}, [user?.username])
```

### **BubbleTypeGame.tsx**
```typescript
useEffect(() => {
  // Set up game-specific subscriptions
  const userChannel = subscribeToUserChanges(user.username, onUserUpdate)
  const spendingChannel = subscribeToSpendingStatsChanges(user.username, onSpendingUpdate)
  const paymentChannel = subscribeToUserPaymentChanges(user.username, onPaymentUpdate)
  
  realtimeChannelsRef.current = [userChannel, spendingChannel, paymentChannel]
  
  return () => {
    realtimeChannelsRef.current.forEach(unsubscribeFromChannel)
  }
}, [user?.username, lives])
```

## 🧪 **Testing Real-time Operations**

### **Use the RealtimeMonitor Component**
```typescript
import RealtimeMonitor from '@/components/RealtimeMonitor'

// Add to your app for testing
<RealtimeMonitor />
```

### **Test Operations**
1. **CREATE** - Create new user
2. **UPDATE** - Update user lives/spending
3. **READ** - Fetch leaderboard/scores
4. **DELETE** - Remove user (if needed)

## 🎯 **Real-time Benefits**

### ✅ **Instant Updates**
- No page refresh needed
- UI updates immediately
- Multiple users see changes instantly

### ✅ **Complete Coverage**
- All CRUD operations monitored
- All tables covered
- All event types handled

### ✅ **Automatic Cleanup**
- Subscriptions cleaned up on unmount
- No memory leaks
- Proper channel management

## 🔧 **Setup Requirements**

### 1. **Run SQL Script**
```sql
-- Enable real-time for all tables
\i enable-realtime-all-tables.sql
```

### 2. **Add Payment Columns**
```sql
-- Add payment tracking to users table
\i add-payment-columns-to-users.sql
```

### 3. **Verify Supabase Settings**
- Real-time enabled in Supabase dashboard
- RLS policies allow real-time subscriptions
- Tables added to `supabase_realtime` publication

## 📊 **Monitoring & Debugging**

### **Console Logs**
All real-time events are logged with emojis:
- 🔄 User data changed
- 💰 Spending stats changed
- 🏆 Game scores changed
- 💳 Payment data changed
- 👑 Top spender changed
- 🛒 Purchase changed

### **Event Tracking**
```typescript
// Each event includes:
{
  eventType: 'INSERT' | 'UPDATE' | 'DELETE',
  table: 'users' | 'payments' | 'user_purchases',
  new: updatedData,
  old: previousData
}
```

## 🚨 **Troubleshooting**

### **Real-time Not Working?**
1. Check Supabase dashboard - real-time enabled?
2. Run `enable-realtime-all-tables.sql`
3. Check browser console for errors
4. Verify RLS policies allow subscriptions

### **Missing Updates?**
1. Check if table is in `supabase_realtime` publication
2. Verify subscription is active
3. Check for JavaScript errors
4. Ensure proper cleanup of channels

### **Performance Issues?**
1. Limit number of active subscriptions
2. Use specific filters (user_id, etc.)
3. Clean up unused channels
4. Monitor memory usage

## 🎉 **Result**

With this setup, your application now has **complete real-time CRUD monitoring**:

- ✅ **All tables monitored**
- ✅ **All operations tracked**
- ✅ **Instant UI updates**
- ✅ **No page refreshes needed**
- ✅ **Multi-user synchronization**
- ✅ **Automatic cleanup**

**Your users will see all changes instantly across all devices!** 🚀
