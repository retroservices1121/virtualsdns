import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer, 
  Area, AreaChart, ComposedChart 
} from 'recharts';
import { 
  DollarSign, Users, TrendingUp, Package, Settings, Download, RefreshCw, 
  Crown, AlertCircle, Wallet, ExternalLink, Shield, Activity, 
  Clock, Globe, Zap, Target, TrendingDown, Eye, EyeOff,
  Copy, CheckCircle, Filter, Search, Calendar, Bell,
  BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon,
  Maximize2, Minimize2, Share2, FileText, Database
} from 'lucide-react';
import DashboardAPI, { useDashboardData } from './dashboard-api';
import { useWallet } from './WalletProvider';
import { formatAddress, formatTokenAmount, formatUSD, copyToClipboard, formatTimeAgo } from './utils/helpers';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const REFRESH_INTERVAL = 30000; // 30 seconds
const MAX_WITHDRAWAL_RESULTS = 5;
const MAX_RECENT_REGISTRATIONS = 10;
const CHART_ANIMATION_DURATION = 800;

const TOKEN_COLORS = {
  ETH: '#3b82f6',
  USDC: '#22c55e',
  VIRTUAL: '#8b5cf6'
};

const PAYMENT_METHOD_COLORS = {
  ETH: 'text-blue-400 bg-blue-500/20',
  USDC: 'text-green-400 bg-green-500/20',
  VIRTUAL: 'text-purple-400 bg-purple-500/20'
};

const WITHDRAWAL_TOKENS = {
  ETH: 'ETH',
  USDC: 'USDC',
  VIRTUAL: 'VIRTUAL',
  ALL: 'ALL'
};

