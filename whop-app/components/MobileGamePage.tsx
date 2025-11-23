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
  User,
  Star
} from "lucide-react";
import LeaderboardScreen from "./LeaderboardModal";
import BubbleTypeGame from "./BubbleTypeGame";
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
  const [showProfile, setShowProfile] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [userLives, setUserLives] = useState(3); // Track user's lives count
  const [userSpendingStats, setUserSpendingStats] = useState<any>(null); // Track detailed spending statistics
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [topSpender, setTopSpender] = useState<TopSpender | null>(null);
  const [userPayments, setUserPayments] = useState<any[]>([]);
  const [userPurchases, setUserPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const profileRef = useRef<HTMLDivElement>(null);
  const loadDataTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const realtimeChannelsRef = useRef<any[]>([]);

  // Load data from database with optimized caching
  const loadData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      // Test database connection first
      const connectionTest = await testDatabaseConnection();
      
      // Create or update user in database (only if needed)
      if (user.username) {
        const userResult = await createOrUpdateUser({
          id: user.username, // Using username as ID for simplicity
          username: user.username,
          name: user.name || user.username
        });
      }

      // Load data in parallel for better performance
      const [leaderboardData, topSpenderData, userData, spendingStats] = await Promise.all([
        getLeaderboard(10),
        getTopSpender(),
        user.username ? getUser(user.username) : Promise.resolve(null),
        user.username ? getUserSpendingStats(user.username) : Promise.resolve(null)
      ]);

      // Update state with fetched data
      setLeaderboard(leaderboardData);
      setTopSpender(topSpenderData);
      
      if (userData) {
        setUserLives(userData.lives); // Using lives field
      }
      
      if (spendingStats) {
        setUserSpendingStats(spendingStats);
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
    if (!user.username) return;

    // Clear existing subscriptions
    realtimeChannelsRef.current.forEach(channel => {
      unsubscribeFromChannel(channel);
    });
    realtimeChannelsRef.current = [];

    // Subscribe to user data changes
    const userChannel = subscribeToUserChanges(user.username, (updatedUser) => {
      setUserLives(updatedUser.lives); // Using lives field
    });

    // Subscribe to spending stats changes
    const spendingStatsChannel = subscribeToSpendingStatsChanges(user.username, (updatedStats) => {
      setUserSpendingStats(updatedStats);
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
    const paymentsChannel = subscribeToUserPaymentChanges(user.username, (updatedPaymentStats) => {
      setUserPayments([updatedPaymentStats]); // Keep as array for consistency
    });

    // Subscribe to user purchases changes
    const purchasesChannel = subscribeToUserPurchasesChanges(user.username, (updatedPurchases) => {
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

  // Setup real-time subscriptions when component mounts and user changes
  useEffect(() => {
    if (user.username) {
      setupRealtimeSubscriptions();
    }

    // Cleanup on unmount or user change
    return () => {
      cleanupRealtimeSubscriptions();
    };
  }, [user.username]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    };

    if (showProfile) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfile]);

  // Convert leaderboard data for display
  const displayLeaderboard = leaderboard.map((entry, index) => ({
    rank: entry.rank || index + 1,
    name: entry.name || 'Unknown Player',
    score: entry.score || 0,
    avatar: (entry.name || 'U').charAt(0).toUpperCase()
  }));

  // Find user's rank - check both name and username
  const userRank = leaderboard.findIndex(entry => 
    entry.name === (user.name || user.username) || 
    entry.name === user.username
  ) + 1;

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
          if (user.username) {
            invalidateUserCache(user.username);
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

      {/* Header */}
      <div className="relative z-10 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-md lg:max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Game Logo and Title - LEFT SIDE */}
            <div className="flex items-center gap-3">
              <img 
                src="/icon/icon.png" 
                alt="BubbleType" 
                className="w-10 h-10"
              />
              <h1 className="text-lg font-bold text-white">BubbleType</h1>
            </div>
            
            {/* Profile Icon - RIGHT SIDE */}
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="w-10 h-10 bg-slate-800/50 backdrop-blur-sm rounded-full flex items-center justify-center border border-slate-600/50 hover:bg-slate-700/50 transition-all duration-200"
            >
              <User className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Profile Dropdown */}
      {showProfile && (
        <div 
          ref={profileRef}
          className="absolute top-16 right-4 lg:right-auto lg:left-auto lg:top-16 lg:right-4 z-30 bg-slate-800/95 backdrop-blur-xl rounded-xl border border-slate-700/50 shadow-2xl p-4 min-w-[200px]"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-emerald-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">{(user.name || "P").charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <div className="text-white font-bold text-sm">{user.name || "Player"}</div>
              <div className="text-slate-400 text-xs">@{user.username}</div>
            </div>
          </div>
          <div className="text-slate-300 text-xs mb-3">
            Welcome back to BubbleType!
          </div>
          
          {/* Spending Information */}
          <div className="space-y-2">
            {/* Total Amount Spent */}
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">$</span>
              </div>
              <span className="text-yellow-400 font-bold text-sm">
                Total Spent: ${userSpendingStats?.total_amount_spent?.toFixed(2) || '0.00'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Game Container - Mobile & Web */}
      <div className="relative z-10 flex flex-col lg:flex-row max-w-md lg:max-w-6xl mx-auto px-4 py-2 min-h-screen lg:gap-12 lg:items-start lg:py-8">

        {/* Left Column - Game Preview & Actions */}
        <div className="flex flex-col lg:w-1/2">
          {/* Game Preview - Modern Glassmorphism Design */}
          <div className="mb-3 lg:mb-6">
            <div className="relative bg-gradient-to-br from-slate-800/60 via-slate-900/40 to-slate-800/60 backdrop-blur-2xl rounded-3xl lg:rounded-[2rem] p-4 lg:p-8 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] overflow-hidden">
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

                {/* Animated Bubbles - Enhanced */}
                <div className="relative h-20 lg:h-40 bg-gradient-to-b from-slate-900/80 via-slate-800/60 to-slate-900/80 rounded-2xl overflow-hidden border border-white/5">
                  <div className="absolute top-3 lg:top-6 left-1/4 w-10 h-10 lg:w-16 lg:h-16 bg-gradient-to-br from-primary via-accent to-primary rounded-full flex items-center justify-center shadow-2xl shadow-primary/40 animate-bounce backdrop-blur-sm border border-white/20" style={{ animationDelay: '0s' }}>
                    <span className="text-white font-black text-xs lg:text-base">type</span>
                  </div>
                  <div className="absolute top-5 lg:top-10 right-1/4 w-10 h-10 lg:w-16 lg:h-16 bg-gradient-to-br from-accent via-primary to-accent rounded-full flex items-center justify-center shadow-2xl shadow-accent/40 animate-bounce backdrop-blur-sm border border-white/20" style={{ animationDelay: '0.5s' }}>
                    <span className="text-white font-black text-xs lg:text-base">game</span>
                  </div>
                  <div className="absolute top-8 lg:top-16 left-1/2 -translate-x-1/2 w-10 h-10 lg:w-16 lg:h-16 bg-gradient-to-br from-primary via-accent to-primary rounded-full flex items-center justify-center shadow-2xl shadow-primary/40 animate-bounce backdrop-blur-sm border border-white/20" style={{ animationDelay: '1s' }}>
                    <span className="text-white font-black text-xs lg:text-base">fast</span>
                  </div>
                </div>

                {/* Input Field - Redesigned */}
                <div className="bg-slate-900/70 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-3 lg:p-5 border border-white/10 shadow-inner">
                  <div className="text-center text-slate-400 text-sm lg:text-lg font-medium">
                    Type here...
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

          {/* Top Spender Section - Modern Glassmorphism Design */}
          <div className="mt-4 lg:mt-6 mb-4 lg:mb-0">
            <div className="relative bg-gradient-to-br from-slate-800/60 via-slate-900/40 to-slate-800/60 backdrop-blur-2xl rounded-3xl lg:rounded-[2rem] p-4 lg:p-6 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] overflow-hidden">
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
              
              <div className="relative text-center mb-3 lg:mb-4">
                <div className="text-white font-black text-base lg:text-lg">Top Spender</div>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="text-slate-400 text-sm">Loading...</div>
                </div>
              ) : topSpender ? (
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-primary via-accent to-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/50">
                      <span className="text-white text-lg lg:text-xl font-black drop-shadow-lg">$</span>
                    </div>
                    <div className="text-primary font-black text-base lg:text-xl drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]">{topSpender.name}</div>
                  </div>
                  <div className="text-accent text-base lg:text-xl font-black drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]">${topSpender.total_amount_spent?.toFixed(2)}</div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-4">
                  <div className="text-slate-400 text-sm">No purchases yet</div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column - Leaderboard */}
        <div className="lg:w-1/2">
          {/* Leaderboard Section - Modern Glassmorphism Design */}
          <div className="relative bg-gradient-to-br from-slate-800/60 via-slate-900/40 to-slate-800/60 backdrop-blur-2xl rounded-3xl lg:rounded-[2rem] p-4 lg:p-8 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] overflow-hidden">
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
                className="border-white/20 bg-white/5 text-white hover:bg-white/10 text-xs lg:text-sm px-2 lg:px-4 py-1 lg:py-2 h-7 lg:h-auto rounded-xl backdrop-blur-sm"
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
            <div className="relative mt-4 lg:mt-6 pt-3 lg:pt-4 border-t border-white/10">
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
                    {(leaderboard.find(entry => 
                      entry.name === (user.name || user.username) || 
                      entry.name === user.username
                    )?.score || 0).toLocaleString()}
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

    </div>
  );
}
