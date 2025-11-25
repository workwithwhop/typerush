'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Zap, Star, Sparkles, Target, Award, Menu, ArrowLeft, Heart, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { saveGameScore, getUserBestScore, getUserSpendingStats, getUser, invalidateUserCache, subscribeToUserChanges, subscribeToSpendingStatsChanges, subscribeToUserPaymentChanges, unsubscribeFromChannel, recordPayment, updateUserLives } from '@/lib/database-optimized';
import { createCheckoutConfig } from '@/lib/actions/charge-user';
import { useIframeSdk } from '@whop/react';
import { useToast } from '@/hooks/use-toast';
import { Toast, ToastContainer } from '@/components/ui/toast';
import GameOverPurchaseScreen from './GameOverPurchaseScreen';

const WORDS = [
  // Basic words
  'cat', 'dog', 'run', 'jump', 'code', 'react', 'type', 'fast', 'game', 'play',
  'speed', 'brain', 'quick', 'score', 'win', 'lost', 'fire', 'water', 'earth',
  'wind', 'solar', 'moon', 'star', 'cloud', 'rain', 'snow', 'heat', 'cold',
  'light', 'dark', 'happy', 'music', 'dance', 'sing', 'dream', 'hope', 'love',
  'peace', 'magic', 'power', 'energy', 'force', 'rush', 'blast', 'zoom',

  // Animals
  'lion', 'tiger', 'bear', 'wolf', 'fox', 'deer', 'rabbit', 'mouse', 'bird', 'fish',
  'shark', 'whale', 'dolphin', 'eagle', 'owl', 'snake', 'frog', 'spider', 'bee', 'ant',
  'elephant', 'giraffe', 'zebra', 'monkey', 'panda', 'koala', 'kangaroo', 'penguin', 'flamingo', 'peacock',

  // Colors
  'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white', 'gray',
  'brown', 'gold', 'silver', 'bronze', 'crimson', 'azure', 'emerald', 'violet', 'scarlet', 'indigo',

  // Nature
  'tree', 'flower', 'grass', 'leaf', 'branch', 'root', 'seed', 'fruit', 'berry', 'nut',
  'mountain', 'valley', 'river', 'ocean', 'lake', 'forest', 'desert', 'island', 'beach', 'cave',
  'volcano', 'canyon', 'waterfall', 'meadow', 'garden', 'park', 'jungle', 'tundra', 'prairie', 'swamp',

  // Food
  'apple', 'banana', 'orange', 'grape', 'strawberry', 'cherry', 'lemon', 'lime', 'peach', 'pear',
  'bread', 'cheese', 'milk', 'butter', 'sugar', 'salt', 'pepper', 'honey', 'jam', 'cake',
  'pizza', 'burger', 'pasta', 'rice', 'soup', 'salad', 'sandwich', 'cookie', 'candy', 'chocolate',
  'coffee', 'tea', 'juice', 'water', 'soda', 'beer', 'wine', 'smoothie', 'yogurt', 'ice',

  // Technology
  'computer', 'phone', 'tablet', 'laptop', 'keyboard', 'mouse', 'screen', 'monitor', 'camera', 'speaker',
  'internet', 'website', 'email', 'password', 'username', 'download', 'upload', 'stream', 'video', 'audio',
  'software', 'hardware', 'program', 'app', 'browser', 'search', 'click', 'scroll', 'swipe', 'touch',

  // Sports
  'football', 'basketball', 'soccer', 'tennis', 'golf', 'baseball', 'hockey', 'swimming', 'running', 'cycling',
  'boxing', 'wrestling', 'karate', 'yoga', 'pilates', 'gym', 'fitness', 'training', 'exercise', 'workout',
  'marathon', 'sprint', 'jump', 'throw', 'catch', 'kick', 'punch', 'dive', 'climb', 'skate',

  // Transportation
  'car', 'truck', 'bus', 'train', 'plane', 'boat', 'ship', 'bike', 'motorcycle', 'scooter',
  'taxi', 'uber', 'subway', 'metro', 'helicopter', 'rocket', 'spaceship', 'sailboat', 'yacht', 'cruise',
  'drive', 'fly', 'sail', 'ride', 'walk', 'run', 'jog', 'hike', 'travel', 'journey',

  // Emotions
  'happy', 'sad', 'angry', 'excited', 'nervous', 'calm', 'peaceful', 'anxious', 'confident', 'shy',
  'brave', 'scared', 'surprised', 'confused', 'proud', 'jealous', 'grateful', 'hopeful', 'worried', 'relaxed',
  'cheerful', 'moody', 'energetic', 'tired', 'awake', 'sleepy', 'alert', 'focused', 'distracted', 'curious',

  // Weather
  'sunny', 'cloudy', 'rainy', 'snowy', 'windy', 'stormy', 'foggy', 'hot', 'warm', 'cool',
  'freezing', 'humid', 'dry', 'wet', 'damp', 'breezy', 'calm', 'tornado', 'hurricane', 'blizzard',
  'thunder', 'lightning', 'rainbow', 'sunrise', 'sunset', 'dawn', 'dusk', 'twilight', 'midnight', 'noon',

  // Body parts
  'head', 'eye', 'nose', 'mouth', 'ear', 'hand', 'finger', 'arm', 'leg', 'foot',
  'toe', 'knee', 'elbow', 'shoulder', 'chest', 'back', 'stomach', 'heart', 'brain', 'skin',
  'hair', 'beard', 'mustache', 'lip', 'tooth', 'tongue', 'throat', 'neck', 'wrist', 'ankle',

  // Clothing
  'shirt', 'pants', 'dress', 'skirt', 'jacket', 'coat', 'sweater', 'hoodie', 'tank', 'shorts',
  'socks', 'shoes', 'boots', 'sandals', 'hat', 'cap', 'gloves', 'scarf', 'belt', 'tie',
  'suit', 'uniform', 'costume', 'pajamas', 'underwear', 'bra', 'panties', 'swimsuit', 'bikini', 'robe',

  // School/Education
  'book', 'pen', 'pencil', 'paper', 'notebook', 'desk', 'chair', 'teacher', 'student', 'class',
  'lesson', 'homework', 'test', 'exam', 'grade', 'school', 'college', 'university', 'library', 'study',
  'learn', 'teach', 'read', 'write', 'draw', 'paint', 'calculate', 'solve', 'question', 'answer',

  // Time
  'second', 'minute', 'hour', 'day', 'week', 'month', 'year', 'decade', 'century', 'millennium',
  'morning', 'afternoon', 'evening', 'night', 'today', 'yesterday', 'tomorrow', 'now', 'then', 'soon',
  'early', 'late', 'on', 'time', 'schedule', 'calendar', 'clock', 'watch', 'timer', 'alarm',

  // Numbers
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty',
  'hundred', 'thousand', 'million', 'billion', 'trillion', 'first', 'second', 'third', 'last', 'next',

  // Family
  'mother', 'father', 'mom', 'dad', 'parent', 'son', 'daughter', 'child', 'baby', 'brother',
  'sister', 'sibling', 'grandmother', 'grandfather', 'grandma', 'grandpa', 'uncle', 'aunt', 'cousin', 'nephew',
  'niece', 'husband', 'wife', 'spouse', 'partner', 'boyfriend', 'girlfriend', 'friend', 'neighbor', 'stranger',

  // Home
  'house', 'home', 'apartment', 'room', 'bedroom', 'kitchen', 'bathroom', 'living', 'dining', 'garage',
  'garden', 'yard', 'fence', 'gate', 'door', 'window', 'wall', 'floor', 'ceiling', 'roof',
  'stairs', 'elevator', 'basement', 'attic', 'balcony', 'porch', 'patio', 'deck', 'pool', 'hot',

  // Music
  'song', 'music', 'melody', 'rhythm', 'beat', 'drum', 'guitar', 'piano', 'violin', 'flute',
  'trumpet', 'saxophone', 'microphone', 'speaker', 'headphone', 'radio', 'cd', 'record', 'concert', 'band',
  'singer', 'musician', 'composer', 'lyrics', 'verse', 'chorus', 'bridge', 'intro', 'outro', 'solo',

  // Art
  'art', 'painting', 'drawing', 'sketch', 'sculpture', 'statue', 'portrait', 'landscape', 'abstract', 'realistic',
  'canvas', 'brush', 'paint', 'color', 'palette', 'easel', 'gallery', 'museum', 'exhibition', 'artist',
  'creative', 'imagination', 'inspiration', 'beauty', 'style', 'technique', 'masterpiece', 'work', 'piece', 'design',

  // Science
  'science', 'experiment', 'discovery', 'invention', 'research', 'study', 'theory', 'hypothesis', 'evidence', 'proof',
  'chemistry', 'physics', 'biology', 'mathematics', 'astronomy', 'geology', 'medicine', 'technology', 'innovation', 'progress',
  'atom', 'molecule', 'cell', 'gene', 'dna', 'evolution', 'gravity', 'energy', 'matter', 'universe',

  // Space
  'space', 'planet', 'star', 'sun', 'moon', 'earth', 'mars', 'jupiter', 'saturn', 'galaxy',
  'universe', 'cosmos', 'astronaut', 'rocket', 'spaceship', 'satellite', 'orbit', 'gravity', 'solar', 'lunar',
  'eclipse', 'meteor', 'comet', 'asteroid', 'nebula', 'black', 'hole', 'constellation', 'telescope', 'observatory',

  // Fantasy/Magic
  'magic', 'wizard', 'witch', 'fairy', 'dragon', 'unicorn', 'phoenix', 'elf', 'dwarf', 'giant',
  'castle', 'tower', 'dungeon', 'cave', 'forest', 'enchanted', 'spell', 'potion', 'wand', 'crystal',
  'treasure', 'gold', 'silver', 'diamond', 'ruby', 'emerald', 'sapphire', 'pearl', 'jewel', 'crown',

  // Adventure
  'adventure', 'journey', 'quest', 'mission', 'expedition', 'exploration', 'discovery', 'treasure', 'map', 'compass',
  'mountain', 'valley', 'river', 'ocean', 'island', 'desert', 'jungle', 'cave', 'bridge', 'path',
  'hero', 'villain', 'warrior', 'knight', 'princess', 'prince', 'king', 'queen', 'guardian', 'protector'
];

