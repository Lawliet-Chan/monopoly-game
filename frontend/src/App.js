import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Web3 from 'web3';
import PlayerList from './components/PlayerList';
import GameBoard from './components/GameBoard';

// 替换为实际部署的合约地址和 ABI
const CONTRACT_ADDRESS = '0xYourContractAddress'; // 替换为 Hardhat 部署后的地址
const USDT_ADDRESS = '0xYourUSDTAddress'; // 替换为 USDT 或 MockUSDT 地址
const ABI = [/* 粘贴 MonopolyGame.sol 的 ABI */]; // 从 Hardhat artifacts 获取

function App() {
    const [account, setAccount] = useState('');
    const [usdtAmount, setUsdtAmount] = useState('');
    const [players, setPlayers] = useState([]);
    const [web3, setWeb3] = useState(null);
    const [contract, setContract] = useState(null);
    const [gameStarted, setGameStarted] = useState(false);

    useEffect(() => {
        loadWeb3();
    }, []);

    const loadWeb3 = async () => {
        if (window.ethereum) {
            const web3Instance = new Web3(window.ethereum);
            await window.ethereum.enable();
            const accounts = await web3Instance.eth.getAccounts();
            setWeb3(web3Instance);
            setAccount(accounts[0]);
            const contractInstance = new web3Instance.eth.Contract(ABI, CONTRACT_ADDRESS);
            setContract(contractInstance);
        } else {
            alert('Please install MetaMask to use this app!');
        }
    };

    const joinGame = async () => {
        if (!usdtAmount || usdtAmount < 3) {
            alert('Please enter at least 3 USDT');
            return;
        }

        const amount = web3.utils.toWei(usdtAmount, 'mwei'); // 假设 USDT 是 6 位小数
        try {
            // 假设已授权 USDT 给合约（实际需先调用 approve）
            await contract.methods.joinGame(amount).send({ from: account });

            const res = await axios.post('http://localhost:8080/join', {
                player_id: account,
                usdt_amount: parseFloat(usdtAmount),
                wallet_addr: account,
            });
            setPlayers([...players, res.data]);
            setUsdtAmount('');
            setGameStarted(true);
        } catch (error) {
            console.error('Join game failed:', error);
            alert('Failed to join game. Check console for details.');
        }
    };

    const endGame = async () => {
        try {
            const res = await axios.post('http://localhost:8080/end');
            const payouts = res.data.payouts;

            const addresses = payouts.map(p => p.wallet_addr);
            const shares = payouts.map(p => web3.utils.toWei(p.usdt.toString(), 'mwei'));
            await contract.methods.distribute(addresses, shares).send({ from: account });

            alert('Game ended! Payouts distributed.');
            setPlayers([]);
            setGameStarted(false);
        } catch (error) {
            console.error('End game failed:', error);
            alert('Failed to end game. Check console for details.');
        }
    };

    return (
        <div className="app">
            <h1>Monopoly Game</h1>
            <p>Connected Account: {account || 'Not connected'}</p>

            {!gameStarted ? (
                <div className="join-section">
                    <h2>Join Game</h2>
                    <input
                        type="number"
                        value={usdtAmount}
                        onChange={(e) => setUsdtAmount(e.target.value)}
                        placeholder="Enter USDT amount (min 3)"
                    />
                    <button onClick={joinGame}>Join</button>
                </div>
            ) : (
                <div className="game-section">
                    <GameBoard players={players} />
                    <PlayerList players={players} />
                    <button onClick={endGame}>End Game</button>
                </div>
            )}
        </div>
    );
}

export default App;