import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Web3 from 'web3';
import PlayerList from './components/PlayerList';
import GameBoard from './components/GameBoard';
import MonopolyGameABI from './abis/MonopolyGame.json';
import MockUsdtABI from './abis/MockUSDT.json';
import './DiceAnimation.css';

// 统一配置 API Host
// const API_HOST = 'http://backend:8080'; // Docker 容器内访问后端服务
const API_HOST = 'http://localhost:8080';

const CONTRACTS = {
    reddioDevnet: {
        address: '0x201f8DB393B397EB9A4B37527a48F5eB5F0a127a',
        usdt: '0x92B0E62e922508814Fe5f4E68670eA32FBB5832e',
        abi: MonopolyGameABI,
    },
};

const generateColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
};

function App() {
    const [account, setAccount] = useState('');
    const [usdtAmount, setUsdtAmount] = useState('');
    const [players, setPlayers] = useState([]);
    const [properties, setProperties] = useState([]);
    const [web3, setWeb3] = useState(null);
    const [contract, setContract] = useState(null);
    const [usdtContract, setUsdtContract] = useState(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [diceValue, setDiceValue] = useState(null);
    const [rolling, setRolling] = useState(false);
    const [playerColors, setPlayerColors] = useState({});
    const [rounds, setRounds] = useState(0);

    useEffect(() => {
        loadWeb3();
    }, []);

    const loadWeb3 = async () => {
        if (window.ethereum) {
            const web3Instance = new Web3(window.ethereum);
            await window.ethereum.enable();
            const accounts = await web3Instance.eth.getAccounts();
            const chainId = await web3Instance.eth.getChainId();
            const targetChainId = 50341;
            if (chainId !== targetChainId) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
                    });
                } catch (switchError) {
                    if (switchError.code === 4902) {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: '0xC485',
                                chainName: 'Reddio Devnet',
                                rpcUrls: ['https://reddio-dev.reddio.com'],
                                nativeCurrency: { name: 'RED', symbol: 'RED', decimals: 18 },
                                blockExplorerUrls: ['https://reddio-devnet.l2scan.co'],
                            }],
                        });
                    }
                    console.error("Failed to switch network:", switchError);
                    return;
                }
            }
            setWeb3(web3Instance);
            setAccount(accounts[0]);
            const contractInstance = new web3Instance.eth.Contract(
                CONTRACTS.reddioDevnet.abi,
                CONTRACTS.reddioDevnet.address
            );
            setContract(contractInstance);
            const usdtContractInstance = new web3Instance.eth.Contract(
                MockUsdtABI,
                CONTRACTS.reddioDevnet.usdt
            );
            setUsdtContract(usdtContractInstance);
            console.log("Connected to Reddio Devnet with account:", accounts[0]);
        } else {
            alert('Please install MetaMask!');
        }
    };

    const joinGame = async () => {
        if (!usdtAmount || usdtAmount < 3) {
            alert('Please enter at least 3 USDT');
            return;
        }

        try {
            const amountWei = web3.utils.toWei(usdtAmount, 'mwei');
            await usdtContract.methods.approve(CONTRACTS.reddioDevnet.address, amountWei).send({ from: account });
            await contract.methods.joinGame(amountWei).send({ from: account });

            const res = await axios.post(`${API_HOST}/join`, {
                player_id: account,
                usdt_amount: parseFloat(usdtAmount),
                wallet_addr: account,
            });
            const newPlayer = { ...res.data, color: generateColor() };
            setPlayers([newPlayer]);
            setPlayerColors({ [newPlayer.id]: newPlayer.color });
            setUsdtAmount('');
            setGameStarted(true);
            setCurrentPlayer(newPlayer);

            const propertiesRes = await axios.get(`${API_HOST}/properties`);
            setProperties(propertiesRes.data);
            console.log("Player joined:", newPlayer);
        } catch (error) {
            console.error("Join game failed:", error);
            alert('Failed to join game: ' + (error.message || 'Unknown error'));
        }
    };

    const rollDice = async () => {
        if (rolling || !gameStarted) return;
        setRolling(true);
        setDiceValue(null);

        setTimeout(async () => {
            try {
                const res = await axios.post(`${API_HOST}/roll`, { player_id: currentPlayer.id });
                const updatedPlayers = players.map(p =>
                    p.id === res.data.player_id ? { ...p, position: res.data.position } : p
                );
                setPlayers(updatedPlayers);
                setCurrentPlayer(updatedPlayers[0]);
                setDiceValue(res.data.dice);
                setRolling(false);
                setRounds(prev => prev + 1);

                const propertiesRes = await axios.get(`${API_HOST}/properties`);
                setProperties(propertiesRes.data);
                console.log("Dice rolled, value:", res.data.dice, "new position:", res.data.position, "round:", rounds + 1);
            } catch (error) {
                console.error("Roll dice failed:", error);
                alert('Failed to roll dice');
                setRolling(false);
            }
        }, 1000);
    };

    const buyProperty = async () => {
        if (!gameStarted) return;
        try {
            const res = await axios.post(`${API_HOST}/buy`, {
                player_id: currentPlayer.id,
                property_idx: currentPlayer.position,
            });
            if (res.status === 200) {
                const updatedPlayers = players.map(p =>
                    p.id === currentPlayer.id
                        ? {
                            ...p,
                            game_coins: p.game_coins - res.data.price,
                            ownedProperties: [...(p.ownedProperties || []), {
                                index: currentPlayer.position,
                                price: res.data.price,
                            }],
                        }
                        : p
                );
                setPlayers(updatedPlayers);
                setCurrentPlayer(updatedPlayers[0]);
                const propertiesRes = await axios.get(`${API_HOST}/properties`);
                setProperties(propertiesRes.data);
                console.log("Property bought at index:", currentPlayer.position, "price:", res.data.price);
            }
        } catch (error) {
            console.error("Buy property failed:", error);
            alert('Failed to buy property');
        }
    };

    const sellProperty = async () => {
        if (!gameStarted) return;
        try {
            const res = await axios.post(`${API_HOST}/sell`, {
                player_id: currentPlayer.id,
                property_idx: currentPlayer.position,
            });
            if (res.status === 200) {
                const updatedPlayers = players.map(p =>
                    p.id === currentPlayer.id
                        ? {
                            ...p,
                            game_coins: p.game_coins + res.data.price / 2,
                            ownedProperties: p.ownedProperties.filter(prop => prop.index !== currentPlayer.position),
                        }
                        : p
                );
                setPlayers(updatedPlayers);
                setCurrentPlayer(updatedPlayers[0]);
                const propertiesRes = await axios.get(`${API_HOST}/properties`);
                setProperties(propertiesRes.data);
                console.log("Property sold at index:", currentPlayer.position);
            }
        } catch (error) {
            console.error("Sell property failed:", error);
            alert('Failed to sell property');
        }
    };

    const endGame = async () => {
        try {
            const res = await axios.post(`${API_HOST}/end`);
            const usdtPayouts = res.data.usdt_payouts;
            const winner = res.data.winner;

            const addresses = usdtPayouts.map(p => p.wallet_addr);
            const usdtShares = usdtPayouts.map(p => web3.utils.toWei(p.usdt.toString(), 'mwei'));
            await contract.methods.distribute(addresses, usdtShares).send({ from: account });

            alert(`Game ended! Winner: ${winner}`);
            setPlayers([]);
            setGameStarted(false);
            setCurrentPlayer(null);
            setRounds(0);
            setProperties([]);
            console.log("Game ended, winner:", winner);
        } catch (error) {
            console.error("End game failed:", error);
            alert('Failed to end game');
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
                        placeholder="Enter USDT (min 3)"
                    />
                    <button onClick={joinGame}>Join</button>
                </div>
            ) : (
                <div className="game-section">
                    <GameBoard players={players} playerColors={playerColors} properties={properties} />
                    <PlayerList players={players} />
                    <div className="game-controls">
                        <button onClick={rollDice} disabled={rolling}>
                            {rolling ? 'Rolling...' : 'Roll Dice'}
                        </button>
                        {diceValue && <span className="dice-result">Dice: {diceValue}</span>}
                        <button onClick={buyProperty}>Buy Property</button>
                        <button onClick={sellProperty}>Sell Property</button>
                        <button onClick={endGame}>End Game</button>
                        <p>Round: {rounds}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;