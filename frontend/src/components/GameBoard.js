import React from 'react';

function GameBoard({ players }) {
    const board = Array(16).fill(null).map((_, idx) => ({
        index: idx,
        owner: players.find(p => p.position === idx)?.id || '',
    }));

    return (
        <div className="game-board">
            <h2>Game Board</h2>
            <div className="board-grid">
                {board.map(cell => (
                    <div key={cell.index} className="board-cell">
                        {cell.index} {cell.owner ? `(${cell.owner.slice(0, 6)}...)` : ''}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default GameBoard;