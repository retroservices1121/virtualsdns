// src/utils/helpers.js - Enhanced Utility Functions for VirtualsBase
import { ethers } from 'ethers';
import { NETWORKS, ERROR_MESSAGES, DOMAIN_CATEGORIES, PAYMENT_METHODS } from './constants';

// ===== ADDRESS & FORMATTING UTILITIES =====

// Enhanced address formatting with validation
export const formatAddress = (address, length = 6) => {
  if (!address || !isValidAddress(address)) return '';
  const start = Math.min(length, address.length / 2 - 2);
  const end = Math.max(4, address.length / 2 - 2);
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};

// Enhanced token amount formatting with better precision
export const formatTokenAmount = (amount, decimals = 18, symbol = '') => {
  try {
    if (!amount || amount === '0') return `0 ${symbol}`.trim();
    
    const formatted = ethers.utils.formatUnits(amount.toString(), decimals);
    const number = parseFloat(formatted);
    
    if (number < 0.000001) return `< 0.000001 ${symbol}`.trim();
    if (number < 0.001) return `${number.toFixed(6)} ${symbol}`.trim();
    if (number < 1) return `${number.toFixed(4)} ${symbol}`.trim();
    if (number < 1000) return `${number.toFixed(3)} ${symbol}`.trim();
    if (number < 1000000) return `${(number / 1000).toFixed(2)}K ${symbol}`.trim();
    
    return `${(number / 1000000).toFixed(2)}M ${symbol}`.trim();
  } catch (error) {
    console.error('Error formatting token amount:', error, { amount, decimals, symbol });
    return `0 ${symbol}`.trim();
  }
};

// Enhanced USD formatting with better international support
export const formatUSD = (amount, options = {}) => {
  const number = parseFloat(amount);
  if (isNaN(number)) return '$0';
  
  const defaultOptions = {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options
  };
  
  // Handle very large numbers
  if (number >= 1000000) {
    return `$${(number / 1000000).toFixed(1)}M`;
  } else if (number >= 1000) {
    return `$${(number / 1000).toFixed(1)}K`;
  }
  
  return new Intl.NumberFormat('en-US', defaultOptions).format(number);
};

// Enhanced number formatting with more options
export const formatNumber = (num, options = {}) => {
  const number = parseFloat(num);
  if (isNaN(number)) return '0';
  
  const { compact = true, decimals = 1 } = options;
  
  if (compact) {
    if (number >= 1000000000) return `${(number / 1000000000).toFixed(decimals)}B`;
    if (number >= 1000000) return `${(number / 1000000).toFixed(decimals)}M`;
    if (number >= 1000) return `${(number / 1000).toFixed(decimals)}K`;
  }
  
  return number.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  });
};

// ===== DOMAIN VALIDATION & CATEGORIZATION =====

// Enhanced domain validation with more detailed error messages
export const validateDomainName = (name) => {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Domain name is required' };
  }
  
  const trimmedName = name.trim().toLowerCase();
  
  if (trimmedName.length < 1) {
    return { valid: false, error: ERROR_MESSAGES.NAME_TOO_SHORT };
  }
  
  if (trimmedName.length > 63) { // DNS standard limit
    return { valid: false, error: ERROR_MESSAGES.NAME_TOO_LONG };
  }
  
  // Check for invalid characters (only alphanumeric allowed)
  if (!/^[a-z0-9]+$/.test(trimmedName)) {
    return { valid: false, error: ERROR_MESSAGES.NAME_INVALID_CHARS };
  }
  
  // Check for reserved names
  const reservedNames = ['www', 'api', 'app', 'admin', 'root', 'mail', 'ftp'];
  if (reservedNames.includes(trimmedName)) {
    return { valid: false, error: 'This name is reserved' };
  }
  
  return { valid: true, name: trimmedName };
};

