import React, { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

function Tile({ position, index, price, owner, playerColors, isPlayerHere }) {
    const mesh = useRef();
    const [hovered, setHovered] = useState(false);

    const color = owner ? playerColors[owner] : '#e0e0e0';

    return (
        <group position={position}>
            <mesh
                ref={mesh}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
            >
                <boxGeometry args={[0.9, 0.1, 0.9]} />
                <meshStandardMaterial color={color} />
            </mesh>
            <Text
                position={[0, 0.2, 0]}
                fontSize={0.2}
                color="#333"
                anchorX="center"
                anchorY="middle"
            >
                {index + 1}: {price}
            </Text>
            {isPlayerHere && (
                <mesh position={[0, 0.3, 0]}>
                    <cylinderGeometry args={[0.2, 0.2, 0.4, 32]} />
                    <meshStandardMaterial color="#d32f2f" />
                </mesh>
            )}
        </group>
    );
}

function GameBoard({ players, playerColors, properties }) {
    const boardSize = 61;
    const width = 16;
    const height = 15;

    const tiles = Array(boardSize).fill(null).map((_, idx) => {
        const owner = players.find(p => p.ownedProperties?.some(prop => prop.index === idx))?.id || '';
        const isPlayerHere = players.some(p => p.position === idx);
        const price = properties[idx]?.price || 0;

        const pos = getTilePosition(idx, width, height);
        return { index: idx, owner, price, position: pos, isPlayerHere };
    });

    return (
        <div className="game-board" style={{ width: '100%', height: '600px' }}>
            <Canvas camera={{ position: [8, 10, 8], fov: 60 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                {tiles.map(tile => (
                    <Tile
                        key={tile.index}
                        position={tile.position}
                        index={tile.index}
                        price={tile.price}
                        owner={tile.owner}
                        playerColors={playerColors}
                        isPlayerHere={tile.isPlayerHere}
                    />
                ))}
                <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
            </Canvas>
        </div>
    );
}

function getTilePosition(position, width, height) {
    const tileSize = 1;
    const xOffset = -(width / 2) * tileSize;
    const zOffset = -(height / 2) * tileSize;

    if (position < width) {
        // 顶部
        return [xOffset + position * tileSize, 0, zOffset];
    } else if (position < width + height - 1) {
        // 右侧
        return [xOffset + (width - 1) * tileSize, 0, zOffset + (position - width + 1) * tileSize];
    } else if (position < width + height - 1 + width - 1) {
        // 底部
        const bottomPos = position - (width + height - 1);
        return [xOffset + (width - 2 - bottomPos) * tileSize, 0, zOffset + (height - 1) * tileSize];
    } else {
        // 左侧
        const leftPos = position - (width + height - 1 + width - 1);
        return [xOffset, 0, zOffset + (height - 2 - leftPos) * tileSize];
    }
}

export default GameBoard;