interface Bubble {
  id: number;
  word: string;
  x: number;
  y: number;
  speed: number;
  scale: number;
  rotation: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

interface LeaderboardEntry {
  name: string;
  score: number;
  combo: number;
  date: string;
}

interface User {
  name: string;
  username: string;
  accessLevel: string;
  experienceName: string;
  id: string;
}

interface BubbleTypeGameProps {
  user?: User;
  onBackToMenu?: () => void;
}

const BubbleTypeGame = ({ user, onBackToMenu }: BubbleTypeGameProps) => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(0); // Start with 0 - no default lives
  const livesRef = useRef(0); // Track lives in ref for game loop
  const iframeSdk = useIframeSdk();
  const { toasts, removeToast, showError, showSuccess } = useToast();

  const [inputValue, setInputValue] = useState('');
  type GameState = 'playing' | 'gameover' | 'menu';
  const [gameState, setGameState] = useState<GameState>('playing');
  const [highScore, setHighScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerName, setPlayerName] = useState(user?.name || 'Player');
  const [showAdModal, setShowAdModal] = useState(false);
  const [difficulty, setDifficulty] = useState(1);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [isNewGame, setIsNewGame] = useState(true);
  const [usedWords, setUsedWords] = useState<Set<string>>(new Set());
  const [bubbleType, setBubbleType] = useState<'bubble' | 'circle' | 'square' | 'hexagon'>('bubble'); // Object customization
  const [showSettings, setShowSettings] = useState(false);
  // No heart system - removed pendingHeartUpdate state
  const inputRef = useRef<HTMLInputElement>(null);
  const gameLoopRef = useRef<number | null>(null); // Changed to number for requestAnimationFrame
  const bubbleIdRef = useRef(0);
  const particleIdRef = useRef(0);
  const processedBubblesRef = useRef<Set<number>>(new Set());
  const realtimeChannelsRef = useRef<any[]>([]);
  
