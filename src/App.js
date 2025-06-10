import React, { useState, useEffect } from 'react';
import { Search, Crown, Star, Gem, Sparkles, CheckCircle, Wallet } from 'lucide-react';
import './App.css';

const VirtualsBaseApp = () => {
  const [searchName, setSearchName] = useState('');
  const [pricingInfo, setPricingInfo] = useState(null);
  const [selectedToken, setSelectedToken] = useState('USDC');
  const [walletConnected, setWalletConnected] = useState(false);
  const [userAddress, setUserAddress] = useState('');

  // Updated pricing tiers with your new prices
  const tiers = {
    REGULAR: {
      name: 'Regular',
      icon: '📝',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/30',
      description: '3+ characters, common words',
      prices: { ETH: '0.0014', USDC: '5.00', VIRTUAL: '1,667' }
    },
    PREMIUM: {
      name: 'Premium',
      icon: '⭐',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500/20',
      borderColor: 'border-purple-500/30',
      description: '2 characters, numbers, premium words',
      prices: { ETH: '0.014', USDC: '50.00', VIRTUAL: '16,667' }
    },
    ULTRA: {
      name: 'Ultra',
      icon: '💎',
      color: 'from-pink-500 to-red-600',
      bgColor: 'bg-pink-500/20',
      borderColor: 'border-pink-500/30',
      description: '1 character, rare patterns',
      prices: { ETH: '0.07', USDC: '250.00', VIRTUAL: '83,333' }
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

  // Smart pricing detection logic
  const checkPricing = (name) => {
    if (!name) {
      setPricingInfo(null);
      return;
    }

    let tier = 'REGULAR';
    let reasons = [];

    // Length-based pricing
    if (name.length === 1) {
      tier = 'ULTRA';
      reasons.push('Single character names are ultra-rare (only 26 exist!)');
    } else if (name.length === 2) {
      tier = 'PREMIUM';
      reasons.push('2-character names are premium (only 676 combinations)');
    }

    // Premium keywords
    const premiumWords = [
      'ai', 'bot', 'nft', 'dao', 'defi', 'web3', 'meta', 'virtual', 'crypto', 
      'blockchain', 'bitcoin', 'ethereum', 'trading', 'finance', 'money', 
      'wallet', 'token', 'coin', 'dapp', 'smart', 'metaverse', 'chatgpt'
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
    if (name === name.split('').reverse().join('') && name.length <= 4) {
      tier = 'PREMIUM';
      reasons.push(`"${name}" is a palindrome - reads the same forwards and backwards`);
    }

    // Legendary manual overrides
    const legendaryNames = [
      'god', 'king', 'queen', 'lord', 'alpha', 'omega', 'genesis', 'bitcoin', 
      'satoshi', 'vitalik', 'zero', 'one', 'infinity', 'universe', 'creator'
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
  };

  // Simulate wallet connection
  const connectWallet = async () => {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        setWalletConnected(true);
        setUserAddress('0x742d35Cc6634C0532925a3b8D40E4...');
        alert('Wallet connected! (Demo mode)');
      } else {
        alert('Please install MetaMask or another Web3 wallet to use this feature in production!');
        // For demo purposes, still connect
        setWalletConnected(true);
        setUserAddress('0x742d35Cc6634C0532925a3b8D40E4...');
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
    }
  };

  // Simulate registration
  const handleRegister = async () => {
    if (!walletConnected) {
      alert('Please connect your wallet first!');
      return;
    }

    if (pricingInfo.tier === 'LEGENDARY') {
      alert(`${searchName}.virtuals.base is Legendary tier - auction coming soon! 👑

🏆 This ultra-rare name will be available through special auction events.

Join our community for auction announcements!`);
      return;
    }

    const registrationAlert = `🎉 Registration successful! (Demo mode)

Your domain is now active:
• Name: ${searchName}.virtuals.base  
• Owner: ${userAddress}
• Payment: ${pricingInfo.prices[selectedToken]} ${selectedToken}
• Tier: ${pricingInfo.name}

✅ You can now use this domain to receive payments!
✅ Point it to any wallet address
✅ Add custom text records (avatar, bio, etc.)
✅ Transfer ownership anytime

Ready to deploy the real smart contract? 🚀`;

    alert(registrationAlert);
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
            AI Agent Domain Names with Smart Pricing
          </p>
          <p className="pricing-summary">
            $5 Regular • $50 Premium • $250 Ultra • Legendary Auctions
          </p>
          
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
                  <span>Wallet Connected: {userAddress}</span>
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
              <h2>Check Domain Pricing</h2>
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
                    maxLength="32"
                  />
                  <span className="domain-suffix">
                    .virtuals.base
                  </span>
                </div>
                <p className="input-hint">
                  💡 Try: single letters (a, x), numbers (123), or keywords (ai, bot, nft)
                </p>
              </div>

              {/* Pricing Result */}
              {pricingInfo && (
                <div className={`pricing-result ${pricingInfo.bgColor} ${pricingInfo.borderColor}`}>
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
                        {price !== 'Auction' && (
                          <p className="usd-equivalent">
                            ≈ ${token === 'USDC' ? price : price === '0.0014' ? '5' : price === '0.014' ? '50' : '250'}
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
                    disabled={!searchName || !walletConnected}
                    className={`register-button ${(!searchName || !walletConnected) ? 'disabled' : ''}`}
                  >
                    {!walletConnected ? 'Connect Wallet to Register' :
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

        {/* Pricing Tiers Overview */}
        <div className="tiers-section">
          <h2 className="section-title">Pricing Tiers</h2>
          
          <div className="tiers-grid">
            {Object.entries(tiers).map(([key, tier]) => (
              <div key={key} className={`tier-card ${tier.bgColor} ${tier.borderColor}`}>
                <div className="tier-content">
                  <div className="tier-icon-large">{tier.icon}</div>
                  <h3 className="tier-title">{tier.name}</h3>
                  <p className="tier-desc">{tier.description}</p>
                  
                  <div className="tier-price">
                    <p className="price-label">USDC Price</p>
                    <p className="price-value">
                      {tier.prices.USDC === 'Auction' ? 'Auction' : `$${tier.prices.USDC}`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Examples Section */}
        <div className="examples-section">
          <div className="examples-card">
            <h2 className="section-title">💡 Pricing Examples</h2>
            
            <div className="examples-grid">
              
              {/* Regular Examples */}
              <div className="example-category">
                <h3 className="category-title">
                  <Sparkles size={20} />
                  Regular ($5)
                </h3>
                <div className="example-list">
                  {['alice', 'myai', 'trading', 'helper', 'agent123'].map(name => (
                    <div 
                      key={name} 
                      className="example-item regular"
                      onClick={() => setSearchName(name)}
                    >
                      {name}.virtuals.base
                    </div>
                  ))}
                </div>
              </div>

              {/* Premium Examples */}
              <div className="example-category">
                <h3 className="category-title">
                  <Star size={20} />
                  Premium ($50)
                </h3>
                <div className="example-list">
                  {['ai', 'nft', 'web3', 'bot', '1234', 'aa'].map(name => (
                    <div 
                      key={name} 
                      className="example-item premium"
                      onClick={() => setSearchName(name)}
                    >
                      {name}.virtuals.base
                    </div>
                  ))}
                </div>
              </div>

              {/* Ultra Examples */}
              <div className="example-category">
                <h3 className="category-title">
                  <Gem size={20} />
                  Ultra ($250)
                </h3>
                <div className="example-list">
                  {['a', 'x', 'z', '1', '7', '123'].map(name => (
                    <div 
                      key={name} 
                      className="example-item ultra"
                      onClick={() => setSearchName(name)}
                    >
                      {name}.virtuals.base
                    </div>
                  ))}
                </div>
              </div>

              {/* Legendary Examples */}
              <div className="example-category">
                <h3 className="category-title">
                  <Crown size={20} />
                  Legendary (Auction)
                </h3>
                <div className="example-list">
                  {['god', 'king', 'alpha', 'genesis', 'zero'].map(name => (
                    <div 
                      key={name} 
                      className="example-item legendary"
                      onClick={() => setSearchName(name)}
                    >
                      {name}.virtuals.base
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="how-it-works">
          <div className="how-card">
            <h2 className="section-title">
              🧠 How Smart Pricing Works
            </h2>
            
            <div className="how-grid">
              <div className="how-item">
                <div className="how-icon">📏</div>
                <h3>Length Matters</h3>
                <p>
                  Shorter = Rarer = More Valuable<br/>
                  1 char = Ultra ($250)<br/>
                  2 char = Premium ($50)<br/>
                  3+ char = Regular ($5)
                </p>
              </div>
              
              <div className="how-item">
                <div className="how-icon">🎯</div>
                <h3>Keywords Premium</h3>
                <p>
                  High-value words automatically detected:<br/>
                  'ai', 'bot', 'nft', 'crypto', 'web3'<br/>
                  Perfect for brands & businesses
                </p>
              </div>
              
              <div className="how-item">
                <div className="how-icon">🔢</div>
                <h3>Patterns & Special</h3>
                <p>
                  Numbers, palindromes, repeating chars<br/>
                  '123', 'aba', 'aaa' = Premium<br/>
                  Legendary names = Auction only
                </p>
              </div>
            </div>

            <div className="cta-section">
              <p className="cta-text">
                <strong>🚀 Ready to get started?</strong><br/>
                Connect your wallet and register your AI agent's perfect domain name!<br/>
                <span className="cta-subtitle">Supports ETH, USDC, and $VIRTUAL tokens</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualsBaseApp;
