import { supabase, User, GameScore, HeartPurchase, LeaderboardEntry, TopSpender } from './supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

// ============================================
// OPTIMIZED DATABASE FUNCTIONS (2 tables only)
// ============================================

// Test function to check database structure
export const testDatabaseConnection = async () => {
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1)
    
    if (error) {
      return false
    }
    
    return true
  } catch (err) {
    return false
  }
}

// User functions
export const getUser = async (userId: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    return null
  }

  return data
}

export const createOrUpdateUser = async (userData: {
  id: string
  username: string
  name: string
  lives?: number
}): Promise<User | null> => {
  try {
    // First, check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('lives')
      .eq('id', userData.id)
      .single()

    const userExists = existingUser && !checkError

    if (userExists) {
      // User exists - only update username/name, preserve lives unless explicitly provided
      console.log(`[createOrUpdateUser] User exists with ${existingUser.lives} lives. Preserving lives value.`)
      
      const updateData: any = {
        username: userData.username,
        name: userData.name
      }

      // Only update lives if explicitly provided
      if (userData.lives !== undefined) {
        updateData.lives = userData.lives
        console.log(`[createOrUpdateUser] Lives explicitly provided: ${userData.lives}, will update`)
      } else {
        console.log(`[createOrUpdateUser] Lives not provided, preserving existing value: ${existingUser.lives}`)
      }
      // If lives not provided, don't include it - preserves existing value

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userData.id)
        .select()
        .single()

      if (error) {
        console.error('[createOrUpdateUser] Error updating existing user:', error)
        return null
      }

      console.log(`[createOrUpdateUser] ✅ Updated user, lives preserved: ${data.lives}`)
      return data
    } else {
      // New user - create with lives = 0 (or provided value)
      const livesValue = userData.lives !== undefined ? userData.lives : 0
      console.log(`[createOrUpdateUser] New user, creating with lives: ${livesValue}`)
      
      const insertData = {
        id: userData.id,
        username: userData.username,
        name: userData.name,
        lives: livesValue
      }

      const { data, error } = await supabase
        .from('users')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('[createOrUpdateUser] Error creating new user:', error)
        return null
      }

      console.log(`[createOrUpdateUser] ✅ Created new user with lives: ${data.lives}`)
      return data
    }
  } catch (err) {
    return null
  }
}

export const updateUserLives = async (userId: string, lives: number): Promise<boolean> => {
  const { error } = await supabase
    .from('users')
    .update({ lives })
    .eq('id', userId)

  if (error) {
    return false
  }

  return true
}

export const addHeartsToUser = async (userId: string, hearts: number): Promise<boolean> => {
  try {
    console.log(`[addHeartsToUser] Adding ${hearts} hearts to user ${userId}`);
    
    // Get current user data
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('lives')
      .eq('id', userId)
      .single()

    if (fetchError) {
      console.error(`[addHeartsToUser] Error fetching user:`, fetchError);
      return false
    }

    if (!currentUser) {
      console.error(`[addHeartsToUser] User not found: ${userId}`);
      return false
    }

    // Handle null/undefined lives - treat as 0
    const currentLives = (currentUser.lives !== null && currentUser.lives !== undefined) ? currentUser.lives : 0;
    const newLives = currentLives + hearts;
    
    console.log(`[addHeartsToUser] Current lives: ${currentLives}, Adding: ${hearts}, New total: ${newLives}`);

    const { error, data } = await supabase
      .from('users')
      .update({ lives: newLives })
      .eq('id', userId)
      .select()

    if (error) {
      console.error(`[addHeartsToUser] Error updating lives:`, error);
      return false
    }

    console.log(`[addHeartsToUser] ✅ Successfully updated user ${userId} lives to ${newLives}`);
    return true
  } catch (error) {
    console.error(`[addHeartsToUser] Exception:`, error);
    return false
  }
}

