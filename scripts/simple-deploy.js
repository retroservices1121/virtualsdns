const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Simple VirtualsBase Registry Deployment");
  
  try {
    // Get deployer
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    
    // Check balance
    const balance = await deployer.getBalance();
    console.log("Balance:", ethers.utils.formatEther(balance), "ETH");
    
    if (balance.lt(ethers.utils.parseEther("0.01"))) {
      throw new Error("Insufficient balance for deployment");
    }
    
    // Get network
    const network = await ethers.provider.getNetwork();
    console.log("Network:", network.name, "Chain ID:", network.chainId);
    
    // Token addresses
    let usdcAddress, virtualAddress;
    
    if (network.chainId === 8453) {
      // Base Mainnet
      usdcAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
      virtualAddress = "0x0b3e328455c4059eeb9e3f84b5543f74e24e7e1b";
    } else if (network.chainId === 84532) {
      // Base Sepolia
      usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
      virtualAddress = "0x4200000000000000000000000000000000000006"; // Using WETH as placeholder
    } else {
      throw new Error(`Unsupported network: ${network.chainId}`);
    }
    
    console.log("USDC Address:", usdcAddress);
    console.log("VIRTUAL Address:", virtualAddress);
    
    // Deploy contract
    console.log("Deploying VirtualsBaseRegistry...");
    const VirtualsBaseRegistry = await ethers.getContractFactory("VirtualsBaseRegistry");
    
    const registry = await VirtualsBaseRegistry.deploy(usdcAddress, virtualAddress, {
      gasLimit: 5000000
    });
    
    console.log("Transaction hash:", registry.deployTransaction.hash);
    console.log("Waiting for confirmation...");
    
    await registry.deployTransaction.wait(2);
    
    // This is the key line for GitHub Actions
    console.log(`Contract deployed to: ${registry.address}`);
    
    console.log("✅ Deployment successful!");
    console.log("Contract Address:", registry.address);
    
    return registry.address;
    
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

module.exports = main;