  // Mobile detection hook for performance optimizations
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Debug user object on component mount
  useEffect(() => {
    // User data loaded
  }, [user]);

  // Function to update hearts in database in real-time - INSTANT updates
  // No heart system - removed updateHeartsInDatabase function

  // Load user data from database with optimized caching
  const loadUserData = React.useCallback(async (forceLoadHearts = false) => {
    if (!user?.id) {
      // Fallback to localStorage for non-authenticated users
      const savedHighScore = localStorage.getItem('bubbleTypeHighScore');
      if (savedHighScore) setHighScore(parseInt(savedHighScore));
      return;
    }

    try {
      // Load best score from database (with caching)
      const dbBestScore = await getUserBestScore(user.id);
      if (dbBestScore > 0) {
        setHighScore(dbBestScore);
      } else {
        // Fallback to localStorage if no database score
        const savedHighScore = localStorage.getItem('bubbleTypeHighScore');
        if (savedHighScore) setHighScore(parseInt(savedHighScore));
      }

      // Always load lives from database for consistency
      const spendingStats = await getUserSpendingStats(user.id);

      if (spendingStats?.current_lives !== undefined) {
        // For gameplay, use current_lives
        livesRef.current = spendingStats.current_lives;
        setLives(spendingStats.current_lives);

        // If user just purchased extra lives and game is over, continue game from where it ended
        if (gameState === 'gameover' && spendingStats.current_lives > 0) {
          setShowAdModal(false);
          setIsNewGame(false);
          setGameState('playing');
          livesRef.current = spendingStats.current_lives;
          setLives(spendingStats.current_lives);
          
          // Resume the game loop if not already running
          if (!gameLoopRef.current) {
            // Game loop will be started by useEffect
          }
          
          inputRef.current?.focus();
          // Continue spawning bubbles
          if (bubbles.length === 0) {
            spawnBubble();
          }
        }
      } else {
        // No spending stats found - try to get from user data directly
        try {
          const userData = await getUser(user.id);
          if (userData?.lives !== undefined && userData.lives !== null) {
            livesRef.current = userData.lives;
            setLives(userData.lives);
            console.log(`[loadUserData] Loaded ${userData.lives} lives from user data`);
          } else {
            // Really no lives found - preserve current value, don't reset to 0
            // This prevents overwriting lives that were just purchased
            console.log(`[loadUserData] No lives found, preserving current value: ${livesRef.current}`);
          }
        } catch (error) {
          console.error(`[loadUserData] Error loading user data:`, error);
          // On error, preserve current value
          console.log(`[loadUserData] Error loading, keeping current lives: ${livesRef.current}`);
        }
      }
    } catch (error) {
      // Silent error handling
      // Fallback to localStorage
      const savedHighScore = localStorage.getItem('bubbleTypeHighScore');
      if (savedHighScore) setHighScore(parseInt(savedHighScore));
    }

    // Load leaderboard from localStorage (for offline functionality) - only once
    if (leaderboard.length === 0) {
      const savedLeaderboard = localStorage.getItem('bubbleTypeLeaderboard');
      if (savedLeaderboard) setLeaderboard(JSON.parse(savedLeaderboard));
    }
  }, [user?.id, leaderboard.length, gameState]);

  useEffect(() => {
    loadUserData();
  }, [user, loadUserData]);

  // Poll for hearts updates when on game over screen (user might have purchased hearts)
  useEffect(() => {
    if (gameState === 'gameover' && showAdModal && user?.id) {
      const pollInterval = setInterval(() => {
        loadUserData(true);
      }, 2000); // Check every 2 seconds

      return () => clearInterval(pollInterval);
    }
  }, [gameState, showAdModal, user?.id, loadUserData]);

  // No heart system - removed heart update handling

  // Setup real-time subscriptions for game component
  const setupGameRealtimeSubscriptions = React.useCallback(() => {
    if (!user?.id) return;

    // Clear existing subscriptions
    realtimeChannelsRef.current.forEach(channel => {
      unsubscribeFromChannel(channel);
    });
    realtimeChannelsRef.current = [];

    // Subscribe to user data changes (for lives)
    const userChannel = subscribeToUserChanges(user.id, (updatedUser) => {
      // Update lives if they changed externally
      if (updatedUser.lives !== livesRef.current) {
        livesRef.current = updatedUser.lives;
        setLives(updatedUser.lives);
      }
    });

    // Subscribe to spending stats changes
    const spendingStatsChannel = subscribeToSpendingStatsChanges(user.id, (updatedStats: any) => {
      // Update lives based on current_lives
      if (updatedStats?.current_lives !== undefined) {
        if (updatedStats.current_lives !== livesRef.current) {
          livesRef.current = updatedStats.current_lives;
          setLives(updatedStats.current_lives);
        }
      }
    });

    // Subscribe to user payment changes for real-time payment tracking
    const paymentsChannel = subscribeToUserPaymentChanges(user.id, (updatedPaymentStats: any) => {
      // Could be used to show payment stats or confirm payments
    });

    // Store channels for cleanup
    realtimeChannelsRef.current = [userChannel, spendingStatsChannel, paymentsChannel];
  }, [user?.id, lives]);