// Game score functions
export const saveGameScore = async (scoreData: {
  user_id: string
  score: number
  combo: number
}): Promise<boolean> => {
  try {
    console.log(`[saveGameScore] Saving score for user ${scoreData.user_id}: score=${scoreData.score}, combo=${scoreData.combo}`);
    
    // First, get current user data
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('best_score, best_combo')
      .eq('id', scoreData.user_id)
      .single()

    if (fetchError) {
      console.error(`[saveGameScore] Error fetching user:`, fetchError);
      return false
    }

    // Only update if this is a new best score or combo
    const shouldUpdateScore = !currentUser?.best_score || scoreData.score > (currentUser.best_score || 0)
    const shouldUpdateCombo = !currentUser?.best_combo || scoreData.combo > (currentUser.best_combo || 0)

    console.log(`[saveGameScore] Should update score: ${shouldUpdateScore}, Should update combo: ${shouldUpdateCombo}`);

    if (shouldUpdateScore || shouldUpdateCombo) {
      const updateData: any = {};
      if (shouldUpdateScore) {
        updateData.best_score = scoreData.score;
      }
      if (shouldUpdateCombo) {
        updateData.best_combo = scoreData.combo;
      }

      const { error: updateError, data } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', scoreData.user_id)
        .select()

      if (updateError) {
        console.error(`[saveGameScore] Error updating score:`, updateError);
        return false
      }

      console.log(`[saveGameScore] ✅ Successfully updated score:`, data);
    } else {
      console.log(`[saveGameScore] Score not higher than current best, skipping update`);
    }

    return true
  } catch (error) {
    console.error(`[saveGameScore] Exception:`, error);
    return false
  }
}

export const getLeaderboard = async (limit: number = 10, userId?: string): Promise<LeaderboardEntry[]> => {
  try {
    // Get all users with scores (including 0 scores)
    const { data, error } = await supabase
      .from('users')
      .select('id, username, name, best_score, best_combo')
      .order('best_score', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[getLeaderboard] Error:', error);
      return []
    }

    if (!data || !Array.isArray(data)) {
      return []
    }

    // If userId provided, ensure user is included even if not in top 10
    let leaderboardData = data.map((entry: any, index: number) => ({
      rank: index + 1,
      name: entry.name || entry.username || 'Unknown Player',
      score: entry.best_score || 0,
      combo: entry.best_combo || 0,
      date: new Date().toLocaleDateString(),
      id: entry.id
    }));

    // If user not in top 10, add them at the end
    if (userId) {
      const userInLeaderboard = leaderboardData.find(entry => entry.id === userId);
      if (!userInLeaderboard) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, username, name, best_score, best_combo')
          .eq('id', userId)
          .single();

        if (userData) {
          // Find user's actual rank
          const { count } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .gt('best_score', userData.best_score || 0);

          const userRank = (count || 0) + 1;
          
          leaderboardData.push({
            rank: userRank,
            name: userData.name || userData.username || 'Unknown Player',
            score: userData.best_score || 0,
            combo: userData.best_combo || 0,
            date: new Date().toLocaleDateString(),
            id: userData.id
          });
        }
      }
    }

    return leaderboardData
  } catch (error) {
    console.error('[getLeaderboard] Exception:', error);
    return []
  }
}

// Payment functions
export const recordPayment = async (paymentData: {
  user_id: string
  amount: number
}): Promise<boolean> => {
  try {
    // Get current user data - try by id first, then by username
    let query = supabase
      .from('users')
      .select('total_spent, lives, payment_count, last_payment_date, id, username')
    
    if (paymentData.user_id && paymentData.user_id !== 'undefined') {
      // First try to find by id
      query = query.eq('id', paymentData.user_id)
    } else {
      return false
    }
    
    let { data: currentUser, error: fetchError } = await query.single()
    
    // If not found by id, try by username (in case user_id is actually a username)
    if (fetchError && paymentData.user_id) {
      const { data: userByUsername, error: usernameError } = await supabase
        .from('users')
        .select('total_spent, lives, payment_count, last_payment_date, id, username')
        .eq('username', paymentData.user_id)
        .single()
      
      if (!usernameError && userByUsername) {
        currentUser = userByUsername
        fetchError = null
      }
    }

    if (fetchError || !currentUser) {
      // Create new user if they don't exist
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: paymentData.user_id,
          username: paymentData.user_id, // Use user_id as username for now
          name: 'Player',
          lives: 0, // Start with 0 extra lives (no default)
          total_spent: 0,
          payment_count: 0,
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (createError) {
        return false
      }
      
      currentUser = newUser
    }

    // Update user's record with payment info and lives
    const { error: userError } = await supabase
      .from('users')
      .update({
        total_spent: (currentUser.total_spent || 0) + paymentData.amount,
        lives: (currentUser.lives || 0) + 1, // Add 1 life for payment
        payment_count: (currentUser.payment_count || 0) + 1,
        last_payment_date: new Date().toISOString()
      })
      .eq('id', currentUser.id)

    if (userError) {
      return false
    }

    // Also record the payment in the payments table
    // First check if a payment record already exists for this user and payment type
    const { data: existingPayment, error: checkError } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', currentUser.id)
      .eq('payment_type', 'game_continue')
      .single()

    let paymentError = null
    if (existingPayment) {
      // Update existing payment record
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          amount: (existingPayment.amount || 0) + paymentData.amount,
          payment_count: (existingPayment.payment_count || 1) + 1,
          last_payment_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPayment.id)
      
      paymentError = updateError
    } else {
      // Insert new payment record
      const { error: insertError } = await supabase
        .from('payments')
        .insert({
          user_id: currentUser.id,
          amount: paymentData.amount,
          payment_type: 'game_continue',
          payment_count: 1,
          first_payment_date: new Date().toISOString(),
          last_payment_date: new Date().toISOString()
        })
      
      paymentError = insertError
    }

    return true
  } catch (error) {
    return false
  }
}

