"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, X, Minus, Plus } from "lucide-react";
import { createCheckoutConfig } from "@/lib/actions/charge-user";

interface HeartsPurchaseModalProps {
  onClose: () => void;
  currentHearts: number;
}

export default function HeartsPurchaseModal({ onClose, currentHearts }: HeartsPurchaseModalProps) {
  const [hearts, setHearts] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const pricePerHeart = 1.00; // $1.00 per heart
  const totalPrice = hearts * pricePerHeart;

  const handlePurchase = async () => {
    try {
      setLoading(true);
      const result = await createCheckoutConfig(hearts);
      
      // Redirect to Whop checkout
      const checkoutUrl = `https://whop.com/checkout/${result.checkoutId}`;
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Error creating checkout:", error);
      alert("Failed to create checkout. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-3xl p-6 max-w-md w-full border border-white/10 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-slate-700/50 hover:bg-slate-600/50 rounded-full flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/50">
            <Heart className="w-8 h-8 text-white fill-white" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Buy Hearts</h2>
          <p className="text-slate-400 text-sm">
            You have <span className="text-red-400 font-bold">{currentHearts}</span> hearts
          </p>
        </div>

        {/* Heart Selector */}
        <div className="bg-slate-900/50 rounded-2xl p-6 mb-6 border border-white/5">
          <div className="text-center mb-4">
            <div className="text-slate-400 text-sm mb-2">Select Hearts</div>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setHearts(Math.max(1, hearts - 1))}
                disabled={hearts <= 1}
                className="w-10 h-10 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:opacity-50 rounded-full flex items-center justify-center transition-colors"
              >
                <Minus className="w-5 h-5 text-white" />
              </button>
              
              <div className="flex items-center gap-2">
                {[...Array(Math.min(hearts, 5))].map((_, i) => (
                  <Heart key={i} className="w-6 h-6 text-red-400 fill-red-400" />
                ))}
                {hearts > 5 && (
                  <span className="text-white font-bold text-xl">×{hearts}</span>
                )}
              </div>
              
              <button
                onClick={() => setHearts(Math.min(10, hearts + 1))}
                disabled={hearts >= 10}
                className="w-10 h-10 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:opacity-50 rounded-full flex items-center justify-center transition-colors"
              >
                <Plus className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="text-white font-black text-3xl mt-4">{hearts}</div>
          </div>

          {/* Price Breakdown */}
          <div className="space-y-2 pt-4 border-t border-white/10">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Price per heart:</span>
              <span className="text-white font-bold">${pricePerHeart.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Hearts:</span>
              <span className="text-white font-bold">×{hearts}</span>
            </div>
            <div className="flex justify-between text-lg pt-2 border-t border-white/10">
              <span className="text-white font-bold">Total:</span>
              <span className="text-primary font-black">${totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Quick Select Buttons */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[1, 3, 5].map((count) => (
            <button
              key={count}
              onClick={() => setHearts(count)}
              className={`py-2 px-4 rounded-xl font-bold text-sm transition-all ${
                hearts === count
                  ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
              }`}
            >
              {count} {count === 1 ? 'Heart' : 'Hearts'}
            </button>
          ))}
        </div>

        {/* Purchase Button */}
        <Button
          onClick={handlePurchase}
          disabled={loading}
          className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-black py-6 text-lg rounded-2xl shadow-2xl hover:shadow-primary/25 transition-all duration-300 transform hover:scale-105"
        >
          {loading ? (
            "Processing..."
          ) : (
            <>
              <Heart className="w-5 h-5 mr-2 fill-white" />
              Buy {hearts} {hearts === 1 ? 'Heart' : 'Hearts'} for ${totalPrice.toFixed(2)}
            </>
          )}
        </Button>

        <p className="text-slate-500 text-xs text-center mt-4">
          Secure payment powered by Whop
        </p>
      </div>
    </div>
  );
}
