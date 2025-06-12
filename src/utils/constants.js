// src/utils/constants.js - Enhanced App Constants for VirtualsBase
export const CONTRACTS = {
  REGISTRY: process.env.REACT_APP_REGISTRY_ADDRESS,
  USDC: process.env.REACT_APP_USDC_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  VIRTUAL: process.env.REACT_APP_VIRTUAL_ADDRESS || '0x0b3e328455c4059eeb9e3f84b5543f74e24e7e1b',
  
  // Testnet addresses
  REGISTRY_TESTNET: process.env.REACT_APP_REGISTRY_ADDRESS_TESTNET,
  USDC_TESTNET: process.env.REACT_APP_USDC_ADDRESS_TESTNET || '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  VIRTUAL_TESTNET: process.env.REACT_APP_VIRTUAL_ADDRESS_TESTNET
};

export const NETWORKS = {
  BASE_MAINNET: {
    id: 8453,
    name: 'Base',
    shortName: 'Base',
    rpcUrl: process.env.REACT_APP_RPC_URL || 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
    currency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    iconUrl: 'https://avatars.githubusercontent.com/u/108554348?s=280&v=4',
    color: '#0052ff'
  },
  BASE_SEPOLIA: {
    id: 84532,
    name: 'Base Sepolia',
    shortName: 'Base Testnet',
    rpcUrl: process.env.REACT_APP_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org',
    currency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    iconUrl: 'https://avatars.githubusercontent.com/u/108554348?s=280&v=4',
    color: '#0052ff',
    isTestnet: true
  }
};

// Get current network based on environment
export const getCurrentNetwork = () => {
  const chainId = parseInt(process.env.REACT_APP_CHAIN_ID || '8453');
  return Object.values(NETWORKS).find(network => network.id === chainId) || NETWORKS.BASE_MAINNET;
};

// Get contracts for current network
export const getCurrentContracts = () => {
  const network = getCurrentNetwork();
  if (network.isTestnet) {
    return {
      REGISTRY: CONTRACTS.REGISTRY_TESTNET,
      USDC: CONTRACTS.USDC_TESTNET,
      VIRTUAL: CONTRACTS.VIRTUAL_TESTNET
    };
  }
  return {
    REGISTRY: CONTRACTS.REGISTRY,
    USDC: CONTRACTS.USDC,
    VIRTUAL: CONTRACTS.VIRTUAL
  };
};

export const PRICING = {
  ETH: process.env.REACT_APP_DEFAULT_ETH_PRICE || '0.001',
  USDC: process.env.REACT_APP_DEFAULT_USDC_PRICE || '5.00',
  VIRTUAL: process.env.REACT_APP_DEFAULT_VIRTUAL_PRICE || '1000',
  USD_EQUIVALENT: 5.0,
  
  // Price tier multipliers
  TIERS: {
    REGULAR: 1,
    PREMIUM: 1, // Same pricing for now since your contract uses flat pricing
    ULTRA: 1,
    LEGENDARY: 'auction'
  }
};

export const APP_CONFIG = {
  name: process.env.REACT_APP_APP_NAME || 'VirtualsBase',
  shortName: 'VirtualsBase',
  description: process.env.REACT_APP_APP_DESCRIPTION || 'AI Agent Domain Names with Smart Pricing on Base blockchain',
  url: process.env.REACT_APP_APP_URL || 'https://virtualsbase.com',
  domain: process.env.REACT_APP_DOMAIN_SUFFIX || '.virtuals.base',
  support: process.env.REACT_APP_SUPPORT_EMAIL || 'support@virtualsbase.com',
  version: process.env.REACT_APP_VERSION || '1.0.0',
  
  // SEO
  keywords: process.env.REACT_APP_APP_KEYWORDS || 'AI domains, Base blockchain, virtual agents, web3 domains',
  ogImage: process.env.REACT_APP_OG_IMAGE || 'https://virtualsbase.com/og-image.png',
  
  // Features
  features: {
    auctions: process.env.REACT_APP_ENABLE_AUCTIONS === 'true',
    transfers: process.env.REACT_APP_ENABLE_TRANSFERS !== 'false',
    textRecords: process.env.REACT_APP_ENABLE_TEXT_RECORDS !== 'false',
    subdomains: process.env.REACT_APP_ENABLE_SUBDOMAINS === 'true',
    maintenanceMode: process.env.REACT_APP_MAINTENANCE_MODE === 'true'
  },
  
  // Analytics
  analytics: {
    enabled: process.env.REACT_APP_ANALYTICS_ENABLED === 'true',
    googleAnalyticsId: process.env.REACT_APP_GOOGLE_ANALYTICS_ID,
    hotjarId: process.env.REACT_APP_HOTJAR_ID
  }
};

