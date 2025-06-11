import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';
import { DollarSign, Users, TrendingUp, Package, Settings, Download, RefreshCw, Crown, AlertCircle, Wallet, ExternalLink } from 'lucide-react';
import DashboardAPI, { useDashboardData } from './dashboard-api';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const REFRESH_INTERVAL = 30000; // 30 seconds
const MAX_WITHDRAWAL_RESULTS = 3;

const TOKEN_COLORS = {
  ETH: '#3b82f6',
  USDC: '#22c55e',
  VIRTUAL: '#8b5cf6'
};

const WITHDRAWAL_TOKENS = {
  ETH: 'ETH',
  USDC: 'USDC',
  VIRTUAL: 'VIRTUAL',
  ALL: 'ALL'
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const IntegratedAdminDashboard = () => {
  const { data: dashboardData, loading, error, refetch, api } = useDashboardData(REFRESH_INTERVAL);
  
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawalResults, setWithdrawalResults] = useState([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const [signer, setSigner] = useState(null);

  // Initialize Web3 connection
  useEffect(() => {
    initializeWeb3();
  }, [api]);

  const initializeWeb3 = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const userSigner = provider.getSigner();
        setSigner(userSigner);
        api.initializeWithSigner(userSigner);
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      }
    }
  };

  const handleWithdrawal = async (token) => {
    if (!signer) {
      alert('Please connect your wallet first');
      return;
    }

    setIsWithdrawing(true);
    try {
      const result = await executeWithdrawal(token);
      addWithdrawalResult(token, result);
      
      if (result.success) {
        setTimeout(() => refetch(), 2000);
      }
    } catch (error) {
      console.error('Withdrawal failed:', error);
      addWithdrawalResult(token, { success: false, error: error.message });
    } finally {
      setIsWithdrawing(false);
    }
  };

  const executeWithdrawal = async (token) => {
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
      token,
      status: result.success ? 'success' : 'error',
      timestamp: new Date().toISOString(),
      ...(result.success ? { txHash: result.txHash } : { error: result.error })
    };

    setWithdrawalResults(prev => [...prev, withdrawalResult]);
  };

  const connectWallet = async () => {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const userSigner = provider.getSigner();
      setSigner(userSigner);
      api.initializeWithSigner(userSigner);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const exportData = () => {
    if (dashboardData) {
      api.exportToCSV(
        dashboardData, 
        `virtuals-base-dashboard-${new Date().toISOString().split('T')[0]}.csv`
      );
    }
  };

  // Loading state
  if (loading && !dashboardData) {
    return <LoadingScreen />;
  }

  // Error state
  if (error) {
    return <ErrorScreen error={error} onRetry={refetch} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        
        <DashboardHeader 
          lastUpdated={dashboardData?.lastUpdated}
          signer={signer}
          loading={loading}
          onConnectWallet={connectWallet}
          onRefresh={refetch}
          onExport={exportData}
        />

        <WithdrawalResults results={withdrawalResults} />

        <KeyMetrics data={dashboardData} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <RevenueByTokenChart data={dashboardData?.revenueByToken} />
          <DailyRegistrationsChart data={dashboardData?.dailyRegistrations} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <RecentRegistrations data={dashboardData?.recentRegistrations} />
          <PremiumHoldings data={dashboardData?.premiumHoldings} />
        </div>

        <ContractBalances 
          balances={dashboardData?.contractBalances}
          signer={signer}
          isWithdrawing={isWithdrawing}
          onWithdrawal={handleWithdrawal}
        />
      </div>
    </div>
  );
};

// ============================================================================
// UI COMPONENTS
// ============================================================================

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="text-white text-xl flex items-center gap-3">
        <RefreshCw className="w-6 h-6 animate-spin" />
        Loading dashboard data...
      </div>
    </div>
  );
}