// Get user's payment statistics (simplified - from users table)
export const getUserPaymentStats = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('total_spent, payment_count, last_payment_date')
      .eq('id', userId)
      .single()

    if (error) {
      return null
    }

    if (!data) {
      return {
        total_amount: 0,
        payment_count: 0,
        last_payment_date: null
      }
    }

    return {
      total_amount: data.total_spent || 0,
      payment_count: data.payment_count || 0,
      last_payment_date: data.last_payment_date
    }
  } catch (error) {
    return null
  }
}

export const getTopSpender = async (): Promise<TopSpender | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('name, total_spent')
      .not('total_spent', 'is', null)
      .order('total_spent', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      return null
    }

    if (!data) {
      return null
    }

    return {
      name: data.name || 'Unknown Player',
      total_amount_spent: data.total_spent || 0
    }
  } catch (error) {
    return null
  }
}

// User spending stats (simplified)
export const getUserSpendingStats = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('total_spent, lives')
    .eq('id', userId)
    .single()

  if (error) {
    return null
  }

  return {
    total_amount_spent: data.total_spent,
    current_lives: data.lives
  }
}

// Get user's best score (simplified)
export const getUserBestScore = async (userId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('users')
    .select('best_score')
    .eq('id', userId)
    .single()

  if (error) {
    return 0
  }

  return data?.best_score || 0
}

// ============================================
// REALTIME SUBSCRIPTIONS (SIMPLIFIED)
// ============================================

export const subscribeToUserChanges = (
  userId: string, 
  onUpdate: (user: User) => void
): RealtimeChannel => {
  return supabase
    .channel(`user_changes_${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'users',
        filter: `id=eq.${userId}`
      },
      (payload: any) => {
        switch (payload.eventType) {
          case 'INSERT':
            if (payload.new) {
              onUpdate(payload.new as User)
            }
            break
            
          case 'UPDATE':
            if (payload.new) {
              onUpdate(payload.new as User)
            }
            break
            
          case 'DELETE':
            // Handle user deletion - could trigger logout or redirect
            break
        }
      }
    )
    .subscribe()
}

export const subscribeToSpendingStatsChanges = (
  userId: string,
  onUpdate: (spendingStats: any) => void
): RealtimeChannel => {
  return supabase
    .channel(`spending_stats_${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'users',
        filter: `id=eq.${userId}`
      },
      (payload: any) => {
        switch (payload.eventType) {
          case 'INSERT':
            if (payload.new) {
              onUpdate({
                total_amount_spent: (payload.new as any).total_spent || 0,
                current_lives: (payload.new as any).lives !== null && (payload.new as any).lives !== undefined ? (payload.new as any).lives : 0
              })
            }
            break
            
          case 'UPDATE':
            if (payload.new) {
              onUpdate({
                total_amount_spent: (payload.new as any).total_spent || 0,
                current_lives: (payload.new as any).lives !== null && (payload.new as any).lives !== undefined ? (payload.new as any).lives : 0
              })
            }
            break
            
          case 'DELETE':
            // Reset to default values
            onUpdate({
              total_amount_spent: 0,
              current_lives: 0
            })
            break
        }
      }
    )
    .subscribe()
}

