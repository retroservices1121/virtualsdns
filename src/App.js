import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Search, User, Settings, Gift, Wallet, DollarSign, Coins } from 'lucide-react';

const MultiPaymentApp = () => {
  const [searchName, setSearchName] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('USDC');
  const [isLoading, setIsLoading] = useState(false);
  const [contract, setContract] = useState(null);
  const [signer, setSigner] = useState(null);
  const [userBalance, setUserBalance] = useState({
    ETH: '0.5',
    USDC: '150',
    VIRTUAL: '5000'
  });

  // Contract configuration
  const REGISTRY_ADDRESS = process.env.REACT_APP_REGISTRY_ADDRESS;
  const REGISTRY_ABI = [
    "function registerWithETH(string memory name) external payable",
    "function registerWithUSDC(string memory name) external",
    "function registerWithVIRTUAL(string memory name) external",
    "function isAvailable(string memory name) view returns (bool)",
    "function nameToAddress(string memory name) view returns (address)",
    "function ethPrice() view returns (uint256)",
    "function usdcPrice() view returns (uint256)",
    "function virtualPrice() view returns (uint256)"
  ];

  const paymentOptions = [
    {
      token: 'ETH',
      price: '0.001',
      symbol: 'Ξ',
      icon: '⚡',
      color: 'bg-blue-500',
      description: 'Native Base token'
    },
    {
      token: 'USDC',
      price: '5.00',
      symbol: '$',
      icon: '💵',
      color: 'bg-green-500',
      description: 'Stable USD coin',
      popular: true
    },
    {
      token: 'VIRTUAL',
      price: '1000',
      symbol: 'V',
      icon: '🤖',
      color: 'bg-purple-500',
      description: 'AI token (Community favorite!)',
      discount: true
    }
  ];

  // Initialize Web3 connection
  useEffect(() => {
    const initWeb3 = async () => {
      if (window.ethereum && REGISTRY_ADDRESS) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contract = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, signer);
          
          setSigner(signer);
          setContract(contract);
        } catch (error) {
          console.error('Failed to initialize Web3:', error);
        }
      }
    };

    initWeb3();
  }, [REGISTRY_ADDRESS]);

  // Connect wallet
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, signer);
        
        setSigner(signer);
        setContract(contract);
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  // Search for domain
  const handleSearch = async () => {
    if (!contract || !searchName) return;
    
    try {
      const isAvailable = await contract.isAvailable(searchName);
      if (isAvailable) {
        alert(`${searchName}.virtuals.base is available!`);
      } else {
        const owner = await contract.nameToAddress(searchName);
        alert(`${searchName}.virtuals.base is owned by: ${owner}`);
      }
    } catch (error) {
      console.error('Search failed:', error);
      alert('Search failed. Please try again.');
    }
  };

  // Register domain
  const handleRegister = async () => {
    if (!contract || !registerName) {
      if (!signer) {
        await connectWallet();
        return;
      }
      return;
    }

    setIsLoading(true);
    
    try {
      let tx;
      
      switch (selectedPayment) {
        case 'ETH':
          const ethPrice = await contract.ethPrice();
          tx = await contract.registerWithETH(registerName, { value: ethPrice });
          break;
        case 'USDC':
          tx = await contract.registerWithUSDC(registerName);
          break;
        case 'VIRTUAL':
          tx = await contract.registerWithVIRTUAL(registerName);
          break;
        default:
          throw new Error('Invalid payment method');
      }
      
      await tx.wait();
      alert(`Successfully registered ${registerName}.virtuals.base!`);
      setRegisterName('');
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedOption = paymentOptions.find(option => option.token === selectedPayment);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4">
            🤖 .virtuals.base
          </h1>
          <p className="text-xl text-purple-200">
            Pay with ETH, USDC, or $VIRTUAL tokens!
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <div className="bg-white/10 px-4 py-2 rounded-lg">
              <span className="text-green-300">⚡ Super cheap on Base</span>
            </div>
            <div className="bg-white/10 px-4 py-2 rounded-lg">
              <span className="text-blue-300">🚀 Multiple payment options</span>
            </div>
            {!signer && (
              <button
                onClick={connectWallet}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-white font-semibold transition-colors"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          
          {/* Search Section */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <Search className="text-purple-300" />
              <h2 className="text-2xl font-bold text-white">Find an AI Agent</h2>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value.toLowerCase())}
                placeholder="alice"
                className="w-full p-3 rounded-lg bg-white/10 border border-white/30 text-white placeholder-purple-300"
              />
              
              <button
                onClick={handleSearch}
                disabled={!searchName}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
              >
                Find Address 🔍
              </button>
            </div>
          </div>

          {/* Register Section with Payment Options */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <Gift className="text-green-300" />
              <h2 className="text-2xl font-bold text-white">Register Your AI</h2>
            </div>
            
            <div className="space-y-6">
              {/* Name Input */}
              <div>
                <label className="block text-purple-200 mb-2">Choose your AI agent name:</label>
                <div className="relative">
                  <input
                    type="text"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value.toLowerCase())}
                    placeholder="myai"
                    className="w-full p-3 rounded-lg bg-white/10 border border-white/30 text-white placeholder-purple-300 pr-32"
                  />
                  <span className="absolute right-3 top-3 text-purple-300">.virtuals.base</span>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div>
                <label className="block text-purple-200 mb-3">Choose payment method:</label>
                <div className="grid grid-cols-1 gap-3">
                  {paymentOptions.map((option) => (
                    <div
                      key={option.token}
                      onClick={() => setSelectedPayment(option.token)}
                      className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedPayment === option.token
                          ? 'border-white bg-white/20'
                          : 'border-white/30 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      {option.popular && (
                        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                          Most Popular
                        </div>
                      )}
                      {option.discount && (
                        <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                          Community Favorite
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full ${option.color} flex items-center justify-center text-white font-bold`}>
                            {option.icon}
                          </div>
                          <div>
                            <div className="text-white font-semibold">{option.token}</div>
                            <div className="text-purple-300 text-sm">{option.description}</div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-white font-bold text-lg">
                            {option.symbol}{option.price}
                          </div>
                          <div className="text-purple-300 text-sm">
                            Balance: {userBalance[option.token]}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Register Button */}
              <button
                onClick={handleRegister}
                disabled={isLoading || !registerName}
                className={`w-full py-4 px-4 rounded-lg font-semibold transition-colors ${
                  selectedOption?.color || 'bg-gray-600'
                } hover:opacity-90 disabled:bg-gray-600 text-white`}
              >
                {isLoading ? (
                  'Registering...'
                ) : !signer ? (
                  'Connect Wallet to Register'
                ) : (
                  `Register for ${selectedOption?.symbol}${selectedOption?.price} ${selectedPayment} ${selectedOption?.icon}`
                )}
              </button>

              {/* Payment Info */}
              <div className="bg-blue-500/20 p-4 rounded-lg border border-blue-500/30">
                <h3 className="text-blue-300 font-semibold mb-2">💡 Payment Benefits:</h3>
                <ul className="text-blue-200 text-sm space-y-1">
                  <li>• ETH: Native Base token, fastest</li>
                  <li>• USDC: Stable value, most popular</li>
                  <li>• $VIRTUAL: AI-focused, community favorite!</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Rest of your existing code... */}
        {/* Business Analytics Dashboard */}
        <div className="mt-12 max-w-6xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              📊 Live Business Metrics
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Revenue by Token */}
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-300" />
                  Revenue by Token
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-purple-300">ETH:</span>
                    <span className="text-white font-mono">$2,450</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-300">USDC:</span>
                    <span className="text-white font-mono">$18,750</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-300">VIRTUAL:</span>
                    <span className="text-white font-mono">$8,200</span>
                  </div>
                </div>
              </div>

              {/* Registrations by Token */}
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-300" />
                  Registrations
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-purple-300">ETH:</span>
                    <span className="text-white font-mono">817</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-300">USDC:</span>
                    <span className="text-white font-mono">6,250</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-300">VIRTUAL:</span>
                    <span className="text-white font-mono">2,733</span>
                  </div>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-yellow-300" />
                  Key Metrics
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-purple-300">Total Revenue:</span>
                    <span className="text-white font-mono">$29,400</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-300">Total Names:</span>
                    <span className="text-white font-mono">9,800</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-300">Avg. Price:</span>
                    <span className="text-white font-mono">$5.00</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue Chart Placeholder */}
            <div className="mt-6 bg-white/5 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">📈 Monthly Revenue Trend</h3>
              <div className="h-32 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded flex items-end justify-center">
                <span className="text-white/70">Revenue growing 📈 $3k → $29k in 6 months!</span>
              </div>
            </div>
          </div>
        </div>

        {/* How Multi-Payment Works */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              💰 Why Multiple Payment Options?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl mb-3">⚡</div>
                <h3 className="text-white font-semibold mb-2">ETH - Speed</h3>
                <p className="text-purple-300 text-sm">
                  Native token, fastest transactions, no token approvals needed
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-4xl mb-3">💵</div>
                <h3 className="text-white font-semibold mb-2">USDC - Stability</h3>
                <p className="text-purple-300 text-sm">
                  Stable $5 price, most popular with businesses and everyday users
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-4xl mb-3">🤖</div>
                <h3 className="text-white font-semibold mb-2">$VIRTUAL - Community</h3>
                <p className="text-purple-300 text-sm">
                  AI ecosystem token, community favorite, aligns with AI agent theme
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiPaymentApp;
