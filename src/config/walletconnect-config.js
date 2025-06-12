// walletconnect-config.js - Enhanced Wallet Configuration for VirtualsBase
import { createConfig, http, fallback, unstable_connector } from 'wagmi';
import { base, baseSepolia, localhost } from 'wagmi/chains';
import { 
  coinbaseWallet, 
  walletConnect, 
  metaMask, 
  injected,
  safe
} from 'wagmi/connectors';
import { createPublicClient, createWalletClient } from 'viem';

// ===== CONFIGURATION CONSTANTS =====

// WalletConnect Project ID - Get this from https://cloud.walletconnect.com
const WALLETCONNECT_PROJECT_ID = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || 'your_project_id_here';

// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development';
const isTestnet = process.env.REACT_APP_NETWORK === 'testnet';

// App metadata for wallet connections
const metadata = {
  name: 'VirtualsBase',
  description: 'AI Agent Domain Names with Smart Pricing - Register .virtuals.base domains',
  url: process.env.REACT_APP_APP_URL || 'https://virtualsdns.fun',
  icons: [
    `${process.env.REACT_APP_APP_URL || 'https://virtualsdns.fun'}/icon-192x192.png`,
    `${process.env.REACT_APP_APP_URL || 'https://virtualsdns.fun'}/icon-512x512.png`
  ],
  verifyUrl: `${process.env.REACT_APP_APP_URL || 'https://virtualsdns.fun'}/verify`
};

// ===== RPC CONFIGURATION =====

// Multiple RPC endpoints for redundancy
const baseRpcUrls = [
  'https://mainnet.base.org',
  'https://base-mainnet.public.blastapi.io',
  'https://base.gateway.tenderly.co',
  ...(process.env.REACT_APP_ALCHEMY_KEY ? [`https://base-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_KEY}`] : []),
  ...(process.env.REACT_APP_INFURA_KEY ? [`https://base-mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`] : [])
];

const baseSepoliaRpcUrls = [
  'https://sepolia.base.org',
  'https://base-sepolia.public.blastapi.io',
  ...(process.env.REACT_APP_ALCHEMY_KEY ? [`https://base-sepolia.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_KEY}`] : []),
  ...(process.env.REACT_APP_INFURA_KEY ? [`https://base-sepolia.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`] : [])
];

// ===== WALLET CONNECTORS =====

// Enhanced WalletConnect configuration
const walletConnectConfig = walletConnect({
  projectId: WALLETCONNECT_PROJECT_ID,
  metadata,
  showQrModal: true,
  qrModalOptions: {
    themeMode: 'dark',
    themeVariables: {
      '--wcm-z-index': '2000',
      '--wcm-accent-color': '#8b5cf6',
      '--wcm-background-color': '#1f2937',
      '--wcm-background-border-radius': '12px',
      '--wcm-container-border-radius': '24px',
      '--wcm-wallet-icon-border-radius': '12px',
      '--wcm-button-border-radius': '8px',
      '--wcm-secondary-button-border-radius': '8px',
      '--wcm-icon-highlight-border-radius': '8px',
      '--wcm-button-hover-highlight-border-radius': '8px',
      '--wcm-text-big-bold-size': '20px',
      '--wcm-text-medium-regular-size': '16px',
      '--wcm-text-small-regular-size': '14px',
      '--wcm-text-xsmall-regular-size': '12px'
    },
    enableAccountView: true,
    enableExplorer: true,
    explorerRecommendedWalletIds: [
      'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
      'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase
      '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
      '38f5d18bd8522c244bdd70cb4a68e0e718865155811c043f052fb9f1c51de662', // Bitget
      'c03dfee351b6fcc421b4494ea33b9d4b92a984f87aa76d1663bb28705e95034a'  // Uniswap
    ],
    explorerExcludedWalletIds: 'ALL'
  }
});

// Enhanced Coinbase Wallet configuration
const coinbaseConfig = coinbaseWallet({
  appName: metadata.name,
  appLogoUrl: metadata.icons[0],
  darkMode: true,
  preference: 'smartWalletOnly',
  version: '4',
  headlessMode: false,
  enableMobileWalletLink: true
});

// Enhanced MetaMask configuration
const metaMaskConfig = metaMask({
  dappMetadata: metadata,
  infuraAPIKey: process.env.REACT_APP_INFURA_KEY,
  extensionOnly: false,
  preferDesktop: true,
  shimDisconnect: true
});

// Safe Wallet support for organizations
const safeConfig = safe({
  allowedDomains: [
    /gnosis-safe\.io$/,
    /app\.safe\.global$/,
    /safe\.global$/
  ],
  debug: isDevelopment
});

// Injected wallet for other browser wallets
const injectedConfig = injected({
  target() {
    return {
      id: 'injected',
      name: 'Browser Wallet',
      provider(window) {
        return window?.ethereum;
      }
    };
  }
});

