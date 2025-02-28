import React from 'react';

function PlayerList({ players }) {
    return (
        <div className="player-list">
            <h2>Players</h2>
            <ul>
                {players.map((player, index) => (
                    <li key={index}>
                        {player.id}: {player.game_coins} coins ({player.usdt_locked} USDT locked)
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default PlayerList;