export const SOCIAL_LINKS = {
  twitter: process.env.REACT_APP_TWITTER_URL || 'https://twitter.com/virtualsbase',
  discord: process.env.REACT_APP_DISCORD_URL || 'https://discord.gg/virtualsbase',
  github: process.env.REACT_APP_GITHUB_URL || 'https://github.com/retroservices1121/virtualsdns',
  docs: process.env.REACT_APP_DOCS_URL || 'https://docs.virtualsbase.com',
  telegram: process.env.REACT_APP_TELEGRAM_URL,
  medium: process.env.REACT_APP_MEDIUM_URL
};

export const PAYMENT_METHODS = {
  ETH: {
    id: 0,
    name: 'ETH',
    symbol: 'Ξ',
    icon: '⚡',
    color: '#627eea',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/30',
    description: 'Fast and simple',
    decimals: 18,
    coingeckoId: 'ethereum',
    contractMethod: 'registerWithETH'
  },
  USDC: {
    id: 1,
    name: 'USDC',
    symbol: '$',
    icon: '💵',
    color: '#2775ca',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/30',
    description: 'Stable pricing',
    decimals: 6,
    coingeckoId: 'usd-coin',
    contractMethod: 'registerWithUSDC',
    popular: true,
    requiresApproval: true
  },
  VIRTUAL: {
    id: 2,
    name: 'VIRTUAL',
    symbol: 'V',
    icon: '🤖',
    color: '#8b5cf6',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/30',
    description: 'Ecosystem token',
    decimals: 18,
    coingeckoId: 'virtual-protocol',
    contractMethod: 'registerWithVIRTUAL',
    requiresApproval: true,
    discount: true
  }
};

export const DOMAIN_CATEGORIES = {
  SINGLE_CHAR: {
    name: 'Single Character',
    examples: ['a', 'x', 'z', '1', '7'],
    estimatedValue: 100,
    tier: 'ULTRA',
    rarity: 'Ultra Rare (36 total)',
    description: 'The most exclusive domains - only 36 exist!'
  },
  TWO_CHAR: {
    name: 'Two Character',
    examples: ['ai', 'vr', 'x1', '99'],
    estimatedValue: 25,
    tier: 'PREMIUM',
    rarity: 'Very Rare (1,296 total)',
    description: 'Highly valuable short domains'
  },
  AI_KEYWORD: {
    name: 'AI Keywords',
    examples: ['ai', 'bot', 'agent', 'gpt', 'llm'],
    estimatedValue: 50,
    tier: 'PREMIUM',
    rarity: 'Premium Keywords',
    description: 'High-value AI and tech terms'
  },
  NUMBERS: {
    name: 'Number Sequences',
    examples: ['123', '1000', '2024', '0x1'],
    estimatedValue: 15,
    tier: 'PREMIUM',
    rarity: 'Pattern Based',
    description: 'Memorable number combinations'
  },
  PALINDROMES: {
    name: 'Palindromes',
    examples: ['aba', 'racecar', '121', 'wow'],
    estimatedValue: 20,
    tier: 'PREMIUM',
    rarity: 'Special Pattern',
    description: 'Reads the same forwards and backwards'
  },
  REPEATING: {
    name: 'Repeating Characters',
    examples: ['aaa', 'bbb', '000', 'xxx'],
    estimatedValue: 30,
    tier: 'PREMIUM',
    rarity: 'Pattern Based',
    description: 'Triple repeating character patterns'
  },
  POPULAR_NAMES: {
    name: 'Popular Names',
    examples: ['alice', 'bob', 'charlie', 'david'],
    estimatedValue: 10,
    tier: 'REGULAR',
    rarity: 'Common',
    description: 'Well-known names and words'
  },
  BUSINESS_TERMS: {
    name: 'Business Terms',
    examples: ['ceo', 'founder', 'startup', 'company'],
    estimatedValue: 15,
    tier: 'REGULAR',
    rarity: 'Business Value',
    description: 'Professional and business terminology'
  },
  LEGENDARY: {
    name: 'Legendary',
    examples: ['god', 'king', 'genesis', 'alpha', 'omega'],
    estimatedValue: 'auction',
    tier: 'LEGENDARY',
    rarity: 'Ultra Legendary',
    description: 'Manually curated ultra-rare names'
  }
};

