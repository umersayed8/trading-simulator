import { useState, useEffect } from 'react';
import { gamificationApi } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { Trophy, Medal, TrendingUp, TrendingDown, Crown, Award, Star } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  userId: number;
  username: string;
  level: number;
  portfolioValue: number;
  pnlPercent: number;
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'alltime'>('weekly');
  const [rankings, setRankings] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<{ rank: number; portfolioValue: number; pnlPercent: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await gamificationApi.getLeaderboard(period, 50);
      setRankings(res.data.data.rankings);
      setUserRank(res.data.data.userRank);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 text-center font-bold text-gray-500 text-sm">{rank}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-up px-4 sm:px-0">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Leaderboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">See how you rank against other traders</p>
        </div>
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <Trophy className="w-5 h-5 text-yellow-500 flex-shrink-0" />
          <span className="text-gray-600 text-sm">Your Rank:</span>
          <span className="font-bold text-primary-600">#{userRank?.rank || '-'}</span>
        </div>
      </div>

      {/* Period Selector */}
      <div className="card">
        <div className="flex flex-wrap gap-2">
          {(['weekly', 'monthly', 'alltime'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                period === p
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {p === 'weekly' && 'This Week'}
              {p === 'monthly' && 'This Month'}
              {p === 'alltime' && 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* User's Position */}
      {userRank && (
        <div className="card bg-primary-50 border-primary-200">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Star className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-primary-600">Your Position</p>
                <p className="text-xl sm:text-2xl font-bold text-primary-700">Rank #{userRank.rank}</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-base sm:text-lg font-bold text-primary-700">
                {formatCurrency(userRank.portfolioValue)}
              </p>
              <p
                className={`flex items-center justify-end text-sm ${
                  userRank.pnlPercent >= 0 ? 'text-success-500' : 'text-danger-500'
                }`}
              >
                {userRank.pnlPercent >= 0 ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1" />
                )}
                {userRank.pnlPercent >= 0 ? '+' : ''}{userRank.pnlPercent.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top 3 Podium */}
      {rankings.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end">

          {/* 2nd Place */}
          <div className="card text-center pt-6 sm:pt-8 px-2 sm:px-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-2 sm:mb-3">
              <Medal className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
            </div>
            <p className="font-bold text-sm sm:text-lg text-gray-900 truncate">{rankings[1].username}</p>
            <p className="text-xs text-gray-500">Lvl {rankings[1].level}</p>
            <p className="text-sm sm:text-lg font-bold text-gray-700 mt-1 sm:mt-2">
              {formatCurrency(rankings[1].portfolioValue)}
            </p>
            <p className={`text-xs ${rankings[1].pnlPercent >= 0 ? 'text-success-500' : 'text-danger-500'}`}>
              {rankings[1].pnlPercent >= 0 ? '+' : ''}{rankings[1].pnlPercent.toFixed(2)}%
            </p>
          </div>

          {/* 1st Place */}
          <div className="card text-center px-2 sm:px-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-2 sm:mb-3 -mt-4">
              <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-500" />
            </div>
            <p className="font-bold text-sm sm:text-xl text-gray-900 truncate">{rankings[0].username}</p>
            <p className="text-xs text-gray-500">Lvl {rankings[0].level}</p>
            <p className="text-sm sm:text-xl font-bold text-yellow-600 mt-1 sm:mt-2">
              {formatCurrency(rankings[0].portfolioValue)}
            </p>
            <p className={`text-xs ${rankings[0].pnlPercent >= 0 ? 'text-success-500' : 'text-danger-500'}`}>
              {rankings[0].pnlPercent >= 0 ? '+' : ''}{rankings[0].pnlPercent.toFixed(2)}%
            </p>
          </div>

          {/* 3rd Place */}
          <div className="card text-center pt-6 sm:pt-8 px-2 sm:px-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center mb-2 sm:mb-3">
              <Award className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600" />
            </div>
            <p className="font-bold text-sm sm:text-lg text-gray-900 truncate">{rankings[2].username}</p>
            <p className="text-xs text-gray-500">Lvl {rankings[2].level}</p>
            <p className="text-sm sm:text-lg font-bold text-gray-700 mt-1 sm:mt-2">
              {formatCurrency(rankings[2].portfolioValue)}
            </p>
            <p className={`text-xs ${rankings[2].pnlPercent >= 0 ? 'text-success-500' : 'text-danger-500'}`}>
              {rankings[2].pnlPercent >= 0 ? '+' : ''}{rankings[2].pnlPercent.toFixed(2)}%
            </p>
          </div>
        </div>
      )}

      {/* Full Rankings List */}
      <div className="card">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Full Rankings</h2>
        <div className="space-y-2">
          {rankings.map((entry) => (
            <div
              key={entry.userId}
              className="flex items-center justify-between p-3 sm:p-4 rounded-lg border bg-primary-50 border-primary-200 gap-2"
            >
              <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
                <div className="w-8 sm:w-10 flex justify-center flex-shrink-0">
                  {getRankIcon(entry.rank)}
                </div>
                <div className="min-w-0">
                  <p className={`font-medium text-sm sm:text-base truncate ${entry.userId === user?.id ? 'text-primary-700' : 'text-gray-900'}`}>
                    {entry.username}
                    {entry.userId === user?.id && (
                      <span className="ml-1 sm:ml-2 text-xs bg-primary-100 text-primary-600 px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap">
                        You
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">Level {entry.level}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-medium text-gray-900 text-sm sm:text-base">
                  {formatCurrency(entry.portfolioValue)}
                </p>
                <p
                  className={`text-xs flex items-center justify-end ${
                    entry.pnlPercent >= 0 ? 'text-success-500' : 'text-danger-500'
                  }`}
                >
                  {entry.pnlPercent >= 0 ? (
                    <TrendingUp className="w-3 h-3 mr-0.5" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-0.5" />
                  )}
                  {entry.pnlPercent >= 0 ? '+' : ''}{entry.pnlPercent.toFixed(2)}%
                </p>
              </div>
            </div>
          ))}
        </div>

        {rankings.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No rankings available yet</p>
          </div>
        )}
      </div>
    </div>
  );
}