import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { portfolioApi, tradingApi } from '../api/client';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  Star,
  Trash2,
  ChevronRight,
} from 'lucide-react';

interface Holding {
  symbol: string;
  quantity: number;
  avgBuyPrice?: number;
  avg_buy_price?: number;
  currentPrice: number;
  investedValue: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
}

function resolveAvgPrice(h: Holding): number {
  const v = h.avgBuyPrice ?? h.avg_buy_price;
  const n = Number(v);
  return isNaN(n) || n <= 0 ? 0 : n;
}

// Safe cast helper — MySQL DECIMAL fields sometimes arrive as strings
function safeNum(v: any): number {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

function normaliseHolding(h: any): Holding {
  const qty          = safeNum(h.quantity);
  const avgPrice     = safeNum(h.avgBuyPrice ?? h.avg_buy_price);
  const currentPrice = safeNum(h.currentPrice);
  const invested     = safeNum(h.investedValue) || qty * avgPrice;
  const current      = safeNum(h.currentValue)  || qty * currentPrice;
  const pnl          = safeNum(h.pnl) || (current - invested);
  const pnlPct       = safeNum(h.pnlPercent) || (invested > 0 ? ((current - invested) / invested) * 100 : 0);
  return {
    ...h,
    quantity:       qty,
    avgBuyPrice:    avgPrice,
    avg_buy_price:  avgPrice,
    currentPrice,
    investedValue:  invested,
    currentValue:   current,
    pnl:            parseFloat(pnl.toFixed(2)),
    pnlPercent:     parseFloat(pnlPct.toFixed(2)),
  };
}

interface Trade {
  id: number;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  total: number;
  executedAt: string;
}

interface WatchlistItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export default function Portfolio() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'holdings' | 'orders' | 'watchlist'>('holdings');
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [orders, setOrders] = useState<Trade[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [balance, setBalance] = useState(100000);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [portfolioRes, ordersRes, watchlistRes] = await Promise.all([
        portfolioApi.getSummary(),
        tradingApi.getOrders(50),
        portfolioApi.getWatchlist(),
      ]);
      const rawHoldings: any[] = portfolioRes.data.data.holdings ?? [];
      setHoldings(rawHoldings.map(normaliseHolding));
      setBalance(safeNum(portfolioRes.data.data.balance));
      setOrders(ordersRes.data.data.orders);
      setWatchlist(watchlistRes.data.data);
    } catch (error) {
      console.error('Failed to fetch portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWatchlist = async (symbol: string) => {
    try {
      await portfolioApi.removeFromWatchlist(symbol);
      setWatchlist(watchlist.filter((w) => w.symbol !== symbol));
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(value);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const investedValue = holdings.reduce((sum, h) => sum + h.investedValue, 0);
  const currentValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalPnL = currentValue - investedValue;
  const totalPnLPercent = investedValue > 0 ? (totalPnL / investedValue) * 100 : 0;
  const totalPortfolioValue = balance + currentValue;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-up px-4 sm:px-0">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Portfolio</h1>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="card">
          <p className="text-xs sm:text-sm text-gray-500 mb-1">Total Value</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900">{formatCurrency(totalPortfolioValue)}</p>
        </div>
        <div className="card">
          <p className="text-xs sm:text-sm text-gray-500 mb-1">Cash Balance</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900">{formatCurrency(balance)}</p>
        </div>
        <div className="card">
          <p className="text-xs sm:text-sm text-gray-500 mb-1">Invested Value</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900">{formatCurrency(currentValue)}</p>
        </div>
        <div className="card col-span-2 md:col-span-1">
          <p className="text-xs sm:text-sm text-gray-500 mb-1">Total P&L</p>
          <div className={`flex items-center ${totalPnL >= 0 ? 'text-success-500' : 'text-danger-500'}`}>
            {totalPnL >= 0 ? (
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-1 flex-shrink-0" />
            ) : (
              <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 mr-1 flex-shrink-0" />
            )}
            <span className="text-lg sm:text-2xl font-bold">
              {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
            </span>
          </div>
          <p className={`text-xs sm:text-sm ${totalPnL >= 0 ? 'text-success-500' : 'text-danger-500'}`}>
            ({totalPnLPercent.toFixed(2)}%)
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        {/* Tab buttons — scroll horizontally on very small screens */}
        <div className="flex border-b border-gray-200 mb-4 -mx-1 overflow-x-auto">
          {(['holdings', 'orders', 'watchlist'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 sm:px-4 py-2 font-medium text-xs sm:text-sm border-b-2 transition-colors -mb-px whitespace-nowrap ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'holdings' && `Holdings (${holdings.length})`}
              {tab === 'orders' && `Order History (${orders.length})`}
              {tab === 'watchlist' && `Watchlist (${watchlist.length})`}
            </button>
          ))}
        </div>

        {/* Holdings Tab */}
        {activeTab === 'holdings' && (
          <>
            {holdings.length > 0 ? (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                        <th className="pb-3 font-medium">Stock</th>
                        <th className="pb-3 font-medium text-right">Qty</th>
                        <th className="pb-3 font-medium text-right">Avg Price</th>
                        <th className="pb-3 font-medium text-right">Current</th>
                        <th className="pb-3 font-medium text-right">Value</th>
                        <th className="pb-3 font-medium text-right">P&L</th>
                        <th className="pb-3 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {holdings.map((holding) => (
                        <tr key={holding.symbol} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/stocks/${holding.symbol}`)}>
                          <td className="py-4">
                            <p className="font-medium text-gray-900">
                              {holding.symbol.replace('.NS', '').replace('.BO', '')}
                            </p>
                          </td>
                          <td className="py-4 text-right text-gray-900">{holding.quantity}</td>
                          <td className="py-4 text-right text-gray-900">
                            {resolveAvgPrice(holding) > 0 ? formatCurrency(resolveAvgPrice(holding)) : '—'}
                          </td>
                          <td className="py-4 text-right text-gray-900">
                            {formatCurrency(holding.currentPrice)}
                          </td>
                          <td className="py-4 text-right font-medium text-gray-900">
                            {formatCurrency(holding.currentValue)}
                          </td>
                          <td className="py-4 text-right">
                            <p className={`font-medium ${holding.pnl >= 0 ? 'text-success-500' : 'text-danger-500'}`}>
                              {holding.pnl >= 0 ? '+' : ''}{formatCurrency(holding.pnl)}
                            </p>
                            <p className={`text-sm ${holding.pnl >= 0 ? 'text-success-500' : 'text-danger-500'}`}>
                              ({holding.pnlPercent.toFixed(2)}%)
                            </p>
                          </td>
                          <td className="py-4">
                            <ChevronRight className="w-5 h-5 text-primary-600" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-3">
                  {holdings.map((holding) => (
                    <div key={holding.symbol} className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-semibold text-gray-900">
                          {holding.symbol.replace('.NS', '').replace('.BO', '')}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${holding.pnl >= 0 ? 'text-success-500' : 'text-danger-500'}`}>
                            {holding.pnl >= 0 ? '+' : ''}{holding.pnlPercent.toFixed(2)}%
                          </span>
                          <Link to={`/trade/${holding.symbol}`} className="text-primary-600 hover:text-primary-700">
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-y-2 text-sm">
                        <div>
                          <p className="text-xs text-gray-400">Qty</p>
                          <p className="text-gray-900">{holding.quantity}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Avg Price</p>
                          <p className="text-gray-900">
                            {resolveAvgPrice(holding) > 0 ? formatCurrency(resolveAvgPrice(holding)) : '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Current Price</p>
                          <p className="text-gray-900">{formatCurrency(holding.currentPrice)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Current Value</p>
                          <p className="font-medium text-gray-900">{formatCurrency(holding.currentValue)}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-gray-400">P&L</p>
                          <p className={`font-medium ${holding.pnl >= 0 ? 'text-success-500' : 'text-danger-500'}`}>
                            {holding.pnl >= 0 ? '+' : ''}{formatCurrency(holding.pnl)}
                            <span className="ml-1 font-normal text-xs">({holding.pnlPercent.toFixed(2)}%)</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No holdings yet</p>
                <Link to="/trade" className="text-primary-600 hover:underline text-sm">
                  Start trading to build your portfolio
                </Link>
              </div>
            )}
          </>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <>
            {orders.length > 0 ? (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                        <th className="pb-3 font-medium">Date</th>
                        <th className="pb-3 font-medium">Stock</th>
                        <th className="pb-3 font-medium">Type</th>
                        <th className="pb-3 font-medium text-right">Qty</th>
                        <th className="pb-3 font-medium text-right">Price</th>
                        <th className="pb-3 font-medium text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="py-4 text-gray-500 text-sm">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2" />
                              {formatDate(order.executedAt)}
                            </div>
                          </td>
                          <td className="py-4 font-medium text-gray-900">
                            {order.symbol.replace('.NS', '').replace('.BO', '')}
                          </td>
                          <td className="py-4">
                            <span className={`badge ${order.type === 'BUY' ? 'badge-success' : 'badge-danger'}`}>
                              {order.type}
                            </span>
                          </td>
                          <td className="py-4 text-right text-gray-900">{order.quantity}</td>
                          <td className="py-4 text-right text-gray-900">{formatCurrency(order.price)}</td>
                          <td className="py-4 text-right font-medium text-gray-900">{formatCurrency(order.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-3">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-gray-100 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-gray-900">
                          {order.symbol.replace('.NS', '').replace('.BO', '')}
                        </p>
                        <span className={`badge ${order.type === 'BUY' ? 'badge-success' : 'badge-danger'}`}>
                          {order.type}
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-gray-400 mb-3">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDate(order.executedAt)}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-gray-400">Qty</p>
                          <p className="text-gray-900">{order.quantity}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Price</p>
                          <p className="text-gray-900">{formatCurrency(order.price)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Total</p>
                          <p className="font-medium text-gray-900">{formatCurrency(order.total)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No orders yet</p>
              </div>
            )}
          </>
        )}

        {/* Watchlist Tab */}
        {activeTab === 'watchlist' && (
          <>
            {watchlist.length > 0 ? (
              <div className="space-y-2">
                {watchlist.map((item) => (
                  <div
                    key={item.symbol}
                    className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 gap-2"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <Link
                          to={`/stocks/${item.symbol}`}
                          className="font-medium text-gray-900 hover:text-primary-600 text-sm sm:text-base block truncate"
                        >
                          {item.symbol.replace('.NS', '').replace('.BO', '')}
                        </Link>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">{item.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-6 flex-shrink-0">
                      <div className="text-right">
                        <p className="font-medium text-gray-900 text-sm sm:text-base">{formatCurrency(item.price)}</p>
                        <p className={`text-xs sm:text-sm flex items-center justify-end ${item.change >= 0 ? 'text-success-500' : 'text-danger-500'}`}>
                          {item.change >= 0 ? (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          ) : (
                            <TrendingDown className="w-3 h-3 mr-1" />
                          )}
                          {item.change >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromWatchlist(item.symbol)}
                        className="p-1.5 sm:p-2 text-gray-400 hover:text-danger-500 rounded-lg hover:bg-white"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Your watchlist is empty</p>
                <Link to="/trade" className="text-primary-600 hover:underline text-sm">
                  Search and add stocks to watch
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}