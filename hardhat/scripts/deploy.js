const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    // 部署 MockUSDT
    const MockUSDT = await hre.ethers.getContractFactory("MockUSDT");
    const mockUSDT = await MockUSDT.deploy();
    await mockUSDT.deployed();
    console.log("MockUSDT deployed to:", mockUSDT.address);

    // 部署 MonopolyGame
    const operator = deployer.address; // 假设运营方是部署者
    const MonopolyGame = await hre.ethers.getContractFactory("MonopolyGame");
    const monopolyGame = await MonopolyGame.deploy(mockUSDT.address, operator);
    await monopolyGame.deployed();
    console.log("MonopolyGame deployed to:", monopolyGame.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });