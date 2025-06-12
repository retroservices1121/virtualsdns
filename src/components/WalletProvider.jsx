import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain, useBalance } from 'wagmi';
import { 
  Wallet, 
  ChevronDown, 
  ExternalLink, 
  AlertCircle, 
  Copy, 
  CheckCircle, 
  Wifi, 
  WifiOff,
  Zap,
  Shield,
  Smartphone,
  Globe
} from 'lucide-react';
import { wagmiConfig, supportedChains, getContractAddress } from './walletconnect-config';
import { formatAddress, copyToClipboard, formatTokenAmount, getStoredData, setStoredData } from './utils/helpers';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const BASE_MAINNET_CHAIN_ID = 8453;
const BASE_SEPOLIA_CHAIN_ID = 84532;

// Enhanced query client with better caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      cacheTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true
    },
    mutations: {
      retry: 1
    }
  }
});

// Enhanced wallet information with better categorization
const WALLET_INFO = {
  'coinbaseWalletSDK': {
    name: 'Coinbase Wallet',
    description: 'Recommended for Base network',
    icon: '🔵',
    category: 'recommended',
    features: ['Smart Wallet', 'Base Native', 'Mobile App'],
    downloadUrl: 'https://www.coinbase.com/wallet'
  },
  'metaMask': {
    name: 'MetaMask',
    description: 'Most popular Web3 wallet',
    icon: '🦊',
    category: 'popular',
    features: ['Browser Extension', 'Mobile App', 'Hardware Support'],
    downloadUrl: 'https://metamask.io'
  },
  'walletConnect': {
    name: 'WalletConnect',
    description: 'Connect with 300+ wallets',
    icon: '🔗',
    category: 'universal',
    features: ['Mobile Wallets', 'Hardware Wallets', 'DeFi Wallets'],
    downloadUrl: null
  },
  'safe': {
    name: 'Safe Wallet',
    description: 'Multi-signature security',
    icon: '🛡️',
    category: 'enterprise',
    features: ['Multi-Sig', 'Enterprise', 'Team Management'],
    downloadUrl: 'https://safe.global'
  },
  'injected': {
    name: 'Browser Wallet',
    description: 'Use detected browser wallet',
    icon: '🌐',
    category: 'other',
    features: ['Browser Based', 'Quick Connect'],
    downloadUrl: null
  }
};

const SIZE_CLASSES = {
  small: 'px-3 py-2 text-sm',
  default: 'px-4 py-2',
  large: 'px-6 py-3 text-lg'
};

const CONNECTION_STORAGE_KEY = 'virtualsdns_wallet_preference';
const MODAL_ANIMATION_DURATION = 200;

// ============================================================================
// CONTEXT & PROVIDERS
// ============================================================================

const WalletContext = createContext();

