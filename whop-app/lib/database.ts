import { supabase, User, GameScore, HeartPurchase, LeaderboardEntry, TopSpender } from './supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

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
  hearts?: number
}): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .upsert({
      ...userData,
      hearts: userData.hearts || 3, // Default 3 hearts
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'id',
      ignoreDuplicates: false
    })
    .select()
    .single()

  if (error) {
    return null
  }

  return data
}

export const updateUserHearts = async (userId: string, hearts: number): Promise<boolean> => {
  // Update users table
  const { error: userError } = await supabase
    .from('users')
    .update({ 
      hearts,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (userError) {
    // Silent error handling('Error updating user hearts in users table:', userError)
    return false
  }

  // Also update the current_hearts in user_heart_stats to keep them in sync
  const { error: statsError } = await supabase
    .from('user_heart_stats')
    .update({ 
      current_hearts: hearts,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)

  if (statsError && statsError.code !== 'PGRST116') {
    // Silent error handling('Error updating user hearts in stats table:', statsError)
    // Don't return false here as the main update succeeded
  }

  return true
}

// New function to get user spending statistics with caching
export const getUserSpendingStats = async (userId: string) => {
  const cacheKey = `spendingStats_${userId}`;
  const cached = userDataCache.get(cacheKey);
  
  // Return cached data if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const { data, error } = await supabase
    .from('user_heart_stats')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    // Silent error handling('Error fetching user spending stats:', error)
    return null
  }

  // Cache the result
  userDataCache.set(cacheKey, { data, timestamp: Date.now() });
  
  return data;
}

// Cache for user data to reduce database calls
const userDataCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

// Function to invalidate cache for a user
export const invalidateUserCache = (userId: string) => {
  userDataCache.delete(`bestScore_${userId}`);
  userDataCache.delete(`spendingStats_${userId}`);
  // Silent logging(`Cache invalidated for user: ${userId}`);
};

// Function to get user's best score from database with caching
export const getUserBestScore = async (userId: string): Promise<number> => {
  const cacheKey = `bestScore_${userId}`;
  const cached = userDataCache.get(cacheKey);
  
  // Return cached data if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const { data, error } = await supabase
    .from('game_scores')
    .select('score')
    .eq('user_id', userId)
    .order('score', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    // Silent error handling('Error fetching user best score:', error)
    return 0
  }

  const score = data?.score || 0;
  
  // Cache the result
  userDataCache.set(cacheKey, { data: score, timestamp: Date.now() });
  
  return score;
}

// Game score functions
export const saveGameScore = async (scoreData: {
  user_id: string
  score: number
  combo: number
}): Promise<boolean> => {
  // Silent logging('Attempting to save game score:', scoreData)
  
  // First, check if user already has a score record
  const { data: existingScore, error: fetchError } = await supabase
    .from('game_scores')
    .select('*')
    .eq('user_id', scoreData.user_id)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    // Silent error handling('Error fetching existing score:', fetchError)
    return false
  }

  if (existingScore) {
    // Update existing record if new score is higher
    if (scoreData.score > existingScore.score) {
      const { data, error } = await supabase
        .from('game_scores')
        .update({
          score: scoreData.score,
          combo: scoreData.combo,
          created_at: new Date().toISOString()
        })
        .eq('user_id', scoreData.user_id)
        .select()

      if (error) {
        // Silent error handling('Error updating game score:', error)
        return false
      }

      // Silent logging('Game score updated successfully:', data)
      // Invalidate cache since score was updated
      invalidateUserCache(scoreData.user_id);
    } else {
      // Silent logging('New score is not higher than existing score, not updating')
    }
  } else {
    // Insert new record if user doesn't have a score yet
    const { data, error } = await supabase
      .from('game_scores')
      .insert({
        ...scoreData,
        created_at: new Date().toISOString()
      })
      .select()

    if (error) {
      // Silent error handling('Error inserting game score:', error)
      return false
    }

    // Silent logging('Game score inserted successfully:', data)
    // Invalidate cache since new score was added
    invalidateUserCache(scoreData.user_id);
  }

  return true
}

// Function to clean up duplicate game scores (keep only the highest score per user)
export const cleanupDuplicateScores = async (): Promise<boolean> => {
  try {
    // Silent logging('Cleaning up duplicate game scores...')
    
    // Get all users with multiple scores
    const { data: duplicateUsers, error: fetchError } = await supabase
      .from('game_scores')
      .select('user_id')
      .then((result: any) => {
        if (result.error) throw result.error
        // Group by user_id and find users with multiple scores
        const userCounts = result.data.reduce((acc: any, score: any) => {
          acc[score.user_id] = (acc[score.user_id] || 0) + 1
          return acc
        }, {})
        return { data: Object.keys(userCounts).filter(userId => userCounts[userId] > 1), error: null }
      })

    if (fetchError) {
      // Silent error handling('Error fetching duplicate users:', fetchError)
      return false
    }

    // For each user with duplicates, keep only the highest score
    for (const userId of duplicateUsers) {
      const { data: userScores, error: scoresError } = await supabase
        .from('game_scores')
        .select('*')
        .eq('user_id', userId)
        .order('score', { ascending: false })

      if (scoresError) {
        // Silent error handling(`Error fetching scores for user ${userId}:`, scoresError)
        continue
      }

      if (userScores && userScores.length > 1) {
        // Keep the highest score, delete the rest
        const highestScore = userScores[0]
        const scoresToDelete = userScores.slice(1)

        for (const score of scoresToDelete) {
          const { error: deleteError } = await supabase
            .from('game_scores')
            .delete()
            .eq('id', score.id)

          if (deleteError) {
            // Silent error handling(`Error deleting duplicate score for user ${userId}:`, deleteError)
          }
        }

        // Silent logging(`Cleaned up ${scoresToDelete.length} duplicate scores for user ${userId}`)
      }
    }

    // Silent logging('Duplicate score cleanup completed')
    return true
  } catch (error) {
    // Silent error handling('Error during cleanup:', error)
    return false
  }
}

export const getLeaderboard = async (limit: number = 10): Promise<LeaderboardEntry[]> => {
  const { data, error } = await supabase
    .from('game_scores')
    .select(`
      score,
      combo,
      created_at,
      users!inner(name, username)
    `)
    .order('score', { ascending: false })
    .limit(limit)

  if (error) {
    // Silent error handling('Error fetching leaderboard:', error)
    return []
  }

  return data.map((entry: any, index: number) => ({
    rank: index + 1,
    name: entry.users.name,
    score: entry.score,
    combo: entry.combo,
    date: new Date(entry.created_at).toLocaleDateString()
  }))
}

// Heart purchase functions
// Purchase hearts during gameplay (temporary hearts)
export const purchaseHeartsDuringGame = async (purchaseData: {
  user_id: string
  hearts_purchased: number
  amount_spent: number
}): Promise<boolean> => {
  // Silent logging('Attempting to purchase hearts during game:', purchaseData)
  
  // Check if user already has heart stats
  const { data: existingStats, error: fetchError } = await supabase
    .from('user_heart_stats')
    .select('*')
    .eq('user_id', purchaseData.user_id)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    // Silent error handling('Error fetching existing heart stats:', fetchError)
    return false
  }

  if (existingStats) {
    // Update existing record - add to purchased_hearts_during_game
    const currentPurchasedDuringGame = existingStats.purchased_hearts_during_game || 0;
    const { data, error } = await supabase
      .from('user_heart_stats')
      .update({
        total_hearts_purchased: existingStats.total_hearts_purchased + purchaseData.hearts_purchased,
        total_amount_spent: parseFloat(existingStats.total_amount_spent) + purchaseData.amount_spent,
        purchased_hearts_during_game: currentPurchasedDuringGame + purchaseData.hearts_purchased,
        last_purchase_date: new Date().toISOString(),
        purchase_count: existingStats.purchase_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', purchaseData.user_id)
      .select()

    if (error) {
      // Silent error handling('Error updating heart stats during game:', error)
      return false
    }

    // Silent logging('Heart stats updated during game successfully:', data)
    // Invalidate cache since heart stats were updated
    invalidateUserCache(purchaseData.user_id);
  } else {
    // Insert new record
    const { data, error } = await supabase
      .from('user_heart_stats')
      .insert({
        user_id: purchaseData.user_id,
        total_hearts_purchased: purchaseData.hearts_purchased,
        total_amount_spent: purchaseData.amount_spent,
        current_hearts: 3, // Default 3 hearts (not including purchased during game)
        purchased_hearts_during_game: purchaseData.hearts_purchased,
        first_purchase_date: new Date().toISOString(),
        last_purchase_date: new Date().toISOString(),
        purchase_count: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()

    if (error) {
      // Silent error handling('Error inserting heart stats during game:', error)
      return false
    }

    // Silent logging('Heart stats inserted during game successfully:', data)
    // Invalidate cache since new heart stats were added
    invalidateUserCache(purchaseData.user_id);
  }

  return true
}

// Legacy function for backward compatibility
export const saveHeartPurchase = async (purchaseData: {
  user_id: string
  hearts_purchased: number
  amount_spent: number
}): Promise<boolean> => {
  // Silent logging('Attempting to save heart purchase (legacy):', purchaseData)
  
  // Check if user already has heart stats
  const { data: existingStats, error: fetchError } = await supabase
    .from('user_heart_stats')
    .select('*')
    .eq('user_id', purchaseData.user_id)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    // Silent error handling('Error fetching existing heart stats:', fetchError)
    return false
  }

  if (existingStats) {
    // Update existing record
    const { data, error } = await supabase
      .from('user_heart_stats')
      .update({
        total_hearts_purchased: existingStats.total_hearts_purchased + purchaseData.hearts_purchased,
        total_amount_spent: parseFloat(existingStats.total_amount_spent) + purchaseData.amount_spent,
        current_hearts: existingStats.current_hearts + purchaseData.hearts_purchased,
        last_purchase_date: new Date().toISOString(),
        purchase_count: existingStats.purchase_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', purchaseData.user_id)
      .select()

    if (error) {
      // Silent error handling('Error updating heart stats:', error)
      return false
    }

    // Silent logging('Heart stats updated successfully:', data)
    // Invalidate cache since heart stats were updated
    invalidateUserCache(purchaseData.user_id);
  } else {
    // Insert new record
    const { data, error } = await supabase
      .from('user_heart_stats')
      .insert({
        user_id: purchaseData.user_id,
        total_hearts_purchased: purchaseData.hearts_purchased,
        total_amount_spent: purchaseData.amount_spent,
        current_hearts: 3 + purchaseData.hearts_purchased, // Default 3 hearts + purchased
        first_purchase_date: new Date().toISOString(),
        last_purchase_date: new Date().toISOString(),
        purchase_count: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()

    if (error) {
      // Silent error handling('Error inserting heart stats:', error)
      return false
    }

    // Silent logging('Heart stats inserted successfully:', data)
    // Invalidate cache since new heart stats were added
    invalidateUserCache(purchaseData.user_id);
  }

  return true
}

// Merge purchased hearts during game into current_hearts when game ends
export const mergePurchasedHeartsOnGameEnd = async (userId: string): Promise<boolean> => {
  // Silent logging('Attempting to merge purchased hearts on game end for:', userId)
  
  // Get current heart stats
  const { data: existingStats, error: fetchError } = await supabase
    .from('user_heart_stats')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    // Silent error handling('Error fetching heart stats for game end:', fetchError)
    return false
  }

  if (existingStats && (existingStats.purchased_hearts_during_game || 0) > 0) {
    // Merge purchased_hearts_during_game into current_hearts and reset purchased_hearts_during_game
    const purchasedDuringGame = existingStats.purchased_hearts_during_game || 0;
    const { data, error } = await supabase
      .from('user_heart_stats')
      .update({
        current_hearts: existingStats.current_hearts + purchasedDuringGame,
        purchased_hearts_during_game: 0, // Reset to 0
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()

    if (error) {
      // Silent error handling('Error merging purchased hearts on game end:', error)
      return false
    }

    // Silent logging(`Merged ${purchasedDuringGame} purchased hearts into current_hearts. New total: ${existingStats.current_hearts + purchasedDuringGame}`)
    // Invalidate cache since heart stats were updated
    invalidateUserCache(userId);
  } else {
    // Silent logging('No purchased hearts during game to merge')
  }

  return true
}

export const getTopSpender = async (): Promise<TopSpender | null> => {
  const { data, error } = await supabase
    .from('user_heart_stats')
    .select(`
      user_id,
      total_hearts_purchased,
      total_amount_spent,
      users!inner(name)
    `)
    .order('total_amount_spent', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    // Silent error handling('Error fetching top spender:', error)
    return null
  }

  if (!data) {
    return null
  }

  return {
    name: data.users?.[0]?.name || 'Unknown',
    total_amount_spent: parseFloat(data.total_amount_spent)
  }
}

export const getUserTotalHeartsPurchased = async (userId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('user_heart_stats')
    .select('total_hearts_purchased')
    .eq('user_id', userId)
    .single()

  if (error) {
    // Silent error handling('Error fetching user total hearts purchased:', error)
    return 0
  }

  return data?.total_hearts_purchased || 0
}

// ===== REALTIME SUBSCRIPTIONS =====

// Subscribe to user data changes (hearts, profile updates)
export const subscribeToUserChanges = (
  userId: string, 
  onUpdate: (user: User) => void
): RealtimeChannel => {
  return supabase
    .channel(`user_changes_${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'users',
        filter: `id=eq.${userId}`
      },
      (payload: any) => {
        // Silent logging('🔄 User data changed:', payload)
        if (payload.new) {
          onUpdate(payload.new as User)
        }
      }
    )
    .subscribe()
}

// Subscribe to user spending stats changes
export const subscribeToSpendingStatsChanges = (
  userId: string,
  onUpdate: (spendingStats: any) => void
): RealtimeChannel => {
  return supabase
    .channel(`spending_stats_${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // Listen to all events
        schema: 'public',
        table: 'user_heart_stats',
        filter: `user_id=eq.${userId}`
      },
      (payload: any) => {
        // Silent logging('💰 Spending stats changed:', payload)
        if (payload.new) {
          onUpdate(payload.new)
        }
      }
    )
    .subscribe()
}

// Subscribe to game scores changes (for leaderboard updates)
export const subscribeToGameScoresChanges = (
  onUpdate: (leaderboard: LeaderboardEntry[]) => void
): RealtimeChannel => {
  return supabase
    .channel('game_scores_changes')
    .on(
      'postgres_changes',
      {
        event: '*', // Listen to all events
        schema: 'public',
        table: 'game_scores'
      },
      async (payload: any) => {
        // Silent logging('🏆 Game scores changed:', payload)
        // Refetch leaderboard when scores change
        const leaderboard = await getLeaderboard(10)
        onUpdate(leaderboard)
      }
    )
    .subscribe()
}

// Subscribe to all heart purchases (for analytics/statistics)
export const subscribeToHeartPurchases = (
  onUpdate: (purchase: HeartPurchase) => void
): RealtimeChannel => {
  return supabase
    .channel('heart_purchases_changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT', // Only listen to new purchases
        schema: 'public',
        table: 'heart_purchases'
      },
      (payload: any) => {
        // Silent logging('💰 New heart purchase:', payload)
        if (payload.new) {
          onUpdate(payload.new as HeartPurchase)
        }
      }
    )
    .subscribe()
}

// Utility function to unsubscribe from all channels
export const unsubscribeFromChannel = (channel: RealtimeChannel) => {
  supabase.removeChannel(channel)
}
