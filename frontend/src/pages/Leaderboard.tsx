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
        return <span className="w-6 text-center font-bold text-gray-500">{rank}</span>;
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
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
          <p className="text-gray-500 mt-1">See how you rank against other traders</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <span className="text-gray-600">Your Rank:</span>
          <span className="font-bold text-primary-600">#{userRank?.rank || '-'}</span>
        </div>
      </div>

      {/* Period Selector */}
      <div className="card">
        <div className="flex space-x-2">
          {(['weekly', 'monthly', 'alltime'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-primary-600">Your Position</p>
                <p className="text-2xl font-bold text-primary-700">Rank #{userRank.rank}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary-700">
                {formatCurrency(userRank.portfolioValue)}
              </p>
              <p
                className={`flex items-center justify-end ${
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
        <div className="grid grid-cols-3 gap-4">
          {/* 2nd Place */}
          <div className="card text-center pt-8">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Medal className="w-8 h-8 text-gray-400" />
            </div>
            <p className="font-bold text-lg text-gray-900">{rankings[1].username}</p>
            <p className="text-sm text-gray-500">Level {rankings[1].level}</p>
            <p className="text-lg font-bold text-gray-700 mt-2">
              {formatCurrency(rankings[1].portfolioValue)}
            </p>
            <p
              className={`text-sm ${
                rankings[1].pnlPercent >= 0 ? 'text-success-500' : 'text-danger-500'
              }`}
            >
              {rankings[1].pnlPercent >= 0 ? '+' : ''}{rankings[1].pnlPercent.toFixed(2)}%
            </p>
          </div>

          {/* 1st Place */}
          <div className="card text-center ">
            <div className="w-20 h-20 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-3 -mt-4">
              <Crown className="w-10 h-10 text-yellow-500" />
            </div>
            <p className="font-bold text-xl text-gray-900">{rankings[0].username}</p>
            <p className="text-sm text-gray-500">Level {rankings[0].level}</p>
            <p className="text-xl font-bold text-yellow-600 mt-2">
              {formatCurrency(rankings[0].portfolioValue)}
            </p>
            <p
              className={`text-sm ${
                rankings[0].pnlPercent >= 0 ? 'text-success-500' : 'text-danger-500'
              }`}
            >
              {rankings[0].pnlPercent >= 0 ? '+' : ''}{rankings[0].pnlPercent.toFixed(2)}%
            </p>
          </div>

          {/* 3rd Place */}
          <div className="card text-center pt-8">
            <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center mb-3">
              <Award className="w-8 h-8 text-amber-600" />
            </div>
            <p className="font-bold text-lg text-gray-900">{rankings[2].username}</p>
            <p className="text-sm text-gray-500">Level {rankings[2].level}</p>
            <p className="text-lg font-bold text-gray-700 mt-2">
              {formatCurrency(rankings[2].portfolioValue)}
            </p>
            <p
              className={`text-sm ${
                rankings[2].pnlPercent >= 0 ? 'text-success-500' : 'text-danger-500'
              }`}
            >
              {rankings[2].pnlPercent >= 0 ? '+' : ''}{rankings[2].pnlPercent.toFixed(2)}%
            </p>
          </div>
        </div>
      )}

      {/* Full Rankings List */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Full Rankings</h2>
        <div className="space-y-2">
          {rankings.map((entry) => (
            <div
              key={entry.userId}
              className={`flex items-center justify-between p-4 rounded-lg border bg-primary-50 border-primary-200`}
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 flex justify-center">{getRankIcon(entry.rank)}</div>
                <div>
                  <p className={`font-medium ${entry.userId === user?.id ? 'text-primary-700' : 'text-gray-900'}`}>
                    {entry.username}
                    {entry.userId === user?.id && (
                      <span className="ml-2 text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full">
                        You
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500">Level {entry.level}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">{formatCurrency(entry.portfolioValue)}</p>
                <p
                  className={`text-sm flex items-center justify-end ${
                    entry.pnlPercent >= 0 ? 'text-success-500' : 'text-danger-500'
                  }`}
                >
                  {entry.pnlPercent >= 0 ? (
                    <TrendingUp className="w-3 h-3 mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-1" />
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
