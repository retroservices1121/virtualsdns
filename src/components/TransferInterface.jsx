import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Send, ArrowRight, Clock, X, Check, Users, Package, AlertCircle, 
  Copy, ExternalLink, Shield, Zap, Eye, EyeOff, Search, Filter,
  CheckCircle, XCircle, Loader, Bell, History, Settings, Info,
  ChevronDown, ChevronUp, RefreshCw, Download, Upload
} from 'lucide-react';
import { useWallet } from './WalletProvider';
import { useDashboardData } from './dashboard-api';
import { 
  validateDomainName, 
  isValidAddress, 
  formatAddress, 
  copyToClipboard, 
  formatTimeAgo,
  generateTransactionLink 
} from './utils/helpers';

const TransferInterface = () => {
  // Wallet integration
  const { address, isConnected, isCorrectNetwork, connector, contracts } = useWallet();
  
  // State management
  const [selectedName, setSelectedName] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [transferMode, setTransferMode] = useState('safe'); // Default to safe mode
  const [userNames, setUserNames] = useState([]);
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [batchTransfers, setBatchTransfers] = useState([]);
  const [transferHistory, setTransferHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [gasEstimate, setGasEstimate] = useState(null);
  const [addressBook, setAddressBook] = useState([]);
  const [showAddressBook, setShowAddressBook] = useState(false);
  const [transferNote, setTransferNote] = useState('');
  const [confirmationStep, setConfirmationStep] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    pending: true,
    batch: true,
    owned: true,
    history: false
  });

  // Enhanced transfer modes
  const transferModes = [
    {
      id: 'safe',
      name: 'Safe Transfer',
      icon: '🛡️',
      description: 'Recipient must accept (recommended for valuable names)',
      color: 'bg-green-500',
      gasMultiplier: 1.2,
      recommended: true
    },
    {
      id: 'instant',
      name: 'Instant Transfer',
      icon: '⚡',
      description: 'Transfer immediately (irreversible)',
      color: 'bg-blue-500',
      gasMultiplier: 1.0,
      warning: 'Cannot be reversed'
    },
    {
      id: 'batch',
      name: 'Batch Transfer',
      icon: '📦',
      description: 'Transfer multiple names at once',
      color: 'bg-purple-500',
      gasMultiplier: 0.7,
      efficiency: 'Save up to 50% gas'
    }
  ];

  // Load user data
  useEffect(() => {
    if (isConnected && address) {
      loadUserData();
    }
  }, [isConnected, address]);

  // Gas estimation
  useEffect(() => {
    if (selectedName && recipientAddress && isValidAddress(recipientAddress)) {
      estimateGas();
    }
  }, [selectedName, recipientAddress, transferMode]);

  const loadUserData = async () => {
    try {
      // Load user's domains
      const domains = await fetchUserDomains(address);
      setUserNames(domains);
      
      // Load pending transfers
      const pending = await fetchPendingTransfers(address);
      setPendingTransfers(pending);
      
      // Load transfer history
      const history = await fetchTransferHistory(address);
      setTransferHistory(history);
      
      // Load address book
      const savedAddresses = localStorage.getItem(`addressBook_${address}`);
      if (savedAddresses) {
        setAddressBook(JSON.parse(savedAddresses));
      }
    } catch (error) {
      addNotification('Failed to load user data', 'error');
    }
  };

  const estimateGas = async () => {
    try {
      // Estimate gas for the transfer
      const estimate = await contracts.registry.estimateGas.transfer(selectedName, recipientAddress);
      const mode = transferModes.find(m => m.id === transferMode);
      const adjustedEstimate = estimate.mul(Math.floor(mode.gasMultiplier * 100)).div(100);
      setGasEstimate(adjustedEstimate);
    } catch (error) {
      console.error('Gas estimation failed:', error);
    }
  };

  const addNotification = useCallback((message, type = 'info', txHash = null) => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toISOString(),
      txHash
    };
    setNotifications(prev => [notification, ...prev.slice(0, 4)]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  }, []);

  // Enhanced transfer logic
  const handleTransfer = async () => {
    if (!isConnected || !isCorrectNetwork) {
      addNotification('Please connect wallet and switch to Base network', 'error');
      return;
    }

    if (!validateInputs()) return;

    if (!confirmationStep) {
      setConfirmationStep(true);
      return;
    }

    setIsLoading(true);
    setConfirmationStep(false);

    try {
      let txHash;
      
      if (transferMode === 'instant') {
        txHash = await executeInstantTransfer();
      } else if (transferMode === 'safe') {
        txHash = await executeSafeTransfer();
      }

      if (txHash) {
        addNotification(`Transfer initiated successfully!`, 'success', txHash);
        
        // Update local state
        if (transferMode === 'instant') {
          setUserNames(prev => prev.filter(name => name !== selectedName));
        }
        
        // Add to history
        addToTransferHistory({
          name: selectedName,
          recipient: recipientAddress,
          mode: transferMode,
          status: transferMode === 'instant' ? 'completed' : 'pending',
          txHash,
          note: transferNote
        });

        // Save to address book if new
        saveToAddressBook(recipientAddress);
        
        // Reset form
        resetForm();
      }
    } catch (error) {
      console.error('Transfer failed:', error);
      addNotification(`Transfer failed: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const executeInstantTransfer = async () => {
    const tx = await contracts.registry.transfer(selectedName, recipientAddress);
    return tx.hash;
  };

  const executeSafeTransfer = async () => {
    const tx = await contracts.registry.initiateTransfer(selectedName, recipientAddress);
    return tx.hash;
  };

  const validateInputs = () => {
    if (!selectedName) {
      addNotification('Please select a domain name', 'error');
      return false;
    }

    if (!recipientAddress) {
      addNotification('Please enter recipient address', 'error');
      return false;
    }

    if (!isValidAddress(recipientAddress)) {
      addNotification('Invalid recipient address', 'error');
      return false;
    }

    if (recipientAddress.toLowerCase() === address.toLowerCase()) {
      addNotification('Cannot transfer to yourself', 'error');
      return false;
    }

    return true;
  };

  const addToBatch = () => {
    if (!validateInputs()) return;

    const existingIndex = batchTransfers.findIndex(
      transfer => transfer.name === selectedName
    );

    if (existingIndex >= 0) {
      addNotification('Domain already in batch queue', 'warning');
      return;
    }

    setBatchTransfers(prev => [...prev, { 
      id: Date.now(),
      name: selectedName, 
      recipient: recipientAddress,
      note: transferNote
    }]);
    
    resetForm();
    addNotification('Added to batch queue', 'success');
  };

  const removeBatchItem = (id) => {
    setBatchTransfers(prev => prev.filter(transfer => transfer.id !== id));
  };

  const executeBatchTransfer = async () => {
    if (batchTransfers.length === 0) return;

    setIsLoading(true);
    
    try {
      const names = batchTransfers.map(t => t.name);
      const recipients = batchTransfers.map(t => t.recipient);
      
      const tx = await contracts.registry.batchTransfer(names, recipients);
      
      addNotification(`Batch transfer initiated for ${batchTransfers.length} domains!`, 'success', tx.hash);
      
      // Add to history
      batchTransfers.forEach(transfer => {
        addToTransferHistory({
          ...transfer,
          mode: 'batch',
          status: 'completed',
          txHash: tx.hash
        });
      });

      setBatchTransfers([]);
    } catch (error) {
      console.error('Batch transfer failed:', error);
      addNotification(`Batch transfer failed: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePendingTransfer = async (transferId, action) => {
    setIsLoading(true);
    
    try {
      let tx;
      if (action === 'accept') {
        tx = await contracts.registry.acceptTransfer(transferId);
        addNotification('Transfer accepted successfully!', 'success', tx.hash);
      } else {
        tx = await contracts.registry.rejectTransfer(transferId);
        addNotification('Transfer rejected', 'info', tx.hash);
      }

      // Update pending transfers
      setPendingTransfers(prev => 
        prev.filter(transfer => transfer.id !== transferId)
      );
    } catch (error) {
      addNotification(`Failed to ${action} transfer: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedName('');
    setRecipientAddress('');
    setTransferNote('');
    setConfirmationStep(false);
  };

  const saveToAddressBook = (address) => {
    const existing = addressBook.find(entry => entry.address.toLowerCase() === address.toLowerCase());
    if (!existing) {
      const newEntry = {
        address,
        label: `Contact ${addressBook.length + 1}`,
        addedAt: new Date().toISOString()
      };
      const updated = [...addressBook, newEntry];
      setAddressBook(updated);
      localStorage.setItem(`addressBook_${address}`, JSON.stringify(updated));
    }
  };

  const addToTransferHistory = (transfer) => {
    const historyEntry = {
      id: Date.now(),
      ...transfer,
      timestamp: new Date().toISOString()
    };
    setTransferHistory(prev => [historyEntry, ...prev.slice(0, 49)]); // Keep last 50
  };

  // Filtered data
  const filteredNames = useMemo(() => {
    return userNames.filter(name => {
      if (searchQuery && !name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [userNames, searchQuery]);

  const filteredHistory = useMemo(() => {
    return transferHistory.filter(transfer => {
      if (selectedFilter === 'all') return true;
      if (selectedFilter === 'sent') return transfer.from === address;
      if (selectedFilter === 'received') return transfer.to === address;
      return transfer.status === selectedFilter;
    });
  }, [transferHistory, selectedFilter, address]);

  // Loading state
  if (!isConnected) {
    return <WalletConnectionPrompt />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Notifications */}
        <NotificationCenter notifications={notifications} onDismiss={(id) => 
          setNotifications(prev => prev.filter(n => n.id !== id))
        } />
        
        {/* Enhanced Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            🔄 Transfer Your .virtuals.base Names
          </h1>
          <p className="text-lg sm:text-xl text-purple-200 max-w-2xl mx-auto mb-6">
            Send your AI agent names to other wallets safely and easily!
          </p>
          
          {/* Connection Status */}
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${isCorrectNetwork ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
              <div className={`w-2 h-2 rounded-full ${isCorrectNetwork ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`}></div>
              {isCorrectNetwork ? 'Base Network' : 'Wrong Network'}
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300">
              <Wallet className="w-4 h-4" />
              {connector?.name}
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300">
              <Users className="w-4 h-4" />
              {userNames.length} domains
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
          
          {/* Enhanced Transfer Form */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Send className="text-blue-300 w-6 h-6" />
                <h2 className="text-xl sm:text-2xl font-bold text-white">Transfer Names</h2>
              </div>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-purple-400 hover:text-purple-300 flex items-center gap-1 text-sm"
              >
                <Settings className="w-4 h-4" />
                {showAdvanced ? 'Simple' : 'Advanced'}
              </button>
            </div>
            
            {/* Transfer Mode Selection */}
            <div className="mb-6">
              <label className="block text-purple-200 mb-3 font-medium">Transfer Method:</label>
              <div className="grid grid-cols-1 gap-3">
                {transferModes.map((mode) => (
                  <TransferModeOption
                    key={mode.id}
                    mode={mode}
                    isSelected={transferMode === mode.id}
                    onSelect={() => setTransferMode(mode.id)}
                    gasEstimate={gasEstimate}
                  />
                ))}
              </div>
            </div>

            {/* Confirmation Dialog */}
            {confirmationStep && (
              <ConfirmationDialog
                selectedName={selectedName}
                recipientAddress={recipientAddress}
                transferMode={transferMode}
                gasEstimate={gasEstimate}
                onConfirm={handleTransfer}
                onCancel={() => setConfirmationStep(false)}
                isLoading={isLoading}
              />
            )}

            {transferMode !== 'batch' ? (
              <SingleTransferForm
                selectedName={selectedName}
                setSelectedName={setSelectedName}
                recipientAddress={recipientAddress}
                setRecipientAddress={setRecipientAddress}
                transferNote={transferNote}
                setTransferNote={setTransferNote}
                userNames={filteredNames}
                addressBook={addressBook}
                showAddressBook={showAddressBook}
                setShowAddressBook={setShowAddressBook}
                showAdvanced={showAdvanced}
                gasEstimate={gasEstimate}
                isLoading={isLoading}
                onTransfer={handleTransfer}
                transferMode={transferMode}
              />
            ) : (
              <BatchTransferForm
                selectedName={selectedName}
                setSelectedName={setSelectedName}
                recipientAddress={recipientAddress}
                setRecipientAddress={setRecipientAddress}
                transferNote={transferNote}
                setTransferNote={setTransferNote}
                userNames={filteredNames}
                onAddToBatch={addToBatch}
                showAdvanced={showAdvanced}
              />
            )}

            {/* Enhanced Transfer Tips */}
            <TransferTips />
          </div>

          {/* Enhanced Transfer Status & Management */}
          <div className="space-y-6">
            
            {/* Pending Transfers */}
            <CollapsibleSection
              title="Pending Transfers"
              icon={Clock}
              iconColor="text-orange-300"
              count={pendingTransfers.length}
              isExpanded={expandedSections.pending}
              onToggle={() => setExpandedSections(prev => ({...prev, pending: !prev.pending}))}
            >
              <PendingTransfersList
                transfers={pendingTransfers}
                onHandle={handlePendingTransfer}
                isLoading={isLoading}
              />
            </CollapsibleSection>

            {/* Batch Queue */}
            {transferMode === 'batch' && (
              <CollapsibleSection
                title="Batch Queue"
                icon={Package}
                iconColor="text-purple-300"
                count={batchTransfers.length}
                isExpanded={expandedSections.batch}
                onToggle={() => setExpandedSections(prev => ({...prev, batch: !prev.batch}))}
              >
                <BatchQueue
                  transfers={batchTransfers}
                  onRemove={removeBatchItem}
                  onExecute={executeBatchTransfer}
                  isLoading={isLoading}
                />
              </CollapsibleSection>
            )}

            {/* Your Names */}
            <CollapsibleSection
              title="Your Names"
              icon={Users}
              iconColor="text-green-300"
              count={userNames.length}
              isExpanded={expandedSections.owned}
              onToggle={() => setExpandedSections(prev => ({...prev, owned: !prev.owned}))}
              actions={
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-purple-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1 bg-white/10 border border-white/20 rounded text-white placeholder-purple-300 text-sm w-32"
                    />
                  </div>
                </div>
              }
            >
              <OwnedNamesList names={filteredNames} />
            </CollapsibleSection>

            {/* Transfer History */}
            <CollapsibleSection
              title="Transfer History"
              icon={History}
              iconColor="text-blue-300"
              count={transferHistory.length}
              isExpanded={expandedSections.history}
              onToggle={() => setExpandedSections(prev => ({...prev, history: !prev.history}))}
              actions={
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
                >
                  <option value="all">All</option>
                  <option value="sent">Sent</option>
                  <option value="received">Received</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              }
            >
              <TransferHistoryList history={filteredHistory} currentAddress={address} />
            </CollapsibleSection>
          </div>
        </div>

        {/* How Transfer Works */}
        <TransferExplanation />
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENT DEFINITIONS
// ============================================================================

function WalletConnectionPrompt() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center max-w-md">
        <Wallet className="w-16 h-16 text-purple-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
        <p className="text-purple-300 mb-6">
          Please connect your wallet to access the transfer interface and manage your .virtuals.base domains.
        </p>
        <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
          Connect Wallet
        </button>
      </div>
    </div>
  );
}

function NotificationCenter({ notifications, onDismiss }) {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <NotificationItem 
          key={notification.id} 
          notification={notification} 
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}

function NotificationItem({ notification, onDismiss }) {
  const typeStyles = {
    success: 'bg-green-500/20 border-green-500/30 text-green-300',
    error: 'bg-red-500/20 border-red-500/30 text-red-300',
    info: 'bg-blue-500/20 border-blue-500/30 text-blue-300',
    warning: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300'
  };

  const icons = {
    success: CheckCircle,
    error: XCircle,
    info: Bell,
    warning: AlertCircle
  };

  const Icon = icons[notification.type] || Bell;

  return (
    <div className={`${typeStyles[notification.type]} p-4 rounded-lg border backdrop-blur-lg max-w-sm animate-in slide-in-from-right duration-300`}>
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium">{notification.message}</p>
          {notification.txHash && (
            <a
              href={generateTransactionLink(notification.txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs opacity-70 hover:opacity-100 flex items-center gap-1 mt-1"
            >
              View transaction <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <p className="text-xs opacity-70 mt-1">
            {formatTimeAgo(notification.timestamp)}
          </p>
        </div>
        <button
          onClick={() => onDismiss(notification.id)}
          className="text-current opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function TransferModeOption({ mode, isSelected, onSelect, gasEstimate }) {
  return (
    <div
      onClick={onSelect}
      className={`p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all ${
        isSelected
          ? 'border-white bg-white/20 shadow-lg'
          : 'border-white/30 bg-white/5 hover:bg-white/10'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl sm:text-2xl flex-shrink-0">{mode.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white font-semibold text-sm sm:text-base">{mode.name}</span>
            {mode.recommended && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-medium">
                Recommended
              </span>
            )}
            {mode.warning && (
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-medium">
                {mode.warning}
              </span>
            )}
            {mode.efficiency && (
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full font-medium">
                {mode.efficiency}
              </span>
            )}
          </div>
          <div className="text-purple-300 text-xs sm:text-sm">{mode.description}</div>
          {gasEstimate && isSelected && (
            <div className="text-xs text-purple-400 mt-1">
              Estimated gas: {Math.floor(gasEstimate.toNumber() * mode.gasMultiplier).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConfirmationDialog({ selectedName, recipientAddress, transferMode, gasEstimate, onConfirm, onCancel, isLoading }) {
  const mode = transferModes.find(m => m.id === transferMode);
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 max-w-md w-full">
        <div className="text-center mb-6">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Confirm Transfer</h3>
          <p className="text-purple-300 text-sm">Please review the transfer details carefully</p>
        </div>
        
        <div className="space-y-4 mb-6">
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-purple-300 text-sm">Domain</div>
            <div className="text-white font-semibold">{selectedName}.virtuals.base</div>
          </div>
          
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-purple-300 text-sm">Recipient</div>
            <div className="text-white font-mono text-sm break-all">{recipientAddress}</div>
          </div>
          
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-purple-300 text-sm">Method</div>
            <div className="text-white font-semibold flex items-center gap-2">
              {mode?.icon} {mode?.name}
            </div>
          </div>
          
          {gasEstimate && (
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-purple-300 text-sm">Estimated Gas</div>
              <div className="text-white font-semibold">{gasEstimate.toNumber().toLocaleString()}</div>
            </div>
          )}
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-500 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Confirm Transfer'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function SingleTransferForm({ 
  selectedName, setSelectedName, recipientAddress, setRecipientAddress,
  transferNote, setTransferNote, userNames, addressBook, showAddressBook, 
  setShowAddressBook, showAdvanced, gasEstimate, isLoading, onTransfer, transferMode 
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyRecipient = async () => {
    if (recipientAddress) {
      const success = await copyToClipboard(recipientAddress);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  return (
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
        <div className="flex items-center justify-between mb-2">
          <label className="text-purple-200 font-medium text-sm">Recipient wallet address:</label>
          <button
            onClick={() => setShowAddressBook(!showAddressBook)}
            className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1"
          >
            <Users className="w-4 h-4" />
            Address Book
          </button>
        </div>
        
        <div className="relative">
          <input
            type="text"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            placeholder="0x742d35Cc6634C0532925a3b8D40E4..."
            className="w-full p-3 pr-10 rounded-lg bg-white/10 border border-white/30 text-white placeholder-purple-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
          />
          {recipientAddress && (
            <button
              onClick={handleCopyRecipient}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-purple-300"
            >
              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          )}
        </div>
        
        {/* Address validation */}
        {recipientAddress && (
          <div className="mt-1 text-xs">
            {isValidAddress(recipientAddress) ? (
              <span className="text-green-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Valid address
              </span>
            ) : (
              <span className="text-red-400 flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                Invalid address format
              </span>
            )}
          </div>
        )}
        
        {/* Address Book */}
        {showAddressBook && addressBook.length > 0 && (
          <div className="mt-2 bg-white/5 rounded-lg p-3 max-h-32 overflow-y-auto">
            {addressBook.map((contact, index) => (
              <button
                key={index}
                onClick={() => {
                  setRecipientAddress(contact.address);
                  setShowAddressBook(false);
                }}
                className="w-full text-left p-2 hover:bg-white/10 rounded text-sm"
              >
                <div className="text-white font-medium">{contact.label}</div>
                <div className="text-purple-300 font-mono text-xs">{formatAddress(contact.address)}</div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Advanced options */}
      {showAdvanced && (
        <div>
          <label className="block text-purple-200 mb-2 font-medium text-sm">Transfer note (optional):</label>
          <textarea
            value={transferNote}
            onChange={(e) => setTransferNote(e.target.value)}
            placeholder="Add a note for this transfer..."
            rows={2}
            className="w-full p-3 rounded-lg bg-white/10 border border-white/30 text-white placeholder-purple-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20 resize-none"
          />
        </div>
      )}
      
      {/* Gas estimate */}
      {gasEstimate && selectedName && recipientAddress && (
        <div className="bg-blue-500/20 p-3 rounded-lg border border-blue-500/30">
          <div className="text-blue-300 text-sm flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Estimated gas: {gasEstimate.toNumber().toLocaleString()} units
          </div>
        </div>
      )}
      
      <button
        onClick={onTransfer}
        disabled={isLoading || !selectedName || !recipientAddress || !isValidAddress(recipientAddress)}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader className="w-4 h-4 animate-spin" />
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
  );
}

function BatchTransferForm({ 
  selectedName, setSelectedName, recipientAddress, setRecipientAddress,
  transferNote, setTransferNote, userNames, onAddToBatch, showAdvanced 
}) {
  return (
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
      
      {showAdvanced && (
        <div>
          <label className="block text-purple-200 mb-2 font-medium text-sm">Note:</label>
          <input
            type="text"
            value={transferNote}
            onChange={(e) => setTransferNote(e.target.value)}
            placeholder="Transfer note..."
            className="w-full p-3 rounded-lg bg-white/10 border border-white/30 text-white placeholder-purple-300 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
          />
        </div>
      )}
      
      <button
        onClick={onAddToBatch}
        disabled={!selectedName || !recipientAddress || !isValidAddress(recipientAddress)}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-semibold transition-colors"
      >
        Add to Batch ➕
      </button>
    </div>
  );
}

function TransferTips() {
  return (
    <div className="mt-6 bg-yellow-500/20 p-4 rounded-lg border border-yellow-500/30">
      <h3 className="text-yellow-300 font-semibold mb-3 flex items-center gap-2">
        💡 Transfer Tips
      </h3>
      <div className="text-yellow-200 text-sm space-y-2">
        <div className="flex items-start gap-2">
          <span className="text-yellow-400 mt-0.5">•</span>
          <span><strong>Safe Transfer:</strong> Recommended for valuable domains - recipient must accept</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-yellow-400 mt-0.5">•</span>
          <span><strong>Instant Transfer:</strong> Fast but irreversible - double-check addresses!</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-yellow-400 mt-0.5">•</span>
          <span><strong>Batch Transfer:</strong> Save up to 50% gas fees for multiple domains</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-yellow-400 mt-0.5">•</span>
          <span><strong>Address Book:</strong> Save frequently used addresses for quick access</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-yellow-400 mt-0.5">•</span>
          <span><strong>Gas Estimates:</strong> Actual costs may vary based on network congestion</span>
        </div>
      </div>
    </div>
  );
}

function CollapsibleSection({ title, icon: Icon, iconColor, count, isExpanded, onToggle, children, actions }) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20">
      <div 
        className="flex items-center justify-between p-4 sm:p-6 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <Icon className={`${iconColor} w-6 h-6`} />
          <h2 className="text-xl sm:text-2xl font-bold text-white">{title}</h2>
          {count > 0 && (
            <span className="bg-purple-500 text-white text-sm px-2 py-1 rounded-full">
              {count}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {actions}
          {isExpanded ? <ChevronUp className="w-5 h-5 text-purple-400" /> : <ChevronDown className="w-5 h-5 text-purple-400" />}
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
          {children}
        </div>
      )}
    </div>
  );
}

function PendingTransfersList({ transfers, onHandle, isLoading }) {
  if (transfers.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-12 h-12 text-purple-400 mx-auto mb-3 opacity-50" />
        <p className="text-purple-300">No pending transfers</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transfers.map((transfer) => (
        <div key={transfer.id} className="bg-white/5 rounded-lg p-4 border border-orange-500/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-white font-semibold">{transfer.name}.virtuals.base</div>
              <div className="text-orange-300 text-sm">From: {formatAddress(transfer.from)}</div>
              {transfer.note && (
                <div className="text-purple-300 text-xs mt-1">Note: {transfer.note}</div>
              )}
              <div className="text-purple-400 text-xs mt-1">
                {formatTimeAgo(transfer.timestamp)}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button 
                onClick={() => onHandle(transfer.id, 'accept')}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
              >
                {isLoading ? <Loader className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                Accept
              </button>
              <button 
                onClick={() => onHandle(transfer.id, 'reject')}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
              >
                {isLoading ? <Loader className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                Reject
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function BatchQueue({ transfers, onRemove, onExecute, isLoading }) {
  if (transfers.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="w-12 h-12 text-purple-400 mx-auto mb-3 opacity-50" />
        <p className="text-purple-300">Add transfers to batch queue</p>
      </div>
    );
  }

  const totalGasSavings = Math.floor((transfers.length - 1) * 30); // Estimated 30% savings per additional transfer

  return (
    <>
      <div className="bg-purple-500/20 p-3 rounded-lg border border-purple-500/30 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-purple-300">Estimated gas savings:</span>
          <span className="text-purple-200 font-semibold">{totalGasSavings}%</span>
        </div>
      </div>
      
      <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
        {transfers.map((transfer) => (
          <div key={transfer.id} className="bg-white/5 rounded-lg p-3 border border-purple-500/30 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-white font-semibold block sm:inline">{transfer.name}.virtuals.base</span>
              <span className="text-purple-300 text-sm block sm:inline sm:ml-2">
                → {formatAddress(transfer.recipient)}
              </span>
              {transfer.note && (
                <div className="text-purple-400 text-xs mt-1">Note: {transfer.note}</div>
              )}
            </div>
            <button
              onClick={() => onRemove(transfer.id)}
              className="text-red-400 hover:text-red-300 flex-shrink-0 p-1 hover:bg-red-500/20 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      
      <button
        onClick={onExecute}
        disabled={isLoading}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader className="w-4 h-4 animate-spin" />
            Executing...
          </div>
        ) : (
          <>
            Execute Batch ({transfers.length} transfers) 🚀
          </>
        )}
      </button>
    </>
  );
}

function OwnedNamesList({ names }) {
  if (names.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="w-12 h-12 text-purple-400 mx-auto mb-3 opacity-50" />
        <p className="text-purple-300">No domains found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
      {names.map((name, index) => (
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
  );
}

function TransferHistoryList({ history, currentAddress }) {
  if (history.length === 0) {
    return (
      <div className="text-center py-8">
        <History className="w-12 h-12 text-purple-400 mx-auto mb-3 opacity-50" />
        <p className="text-purple-300">No transfer history</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-60 overflow-y-auto">
      {history.map((transfer) => (
        <TransferHistoryItem 
          key={transfer.id} 
          transfer={transfer} 
          currentAddress={currentAddress}
        />
      ))}
    </div>
  );
}

function TransferHistoryItem({ transfer, currentAddress }) {
  const isSent = transfer.from?.toLowerCase() === currentAddress?.toLowerCase();
  const statusColors = {
    completed: 'text-green-400 bg-green-500/20',
    pending: 'text-yellow-400 bg-yellow-500/20',
    failed: 'text-red-400 bg-red-500/20'
  };

  return (
    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold">{transfer.name}.virtuals.base</span>
          <span className={`text-xs px-2 py-1 rounded-full ${statusColors[transfer.status] || statusColors.completed}`}>
            {transfer.status || 'completed'}
          </span>
        </div>
        <span className="text-xs text-purple-400">
          {formatTimeAgo(transfer.timestamp)}
        </span>
      </div>
      
      <div className="text-sm space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-purple-300">{isSent ? 'To:' : 'From:'}</span>
          <span className="text-white font-mono">{formatAddress(isSent ? transfer.to : transfer.from)}</span>
        </div>
        
        {transfer.note && (
          <div className="text-purple-400 text-xs">Note: {transfer.note}</div>
        )}
        
        {transfer.txHash && (
          <a
            href={generateTransactionLink(transfer.txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
          >
            View transaction <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}

function TransferExplanation() {
  return (
    <div className="mt-8 sm:mt-12 max-w-4xl mx-auto">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 text-center">
          🔄 How Domain Transfer Works
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">Safe Transfer</h3>
            <p className="text-purple-300 text-sm">
              Recipient must accept the transfer. Perfect for valuable names or when you want confirmation. Creates a pending transfer that can be accepted or rejected.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">Instant Transfer</h3>
            <p className="text-purple-300 text-sm">
              Name transfers immediately to recipient. Fast but irreversible - double check the address! Best for trusted recipients and quick transactions.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">Batch Transfer</h3>
            <p className="text-purple-300 text-sm">
              Transfer multiple names in one transaction. Save up to 50% on gas fees and time! Perfect for managing multiple domains efficiently.
            </p>
          </div>
        </div>
        
        <div className="mt-8 bg-blue-500/20 p-4 rounded-lg border border-blue-500/30">
          <h3 className="text-blue-300 font-semibold mb-2 flex items-center gap-2">
            <Info className="w-5 h-5" />
            Security Best Practices
          </h3>
          <div className="text-blue-200 text-sm space-y-1">
            <div>• Always verify recipient addresses before transferring</div>
            <div>• Use Safe Transfer for high-value domains</div>
            <div>• Keep transaction hashes for your records</div>
            <div>• Consider using address book for frequent recipients</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mock functions - replace with actual API calls
async function fetchUserDomains(address) {
  // Mock implementation
  return ['alice', 'myai', 'crypto', 'defi', 'web3'];
}

async function fetchPendingTransfers(address) {
  // Mock implementation
  return [
    { 
      id: 1, 
      name: 'bob', 
      from: '0x1234567890123456789012345678901234567890', 
      to: address, 
      status: 'pending',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      note: 'Transfer from alice.eth'
    }
  ];
}

async function fetchTransferHistory(address) {
  // Mock implementation
  return [
    {
      id: 1,
      name: 'charlie',
      from: address,
      to: '0x9876543210987654321098765432109876543210',
      status: 'completed',
      mode: 'instant',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      note: 'Sold to collector'
    }
  ];
}

export default TransferInterface;
