import React from 'react';
import './GameBoard.css';

function GameBoard({ players }) {
    const boardSize = 61; // 61 个地块
    const board = Array(boardSize).fill(null).map((_, idx) => ({
        index: idx,
        owner: players.find(p => p.position === idx)?.id || '',
    }));

    // 定义矩形周长路径 (16x15)
    const width = 16; // 顶部
    const height = 15; // 右侧和左侧

    return (
        <div className="game-board">
            <h2>Game Board (61 Tiles - Rectangular Loop)</h2>
            <div className="board-container">
                {board.map((cell, idx) => {
                    const style = getTileStyle(idx, width, height);
                    return (
                        <div
                            key={cell.index}
                            className={`board-cell ${cell.owner ? 'owned' : ''}`}
                            style={style}
                            title={`Tile ${cell.index + 1}`}
                        >
                            {cell.owner ? (
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

// 计算地块位置的样式
function getTileStyle(position, width, height) {
    const tileSize = 50;

    // 顶部 (0-15)
    if (position < width) {
        return { left: `${position * tileSize}px`, top: '0px' };
    }
    // 右侧 (16-30)
    else if (position < width + height - 1) {
        return {
            left: `${(width - 1) * tileSize}px`,
            top: `${(position - width + 1) * tileSize}px`,
        };
    }
    // 底部 (31-45)
    else if (position < width + height - 1 + width - 1) {
        const bottomPos = position - (width + height - 1);
        return {
            left: `${(width - 2 - bottomPos) * tileSize}px`, // 从 14 到 0
            top: `${(height - 1) * tileSize}px`,
        };
    }
    // 左侧 (46-60)
    else {
        const leftPos = position - (width + height - 1 + width - 1);
        return {
            left: '0px',
            top: `${(height - 1 - leftPos) * tileSize}px`, // 从 13 到 0
        };
    }
}

export default GameBoard;