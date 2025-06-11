import React, { createContext, useContext, useEffect, useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { Wallet, ChevronDown, ExternalLink, AlertCircle } from 'lucide-react';
import { wagmiConfig, supportedChains } from './walletconnect-config';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const BASE_MAINNET_CHAIN_ID = 8453;
const BASE_SEPOLIA_CHAIN_ID = 84532;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 3
    }
  }
});

const WALLET_INFO = {
  'WalletConnect': {
    description: 'Connect with 300+ wallets',
    icon: '🔗',
    popular: true
  },
  'Coinbase Wallet': {
    description: 'Recommended for Base network',
    icon: '🔵',
    popular: true
  },
  'MetaMask': {
    description: 'Popular browser extension',
    icon: '🦊',
    popular: true
  },
  'Injected': {
    description: 'Use browser wallet',
    icon: '🌐',
    popular: false
  }
};

const SIZE_CLASSES = {
  small: 'px-3 py-2 text-sm',
  default: 'px-4 py-2',
  large: 'px-6 py-3 text-lg'
};

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
  const { address, isConnected, connector } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  // Check if user is on correct network
  const isCorrectNetwork = chainId === BASE_MAINNET_CHAIN_ID || chainId === BASE_SEPOLIA_CHAIN_ID;
  const currentChain = supportedChains[chainId];

  // Handle connection errors
  useEffect(() => {
    if (connector) {
      const handleError = (error) => {
        console.error('Wallet connection error:', error);
        setConnectionError(error.message);
      };
      
      connector.on?.('error', handleError);
      return () => connector.off?.('error', handleError);
    }
  }, [connector]);

  // Auto-switch to Base network if connected to wrong network
  useEffect(() => {
    if (isConnected && !isCorrectNetwork && switchChain) {
      switchChain({ chainId: BASE_MAINNET_CHAIN_ID });
    }
  }, [isConnected, isCorrectNetwork, switchChain]);

  const contextValue = {
    address,
    isConnected,
    connector,
    chainId,
    currentChain,
    isCorrectNetwork,
    connectionError,
    connect,
    disconnect,
    switchChain,
    connectors,
    isPending,
    isModalOpen,
    setIsModalOpen,
    setConnectionError
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
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

// ============================================================================
// COMPONENTS
// ============================================================================

export function WalletConnectButton({ className = '', size = 'default' }) {
  const { 
    address, 
    isConnected, 
    connector, 
    isCorrectNetwork,
    disconnect, 
    isModalOpen, 
    setIsModalOpen,
    connectionError,
    setConnectionError
  } = useWallet();

  if (isConnected) {
    return (
      <ConnectedWalletDropdown 
        className={className}
        size={size}
        address={address}
        connector={connector}
        isCorrectNetwork={isCorrectNetwork}
        disconnect={disconnect}
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
      />
    );
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2 ${SIZE_CLASSES[size]} ${className}`}
      >
        <Wallet className="w-4 h-4" />
        Connect Wallet
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
  disconnect, 
  isModalOpen, 
  setIsModalOpen 
}) {
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsModalOpen(!isModalOpen)}
        className={`bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2 ${SIZE_CLASSES[size]}`}
      >
        <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
        {address?.slice(0, 6)}...{address?.slice(-4)}
        <ChevronDown className="w-4 h-4" />
      </button>
      
      {isModalOpen && (
        <WalletDropdownMenu 
          address={address}
          connector={connector}
          isCorrectNetwork={isCorrectNetwork}
          disconnect={disconnect}
          setIsModalOpen={setIsModalOpen}
        />
      )}
    </div>
  );
}

function WalletDropdownMenu({ address, connector, isCorrectNetwork, disconnect, setIsModalOpen }) {
  return (
    <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Connected Wallet
          </span>
          <button
            onClick={() => setIsModalOpen(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-3">
          {/* Wallet Info */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <Wallet className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {connector?.name}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                {address?.slice(0, 12)}...{address?.slice(-12)}
              </div>
            </div>
          </div>
          
          {/* Network Warning */}
          {!isCorrectNetwork && (
            <NetworkWarning />
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <a
              href={`https://basescan.org/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center gap-1"
            >
              View on BaseScan
              <ExternalLink className="w-3 h-3" />
            </a>
            
            <button
              onClick={() => {
                disconnect();
                setIsModalOpen(false);
              }}
              className="flex-1 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-300 px-3 py-2 rounded text-sm font-medium transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NetworkWarning() {
  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
      <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm font-semibold">Wrong Network</span>
      </div>
      <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
        Please switch to Base network to use VirtualsDNS
      </p>
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
    setConnectionError
  } = useWallet();

  if (!isModalOpen) return null;

  const handleConnect = async (connector) => {
    try {
      setConnectionError(null);
      await connect({ connector });
      setIsModalOpen(false);
    } catch (error) {
      console.error('Connection failed:', error);
      setConnectionError(error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          {/* Modal Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Connect Your Wallet
            </h2>
            <button
              onClick={() => {
                setIsModalOpen(false);
                setConnectionError(null);
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
            >
              ×
            </button>
          </div>
          
          {/* Description */}
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
            Choose your preferred wallet to connect to VirtualsDNS.fun and start registering .virtuals.base domains.
          </p>
          
          {/* Error Message */}
          {connectionError && (
            <ErrorMessage error={connectionError} />
          )}
          
          {/* Wallet Options */}
          <div className="space-y-3">
            {connectors.map((connector) => (
              <WalletOption 
                key={connector.uid}
                connector={connector}
                onConnect={handleConnect}
                isPending={isPending}
              />
            ))}
          </div>
          
          {/* Network Info */}
          <NetworkInfo />
        </div>
      </div>
    </div>
  );
}

function ErrorMessage({ error }) {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
      <div className="flex items-center gap-2 text-red-800 dark:text-red-300">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm font-semibold">Connection Failed</span>
      </div>
      <p className="text-xs text-red-700 dark:text-red-400 mt-1">
        {error}
      </p>
    </div>
  );
}

function WalletOption({ connector, onConnect, isPending }) {
  const info = WALLET_INFO[connector.name] || { 
    description: 'Wallet connector', 
    icon: '💼', 
    popular: false 
  };

  return (
    <button
      onClick={() => onConnect(connector)}
      disabled={isPending}
      className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-4"
    >
      <div className="text-2xl">{info.icon}</div>
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 dark:text-white">
            {connector.name}
          </span>
          {info.popular && (
            <span className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs px-2 py-0.5 rounded-full font-medium">
              Popular
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {info.description}
        </p>
      </div>
      {isPending && (
        <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
      )}
    </button>
  );
}

function NetworkInfo() {
  return (
    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
      <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 mb-2">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm font-semibold">Network Information</span>
      </div>
      <p className="text-xs text-blue-700 dark:text-blue-400">
        VirtualsDNS.fun works on Base network. If you're on a different network, we'll help you switch automatically.
      </p>
    </div>
  );
}

export function NetworkStatus() {
  const { isConnected, isCorrectNetwork, currentChain, switchChain } = useWallet();
  
  if (!isConnected) return null;
  
  if (!isCorrectNetwork) {
    return (
      <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-300 text-sm font-semibold">
              Wrong Network Detected
            </span>
          </div>
          <button
            onClick={() => switchChain?.({ chainId: BASE_MAINNET_CHAIN_ID })}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
          >
            Switch to Base
          </button>
        </div>
        <p className="text-yellow-200 text-xs mt-1">
          Please switch to Base network to use VirtualsDNS.fun
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 mb-4">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span className="text-green-300 text-sm font-semibold">
          Connected to {currentChain?.name}
        </span>
      </div>
    </div>
  );
}

export default WalletProvider;