  // Cleanup real-time subscriptions
  const cleanupGameRealtimeSubscriptions = React.useCallback(() => {
    realtimeChannelsRef.current.forEach(channel => {
      unsubscribeFromChannel(channel);
    });
    realtimeChannelsRef.current = [];
  }, []);

  // Setup real-time subscriptions when game starts
  useEffect(() => {
    if (gameState === 'playing' && user?.id) {
      setupGameRealtimeSubscriptions();
    }

    // Cleanup when game ends or component unmounts
    return () => {
      cleanupGameRealtimeSubscriptions();
    };
  }, [gameState, user?.id, setupGameRealtimeSubscriptions, cleanupGameRealtimeSubscriptions]);


  const startGame = async () => {
    // Load current extra lives from database - DON'T reset to 0
    // Extra lives should persist across games
    // NEVER write 0 to database here - only read!
    if (user?.id) {
      try {
        const spendingStats = await getUserSpendingStats(user.id);
        if (spendingStats?.current_lives !== undefined && spendingStats.current_lives !== null) {
          livesRef.current = spendingStats.current_lives;
          setLives(spendingStats.current_lives);
          console.log(`[startGame] ✅ Loaded ${spendingStats.current_lives} extra lives from database`);
        } else {
          // No lives found - check database directly
          const userData = await getUser(user.id);
          if (userData?.lives !== undefined && userData.lives !== null) {
            livesRef.current = userData.lives;
            setLives(userData.lives);
            console.log(`[startGame] ✅ Loaded ${userData.lives} extra lives from user data`);
          } else {
            // Really no lives - use 0 for display only, DON'T write to database
            livesRef.current = 0;
            setLives(0);
            console.log(`[startGame] No lives in database, using 0 (not writing to DB)`);
          }
        }
      } catch (error) {
        console.error(`[startGame] Error loading lives:`, error);
        // On error, keep current value, don't reset
        console.log(`[startGame] Error loading, keeping current lives: ${livesRef.current}`);
      }
    } else {
      // No user - use 0 for display only
      livesRef.current = 0;
      setLives(0);
    }

    // Clear processed bubble tracking on game start
    processedBubblesRef.current.clear();

    setBubbles([]);
    setParticles([]);
    setScore(0);
    setInputValue('');
    setGameState('playing');
    setDifficulty(1);
    setCombo(0);
    setUsedWords(new Set()); // Reset used words for new game
    setMaxCombo(0);
    setIsNewGame(true);
    inputRef.current?.focus();
    spawnBubble();
  };

  // Auto-start the game when component mounts (only for new games)
  useEffect(() => {
    if (gameState === 'playing' && isNewGame) {
      startGame();
    }
  }, [gameState, isNewGame]);

  const spawnBubble = () => {
    // Get available words (not used yet)
    const availableWords = WORDS.filter(word => !usedWords.has(word));

    // If all words have been used, reset the used words set
    if (availableWords.length === 0) {
      setUsedWords(new Set());
      // Use all words again
      const word = WORDS[Math.floor(Math.random() * WORDS.length)];
      setUsedWords(prev => new Set([...prev, word]));

      const newBubble = {
        id: bubbleIdRef.current++,
        word,
        x: Math.random() * 80 + 10, // Better mobile positioning
        y: -5,
        speed: 0.15 + (difficulty * 0.04), // Reduced speed: slower base speed (0.15 vs 0.25) and slower increase per difficulty (0.04 vs 0.08)
        scale: 1,
        rotation: 0, // No rotation - bubbles appear at 0 degrees
      };
      setBubbles(prev => [...prev, newBubble]);
    } else {
      // Select a random word from available words
      const word = availableWords[Math.floor(Math.random() * availableWords.length)];

      // Mark this word as used
      setUsedWords(prev => new Set([...prev, word]));

      const newBubble = {
        id: bubbleIdRef.current++,
        word,
        x: Math.random() * 80 + 10, // Better mobile positioning
        y: -5,
        speed: 0.15 + (difficulty * 0.04), // Reduced speed: slower base speed (0.15 vs 0.25) and slower increase per difficulty (0.04 vs 0.08)
        scale: 1,
        rotation: 0, // No rotation - bubbles appear at 0 degrees
      };
      setBubbles(prev => [...prev, newBubble]);
    }
  };