export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet first',
  WRONG_NETWORK: `Please switch to ${getCurrentNetwork().name} network`,
  INSUFFICIENT_BALANCE: 'Insufficient balance for this transaction',
  INSUFFICIENT_ALLOWANCE: 'Please approve token spending first',
  NAME_TOO_SHORT: 'Name must be at least 1 character',
  NAME_TOO_LONG: 'Name must be less than 64 characters',
  NAME_INVALID_CHARS: 'Name can only contain letters and numbers',
  NAME_TAKEN: 'This name is already registered',
  NAME_NOT_AVAILABLE: 'This name is not available for registration',
  TRANSACTION_FAILED: 'Transaction failed. Please try again.',
  TRANSACTION_REJECTED: 'Transaction was rejected by user',
  TRANSACTION_TIMEOUT: 'Transaction timed out. Please check your wallet.',
  CONTRACT_NOT_DEPLOYED: 'Contract not deployed yet. Please check back later.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  RATE_LIMITED: 'Too many requests. Please wait a moment.',
  MAINTENANCE_MODE: 'Service is temporarily under maintenance',
  UNKNOWN_ERROR: 'An unexpected error occurred',
  INVALID_ADDRESS: 'Invalid Ethereum address',
  INVALID_DOMAIN_FORMAT: 'Invalid domain name format',
  DOMAIN_EXPIRED: 'This domain has expired',
  NOT_DOMAIN_OWNER: 'You are not the owner of this domain',
  LEGENDARY_DOMAIN: 'Legendary domains are available through auctions only'
};

export const SUCCESS_MESSAGES = {
  REGISTRATION_SUCCESS: 'Domain registered successfully! 🎉',
  TRANSFER_SUCCESS: 'Domain transferred successfully! ✅',
  WITHDRAWAL_SUCCESS: 'Funds withdrawn successfully! 💰',
  UPDATE_SUCCESS: 'Records updated successfully! 📝',
  APPROVAL_SUCCESS: 'Token approval successful! 👍',
  WALLET_CONNECTED: 'Wallet connected successfully! 🔗',
  NETWORK_SWITCHED: 'Network switched successfully! 🌐',
  TRANSACTION_SUBMITTED: 'Transaction submitted to blockchain! ⏳',
  TRANSACTION_CONFIRMED: 'Transaction confirmed! ✅'
};

export const LOADING_MESSAGES = {
  CONNECTING_WALLET: 'Connecting wallet...',
  SWITCHING_NETWORK: 'Switching network...',
  CHECKING_AVAILABILITY: 'Checking availability...',
  SUBMITTING_TRANSACTION: 'Submitting transaction...',
  WAITING_CONFIRMATION: 'Waiting for confirmation...',
  LOADING_DASHBOARD: 'Loading dashboard data...',
  APPROVING_TOKEN: 'Approving token spending...',
  REGISTERING_DOMAIN: 'Registering domain...',
  FETCHING_PRICE: 'Fetching current price...'
};