// Enhanced domain categorization system
export const getDomainCategory = (name) => {
  if (!name) return null;
  
  const lowerName = name.toLowerCase();
  const length = lowerName.length;
  
  // Single character domains
  if (length === 1) {
    return {
      tier: 'Ultra',
      category: DOMAIN_CATEGORIES.SINGLE_CHAR,
      estimatedValue: 50000,
      rarity: 'Legendary',
      description: 'Ultra-rare single character domain'
    };
  }
  
  // Two character domains
  if (length === 2) {
    return {
      tier: 'Premium',
      category: DOMAIN_CATEGORIES.TWO_CHAR,
      estimatedValue: 25000,
      rarity: 'Epic',
      description: 'Premium two character domain'
    };
  }
  
  // AI/ML keywords
  const aiKeywords = ['ai', 'ml', 'gpt', 'llm', 'bot', 'agent', 'neural', 'model', 'train'];
  if (aiKeywords.includes(lowerName)) {
    return {
      tier: 'Premium',
      category: DOMAIN_CATEGORIES.AI_KEYWORD,
      estimatedValue: 15000,
      rarity: 'Rare',
      description: 'AI/ML industry keyword'
    };
  }
  
  // Crypto/Web3 keywords
  const cryptoKeywords = ['crypto', 'web3', 'defi', 'nft', 'dao', 'token', 'coin', 'stake'];
  if (cryptoKeywords.includes(lowerName)) {
    return {
      tier: 'Premium',
      category: DOMAIN_CATEGORIES.CRYPTO_KEYWORD,
      estimatedValue: 10000,
      rarity: 'Rare',
      description: 'Crypto/Web3 industry keyword'
    };
  }
  
  // Three character domains
  if (length === 3) {
    return {
      tier: 'Premium',
      category: DOMAIN_CATEGORIES.THREE_CHAR,
      estimatedValue: 5000,
      rarity: 'Uncommon',
      description: 'Premium three character domain'
    };
  }
  
  // Popular/common names
  const popularNames = ['alice', 'bob', 'charlie', 'david', 'emma', 'frank', 'grace'];
  if (popularNames.includes(lowerName)) {
    return {
      tier: 'Premium',
      category: DOMAIN_CATEGORIES.POPULAR_NAME,
      estimatedValue: 2000,
      rarity: 'Uncommon',
      description: 'Popular name domain'
    };
  }
  
  // Four character domains
  if (length === 4) {
    return {
      tier: 'Standard',
      category: DOMAIN_CATEGORIES.FOUR_CHAR,
      estimatedValue: 1000,
      rarity: 'Common',
      description: 'Standard four character domain'
    };
  }
  
  // Regular domains
  return {
    tier: 'Regular',
    category: DOMAIN_CATEGORIES.REGULAR,
    estimatedValue: 100,
    rarity: 'Common',
    description: 'Standard domain name'
  };
};

// ===== ENHANCED VALIDATION =====

// Enhanced address validation with checksums
export const isValidAddress = (address) => {
  try {
    if (!address || typeof address !== 'string') return false;
    return ethers.utils.isAddress(address);
  } catch {
    return false;
  }
};

// Validate private key format
export const isValidPrivateKey = (key) => {
  try {
    if (!key || typeof key !== 'string') return false;
    if (key.startsWith('0x')) key = key.slice(2);
    return key.length === 64 && /^[0-9a-fA-F]+$/.test(key);
  } catch {
    return false;
  }
};

// ===== BLOCKCHAIN UTILITIES =====

// Enhanced transaction link generation
export const generateTransactionLink = (hash, chainId = 8453) => {
  if (!hash || !hash.startsWith('0x')) return '#';
  const network = Object.values(NETWORKS).find(n => n.id === chainId);
  return network ? `${network.blockExplorer}/tx/${hash}` : '#';
};

// Enhanced address link generation
export const generateAddressLink = (address, chainId = 8453) => {
  if (!isValidAddress(address)) return '#';
  const network = Object.values(NETWORKS).find(n => n.id === chainId);
  return network ? `${network.blockExplorer}/address/${address}` : '#';
};

