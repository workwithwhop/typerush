"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Minus, Plus, X } from "lucide-react";
import { createCheckoutConfig } from "@/lib/actions/charge-user";
import { addHeartsAction } from "@/lib/actions/add-hearts";
import { useIframeSdk } from "@whop/react";

interface GameOverPurchaseScreenProps {
  onClose: () => void;
  currentScore: number;
  bestScore: number;
  onPurchaseSuccess?: () => void; // Callback to trigger refresh after purchase
}

export default function GameOverPurchaseScreen({ 
  onClose, 
  currentScore, 
  bestScore,
  onPurchaseSuccess
}: GameOverPurchaseScreenProps) {
  const [hearts, setHearts] = useState(1);
  const [customHearts, setCustomHearts] = useState('');
  const [loading, setLoading] = useState(false);
  const iframeSdk = useIframeSdk();
  
  const pricePerHeart = 1.00; // $1.00 per heart
  // Ensure hearts is valid (at least 1, no upper limit)
  const validHearts = Math.max(1, hearts);
  const totalPrice = validHearts * pricePerHeart;

  const handlePurchase = async () => {
    try {
      setLoading(true);
      
      console.log("Creating checkout configuration...");
      
      // Use valid hearts count
      const heartsToBuy = validHearts;
      
      // Create checkout configuration
      const config = await createCheckoutConfig(heartsToBuy);
      
      if (!config || !config.checkoutId || !config.planId) {
        console.error("Failed to create checkout configuration:", config);
        alert("Failed to create checkout configuration");
        setLoading(false);
        return;
      }

      console.log("Checkout config created:", config);
      console.log("Opening Whop checkout modal...");

      // Use Whop iframe SDK to open checkout modal with timeout
      const purchasePromise = iframeSdk.inAppPurchase({
        planId: config.planId,
        id: config.checkoutId
      });

      // Add timeout (30 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Checkout timeout")), 30000);
      });

      let result;
      try {
        result = await Promise.race([purchasePromise, timeoutPromise]) as any;
      } catch (timeoutError) {
        console.error("Checkout timeout or error:", timeoutError);
        alert("Checkout timed out. Please try again.");
        setLoading(false);
        return;
      }

      console.log("Purchase result:", result);

      // Handle result
      if (result.status === "error") {
        console.error("Payment error:", result);
        alert("Payment cancelled");
        setLoading(false);
        return;
      }

      // Payment successful - webhook will add hearts
      // For $0 payments (testing), webhook might not fire, so add hearts directly
      console.log(`✅ Payment successful! Adding ${heartsToBuy} hearts...`);
      
      // Try to add hearts directly (for testing when webhook doesn't fire for $0)
      try {
        await addHeartsAction(heartsToBuy);
        console.log(`✅ Hearts added directly via server action`);
      } catch (error) {
        console.log(`⚠️ Could not add hearts directly, waiting for webhook...`);
        // Webhook will handle it if direct call fails
      }
      
      // Trigger callback once - real-time subscriptions will handle updates
      if (onPurchaseSuccess) {
        onPurchaseSuccess();
      }
      
      // Real-time subscriptions will automatically update the UI
      // No need for aggressive polling - just a single check after a short delay
      setTimeout(() => {
        if (onPurchaseSuccess) {
          onPurchaseSuccess();
        }
      }, 3000); // Single check after 3 seconds for webhook delay
      
      // Don't show alert, let the game auto-resume when hearts are detected
      setLoading(false);
      
    } catch (error) {
      console.error("Error creating checkout:", error);
      alert("Failed to create checkout. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 transition">
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 rounded-3xl p-6 max-w-sm w-full border-2 border-primary/40 shadow-[0_20px_70px_rgba(0,0,0,0.6)]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-slate-700/50 hover:bg-slate-600/50 rounded-full flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Header - Show different content for game over vs recharge */}
        {currentScore > 0 ? (
          <div className="text-center mb-4">
            <div className="text-5xl mb-2">💥</div>
            <h2 className="text-2xl font-black text-white mb-1">Game Over!</h2>
            <p className="text-slate-400 text-xs">Score: <span className="text-primary font-bold text-lg">{currentScore}</span></p>
            {currentScore > bestScore && (
              <p className="text-accent text-xs font-bold">🎉 New Best!</p>
            )}
          </div>
        ) : (
          <div className="text-center mb-4">
            <div className="text-5xl mb-2">❤️</div>
            <h2 className="text-2xl font-black text-white mb-1">Recharge Lives</h2>
            <p className="text-slate-400 text-sm">Get more extra lives to keep playing!</p>
          </div>
        )}

        {/* Extra Lives Selector */}
        <div className="bg-gradient-to-br from-primary/15 via-slate-900/90 to-primary/10 rounded-2xl p-5 mb-5 border border-primary/30 shadow-inner shadow-primary/20">
          <div className="text-center mb-3">
            <div className="text-slate-400 text-xs mb-2">Buy Extra Lives</div>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setHearts(Math.max(1, hearts - 1));
                  setCustomHearts('');
                }}
                disabled={hearts <= 1}
                className="w-8 h-8 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:opacity-50 rounded-full flex items-center justify-center transition-colors"
              >
                <Minus className="w-4 h-4 text-white" />
              </button>
              
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1">
                  {[...Array(Math.min(validHearts, 5))].map((_, i) => (
                    <Heart key={i} className="w-5 h-5 text-red-400 fill-red-400" />
                  ))}
                  {validHearts > 5 && (
                    <span className="text-white font-bold text-lg ml-1">×{validHearts}</span>
                  )}
                </div>
                <div className="text-white font-black text-2xl">{validHearts}</div>
              </div>
              
              <button
                onClick={() => {
                  setHearts(hearts + 1);
                  setCustomHearts('');
                }}
                className="w-8 h-8 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:opacity-50 rounded-full flex items-center justify-center transition-colors"
              >
                <Plus className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="space-y-1 pt-3 border-t border-white/10">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Price per extra life:</span>
              <span className="text-white font-bold">${pricePerHeart.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Extra Lives:</span>
              <span className="text-white font-bold">×{validHearts}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-white/10">
              <span className="text-white font-bold">Total:</span>
              <span className="text-primary font-black text-lg">${totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Quick Select Buttons */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[1, 3, 5, 10].map((count) => (
            <button
              key={count}
              onClick={() => {
                setHearts(count);
                setCustomHearts(''); // Clear custom input when selecting preset
              }}
              className={`py-1.5 px-2 rounded-lg font-bold text-xs transition-all ${
                hearts === count && !customHearts
                  ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
              }`}
            >
              {count}
            </button>
          ))}
        </div>

        {/* Custom Input for Hearts */}
        <div className="mb-4">
          <label className="block text-slate-400 text-xs mb-2 text-center">Or enter custom amount</label>
          <Input
            type="number"
            min="1"
            value={customHearts}
            onChange={(e) => {
              const value = e.target.value;
              setCustomHearts(value);
              const numValue = parseInt(value, 10);
              if (!isNaN(numValue) && numValue >= 1) {
                setHearts(numValue);
              }
            }}
            placeholder="Enter number (1+)"
            className="w-full bg-slate-800/50 border-slate-600/50 text-white text-center font-bold text-lg py-2 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Purchase Button */}
        <Button
          onClick={handlePurchase}
          disabled={loading}
          className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-black py-3 text-sm rounded-xl shadow-xl hover:shadow-primary/25 transition-all duration-300 transform hover:scale-105 mb-2"
        >
          {loading ? (
            "Opening Checkout..."
          ) : (
            <>
              <Heart className="w-4 h-4 mr-2 fill-white" />
              Buy {validHearts} Extra {validHearts === 1 ? 'Life' : 'Lives'} - ${totalPrice.toFixed(2)}
            </>
          )}
        </Button>

        {/* Exit Button */}
        <Button
          onClick={onClose}
          variant="outline"
          className="w-full border-slate-600 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white py-2 rounded-xl text-xs"
        >
          Exit to Menu
        </Button>

        
      </div>
    </div>
  );
}