export function WalletProvider({ children }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <WalletContextProvider>
          {children}
        </WalletContextProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

function WalletContextProvider({ children }) {
  const { address, isConnected, connector, status } = useAccount();
  const { connect, connectors, isPending, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  
  // Enhanced state management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [isAutoConnecting, setIsAutoConnecting] = useState(false);
  const [lastConnectedWallet, setLastConnectedWallet] = useState(null);
  const [connectionHistory, setConnectionHistory] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Get user's ETH balance
  const { data: balance } = useBalance({
    address,
    enabled: !!address && isConnected
  });

  // Network and chain information
  const isCorrectNetwork = chainId === BASE_MAINNET_CHAIN_ID || chainId === BASE_SEPOLIA_CHAIN_ID;
  const currentChain = supportedChains[chainId];
  const isMainnet = chainId === BASE_MAINNET_CHAIN_ID;
  const isTestnet = chainId === BASE_SEPOLIA_CHAIN_ID;

  // Get contract addresses for current chain
  const contracts = useMemo(() => {
    if (!chainId) return null;
    return {
      registry: getContractAddress(chainId, 'registry'),
      usdc: getContractAddress(chainId, 'usdc'),
      virtual: getContractAddress(chainId, 'virtual')
    };
  }, [chainId]);

  // Enhanced connection error handling
  useEffect(() => {
    if (connectError) {
      console.error('Wallet connection error:', connectError);
      setConnectionError(connectError.message);
    }
  }, [connectError]);

  // Auto-reconnection logic
  useEffect(() => {
    const savedWallet = getStoredData(CONNECTION_STORAGE_KEY);
    if (savedWallet && !isConnected && !isAutoConnecting) {
      setIsAutoConnecting(true);
      const savedConnector = connectors.find(c => c.id === savedWallet.id);
      if (savedConnector) {
        connect({ connector: savedConnector })
          .catch(error => {
            console.warn('Auto-reconnection failed:', error);
          })
          .finally(() => {
            setIsAutoConnecting(false);
          });
      } else {
        setIsAutoConnecting(false);
      }
    }
  }, [connectors, connect, isConnected, isAutoConnecting]);

  // Save wallet preference when connected
  useEffect(() => {
    if (isConnected && connector) {
      const walletData = {
        id: connector.id,
        name: connector.name,
        connectedAt: Date.now()
      };
      setStoredData(CONNECTION_STORAGE_KEY, walletData);
      setLastConnectedWallet(walletData);
      
      // Update connection history
      setConnectionHistory(prev => {
        const newHistory = [walletData, ...prev.filter(w => w.id !== connector.id)];
        return newHistory.slice(0, 5); // Keep last 5 connections
      });
    }
  }, [isConnected, connector]);

  // Auto-switch to correct network
  useEffect(() => {
    if (isConnected && !isCorrectNetwork && switchChain && !isSwitchingChain) {
      const targetChain = process.env.NODE_ENV === 'development' ? BASE_SEPOLIA_CHAIN_ID : BASE_MAINNET_CHAIN_ID;
      switchChain({ chainId: targetChain })
        .catch(error => {
          console.warn('Auto network switch failed:', error);
        });
    }
  }, [isConnected, isCorrectNetwork, switchChain, isSwitchingChain]);

  // Enhanced connect function with error handling
  const enhancedConnect = useCallback(async (connector) => {
    try {
      setConnectionError(null);
      await connect({ connector });
      setIsModalOpen(false);
      
      // Track successful connection
      if (window.gtag) {
        window.gtag('event', 'wallet_connect', {
          wallet_type: connector.name,
          chain_id: chainId
        });
      }
    } catch (error) {
      console.error('Connection failed:', error);
      const userFriendlyError = getUserFriendlyError(error);
      setConnectionError(userFriendlyError);
      
      // Track connection failure
      if (window.gtag) {
        window.gtag('event', 'wallet_connect_failed', {
          wallet_type: connector.name,
          error: userFriendlyError
        });
      }
    }
  }, [connect, chainId]);

  // Enhanced disconnect function
  const enhancedDisconnect = useCallback(() => {
    try {
      disconnect();
      setStoredData(CONNECTION_STORAGE_KEY, null);
      setLastConnectedWallet(null);
      setIsDropdownOpen(false);
      setConnectionError(null);
      
      // Track disconnection
      if (window.gtag) {
        window.gtag('event', 'wallet_disconnect', {
          wallet_type: connector?.name
        });
      }
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  }, [disconnect, connector]);

  // Enhanced network switching
  const enhancedSwitchChain = useCallback(async (targetChainId) => {
    if (!switchChain) return false;
    
    try {
      await switchChain({ chainId: targetChainId });
      
      // Track network switch
      if (window.gtag) {
        window.gtag('event', 'network_switch', {
          from_chain: chainId,
          to_chain: targetChainId
        });
      }
      
      return true;
    } catch (error) {
      console.error('Network switch failed:', error);
      setConnectionError(`Failed to switch network: ${error.message}`);
      return false;
    }
  }, [switchChain, chainId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.wallet-dropdown')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const contextValue = {
    // Account info
    address,
    isConnected,
    connector,
    status,
    balance,
    
    // Network info
    chainId,
    currentChain,
    isCorrectNetwork,
    isMainnet,
    isTestnet,
    contracts,
    
    // Connection state
    connectionError,
    isAutoConnecting,
    lastConnectedWallet,
    connectionHistory,
    
    // Modal state
    isModalOpen,
    setIsModalOpen,
    isDropdownOpen,
    setIsDropdownOpen,
    
    // Actions
    connect: enhancedConnect,
    disconnect: enhancedDisconnect,
    switchChain: enhancedSwitchChain,
    
    // Connector info
    connectors,
    isPending,
    isSwitchingChain,
    
    // Utilities
    setConnectionError,
    clearError: () => setConnectionError(null)
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getUserFriendlyError(error) {
  const message = error.message || error.toString();
  
  if (message.includes('User rejected')) {
    return 'Connection cancelled by user';
  }
  if (message.includes('No provider')) {
    return 'Wallet not found. Please install the wallet extension.';
  }
  if (message.includes('Chain not configured')) {
    return 'Base network not configured in wallet. We\'ll help you add it.';
  }
  if (message.includes('Connector not found')) {
    return 'Wallet connector not available. Please try a different wallet.';
  }
  
  return message.length > 100 ? 'Connection failed. Please try again.' : message;
}

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

// Hook for wallet connection status
export function useWalletStatus() {
  const { isConnected, isCorrectNetwork, isAutoConnecting, isPending } = useWallet();
  
  const status = useMemo(() => {
    if (isAutoConnecting || isPending) return 'connecting';
    if (!isConnected) return 'disconnected';
    if (!isCorrectNetwork) return 'wrong-network';
    return 'connected';
  }, [isConnected, isCorrectNetwork, isAutoConnecting, isPending]);
  
  return { status, isReady: status === 'connected' };
}

// ============================================================================
// COMPONENTS
// ============================================================================

export function WalletConnectButton({ className = '', size = 'default', showBalance = false }) {
  const { 
    address, 
    isConnected, 
    connector, 
    isCorrectNetwork,
    balance,
    disconnect, 
    isDropdownOpen,
    setIsDropdownOpen,
    setIsModalOpen,
    isAutoConnecting,
    isPending
  } = useWallet();

  const isLoading = isAutoConnecting || isPending;

  if (isConnected) {
    return (
      <ConnectedWalletDropdown 
        className={className}
        size={size}
        address={address}
        connector={connector}
        isCorrectNetwork={isCorrectNetwork}
        balance={balance}
        showBalance={showBalance}
        disconnect={disconnect}
        isDropdownOpen={isDropdownOpen}
        setIsDropdownOpen={setIsDropdownOpen}
      />
    );
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={isLoading}
        className={`bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${SIZE_CLASSES[size]} ${className} ${isLoading ? 'cursor-not-allowed' : ''}`}
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="w-4 h-4" />
            Connect Wallet
          </>
        )}
      </button>
      
      <WalletModal />
    </>
  );
}

function ConnectedWalletDropdown({ 
  className, 
  size, 
  address, 
  connector, 
  isCorrectNetwork,
  balance,
  showBalance,
  disconnect, 
  isDropdownOpen,
  setIsDropdownOpen
}) {
  const balanceDisplay = balance ? formatTokenAmount(balance.value, balance.decimals, balance.symbol) : '0 ETH';
  
  return (
    <div className={`relative wallet-dropdown ${className}`}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`${isCorrectNetwork ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'} text-white rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${SIZE_CLASSES[size]}`}
      >
        <div className={`w-2 h-2 ${isCorrectNetwork ? 'bg-green-300' : 'bg-yellow-300'} rounded-full animate-pulse`} />
        <div className="flex flex-col items-start">
          <span className="text-sm">
            {formatAddress(address)}
          </span>
          {showBalance && (
            <span className="text-xs opacity-80">
              {balanceDisplay}
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isDropdownOpen && (
        <WalletDropdownMenu 
          address={address}
          connector={connector}
          isCorrectNetwork={isCorrectNetwork}
          balance={balance}
          disconnect={disconnect}
          setIsDropdownOpen={setIsDropdownOpen}
        />
      )}
    </div>
  );
}

function WalletDropdownMenu({ address, connector, isCorrectNetwork, balance, disconnect, setIsDropdownOpen }) {
  const { switchChain, currentChain, contracts } = useWallet();
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    const success = await copyToClipboard(address);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSwitchNetwork = () => {
    switchChain(BASE_MAINNET_CHAIN_ID);
  };

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-600 p-4 text-white">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold opacity-90">Connected Wallet</span>
          <button
            onClick={() => setIsDropdownOpen(false)}
            className="text-white/80 hover:text-white text-xl"
          >
            ×
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold">{connector?.name}</div>
            <div className="text-sm opacity-90">{currentChain?.name}</div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Address and Balance */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Address</span>
            <button
              onClick={handleCopyAddress}
              className="flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
            >
              {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="font-mono text-sm bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
            {address}
          </div>
          
          {balance && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Balance</span>
              <span className="font-semibold">
                {formatTokenAmount(balance.value, balance.decimals, balance.symbol)}
              </span>
            </div>
          )}
        </div>
        
        {/* Network Status */}
        {!isCorrectNetwork && (
          <NetworkWarning onSwitchNetwork={handleSwitchNetwork} />
        )}
        
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <a
            href={`https://basescan.org/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Explorer
          </a>
          
          <button
            onClick={() => {
              disconnect();
              setIsDropdownOpen(false);
            }}
            className="flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-300 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <WifiOff className="w-4 h-4" />
            Disconnect
          </button>
        </div>
        
        {/* Contract Info */}
        {contracts && (
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <div>Registry: {formatAddress(contracts.registry)}</div>
            <div>USDC: {formatAddress(contracts.usdc)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function NetworkWarning({ onSwitchNetwork }) {
  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
      <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300 mb-2">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm font-semibold">Wrong Network</span>
      </div>
      <p className="text-xs text-yellow-700 dark:text-yellow-400 mb-3">
        VirtualsBase works on Base network. Switch to continue using the app.
      </p>
      <button
        onClick={onSwitchNetwork}
        className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        Switch to Base Network
      </button>
    </div>
  );
}

function WalletModal() {
  const { 
    connect, 
    connectors, 
    isPending, 
    isModalOpen, 
    setIsModalOpen,
    connectionError,
    setConnectionError,
    connectionHistory
  } = useWallet();

  if (!isModalOpen) return null;

  const handleConnect = async (connector) => {
    await connect(connector);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setConnectionError(null);
  };

  // Group connectors by category
  const groupedConnectors = useMemo(() => {
    const groups = {
      recommended: [],
      popular: [],
      universal: [],
      enterprise: [],
      other: []
    };

    connectors.forEach(connector => {
      const info = WALLET_INFO[connector.id] || WALLET_INFO['injected'];
      groups[info.category].push({ connector, info });
    });

    return groups;
  }, [connectors]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[85vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold">Connect Your Wallet</h2>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white text-2xl transition-colors"
            >
              ×
            </button>
          </div>
          <p className="text-sm opacity-90">
            Choose your preferred wallet to start using VirtualsBase
          </p>
        </div>
        
        <div className="p-6 max-h-[calc(85vh-120px)] overflow-y-auto">
          {/* Error Message */}
          {connectionError && (
            <ErrorMessage error={connectionError} onDismiss={() => setConnectionError(null)} />
          )}
          
          {/* Recent Connections */}
          {connectionHistory.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Recent Connections
              </h3>
              <div className="space-y-2">
                {connectionHistory.slice(0, 2).map((wallet) => {
                  const connector = connectors.find(c => c.id === wallet.id);
                  if (!connector) return null;
                  
                  return (
                    <WalletOption 
                      key={`recent-${wallet.id}`}
                      connector={connector}
                      onConnect={handleConnect}
                      isPending={isPending}
                      isRecent
                    />
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Wallet Categories */}
          {Object.entries(groupedConnectors).map(([category, wallets]) => {
            if (wallets.length === 0) return null;
            
            return (
              <div key={category} className="mb-6 last:mb-0">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 capitalize">
                  {category === 'recommended' ? '⭐ Recommended' : 
                   category === 'popular' ? '🔥 Popular' :
                   category === 'universal' ? '🌐 Universal' :
                   category === 'enterprise' ? '🏢 Enterprise' : '📱 Other'} Wallets
                </h3>
                <div className="space-y-3">
                  {wallets.map(({ connector, info }) => (
                    <WalletOption 
                      key={connector.uid}
                      connector={connector}
                      info={info}
                      onConnect={handleConnect}
                      isPending={isPending}
                    />
                  ))}
                </div>
              </div>
            );
          })}
          
          {/* Network Information */}
          <NetworkInfo />
        </div>
      </div>
    </div>
  );
}

function ErrorMessage({ error, onDismiss }) {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <div>
            <span className="text-sm font-semibold text-red-800 dark:text-red-300 block">
              Connection Failed
            </span>
            <p className="text-xs text-red-700 dark:text-red-400 mt-1">
              {error}
            </p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-red-400 hover:text-red-600 dark:hover:text-red-300 ml-2"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function WalletOption({ connector, info, onConnect, isPending, isRecent = false }) {
  const walletInfo = info || WALLET_INFO[connector.id] || WALLET_INFO['injected'];
  
  return (
    <button
      onClick={() => onConnect(connector)}
      disabled={isPending}
      className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
    >
      <div className="flex items-center gap-4">
        <div className="text-2xl">{walletInfo.icon}</div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900 dark:text-white">
              {walletInfo.name}
            </span>
            {isRecent && (
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full font-medium">
                Recent
              </span>
            )}
            {walletInfo.category === 'recommended' && (
              <span className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs px-2 py-0.5 rounded-full font-medium">
                ⭐ Best
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            {walletInfo.description}
          </p>
          {walletInfo.features && (
            <div className="flex flex-wrap gap-1">
              {walletInfo.features.slice(0, 3).map((feature, index) => (
                <span key={index} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                  {feature}
                </span>
              ))}
            </div>
          )}
        </div>
        {isPending ? (
          <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
        ) : (
          <div className="text-purple-600 dark:text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
            →
          </div>
        )}
      </div>
    </button>
  );
}

function NetworkInfo() {
  return (
    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
      <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 mb-2">
        <Shield className="w-4 h-4" />
        <span className="text-sm font-semibold">Secure & Fast</span>
      </div>
      <p className="text-xs text-blue-700 dark:text-blue-400 mb-3">
        VirtualsBase operates on Base network - Ethereum's L2 solution with low fees and fast transactions.
      </p>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="text-center">
          <Zap className="w-4 h-4 mx-auto text-yellow-500 mb-1" />
          <span className="text-blue-700 dark:text-blue-400">Fast</span>
        </div>
        <div className="text-center">
          <Shield className="w-4 h-4 mx-auto text-green-500 mb-1" />
          <span className="text-blue-700 dark:text-blue-400">Secure</span>
        </div>
        <div className="text-center">
          <Globe className="w-4 h-4 mx-auto text-blue-500 mb-1" />
          <span className="text-blue-700 dark:text-blue-400">Global</span>
        </div>
      </div>
    </div>
  );
}

export function NetworkStatus() {
  const { isConnected, isCorrectNetwork, currentChain, switchChain, isSwitchingChain } = useWallet();
  
  if (!isConnected) return null;
  
  if (!isCorrectNetwork) {
    return (
      <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <span className="text-yellow-300 text-sm font-semibold block">
                Network Mismatch
              </span>
              <span className="text-yellow-200 text-xs">
                Switch to Base network to continue
              </span>
            </div>
          </div>
          <button
            onClick={() => switchChain(BASE_MAINNET_CHAIN_ID)}
            disabled={isSwitchingChain}
            className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            {isSwitchingChain ? (
              <>
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                Switching...
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4" />
                Switch Network
              </>
            )}
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 mb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
        </div>
        <div>
          <span className="text-green-300 text-sm font-semibold block">
            Connected to {currentChain?.name}
          </span>
          <span className="text-green-200 text-xs">
            Ready for domain registration
          </span>
        </div>
      </div>
    </div>
  );
}

// Connection status indicator component
export function ConnectionIndicator() {
  const { status } = useWalletStatus();
  
  const statusConfig = {
    connected: { color: 'green', icon: Wifi, text: 'Connected' },
    connecting: { color: 'yellow', icon: Wifi, text: 'Connecting...' },
    'wrong-network': { color: 'yellow', icon: AlertCircle, text: 'Wrong Network' },
    disconnected: { color: 'gray', icon: WifiOff, text: 'Disconnected' }
  };
  
  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <div className={`flex items-center gap-2 text-${config.color}-400`}>
      <Icon className="w-4 h-4" />
      <span className="text-sm">{config.text}</span>
    </div>
  );
}

export default WalletProvider;
