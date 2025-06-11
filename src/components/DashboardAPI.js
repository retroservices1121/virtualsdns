// dashboard-api.js
import { ethers } from 'ethers';

// Contract configuration
const REGISTRY_ADDRESS = process.env.REACT_APP_REGISTRY_ADDRESS || "0x..."; // Your deployed contract address
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // USDC on Base
const VIRTUAL_ADDRESS = "0x0b3e328455c4059eeb9e3f84b5543f74e24e7e1b"; // VIRTUAL token on Base

// ABI for dashboard functions
const DASHBOARD_ABI = [
  "function getDashboardData() view returns (uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256)",
  "function getContractBalances() view returns (uint256, uint256, uint256)",
  "function getRecentRegistrations(uint256) view returns (string[], address[], uint8[], uint256[], uint256[])",
  "function getDailyRegistrations(uint256[]) view returns (uint256[])",
  "function getPremiumNames() view returns (string[], uint256[], string[], bool[])",
  "function getRegistrationHistory() view returns (tuple(string,address,uint8,uint256,uint256)[])",
  "function withdrawETH()",
  "function withdrawUSDC()",
  "function withdrawVIRTUAL()",
  "function withdrawAll()",
  "function updatePrices(uint256, uint256, uint256)",
  "function addPremiumName(string, uint256, string)"
];

// Price feed URLs (you can replace with actual price APIs)
const PRICE_APIS = {
  ethereum: 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
  virtual: 'https://api.coingecko.com/api/v3/simple/price?ids=virtual-protocol&vs_currencies=usd'
};

class DashboardAPI {
  constructor(providerUrl = 'https://mainnet.base.org') {
    this.provider = new ethers.providers.JsonRpcProvider(providerUrl);
    this.contract = new ethers.Contract(REGISTRY_ADDRESS, DASHBOARD_ABI, this.provider);
    this.prices = { eth: 3500, virtual: 3 }; // Default prices
  }

