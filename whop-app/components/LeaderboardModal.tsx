"use client";

import { Crown, Medal, Award, ArrowLeft, Trophy } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  avatar: string;
}

interface LeaderboardScreenProps {
  leaderboard: LeaderboardEntry[];
  userRank: number;
  onBack: () => void;
}

export default function LeaderboardScreen({ leaderboard, userRank, onBack }: LeaderboardScreenProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-amber-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-slate-400" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-400" />;
      default:
        return <span className="text-slate-400 font-bold text-lg">#{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/30";
      case 2:
        return "bg-gradient-to-r from-slate-600/20 to-slate-700/20 border-slate-500/30";
      case 3:
        return "bg-gradient-to-r from-orange-600/20 to-orange-700/20 border-orange-500/30";
      default:
        return "bg-gradient-to-r from-slate-700/20 to-slate-800/20 border-slate-600/30";
    }
  };

  const getScoreColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "text-amber-400";
      case 2:
        return "text-slate-300";
      case 3:
        return "text-orange-400";
      default:
        return "text-slate-300";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Mobile Game Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-60 h-60 bg-gradient-to-br from-primary/15 to-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-br from-emerald-500/10 to-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-20 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="w-10 h-10 bg-slate-800/50 backdrop-blur-sm rounded-full flex items-center justify-center border border-slate-600/50 hover:bg-slate-700/50 transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" />
              <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Game Container */}
      <div className="relative z-10 min-h-screen flex flex-col max-w-md mx-auto px-4 pt-20 pb-6">
        {/* Subtitle */}
        <div className="text-center mb-6">
          <p className="text-slate-300 text-sm">Top 50 players worldwide</p>
        </div>

        {/* Leaderboard List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {leaderboard.slice(0, 50).map((player) => (
            <div
              key={player.rank}
              className={`flex items-center justify-between rounded-xl p-4 border ${getRankColor(player.rank)} ${
                player.rank === userRank ? "ring-2 ring-primary/50" : ""
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 flex items-center justify-center">
                  {getRankIcon(player.rank)}
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{player.avatar}</span>
                </div>
                <div>
                  <div className={`font-bold text-base ${player.rank === userRank ? "text-primary" : "text-white"}`}>
                    {player.name}
                    {player.rank === userRank && " (You)"}
                  </div>
                  <div className="text-slate-400 text-sm">
                    {player.rank === 1 ? "Champion" : 
                     player.rank === 2 ? "Runner-up" : 
                     player.rank === 3 ? "3rd Place" : 
                     `Rank #${player.rank}`}
                  </div>
                </div>
              </div>
              <div className={`font-black text-xl ${getScoreColor(player.rank)}`}>
                {player.score.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