  const createParticles = (x: number, y: number) => {
    // Reduced particle count for mobile - 4 on mobile, 8 on desktop for better performance
    const particleCount = isMobile ? 4 : 8;
    // Use theme colors (primary/accent purple) instead of green
    const themeColors = ['#a855f7', '#c084fc', '#d8b4fe', '#e9d5ff']; // Purple gradient colors
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: particleIdRef.current++,
      x,
      y,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5,
      life: 1,
      color: themeColors[Math.floor(Math.random() * themeColors.length)] // Theme colors
    }));
    setParticles(prev => [...prev, ...newParticles]);
  };

  useEffect(() => {
    if (gameState !== 'playing') {
      // Clear processed bubble tracking on game stop
      processedBubblesRef.current.clear();
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }

    // Use requestAnimationFrame for smoother, more efficient animations
    // Better performance on mobile than setInterval
    let lastTime = performance.now();
    const targetFPS = isMobile ? 30 : 60; // Lower FPS on mobile for better battery life
    const frameInterval = 1000 / targetFPS;

    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;

      if (deltaTime >= frameInterval) {
        lastTime = currentTime - (deltaTime % frameInterval);

        setBubbles(prev => {
          const updated = prev.map(bubble => ({
            ...bubble,
            y: bubble.y + bubble.speed,
            rotation: 0 // Keep rotation at 0 degrees - no rotation
          }));

          // Find bubbles that reached the bottom
          const bubblesAtBottom = updated.filter(b => b.y > 88);
          if (bubblesAtBottom.length > 0) {
            // Found bubbles at bottom

            // Process ONLY unprocessed bubbles - 100% perfect 1:1 ratio
            const unprocessedBubbles = bubblesAtBottom.filter(b => !processedBubblesRef.current.has(b.id));

            if (unprocessedBubbles.length > 0) {
              const bubbleToProcess = unprocessedBubbles[0];

              // Mark this bubble as processed immediately to prevent double-processing
              processedBubblesRef.current.add(bubbleToProcess.id);

              // Check if user has extra lives
              if (livesRef.current > 0) {
                // User has extra lives - reduce by 1
                const newLives = livesRef.current - 1;
                livesRef.current = newLives;
                setLives(newLives);

                // Update database in real-time
                if (user?.id) {
                  updateUserLives(user.id, newLives).catch(error => {
                    console.error('Error updating lives in database:', error);
                  });
                }

                // Remove only the bubble that touched bottom and continue game
                return updated.filter(b => b.id !== bubbleToProcess.id);
              } else {
                // No extra lives - game over
                // Save score when game ends
                saveCurrentScore();

                // Set game over state
                setGameState('gameover');
                setShowAdModal(true);

                // Stop the game loop
                if (gameLoopRef.current) {
                  cancelAnimationFrame(gameLoopRef.current);
                  gameLoopRef.current = null;
                }

                setCombo(0);
                setUsedWords(new Set()); // Reset used words for next game

                // Game is over - return empty array to clear all bubbles
                return [];
              }
            }
          }

          return updated;
        });

        setParticles(prev =>
          prev
            .map(p => ({
              ...p,
              x: p.x + p.vx,
              y: p.y + p.vy,
              vy: p.vy + 0.3,
              life: p.life - 0.02
            }))
            .filter(p => p.life > 0)
        );

        // Reduced spawn rate: slower initial spawn (0.008 vs 0.015) and slower increase (0.002 vs 0.003)
        // This gives players more time between bubbles
        if (Math.random() < 0.008 + (difficulty * 0.002)) {
          spawnBubble();
        }
      }

      if (gameState === 'playing') {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
      }
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    };
  }, [gameState, difficulty, isMobile, user?.id]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    // Difficulty increases slower: every 20 seconds (vs 15) and by 0.3 (vs 0.5)
    // This gives players more time to adapt before difficulty increases
    const difficultyTimer = setInterval(() => {
      setDifficulty(d => Math.min(d + 0.3, 10));
    }, 20000);
    return () => clearInterval(difficultyTimer);
  }, [gameState]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().trim();
    setInputValue(value);

    if (value === '') return;

    const matchedBubble = bubbles.find(b => b.word === value);
    if (matchedBubble) {
      createParticles(matchedBubble.x, matchedBubble.y);
      setBubbles(prev => prev.filter(b => b.id !== matchedBubble.id));
      const points = 10 + (combo * 3);
      setScore(s => s + points);
      const newCombo = combo + 1;
      setCombo(newCombo);
      setMaxCombo(m => Math.max(m, newCombo));
      setInputValue('');
      spawnBubble();
    }
  };


  const purchaseHearts = async () => {
    if (!user) return;

    try {
      // Step 1: Create checkout configuration on server
      const config = await createCheckoutConfig();

      if (!config || !config.checkoutId || !config.planId) {
        showError("Failed to create checkout configuration");
        handlePaymentFallback();
        return;
      }

      // Step 2: Use iframe SDK to open Whop checkout modal
      const result = await iframeSdk.inAppPurchase({
        planId: config.planId,
        id: config.checkoutId
      });

      // Handle the result
      if (result.status === "error") {
        showError("Payment cancelled by user");
        return;
      }

      // Payment successful - result.data contains receipt_id
      showSuccess("Payment successful! Game continued with 1 life");

      // Close the modal and continue game
      setShowAdModal(false);

      // Give 1 life to continue the game
      setLives(1);

      // Continue the game from where it left off
      setIsNewGame(false);
      setGameState('playing');
      setBubbles([]);
      setParticles([]);

      // Note: Payment recording is handled by webhook for security
      // The webhook validates the payment server-side and updates the database

    } catch (error) {
      console.error("Payment error:", error);
      showError("Payment failed. Please try again.");
      // Fallback to old system if Whop fails
      handlePaymentFallback();
    }
  };

  // Fallback function for when payment fails
  const handlePaymentFallback = () => {
    try {
      // Give 1 life to continue the game (simple system)
      setLives(1);

      // Close modal and continue game
      setShowAdModal(false);

      // Continue the game from where it left off - maintain score but clear bubbles
      setIsNewGame(false); // This is not a new game, it's a continuation
      setGameState('playing');

      // Clear existing bubbles and particles - start fresh bubbles from top
      setBubbles([]);
      setParticles([]);

      // Clear processed bubbles tracking to start fresh
      processedBubblesRef.current.clear();

      // Reset used words for fresh word pool after payment
      setUsedWords(new Set());

      // Spawn the first bubble quickly after continuing
      setTimeout(() => {
        spawnBubble();
      }, 500); // Small delay to ensure game state is properly set

      // Don't reset score, combo, difficulty - just clear bubbles and continue
      inputRef.current?.focus();

    } catch (error) {
      // Error processing payment fallback
      // Still continue the game even if database save fails
      setLives(1);
      setShowAdModal(false);
      setIsNewGame(false);
      setGameState('playing');

      // Clear existing bubbles and particles - start fresh bubbles from top
      setBubbles([]);
      setParticles([]);

      // Clear processed bubbles tracking to start fresh
      processedBubblesRef.current.clear();

      // Reset used words for fresh word pool after payment
      setUsedWords(new Set());

      // Spawn the first bubble quickly after continuing
      setTimeout(() => {
        spawnBubble();
      }, 500); // Small delay to ensure game state is properly set

      inputRef.current?.focus();
    }
  };


  const saveCurrentScore = async () => {
    if (score > 0 && user?.id) {
      try {
        await saveGameScore({
          user_id: user.id,
          score: score,
          combo: maxCombo
        });
        // Cache will be invalidated automatically by saveGameScore
      } catch (error) {
        // Error saving game score
      }
    }
  };

  const handleBackToMenu = async () => {
    // Save score before going back to menu
    await saveCurrentScore();

    // No heart system - no database updates needed

    if (onBackToMenu) {
      onBackToMenu();
    }
  };

  const goBackToMenu = async () => {
    try {
      // Save current score
      await saveCurrentScore();

      // Game ended - no heart system needed

      // Update high score if needed
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem('bubbleTypeHighScore', score.toString());
      }

      setShowAdModal(false);

      // Go back to main menu
      if (onBackToMenu) {
        onBackToMenu();
      }
    } catch (error) {
      // Error saving game data
      // Still proceed even if database save fails
      setShowAdModal(false);
      if (onBackToMenu) {
        onBackToMenu();
      }
    }
  };

  if (gameState === 'menu') {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-3 sm:p-4 md:p-8 relative overflow-hidden">
        {/* Simplified background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-60 h-60 bg-gradient-to-br from-primary/8 to-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-br from-accent/10 to-primary/5 rounded-full blur-3xl" />
        </div>

        {/* User Profile Card - Only show in menu */}
        {user && (
          <Card className="max-w-sm sm:max-w-md w-full bg-slate-800/95 backdrop-blur-xl border-slate-700/50 shadow-2xl mx-2 mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{user.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg">{user.name}</h3>
                  <p className="text-slate-300 text-sm">@{user.username}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-primary/20 text-primary px-2 py-1 rounded-full text-xs font-semibold">
                      {user.accessLevel}
                    </span>
                    <span className="text-slate-400 text-xs">•</span>
                    <span className="text-slate-400 text-xs">{user.experienceName}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="max-w-sm sm:max-w-md md:max-w-2xl w-full bg-slate-800/95 backdrop-blur-xl border-slate-700/50 shadow-2xl mx-2">
          <CardHeader className="text-center pb-6 bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-t-lg">
            <div className="inline-block mb-4 sm:mb-6">
              <div className="relative">
                <Sparkles className="mx-auto text-primary drop-shadow-lg" size={40} />
              </div>
            </div>
            <CardTitle className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary mb-3 sm:mb-4 tracking-tight drop-shadow-lg">
              TYPE RUSH
            </CardTitle>
            <CardDescription className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-slate-300 text-sm sm:text-base md:text-xl font-semibold">
              <Target size={16} className="text-primary" />
              <p className="bg-gradient-to-r from-slate-300 to-slate-400 bg-clip-text text-transparent">Type Fast • Score High • Win</p>
              <Target size={16} className="text-primary" />
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 sm:space-y-8 px-6 sm:px-8 py-6">
            <div className="relative">
              <Input
                type="text"
                placeholder="Enter username"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={15}
                className="w-full text-base sm:text-lg md:text-xl font-bold pr-12 h-14 sm:h-16 bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
              />
              <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
            </div>

            <Button
              onClick={startGame}
              disabled={!playerName.trim()}
              size="lg"
              className="w-full text-lg sm:text-xl md:text-2xl font-black h-14 sm:h-16 md:h-18 touch-manipulation bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 border-0 shadow-xl hover:shadow-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap size={22} className="mr-3" />
              START GAME
              <Zap size={22} className="ml-3" />
            </Button>

            <Card className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/30 shadow-xl">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="bg-gradient-to-br from-amber-500/30 to-orange-500/30 rounded-full p-2 sm:p-3 shadow-lg">
                      <Trophy className="text-amber-300 drop-shadow-lg" size={20} />
                    </div>
                    <span className="font-black text-amber-200 text-sm sm:text-base md:text-xl tracking-wide">BEST SCORE</span>
                  </div>
                  <span className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-300 drop-shadow-lg">{highScore}</span>
                </div>
              </CardContent>
            </Card>

            {leaderboard.length > 0 && (
              <Card className="bg-slate-700/30 border-slate-600/30 shadow-xl">
                <CardHeader className="pb-4 bg-gradient-to-r from-slate-700/50 to-slate-800/50 rounded-t-lg">
                  <CardTitle className="text-lg sm:text-xl md:text-2xl text-primary flex items-center gap-3">
                    <Award size={20} className="text-primary drop-shadow-lg" />
                    LEADERBOARD
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-2 sm:space-y-3">
                    {leaderboard.slice(0, 5).map((entry, index) => (
                      <div key={index} className={cn(
                        "flex justify-between items-center rounded-xl p-3 sm:p-4 shadow-lg transition-all duration-200",
                        index === 0 ? 'bg-gradient-to-r from-amber-500/30 to-orange-500/30 border border-amber-500/40 shadow-amber-500/20' :
                          index === 1 ? 'bg-gradient-to-r from-slate-600/30 to-slate-700/30 border border-slate-500/40' :
                            index === 2 ? 'bg-gradient-to-r from-orange-600/30 to-orange-700/30 border border-orange-500/40 shadow-orange-500/20' :
                              'bg-slate-600/20 border border-slate-500/30'
                      )}>
                        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                          <span className={cn(
                            "font-black text-base sm:text-lg md:text-xl w-6 sm:w-8 md:w-10 text-center",
                            index === 0 ? 'text-amber-300' :
                              index === 1 ? 'text-slate-300' :
                                index === 2 ? 'text-orange-300' :
                                  'text-slate-400'
                          )}>
                            #{index + 1}
                          </span>
                          <div>
                            <div className="font-bold text-white text-sm sm:text-base md:text-lg">{entry.name}</div>
                            {entry.combo > 5 && (
                              <div className="text-xs text-orange-300 font-semibold flex items-center gap-1">🔥 {entry.combo}x COMBO</div>
                            )}
                          </div>
                        </div>
                        <span className="font-black text-xl sm:text-2xl md:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">{entry.score}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="text-center">
              <div className="inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-primary/20 to-accent/20 px-4 sm:px-6 py-3 sm:py-4 rounded-full border border-primary/30 shadow-lg">
                <Star size={14} className="text-amber-300" />
                <p className="text-slate-200 text-sm sm:text-base font-bold">Build combos for bonus points</p>
                <Star size={14} className="text-amber-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Toast Notifications */}
        <ToastContainer>
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </ToastContainer>
      </div>
    );
  }

  if (showAdModal) {
    return (
      <>
        <GameOverPurchaseScreen
          onClose={goBackToMenu}
          currentScore={score}
          bestScore={highScore}
          onPurchaseSuccess={() => {
            // Trigger immediate refresh to check for hearts
            loadUserData(true);
          }}
        />
        {/* Toast Notifications */}
        <ToastContainer>
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </ToastContainer>
      </>
    );
  }


  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden relative">
      <style>{`
        /* Mobile optimizations */
        @media (max-width: 768px) {
          .bubble-text {
            font-size: 0.75rem !important;
            line-height: 1 !important;
          }
          
          .game-header {
            padding: 0.5rem !important;
          }
          
          .input-box {
            padding: 0.75rem !important;
          }
          
          /* Simplify bubbles on mobile - remove expensive effects */
          .bubble-glow {
            display: none !important;
          }
          
          .bubble-shimmer {
            display: none !important;
          }
          
          .bubble-inner-highlight {
            opacity: 0.5 !important;
          }
        }
        
        /* Prevent text selection on mobile */
        * {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
        
        /* Touch optimizations */
        input, button {
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        
        /* Hardware acceleration for bubbles and particles */
        .bubble-container, .particle-container {
          will-change: transform;
          transform: translateZ(0);
          -webkit-transform: translateZ(0);
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          contain: layout style paint;
        }
        
        /* Hexagon shape */
        .hexagon-shape {
          clip-path: polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%);
        }
        
        /* Shimmer animation for realistic bubble effect - disabled on mobile */
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(200%) skewX(-15deg); }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
        
        @media (max-width: 768px) {
          .animate-shimmer {
            animation: none !important;
          }
        }
        
        /* Optimize game area for mobile */
        @media (max-width: 768px) {
          #game-area {
            contain: layout style paint;
            transform: translateZ(0);
            -webkit-transform: translateZ(0);
            isolation: isolate; /* Create new stacking context for better performance */
          }
          
          /* Reduce backdrop blur on mobile */
          .backdrop-blur-xl {
            backdrop-filter: blur(8px) !important;
            -webkit-backdrop-filter: blur(8px) !important;
          }
        }
      `}</style>

      {/* Simplified background - reduced blur on mobile for performance */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 left-10 w-60 h-60 bg-gradient-to-br from-primary/8 to-primary/5 rounded-full ${isMobile ? 'blur-xl' : 'blur-3xl'}`} />
        <div className={`absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-br from-accent/10 to-primary/5 rounded-full ${isMobile ? 'blur-xl' : 'blur-3xl'}`} />
      </div>

      {/* Mobile-Optimized Game Header */}
      <div className="absolute top-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl shadow-2xl p-2 sm:p-3 z-10 border-b border-primary/30 game-header">
        <div className="max-w-6xl mx-auto">
          {/* Top Row - Back Button, Score and Best Score */}
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              {/* Back Arrow Button */}
              {onBackToMenu && (
                <button
                  onClick={handleBackToMenu}
                  className="w-8 h-8 bg-slate-800/50 backdrop-blur-sm rounded-full flex items-center justify-center border border-slate-600/50 hover:bg-slate-700/50 transition-all duration-200 mr-2"
                  title="Back to Main Menu"
                >
                  <ArrowLeft className="w-4 h-4 text-white" />
                </button>
              )}
              <div className={cn(
                "text-white px-3 py-2 rounded-lg font-black text-lg sm:text-xl shadow-lg transition-all duration-300",
                score > highScore
                  ? "bg-gradient-to-r from-yellow-400 to-orange-500 animate-pulse shadow-yellow-500/50"
                  : "bg-gradient-to-r from-primary via-accent to-primary"
              )}>
                {score}
                {score > highScore && (
                  <span className="ml-2 text-xs animate-bounce">🏆</span>
                )}
              </div>
              {/* Only show best score if current score hasn't exceeded it */}
              {score <= highScore && (
                <div className="bg-slate-700/80 text-slate-200 px-2 py-1 rounded text-xs font-bold">
                  BEST: {highScore}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Extra Lives Display */}
              <div className="flex items-center gap-1 bg-gradient-to-r from-primary/20 to-accent/20 backdrop-blur-sm rounded-full px-2 py-1 border border-primary/30">
                <Heart className="w-3 h-3 text-primary fill-primary" />
                <span className="text-white font-bold text-sm">{lives} Extra</span>
              </div>
              
              {/* Settings Button */}
              <button
                onClick={() => setShowSettings(true)}
                className="w-8 h-8 bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-sm rounded-xl flex items-center justify-center border border-primary/20 hover:border-primary/40 hover:bg-gradient-to-br hover:from-primary/20 hover:to-accent/20 transition-all duration-200 shadow-lg shadow-primary/10"
                title="Customize Objects"
              >
                <Settings className="w-4 h-4 text-white" />
              </button>
              
            </div>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div id="game-area" className="w-full h-screen pt-20 sm:pt-24 pb-20 sm:pb-24 relative">
        {/* Particles */}
        {particles.map(particle => (
          <div
            key={particle.id}
            className="particle-container absolute w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 rounded-full pointer-events-none"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              backgroundColor: particle.color,
              opacity: particle.life,
              transform: `translateZ(0) scale(${particle.life})`,
              boxShadow: isMobile ? 'none' : `0 0 8px ${particle.color}` // Remove shadow on mobile for performance
            }}
          />
        ))}

        {/* Bubbles */}
        {bubbles.map(bubble => {
          // Calculate bubble size based on text length
          const textLength = bubble.word.length;
          let bubbleSize = 'w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24'; // Default size
          let textSize = 'text-xs sm:text-sm md:text-base'; // Default text size

          if (textLength <= 3) {
            bubbleSize = 'w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18';
            textSize = 'text-xs sm:text-sm md:text-sm';
          } else if (textLength <= 6) {
            bubbleSize = 'w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24';
            textSize = 'text-xs sm:text-sm md:text-base';
          } else if (textLength <= 10) {
            bubbleSize = 'w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28';
            textSize = 'text-xs sm:text-sm md:text-base';
          } else {
            bubbleSize = 'w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32';
            textSize = 'text-xs sm:text-sm md:text-sm';
          }

          // Determine shape class based on bubbleType
          const shapeClass = bubbleType === 'circle' ? 'rounded-full' :
                            bubbleType === 'square' ? 'rounded-xl' :
                            bubbleType === 'hexagon' ? 'hexagon-shape' : 'rounded-full';
          
          return (
            <div
              key={bubble.id}
              className="bubble-container absolute"
              style={{
                left: `${bubble.x}%`,
                top: `${bubble.y}%`,
                transform: `translateZ(0) translate(-50%, -50%) scale(${bubble.scale}) rotate(${bubble.rotation}deg)`
              }}
            >
              <div className="relative">
                {/* Dynamic bubble size based on text length */}
                <div className={`relative ${bubbleSize} ${shapeClass}`}>
                  {/* Main bubble body - simplified on mobile for performance */}
                  <div className={`relative w-full h-full ${shapeClass} overflow-hidden`}>
                    {/* Outer glow - hidden on mobile */}
                    {!isMobile && (
                      <div className={`bubble-glow absolute inset-0 bg-gradient-to-br from-primary/60 via-accent/50 to-primary/60 ${shapeClass} blur-md opacity-60`}></div>
                    )}
                    
                    {/* Main bubble gradient - simplified shadow on mobile */}
                    <div className={`relative w-full h-full bg-gradient-to-br from-primary via-accent to-primary ${shapeClass} ${isMobile ? 'border border-white/30' : 'shadow-2xl shadow-primary/50 border-2 border-white/40'}`}>
                      {/* Inner highlight - simplified on mobile */}
                      {!isMobile ? (
                        <>
                          <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/40 via-white/20 to-transparent rounded-full blur-sm bubble-inner-highlight"></div>
                          <div className="absolute top-1/4 left-1/4 w-1/3 h-1/3 bg-white/30 rounded-full blur-xs"></div>
                          <div className={`absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent ${shapeClass}`}></div>
                          <div className={`absolute inset-0 border-2 border-white/30 ${shapeClass}`} style={{
                            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 50%)'
                          }}></div>
                        </>
                      ) : (
                        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-white/20 rounded-full bubble-inner-highlight"></div>
                      )}
                      
                      {/* Text with better contrast */}
                      <div className="absolute inset-0 flex items-center justify-center px-1 z-20">
                        <span className={`${textSize} font-black text-white text-center leading-tight break-words ${isMobile ? '' : 'drop-shadow-2xl'}`} style={{
                          textShadow: isMobile ? '0 1px 3px rgba(0,0,0,0.8)' : '0 2px 8px rgba(0,0,0,0.8), 0 0 4px rgba(168,85,247,0.5)'
                        }}>
                          {bubble.word}
                        </span>
                      </div>
                    </div>
                    
                    {/* Animated shimmer effect - disabled on mobile */}
                    {!isMobile && (
                      <div className="bubble-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer opacity-0 hover:opacity-100 transition-opacity"></div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile-Optimized Input Box */}
      <div className="absolute bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl shadow-2xl p-3 sm:p-4 border-t border-primary/30 safe-area-bottom input-box">
        <div className="max-w-2xl mx-auto">
          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Type here..."
            className="w-full px-4 py-3 text-lg sm:text-xl font-bold text-center placeholder-slate-400 shadow-lg transition-all duration-200 uppercase tracking-wide border-2 border-primary/60 focus:border-primary focus:ring-1 focus:ring-primary/20 bg-slate-800/80 text-white touch-manipulation"
            autoComplete="off"
            autoFocus
            inputMode="text"
          />
          <div className="flex justify-center items-center mt-2">
            <p className="text-slate-400 text-xs font-semibold">
              Type the words in bubbles before they reach the bottom!
            </p>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800/95 via-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-2xl border border-primary/30 shadow-2xl shadow-primary/20 max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                Customize Objects
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="w-8 h-8 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-slate-300 text-sm mb-4">Choose your object style:</p>
              
              <div className="grid grid-cols-2 gap-3">
                {(['bubble', 'circle', 'square', 'hexagon'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setBubbleType(type);
                      setShowSettings(false);
                    }}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all duration-200",
                      bubbleType === type
                        ? "border-primary bg-gradient-to-br from-primary/20 to-accent/20 shadow-lg shadow-primary/30"
                        : "border-slate-600/50 bg-slate-700/30 hover:border-primary/50 hover:bg-slate-700/50"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 mx-auto mb-2 flex items-center justify-center",
                      type === 'bubble' || type === 'circle' ? 'rounded-full' :
                      type === 'square' ? 'rounded-xl' : 'hexagon-shape'
                    )}>
                      <div className={cn(
                        "w-full h-full bg-gradient-to-br from-primary to-accent",
                        type === 'bubble' || type === 'circle' ? 'rounded-full' :
                        type === 'square' ? 'rounded-xl' : 'hexagon-shape'
                      )}></div>
                    </div>
                    <p className="text-white font-bold text-sm capitalize">{type}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </ToastContainer>
      
    </div>
  );
};

export default BubbleTypeGame;
