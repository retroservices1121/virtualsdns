// dashboard-api.js - Updated version with fixes
import { ethers } from 'ethers';
import React from 'react'; // Add this import for React hooks

// Contract configuration
const REGISTRY_ADDRESS = process.env.REACT_APP_REGISTRY_ADDRESS || "0x..."; // Your deployed contract address
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // USDC on Base
const VIRTUAL_ADDRESS = "0x0b3e328455c4059eeb9e3f84b5543f74e24e7e1b"; // VIRTUAL token on Base

// Updated ABI with proper function signatures matching your contract
const DASHBOARD_ABI = [
  // View functions - match your contract exactly
  "function getDashboardData() view returns (uint256 totalRegs, uint256 ethRev, uint256 usdcRev, uint256 virtualRev, uint256 ethRegs, uint256 usdcRegs, uint256 virtualRegs, uint256 totalRevenueUSD)",
  "function getContractBalances() view returns (uint256 ethBalance, uint256 usdcBalance, uint256 virtualBalance)",
  "function getRecentRegistrations(uint256 count) view returns (string[] memory names, address[] memory owners, uint8[] memory paymentMethods, uint256[] memory amounts, uint256[] memory timestamps)",
  "function getDailyRegistrations(uint256[] memory timestamps) view returns (uint256[] memory counts)",
  "function getPremiumNames() view returns (string[] memory names, uint256[] memory estimatedValues, string[] memory categories, bool[] memory isSecured)",
  
  // Domain functions
  "function isAvailable(string memory name) view returns (bool)",
  "function nameToOwner(string memory name) view returns (address)",
  "function registrationTime(string memory name) view returns (uint256)",
  
  // Pricing functions
  "function ethPrice() view returns (uint256)",
  "function usdcPrice() view returns (uint256)", 
  "function virtualPrice() view returns (uint256)",
  
  // Admin functions (require owner)
  "function withdrawETH()",
  "function withdrawUSDC()",
  "function withdrawVIRTUAL()",
  "function withdrawAll()",
  "function updatePrices(uint256 _ethPrice, uint256 _usdcPrice, uint256 _virtualPrice)",
  "function addPremiumName(string memory name, uint256 estimatedValue, string memory category)",
  
  // Events for monitoring
  "event NameRegistered(string indexed name, address indexed owner, uint8 paymentMethod, uint256 amount, uint256 registrationId)",
  "event PricesUpdated(uint256 ethPrice, uint256 usdcPrice, uint256 virtualPrice)"
];

// Price feed URLs
const PRICE_APIS = {
  ethereum: 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
  virtual: 'https://api.coingecko.com/api/v3/simple/price?ids=virtual-protocol&vs_currencies=usd'
};

class DashboardAPI {
  constructor(providerUrl = 'https://mainnet.base.org') {
    // Use ethers v6 syntax
    this.provider = new ethers.JsonRpcProvider(providerUrl);
    this.contract = new ethers.Contract(REGISTRY_ADDRESS, DASHBOARD_ABI, this.provider);
    this.prices = { eth: 3500, virtual: 3 }; // Default prices
    this.signer = null;
  }

  // Initialize with signer for admin functions
  async initializeWithSigner(walletProvider) {
    try {
      this.signer = await walletProvider.getSigner();
      this.contract = this.contract.connect(this.signer);
      return true;
    } catch (error) {
      console.error('Failed to initialize signer:', error);
      return false;
    }
  }

  // Check if user is the contract owner
  async isOwner() {
    try {
      if (!this.signer) return false;
      const signerAddress = await this.signer.getAddress();
      const ownerAddress = await this.contract.owner();
      return signerAddress.toLowerCase() === ownerAddress.toLowerCase();
    } catch (error) {
      console.error('Error checking owner:', error);
      return false;
    }
  }

  // Fetch current token prices
  async updatePrices() {
    try {
      const [ethResponse, virtualResponse] = await Promise.all([
        fetch(PRICE_APIS.ethereum),
        fetch(PRICE_APIS.virtual)
      ]);
      
      const ethData = await ethResponse.json();
      const virtualData = await virtualResponse.json();
      
      this.prices.eth = ethData.ethereum?.usd || 3500;
      this.prices.virtual = virtualData['virtual-protocol']?.usd || 3;
      
      console.log('Updated prices:', this.prices);
    } catch (error) {
      console.warn('Failed to fetch live prices, using defaults:', error);
    }
  }