function ErrorScreen({ error, onRetry }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-400 text-xl mb-4">Error loading dashboard</div>
        <div className="text-red-300 mb-4">{error}</div>
        <button 
          onClick={onRetry}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

function DashboardHeader({ lastUpdated, signer, loading, onConnectWallet, onRefresh, onExport }) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">
          👑 VirtualsBase Live Dashboard
        </h1>
        <p className="text-purple-200">
          Real-time analytics • Last updated: {
            lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Never'
          }
        </p>
      </div>
      
      <div className="flex gap-3">
        <WalletStatus signer={signer} onConnect={onConnectWallet} />
        <RefreshButton loading={loading} onRefresh={onRefresh} />
        <ExportButton onExport={onExport} />
      </div>
    </div>
  );
}

function WalletStatus({ signer, onConnect }) {
  if (!signer) {
    return (
      <button
        onClick={onConnect}
        className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
      >
        <Wallet className="w-4 h-4" />
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="bg-green-500/20 px-3 py-2 rounded-lg border border-green-500/30">
      <span className="text-green-300 text-sm">✅ Wallet Connected</span>
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
      Refresh
    </button>
  );
}

function ExportButton({ onExport }) {
  return (
    <button
      onClick={onExport}
      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
    >
      <Download className="w-4 h-4" />
      Export CSV
    </button>
  );
}

function WithdrawalResults({ results }) {
  if (results.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="text-white font-semibold mb-3">Recent Withdrawal Results:</h3>
      <div className="space-y-2">
        {results.slice(-MAX_WITHDRAWAL_RESULTS).map((result, index) => (
          <WithdrawalResultItem key={index} result={result} />
        ))}
      </div>
    </div>
  );
}

function WithdrawalResultItem({ result }) {
  const isSuccess = result.status === 'success';
  const statusClasses = isSuccess
    ? 'bg-green-500/20 border-green-500/30 text-green-300'
    : 'bg-red-500/20 border-red-500/30 text-red-300';

  return (
    <div className={`p-3 rounded-lg border ${statusClasses}`}>
      {isSuccess ? (
        <div className="flex items-center justify-between">
          <span>✅ {result.token} withdrawal successful</span>
          <a 
            href={`https://basescan.org/tx/${result.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm hover:underline"
          >
            View TX <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      ) : (
        <span>❌ {result.token} withdrawal failed: {result.error}</span>
      )}
    </div>
  );
}

function KeyMetrics({ data }) {
  const metrics = [
    {
      title: 'Total Domains Sold',
      value: data?.totalStats?.totalRegistrations?.toLocaleString() || '0',
      icon: Users,
      color: 'blue',
      badge: 'Live 📊'
    },
    {
      title: 'Total Revenue (USD)',
      value: `$${data?.totalStats?.totalRevenueUSD?.toLocaleString() || '0'}`,
      icon: DollarSign,
      color: 'green',
      badge: 'Real-time 💰'
    },
    {
      title: 'Average Price',
      value: `$${data?.totalStats?.avgPrice || '0'}`,
      icon: TrendingUp,
      color: 'purple',
      badge: 'Avg 📈'
    },
    {
      title: 'Registrations Today',
      value: data?.dailyRegistrations?.[data.dailyRegistrations.length - 1]?.total || 0,
      icon: Package,
      color: 'yellow',
      badge: 'Today 🔥'
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-300',
    green: 'bg-green-500/20 text-green-300',
    purple: 'bg-purple-500/20 text-purple-300',
    yellow: 'bg-yellow-500/20 text-yellow-300'
  };

  const badgeColors = {
    blue: 'text-green-400',
    green: 'text-green-400',
    purple: 'text-yellow-400',
    yellow: 'text-blue-400'
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric, index) => {
        const IconComponent = metric.icon;
        return (
          <div key={index} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${colorClasses[metric.color]}`}>
                <IconComponent className="w-6 h-6" />
              </div>
              <span className={`text-sm font-semibold ${badgeColors[metric.color]}`}>
                {metric.badge}
              </span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {metric.value}
            </div>
            <div className="text-purple-300 text-sm">{metric.title}</div>
          </div>
        );
      })}
    </div>
  );
}