// Configure supported wallets in priority order
const connectors = [
  // Primary wallets for Base ecosystem
  coinbaseConfig,
  metaMaskConfig,
  
  // WalletConnect for mobile and other wallets
  walletConnectConfig,
  
  // Safe wallet for organizations
  safeConfig,
  
  // Fallback for other injected wallets
  injectedConfig
];

// ===== CHAIN CONFIGURATION =====

// Enhanced Base mainnet configuration
const enhancedBase = {
  ...base,
  name: 'Base',
  nativeCurrency: { 
    name: 'Ethereum', 
    symbol: 'ETH', 
    decimals: 18 
  },
  rpcUrls: {
    default: { http: baseRpcUrls },
    public: { http: baseRpcUrls }
  },
  blockExplorers: {
    default: { 
      name: 'BaseScan', 
      url: 'https://basescan.org',
      apiUrl: 'https://api.basescan.org/api'
    },
    basescan: { 
      name: 'BaseScan', 
      url: 'https://basescan.org',
      apiUrl: 'https://api.basescan.org/api'
    }
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 5022
    }
  }
};

// Enhanced Base Sepolia configuration
const enhancedBaseSepolia = {
  ...baseSepolia,
  name: 'Base Sepolia',
  nativeCurrency: { 
    name: 'Ethereum', 
    symbol: 'ETH', 
    decimals: 18 
  },
  rpcUrls: {
    default: { http: baseSepoliaRpcUrls },
    public: { http: baseSepoliaRpcUrls }
  },
  blockExplorers: {
    default: { 
      name: 'BaseScan', 
      url: 'https://sepolia.basescan.org',
      apiUrl: 'https://api-sepolia.basescan.org/api'
    },
    basescan: { 
      name: 'BaseScan', 
      url: 'https://sepolia.basescan.org',
      apiUrl: 'https://api-sepolia.basescan.org/api'
    }
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 1059647
    }
  },
  testnet: true
};

// Configure chains based on environment
const chains = isDevelopment ? 
  [enhancedBase, enhancedBaseSepolia, localhost] : 
  [enhancedBase, ...(isTestnet ? [enhancedBaseSepolia] : [])];

// ===== TRANSPORT CONFIGURATION =====

// Configure transports with fallback and retry logic
const transports = {
  [base.id]: fallback([
    ...baseRpcUrls.map(url => http(url, {
      batch: true,
      fetchOptions: {
        keepalive: true,
        cache: 'no-cache'
      },
      retryCount: 3,
      retryDelay: 1000,
      timeout: 10000
    }))
  ]),
  [baseSepolia.id]: fallback([
    ...baseSepoliaRpcUrls.map(url => http(url, {
      batch: true,
      fetchOptions: {
        keepalive: true,
        cache: 'no-cache'
      },
      retryCount: 3,
      retryDelay: 1000,
      timeout: 10000
    }))
  ]),
  ...(isDevelopment ? {
    [localhost.id]: http('http://127.0.0.1:8545', {
      batch: true,
      timeout: 5000
    })
  } : {})
};

// ===== WAGMI CONFIGURATION =====

// Create main wagmi config
export const wagmiConfig = createConfig({
  chains,
  connectors,
  transports,
  ssr: false,
  syncConnectedChain: true,
  batch: {
    multicall: {
      batchSize: 2048,
      wait: 16
    }
  },
  cacheTime: 30_000, // 30 seconds
  pollingInterval: 12_000 // 12 seconds (Base block time)
});

// ===== CLIENT CONFIGURATION =====

// Enhanced public client with fallback
export const publicClient = createPublicClient({
  chain: enhancedBase,
  transport: fallback([
    ...baseRpcUrls.map(url => http(url, {
      batch: true,
      fetchOptions: {
        keepalive: true
      },
      retryCount: 3,
      retryDelay: 1000,
      timeout: 10000
    }))
  ]),
  batch: {
    multicall: {
      batchSize: 2048,
      wait: 16
    }
  },
  cacheTime: 30_000,
  pollingInterval: 12_000
});

// Testnet public client
export const testnetPublicClient = createPublicClient({
  chain: enhancedBaseSepolia,
  transport: fallback([
    ...baseSepoliaRpcUrls.map(url => http(url, {
      batch: true,
      retryCount: 3,
      timeout: 10000
    }))
  ]),
  batch: {
    multicall: true
  },
  cacheTime: 30_000,
  pollingInterval: 12_000
});

// ===== CONTRACT ADDRESSES =====

