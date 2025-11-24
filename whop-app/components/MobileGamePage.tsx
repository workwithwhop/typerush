"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { 
  Zap, 
  Target, 
  Trophy, 
  Play, 
  Gamepad2, 
  Crown,
  Medal,
  Award,
  ArrowRight,
  Info,
  Star,
  Heart
} from "lucide-react";
import LeaderboardScreen from "./LeaderboardModal";
import BubbleTypeGame from "./BubbleTypeGame";
import GameOverPurchaseScreen from "./GameOverPurchaseScreen";
import { 
  createOrUpdateUser, 
  getUser, 
  getLeaderboard, 
  getTopSpender,
  getUserSpendingStats,
  invalidateUserCache,
  subscribeToUserChanges,
  subscribeToSpendingStatsChanges,
  subscribeToGameScoresChanges,
  subscribeToTopSpenderChanges,
  subscribeToUserPaymentChanges,
  subscribeToUserPurchasesChanges,
  unsubscribeFromChannel,
  testDatabaseConnection
} from "@/lib/database-optimized";
import { LeaderboardEntry, TopSpender } from "@/lib/supabase";

interface User {
  name?: string | null;
  username: string;
  id: string;
}

interface MobileGamePageProps {
  user: User;
}

export default function MobileGamePage({ user }: MobileGamePageProps) {
  
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [showHeartsPurchase, setShowHeartsPurchase] = useState(false);
  const [userLives, setUserLives] = useState(0); // Track user's extra lives count (starts at 0)
  const [userSpendingStats, setUserSpendingStats] = useState<any>(null); // Track detailed spending statistics
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [topSpender, setTopSpender] = useState<TopSpender | null>(null);
  const [userPayments, setUserPayments] = useState<any[]>([]);
  const [userPurchases, setUserPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const infoPanelRef = useRef<HTMLDivElement>(null);
  const loadDataTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const realtimeChannelsRef = useRef<any[]>([]);

  // Load data from database with optimized caching
  const loadData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      // Test database connection first
      const connectionTest = await testDatabaseConnection();
      
      // Create or update user in database (only if needed)
      if (user.id) {
        const userResult = await createOrUpdateUser({
          id: user.id, // Use Whop user ID
          username: user.username,
          name: user.name || user.username
        });
      }

      // Load data in parallel for better performance
      const [leaderboardData, topSpenderData, userData, spendingStats] = await Promise.all([
        getLeaderboard(10, user.id), // Pass user.id to ensure user is included
        getTopSpender(),
        user.id ? getUser(user.id) : Promise.resolve(null),
        user.id ? getUserSpendingStats(user.id) : Promise.resolve(null)
      ]);

      // Update state with fetched data
      setLeaderboard(leaderboardData);
      setTopSpender(topSpenderData);
      
      if (userData) {
        // Use lives from database, default to 0 if null/undefined
        const livesValue = userData.lives !== null && userData.lives !== undefined ? userData.lives : 0;
        setUserLives(livesValue);
        console.log("Loaded user lives from database:", livesValue);
      }
      
      if (spendingStats) {
        setUserSpendingStats(spendingStats);
        // Also update lives from spending stats if available
        if (spendingStats.current_lives !== undefined && spendingStats.current_lives !== null) {
          setUserLives(spendingStats.current_lives);
          console.log("Loaded lives from spending stats:", spendingStats.current_lives);
        }
      }
    } catch (error) {
      // Error loading data
    } finally {
      setLoading(false);
    }
  };

  // Debounced version of loadData to prevent excessive calls
  const debouncedLoadData = (delay = 500) => {
    if (loadDataTimeoutRef.current) {
      clearTimeout(loadDataTimeoutRef.current);
    }
    loadDataTimeoutRef.current = setTimeout(() => {
      loadData();
    }, delay);
  };

  // Setup real-time subscriptions
  const setupRealtimeSubscriptions = () => {
    if (!user.id) return;

    // Clear existing subscriptions
    realtimeChannelsRef.current.forEach(channel => {
      unsubscribeFromChannel(channel);
    });
    realtimeChannelsRef.current = [];

    // Subscribe to user data changes
    const userChannel = subscribeToUserChanges(user.id, (updatedUser) => {
      console.log("User data updated via realtime:", updatedUser);
      if (updatedUser.lives !== undefined && updatedUser.lives !== null) {
        setUserLives(updatedUser.lives);
        console.log("Extra lives updated to:", updatedUser.lives);
      } else {
        setUserLives(0);
        console.log("Extra lives set to 0 (null/undefined)");
      }
    });

    // Subscribe to spending stats changes
    const spendingStatsChannel = subscribeToSpendingStatsChanges(user.id, (updatedStats) => {
      setUserSpendingStats(updatedStats);
      // Also update lives from spending stats
      if (updatedStats?.current_lives !== undefined && updatedStats.current_lives !== null) {
        console.log("Extra lives updated from spending stats:", updatedStats.current_lives);
        setUserLives(updatedStats.current_lives);
      } else {
        setUserLives(0);
        console.log("Extra lives set to 0 from spending stats");
      }
    });

    // Subscribe to game scores changes (leaderboard updates)
    const scoresChannel = subscribeToGameScoresChanges((updatedLeaderboard) => {
      setLeaderboard(updatedLeaderboard);
    });

    // Subscribe to top spender changes
    const topSpenderChannel = subscribeToTopSpenderChanges((updatedTopSpender) => {
      setTopSpender(updatedTopSpender);
    });

    // Subscribe to user payment changes (simplified)
    const paymentsChannel = subscribeToUserPaymentChanges(user.id, (updatedPaymentStats) => {
      setUserPayments([updatedPaymentStats]); // Keep as array for consistency
    });

    // Subscribe to user purchases changes
    const purchasesChannel = subscribeToUserPurchasesChanges(user.id, (updatedPurchases) => {
      setUserPurchases(updatedPurchases);
    });

    // Store channels for cleanup
    realtimeChannelsRef.current = [
      userChannel, 
      spendingStatsChannel, 
      scoresChannel, 
      topSpenderChannel, 
      paymentsChannel, 
      purchasesChannel
    ];
  };

  // Cleanup real-time subscriptions
  const cleanupRealtimeSubscriptions = () => {
    realtimeChannelsRef.current.forEach(channel => {
      unsubscribeFromChannel(channel);
    });
    realtimeChannelsRef.current = [];
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Fix hydration mismatch - only render bubbles on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Real-time subscriptions handle updates automatically
  // No need for polling - subscriptions are more efficient and smooth

  // Setup real-time subscriptions when component mounts and user changes
  useEffect(() => {
    if (user.id) {
      setupRealtimeSubscriptions();
    }

    // Cleanup on unmount or user change
    return () => {
      cleanupRealtimeSubscriptions();
    };
  }, [user.id]);

  // Close info dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (infoPanelRef.current && !infoPanelRef.current.contains(event.target as Node)) {
        setShowInfoPanel(false);
      }
    };

    if (showInfoPanel) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showInfoPanel]);

  // Convert leaderboard data for display
  const displayLeaderboard = leaderboard.map((entry, index) => ({
    rank: entry.rank || index + 1,
    name: entry.name || 'Unknown Player',
    score: entry.score || 0,
    avatar: (entry.name || 'U').charAt(0).toUpperCase()
  }));

  // Find user's rank - check both name, username, and id
  const userEntry = leaderboard.find(entry => 
    entry.id === user.id ||
    entry.name === (user.name || user.username) || 
    entry.name === user.username
  );
  const userRank = userEntry ? userEntry.rank : 0;
  const userScore = userEntry ? userEntry.score : (userSpendingStats ? 0 : 0);

  // Show game if active
  if (showGame) {
    return (
      <BubbleTypeGame 
        user={{
          name: user.name || "Player",
          username: user.username,
          accessLevel: "premium",
          experienceName: "BubbleType",
          id: user.id
        }}
        onBackToMenu={() => {
          setShowGame(false);
          // Refresh data when returning to menu - force refresh to get updated hearts
          if (user.id) {
            invalidateUserCache(user.id);
          }
          loadData(true); // Force refresh
        }}
        // No heart system - removed onHeartsUpdate prop
      />
    );
  }

  // Show leaderboard screen if active
  if (showLeaderboard) {
    return (
      <LeaderboardScreen
        leaderboard={displayLeaderboard}
        userRank={userRank}
        onBack={() => setShowLeaderboard(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
      {/* Mobile Game Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-60 h-60 bg-gradient-to-br from-primary/15 to-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-br from-emerald-500/10 to-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header - Enhanced */}
      <div className="relative z-10 bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl border-b border-primary/20 shadow-lg shadow-primary/10">
        <div className="max-w-md lg:max-w-6xl mx-auto px-4 py-3 lg:py-4">
          <div className="flex items-center justify-between">
            {/* Game Logo and Title - LEFT SIDE */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-xl blur-sm opacity-50"></div>
                <img 
                  src="/icon/icon.png" 
                  alt="TypeRush" 
                  className="relative w-10 h-10 lg:w-12 lg:h-12 rounded-xl"
                />
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg lg:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary">
                  TypeRush
                </h1>
              </div>
            </div>
            
            {/* Profile Icon - RIGHT SIDE */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowInfoPanel((prev) => !prev)}
                className="w-10 h-10 lg:w-11 lg:h-11 bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-sm rounded-xl flex items-center justify-center border border-primary/20 hover:border-primary/40 hover:bg-gradient-to-br hover:from-primary/20 hover:to-accent/20 transition-all duration-200 shadow-lg shadow-primary/10"
                aria-label="Payment info"
              >
                <Info className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Support Info Dropdown */}
      {showInfoPanel && (
        <div 
          ref={infoPanelRef}
          className="absolute top-16 right-4 z-30 bg-slate-900/95 backdrop-blur-xl rounded-xl border border-primary/30 shadow-xl p-3 w-64"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <Info className="w-4 h-4 text-white" />
            </div>
            <div className="text-white font-semibold text-sm tracking-wide">
              Support the Developer
            </div>
          </div>
          <p className="text-slate-300 text-xs leading-relaxed">
            Payments made here stay with the TypeRush creator—you are directly helping the build, not funding Whop fees.
          </p>
        </div>
      )}

      {/* Game Container - Mobile & Web */}
      <div className="relative z-10 flex flex-col lg:flex-row max-w-md lg:max-w-6xl mx-auto px-4 py-2 min-h-screen lg:gap-12 lg:items-start lg:py-8">

        {/* Left Column - Game Preview & Actions */}
        <div className="flex flex-col lg:w-1/2">
          {/* Game Preview - Modern Glassmorphism Design */}
          <div className="mb-3 lg:mb-6">
          <div className="relative bg-gradient-to-br from-slate-800/60 via-slate-900/40 to-slate-800/60 backdrop-blur-2xl rounded-3xl lg:rounded-[2rem] p-4 lg:p-8 border border-primary/25 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] overflow-hidden">
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
              
              <div className="relative space-y-3 lg:space-y-6">
                {/* Score Bar - Redesigned */}
                <div className="flex justify-between items-center">
                  <div className="bg-gradient-to-r from-primary via-accent to-primary text-white px-4 lg:px-6 py-2 lg:py-3 rounded-2xl font-black text-sm lg:text-lg shadow-lg shadow-primary/30 animate-pulse">
                    1,250
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="w-4 h-4 lg:w-5 lg:h-5 bg-gradient-to-br from-red-400 to-red-600 rounded-full shadow-lg shadow-red-500/50" />
                    ))}
                  </div>
                </div>

                {/* Bubble Wave Animation Preview - Full Height */}
                <div className="relative h-32 lg:h-64 bg-gradient-to-b from-slate-900/80 via-slate-800/60 to-slate-900/80 rounded-2xl overflow-hidden border border-primary/30 bubble-wave-container">
                  {/* Bubble Wave Animation - Only render on client to fix hydration */}
                  {isMounted && [...Array(15)].map((_, i) => {
                    const waveAmplitude = 40;
                    const waveFrequency = 0.5;
                    const baseY = 50;
                    // Round to prevent hydration mismatch
                    const yOffset = Math.round(Math.sin(i * waveFrequency) * waveAmplitude * 100) / 100;
                    const size = 45 + (i % 3) * 12; // Varying sizes
                    const delay = Math.round(i * 0.12 * 100) / 100; // Round delay
                    
                    return (
                      <div
                        key={i}
                        className="bubble-wave"
                        style={{
                          width: `${size}px`,
                          height: `${size}px`,
                          top: `${Math.round((baseY + yOffset) * 100) / 100}%`,
                          '--wave-offset': `${Math.round(yOffset * 100) / 100}px`,
                          animationDelay: `${delay}s`,
                        } as React.CSSProperties}
                      />
                    );
                  })}
                  
                  {/* Center Text Overlay */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-center pointer-events-none">
                    <div className="text-white font-black text-sm lg:text-xl bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent drop-shadow-lg">
                      Type & Blast!
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Start Game Button */}
          <div className="text-center mb-3 lg:mb-6">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 text-white font-black px-6 lg:px-8 py-2 lg:py-4 text-base lg:text-lg rounded-2xl shadow-2xl hover:shadow-primary/25 transition-all duration-300 transform hover:scale-105 w-full"
              onClick={() => setShowGame(true)}
            >
              <Play className="w-5 h-5 lg:w-6 lg:h-6 mr-2" />
              START GAME
              <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6 ml-2" />
            </Button>
          </div>

          {/* Extra Lives Balance Section - Compact Purple Design */}
          <div className="mt-4 lg:mt-6 mb-4 lg:mb-0">
            <div className="relative bg-gradient-to-br from-slate-800/60 via-slate-900/40 to-slate-800/60 backdrop-blur-2xl rounded-2xl lg:rounded-xl p-4 lg:p-5 border border-primary/30 shadow-[0_4px_16px_0_rgba(168,85,247,0.2)] overflow-hidden">
              {/* Purple Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 pointer-events-none" />
              
              {/* Compact Header */}
              <div className="relative flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-primary fill-primary" />
                  <div className="text-white font-bold text-sm">Extra Lives</div>
                </div>
                <div className="text-primary font-black text-xl">
                  {loading ? '...' : userLives}
                </div>
              </div>
              
              {/* Compact Recharge Button - Theme Matched */}
              <Button
                onClick={() => {
                  setShowHeartsPurchase(true);
                }}
                className="w-full bg-gradient-to-r from-primary via-accent to-primary hover:from-primary/90 hover:via-accent/90 hover:to-primary/90 text-white font-bold py-2.5 text-sm rounded-xl shadow-lg shadow-primary/40 transition-all duration-300 transform hover:scale-[1.02] relative overflow-hidden group border border-primary/30"
              >
                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
                
                <div className="relative flex items-center justify-center gap-2">
                  <Heart className="w-4 h-4 fill-white drop-shadow-lg" />
                  <span className="font-black tracking-wide">Recharge</span>
                </div>
              </Button>
            </div>
          </div>

        </div>

        {/* Right Column - Leaderboard */}
        <div className="lg:w-1/2">
          {/* Leaderboard Section - Modern Glassmorphism Design */}
          <div className="relative bg-gradient-to-br from-slate-800/60 via-slate-900/40 to-slate-800/60 backdrop-blur-2xl rounded-3xl lg:rounded-[2rem] p-4 lg:p-8 border border-primary/25 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] overflow-hidden">
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
            <div className="relative flex items-center justify-between mb-3 lg:mb-6">
              <div className="flex items-center gap-2 lg:gap-3">
                <Trophy className="w-4 h-4 lg:w-6 lg:h-6 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                <h3 className="text-white font-black text-base lg:text-xl">Leaderboard</h3>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-primary/40 bg-primary/5 text-white hover:bg-primary/10 text-xs lg:text-sm px-2 lg:px-4 py-1 lg:py-2 h-7 lg:h-auto rounded-xl backdrop-blur-sm"
                onClick={() => setShowLeaderboard(true)}
              >
                View All
              </Button>
            </div>

            {/* Top 3 Players - Enhanced Design */}
            <div className="relative space-y-2 lg:space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="text-slate-400 text-sm">Loading leaderboard...</div>
                </div>
              ) : leaderboard.length > 0 ? (
                leaderboard.slice(0, 3).map((entry, index) => {
                  const isFirst = index === 0;
                  const isSecond = index === 1;
                  const isThird = index === 2;
                  
                  return (
                    <div key={entry.rank} className={`relative flex items-center justify-between rounded-2xl lg:rounded-3xl p-3 lg:p-4 backdrop-blur-sm border overflow-hidden ${
                      isFirst ? 'bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/20 border-amber-400/40 shadow-lg shadow-amber-500/20' :
                      isSecond ? 'bg-gradient-to-r from-slate-600/20 via-slate-500/15 to-slate-600/20 border-slate-400/40 shadow-lg shadow-slate-500/20' :
                      'bg-gradient-to-r from-orange-600/20 via-orange-500/15 to-orange-600/20 border-orange-400/40 shadow-lg shadow-orange-500/20'
                    }`}>
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                      
                      <div className="relative flex items-center gap-2 lg:gap-3">
                        <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center shadow-lg ${
                          isFirst ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 shadow-amber-500/50' :
                          isSecond ? 'bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600 shadow-slate-500/50' :
                          'bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 shadow-orange-500/50'
                        }`}>
                          {isFirst ? <Crown className="w-4 h-4 lg:w-5 lg:h-5 text-white drop-shadow-lg" /> :
                           isSecond ? <Medal className="w-4 h-4 lg:w-5 lg:h-5 text-white drop-shadow-lg" /> :
                           <Award className="w-4 h-4 lg:w-5 lg:h-5 text-white drop-shadow-lg" />}
                        </div>
                        <div>
                          <div className="text-white font-black text-sm lg:text-base">{entry.name}</div>
                          <div className={`text-xs lg:text-sm font-bold ${
                            isFirst ? 'text-amber-300' :
                            isSecond ? 'text-slate-300' :
                            'text-orange-300'
                          }`}>
                            {entry.rank === 1 ? '1st' : entry.rank === 2 ? '2nd' : '3rd'}
                          </div>
                        </div>
                      </div>
                      <div className={`relative font-black text-base lg:text-lg ${
                        isFirst ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' :
                        isSecond ? 'text-slate-300' :
                        'text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]'
                      }`}>
                        {(entry.score || 0).toLocaleString()}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center justify-center py-4">
                  <div className="text-slate-400 text-sm">No scores yet</div>
                </div>
              )}
            </div>

            {/* User Position - Enhanced Design */}
            <div className="relative mt-4 lg:mt-6 pt-3 lg:pt-4 border-t border-primary/20">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="text-slate-400 text-sm">Loading your position...</div>
                </div>
              ) : userRank > 0 ? (
                <div className="relative flex items-center justify-between bg-gradient-to-r from-primary/25 via-accent/20 to-primary/25 rounded-2xl lg:rounded-3xl p-3 lg:p-4 border border-primary/40 backdrop-blur-sm shadow-lg shadow-primary/20 overflow-hidden">
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                  
                  <div className="relative flex items-center gap-2 lg:gap-3">
                    <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-primary via-accent to-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/50">
                      <span className="text-white font-black text-sm lg:text-base">{(user.name || "P").charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <div className="text-white font-black text-sm lg:text-base">{user.name || "Player"}</div>
                      <div className="text-primary font-bold text-xs lg:text-sm drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]">#{userRank}</div>
                    </div>
                  </div>
                  <div className="relative text-primary font-black text-base lg:text-lg drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]">
                    {userScore.toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="relative flex items-center justify-between bg-gradient-to-r from-primary/25 via-accent/20 to-primary/25 rounded-2xl lg:rounded-3xl p-3 lg:p-4 border border-primary/40 backdrop-blur-sm shadow-lg shadow-primary/20 overflow-hidden">
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                  
                  <div className="relative flex items-center gap-2 lg:gap-3">
                    <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-primary via-accent to-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/50">
                      <span className="text-white font-black text-sm lg:text-base">{(user.name || "P").charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <div className="text-white font-black text-sm lg:text-base">{user.name || "Player"}</div>
                      <div className="text-primary font-bold text-xs lg:text-sm drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]">Play to rank!</div>
                    </div>
                  </div>
                  <div className="relative text-primary font-black text-base lg:text-lg drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]">0</div>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Hearts Purchase Modal */}
      {showHeartsPurchase && (
        <GameOverPurchaseScreen
          onClose={() => {
            setShowHeartsPurchase(false);
            // Real-time subscriptions will handle updates automatically
            // No need for forced refresh
          }}
          currentScore={0}
          bestScore={0}
          onPurchaseSuccess={() => {
            // Real-time subscriptions will automatically update the UI
            // Just log for debugging - no forced refresh needed
            console.log("Purchase success - real-time subscriptions will update UI");
          }}
        />
      )}

      {/* Bubble Wave Animation Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .bubble-wave-container {
          position: relative;
          width: 100%;
        }
        .bubble-wave {
          position: absolute;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(168, 85, 247, 0.5) 0%, rgba(236, 72, 153, 0.5) 100%);
          border: 2px solid rgba(255, 255, 255, 0.3);
          box-shadow: 
            0 0 20px rgba(168, 85, 247, 0.6),
            inset 0 0 20px rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(5px);
          animation: bubbleWave 5s ease-in-out infinite;
          transform: translateY(-50%);
        }
        @keyframes bubbleWave {
          0% {
            left: -80px;
            transform: translateY(calc(-50% + var(--wave-offset, 0px)));
            opacity: 0;
          }
          5% {
            opacity: 1;
          }
          95% {
            opacity: 1;
          }
          100% {
            left: 100%;
            transform: translateY(calc(-50% + var(--wave-offset, 0px)));
            opacity: 0;
          }
        }
      `}} />
    </div>
  );
}
