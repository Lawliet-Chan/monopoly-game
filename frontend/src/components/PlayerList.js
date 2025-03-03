import React from 'react';

function PlayerList({ players }) {
    return (
        <div>
            <h2>玩家列表</h2>
            <ul>
                {players.map((player, index) => (
                    <li key={index}>
                        {player.id.slice(0, 6)}...: {player.game_coins} 游戏币, 位置: {player.position}
                        {player.ownedProperties?.length > 0 && (
                            <ul>
                                已拥有地块:
                                {player.ownedProperties.map((prop, idx) => (
                                    <li key={idx}>格子 {prop.index + 1}: {prop.price} 游戏币</li>
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