// Generate contract link
export const generateContractLink = (address, chainId = 8453) => {
  if (!isValidAddress(address)) return '#';
  const network = Object.values(NETWORKS).find(n => n.id === chainId);
  return network ? `${network.blockExplorer}/address/${address}#code` : '#';
};

// ===== ENHANCED UTILITIES =====

// Enhanced clipboard with better error handling
export const copyToClipboard = async (text, showNotification = true) => {
  if (!text) return false;
  
  try {
    await navigator.clipboard.writeText(text);
    if (showNotification && window.showToast) {
      window.showToast('Copied to clipboard!', 'success');
    }
    return true;
  } catch (error) {
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful && showNotification && window.showToast) {
        window.showToast('Copied to clipboard!', 'success');
      }
      return successful;
    } catch (fallbackError) {
      console.error('Failed to copy to clipboard:', fallbackError);
      if (showNotification && window.showToast) {
        window.showToast('Failed to copy to clipboard', 'error');
      }
      return false;
    }
  }
};

// Enhanced debounce with immediate option
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };
    
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func.apply(this, args);
  };
};

// Throttle function for performance-critical operations
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// ===== DOMAIN VALUE ESTIMATION =====

// Enhanced domain value estimation with market factors
export const estimateDomainValue = (name, marketData = {}) => {
  if (!name) return 0;
  
  const category = getDomainCategory(name);
  if (!category) return 0;
  
  let baseValue = category.estimatedValue;
  
  // Apply market multipliers
  const { 
    marketMultiplier = 1, 
    demandBoost = 1, 
    trendingBonus = 0 
  } = marketData;
  
  // Calculate final value
  const estimatedValue = Math.floor(
    baseValue * marketMultiplier * demandBoost + trendingBonus
  );
  
  return {
    baseValue,
    estimatedValue,
    category: category.category,
    tier: category.tier,
    rarity: category.rarity,
    factors: {
      marketMultiplier,
      demandBoost,
      trendingBonus
    }
  };
};

// ===== TIME & DATE UTILITIES =====

// Enhanced time formatting
export const formatTimeAgo = (timestamp) => {
  const now = Date.now();
  const diff = now - (typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp);
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  
  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  return `${months}mo ago`;
};

// Format full date
export const formatDate = (timestamp, options = {}) => {
  const date = new Date(typeof timestamp === 'string' ? timestamp : timestamp);
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };
  return date.toLocaleDateString('en-US', defaultOptions);
};

// ===== NETWORK UTILITIES =====

// Enhanced network detection
export const getNetworkName = (chainId) => {
  const network = Object.values(NETWORKS).find(n => n.id === chainId);
  return network ? network.name : `Unknown Network (${chainId})`;
};

// Check if network is supported
export const isSupportedNetwork = (chainId) => {
  return Object.values(NETWORKS).some(n => n.id === chainId);
};

// Get network configuration
export const getNetworkConfig = (chainId) => {
  return Object.values(NETWORKS).find(n => n.id === chainId) || null;
};

// ===== ERROR HANDLING =====

// Enhanced error message extraction
export const getErrorMessage = (error, context = '') => {
  if (!error) return ERROR_MESSAGES.UNKNOWN_ERROR;
  
  const errorStr = error.toString().toLowerCase();
  const message = error.message?.toLowerCase() || errorStr;
  
  // User rejection
  if (message.includes('user rejected') || message.includes('user denied')) {
    return 'Transaction cancelled by user';
  }
  
  // Insufficient funds
  if (message.includes('insufficient funds') || message.includes('insufficient balance')) {
    return ERROR_MESSAGES.INSUFFICIENT_BALANCE;
  }
  
  // Already taken
  if (message.includes('already taken') || message.includes('already registered')) {
    return ERROR_MESSAGES.NAME_TAKEN;
  }
  
  // Network errors
  if (message.includes('network') || message.includes('connection')) {
    return 'Network connection error. Please check your internet and try again.';
  }
  
  // Gas errors
  if (message.includes('gas') || message.includes('out of gas')) {
    return 'Transaction failed due to insufficient gas. Please try again with higher gas.';
  }
  
  // Contract errors
  if (message.includes('execution reverted')) {
    return 'Transaction failed. Please check your inputs and try again.';
  }
  
  // Return original message if it's user-friendly, otherwise generic error
  const originalMessage = error.message || error.toString();
  if (originalMessage && originalMessage.length < 100 && !originalMessage.includes('0x')) {
    return originalMessage;
  }
  
  return `${ERROR_MESSAGES.UNKNOWN_ERROR}${context ? ` (${context})` : ''}`;
};