const TIMEFRAME_OPTIONS = [
  { value: '1d', label: '24 Hours' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' }
];

const CHART_THEMES = {
  dark: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    textColor: '#f8fafc',
    gridColor: '#374151'
  },
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: 'rgba(0, 0, 0, 0.1)',
    textColor: '#1e293b',
    gridColor: '#e5e7eb'
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const IntegratedAdminDashboard = () => {
  const { address, isConnected, connector, isCorrectNetwork, contracts, balance } = useWallet();
  const { data: dashboardData, loading, error, refetch } = useDashboardData(REFRESH_INTERVAL);
  
  // Enhanced state management
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawalResults, setWithdrawalResults] = useState([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const [dashboardTheme, setDashboardTheme] = useState('dark');
  const [expandedCharts, setExpandedCharts] = useState(new Set());
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    paymentMethod: 'all',
    domainType: 'all',
    dateRange: '7d'
  });
  const [isExporting, setIsExporting] = useState(false);
  const [showBalances, setShowBalances] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  
  const intervalRef = useRef(null);
  const dashboardRef = useRef(null);

  // Enhanced data processing
  const processedData = useMemo(() => {
    if (!dashboardData) return null;
    
    return {
      ...dashboardData,
      filteredRegistrations: dashboardData.recentRegistrations?.filter(reg => {
        if (searchQuery && !reg.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        if (selectedFilters.paymentMethod !== 'all' && reg.paymentMethod !== selectedFilters.paymentMethod) {
          return false;
        }
        return true;
      }).slice(0, MAX_RECENT_REGISTRATIONS),
      
      growthMetrics: calculateGrowthMetrics(dashboardData),
      projectedRevenue: calculateProjectedRevenue(dashboardData),
      topPerformingDomains: getTopPerformingDomains(dashboardData)
    };
  }, [dashboardData, searchQuery, selectedFilters]);

  // Activity tracking for auto-pause
  useEffect(() => {
    const handleActivity = () => setLastActivityTime(Date.now());
    
    document.addEventListener('mousedown', handleActivity);
    document.addEventListener('keydown', handleActivity);
    document.addEventListener('scroll', handleActivity);
    
    return () => {
      document.removeEventListener('mousedown', handleActivity);
      document.removeEventListener('keydown', handleActivity);
      document.removeEventListener('scroll', handleActivity);
    };
  }, []);

  // Auto-pause when inactive
  useEffect(() => {
    const checkActivity = () => {
      const inactiveTime = Date.now() - lastActivityTime;
      const shouldPause = inactiveTime > 5 * 60 * 1000; // 5 minutes
      
      if (shouldPause && autoRefresh) {
        setAutoRefresh(false);
        addNotification('Auto-refresh paused due to inactivity', 'info');
      }
    };

    intervalRef.current = setInterval(checkActivity, 60000); // Check every minute
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [lastActivityTime, autoRefresh]);

  // Enhanced withdrawal handling
  const handleWithdrawal = useCallback(async (token) => {
    if (!isConnected || !isCorrectNetwork) {
      addNotification('Please connect wallet and switch to Base network', 'error');
      return;
    }

    if (!contracts?.registry) {
      addNotification('Contract not found. Please check network connection.', 'error');
      return;
    }

    setIsWithdrawing(true);
    
    try {
      const result = await executeWithdrawal(token);
      addWithdrawalResult(token, result);
      
      if (result.success) {
        addNotification(`${token} withdrawal successful!`, 'success');
        setTimeout(() => refetch(), 3000); // Refresh data after withdrawal
      } else {
        addNotification(`${token} withdrawal failed: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Withdrawal failed:', error);
      addWithdrawalResult(token, { success: false, error: error.message });
      addNotification(`Withdrawal failed: ${error.message}`, 'error');
    } finally {
      setIsWithdrawing(false);
    }
  }, [isConnected, isCorrectNetwork, contracts, refetch]);

  const executeWithdrawal = async (token) => {
    const api = new DashboardAPI();
    
    switch (token) {
      case WITHDRAWAL_TOKENS.ETH:
        return await api.withdrawETH();
      case WITHDRAWAL_TOKENS.USDC:
        return await api.withdrawUSDC();
      case WITHDRAWAL_TOKENS.VIRTUAL:
        return await api.withdrawVIRTUAL();
      case WITHDRAWAL_TOKENS.ALL:
        return await api.withdrawAll();
      default:
        throw new Error('Invalid token');
    }
  };

  const addWithdrawalResult = (token, result) => {
    const withdrawalResult = {
      id: Date.now(),
      token,
      status: result.success ? 'success' : 'error',
      timestamp: new Date().toISOString(),
      ...(result.success ? { txHash: result.txHash } : { error: result.error })
    };

    setWithdrawalResults(prev => [withdrawalResult, ...prev.slice(0, MAX_WITHDRAWAL_RESULTS - 1)]);
  };

  const addNotification = useCallback((message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toISOString()
    };

    setNotifications(prev => [notification, ...prev.slice(0, 4)]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  }, []);

  const handleExport = useCallback(async () => {
    if (!processedData) return;
    
    setIsExporting(true);
    
    try {
      const api = new DashboardAPI();
      await api.exportToCSV(
        processedData, 
        `virtualsbase-dashboard-${new Date().toISOString().split('T')[0]}.csv`
      );
      addNotification('Dashboard data exported successfully!', 'success');
    } catch (error) {
      console.error('Export failed:', error);
      addNotification('Export failed. Please try again.', 'error');
    } finally {
      setIsExporting(false);
    }
  }, [processedData, addNotification]);

  const toggleChartExpansion = (chartId) => {
    setExpandedCharts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chartId)) {
        newSet.delete(chartId);
      } else {
        newSet.add(chartId);
      }
      return newSet;
    });
  };

  // Loading state
  if (loading && !processedData) {
    return <LoadingScreen />;
  }

  // Error state
  if (error) {
    return <ErrorScreen error={error} onRetry={refetch} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6" ref={dashboardRef}>
      <div className="max-w-7xl mx-auto">
        
        {/* Notifications */}
        <NotificationCenter notifications={notifications} onDismiss={(id) => 
          setNotifications(prev => prev.filter(n => n.id !== id))
        } />
        
        {/* Enhanced Header */}
        <DashboardHeader 
          lastUpdated={processedData?.lastUpdated}
          isConnected={isConnected}
          address={address}
          connector={connector}
          balance={balance}
          loading={loading}
          autoRefresh={autoRefresh}
          onToggleAutoRefresh={() => setAutoRefresh(!autoRefresh)}
          onRefresh={refetch}
          onExport={handleExport}
          isExporting={isExporting}
          onThemeToggle={() => setDashboardTheme(prev => prev === 'dark' ? 'light' : 'dark')}
          theme={dashboardTheme}
        />

        {/* Network Status */}
        <NetworkStatusBar 
          isConnected={isConnected}
          isCorrectNetwork={isCorrectNetwork}
          contracts={contracts}
        />

        {/* Withdrawal Results */}
        <WithdrawalResults results={withdrawalResults} />

        {/* Enhanced Filters */}
        <DashboardFilters 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedFilters={selectedFilters}
          onFiltersChange={setSelectedFilters}
          timeframe={selectedTimeframe}
          onTimeframeChange={setSelectedTimeframe}
        />

        {/* Enhanced Key Metrics */}
        <KeyMetrics 
          data={processedData} 
          showBalances={showBalances}
          onToggleBalances={() => setShowBalances(!showBalances)}
        />

        {/* Growth Insights */}
        <GrowthInsights data={processedData?.growthMetrics} />

        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <ChartContainer
            title="Revenue by Token 💰"
            chartId="revenue-token"
            isExpanded={expandedCharts.has('revenue-token')}
            onToggleExpansion={() => toggleChartExpansion('revenue-token')}
          >
            <RevenueByTokenChart data={processedData?.revenueByToken} />
          </ChartContainer>

          <ChartContainer
            title="Daily Registrations Trend 📈"
            chartId="daily-registrations"
            isExpanded={expandedCharts.has('daily-registrations')}
            onToggleExpansion={() => toggleChartExpansion('daily-registrations')}
          >
            <DailyRegistrationsChart data={processedData?.dailyRegistrations} />
          </ChartContainer>
        </div>

        {/* Revenue Performance Chart */}
        <ChartContainer
          title="Revenue Performance Over Time 📊"
          chartId="revenue-performance"
          isExpanded={expandedCharts.has('revenue-performance')}
          onToggleExpansion={() => toggleChartExpansion('revenue-performance')}
          className="mb-8"
        >
          <RevenuePerformanceChart data={processedData?.dailyRegistrations} />
        </ChartContainer>

        {/* Data Tables Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <DataTableContainer
            title="Live Recent Registrations 🔥"
            subtitle={`${processedData?.filteredRegistrations?.length || 0} recent domains`}
          >
            <RecentRegistrations 
              data={processedData?.filteredRegistrations} 
              searchQuery={searchQuery}
            />
          </DataTableContainer>

          <DataTableContainer
            title="Premium Holdings Portfolio 👑"
            subtitle={`${processedData?.premiumHoldings?.length || 0} valuable domains`}
          >
            <PremiumHoldings data={processedData?.premiumHoldings} />
          </DataTableContainer>
        </div>

        {/* Top Performing Domains */}
        <DataTableContainer
          title="Top Performing Domains 🏆"
          subtitle="Highest value registrations"
          className="mb-8"
        >
          <TopPerformingDomains data={processedData?.topPerformingDomains} />
        </DataTableContainer>

        {/* Enhanced Contract Balances */}
        <ContractBalances 
          balances={processedData?.contractBalances}
          isConnected={isConnected}
          isCorrectNetwork={isCorrectNetwork}
          address={address}
          isWithdrawing={isWithdrawing}
          onWithdrawal={handleWithdrawal}
          showBalances={showBalances}
        />

        {/* Performance Metrics */}
        <PerformanceMetrics data={processedData} />

      </div>
    </div>
  );
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function calculateGrowthMetrics(data) {
  if (!data?.dailyRegistrations) return null;
  
  const recent = data.dailyRegistrations.slice(-7);
  const previous = data.dailyRegistrations.slice(-14, -7);
  
  const recentTotal = recent.reduce((sum, day) => sum + day.total, 0);
  const previousTotal = previous.reduce((sum, day) => sum + day.total, 0);
  
  const growthRate = previousTotal > 0 ? ((recentTotal - previousTotal) / previousTotal) * 100 : 0;
  
  return {
    weeklyGrowth: growthRate,
    dailyAverage: recentTotal / 7,
    trend: growthRate > 0 ? 'up' : growthRate < 0 ? 'down' : 'stable'
  };
}

function calculateProjectedRevenue(data) {
  if (!data?.dailyRegistrations) return null;
  
  const recent = data.dailyRegistrations.slice(-7);
  const avgDailyRevenue = recent.reduce((sum, day) => 
    sum + (day.eth * 3500) + day.usdc + (day.virtual * 3), 0) / 7;
  
  return {
    daily: avgDailyRevenue,
    weekly: avgDailyRevenue * 7,
    monthly: avgDailyRevenue * 30,
    yearly: avgDailyRevenue * 365
  };
}

function getTopPerformingDomains(data) {
  if (!data?.recentRegistrations) return [];
  
  return data.recentRegistrations
    .filter(reg => reg.valuable || reg.estimatedValue > 1000)
    .sort((a, b) => (b.estimatedValue || 0) - (a.estimatedValue || 0))
    .slice(0, 10);
}

// ============================================================================
// UI COMPONENTS
// ============================================================================

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-6"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Database className="w-8 h-8 text-purple-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Loading Dashboard</h2>
        <p className="text-purple-300">Fetching real-time data from Base network...</p>
      </div>
    </div>
  );
}

function ErrorScreen({ error, onRetry }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-4">Dashboard Error</h2>
        <p className="text-red-300 mb-6">{error}</p>
        <button 
          onClick={onRetry}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-5 h-5" />
          Retry Connection
        </button>
      </div>
    </div>
  );
}

function NotificationCenter({ notifications, onDismiss }) {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <NotificationItem 
          key={notification.id} 
          notification={notification} 
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}

function NotificationItem({ notification, onDismiss }) {
  const typeStyles = {
    success: 'bg-green-500/20 border-green-500/30 text-green-300',
    error: 'bg-red-500/20 border-red-500/30 text-red-300',
    info: 'bg-blue-500/20 border-blue-500/30 text-blue-300',
    warning: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300'
  };

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Bell,
    warning: AlertCircle
  };

  const Icon = icons[notification.type] || Bell;

  return (
    <div className={`${typeStyles[notification.type]} p-4 rounded-lg border backdrop-blur-lg max-w-sm animate-in slide-in-from-right duration-300`}>
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium">{notification.message}</p>
          <p className="text-xs opacity-70 mt-1">
            {formatTimeAgo(notification.timestamp)}
          </p>
        </div>
        <button
          onClick={() => onDismiss(notification.id)}
          className="text-current opacity-70 hover:opacity-100 transition-opacity"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function DashboardHeader({ 
  lastUpdated, isConnected, address, connector, balance, loading, autoRefresh,
  onToggleAutoRefresh, onRefresh, onExport, isExporting, onThemeToggle, theme 
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    if (address) {
      const success = await copyToClipboard(address);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            👑 VirtualsBase Live Dashboard
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-400 font-medium">LIVE</span>
            </div>
          </h1>
          <p className="text-purple-200">
            Real-time analytics for AI agent domain registry • Last updated: {
              lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Never'
            }
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={onThemeToggle}
            className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>
          
          <button
            onClick={onToggleAutoRefresh}
            className={`${autoRefresh ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'} text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors`}
          >
            <Activity className="w-4 h-4" />
            {autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
          </button>
          
          <RefreshButton loading={loading} onRefresh={onRefresh} />
          <ExportButton onExport={onExport} isExporting={isExporting} />
        </div>
      </div>

      {/* Enhanced Wallet Status */}
      {isConnected && address && (
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <Wallet className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <div className="text-white font-semibold">{connector?.name} Connected</div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-300 font-mono text-sm">{formatAddress(address)}</span>
                  <button
                    onClick={handleCopyAddress}
                    className="text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            
            {balance && (
              <div className="text-right">
                <div className="text-white font-semibold">
                  {formatTokenAmount(balance.value, balance.decimals, balance.symbol)}
                </div>
                <div className="text-purple-300 text-sm">Wallet Balance</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NetworkStatusBar({ isConnected, isCorrectNetwork, contracts }) {
  if (!isConnected) {
    return (
      <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-400" />
          <div>
            <div className="text-yellow-300 font-semibold">Wallet Not Connected</div>
            <div className="text-yellow-200 text-sm">Connect your wallet to access admin functions</div>
          </div>
        </div>
      </div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-400" />
          <div>
            <div className="text-red-300 font-semibold">Wrong Network</div>
            <div className="text-red-200 text-sm">Please switch to Base network to continue</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-green-400" />
          <div>
            <div className="text-green-300 font-semibold">Connected to Base Network</div>
            <div className="text-green-200 text-sm">All systems operational</div>
          </div>
        </div>
        
        {contracts && (
          <div className="text-right">
            <div className="text-green-300 font-semibold">Registry Contract</div>
            <div className="text-green-200 text-sm font-mono">{formatAddress(contracts.registry)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function RefreshButton({ loading, onRefresh }) {
  return (
    <button
      onClick={onRefresh}
      disabled={loading}
      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
    >
      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Refreshing...' : 'Refresh'}
    </button>
  );
}

function ExportButton({ onExport, isExporting }) {
  return (
    <button
      onClick={onExport}
      disabled={isExporting}
      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
    >
      <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
      {isExporting ? 'Exporting...' : 'Export CSV'}
    </button>
  );
}

function DashboardFilters({ 
  searchQuery, onSearchChange, selectedFilters, onFiltersChange, 
  timeframe, onTimeframeChange 
}) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search domains..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Payment Method Filter */}
        <select
          value={selectedFilters.paymentMethod}
          onChange={(e) => onFiltersChange({...selectedFilters, paymentMethod: e.target.value})}
          className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All Payment Methods</option>
          <option value="ETH">ETH</option>
          <option value="USDC">USDC</option>
          <option value="VIRTUAL">VIRTUAL</option>
        </select>

        {/* Domain Type Filter */}
        <select
          value={selectedFilters.domainType}
          onChange={(e) => onFiltersChange({...selectedFilters, domainType: e.target.value})}
          className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All Domains</option>
          <option value="premium">Premium Only</option>
          <option value="regular">Regular Only</option>
        </select>

        {/* Timeframe */}
        <select
          value={timeframe}
          onChange={(e) => onTimeframeChange(e.target.value)}
          className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          {TIMEFRAME_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function KeyMetrics({ data, showBalances, onToggleBalances }) {
  const metrics = [
    {
      title: 'Total Domains Sold',
      value: data?.totalStats?.totalRegistrations?.toLocaleString() || '0',
      icon: Users,
      color: 'blue',
      badge: '📊 Total',
      growth: data?.growthMetrics?.weeklyGrowth
    },
    {
      title: 'Total Revenue (USD)',
      value: showBalances ? formatUSD(data?.totalStats?.totalRevenueUSD || 0) : '••••••',
      icon: DollarSign,
      color: 'green',
      badge: '💰 Revenue',
      growth: data?.growthMetrics?.weeklyGrowth
    },
    {
      title: 'Average Price',
      value: showBalances ? formatUSD(data?.totalStats?.avgPrice || 0) : '••••••',
      icon: TrendingUp,
      color: 'purple',
      badge: '📈 Avg',
      isAverage: true
    },
    {
      title: 'Registrations Today',
      value: data?.dailyRegistrations?.[data.dailyRegistrations.length - 1]?.total || 0,
      icon: Package,
      color: 'yellow',
      badge: '🔥 Today',
      subtitle: 'Last 24 hours'
    }
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Key Performance Metrics</h2>
        <button
          onClick={onToggleBalances}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
        >
          {showBalances ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          {showBalances ? 'Hide Values' : 'Show Values'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard key={index} metric={metric} />
        ))}
      </div>
    </div>
  );
}

function MetricCard({ metric }) {
  const IconComponent = metric.icon;
  
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    green: 'bg-green-500/20 text-green-300 border-green-500/30',
    purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
  };

  const iconColors = {
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    purple: 'bg-purple-500 text-white',
    yellow: 'bg-yellow-500 text-white'
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${iconColors[metric.color]}`}>
          <IconComponent className="w-6 h-6" />
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-sm font-semibold text-purple-300">
            {metric.badge}
          </span>
          {metric.growth !== undefined && !metric.isAverage && (
            <div className={`flex items-center gap-1 text-xs ${metric.growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {metric.growth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(metric.growth).toFixed(1)}%
            </div>
          )}
        </div>
      </div>
      
      <div className="text-3xl font-bold text-white mb-2 group-hover:scale-105 transition-transform">
        {metric.value}
      </div>
      
      <div className="text-purple-300 text-sm">
        {metric.title}
        {metric.subtitle && (
          <div className="text-purple-400 text-xs mt-1">{metric.subtitle}</div>
        )}
      </div>
    </div>
  );
}

function GrowthInsights({ data }) {
  if (!data) return null;

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <Target className="w-6 h-6 text-purple-400" />
        <h2 className="text-xl font-bold text-white">Growth Insights</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center">
          <div className={`text-3xl font-bold mb-2 ${data.trend === 'up' ? 'text-green-400' : data.trend === 'down' ? 'text-red-400' : 'text-yellow-400'}`}>
            {data.weeklyGrowth > 0 ? '+' : ''}{data.weeklyGrowth.toFixed(1)}%
          </div>
          <div className="text-purple-300 text-sm">Weekly Growth</div>
        </div>
        
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-400 mb-2">
            {data.dailyAverage.toFixed(1)}
          </div>
          <div className="text-purple-300 text-sm">Daily Average</div>
        </div>
        
        <div className="text-center">
          <div className={`text-3xl font-bold mb-2 ${data.trend === 'up' ? 'text-green-400' : data.trend === 'down' ? 'text-red-400' : 'text-yellow-400'}`}>
            {data.trend === 'up' ? '📈' : data.trend === 'down' ? '📉' : '➡️'}
          </div>
          <div className="text-purple-300 text-sm">Trend Direction</div>
        </div>
      </div>
    </div>
  );
}

function ChartContainer({ title, chartId, isExpanded, onToggleExpansion, children, className = '' }) {
  return (
    <div className={`bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 ${isExpanded ? 'lg:col-span-2' : ''} ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <button
          onClick={onToggleExpansion}
          className="text-purple-400 hover:text-purple-300 transition-colors"
        >
          {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
      </div>
      
      <div className={`${isExpanded ? 'h-96' : 'h-64'} transition-all duration-300`}>
        {children}
      </div>
    </div>
  );
}

function DataTableContainer({ title, subtitle, children, className = '' }) {
  return (
    <div className={`bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
          {subtitle && <p className="text-purple-300 text-sm mt-1">{subtitle}</p>}
        </div>
        <Share2 className="w-5 h-5 text-purple-400" />
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

// Continue with remaining components in next response due to length limit...
