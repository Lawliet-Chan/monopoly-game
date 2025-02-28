const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    try {
        // 部署 MockUSDT
        const MockUSDT = await hre.ethers.getContractFactory("MockUSDT");
        console.log("Deploying MockUSDT...");
        const mockUSDT = await MockUSDT.deploy();
        console.log("Waiting for MockUSDT deployment...");
        await mockUSDT.waitForDeployment(); // 替换 .deployed()，等待部署完成
        console.log("MockUSDT deployed to:", mockUSDT.target); // 使用 .target 而非 .address

        // 部署 MonopolyGame
        const MonopolyGame = await hre.ethers.getContractFactory("MonopolyGame");
        console.log("Deploying MonopolyGame...");
        const monopolyGame = await MonopolyGame.deploy(mockUSDT.target, deployer.address);
        console.log("Waiting for MonopolyGame deployment...");
        await monopolyGame.waitForDeployment();
        console.log("MonopolyGame deployed to:", monopolyGame.target);

        // 验证部署者余额
        const deployerBalance = await mockUSDT.balanceOf(deployer.address);
        console.log(`Deployer balance: ${hre.ethers.utils.formatUnits(deployerBalance, 6)} USDT`);
    } catch (error) {
        console.error("Deployment failed:", error);
        throw error; // 确保错误被抛出
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Script execution failed:", error);
        process.exit(1);
    });