// Complete Contract ABI for your VirtualsBaseRegistry
export const CONTRACT_ABIS = {
  // Registration functions
  REGISTER_ETH: 'function registerWithETH(string memory name) payable',
  REGISTER_USDC: 'function registerWithUSDC(string memory name)',
  REGISTER_VIRTUAL: 'function registerWithVIRTUAL(string memory name)',
  
  // Admin registration
  ADMIN_REGISTER: 'function adminRegister(string memory name, address owner)',
  ADMIN_BATCH_REGISTER: 'function adminBatchRegister(string[] memory names, address[] memory owners)',
  
  // Query functions
  IS_AVAILABLE: 'function isAvailable(string memory name) view returns (bool)',
  RESOLVE: 'function resolve(string memory name) view returns (address)',
  GET_NAME_INFO: 'function getNameInfo(string memory name) view returns (address owner, address resolvedAddress, uint256 regTime, string memory avatar, string memory bio)',
  GET_TEXT: 'function getText(string memory name, string memory key) view returns (string memory)',
  GET_PRIMARY_NAME: 'function getPrimaryName(address addr) view returns (string memory)',
  
  // Owner functions
  TRANSFER: 'function transfer(string memory name, address to)',
  SET_ADDRESS: 'function setAddress(string memory name, address newAddress)',
  SET_TEXT: 'function setText(string memory name, string memory key, string memory value)',
  SET_PRIMARY_NAME: 'function setPrimaryName(string memory name)',
  
  // Transfer system
  INITIATE_TRANSFER: 'function initiateTransfer(string memory name, address to)',
  ACCEPT_TRANSFER: 'function acceptTransfer(string memory name)',
  
  // Admin functions
  UPDATE_PRICES: 'function updatePrices(uint256 _ethPrice, uint256 _usdcPrice, uint256 _virtualPrice)',
  ADD_PREMIUM_NAME: 'function addPremiumName(string memory name, uint256 estimatedValue, string memory category)',
  WITHDRAW_ETH: 'function withdrawETH()',
  WITHDRAW_USDC: 'function withdrawUSDC()',
  WITHDRAW_VIRTUAL: 'function withdrawVIRTUAL()',
  WITHDRAW_ALL: 'function withdrawAll()',
  
  // Dashboard functions
  GET_DASHBOARD_DATA: 'function getDashboardData() view returns (uint256 totalRegs, uint256 ethRev, uint256 usdcRev, uint256 virtualRev, uint256 ethRegs, uint256 usdcRegs, uint256 virtualRegs, uint256 totalRevenueUSD)',
  GET_CONTRACT_BALANCES: 'function getContractBalances() view returns (uint256 ethBalance, uint256 usdcBalance, uint256 virtualBalance)',
  GET_RECENT_REGISTRATIONS: 'function getRecentRegistrations(uint256 count) view returns (string[] memory names, address[] memory owners, uint8[] memory paymentMethods, uint256[] memory amounts, uint256[] memory timestamps)',
  GET_PREMIUM_NAMES: 'function getPremiumNames() view returns (string[] memory names, uint256[] memory estimatedValues, string[] memory categories, bool[] memory isSecured)',
  
  // Pricing functions
  ETH_PRICE: 'function ethPrice() view returns (uint256)',
  USDC_PRICE: 'function usdcPrice() view returns (uint256)',
  VIRTUAL_PRICE: 'function virtualPrice() view returns (uint256)',
  
  // ERC20 Token functions (for approvals)
  ERC20_APPROVE: 'function approve(address spender, uint256 amount) returns (bool)',
  ERC20_ALLOWANCE: 'function allowance(address owner, address spender) view returns (uint256)',
  ERC20_BALANCE_OF: 'function balanceOf(address account) view returns (uint256)'
};

// Event signatures for monitoring
export const EVENT_SIGNATURES = {
  NAME_REGISTERED: 'NameRegistered(string indexed name, address indexed owner, uint8 paymentMethod, uint256 amount, uint256 registrationId)',
  NAME_TRANSFERRED: 'NameTransferred(string indexed name, address indexed from, address indexed to)',
  TRANSFER_INITIATED: 'TransferInitiated(string indexed name, address indexed from, address indexed to)',
  TRANSFER_CANCELLED: 'TransferCancelled(string indexed name, address indexed owner)',
  RECORD_UPDATED: 'RecordUpdated(string indexed name, string key, string value)',
  ADDRESS_UPDATED: 'AddressUpdated(string indexed name, address newAddress)',
  PRICES_UPDATED: 'PricesUpdated(uint256 ethPrice, uint256 usdcPrice, uint256 virtualPrice)'
};

// API endpoints
export const API_ENDPOINTS = {
  DOMAIN_AVAILABILITY: '/api/domains/:name/availability',
  DOMAIN_PRICE: '/api/domains/:name/price',
  DOMAIN_INFO: '/api/domains/:name/info',
  SEARCH_DOMAINS: '/api/domains/search',
  TRANSACTION_STATUS: '/api/transactions/:hash',
  ADMIN_DASHBOARD: '/api/admin/dashboard',
  ADMIN_STATS: '/api/admin/stats'
};

// Local storage keys
export const STORAGE_KEYS = {
  WALLET_CONNECTION: 'virtualsdns_wallet_connected',
  PREFERRED_PAYMENT: 'virtualsdns_preferred_payment',
  RECENT_SEARCHES: 'virtualsdns_recent_searches',
  THEME_PREFERENCE: 'virtualsdns_theme',
  DASHBOARD_SETTINGS: 'virtualsdns_dashboard_settings'
};

