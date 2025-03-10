import React from 'react';

function PlayerList({ players }) {
    return (
        <div>
            <h2>Players</h2>
            <ul>
                {players.map((player, index) => (
                    <li key={index}>
                        {player.nickname || player.id.slice(0, 6)}: {player.game_coins} coins, Position: {player.position}
                        {player.ownedProperties?.length > 0 && (
                            <ul>
                                Owned Properties:
                                {player.ownedProperties.map((prop, idx) => (
                                    <li key={idx}>Tile {prop.index + 1}: {prop.price} coins</li>
                                ))}
                            </ul>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default PlayerList;