  // Initialize with signer for admin functions
  initializeWithSigner(signer) {
    this.contract = this.contract.connect(signer);
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
    } catch (error) {
      console.warn('Failed to fetch live prices, using defaults:', error);
    }
  }

  // Get comprehensive dashboard data
  async getDashboardData() {
    try {
      await this.updatePrices();

      // Get main dashboard stats
      const [
        totalRegs,
        ethRev,
        usdcRev,
        virtualRev,
        ethRegs,
        usdcRegs,
        virtualRegs,
        totalRevenueUSD
      ] = await this.contract.getDashboardData();

      // Get contract balances
      const [ethBalance, usdcBalance, virtualBalance] = await this.contract.getContractBalances();

      // Get recent registrations
      const [names, owners, paymentMethods, amounts, timestamps] = await this.contract.getRecentRegistrations(10);

      // Get daily data for the last 7 days
      const last7Days = Array.from({length: 7}, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return Math.floor(date.getTime() / 1000);
      });
      
      const dailyCounts = await this.contract.getDailyRegistrations(last7Days);

      // Get premium names
      const [premiumNames, premiumValues, premiumCategories, premiumSecured] = await this.contract.getPremiumNames();

      // Calculate revenue breakdown
      const ethRevenueUSD = parseFloat(ethers.utils.formatEther(ethRev)) * this.prices.eth;
      const usdcRevenueUSD = parseFloat(ethers.utils.formatUnits(usdcRev, 6));
      const virtualRevenueUSD = parseFloat(ethers.utils.formatEther(virtualRev)) * this.prices.virtual;
      const totalRevUSD = ethRevenueUSD + usdcRevenueUSD + virtualRevenueUSD;

      const revenueByToken = [
        {
          token: 'USDC',
          amount: usdcRevenueUSD,
          percentage: totalRevUSD > 0 ? (usdcRevenueUSD / totalRevUSD * 100).toFixed(1) : 0,
          registrations: ethers.BigNumber.from(usdcRegs).toNumber(),
          color: '#22c55e'
        },
        {
          token: 'VIRTUAL',
          amount: virtualRevenueUSD,
          percentage: totalRevUSD > 0 ? (virtualRevenueUSD / totalRevUSD * 100).toFixed(1) : 0,
          registrations: ethers.BigNumber.from(virtualRegs).toNumber(),
          color: '#8b5cf6'
        },
        {
          token: 'ETH',
          amount: ethRevenueUSD,
          percentage: totalRevUSD > 0 ? (ethRevenueUSD / totalRevUSD * 100).toFixed(1) : 0,
          registrations: ethers.BigNumber.from(ethRegs).toNumber(),
          color: '#3b82f6'
        }
      ];

      // Format daily registrations for chart
      const dailyRegistrations = last7Days.map((timestamp, index) => ({
        date: new Date(timestamp * 1000).toISOString().split('T')[0],
        total: ethers.BigNumber.from(dailyCounts[index]).toNumber(),
        // Mock breakdown for now - in real implementation, track by payment method
        eth: Math.floor(ethers.BigNumber.from(dailyCounts[index]).toNumber() * 0.1),
        usdc: Math.floor(ethers.BigNumber.from(dailyCounts[index]).toNumber() * 0.6),
        virtual: Math.floor(ethers.BigNumber.from(dailyCounts[index]).toNumber() * 0.3)
      }));

      // Format recent registrations
      const recentRegistrations = names.map((name, i) => ({
        name: name + '.virtuals.base',
        owner: owners[i],
        paymentMethod: ['ETH', 'USDC', 'VIRTUAL'][paymentMethods[i]],
        amount: this.formatAmount(amounts[i], paymentMethods[i]),
        timestamp: new Date(ethers.BigNumber.from(timestamps[i]).toNumber() * 1000).toISOString(),
        valuable: this.isValuableName(name)
      }));

      // Format premium holdings
      const premiumHoldings = premiumNames.map((name, i) => ({
        name: name + '.virtuals.base',
        estimatedValue: this.formatUSD(ethers.BigNumber.from(premiumValues[i]).toNumber()),
        category: premiumCategories[i],
        isSecured: premiumSecured[i]
      }));

      return {
        totalStats: {
          totalRegistrations: ethers.BigNumber.from(totalRegs).toNumber(),
          ethRevenue: parseFloat(ethers.utils.formatEther(ethRev)),
          usdcRevenue: parseFloat(ethers.utils.formatUnits(usdcRev, 6)),
          virtualRevenue: parseFloat(ethers.utils.formatEther(virtualRev)) / 1000000, // Convert to millions
          totalRevenueUSD: Math.floor(totalRevUSD),
          avgPrice: totalRegs > 0 ? (totalRevUSD / ethers.BigNumber.from(totalRegs).toNumber()).toFixed(2) : 0
        },
        revenueByToken,
        dailyRegistrations,
        recentRegistrations,
        premiumHoldings,
        contractBalances: {
          eth: parseFloat(ethers.utils.formatEther(ethBalance)),
          usdc: parseFloat(ethers.utils.formatUnits(usdcBalance, 6)),
          virtual: parseFloat(ethers.utils.formatEther(virtualBalance))
        },
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw new Error(`Failed to load dashboard data: ${error.message}`);
    }
  }

  // Helper functions
  formatAmount(amount, paymentMethod) {
    try {
      switch (paymentMethod) {
        case 0: // ETH
          return parseFloat(ethers.utils.formatEther(amount)).toFixed(3) + ' ETH';
        case 1: // USDC
          return '$' + parseFloat(ethers.utils.formatUnits(amount, 6)).toFixed(2);
        case 2: // VIRTUAL
          return parseFloat(ethers.utils.formatEther(amount)).toLocaleString() + ' V';
        default:
          return amount.toString();
      }
    } catch (error) {
      return 'Unknown';
    }
  }

  formatUSD(amount) {
    return '$' + amount.toLocaleString();
  }

  isValuableName(name) {
    const singleChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const premiumKeywords = ['ai', 'bot', 'crypto', 'web3', 'nft', 'defi'];
    
    return name.length <= 2 || 
           singleChars.includes(name.toLowerCase()) ||
           premiumKeywords.includes(name.toLowerCase());
  }

  // Admin functions
  async withdrawETH() {
    try {
      const tx = await this.contract.withdrawETH();
      await tx.wait();
      return { success: true, txHash: tx.hash };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async withdrawUSDC() {
    try {
      const tx = await this.contract.withdrawUSDC();
      await tx.wait();
      return { success: true, txHash: tx.hash };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async withdrawVIRTUAL() {
    try {
      const tx = await this.contract.withdrawVIRTUAL();
      await tx.wait();
      return { success: true, txHash: tx.hash };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async withdrawAll() {
    try {
      const tx = await this.contract.withdrawAll();
      await tx.wait();
      return { success: true, txHash: tx.hash };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async updatePricing(ethPrice, usdcPrice, virtualPrice) {
    try {
      const tx = await this.contract.updatePrices(
        ethers.utils.parseEther(ethPrice.toString()),
        ethers.utils.parseUnits(usdcPrice.toString(), 6),
        ethers.utils.parseEther(virtualPrice.toString())
      );
      await tx.wait();
      return { success: true, txHash: tx.hash };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async addPremiumName(name, estimatedValue, category) {
    try {
      const tx = await this.contract.addPremiumName(
        name,
        estimatedValue,
        category
      );
      await tx.wait();
      return { success: true, txHash: tx.hash };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Export functions
  exportToCSV(data, filename = 'dashboard-export.csv') {
    const csvContent = this.convertToCSV(data);
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

  convertToCSV(data) {
    if (!data || !data.recentRegistrations) return '';
    
    const headers = ['Name', 'Owner', 'Payment Method', 'Amount', 'Date', 'Valuable'];
    const rows = data.recentRegistrations.map(reg => [
      reg.name,
      reg.owner,
      reg.paymentMethod,
      reg.amount,
      new Date(reg.timestamp).toLocaleDateString(),
      reg.valuable ? 'Yes' : 'No'
    ]);
    
    return [headers, ...rows].map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');
  }
}

// React Hook for dashboard data
export const useDashboardData = (refreshInterval = 30000) => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [api] = React.useState(() => new DashboardAPI());

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const dashboardData = await api.getDashboardData();
      setData(dashboardData);
      setError(null);
    } catch (err) {
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

  return { data, loading, error, refetch: fetchData, api };
};

export default DashboardAPI;
