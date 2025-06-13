import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Search, User, Settings, Gift, Wallet, AlertCircle, CheckCircle } from 'lucide-react';

const VirtualsBaseApp = () => {
  const [searchName, setSearchName] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('USDC');
  const [resolvedAddress, setResolvedAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [userNames, setUserNames] = useState([]);
  const [selectedName, setSelectedName] = useState('');
  const [contract, setContract] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [contractPrices, setContractPrices] = useState({
    eth: '0.001',
    usdc: '5.00',
    virtual: '1000'
  });

  // Contract configuration
  const REGISTRY_ADDRESS = process.env.REACT_APP_REGISTRY_ADDRESS;
  const USDC_ADDRESS = process.env.REACT_APP_USDC_ADDRESS;
  const VIRTUAL_ADDRESS = process.env.REACT_APP_VIRTUAL_ADDRESS;
  
  const REGISTRY_ABI = [
    "function registerWithETH(string memory name) external payable",
    "function registerWithUSDC(string memory name) external",
    "function registerWithVIRTUAL(string memory name) external",
    "function isAvailable(string memory name) view returns (bool)",
    "function nameToAddress(string memory name) view returns (address)",
    "function nameToOwner(string memory name) view returns (address)",
    "function ethPrice() view returns (uint256)",
    "function usdcPrice() view returns (uint256)",
    "function virtualPrice() view returns (uint256)",
    "function resolve(string memory name) view returns (address)",
    "function addressToPrimaryName(address addr) view returns (string memory)"
  ];

  const paymentOptions = [
    {
      token: 'ETH',
      price: contractPrices.eth,
      symbol: 'Ξ',
      icon: '⚡',
      color: 'bg-blue-500',
      description: 'Native Base token - Fastest'
    },
    {
      token: 'USDC',
      price: contractPrices.usdc,
      symbol: '$',
      icon: '💵',
      color: 'bg-green-500',
      description: 'Stable USD coin - Most Popular',
      popular: true
    },
    {
      token: 'VIRTUAL',
      price: contractPrices.virtual,
      symbol: 'V',
      icon: '🤖',
      color: 'bg-purple-500',
      description: 'AI ecosystem token'
    }
  ];

  // Initialize Web3 connection
  useEffect(() => {
    const initWeb3 = async () => {
      if (window.ethereum && REGISTRY_ADDRESS) {
        try {
          // Check if already connected
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, signer);
            
            setSigner(signer);
            setContract(contract);
            setIsConnected(true);
            setUserAddress(accounts[0]);
            
            // Load user's names
            loadUserNames(contract, accounts[0]);
            
            // Load contract prices
            loadContractPrices(contract);
          }
        } catch (error) {
          console.error('Failed to initialize Web3:', error);
        }
      }
    };

    initWeb3();
  }, [REGISTRY_ADDRESS]);

  // Load contract prices
  const loadContractPrices = async (contract) => {
    try {
      const [ethPrice, usdcPrice, virtualPrice] = await Promise.all([
        contract.ethPrice(),
        contract.usdcPrice(),
        contract.virtualPrice()
      ]);

      setContractPrices({
        eth: ethers.formatEther(ethPrice),
        usdc: ethers.formatUnits(usdcPrice, 6),
        virtual: ethers.formatEther(virtualPrice)
      });
    } catch (error) {
      console.error('Failed to load contract prices:', error);
    }
  };

  // Load user's registered names
  const loadUserNames = async (contract, address) => {
    try {
      // Get primary name
      const primaryName = await contract.addressToPrimaryName(address);
      if (primaryName) {
        setUserNames([primaryName]);
      }
    } catch (error) {
      console.error('Failed to load user names:', error);
    }
  };

  // Connect wallet
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, signer);
        
        setSigner(signer);
        setContract(contract);
        setIsConnected(true);
        setUserAddress(accounts[0]);
        
        // Load user's names and prices
        loadUserNames(contract, accounts[0]);
        loadContractPrices(contract);
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        alert('Failed to connect wallet. Please try again.');
      }
    } else {
      alert('Please install MetaMask to use this app!');
    }
  };

  // Search for domain
  const handleSearch = async () => {
    if (!searchName.trim()) return;
    
    setIsSearching(true);
    setResolvedAddress('');
    
    try {
      if (contract) {
        // Use contract if available
        const isAvailable = await contract.isAvailable(searchName);
        if (isAvailable) {
          setResolvedAddress(`✅ ${searchName}.virtuals.base is available!`);
        } else {
          const owner = await contract.resolve(searchName);
          setResolvedAddress(`🔗 ${searchName}.virtuals.base → ${owner}`);
        }
      } else {
        // Fallback demo behavior
        if (searchName === 'alice') {
          setResolvedAddress('🔗 alice.virtuals.base → 0x742d35Cc6634C0532925a3b8D40E4...');
        } else {
          setResolvedAddress('✅ Available for registration!');
        }
      }
    } catch (error) {
      console.error('Search failed:', error);
      setResolvedAddress('❌ Search failed. Please try again.');
    }
    
    setIsSearching(false);
  };

  // Register domain
  const handleRegister = async () => {
    if (!registerName.trim()) return;
    
    if (!isConnected) {
      await connectWallet();
      return;
    }

    if (!contract) {
      alert('Please connect your wallet first!');
      return;
    }

    setIsLoading(true);
    
    try {
      // Check if name is available
      const isAvailable = await contract.isAvailable(registerName);
      if (!isAvailable) {
        alert(`Sorry, ${registerName}.virtuals.base is already taken!`);
        setIsLoading(false);
        return;
      }

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
      
      // Success!
      alert(`🎉 Successfully registered ${registerName}.virtuals.base!`);
      setUserNames([...userNames, registerName]);
      setRegisterName('');
      
    } catch (error) {
      console.error('Registration failed:', error);
      
      if (error.code === 'ACTION_REJECTED') {
        alert('Transaction was cancelled.');
      } else if (error.message.includes('insufficient funds')) {
        alert('Insufficient funds for registration.');
      } else {
        alert('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      action();
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
            Your AI Agent Identity on Base Network
          </p>
          <p className="text-sm text-purple-300 mt-2">
            Like having a nickname for your robot friend's wallet address!
          </p>
          
          {/* Connection Status */}
          <div className="flex justify-center gap-4 mt-6">
            <div className="bg-white/10 px-4 py-2 rounded-lg">
              <span className="text-green-300">⚡ Super cheap on Base</span>
            </div>
            <div className="bg-white/10 px-4 py-2 rounded-lg">
              <span className="text-blue-300">🚀 Multiple payment options</span>
            </div>
            {!isConnected ? (
              <button
                onClick={connectWallet}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-white font-semibold transition-colors flex items-center gap-2"
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </button>
            ) : (
              <div className="bg-green-600/20 px-4 py-2 rounded-lg border border-green-600/30 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-300" />
                <span className="text-green-300 text-sm">
                  Connected: {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                </span>
              </div>
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
              <div>
                <label className="block text-purple-200 mb-2">Search for a .virtuals.base name:</label>
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value.toLowerCase())}
                  onKeyPress={(e) => handleKeyPress(e, handleSearch)}
                  placeholder="alice"
                  className="w-full p-3 rounded-lg bg-white/10 border border-white/30 text-white placeholder-purple-300"
                />
                <p className="text-sm text-purple-300 mt-1">
                  🔍 Like looking up someone in a phone book!
                </p>
              </div>
              
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchName.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
              >
                {isSearching ? 'Searching...' : 'Find Address 🔍'}
              </button>
              
              {resolvedAddress && (
                <div className={`mt-4 p-4 rounded-lg border ${
                  resolvedAddress.includes('available') || resolvedAddress.includes('✅')
                    ? 'bg-green-500/20 border-green-500/30'
                    : resolvedAddress.includes('❌')
                    ? 'bg-red-500/20 border-red-500/30'
                    : 'bg-blue-500/20 border-blue-500/30'
                }`}>
                  <p className={`font-mono text-sm break-all ${
                    resolvedAddress.includes('available') || resolvedAddress.includes('✅')
                      ? 'text-green-300'
                      : resolvedAddress.includes('❌')
                      ? 'text-red-300'
                      : 'text-blue-300'
                  }`}>
                    {resolvedAddress}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Register Section */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <Gift className="text-green-300" />
              <h2 className="text-2xl font-bold text-white">Register Your AI</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-purple-200 mb-2">Choose your AI agent name:</label>
                <div className="relative">
                  <input
                    type="text"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value.toLowerCase())}
                    onKeyPress={(e) => handleKeyPress(e, handleRegister)}
                    placeholder="myai"
                    className="w-full p-3 rounded-lg bg-white/10 border border-white/30 text-white placeholder-purple-300 pr-32"
                  />
                  <span className="absolute right-3 top-3 text-purple-300">.virtuals.base</span>
                </div>
                <p className="text-sm text-purple-300 mt-1">
                  🏷️ Like getting a name tag for your AI friend!
                </p>
              </div>

              {/* Payment Method Selection */}
              <div>
                <label className="block text-purple-200 mb-3">Choose payment method:</label>
                <div className="grid grid-cols-1 gap-2">
                  {paymentOptions.map((option) => (
                    <div
                      key={option.token}
                      onClick={() => setSelectedPayment(option.token)}
                      className={`relative p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedPayment === option.token
                          ? 'border-white bg-white/20'
                          : 'border-white/30 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      {option.popular && (
                        <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                          Popular
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${option.color} flex items-center justify-center text-white font-bold text-sm`}>
                            {option.icon}
                          </div>
                          <div>
                            <div className="text-white font-semibold">{option.token}</div>
                            <div className="text-purple-300 text-sm">{option.description}</div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-white font-bold">
                            {option.symbol}{option.price}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <button
                onClick={handleRegister}
                disabled={isLoading || !registerName.trim()}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                  selectedOption?.color || 'bg-gray-600'
                } hover:opacity-90 disabled:bg-gray-600 text-white`}
              >
                {isLoading ? (
                  'Registering...'
                ) : !isConnected ? (
                  'Connect Wallet to Register'
                ) : (
                  `Register for ${selectedOption?.symbol}${selectedOption?.price} ${selectedPayment} ${selectedOption?.icon}`
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Your Names Section */}
        {isConnected && userNames.length > 0 && (
          <div className="mt-12 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <User className="text-yellow-300" />
                <h2 className="text-2xl font-bold text-white">Your AI Agents</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userNames.map((name, index) => (
                  <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-white/30 transition-colors cursor-pointer"
                       onClick={() => setSelectedName(selectedName === name ? '' : name)}>
                    <div className="flex items-center justify-between">
                      <span className="text-white font-semibold">{name}.virtuals.base</span>
                      <Settings className="text-purple-300 w-4 h-4" />
                    </div>
                    
                    {selectedName === name && (
                      <div className="mt-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-purple-300">Points to:</span>
                          <span className="text-white font-mono">{userAddress.slice(0, 6)}...{userAddress.slice(-4)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-300">Avatar:</span>
                          <span className="text-white">🤖</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-300">Status:</span>
                          <span className="text-green-300">Active</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <p className="text-purple-300 text-sm mt-4 text-center">
                👆 Click on any name to see details and settings
              </p>
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              🎓 How It Works (Explained Like You're 5!)
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl mb-3">📝</div>
                <h3 className="text-white font-semibold mb-2">1. Register</h3>
                <p className="text-purple-300 text-sm">
                  Pick a nickname for your AI agent, like getting a name tag!
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-4xl mb-3">🔗</div>
                <h3 className="text-white font-semibold mb-2">2. Connect</h3>
                <p className="text-purple-300 text-sm">
                  Your nickname points to your wallet address, like a shortcut!
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-4xl mb-3">🚀</div>
                <h3 className="text-white font-semibold mb-2">3. Use</h3>
                <p className="text-purple-300 text-sm">
                  Send money to "alice.virtuals.base" instead of long addresses!
                </p>
              </div>
            </div>
            
            <div className="mt-8 bg-yellow-500/20 p-4 rounded-lg border border-yellow-500/30">
              <p className="text-yellow-300 text-center">
                💡 <strong>Think of it like this:</strong> Instead of saying "Please send money to 0x742d35Cc6634C0532925a3b8D40E4..." 
                you can just say "Send money to alice.virtuals.base" - much easier to remember!
              </p>
            </div>
          </div>
        </div>

        {/* Contract Info */}
        <div className="mt-8 text-center">
          <div className="inline-block bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-white/20">
            <div className="flex items-center gap-2 text-purple-300">
              <Wallet className="w-4 h-4" />
              <span className="text-sm font-mono">
                Contract: {REGISTRY_ADDRESS ? `${REGISTRY_ADDRESS.slice(0, 10)}...` : 'Not configured'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualsBaseApp;