// Contract addresses for each network
export const contractAddresses = {
  [base.id]: {
    registry: process.env.REACT_APP_REGISTRY_ADDRESS,
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
    virtual: '0x0b3e328455c4059eeb9e3f84b5543f74e24e7e1b', // VIRTUAL on Base
    multicall: '0xca11bde05977b3631167028862be2a173976ca11'
  },
  [baseSepolia.id]: {
    registry: process.env.REACT_APP_REGISTRY_ADDRESS_TESTNET,
    usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // USDC on Base Sepolia
    virtual: process.env.REACT_APP_VIRTUAL_ADDRESS_TESTNET || '0x...', // VIRTUAL testnet
    multicall: '0xca11bde05977b3631167028862be2a173976ca11'
  },
  ...(isDevelopment ? {
    [localhost.id]: {
      registry: process.env.REACT_APP_REGISTRY_ADDRESS_LOCAL,
      usdc: process.env.REACT_APP_USDC_ADDRESS_LOCAL,
      virtual: process.env.REACT_APP_VIRTUAL_ADDRESS_LOCAL,
      multicall: '0xca11bde05977b3631167028862be2a173976ca11'
    }
  } : {})
};

// ===== SUPPORTED CHAINS CONFIGURATION =====

export const supportedChains = {
  [base.id]: {
    name: 'Base',
    shortName: 'Base',
    chainId: base.id,
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    rpcUrls: baseRpcUrls,
    blockExplorers: [
      { name: 'BaseScan', url: 'https://basescan.org' }
    ],
    contracts: contractAddresses[base.id],
    isTestnet: false,
    faucetUrl: null,
    gasPrice: {
      standard: 1000000000, // 1 gwei
      fast: 2000000000,     // 2 gwei
      instant: 3000000000   // 3 gwei
    }
  },
  [baseSepolia.id]: {
    name: 'Base Sepolia',
    shortName: 'Base Testnet',
    chainId: baseSepolia.id,
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    rpcUrls: baseSepoliaRpcUrls,
    blockExplorers: [
      { name: 'BaseScan', url: 'https://sepolia.basescan.org' }
    ],
    contracts: contractAddresses[baseSepolia.id],
    isTestnet: true,
    faucetUrl: 'https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet',
    gasPrice: {
      standard: 1000000000, // 1 gwei
      fast: 1500000000,     // 1.5 gwei
      instant: 2000000000   // 2 gwei
    }
  }
};

// ===== UTILITY FUNCTIONS =====

// Get current chain configuration
export const getCurrentChain = (chainId) => {
  return supportedChains[chainId] || null;
};

// Get contract address for current chain
export const getContractAddress = (chainId, contractName) => {
  const chain = getCurrentChain(chainId);
  return chain?.contracts?.[contractName] || null;
};

// Check if chain is supported
export const isSupportedChain = (chainId) => {
  return !!supportedChains[chainId];
};

// Get appropriate public client for chain
export const getPublicClient = (chainId) => {
  if (chainId === baseSepolia.id) {
    return testnetPublicClient;
  }
  return publicClient;
};

// Get chain-specific gas configuration
export const getGasConfig = (chainId, speed = 'standard') => {
  const chain = getCurrentChain(chainId);
  return chain?.gasPrice?.[speed] || 1000000000; // Default 1 gwei
};

// ===== CONNECTION UTILITIES =====

// Connector priority for auto-connection
export const connectorPriority = [
  'coinbaseWalletSDK',
  'metaMask',
  'walletConnect',
  'safe',
  'injected'
];

// Get connector by ID
export const getConnectorById = (id) => {
  return connectors.find(connector => connector.id === id);
};

// Check if connector is available
export const isConnectorAvailable = (id) => {
  const connector = getConnectorById(id);
  return connector ? connector.ready : false;
};

// ===== ENVIRONMENT VALIDATION =====

// Validate configuration
export const validateConfig = () => {
  const warnings = [];
  const errors = [];

  // Check WalletConnect project ID
  if (!WALLETCONNECT_PROJECT_ID || WALLETCONNECT_PROJECT_ID === 'your_project_id_here') {
    warnings.push('WalletConnect Project ID not configured. Get one from https://cloud.walletconnect.com');
  }

  // Check contract addresses
  if (!contractAddresses[base.id].registry) {
    errors.push('Registry contract address not configured for mainnet');
  }

  // Check RPC configuration
  if (baseRpcUrls.length === 1) {
    warnings.push('Only one RPC endpoint configured. Consider adding backup RPCs for better reliability.');
  }

  return { warnings, errors };
};

// Validate on import (development only)
if (isDevelopment) {
  const { warnings, errors } = validateConfig();
  
  if (errors.length > 0) {
    console.error('❌ Wallet configuration errors:', errors);
  }
  
  if (warnings.length > 0) {
    console.warn('⚠️ Wallet configuration warnings:', warnings);
  }
}

// ===== EXPORTS =====

export default wagmiConfig;

// Named exports for convenience
export {
  enhancedBase as baseChain,
  enhancedBaseSepolia as baseSepoliaChain,
  metadata as appMetadata,
  connectors as walletConnectors,
  chains as supportedChainList
};