// ===== STORAGE UTILITIES =====

// Enhanced localStorage with expiration
export const setStoredData = (key, value, expirationHours = null) => {
  try {
    const data = {
      value,
      timestamp: Date.now(),
      expiration: expirationHours ? Date.now() + (expirationHours * 60 * 60 * 1000) : null
    };
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error writing to localStorage:', error);
    return false;
  }
};

// Enhanced localStorage retrieval with expiration check
export const getStoredData = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    
    const data = JSON.parse(item);
    
    // Check if data has expiration and is expired
    if (data.expiration && Date.now() > data.expiration) {
      localStorage.removeItem(key);
      return defaultValue;
    }
    
    // Return value if it's the new format, otherwise return the item directly (backward compatibility)
    return data.value !== undefined ? data.value : data;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
};

// Clear expired storage items
export const clearExpiredStorage = () => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      getStoredData(key); // This will auto-remove expired items
    });
  } catch (error) {
    console.error('Error clearing expired storage:', error);
  }
};

// ===== URL & SHARING UTILITIES =====

// Enhanced domain URL building
export const buildDomainUrl = (name, subdomain = null) => {
  const base = `${window.location.origin}`;
  const fullDomain = `${name}.virtuals.base`;
  return subdomain ? `${base}/${subdomain}/${fullDomain}` : `${base}/domain/${fullDomain}`;
};

// Enhanced sharing with multiple platforms
export const shareDomain = async (name, options = {}) => {
  const { 
    title = `${name}.virtuals.base - AI Agent Domain`,
    text = `Check out this AI agent domain: ${name}.virtuals.base`,
    platform = 'auto'
  } = options;
  
  const url = buildDomainUrl(name);
  
  // Use native sharing if available and platform is auto
  if (platform === 'auto' && navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch (error) {
      // User cancelled or sharing failed
      return false;
    }
  }
  
  // Platform-specific sharing
  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`
  };
  
  if (shareUrls[platform]) {
    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    return true;
  }
  
  // Fallback to clipboard
  return await copyToClipboard(url, true);
};

// ===== PAYMENT UTILITIES =====

// Get payment method configuration
export const getPaymentMethod = (id) => {
  return Object.values(PAYMENT_METHODS).find(method => method.id === id);
};

// Format payment amount based on method
export const formatPaymentAmount = (amount, methodId) => {
  const method = getPaymentMethod(methodId);
  if (!method) return '';
  
  const formattedAmount = parseFloat(amount).toFixed(method.name === 'USDC' ? 2 : 4);
  return `${formattedAmount} ${method.name}`;
};

// ===== PERFORMANCE UTILITIES =====

// Measure and log performance
export const measurePerformance = (name, fn) => {
  return async (...args) => {
    const start = performance.now();
    try {
      const result = await fn(...args);
      const end = performance.now();
      console.log(`⚡ ${name} took ${(end - start).toFixed(2)}ms`);
      return result;
    } catch (error) {
      const end = performance.now();
      console.error(`❌ ${name} failed after ${(end - start).toFixed(2)}ms:`, error);
      throw error;
    }
  };
};

// Create retry function with exponential backoff
export const createRetryFunction = (fn, maxRetries = 3, baseDelay = 1000) => {
  return async (...args) => {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) break;
        
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`, error.message);
        await sleep(delay);
      }
    }
    
    throw lastError;
  };
};
