import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Web3 from 'web3';
import PlayerList from './components/PlayerList';
import GameBoard from './components/GameBoard';
import MonopolyGameABI from './abis/MonopolyGame.json';
import MockUsdtABI from './abis/MockUSDT.json';
import './App.css';

const API_HOST = 'http://localhost:8080';

const CONTRACTS = {
    reddioDevnet: {
        address: '0x201f8DB393B397EB9A4B37527a48F5eB5F0a127a',
        usdt: '0x92B0E62e922508814Fe5f4E68670eA32FBB5832e',
        abi: MonopolyGameABI,
    },
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
    const [error, setError] = useState(null); // 新增错误状态

    useEffect(() => {
        loadWeb3().catch((err) => {
            setError('Failed to load Web3: ' + err.message);
        });
    }, []);

    const loadWeb3 = async () => {
        if (!window.ethereum) {
            setError('MetaMask is not installed or not detected!');
            return;
        }
        try {
            const web3Instance = new Web3(window.ethereum);
            await window.ethereum.enable();
            const accounts = await web3Instance.eth.getAccounts();
            const chainId = await web3Instance.eth.getChainId();
            const targetChainId = 50341;
            if (chainId !== targetChainId) {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: `0x${targetChainId.toString(16)}` }],
                });
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
        } catch (error) {
            setError('Web3 initialization failed: ' + error.message);
        }
    };

    const joinGame = async () => {
        if (!usdtAmount || usdtAmount < 3) {
            setError('Please enter at least 3 USDT');
            return;
        }
        try {
            if (!web3 || !usdtContract) {
                setError('Web3 or USDT contract not initialized');
                return;
            }
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
            setError(null); // 清除错误
        } catch (error) {
            setError('Join game failed: ' + (error.response?.data?.error || error.message));
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
                const propertiesRes = await axios.get(`${API_HOST}/properties`);
                setProperties(propertiesRes.data);
                setError(null);
            } catch (error) {
                setError('Roll dice failed: ' + (error.response?.data?.error || error.message));
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
            setError(null);
        } catch (error) {
            setError('Buy property failed: ' + (error.response?.data?.error || error.message));
        }
    };

    const sellProperty = async () => {
        if (!gameStarted) return;
        try {
            const res = await axios.post(`${API_HOST}/sell`, {
                player_id: currentPlayer.id,
                property_idx: currentPlayer.position,
            });
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
            setError(null);
        } catch (error) {
            setError('Sell property failed: ' + (error.response?.data?.error || error.message));
        }
    };

    return (
        <div className="app" style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <h1 style={{ margin: '10px 0', textAlign: 'center' }}>Monopoly Game</h1>
            <p style={{ margin: '0', textAlign: 'center' }}>Connected Account: {account || 'Not connected'}</p>
            {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
            {!gameStarted ? (
                <div className="join-section" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <h2>Join Game</h2>
                    <input
                        type="number"
                        value={usdtAmount}
                        onChange={(e) => setUsdtAmount(e.target.value)}
                        placeholder="Enter USDT (min 3)"
                        style={{ margin: '10px', padding: '5px' }}
                    />
                    <button onClick={joinGame} style={{ padding: '10px 20px' }}>Join</button>
                </div>
            ) : (
                <div className="game-section" style={{ flex: 1, display: 'flex', flexDirection: 'row' }}>
                    <div style={{ width: '75%', height: '100%' }}>
                        <GameBoard players={players} playerColors={playerColors} properties={properties} />
                    </div>
                    <div style={{ width: '25%', height: '100%', overflowY: 'auto', padding: '10px', backgroundColor: '#f0f0f0' }}>
                        <PlayerList players={players} />
                    </div>
                    <div className="game-controls" style={{ position: 'absolute', bottom: 0, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px', backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
                        <button onClick={rollDice} disabled={rolling} style={{ margin: '0 10px', padding: '10px 20px' }}>
                            {rolling ? 'Rolling...' : 'Roll Dice'}
                        </button>
                        {rolling && <span className="dice-animation">🎲</span>}
                        {diceValue && !rolling && <span className="dice-result">🎲 {diceValue}</span>}
                        <button onClick={buyProperty} style={{ margin: '0 10px', padding: '10px 20px' }}>Buy Property</button>
                        <button onClick={sellProperty} style={{ margin: '0 10px', padding: '10px 20px' }}>Sell Property</button>
                    </div>
                </div>
            )}
        </div>
    );
}

function generateColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

export default App;