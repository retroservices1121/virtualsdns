import React, { useState, useEffect } from 'react';
import { Send, ArrowRight, Clock, X, Check, Users, Package } from 'lucide-react';

const TransferInterface = () => {
  const [selectedName, setSelectedName] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [transferMode, setTransferMode] = useState('instant'); // instant, safe, batch
  const [userNames, setUserNames] = useState(['alice', 'myai', 'crypto']);
  const [pendingTransfers, setPendingTransfers] = useState([
    { name: 'bob', from: '0x1234...5678', to: 'me', status: 'pending' }
  ]);
  const [batchTransfers, setBatchTransfers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const transferModes = [
    {
      id: 'instant',
      name: 'Instant Transfer',
      icon: '⚡',
      description: 'Transfer immediately (irreversible)',
      color: 'bg-blue-500'
    },
    {
      id: 'safe',
      name: 'Safe Transfer',
      icon: '🛡️',
      description: 'Recipient must accept (recommended for valuable names)',
      color: 'bg-green-500'
    },
    {
      id: 'batch',
      name: 'Batch Transfer',
      icon: '📦',
      description: 'Transfer multiple names at once',
      color: 'bg-purple-500'
    }
  ];

  const handleTransfer = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (transferMode === 'instant') {
      console.log(`Instantly transferred ${selectedName} to ${recipientAddress}`);
      setUserNames(userNames.filter(name => name !== selectedName));
    } else if (transferMode === 'safe') {
      console.log(`Initiated safe transfer of ${selectedName} to ${recipientAddress}`);
      // Add to pending transfers
    }
    
    setSelectedName('');
    setRecipientAddress('');
    setIsLoading(false);
  };

  const addToBatch = () => {
    if (selectedName && recipientAddress) {
      setBatchTransfers([...batchTransfers, { name: selectedName, recipient: recipientAddress }]);
      setSelectedName('');
      setRecipientAddress('');
    }
  };

  const removeBatchItem = (index) => {
    setBatchTransfers(batchTransfers.filter((_, i) => i !== index));
  };

  const executeBatchTransfer = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('Batch transfer executed:', batchTransfers);
    setBatchTransfers([]);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            🔄 Transfer Your .virtuals.base Names
          </h1>
          <p className="text-lg sm:text-xl text-purple-200 max-w-2xl mx-auto">
            Send your AI agent names to other wallets safely and easily!
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
          
          {/* Transfer Form */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <Send className="text-blue-300 w-6 h-6" />
              <h2 className="text-xl sm:text-2xl font-bold text-white">Transfer Names</h2>
            </div>
            
            {/* Transfer Mode Selection */}
            <div className="mb-6">
              <label className="block text-purple-200 mb-3 font-medium">Transfer Method:</label>
              <div className="grid grid-cols-1 gap-3">
                {transferModes.map((mode) => (
                  <div
                    key={mode.id}
                    onClick={() => setTransferMode(mode.id)}
                    className={`p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      transferMode === mode.id
                        ? 'border-white bg-white/20 shadow-lg'
                        : 'border-white/30 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl sm:text-2xl flex-shrink-0">{mode.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-white font-semibold text-sm sm:text-base">{mode.name}</div>
                        <div className="text-purple-300 text-xs sm:text-sm mt-1">{mode.description}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {transferMode !== 'batch' ? (
              <>
                {/* Single Transfer Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-purple-200 mb-2 font-medium text-sm">Select name to transfer:</label>
                    <select
                      value={selectedName}
                      onChange={(e) => setSelectedName(e.target.value)}
                      className="w-full p-3 rounded-lg bg-white/10 border border-white/30 text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
                    >
                      <option value="">Choose a name...</option>
                      {userNames.map((name) => (
                        <option key={name} value={name} className="bg-gray-800">
                          {name}.virtuals.base
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-purple-200 mb-2 font-medium text-sm">Recipient wallet address:</label>
                    <input
                      type="text"
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      placeholder="0x742d35Cc6634C0532925a3b8D40E4..."
                      className="w-full p-3 rounded-lg bg-white/10 border border-white/30 text-white placeholder-purple-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
                    />
                  </div>
                  
                  <button
                    onClick={handleTransfer}
                    disabled={isLoading || !selectedName || !recipientAddress}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Processing...
                      </div>
                    ) : (
                      <>
                        Transfer {transferModes.find(m => m.id === transferMode)?.icon}
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Batch Transfer Form */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-purple-200 mb-2 font-medium text-sm">Name:</label>
                      <select
                        value={selectedName}
                        onChange={(e) => setSelectedName(e.target.value)}
                        className="w-full p-3 rounded-lg bg-white/10 border border-white/30 text-white focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
                      >
                        <option value="">Choose name...</option>
                        {userNames.map((name) => (
                          <option key={name} value={name} className="bg-gray-800">
                            {name}.virtuals.base
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-purple-200 mb-2 font-medium text-sm">Recipient:</label>
                      <input
                        type="text"
                        value={recipientAddress}
                        onChange={(e) => setRecipientAddress(e.target.value)}
                        placeholder="Recipient address..."
                        className="w-full p-3 rounded-lg bg-white/10 border border-white/30 text-white placeholder-purple-300 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
                      />
                    </div>
                  </div>
                  
                  <button
                    onClick={addToBatch}
                    disabled={!selectedName || !recipientAddress}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-semibold transition-colors"
                  >
                    Add to Batch ➕
                  </button>
                </div>
              </>
            )}

            {/* Transfer Tips */}
            <div className="mt-6 bg-yellow-500/20 p-4 rounded-lg border border-yellow-500/30">
              <h3 className="text-yellow-300 font-semibold mb-2 flex items-center gap-2">
                💡 Transfer Tips
              </h3>
              <div className="text-yellow-200 text-sm space-y-1">
                <div className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-0.5">•</span>
                  <span><strong>Instant:</strong> Fast but irreversible</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-0.5">•</span>
                  <span><strong>Safe:</strong> Recipient must accept transfer</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-0.5">•</span>
                  <span><strong>Batch:</strong> Save gas by transferring multiple names</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-0.5">•</span>
                  <span>Always double-check recipient addresses!</span>
                </div>
              </div>
            </div>
          </div>

          {/* Transfer Status & History */}
          <div className="space-y-6">
            
            {/* Pending Transfers */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <Clock className="text-orange-300 w-6 h-6" />
                <h2 className="text-xl sm:text-2xl font-bold text-white">Pending Transfers</h2>
              </div>
              
              {pendingTransfers.length > 0 ? (
                <div className="space-y-3">
                  {pendingTransfers.map((transfer, index) => (
                    <div key={index} className="bg-white/5 rounded-lg p-4 border border-orange-500/30">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="text-white font-semibold">{transfer.name}.virtuals.base</div>
                          <div className="text-orange-300 text-sm break-all">From: {transfer.from}</div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors">
                            Accept ✅
                          </button>
                          <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors">
                            Reject ❌
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-purple-400 mx-auto mb-3 opacity-50" />
                  <p className="text-purple-300">No pending transfers</p>
                </div>
              )}
            </div>

            {/* Batch Transfer Queue */}
            {transferMode === 'batch' && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-6">
                  <Package className="text-purple-300 w-6 h-6" />
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Batch Queue</h2>
                </div>
                
                {batchTransfers.length > 0 ? (
                  <>
                    <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                      {batchTransfers.map((transfer, index) => (
                        <div key={index} className="bg-white/5 rounded-lg p-3 border border-purple-500/30 flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <span className="text-white font-semibold block sm:inline">{transfer.name}.virtuals.base</span>
                            <span className="text-purple-300 text-sm block sm:inline sm:ml-2 break-all">
                              → {transfer.recipient.slice(0,6)}...{transfer.recipient.slice(-4)}
                            </span>
                          </div>
                          <button
                            onClick={() => removeBatchItem(index)}
                            className="text-red-400 hover:text-red-300 flex-shrink-0 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <button
                      onClick={executeBatchTransfer}
                      disabled={isLoading}
                      className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Executing...
                        </div>
                      ) : (
                        <>
                          Execute Batch ({batchTransfers.length} transfers) 🚀
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-purple-400 mx-auto mb-3 opacity-50" />
                    <p className="text-purple-300">Add transfers to batch queue</p>
                  </div>
                )}
              </div>
            )}

            {/* Your Names */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <Users className="text-green-300 w-6 h-6" />
                <h2 className="text-xl sm:text-2xl font-bold text-white">Your Names</h2>
              </div>
              
              <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                {userNames.map((name, index) => (
                  <div key={index} className="bg-white/5 rounded-lg p-3 border border-green-500/30">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-semibold">{name}.virtuals.base</span>
                      <span className="text-green-300 text-sm flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        Owned
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* How Transfer Works */}
        <div className="mt-8 sm:mt-12 max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 text-center">
              🔄 How DNS Transfer Works
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl mb-3">⚡</div>
                <h3 className="text-white font-semibold mb-2">Instant Transfer</h3>
                <p className="text-purple-300 text-sm">
                  Name transfers immediately to recipient. Fast but irreversible - double check the address!
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl sm:text-4xl mb-3">🛡️</div>
                <h3 className="text-white font-semibold mb-2">Safe Transfer</h3>
                <p className="text-purple-300 text-sm">
                  Recipient must accept the transfer. Perfect for valuable names or when you want confirmation.
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl sm:text-4xl mb-3">📦</div>
                <h3 className="text-white font-semibold mb-2">Batch Transfer</h3>
                <p className="text-purple-300 text-sm">
                  Transfer multiple names in one transaction. Save gas fees and time!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferInterface;
