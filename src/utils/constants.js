// src/utils/constants.js - App Constants
export const CONTRACTS = {
  REGISTRY: process.env.REACT_APP_REGISTRY_ADDRESS,
  USDC: process.env.REACT_APP_USDC_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  VIRTUAL: process.env.REACT_APP_VIRTUAL_ADDRESS || '0x0b3e328455c4059eeb9e3f84b5543f74e24e7e1b'
};

export const NETWORKS = {
  BASE_MAINNET: {
    id: 8453,
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
    currency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 }
  },
  BASE_SEPOLIA: {
    id: 84532,
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org',
    currency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 }
  }
};

export const PRICING = {
  ETH: '0.001',
  USDC: '3.00',
  VIRTUAL: '1000',
  USD_EQUIVALENT: 3.0
};

export const APP_CONFIG = {
  name: 'VirtualsDNS.fun',
  shortName: 'VirtualsDNS',
  description: 'DNS for AI Agents - Register .virtuals.base domains',
  url: 'https://virtualsdns.fun',
  domain: '.virtuals.base',
  support: 'support@virtualsdns.fun',
  version: '1.0.0'
};

export const SOCIAL_LINKS = {
  twitter: 'https://twitter.com/virtualsdns_fun',
  discord: 'https://discord.gg/virtualsdns',
  github: 'https://github.com/virtualsdns/virtualsdns-fun',
  docs: 'https://docs.virtualsdns.fun'
};

export const PAYMENT_METHODS = {
  ETH: {
    id: 0,
    name: 'ETH',
    symbol: 'Ξ',
    icon: '⚡',
    color: '#3b82f6',
    description: 'Native Base token'
  },
  USDC: {
    id: 1,
    name: 'USDC',
    symbol: '$',
    icon: '💵',
    color: '#22c55e',
    description: 'Stable USD coin',
    popular: true
  },
  VIRTUAL: {
    id: 2,
    name: 'VIRTUAL',
    symbol: 'V',
    icon: '🤖',
    color: '#8b5cf6',
    description: 'AI ecosystem token',
    discount: true
  }
};

export const DOMAIN_CATEGORIES = {
  SINGLE_CHAR: {
    name: 'Single Character',
    examples: ['a', 'b', 'c'],
    estimatedValue: 50000
  },
  AI_KEYWORD: {
    name: 'AI Keyword',
    examples: ['ai', 'bot', 'agent'],
    estimatedValue: 25000
  },
  POPULAR_NAME: {
    name: 'Popular Name',
    examples: ['alice', 'bob', 'charlie'],
    estimatedValue: 5000
  },
  BUSINESS_TERM: {
    name: 'Business Term',
    examples: ['ceo', 'founder', 'startup'],
    estimatedValue: 10000
  }
};

export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet first',
  WRONG_NETWORK: 'Please switch to Base network',
  INSUFFICIENT_BALANCE: 'Insufficient balance for this transaction',
  NAME_TOO_SHORT: 'Name must be at least 3 characters',
  NAME_TOO_LONG: 'Name must be less than 32 characters',
  NAME_INVALID_CHARS: 'Name can only contain letters and numbers',
  NAME_TAKEN: 'This name is already registered',
  TRANSACTION_FAILED: 'Transaction failed. Please try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred'
};

export const SUCCESS_MESSAGES = {
  REGISTRATION_SUCCESS: 'Domain registered successfully!',
  TRANSFER_SUCCESS: 'Domain transferred successfully!',
  WITHDRAWAL_SUCCESS: 'Funds withdrawn successfully!',
  UPDATE_SUCCESS: 'Records updated successfully!'
};

// Contract ABI snippets for common functions
export const CONTRACT_ABIS = {
  REGISTER_ETH: 'function registerWithETH(string) payable',
  REGISTER_USDC: 'function registerWithUSDC(string)',
  REGISTER_VIRTUAL: 'function registerWithVIRTUAL(string)',
  RESOLVE: 'function resolve(string) view returns (address)',
  GET_TEXT: 'function getText(string, string) view returns (string)',
  TRANSFER: 'function transfer(string, address)',
  WITHDRAW_ETH: 'function withdrawETH()',
  WITHDRAW_USDC: 'function withdrawUSDC()',
  WITHDRAW_VIRTUAL: 'function withdrawVIRTUAL()',
  DASHBOARD_DATA: 'function getDashboardData() view returns (uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256)'
};
