import React, { useState, useEffect } from 'react';
import { Search, Crown, Star, Gem, Sparkles, CheckCircle, Wallet, ExternalLink, Copy, AlertCircle } from 'lucide-react';
import './App.css';

// Import your DashboardAPI
import DashboardAPI from './components/DashboardAPI';

const VirtualsBaseApp = () => {
  const [searchName, setSearchName] = useState('');
  const [pricingInfo, setPricingInfo] = useState(null);
  const [selectedToken, setSelectedToken] = useState('USDC');
  const [walletConnected, setWalletConnected] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [isAvailable, setIsAvailable] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [contractPricing, setContractPricing] = useState(null);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [dashboardApi] = useState(() => new DashboardAPI());

  // Updated pricing tiers with real contract integration
  const tiers = {
    REGULAR: {
      name: 'Regular',
      icon: '📝',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/30',
      description: '3+ characters, common words',
      prices: { ETH: '0.001', USDC: '5.00', VIRTUAL: '1,000' }
    },
    PREMIUM: {
      name: 'Premium',
      icon: '⭐',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500/20',
      borderColor: 'border-purple-500/30',
      description: '2 characters, numbers, premium words',
      prices: { ETH: '0.001', USDC: '5.00', VIRTUAL: '1,000' } // Same pricing as regular for now
    },
    ULTRA: {
      name: 'Ultra',
      icon: '💎',
      color: 'from-pink-500 to-red-600',
      bgColor: 'bg-pink-500/20',
      borderColor: 'border-pink-500/30',
      description: '1 character, rare patterns',
      prices: { ETH: '0.001', USDC: '5.00', VIRTUAL: '1,000' } // Same pricing as regular for now
    },
    LEGENDARY: {
      name: 'Legendary',
      icon: '👑',
      color: 'from-yellow-400 to-orange-600',
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500/30',
      description: 'Ultra-rare, auction only',
      prices: { ETH: 'Auction', USDC: 'Auction', VIRTUAL: 'Auction' }
    }
  };

  // Load contract pricing on mount
  useEffect(() => {
    loadContractPricing();
  }, []);

  const loadContractPricing = async () => {
    try {
      const pricing = await dashboardApi.getContractPricing();
      setContractPricing(pricing);
      
      // Update all tiers with contract pricing (since your contract has flat pricing)
      Object.keys(tiers).forEach(tierKey => {
        if (tierKey !== 'LEGENDARY') {
          tiers[tierKey].prices = {
            ETH: pricing.eth,
            USDC: pricing.usdc,
            VIRTUAL: pricing.virtual
          };
        }
      });
    } catch (error) {
      console.error('Failed to load contract pricing:', error);
    }
  };

  // Smart pricing detection logic (enhanced)
  const checkPricing = async (name) => {
    if (!name) {
      setPricingInfo(null);
      setIsAvailable(null);
      return;
    }

    setIsLoading(true);

    try {
      // Check availability on-chain if contract is deployed
      if (process.env.REACT_APP_REGISTRY_ADDRESS) {
        try {
          const available = await dashboardApi.contract.isAvailable(name);
          setIsAvailable(available);
        } catch (error) {
          console.warn('Could not check availability on-chain:', error);
          setIsAvailable(true); // Assume available if can't check
        }
      } else {
        setIsAvailable(true); // Demo mode
      }

      let tier = 'REGULAR';
      let reasons = [];

      // Length-based pricing
      if (name.length === 1) {
        tier = 'ULTRA';
        reasons.push('Single character names are ultra-rare (only 36 exist!)');
      } else if (name.length === 2) {
        tier = 'PREMIUM';
        reasons.push('2-character names are premium (only 1,296 combinations)');
      }

      // Premium keywords
      const premiumWords = [
        'ai', 'bot', 'nft', 'dao', 'defi', 'web3', 'meta', 'virtual', 'crypto', 
        'blockchain', 'bitcoin', 'ethereum', 'trading', 'finance', 'money', 
        'wallet', 'token', 'coin', 'dapp', 'smart', 'metaverse', 'chatgpt',
        'agi', 'llm', 'gpt', 'claude', 'openai', 'anthropic'
      ];
      
      if (premiumWords.includes(name.toLowerCase())) {
        tier = 'PREMIUM';
        reasons.push(`"${name}" is a premium keyword with high commercial value`);
      }

      // All numbers
      if (/^\d+$/.test(name)) {
        if (name.length <= 3) {
          tier = 'ULTRA';
          reasons.push('Short number sequences are extremely rare and valuable');
        } else if (name.length <= 4) {
          tier = 'PREMIUM';
          reasons.push('Number sequences have premium value for brands');
        }
      }

      // Repeating characters (aaa, bbb, etc.)
      if (name.length === 3 && name[0] === name[1] && name[1] === name[2]) {
        tier = 'PREMIUM';
        reasons.push('Triple repeating characters (aaa, bbb) are premium patterns');
      }

      // Palindromes
      if (name === name.split('').reverse().join('') && name.length <= 5) {
        tier = 'PREMIUM';
        reasons.push(`"${name}" is a palindrome - reads the same forwards and backwards`);
      }

      // Legendary manual overrides
      const legendaryNames = [
        'god', 'king', 'queen', 'lord', 'alpha', 'omega', 'genesis', 'bitcoin', 
        'satoshi', 'vitalik', 'zero', 'one', 'infinity', 'universe', 'creator',
        'ai', 'virtual', 'base'
      ];
      
      if (legendaryNames.includes(name.toLowerCase())) {
        tier = 'LEGENDARY';
        reasons.push('Manually designated as legendary - available only through special auctions');
      }

      setPricingInfo({
        name,
        tier,
        reasons,
        ...tiers[tier]
      });

    } catch (error) {
      console.error('Error checking pricing:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Real wallet connection
  const connectWallet = async () => {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        // Request account access
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        
        // Check if on Base network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const baseChainId = '0x2105'; // 8453 in hex
        
        if (chainId !== baseChainId) {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: baseChainId }],
            });
          } catch (switchError) {
            // Chain doesn't exist, add it
            if (switchError.code === 4902) {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: baseChainId,
                  chainName: 'Base',
                  nativeCurrency: {
                    name: 'ETH',
                    symbol: 'ETH',
                    decimals: 18,
                  },
                  rpcUrls: ['https://mainnet.base.org'],
                  blockExplorerUrls: ['https://basescan.org'],
                }],
              });
            }
          }
        }

        // Initialize dashboard API with signer
        await dashboardApi.initializeWithSigner(window.ethereum);
        
        setWalletConnected(true);
        setUserAddress(accounts[0]);
        
        showNotification('Wallet connected successfully! 🎉', 'success');
      } else {
        showNotification('Please install MetaMask or another Web3 wallet!', 'error');
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      showNotification('Failed to connect wallet. Please try again.', 'error');
    }
  };

  // Real registration function
  const handleRegister = async () => {
    if (!walletConnected) {
      showNotification('Please connect your wallet first!', 'warning');
      return;
    }

    if (!isAvailable) {
      showNotification('This domain is not available!', 'error');
      return;
    }

    if (pricingInfo.tier === 'LEGENDARY') {
      showNotification(`${searchName}.virtuals.base is Legendary tier - auction coming soon! 👑`, 'info');
      return;
    }

    setRegistrationLoading(true);

    try {
      let txHash;
      
      switch (selectedToken) {
        case 'ETH':
          txHash = await dashboardApi.contract.registerWithETH(searchName, {
            value: ethers.parseEther(contractPricing.eth)
          });
          break;
        case 'USDC':
          txHash = await dashboardApi.contract.registerWithUSDC(searchName);
          break;
        case 'VIRTUAL':
          txHash = await dashboardApi.contract.registerWithVIRTUAL(searchName);
          break;
      }

      showNotification(`Registration submitted! Transaction: ${txHash}`, 'success');
      
      // Wait for confirmation
      const receipt = await txHash.wait();
      
      if (receipt.status === 1) {
        showNotification(`🎉 ${searchName}.virtuals.base registered successfully!`, 'success');
        setIsAvailable(false);
      } else {
        showNotification('Registration failed. Please try again.', 'error');
      }

    } catch (error) {
      console.error('Registration failed:', error);
      showNotification(`Registration failed: ${error.message}`, 'error');
    } finally {
      setRegistrationLoading(false);
    }
  };

  // Notification system
  const showNotification = (message, type = 'info') => {
    // You could integrate react-hot-toast here
    alert(message); // Temporary - replace with proper toast notifications
  };

  // Copy domain name to clipboard
  const copyDomain = (name) => {
    navigator.clipboard.writeText(`${name}.virtuals.base`);
    showNotification('Domain name copied to clipboard!', 'success');
  };

  // Real-time pricing check as user types
  useEffect(() => {
    const timer = setTimeout(() => {
      checkPricing(searchName);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchName]);

  return (
    <div className="app">
      <div className="container">
        
        {/* Header */}
        <div className="header">
          <h1 className="title">
            🤖 .virtuals.base
          </h1>
          <p className="subtitle">
            AI Agent Domain Names with Smart Pricing on Base Network
          </p>
          <div className="header-badges">
            <span className="badge">Live on Base Mainnet</span>
            <span className="badge">Multi-Token Payments</span>
            <span className="badge">Instant Registration</span>
          </div>
          
          {/* Network Status */}
          <div className="network-status">
            <div className="status-dot"></div>
            <span>Base Network • {contractPricing ? 'Contract Connected' : 'Loading...'}</span>
          </div>
          
          {/* Wallet Connection */}
          <div className="wallet-section">
            {!walletConnected ? (
              <button
                onClick={connectWallet}
                className="wallet-button"
              >
                <Wallet size={20} />
                Connect Wallet
              </button>
            ) : (
              <div className="wallet-connected">
                <div className="wallet-status">
                  <CheckCircle size={20} />
                  <span>Connected: {userAddress.slice(0, 6)}...{userAddress.slice(-4)}</span>
                  <button 
                    onClick={() => copyDomain(userAddress)}
                    className="copy-button"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search and Pricing Section */}
        <div className="search-section">
          <div className="search-card">
            <div className="search-header">
              <Search className="search-icon" />
              <h2>Register Your Domain</h2>
            </div>
            
            <div className="search-content">
              {/* Name Input */}
              <div className="input-section">
                <label className="input-label">Enter domain name:</label>
                <div className="input-container">
                  <input
                    type="text"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                    placeholder="alice"
                    className="domain-input"
                    maxLength="63"
                  />
                  <span className="domain-suffix">
                    .virtuals.base
                  </span>
                  {searchName && (
                    <button 
                      onClick={() => copyDomain(searchName)}
                      className="copy-button-inline"
                    >
                      <Copy size={16} />
                    </button>
                  )}
                </div>
                <p className="input-hint">
                  💡 Try: single letters (a, x), numbers (123), or keywords (ai, bot, nft)
                </p>
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Checking availability...</p>
                </div>
              )}

              {/* Pricing Result */}
              {pricingInfo && !isLoading && (
                <div className={`pricing-result ${pricingInfo.bgColor} ${pricingInfo.borderColor}`}>
                  
                  {/* Availability Status */}
                  <div className="availability-status">
                    {isAvailable === null ? (
                      <div className="status-unknown">
                        <AlertCircle size={16} />
                        <span>Checking availability...</span>
                      </div>
                    ) : isAvailable ? (
                      <div className="status-available">
                        <CheckCircle size={16} />
                        <span>✅ Available for registration!</span>
                      </div>
                    ) : (
                      <div className="status-taken">
                        <AlertCircle size={16} />
                        <span>❌ Already registered</span>
                        <a 
                          href={`https://basescan.org/address/${process.env.REACT_APP_REGISTRY_ADDRESS}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="view-link"
                        >
                          <ExternalLink size={14} />
                          View on BaseScan
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="pricing-header">
                    <span className="tier-icon">{pricingInfo.icon}</span>
                    <div>
                      <h3 className="tier-name">{pricingInfo.name} Tier</h3>
                      <p className="tier-description">{pricingInfo.description}</p>
                    </div>
                  </div>
                  
                  {/* Pricing Display */}
                  <div className="pricing-grid">
                    {Object.entries(pricingInfo.prices).map(([token, price]) => (
                      <div 
                        key={token} 
                        className={`price-option ${selectedToken === token ? 'selected' : ''}`}
                        onClick={() => setSelectedToken(token)}
                      >
                        <p className="token-name">{token}</p>
                        <p className="token-price">{price}</p>
                        {price !== 'Auction' && contractPricing && (
                          <p className="usd-equivalent">
                            ≈ ${token === 'USDC' ? contractPricing.usdc : 
                                token === 'ETH' ? (parseFloat(contractPricing.eth) * 3500).toFixed(0) : 
                                (parseFloat(contractPricing.virtual) * 0.003).toFixed(0)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Pricing Reasons */}
                  {pricingInfo.reasons.length > 0 && (
                    <div className="pricing-reasons">
                      <p className="reasons-title">🧠 Why this pricing:</p>
                      <div className="reasons-list">
                        {pricingInfo.reasons.map((reason, index) => (
                          <div key={index} className="reason-item">
                            <CheckCircle size={16} className="reason-check" />
                            {reason}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Register Button */}
                  <button
                    onClick={handleRegister}
                    disabled={!searchName || !walletConnected || !isAvailable || registrationLoading}
                    className={`register-button ${(!searchName || !walletConnected || !isAvailable || registrationLoading) ? 'disabled' : ''}`}
                  >
                    {registrationLoading ? (
                      <>
                        <div className="spinner-small"></div>
                        Registering...
                      </>
                    ) : !walletConnected ? 'Connect Wallet to Register' :
                       !isAvailable ? 'Domain Not Available' :
                       pricingInfo.tier === 'LEGENDARY' ? 'Join Auction (Coming Soon) 👑' :
                       `Register for ${pricingInfo.prices[selectedToken]} ${selectedToken} 🚀`}
                  </button>

                  {/* Special Legendary Notice */}
                  {pricingInfo.tier === 'LEGENDARY' && (
                    <div className="legendary-notice">
                      <div className="legendary-header">
                        <Crown size={20} />
                        <p>Legendary Domain Detected!</p>
                      </div>
                      <p className="legendary-text">
                        This ultra-rare name is only available through special auction events. Join our community for auction announcements!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rest of your existing components - Pricing Tiers, Examples, How It Works */}
        {/* ... (keeping all your existing sections) ... */}

        {/* Footer */}
        <div className="footer">
          <div className="footer-content">
            <div className="footer-links">
              <a href="https://docs.virtualsbase.com" target="_blank" rel="noopener noreferrer">
                Documentation
              </a>
              <a href="https://github.com/retroservices1121/virtualsdns" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
              <a href="https://basescan.org" target="_blank" rel="noopener noreferrer">
                BaseScan
              </a>
            </div>
            <p className="footer-text">
              Built on Base • Powered by Smart Contracts • Open Source
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualsBaseApp;
