require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const { PRIVATE_KEY, SEPOLIA_RPC_URL } = process.env;

module.exports = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
      accounts: [PRIVATE_KEY],
    },
    reddioDevnet: {
      url: "https://reddio-dev.reddio.com",
      accounts: [PRIVATE_KEY],
      chainId: 50341,
    },
  },
  // paths: {
  //   solc: "~/.solc-bin/soljson/solc",
  // },
};