import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Web3 from 'web3';
import PlayerList from './components/PlayerList';
import GameBoard from './components/GameBoard';
import MonopolyGameABI from './abis/MonopolyGame.json'; // 导入 MonopolyGame ABI
import MockUsdtABI from './abis/MockUSDT.json'; // 导入 MockUSDT ABI

const CONTRACTS = {
    sepolia: {
        address: '0xYourSepoliaContractAddress',
        usdt: '0xYourSepoliaUSDTAddress',
        abi: MonopolyGameABI, // 使用导入的 ABI
    },
    reddioDevnet: {
        address: '0x92B0E62e922508814Fe5f4E68670eA32FBB5832e',
        usdt: '0x2Dc0A25109caBF353278120E98924D741bd4B177',
        abi: MockUsdtABI, // 使用导入的 ABI
    },
};

function App() {
    const [account, setAccount] = useState('');
    const [usdtAmount, setUsdtAmount] = useState('');
    const [network, setNetwork] = useState('sepolia');
    const [players, setPlayers] = useState([]);
    const [web3, setWeb3] = useState(null);
    const [contract, setContract] = useState(null);
    const [usdtContract, setUsdtContract] = useState(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [currentPlayer, setCurrentPlayer] = useState(null);

    useEffect(() => {
        loadWeb3();
    }, [network]);

    const loadWeb3 = async () => {
        if (window.ethereum) {
            const web3Instance = new Web3(window.ethereum);
            await window.ethereum.enable();
            const accounts = await web3Instance.eth.getAccounts();
            const chainId = await web3Instance.eth.getChainId();
            const targetChainId = network === 'sepolia' ? 11155111 : 50341;
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
                }
            }
            setWeb3(web3Instance);
            setAccount(accounts[0]);
            const contractInstance = new web3Instance.eth.Contract(CONTRACTS[network].abi, CONTRACTS[network].address);
            setContract(contractInstance);
            const usdtContractInstance = new web3Instance.eth.Contract(MockUsdtABI, CONTRACTS[network].usdt);
            setUsdtContract(usdtContractInstance);
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
            await usdtContract.methods.approve(CONTRACTS[network].address, amountWei).send({ from: account });
            await contract.methods.joinGame(amountWei).send({ from: account });

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
            const res = await axios.post('http://localhost:8080/roll', { player_id: currentPlayer.id });
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
            const usdtPayouts = res.data.usdt_payouts;
            const winner = res.data.winner;

            const addresses = usdtPayouts.map(p => p.wallet_addr);
            const usdtShares = usdtPayouts.map(p => web3.utils.toWei(p.usdt.toString(), 'mwei'));
            await contract.methods.distribute(addresses, usdtShares).send({ from: account });

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
            <select value={network} onChange={(e) => setNetwork(e.target.value)}>
                <option value="sepolia">Sepolia</option>
                <option value="reddioDevnet">Reddio Devnet</option>
            </select>

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