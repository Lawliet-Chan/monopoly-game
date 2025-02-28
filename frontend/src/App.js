import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Web3 from 'web3';
import PlayerList from './components/PlayerList';
import GameBoard from './components/GameBoard';

const CONTRACT_ADDRESS = '0xYourContractAddress'; // 替换为实际地址
const USDT_ADDRESS = '0xYourUSDTAddress'; // 替换为实际地址
const ABI = [/* 粘贴 MonopolyGame.sol 的 ABI */];

function App() {
    const [account, setAccount] = useState('');
    const [usdtAmount, setUsdtAmount] = useState('');
    const [players, setPlayers] = useState([]);
    const [web3, setWeb3] = useState(null);
    const [contract, setContract] = useState(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [currentPlayer, setCurrentPlayer] = useState(null);

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
            alert('Please install MetaMask!');
        }
    };

    const joinGame = async () => {
        if (!usdtAmount || usdtAmount < 3) {
            alert('Please enter at least 3 USDT');
            return;
        }
        const amount = web3.utils.toWei(usdtAmount, 'mwei');
        try {
            await contract.methods.joinGame(amount).send({ from: account });
            const res = await axios.post('http://localhost:8080/join', {
                player_id: account,
                usdt_amount: parseFloat(usdtAmount),
                wallet_addr: account,
            });
            setPlayers([...players, res.data]);
            setUsdtAmount('');
            setGameStarted(true);
            setCurrentPlayer(res.data);
        } catch (error) {
            console.error(error);
            alert('Failed to join game');
        }
    };

    const rollDice = async () => {
        try {
            const res = await axios.post('http://localhost:8080/roll', {
                player_id: currentPlayer.id,
            });
            const updatedPlayers = players.map(p =>
                p.id === res.data.player_id ? { ...p, position: res.data.position } : p
            );
            setPlayers(updatedPlayers);
            setCurrentPlayer(updatedPlayers.find(p => p.id === currentPlayer.id));
        } catch (error) {
            console.error(error);
            alert('Failed to roll dice');
        }
    };

    const buyProperty = async () => {
        try {
            const res = await axios.post('http://localhost:8080/buy', {
                player_id: currentPlayer.id,
                property_idx: currentPlayer.position,
            });
            if (res.status === 200) {
                const updatedPlayers = players.map(p =>
                    p.id === currentPlayer.id ? { ...p, game_coins: p.game_coins - 500 } : p
                );
                setPlayers(updatedPlayers);
                setCurrentPlayer(updatedPlayers.find(p => p.id === currentPlayer.id));
            }
        } catch (error) {
            console.error(error);
            alert('Failed to buy property');
        }
    };

    const sellProperty = async () => {
        try {
            const res = await axios.post('http://localhost:8080/sell', {
                player_id: currentPlayer.id,
                property_idx: currentPlayer.position,
            });
            if (res.status === 200) {
                const updatedPlayers = players.map(p =>
                    p.id === currentPlayer.id ? { ...p, game_coins: p.game_coins + 250 } : p
                );
                setPlayers(updatedPlayers);
                setCurrentPlayer(updatedPlayers.find(p => p.id === currentPlayer.id));
            }
        } catch (error) {
            console.error(error);
            alert('Failed to sell property');
        }
    };

    const endGame = async () => {
        try {
            const res = await axios.post('http://localhost:8080/end');
            const payouts = res.data.payouts;
            const winner = res.data.winner;

            const addresses = payouts.map(p => p.wallet_addr);
            const shares = payouts.map(p => web3.utils.toWei(p.usdt.toString(), 'mwei'));
            await contract.methods.distribute(addresses, shares).send({ from: account });

            alert(`Game ended! Winner: ${winner}`);
            setPlayers([]);
            setGameStarted(false);
            setCurrentPlayer(null);
        } catch (error) {
            console.error(error);
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
                        placeholder="Enter USDT amount (min 3)"
                    />
                    <button onClick={joinGame}>Join</button>
                </div>
            ) : (
                <div className="game-section">
                    <GameBoard players={players} />
                    <PlayerList players={players} />
                    <div className="game-controls">
                        <button onClick={rollDice}>Roll Dice</button>
                        <button onClick={buyProperty}>Buy Property</button>
                        <button onClick={sellProperty}>Sell Property</button>
                        <button onClick={endGame}>End Game</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;