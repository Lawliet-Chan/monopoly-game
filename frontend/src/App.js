import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Web3 from 'web3';
import PlayerList from './components/PlayerList';
import GameBoard from './components/GameBoard';
import Dice from './components/Dice';
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
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [diceValue, setDiceValue] = useState(null);
    const [rolling, setRolling] = useState(false);
    const [playerColors, setPlayerColors] = useState({});

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
        } else {
            alert('请安装 MetaMask!');
        }
    };

    const joinGame = async () => {
        if (!usdtAmount || usdtAmount < 3) {
            alert('请输入至少 3 USDT');
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
            setPlayers([...players, newPlayer]);
            setPlayerColors(prev => ({ ...prev, [newPlayer.id]: newPlayer.color }));
            setUsdtAmount('');
            if (!gameStarted) setGameStarted(true);
            const propertiesRes = await axios.get(`${API_HOST}/properties`);
            setProperties(propertiesRes.data);
        } catch (error) {
            alert('加入游戏失败: ' + (error.response?.data?.error || error.message));
        }
    };

    const rollDice = async () => {
        if (rolling || !gameStarted) return;
        setRolling(true);
        setDiceValue(null);
        setTimeout(async () => {
            try {
                const currentPlayer = players[currentPlayerIndex];
                const res = await axios.post(`${API_HOST}/roll`, { player_id: currentPlayer.id });
                const updatedPlayers = players.map(p =>
                    p.id === res.data.player_id ? { ...p, position: res.data.position } : p
                );
                setPlayers(updatedPlayers);
                setDiceValue(res.data.dice);
                setRolling(false);
                const propertiesRes = await axios.get(`${API_HOST}/properties`);
                setProperties(propertiesRes.data);
            } catch (error) {
                alert('投骰子失败: ' + (error.response?.data?.error || error.message));
                setRolling(false);
            }
        }, 1000);
    };

    const buyProperty = async () => {
        if (!gameStarted) return;
        try {
            const currentPlayer = players[currentPlayerIndex];
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
            const propertiesRes = await axios.get(`${API_HOST}/properties`);
            setProperties(propertiesRes.data);
        } catch (error) {
            alert('购买失败: ' + (error.response?.data?.error || error.message));
        }
    };

    const sellProperty = async () => {
        if (!gameStarted) return;
        try {
            const currentPlayer = players[currentPlayerIndex];
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
            const propertiesRes = await axios.get(`${API_HOST}/properties`);
            setProperties(propertiesRes.data);
        } catch (error) {
            alert('出售失败: ' + (error.response?.data?.error || error.message));
        }
    };

    const nextTurn = () => {
        if (!gameStarted) return;
        setCurrentPlayerIndex(prev => (prev + 1) % players.length);
        setDiceValue(null);
    };

    return (
        <div className="app" style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <h1 style={{ textAlign: 'center' }}>Monopoly Game</h1>
            <p style={{ textAlign: 'center' }}>钱包地址: {account || '未连接'}</p>
            {!gameStarted ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <h2>加入游戏</h2>
                    <input
                        type="number"
                        value={usdtAmount}
                        onChange={(e) => setUsdtAmount(e.target.value)}
                        placeholder="输入 USDT (最低 3)"
                        style={{ margin: '10px', padding: '5px' }}
                    />
                    <button onClick={joinGame} style={{ padding: '10px 20px' }}>加入</button>
                </div>
            ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'row' }}>
                    <div style={{ width: '80%' }}>
                        <GameBoard players={players} playerColors={playerColors} properties={properties} />
                    </div>
                    <div style={{ width: '20%', overflowY: 'auto', padding: '10px', backgroundColor: '#f0f0f0' }}>
                        <PlayerList players={players} />
                    </div>
                    <div style={{ position: 'absolute', bottom: 0, width: '100%', padding: '10px', display: 'flex', justifyContent: 'center' }}>
                        <button onClick={rollDice} disabled={rolling} style={{ margin: '0 10px', padding: '10px 20px' }}>
                            {rolling ? '投掷中...' : '投骰子'}
                        </button>
                        {rolling && <Dice value={diceValue} />}
                        {diceValue && !rolling && <span style={{ margin: '0 10px' }}>🎲 {diceValue}</span>}
                        <button onClick={buyProperty} style={{ margin: '0 10px', padding: '10px 20px' }}>购买地块</button>
                        <button onClick={sellProperty} style={{ margin: '0 10px', padding: '10px 20px' }}>出售地块</button>
                        <button onClick={nextTurn} style={{ margin: '0 10px', padding: '10px 20px' }}>下一回合</button>
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