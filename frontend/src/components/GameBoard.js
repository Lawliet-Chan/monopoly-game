import React from 'react';
import './GameBoard.css';

function GameBoard({ players }) {
    const boardSize = 64; // 64 个地块
    const board = Array(boardSize).fill(null).map((_, idx) => ({
        index: idx,
        owner: players.find(p => p.position === idx)?.id || '',
    }));

    // 定义矩形周长路径 (17x15)
    const width = 17; // 宽（顶部和底部）
    const height = 15; // 高（左侧和右侧）
    const perimeter = [];

    // 顶部 (0-16)
    for (let i = 0; i < width; i++) perimeter.push(i);
    // 右侧 (17-30)
    for (let i = 1; i < height - 1; i++) perimeter.push(width - 1 + i * width);
    // 底部 (31-47)
    for (let i = width - 1; i >= 0; i--) perimeter.push((height - 1) * width + i);
    // 左侧 (48-63)
    for (let i = height - 2; i > 0; i--) perimeter.push(i * width);

    // 确保周长正确闭合
    if (perimeter.length !== boardSize) {
        console.error("Perimeter length mismatch:", perimeter.length);
    }

    return (
        <div className="game-board">
            <h2>Game Board (64 Tiles - Rectangular Loop)</h2>
            <div className="board-container">
                {board.map((cell, idx) => {
                    const style = getTileStyle(idx, width, height, boardSize); // 传递 boardSize
                    return (
                        <div
                            key={cell.index}
                            className={`board-cell ${cell.owner ? 'owned' : ''}`}
                            style={style}
                            title={`Tile ${cell.index + 1}`}
                        >
                            {cell.owner ? (
                                <span className="player-marker">{cell.owner.slice(0, 6)}</span>
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

// 计算地块位置的样式，添加 boardSize 参数
function getTileStyle(position, width, height, boardSize) {
    const tileSize = 50;

    if (position < width) {
        // 顶部
        return { left: `${position * tileSize}px`, top: '0px' };
    } else if (position < width + height - 2) {
        // 右侧
        return {
            left: `${(width - 1) * tileSize}px`,
            top: `${(position - width + 1) * tileSize}px`,
        };
    } else if (position < width * 2 + height - 3) {
        // 底部
        const bottomPos = position - (width + height - 2);
        return {
            left: `${(width - 1 - bottomPos) * tileSize}px`,
            top: `${(height - 1) * tileSize}px`,
        };
    } else {
        // 左侧
        const leftPos = boardSize - position - 1;
        return { left: '0px', top: `${leftPos * tileSize}px` };
    }
}

export default GameBoard;