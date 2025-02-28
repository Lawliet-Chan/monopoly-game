const hre = require("hardhat");
const { ethers } = require("ethers"); // 显式导入 ethers

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    try {
        // 部署 MockUSDT
        const MockUSDT = await hre.ethers.getContractFactory("MockUSDT");
        console.log("Deploying MockUSDT...");
        const mockUSDT = await MockUSDT.deploy();
        console.log("Waiting for MockUSDT deployment...");
        await mockUSDT.waitForDeployment();
        console.log("MockUSDT deployed to:", mockUSDT.target);

        // 部署 MonopolyGame
        const MonopolyGame = await hre.ethers.getContractFactory("MonopolyGame");
        console.log("Deploying MonopolyGame...");
        const monopolyGame = await MonopolyGame.deploy(mockUSDT.target, deployer.address);
        console.log("Waiting for MonopolyGame deployment...");
        await monopolyGame.waitForDeployment();
        console.log("MonopolyGame deployed to:", monopolyGame.target);

        // 验证部署者余额
        const deployerBalance = await mockUSDT.balanceOf(deployer.address);
        console.log(`Deployer balance: ${ethers.formatUnits(deployerBalance, 6)} USDT`); // 使用 ethers.formatUnits
    } catch (error) {
        console.error("Deployment failed:", error);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Script execution failed:", error);
        process.exit(1);
    });