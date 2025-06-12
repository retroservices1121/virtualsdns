// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title VirtualsBase Registry with Dashboard Integration
 * @dev Complete domain name system with admin dashboard support
 */
contract VirtualsBaseRegistry is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // === TOKEN CONTRACTS ===
    IERC20 public immutable USDC;
    IERC20 public immutable VIRTUAL;
    
    // === PRICING ===
    uint256 public ethPrice = 0.001 ether;
    uint256 public usdcPrice = 5000000; // 5 USDC (6 decimals)
    uint256 public virtualPrice = 1000 * 10**18; // 1000 VIRTUAL tokens
    
    // === PAYMENT METHODS ===
    enum PaymentMethod { ETH, USDC, VIRTUAL }
    
    // === EVENTS ===
    event NameRegistered(string indexed name, address indexed owner, PaymentMethod paymentMethod, uint256 amount, uint256 registrationId);
    event NameTransferred(string indexed name, address indexed from, address indexed to);
    event TransferInitiated(string indexed name, address indexed from, address indexed to);
    event TransferCancelled(string indexed name, address indexed owner);
    event RecordUpdated(string indexed name, string key, string value);
    event AddressUpdated(string indexed name, address newAddress);
    event PricesUpdated(uint256 ethPrice, uint256 usdcPrice, uint256 virtualPrice);
    
    // === CORE STORAGE ===
    mapping(string => address) public nameToOwner;
    mapping(string => address) public nameToAddress;
    mapping(string => mapping(string => string)) public textRecords;
    mapping(address => string) public addressToPrimaryName;
    mapping(string => uint256) public registrationTime;
    
    // === TRANSFER SYSTEM ===
    mapping(string => address) public pendingTransfers;
    
    // === DASHBOARD DATA ===
    mapping(PaymentMethod => uint256) public totalRevenue;
    mapping(PaymentMethod => uint256) public totalRegistrations;
    
    // Registration history for dashboard
    struct Registration {
        string name;
        address owner;
        PaymentMethod paymentMethod;
        uint256 amount;
        uint256 timestamp;
    }
    
    Registration[] public registrationHistory;
    mapping(uint256 => uint256) public dailyRegistrations; // timestamp => count
    
    // Premium names tracked by admin
    struct PremiumName {
        string name;
        uint256 estimatedValue;
        string category;
        bool isSecured;
    }
    
    PremiumName[] public premiumNames;
    mapping(string => uint256) public premiumNameIndex;
    
    constructor(address _usdc, address _virtual) Ownable(msg.sender) {
        USDC = IERC20(_usdc);
        VIRTUAL = IERC20(_virtual);
    }
    
    // === REGISTRATION FUNCTIONS ===
    
    function registerWithETH(string memory name) external payable nonReentrant {
        require(msg.value >= ethPrice, "Insufficient ETH payment");
        _register(name, PaymentMethod.ETH, msg.value);
    }
    
    function registerWithUSDC(string memory name) external nonReentrant {
        require(USDC.balanceOf(msg.sender) >= usdcPrice, "Insufficient USDC balance");
        USDC.safeTransferFrom(msg.sender, address(this), usdcPrice);
        _register(name, PaymentMethod.USDC, usdcPrice);
    }
    
    function registerWithVIRTUAL(string memory name) external nonReentrant {
        require(VIRTUAL.balanceOf(msg.sender) >= virtualPrice, "Insufficient VIRTUAL balance");
        VIRTUAL.safeTransferFrom(msg.sender, address(this), virtualPrice);
        _register(name, PaymentMethod.VIRTUAL, virtualPrice);
    }
    
    function _register(string memory name, PaymentMethod method, uint256 amount) internal {
        require(bytes(name).length >= 3, "Name too short");
        require(bytes(name).length <= 32, "Name too long");
        require(nameToOwner[name] == address(0), "Name already taken");
        
        // Register the name
        nameToOwner[name] = msg.sender;
        nameToAddress[name] = msg.sender;
        registrationTime[name] = block.timestamp;
        
        // Set as primary name if they don't have one
        if (bytes(addressToPrimaryName[msg.sender]).length == 0) {
            addressToPrimaryName[msg.sender] = name;
        }
        
        // Update statistics
        totalRevenue[method] += amount;
        totalRegistrations[method] += 1;
        
        // Update daily count
        uint256 dayTimestamp = (block.timestamp / 86400) * 86400; // Start of day
        dailyRegistrations[dayTimestamp] += 1;
        
        // Add to history
        uint256 registrationId = registrationHistory.length;
        registrationHistory.push(Registration({
            name: name,
            owner: msg.sender,
            paymentMethod: method,
            amount: amount,
            timestamp: block.timestamp
        }));
        
        emit NameRegistered(name, msg.sender, method, amount, registrationId);
    }
    
    // === ADMIN FUNCTIONS ===
    
    function adminRegister(string memory name, address owner) external onlyOwner {
        require(bytes(name).length >= 1, "Name too short");
        require(bytes(name).length <= 32, "Name too long");
        require(nameToOwner[name] == address(0), "Name already taken");
        require(owner != address(0), "Invalid owner address");
        
        nameToOwner[name] = owner;
        nameToAddress[name] = owner;
        registrationTime[name] = block.timestamp;
        
        if (bytes(addressToPrimaryName[owner]).length == 0) {
            addressToPrimaryName[owner] = name;
        }
        
        // Add to history with 0 amount for admin registration
        uint256 registrationId = registrationHistory.length;
        registrationHistory.push(Registration({
            name: name,
            owner: owner,
            paymentMethod: PaymentMethod.ETH,
            amount: 0,
            timestamp: block.timestamp
        }));
        
        emit NameRegistered(name, owner, PaymentMethod.ETH, 0, registrationId);
    }
    
    function adminBatchRegister(string[] memory names, address[] memory owners) external onlyOwner {
        require(names.length == owners.length, "Arrays length mismatch");
        
        for (uint i = 0; i < names.length; i++) {
            require(bytes(names[i]).length >= 1 && bytes(names[i]).length <= 32, "Invalid name length");
            require(nameToOwner[names[i]] == address(0), "Name already taken");
            require(owners[i] != address(0), "Invalid owner address");
            
            nameToOwner[names[i]] = owners[i];
            nameToAddress[names[i]] = owners[i];
            registrationTime[names[i]] = block.timestamp;
            
            if (bytes(addressToPrimaryName[owners[i]]).length == 0) {
                addressToPrimaryName[owners[i]] = names[i];
            }
            
            uint256 registrationId = registrationHistory.length;
            registrationHistory.push(Registration({
                name: names[i],
                owner: owners[i],
                paymentMethod: PaymentMethod.ETH,
                amount: 0,
                timestamp: block.timestamp
            }));
            
            emit NameRegistered(names[i], owners[i], PaymentMethod.ETH, 0, registrationId);
        }
    }
    
    function addPremiumName(string memory name, uint256 estimatedValue, string memory category) external onlyOwner {
        premiumNames.push(PremiumName({
            name: name,
            estimatedValue: estimatedValue,
            category: category,
            isSecured: nameToOwner[name] == owner()
        }));
        premiumNameIndex[name] = premiumNames.length - 1;
    }
    
    // === DASHBOARD DATA FUNCTIONS ===
    
    function getDashboardData() external view returns (
        uint256 totalRegs,
        uint256 ethRev,
        uint256 usdcRev,
        uint256 virtualRev,
        uint256 ethRegs,
        uint256 usdcRegs,
        uint256 virtualRegs,
        uint256 totalRevenueUSD
    ) {
        totalRegs = totalRegistrations[PaymentMethod.ETH] + 
                   totalRegistrations[PaymentMethod.USDC] + 
                   totalRegistrations[PaymentMethod.VIRTUAL];
        
        ethRev = totalRevenue[PaymentMethod.ETH];
        usdcRev = totalRevenue[PaymentMethod.USDC];
        virtualRev = totalRevenue[PaymentMethod.VIRTUAL];
        
        ethRegs = totalRegistrations[PaymentMethod.ETH];
        usdcRegs = totalRegistrations[PaymentMethod.USDC];
        virtualRegs = totalRegistrations[PaymentMethod.VIRTUAL];
        
        // Simplified USD calculation (in real implementation, use price oracles)
        totalRevenueUSD = (ethRev * 3500 / 1 ether) + (usdcRev / 1000000) + (virtualRev * 3 / 1 ether);
    }
    
    function getContractBalances() external view returns (
        uint256 ethBalance,
        uint256 usdcBalance,
        uint256 virtualBalance
    ) {
        return (
            address(this).balance,
            USDC.balanceOf(address(this)),
            VIRTUAL.balanceOf(address(this))
        );
    }
    
    function getRecentRegistrations(uint256 count) external view returns (
        string[] memory names,
        address[] memory owners,
        uint8[] memory paymentMethods,
        uint256[] memory amounts,
        uint256[] memory timestamps
    ) {
        uint256 total = registrationHistory.length;
        uint256 start = total > count ? total - count : 0;
        uint256 length = total - start;
        
        names = new string[](length);
        owners = new address[](length);
        paymentMethods = new uint8[](length);
        amounts = new uint256[](length);
        timestamps = new uint256[](length);
        
        for (uint256 i = 0; i < length; i++) {
            uint256 index = start + i;
            Registration memory reg = registrationHistory[index];
            names[i] = reg.name;
            owners[i] = reg.owner;
            paymentMethods[i] = uint8(reg.paymentMethod);
            amounts[i] = reg.amount;
            timestamps[i] = reg.timestamp;
        }
    }
    
    function getDailyRegistrations(uint256[] memory timestamps) external view returns (uint256[] memory counts) {
        counts = new uint256[](timestamps.length);
        for (uint256 i = 0; i < timestamps.length; i++) {
            uint256 dayTimestamp = (timestamps[i] / 86400) * 86400;
            counts[i] = dailyRegistrations[dayTimestamp];
        }
    }
    
    function getPremiumNames() external view returns (
        string[] memory names,
        uint256[] memory estimatedValues,
        string[] memory categories,
        bool[] memory isSecured
    ) {
        uint256 length = premiumNames.length;
        names = new string[](length);
        estimatedValues = new uint256[](length);
        categories = new string[](length);
        isSecured = new bool[](length);
        
        for (uint256 i = 0; i < length; i++) {
            PremiumName memory premium = premiumNames[i];
            names[i] = premium.name;
            estimatedValues[i] = premium.estimatedValue;
            categories[i] = premium.category;
            isSecured[i] = nameToOwner[premium.name] == owner();
        }
    }
    
    function getRegistrationHistory() external view returns (Registration[] memory) {
        return registrationHistory;
    }
    
    // === TRANSFER FUNCTIONS ===
    
    function transfer(string memory name, address to) external {
        require(nameToOwner[name] == msg.sender, "Not your name!");
        require(to != address(0), "Can't send to nobody!");
        require(to != msg.sender, "Already your name!");
        
        address from = msg.sender;
        nameToOwner[name] = to;
        
        if (keccak256(bytes(addressToPrimaryName[from])) == keccak256(bytes(name))) {
            addressToPrimaryName[from] = "";
        }
        
        emit NameTransferred(name, from, to);
    }
    
    function initiateTransfer(string memory name, address to) external {
        require(nameToOwner[name] == msg.sender, "Not your name!");
        require(to != address(0), "Invalid recipient!");
        require(to != msg.sender, "Can't transfer to yourself!");
        
        pendingTransfers[name] = to;
        emit TransferInitiated(name, msg.sender, to);
    }
    
    function acceptTransfer(string memory name) external {
        require(pendingTransfers[name] == msg.sender, "No pending transfer for you!");
        
        address from = nameToOwner[name];
        nameToOwner[name] = msg.sender;
        delete pendingTransfers[name];
        
        if (keccak256(bytes(addressToPrimaryName[from])) == keccak256(bytes(name))) {
            addressToPrimaryName[from] = "";
        }
        
        emit NameTransferred(name, from, msg.sender);
    }
    
    // === RESOLUTION FUNCTIONS ===
    
    function resolve(string memory name) external view returns (address) {
        return nameToAddress[name];
    }
    
    function getText(string memory name, string memory key) external view returns (string memory) {
        return textRecords[name][key];
    }
    
    function getPrimaryName(address addr) external view returns (string memory) {
        return addressToPrimaryName[addr];
    }
    
    function setAddress(string memory name, address newAddress) external {
        require(nameToOwner[name] == msg.sender, "Not your name!");
        nameToAddress[name] = newAddress;
        emit AddressUpdated(name, newAddress);
    }
    
    function setText(string memory name, string memory key, string memory value) external {
        require(nameToOwner[name] == msg.sender, "Not your name!");
        textRecords[name][key] = value;
        emit RecordUpdated(name, key, value);
    }
    
    function setPrimaryName(string memory name) external {
        require(nameToOwner[name] == msg.sender, "Not your name!");
        addressToPrimaryName[msg.sender] = name;
    }
    
    // === ADMIN FUNCTIONS ===
    
    function updatePrices(uint256 _ethPrice, uint256 _usdcPrice, uint256 _virtualPrice) external onlyOwner {
        ethPrice = _ethPrice;
        usdcPrice = _usdcPrice;
        virtualPrice = _virtualPrice;
        emit PricesUpdated(_ethPrice, _usdcPrice, _virtualPrice);
    }
    
    function withdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        payable(owner()).transfer(balance);
    }
    
    function withdrawUSDC() external onlyOwner {
        uint256 balance = USDC.balanceOf(address(this));
        require(balance > 0, "No USDC to withdraw");
        USDC.safeTransfer(owner(), balance);
    }
    
    function withdrawVIRTUAL() external onlyOwner {
        uint256 balance = VIRTUAL.balanceOf(address(this));
        require(balance > 0, "No VIRTUAL to withdraw");
        VIRTUAL.safeTransfer(owner(), balance);
    }
    
    function withdrawAll() external onlyOwner {
        if (address(this).balance > 0) {
            payable(owner()).transfer(address(this).balance);
        }
        
        uint256 usdcBalance = USDC.balanceOf(address(this));
        if (usdcBalance > 0) {
            USDC.safeTransfer(owner(), usdcBalance);
        }
        
        uint256 virtualBalance = VIRTUAL.balanceOf(address(this));
        if (virtualBalance > 0) {
            VIRTUAL.safeTransfer(owner(), virtualBalance);
        }
    }
    
    // === UTILITY FUNCTIONS ===
    
    function isAvailable(string memory name) external view returns (bool) {
        return nameToOwner[name] == address(0);
    }
    
    function getNameInfo(string memory name) external view returns (
        address owner,
        address resolvedAddress,
        uint256 regTime,
        string memory avatar,
        string memory bio
    ) {
        return (
            nameToOwner[name],
            nameToAddress[name],
            registrationTime[name],
            textRecords[name]["avatar"],
            textRecords[name]["bio"]
        );
    }
}
