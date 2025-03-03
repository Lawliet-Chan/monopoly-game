import React, { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

function Tile({ position, index, price, owner, playerColors, isPlayerHere }) {
    const mesh = useRef();
    const [hovered, setHovered] = useState(false);

    // 默认颜色为浅蓝色，拥有时使用玩家颜色
    const baseColor = '#87CEEB'; // SkyBlue
    const color = owner ? playerColors[owner] : baseColor;
    const hoverColor = hovered ? lighten(color, 0.2) : color;

    return (
        <group position={position}>
            <mesh
                ref={mesh}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
            >
                <boxGeometry args={[0.9, 0.1, 0.9]} />
                <meshStandardMaterial color={hoverColor} />
            </mesh>
            {/* 标号 - 竖立在上方 */}
            <Text
                position={[0, 0.3, 0]}
                fontSize={0.25}
                color="#00008B" // 深蓝色
                anchorX="center"
                anchorY="middle"
                fontWeight="bold"
                outlineWidth={0.02}
                outlineColor="#ffffff"
            >
                {index + 1}
            </Text>
            {/* 价格 - 竖立在下方，带单位 */}
            <Text
                position={[0, 0.1, 0]}
                fontSize={0.25}
                color="#00008B"
                anchorX="center"
                anchorY="middle"
                fontWeight="bold"
                outlineWidth={0.02}
                outlineColor="#ffffff"
            >
                {price} coins
            </Text>
            {/* 玩家标记 */}
            {isPlayerHere && (
                <mesh position={[0, 0.3, 0]}>
                    <sphereGeometry args={[0.2, 32, 32]} />
                    <meshStandardMaterial color="#FF4500" /> {/* OrangeRed */}
                </mesh>
            )}
        </group>
    );
}

// 颜色变亮辅助函数
function lighten(color, amount) {
    const threeColor = new THREE.Color(color);
    threeColor.lerp(new THREE.Color('#ffffff'), amount);
    return `#${threeColor.getHexString()}`;
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
                <directionalLight position={[10, 10, 5]} intensity={1} />
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
        return [xOffset + position * tileSize, 0, zOffset];
    } else if (position < width + height - 1) {
        return [xOffset + (width - 1) * tileSize, 0, zOffset + (position - width + 1) * tileSize];
    } else if (position < width + height - 1 + width - 1) {
        const bottomPos = position - (width + height - 1);
        return [xOffset + (width - 2 - bottomPos) * tileSize, 0, zOffset + (height - 1) * tileSize];
    } else {
        const leftPos = position - (width + height - 1 + width - 1);
        return [xOffset, 0, zOffset + (height - 2 - leftPos) * tileSize];
    }
}

export default GameBoard;