# monopoly-game

## Run Locally

### contracts
1. Install 
```
cd hardhat
npm install --save-dev hardhat
npm install @openzeppelin/contracts dotenv
```
2. Fill in `.env`
```
PRIVATE_KEY=你的私钥
SEPOLIA_RPC_URL=https://rpc.sepolia.org
```
3. Comile and Deploy
```
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia
```

### Frontend
1. Fill the contracts address in `frontend/src/App.js`
```
const CONTRACT_ADDRESS = '0xYourContractAddress'; // 替换为实际地址
const USDT_ADDRESS = '0xYourUSDTAddress'; // 替换为实际地址
const ABI = [/* 粘贴 MonopolyGame.sol 的 ABI */];
```
2. Run
```
npm install
npm start
```

### Backend