export const subscribeToGameScoresChanges = (
  onUpdate: (leaderboard: LeaderboardEntry[]) => void
): RealtimeChannel => {
  return supabase
    .channel('game_scores_changes')
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'users'
      },
      async (payload: any) => {
        // Refetch leaderboard when any user data changes
        try {
          const leaderboard = await getLeaderboard(10)
          onUpdate(leaderboard)
        } catch (error) {
          // Silent error handling
        }
      }
    )
    .subscribe()
}

// Subscribe to user payment changes (simplified - from users table)
export const subscribeToUserPaymentChanges = (
  userId: string,
  onUpdate: (paymentStats: any) => void
): RealtimeChannel => {
  return supabase
    .channel(`user_payments_${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'users',
        filter: `id=eq.${userId}`
      },
      async (payload: any) => {
        switch (payload.eventType) {
          case 'INSERT':
            if (payload.new) {
              const paymentStats = {
                total_amount: (payload.new as any).total_spent || 0,
                payment_count: (payload.new as any).payment_count || 0,
                last_payment_date: (payload.new as any).last_payment_date
              }
              onUpdate(paymentStats)
            }
            break
            
          case 'UPDATE':
            if (payload.new) {
              const paymentStats = {
                total_amount: (payload.new as any).total_spent || 0,
                payment_count: (payload.new as any).payment_count || 0,
                last_payment_date: (payload.new as any).last_payment_date
              }
              onUpdate(paymentStats)
            }
            break
            
          case 'DELETE':
            // Reset to default values
            onUpdate({
              total_amount: 0,
              payment_count: 0,
              last_payment_date: null
            })
            break
        }
      }
    )
    .subscribe()
}

// Subscribe to user_purchases table changes (if it exists)
export const subscribeToUserPurchasesChanges = (
  userId: string,
  onUpdate: (purchases: any[]) => void
): RealtimeChannel => {
  return supabase
    .channel(`user_purchases_${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'user_purchases',
        filter: `user_id=eq.${userId}`
      },
      async (payload: any) => {
        // Refetch user's purchases
        try {
          const { data, error } = await supabase
            .from('user_purchases')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
          
          if (!error && data) {
            onUpdate(data)
          }
        } catch (error) {
          // Silent error handling
        }
      }
    )
    .subscribe()
}

// Subscribe to top spender changes
export const subscribeToTopSpenderChanges = (
  onUpdate: (topSpender: TopSpender | null) => void
): RealtimeChannel => {
  return supabase
    .channel('top_spender_changes')
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'users'
      },
      async (payload: any) => {
        // Refetch top spender when any user data changes
        try {
          const topSpender = await getTopSpender()
          onUpdate(topSpender)
        } catch (error) {
          // Silent error handling
        }
      }
    )
    .subscribe()
}

// Comprehensive real-time subscription for all tables
export const subscribeToAllTableChanges = (
  onTableChange: (tableName: string, eventType: string, data: any) => void
): RealtimeChannel => {
  return supabase
    .channel('all_tables_changes')
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'users'
      },
      (payload: any) => {
        onTableChange('users', payload.eventType, payload)
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'payments'
      },
      (payload: any) => {
        onTableChange('payments', payload.eventType, payload)
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'user_purchases'
      },
      (payload: any) => {
        onTableChange('user_purchases', payload.eventType, payload)
      }
    )
    .subscribe()
}

export const unsubscribeFromChannel = (channel: RealtimeChannel) => {
  supabase.removeChannel(channel)
}

// ============================================
// LEGACY FUNCTIONS (for backward compatibility)
// ============================================

// These functions maintain compatibility with existing code
export const purchaseHeartsDuringGame = async (purchaseData: {
  user_id: string
  hearts_purchased: number
  amount_spent: number
}): Promise<boolean> => {
  // Convert to new payment system
  return recordPayment({
    user_id: purchaseData.user_id,
    amount: purchaseData.amount_spent
  })
}

export const mergePurchasedHeartsOnGameEnd = async (userId: string): Promise<boolean> => {
  // No longer needed with simplified system
  return true
}

export const updateUserHearts = async (userId: string, hearts: number): Promise<boolean> => {
  return updateUserLives(userId, hearts)
}

// Cache functions (simplified)
export const invalidateUserCache = (userId: string) => {
  // Cache is handled by Supabase automatically
}