function RevenueByTokenChart({ data }) {
  if (!data) return null;

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
      <h2 className="text-xl font-bold text-white mb-6">Live Revenue by Token 💰</h2>
      
      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="amount"
              label={({token, percentage}) => `${token} ${percentage}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="space-y-3">
        {data.map((token) => (
          <TokenRevenueItem key={token.token} token={token} />
        ))}
      </div>
    </div>
  );
}

function TokenRevenueItem({ token }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div 
          className="w-4 h-4 rounded-full" 
          style={{ backgroundColor: token.color }}
        />
        <span className="text-white font-semibold">{token.token}</span>
      </div>
      <div className="text-right">
        <div className="text-white font-bold">${token.amount.toLocaleString()}</div>
        <div className="text-purple-300 text-sm">{token.registrations} domains</div>
      </div>
    </div>
  );
}

function DailyRegistrationsChart({ data }) {
  if (!data) return null;

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
      <h2 className="text-xl font-bold text-white mb-6">Daily Registrations Trend 📈</h2>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              stroke="#9ca3af"
              tick={{ fontSize: 12 }}
              tickFormatter={(date) => new Date(date).getDate()}
            />
            <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                border: '1px solid #374151',
                borderRadius: '8px'
              }}
              labelStyle={{ color: '#f3f4f6' }}
            />
            <Legend />
            <Line type="monotone" dataKey="eth" stroke={TOKEN_COLORS.ETH} strokeWidth={2} name="ETH" />
            <Line type="monotone" dataKey="usdc" stroke={TOKEN_COLORS.USDC} strokeWidth={2} name="USDC" />
            <Line type="monotone" dataKey="virtual" stroke={TOKEN_COLORS.VIRTUAL} strokeWidth={2} name="VIRTUAL" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function RecentRegistrations({ data }) {
  if (!data) return null;

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
      <h2 className="text-xl font-bold text-white mb-6">Live Recent Registrations 🔥</h2>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {data.map((domain, index) => (
          <RegistrationItem key={index} domain={domain} />
        ))}
      </div>
    </div>
  );
}

function RegistrationItem({ domain }) {
  const paymentColors = {
    USDC: 'text-green-400',
    ETH: 'text-blue-400',
    VIRTUAL: 'text-purple-400'
  };

  return (
    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {domain.valuable && <Crown className="w-4 h-4 text-yellow-400" />}
          <div>
            <div className="text-white font-semibold">{domain.name}</div>
            <div className="text-purple-300 text-sm">
              {new Date(domain.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`text-sm font-semibold ${paymentColors[domain.paymentMethod] || 'text-gray-400'}`}>
            {domain.paymentMethod}
          </div>
          <div className="text-white text-sm">{domain.amount}</div>
        </div>
      </div>
    </div>
  );
}

function PremiumHoldings({ data }) {
  if (!data) return null;

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Premium Holdings 👑</h2>
        <div className="flex items-center gap-2 text-yellow-400">
          <Crown className="w-5 h-5" />
          <span className="text-sm font-semibold">High Value Portfolio</span>
        </div>
      </div>
      
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {data.map((holding, index) => (
          <PremiumHoldingItem key={index} holding={holding} />
        ))}
      </div>
    </div>
  );
}

function PremiumHoldingItem({ holding }) {
  return (
    <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg p-4 border border-yellow-500/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Crown className="w-5 h-5 text-yellow-400" />
          <div>
            <div className="text-white font-semibold">{holding.name}</div>
            <div className="text-yellow-300 text-sm">{holding.category}</div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-yellow-400 font-bold">{holding.estimatedValue}</div>
          <div className={`text-sm ${holding.isSecured ? 'text-green-300' : 'text-red-300'}`}>
            {holding.isSecured ? '🔒 Secured' : '⚠️ At Risk'}
          </div>
        </div>
      </div>
    </div>
  );
}

function ContractBalances({ balances, signer, isWithdrawing, onWithdrawal }) {
  if (!balances) return null;

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
      <h2 className="text-xl font-bold text-white mb-6">Live Contract Balances & Withdrawal 💳</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <TokenBalance 
          token="ETH"
          symbol="Ξ"
          name="Ethereum (ETH)"
          balance={balances.eth}
          formattedBalance={`${balances.eth.toFixed(4)} ETH`}
          usdValue={`≈ $${(balances.eth * 3500).toLocaleString()}`}
          color="blue"
        />
        
        <TokenBalance 
          token="USDC"
          symbol="$"
          name="USD Coin (USDC)"
          balance={balances.usdc}
          formattedBalance={`$${balances.usdc.toLocaleString()}`}
          usdValue="Stable value"
          color="green"
        />
        
        <TokenBalance 
          token="VIRTUAL"
          symbol="V"
          name="VIRTUAL Tokens"
          balance={balances.virtual}
          formattedBalance={`${(balances.virtual / 1000000).toFixed(2)}M VIRTUAL`}
          usdValue={`≈ $${(balances.virtual * 3).toLocaleString()}`}
          color="purple"
        />
      </div>
      
      <WithdrawalButtons 
        balances={balances}
        signer={signer}
        isWithdrawing={isWithdrawing}
        onWithdrawal={onWithdrawal}
      />
      
      {!signer && <WalletConnectionWarning />}
    </div>
  );
}

function TokenBalance({ token, symbol, name, balance, formattedBalance, usdValue, color }) {
  const colorClasses = {
    blue: 'bg-blue-500/20 border-blue-500/30 bg-blue-500 text-blue-300',
    green: 'bg-green-500/20 border-green-500/30 bg-green-500 text-green-300',
    purple: 'bg-purple-500/20 border-purple-500/30 bg-purple-500 text-purple-300'
  };

  const [bgClass, borderClass, symbolBgClass, textClass] = colorClasses[color].split(' ');

  return (
    <div className={`${bgClass} rounded-lg p-4 border ${borderClass}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-8 h-8 ${symbolBgClass} rounded-full flex items-center justify-center text-white font-bold`}>
          {symbol}
        </div>
        <span className={`${textClass} font-semibold`}>{name}</span>
      </div>
      <div className="text-2xl font-bold text-white">{formattedBalance}</div>
      <div className={`${textClass} text-sm`}>{usdValue}</div>
    </div>
  );
}

function WithdrawalButtons({ balances, signer, isWithdrawing, onWithdrawal }) {
  const buttons = [
    {
      token: WITHDRAWAL_TOKENS.ETH,
      label: 'Withdraw ETH',
      color: 'bg-blue-600 hover:bg-blue-700',
      disabled: balances.eth === 0
    },
    {
      token: WITHDRAWAL_TOKENS.USDC,
      label: 'Withdraw USDC',
      color: 'bg-green-600 hover:bg-green-700',
      disabled: balances.usdc === 0
    },
    {
      token: WITHDRAWAL_TOKENS.VIRTUAL,
      label: 'Withdraw VIRTUAL',
      color: 'bg-purple-600 hover:bg-purple-700',
      disabled: balances.virtual === 0
    },
    {
      token: WITHDRAWAL_TOKENS.ALL,
      label: 'Withdraw ALL 🚀',
      color: 'bg-yellow-600 hover:bg-yellow-700',
      disabled: false,
      special: true
    }
  ];

  return (
    <div className="flex flex-wrap gap-4">
      {buttons.map((button) => (
        <button
          key={button.token}
          onClick={() => onWithdrawal(button.token)}
          disabled={isWithdrawing || !signer || button.disabled}
          className={`${button.color} disabled:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${button.special ? 'font-semibold' : ''}`}
        >
          <Download className="w-4 h-4" />
          {isWithdrawing ? 'Processing...' : button.label}
        </button>
      ))}
    </div>
  );
}

function WalletConnectionWarning() {
  return (
    <div className="mt-4 bg-yellow-500/20 p-3 rounded-lg border border-yellow-500/30">
      <div className="flex items-center gap-2 text-yellow-300">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm">Connect your wallet to withdraw funds from the contract.</span>
      </div>
    </div>
  );
}

export default IntegratedAdminDashboard;