// Validation rules
export const VALIDATION_RULES = {
  DOMAIN_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 63,
    PATTERN: /^[a-z0-9]+$/,
    RESERVED_NAMES: ['admin', 'api', 'www', 'mail', 'ftp', 'root', 'support']
  },
  
  ETHEREUM_ADDRESS: {
    PATTERN: /^0x[a-fA-F0-9]{40}$/
  },
  
  TRANSACTION_HASH: {
    PATTERN: /^0x[a-fA-F0-9]{64}$/
  }
};

// Timeouts and intervals
export const TIMEOUTS = {
  TRANSACTION_TIMEOUT: 300000, // 5 minutes
  WALLET_CONNECTION_TIMEOUT: 30000, // 30 seconds
  API_REQUEST_TIMEOUT: 10000, // 10 seconds
  PRICE_REFRESH_INTERVAL: 30000, // 30 seconds
  DASHBOARD_REFRESH_INTERVAL: 30000 // 30 seconds
};

// Gas settings
export const GAS_SETTINGS = {
  REGISTRATION: {
    LIMIT: 150000,
    PRICE_MULTIPLIER: 1.1
  },
  TRANSFER: {
    LIMIT: 100000,
    PRICE_MULTIPLIER: 1.1
  },
  APPROVAL: {
    LIMIT: 80000,
    PRICE_MULTIPLIER: 1.1
  }
};

// Export utility functions
export const isMainnet = () => getCurrentNetwork().id === NETWORKS.BASE_MAINNET.id;
export const isTestnet = () => getCurrentNetwork().isTestnet;

// Get block explorer URL for transaction
export const getBlockExplorerUrl = (hash, type = 'tx') => {
  const network = getCurrentNetwork();
  return `${network.blockExplorer}/${type}/${hash}`;
};

// Format domain name
export const formatDomainName = (name) => {
  return `${name}${APP_CONFIG.domain}`;
};

// Check if domain name is valid
export const isValidDomainName = (name) => {
  if (!name || typeof name !== 'string') return false;
  if (name.length < VALIDATION_RULES.DOMAIN_NAME.MIN_LENGTH) return false;
  if (name.length > VALIDATION_RULES.DOMAIN_NAME.MAX_LENGTH) return false;
  if (!VALIDATION_RULES.DOMAIN_NAME.PATTERN.test(name)) return false;
  if (VALIDATION_RULES.DOMAIN_NAME.RESERVED_NAMES.includes(name.toLowerCase())) return false;
  return true;
};

// Get domain category
export const getDomainCategory = (name) => {
  if (!name) return null;
  
  const length = name.length;
  const lower = name.toLowerCase();
  
  // Check for legendary names first
  const legendaryNames = ['god', 'king', 'queen', 'alpha', 'omega', 'genesis'];
  if (legendaryNames.includes(lower)) {
    return DOMAIN_CATEGORIES.LEGENDARY;
  }
  
  // Single character
  if (length === 1) {
    return DOMAIN_CATEGORIES.SINGLE_CHAR;
  }
  
  // Two character
  if (length === 2) {
    return DOMAIN_CATEGORIES.TWO_CHAR;
  }
  
  // AI keywords
  const aiKeywords = ['ai', 'bot', 'agent', 'gpt', 'llm', 'agi', 'ml'];
  if (aiKeywords.includes(lower)) {
    return DOMAIN_CATEGORIES.AI_KEYWORD;
  }
  
  // Numbers
  if (/^\d+$/.test(name)) {
    return DOMAIN_CATEGORIES.NUMBERS;
  }
  
  // Palindromes
  if (name === name.split('').reverse().join('') && length <= 7) {
    return DOMAIN_CATEGORIES.PALINDROMES;
  }
  
  // Repeating characters
  if (length === 3 && name[0] === name[1] && name[1] === name[2]) {
    return DOMAIN_CATEGORIES.REPEATING;
  }
  
  // Business terms
  const businessTerms = ['ceo', 'cto', 'founder', 'startup', 'company', 'corp'];
  if (businessTerms.includes(lower)) {
    return DOMAIN_CATEGORIES.BUSINESS_TERMS;
  }
  
  // Default to popular names
  return DOMAIN_CATEGORIES.POPULAR_NAMES;
};
