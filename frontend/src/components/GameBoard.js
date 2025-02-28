import React from 'react';

function GameBoard({ players }) {
    // 简单模拟一个 4x4 格子的大富翁棋盘
    const board = Array(16).fill(null);

    return (
        <div className="game-board">
            <h2>Game Board</h2>
            <div className="board-grid">
                {board.map((_, index) => (
                    <div key={index} className="board-cell">
                        {players.some(p => p.position === index) ? 'P' : index}
                    </div>
                ))}
            </div>
            <p>Note: This is a simplified board. Players start at 0.</p>
        </div>
    );
}

export default GameBoard;