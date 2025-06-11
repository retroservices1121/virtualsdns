// deploy-integrated-system.js
const { ethers } = require("hardhat");

// Base network token addresses
const BASE_MAINNET_ADDRESSES = {
  USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  VIRTUAL: "0x0b3e328455c4059eeb9e3f84b5543f74e24e7e1b"
};

const BASE_SEPOLIA_ADDRESSES = {
  USDC: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", 
  VIRTUAL: "0x..." // Deploy test token or use existing
};

// Premium names to secure immediately
const PREMIUM_NAMES = {
  singleChars: [
    "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
    "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"
  ],
  aiKeywords: [
    "ai", "bot", "agent", "gpt", "claude", "chatgpt", "openai",
    "virtual", "virtuals", "meta", "crypto", "web3", "defi", "nft", "genesis", "grok", "virgen"
  ],
  popularNames: [
    "joe", "joseph", "jp",
  ],
  businessTerms: [
    "ceo", "founder", "startup", "trade", "invest", "stake", "yield",
    "dao", "governance", "treasury", "protocol", "network"
  ]
};

// Premium name valuations (in USD)
const PREMIUM_VALUATIONS = {
  singleChar: 50000,
  aiKeyword: 25000,
  popularName: 5000,
  businessTerm: 10000
};

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying VirtualsBase integrated system...");
  console.log("📝 Deployer address:", deployer.address);
  console.log("💰 Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");

  // Determine network and addresses
  const network = await ethers.provider.getNetwork();
  const isMainnet = network.chainId === 8453; // Base mainnet
  const addresses = isMainnet ? BASE_MAINNET_ADDRESSES : BASE_SEPOLIA_ADDRESSES;
  
  console.log(`🌐 Deploying to ${isMainnet ? 'Base Mainnet' : 'Base Sepolia'}`);
  console.log("🪙 USDC Address:", addresses.USDC);
  console.log("🤖 VIRTUAL Address:", addresses.VIRTUAL);

  // Deploy the main contract
  console.log("\n📦 Deploying VirtualsBase Registry...");
  const VirtualsBaseRegistry = await ethers.getContractFactory("VirtualsBaseRegistry");
  const registry = await VirtualsBaseRegistry.deploy(addresses.USDC, addresses.VIRTUAL);
  await registry.deployed();
  
  console.log("✅ VirtualsBase Registry deployed to:", registry.address);

  // Wait for a few blocks for better reliability
  console.log("⏳ Waiting for contract to be confirmed...");
  await registry.deployTransaction.wait(3);

  // Secure premium names immediately
  console.log("\n👑 Securing premium names...");
  
  try {
    // Secure single characters
    console.log("🔐 Securing single characters...");
    const singleCharTx = await registry.adminBatchRegister(
      PREMIUM_NAMES.singleChars,
      Array(PREMIUM_NAMES.singleChars.length).fill(deployer.address)
    );
    await singleCharTx.wait();
    console.log(`✅ Secured ${PREMIUM_NAMES.singleChars.length} single characters`);

    // Add premium name records
    for (const char of PREMIUM_NAMES.singleChars.slice(0, 5)) { // Add first 5 to avoid gas limit
      try {
        const addTx = await registry.addPremiumName(
          char, 
          PREMIUM_VALUATIONS.singleChar, 
          "Single Character"
        );
        await addTx.wait();
      } catch (error) {
        console.log(`⚠️ Could not add premium record for ${char}:`, error.message);
      }
    }

    // Secure AI keywords
    console.log("🤖 Securing AI keywords...");
    const aiTx = await registry.adminBatchRegister(
      PREMIUM_NAMES.aiKeywords,
      Array(PREMIUM_NAMES.aiKeywords.length).fill(deployer.address)
    );
    await aiTx.wait();
    console.log(`✅ Secured ${PREMIUM_NAMES.aiKeywords.length} AI keywords`);

    // Add AI keyword records
    for (const keyword of PREMIUM_NAMES.aiKeywords.slice(0, 5)) {
      try {
        const addTx = await registry.addPremiumName(
          keyword,
          PREMIUM_VALUATIONS.aiKeyword,
          "AI Keyword"
        );
        await addTx.wait();
      } catch (error) {
        console.log(`⚠️ Could not add premium record for ${keyword}:`, error.message);
      }
    }

    // Secure popular names
    console.log("👥 Securing popular names...");
    const popularTx = await registry.adminBatchRegister(
      PREMIUM_NAMES.popularNames,
      Array(PREMIUM_NAMES.popularNames.length).fill(deployer.address)
    );
    await popularTx.wait();
    console.log(`✅ Secured ${PREMIUM_NAMES.popularNames.length} popular names`);

    // Secure business terms
    console.log("💼 Securing business terms...");
    const businessTx = await registry.adminBatchRegister(
      PREMIUM_NAMES.businessTerms,
      Array(PREMIUM_NAMES.businessTerms.length).fill(deployer.address)
    );
    await businessTx.wait();
    console.log(`✅ Secured ${PREMIUM_NAMES.businessTerms.length} business terms`);

  } catch (error) {
    console.error("❌ Error securing premium names:", error.message);
    console.log("⚠️ You may need to secure names manually after deployment");
  }

  // Calculate total premium value secured
  const totalValue = 
    PREMIUM_NAMES.singleChars.length * PREMIUM_VALUATIONS.singleChar +
    PREMIUM_NAMES.aiKeywords.length * PREMIUM_VALUATIONS.aiKeyword +
    PREMIUM_NAMES.popularNames.length * PREMIUM_VALUATIONS.popularName +
    PREMIUM_NAMES.businessTerms.length * PREMIUM_VALUATIONS.businessTerm;

  console.log("\n🎉 Deployment Summary:");
  console.log("=" * 50);
  console.log("📄 Contract Address:", registry.address);
  console.log("🌐 Network:", isMainnet ? "Base Mainnet" : "Base Sepolia");
  console.log("👑 Premium Names Secured:", 
    PREMIUM_NAMES.singleChars.length + 
    PREMIUM_NAMES.aiKeywords.length + 
    PREMIUM_NAMES.popularNames.length + 
    PREMIUM_NAMES.businessTerms.length
  );
  console.log("💎 Estimated Premium Value:", `${totalValue.toLocaleString()}`);
  console.log("🔐 Admin Address:", deployer.address);

  console.log("\n📋 Next Steps:");
  console.log("1. Update frontend with contract address:", registry.address);
  console.log("2. Verify contract on BaseScan");
  console.log("3. Set up admin dashboard");
  console.log("4. Configure domain pricing if needed");
  console.log("5. Launch marketing campaign!");

  console.log("\n🔗 Important Links:");
  console.log("📊 BaseScan:", `https://basescan.org/address/${registry.address}`);
  console.log("🎯 Add to MetaMask:", registry.address);

  // Create environment file for frontend
  const envContent = `
# VirtualsBase Configuration
REACT_APP_REGISTRY_ADDRESS=${registry.address}
REACT_APP_USDC_ADDRESS=${addresses.USDC}
REACT_APP_VIRTUAL_ADDRESS=${addresses.VIRTUAL}
REACT_APP_NETWORK=${isMainnet ? 'base-mainnet' : 'base-sepolia'}
REACT_APP_CHAIN_ID=${network.chainId}

# Dashboard Configuration  
REACT_APP_ADMIN_ADDRESS=${deployer.address}
REACT_APP_PREMIUM_NAMES_SECURED=true
REACT_APP_ESTIMATED_PORTFOLIO_VALUE=${totalValue}
`;

  // Write to .env file
  const fs = require('fs');
  fs.writeFileSync('.env.production', envContent.trim());
  console.log("\n📝 Created .env.production file for frontend");

  // Create a deployment info JSON
  const deploymentInfo = {
    contractAddress: registry.address,
    deployerAddress: deployer.address,
    network: isMainnet ? 'base-mainnet' : 'base-sepolia',
    chainId: network.chainId,
    deploymentTimestamp: new Date().toISOString(),
    premiumNamesSecured: {
      singleChars: PREMIUM_NAMES.singleChars,
      aiKeywords: PREMIUM_NAMES.aiKeywords,
      popularNames: PREMIUM_NAMES.popularNames,
      businessTerms: PREMIUM_NAMES.businessTerms
    },
    estimatedPortfolioValue: totalValue,
    tokenAddresses: addresses
  };

  fs.writeFileSync('deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
  console.log("📋 Created deployment-info.json");

  console.log("\n🎊 Deployment Complete! Your .virtuals.base empire is ready!");
  return registry.address;
}

