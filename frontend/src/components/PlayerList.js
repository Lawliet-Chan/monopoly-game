import React from 'react';

function PlayerList({ players }) {
    return (
        <div className="player-list">
            <h2>Players</h2>
            <ul>
                {players.map((player, index) => (
                    <li key={index}>
                        {player.id.slice(0, 6)}...: {player.game_coins} coins, Position: {player.position}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default PlayerList;