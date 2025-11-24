import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create a fallback client for build time when env vars might not be available
let supabase: any

if (!supabaseUrl || !supabaseAnonKey) {
  // Create a fallback client with dummy values for build time
  supabase = createClient('https://dummy.supabase.co', 'dummy-key')
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
}

export { supabase }

// Database types
export interface User {
  id: string
  username: string
  name: string
  lives: number
  best_score: number
  best_combo: number
  total_spent: number
  created_at: string
}

export interface GameScore {
  id: string
  user_id: string
  score: number
  combo: number
  created_at: string
}

export interface HeartPurchase {
  id: string
  user_id: string
  hearts_purchased: number
  amount_spent: number
  created_at: string
}

export interface LeaderboardEntry {
  rank: number
  name: string
  score: number
  combo: number
  date: string
  id?: string // Optional user ID for matching
}

export interface TopSpender {
  name: string
  total_amount_spent: number
}