// Verification script
async function verify(contractAddress) {
  const network = await ethers.provider.getNetwork();
  const isMainnet = network.chainId === 8453;
  const addresses = isMainnet ? BASE_MAINNET_ADDRESSES : BASE_SEPOLIA_ADDRESSES;

  console.log("🔍 Verifying contract on BaseScan...");
  
  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [addresses.USDC, addresses.VIRTUAL],
    });
    console.log("✅ Contract verified successfully!");
  } catch (error) {
    console.log("❌ Verification failed:", error.message);
    console.log("💡 You can verify manually on BaseScan");
  }
}

// Test deployment (for local testing)
async function testDeployment(contractAddress) {
  console.log("\n🧪 Testing deployment...");
  
  const VirtualsBaseRegistry = await ethers.getContractFactory("VirtualsBaseRegistry");
  const registry = VirtualsBaseRegistry.attach(contractAddress);

  try {
    // Test basic functions
    const isAvailable = await registry.isAvailable("test");
    console.log("✅ Contract responsive, 'test' available:", isAvailable);

    // Test dashboard data
    const dashboardData = await registry.getDashboardData();
    console.log("✅ Dashboard data accessible");
    console.log("📊 Total registrations:", dashboardData[0].toString());

    // Test premium names
    const premiumNames = await registry.getPremiumNames();
    console.log("✅ Premium names accessible");
    console.log("👑 Premium names count:", premiumNames[0].length);

    console.log("✅ All tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Main execution
main()
  .then((contractAddress) => {
    console.log("\n🔄 Running post-deployment tasks...");
    
    // Run verification
    verify(contractAddress).then(() => {
      // Run tests
      testDeployment(contractAddress);
    });
  })
  .catch((error) => {
    console.error("💥 Deployment failed:", error);
    process.exitCode = 1;
  });

module.exports = { main, verify, testDeployment };
