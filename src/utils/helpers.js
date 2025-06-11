// src/utils/helpers.js - Utility Functions
import { ethers } from 'ethers';
import { NETWORKS, ERROR_MESSAGES } from './constants';

// Address formatting
export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Token amount formatting
export const formatTokenAmount = (amount, decimals = 18, symbol = '') => {
  try {
    const formatted = ethers.utils.formatUnits(amount, decimals);
    const number = parseFloat(formatted);
    
    if (number < 0.001) return `< 0.001 ${symbol}`.trim();
    if (number < 1) return `${number.toFixed(4)} ${symbol}`.trim();
    if (number < 1000) return `${number.toFixed(2)} ${symbol}`.trim();
    
    return `${(number / 1000).toFixed(2)}K ${symbol}`.trim();
  } catch (error) {
    console.error('Error formatting token amount:', error);
    return `0 ${symbol}`.trim();
  }
};

// USD formatting
export const formatUSD = (amount) => {
  const number = parseFloat(amount);
  if (isNaN(number)) return '$0';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(number);
};

// Large number formatting
export const formatNumber = (num) => {
  const number = parseFloat(num);
  if (isNaN(number)) return '0';
  
  if (number >= 1000000) {
    return `${(number / 1000000).toFixed(1)}M`;
  } else if (number >= 1000) {
    return `${(number / 1000).toFixed(1)}K`;
  }
  return number.toLocaleString();
};

// Domain name validation
export const validateDomainName = (name) => {
  if (!name) {
    return { valid: false, error: ERROR_MESSAGES.NAME_TOO_SHORT };
  }
  
  if (name.length < 3) {
    return { valid: false, error: ERROR_MESSAGES.NAME_TOO_SHORT };
  }
  
  if (name.length > 32) {
    return { valid: false, error: ERROR_MESSAGES.NAME_TOO_LONG };
  }
  
  if (!/^[a-z0-9]+$/.test(name)) {
    return { valid: false, error: ERROR_MESSAGES.NAME_INVALID_CHARS };
  }
  
  return { valid: true };
};

// Address validation
export const isValidAddress = (address) => {
  try {
    return ethers.utils.isAddress(address);
  } catch {
    return false;
  }
};

// Generate blockchain explorer links
export const generateTransactionLink = (hash, chainId = 8453) => {
  const network = Object.values(NETWORKS).find(n => n.id === chainId);
  return network ? `${network.blockExplorer}/tx/${hash}` : '#';
};

export const generateAddressLink = (address, chainId = 8453) => {
  const network = Object.values(NETWORKS).find(n => n.id === chainId);
  return network ? `${network.blockExplorer}/address/${address}` : '#';
};

// Clipboard utilities
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (fallbackError) {
      document.body.removeChild(textArea);
      return false;
    }
  }
};

// Debounce function for search inputs
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Sleep utility
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Check if name is premium/valuable
export const isPremiumName = (name) => {
  if (!name) return false;
  
  // Single characters
  if (name.length === 1) return true;
  
  // Two characters
  if (name.length === 2) return true;
  
  // AI/Tech keywords
  const aiKeywords = ['ai', 'bot', 'agent', 'gpt', 'llm', 'ml', 'crypto', 'web3', 'defi', 'nft'];
  if (aiKeywords.includes(name.toLowerCase())) return true;
  
  // Popular names
  const popularNames = ['alice', 'bob', 'charlie', 'david', 'emma'];
  if (popularNames.includes(name.toLowerCase())) return true;
  
  return false;
};

// Estimate domain value
export const estimateDomainValue = (name) => {
  if (!name) return 0;
  
  if (name.length === 1) return 50000; // Single char: $50k
  if (name.length === 2) return 25000; // Two char: $25k
  
  const aiKeywords = ['ai', 'bot', 'agent', 'gpt'];
  if (aiKeywords.includes(name.toLowerCase())) return 15000; // AI: $15k
  
  const cryptoKeywords = ['crypto', 'web3', 'defi', 'nft'];
  if (cryptoKeywords.includes(name.toLowerCase())) return 10000; // Crypto: $10k
  
  if (name.length === 3) return 5000; // Three char: $5k
  if (name.length === 4) return 1000; // Four char: $1k
  
  return 100; // Regular name: $100
};

// Format time/date
export const formatTimeAgo = (timestamp) => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

// Network utilities
export const getNetworkName = (chainId) => {
  const network = Object.values(NETWORKS).find(n => n.id === chainId);
  return network ? network.name : 'Unknown Network';
};

export const isTestnet = (chainId) => {
  return chainId === NETWORKS.BASE_SEPOLIA.id;
};

// Error handling
export const getErrorMessage = (error) => {
  if (error?.message?.includes('user rejected')) {
    return 'Transaction cancelled by user';
  }
  
  if (error?.message?.includes('insufficient funds')) {
    return ERROR_MESSAGES.INSUFFICIENT_BALANCE;
  }
  
  if (error?.message?.includes('Name already taken')) {
    return ERROR_MESSAGES.NAME_TAKEN;
  }
  
  return error?.message || ERROR_MESSAGES.UNKNOWN_ERROR;
};

// Local storage utilities (with error handling)
export const getStoredData = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
};

export const setStoredData = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Error writing to localStorage:', error);
    return false;
  }
};

// URL utilities
export const buildDomainUrl = (name) => {
  return `${window.location.origin}/${name}`;
};

export const shareDomain = (name) => {
  const url = buildDomainUrl(name);
  const text = `Check out ${name}.virtuals.base on VirtualsDNS.fun!`;
  
  if (navigator.share) {
    navigator.share({ title: text, url });
  } else {
    copyToClipboard(url);
  }
};