  // Get current contract pricing
  async getContractPricing() {
    try {
      const [ethPrice, usdcPrice, virtualPrice] = await Promise.all([
        this.contract.ethPrice(),
        this.contract.usdcPrice(),
        this.contract.virtualPrice()
      ]);

      return {
        eth: ethers.formatEther(ethPrice),
        usdc: ethers.formatUnits(usdcPrice, 6),
        virtual: ethers.formatEther(virtualPrice)
      };
    } catch (error) {
      console.error('Error fetching contract pricing:', error);
      return { eth: '0.001', usdc: '5', virtual: '1000' };
    }
  }

  // Enhanced dashboard data with better error handling
  async getDashboardData() {
    try {
      await this.updatePrices();

      // Get main dashboard stats
      const dashboardResult = await this.contract.getDashboardData();
      const [
        totalRegs,
        ethRev,
        usdcRev,
        virtualRev,
        ethRegs,
        usdcRegs,
        virtualRegs,
        totalRevenueUSD
      ] = dashboardResult;

      // Get contract balances
      const balanceResult = await this.contract.getContractBalances();
      const [ethBalance, usdcBalance, virtualBalance] = balanceResult;

      // Get recent registrations
      const recentResult = await this.contract.getRecentRegistrations(10);
      const [names, owners, paymentMethods, amounts, timestamps] = recentResult;

      // Get current contract pricing
      const contractPricing = await this.getContractPricing();

      // Calculate daily data for the last 7 days
      const last7Days = Array.from({length: 7}, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return Math.floor(date.getTime() / 1000 / 86400) * 86400; // Round to start of day
      });
      
      let dailyCounts = [];
      try {
        dailyCounts = await this.contract.getDailyRegistrations(last7Days);
      } catch (error) {
        console.warn('Failed to get daily registrations:', error);
        dailyCounts = new Array(7).fill(0);
      }

      // Get premium names
      let premiumData = { names: [], values: [], categories: [], secured: [] };
      try {
        const premiumResult = await this.contract.getPremiumNames();
        premiumData = {
          names: premiumResult[0],
          values: premiumResult[1], 
          categories: premiumResult[2],
          secured: premiumResult[3]
        };
      } catch (error) {
        console.warn('Failed to get premium names:', error);
      }

      // Calculate revenue breakdown with proper BigInt handling
      const ethRevenueUSD = parseFloat(ethers.formatEther(ethRev)) * this.prices.eth;
      const usdcRevenueUSD = parseFloat(ethers.formatUnits(usdcRev, 6));
      const virtualRevenueUSD = parseFloat(ethers.formatEther(virtualRev)) * this.prices.virtual;
      const totalRevUSD = ethRevenueUSD + usdcRevenueUSD + virtualRevenueUSD;

      const revenueByToken = [
        {
          token: 'USDC',
          amount: usdcRevenueUSD,
          percentage: totalRevUSD > 0 ? (usdcRevenueUSD / totalRevUSD * 100).toFixed(1) : 0,
          registrations: Number(usdcRegs),
          color: '#22c55e'
        },
        {
          token: 'VIRTUAL',
          amount: virtualRevenueUSD,
          percentage: totalRevUSD > 0 ? (virtualRevenueUSD / totalRevUSD * 100).toFixed(1) : 0,
          registrations: Number(virtualRegs),
          color: '#8b5cf6'
        },
        {
          token: 'ETH',
          amount: ethRevenueUSD,
          percentage: totalRevUSD > 0 ? (ethRevenueUSD / totalRevUSD * 100).toFixed(1) : 0,
          registrations: Number(ethRegs),
          color: '#3b82f6'
        }
      ];

      // Format daily registrations for chart
      const dailyRegistrations = last7Days.map((timestamp, index) => ({
        date: new Date(timestamp * 1000).toISOString().split('T')[0],
        total: Number(dailyCounts[index] || 0),
        // Calculate breakdown based on overall percentages
        eth: Math.floor(Number(dailyCounts[index] || 0) * (Number(ethRegs) / Number(totalRegs) || 0)),
        usdc: Math.floor(Number(dailyCounts[index] || 0) * (Number(usdcRegs) / Number(totalRegs) || 0)),
        virtual: Math.floor(Number(dailyCounts[index] || 0) * (Number(virtualRegs) / Number(totalRegs) || 0))
      }));

      // Format recent registrations
      const recentRegistrations = names.map((name, i) => ({
        name: name + '.virtuals.base',
        owner: owners[i],
        paymentMethod: ['ETH', 'USDC', 'VIRTUAL'][paymentMethods[i]] || 'Unknown',
        amount: this.formatAmount(amounts[i], paymentMethods[i]),
        timestamp: new Date(Number(timestamps[i]) * 1000).toISOString(),
        valuable: this.isValuableName(name),
        txHash: '', // You could track this in your contract if needed
      }));

      // Format premium holdings
      const premiumHoldings = premiumData.names.map((name, i) => ({
        name: name + '.virtuals.base',
        estimatedValue: this.formatETH(premiumData.values[i]),
        estimatedValueUSD: this.formatUSD(Number(ethers.formatEther(premiumData.values[i])) * this.prices.eth),
        category: premiumData.categories[i],
        isSecured: premiumData.secured[i],
        priority: this.getPriorityLevel(name)
      }));

      return {
        totalStats: {
          totalRegistrations: Number(totalRegs),
          ethRevenue: parseFloat(ethers.formatEther(ethRev)),
          usdcRevenue: parseFloat(ethers.formatUnits(usdcRev, 6)),
          virtualRevenue: parseFloat(ethers.formatEther(virtualRev)),
          totalRevenueUSD: Math.floor(totalRevUSD),
          avgPrice: Number(totalRegs) > 0 ? (totalRevUSD / Number(totalRegs)).toFixed(2) : 0
        },
        contractPricing,
        currentPrices: this.prices,
        revenueByToken,
        dailyRegistrations,
        recentRegistrations,
        premiumHoldings,
        contractBalances: {
          eth: parseFloat(ethers.formatEther(ethBalance)),
          usdc: parseFloat(ethers.formatUnits(usdcBalance, 6)),
          virtual: parseFloat(ethers.formatEther(virtualBalance)),
          totalValueUSD: parseFloat(ethers.formatEther(ethBalance)) * this.prices.eth + 
                        parseFloat(ethers.formatUnits(usdcBalance, 6)) +
                        parseFloat(ethers.formatEther(virtualBalance)) * this.prices.virtual
        },
        metadata: {
          contractAddress: REGISTRY_ADDRESS,
          lastUpdated: new Date().toISOString(),
          blockNumber: await this.provider.getBlockNumber(),
          network: 'Base Mainnet'
        }
      };

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw new Error(`Failed to load dashboard data: ${error.message}`);
    }
  }

  // Enhanced helper functions
  formatAmount(amount, paymentMethod) {
    try {
      switch (Number(paymentMethod)) {
        case 0: // ETH
          return parseFloat(ethers.formatEther(amount)).toFixed(4) + ' ETH';
        case 1: // USDC
          return '$' + parseFloat(ethers.formatUnits(amount, 6)).toFixed(2);
        case 2: // VIRTUAL
          return parseFloat(ethers.formatEther(amount)).toLocaleString() + ' VIRTUAL';
        default:
          return amount.toString();
      }
    } catch (error) {
      console.error('Error formatting amount:', error);
      return 'Unknown';
    }
  }

  formatETH(amount) {
    try {
      return parseFloat(ethers.formatEther(amount)).toFixed(4) + ' ETH';
    } catch (error) {
      return '0 ETH';
    }
  }

  formatUSD(amount) {
    return '$' + Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  getPriorityLevel(name) {
    if (name.length === 1) return 'Ultra High';
    if (name.length === 2) return 'High';
    const premiumKeywords = ['ai', 'bot', 'crypto', 'web3', 'nft', 'defi', 'dao'];
    if (premiumKeywords.includes(name.toLowerCase())) return 'High';
    return 'Medium';
  }

  isValuableName(name) {
    const singleChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const premiumKeywords = ['ai', 'bot', 'crypto', 'web3', 'nft', 'defi', 'dao', 'meta', 'link'];
    
    return name.length <= 2 || 
           singleChars.includes(name.toLowerCase()) ||
           premiumKeywords.includes(name.toLowerCase()) ||
           /^[0-9]+$/.test(name); // All numbers
  }

  // Enhanced admin functions with better error handling
  async withdrawETH() {
    try {
      if (!this.signer) throw new Error('No signer available');
      if (!(await this.isOwner())) throw new Error('Not authorized');
      
      const tx = await this.contract.withdrawETH();
      await tx.wait();
      return { success: true, txHash: tx.hash };
    } catch (error) {
      console.error('ETH withdrawal failed:', error);
      return { success: false, error: error.message };
    }
  }

  async withdrawUSDC() {
    try {
      if (!this.signer) throw new Error('No signer available');
      if (!(await this.isOwner())) throw new Error('Not authorized');
      
      const tx = await this.contract.withdrawUSDC();
      await tx.wait();
      return { success: true, txHash: tx.hash };
    } catch (error) {
      console.error('USDC withdrawal failed:', error);
      return { success: false, error: error.message };
    }
  }

  async withdrawVIRTUAL() {
    try {
      if (!this.signer) throw new Error('No signer available');
      if (!(await this.isOwner())) throw new Error('Not authorized');
      
      const tx = await this.contract.withdrawVIRTUAL();
      await tx.wait();
      return { success: true, txHash: tx.hash };
    } catch (error) {
      console.error('VIRTUAL withdrawal failed:', error);
      return { success: false, error: error.message };
    }
  }

  async withdrawAll() {
    try {
      if (!this.signer) throw new Error('No signer available');
      if (!(await this.isOwner())) throw new Error('Not authorized');
      
      const tx = await this.contract.withdrawAll();
      await tx.wait();
      return { success: true, txHash: tx.hash };
    } catch (error) {
      console.error('Withdrawal failed:', error);
      return { success: false, error: error.message };
    }
  }

  async updatePricing(ethPrice, usdcPrice, virtualPrice) {
    try {
      if (!this.signer) throw new Error('No signer available');
      if (!(await this.isOwner())) throw new Error('Not authorized');
      
      const tx = await this.contract.updatePrices(
        ethers.parseEther(ethPrice.toString()),
        ethers.parseUnits(usdcPrice.toString(), 6),
        ethers.parseEther(virtualPrice.toString())
      );
      await tx.wait();
      return { success: true, txHash: tx.hash };
    } catch (error) {
      console.error('Price update failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Enhanced CSV export with more data
  exportToCSV(data, type = 'registrations') {
    let csvContent = '';
    let filename = '';
    
    switch (type) {
      case 'registrations':
        filename = `registrations-${new Date().toISOString().split('T')[0]}.csv`;
        csvContent = this.formatRegistrationsCSV(data.recentRegistrations);
        break;
      case 'premium':
        filename = `premium-names-${new Date().toISOString().split('T')[0]}.csv`;
        csvContent = this.formatPremiumCSV(data.premiumHoldings);
        break;
      case 'revenue':
        filename = `revenue-summary-${new Date().toISOString().split('T')[0]}.csv`;
        csvContent = this.formatRevenueCSV(data);
        break;
    }
    
    this.downloadCSV(csvContent, filename);
  }

  formatRegistrationsCSV(registrations) {
    const headers = ['Name', 'Owner', 'Payment Method', 'Amount', 'Date', 'Time', 'Valuable'];
    const rows = registrations.map(reg => [
      reg.name,
      reg.owner,
      reg.paymentMethod,
      reg.amount,
      new Date(reg.timestamp).toLocaleDateString(),
      new Date(reg.timestamp).toLocaleTimeString(),
      reg.valuable ? 'Yes' : 'No'
    ]);
    
    return [headers, ...rows].map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');
  }

  formatPremiumCSV(premiumNames) {
    const headers = ['Name', 'Category', 'Estimated Value ETH', 'Estimated Value USD', 'Priority', 'Secured'];
    const rows = premiumNames.map(premium => [
      premium.name,
      premium.category,
      premium.estimatedValue,
      premium.estimatedValueUSD,
      premium.priority,
      premium.isSecured ? 'Yes' : 'No'
    ]);
    
    return [headers, ...rows].map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');
  }

  formatRevenueCSV(data) {
    const headers = ['Token', 'Revenue Amount', 'Revenue USD', 'Registrations', 'Percentage'];
    const rows = data.revenueByToken.map(token => [
      token.token,
      token.amount,
      this.formatUSD(token.amount),
      token.registrations,
      token.percentage + '%'
    ]);
    
    return [headers, ...rows].map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');
  }

  downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}

// Enhanced React Hook with better state management
export const useDashboardData = (refreshInterval = 30000) => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [lastRefresh, setLastRefresh] = React.useState(null);
  const [api] = React.useState(() => new DashboardAPI());

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const dashboardData = await api.getDashboardData();
      setData(dashboardData);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  React.useEffect(() => {
    fetchData();
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, refreshInterval]);

  const initializeAdmin = React.useCallback(async (walletProvider) => {
    return await api.initializeWithSigner(walletProvider);
  }, [api]);

  return { 
    data, 
    loading, 
    error, 
    lastRefresh,
    refetch: fetchData, 
    api,
    initializeAdmin
  };
};

export default DashboardAPI;

