import React from 'react';
import './GameBoard.css';

function GameBoard({ players, playerColors }) {
    const boardSize = 61;
    const board = Array(boardSize).fill(null).map((_, idx) => ({
        index: idx,
        owner: players.find(p => p.ownedProperties?.some(prop => prop.index === idx))?.id || '',
    }));

    const width = 16;
    const height = 15;

    return (
        <div className="game-board">
            <h2>Game Board (61 Tiles - Rectangular Loop)</h2>
            <div className="board-container">
                {board.map((cell, idx) => {
                    const style = getTileStyle(idx, width, height);
                    const ownerColor = cell.owner ? playerColors[cell.owner] : null;
                    return (
                        <div
                            key={cell.index}
                            className={`board-cell ${cell.owner ? 'owned' : ''}`}
                            style={{ ...style, backgroundColor: ownerColor || '#e0e0e0' }}
                            title={`Tile ${cell.index + 1}`}
                        >
                            {players.some(p => p.position === idx) ? (
                                <span className="player-marker">[you]</span>
                            ) : (
                                <span className="tile-number">{cell.index + 1}</span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function getTileStyle(position, width, height) {
    const tileSize = 50;

    if (position < width) {
        return { left: `${position * tileSize}px`, top: '0px' };
    } else if (position < width + height - 1) {
        return {
            left: `${(width - 1) * tileSize}px`,
            top: `${(position - width + 1) * tileSize}px`,
        };
    } else if (position < width + height - 1 + width - 1) {
        const bottomPos = position - (width + height - 1);
        return {
            left: `${(width - 2 - bottomPos) * tileSize}px`,
            top: `${(height - 1) * tileSize}px`,
        };
    } else {
        const leftPos = position - (width + height - 1 + width - 1);
        return {
            left: '0px',
            top: `${(height - 2 - leftPos) * tileSize}px`,
        };
    }
}

export default GameBoard;