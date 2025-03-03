import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function DiceModel({ value }) {
    const mesh = useRef();
    const [rotation, setRotation] = React.useState([0, 0, 0]);
    const time = useRef(0);

    useFrame((state, delta) => {
        if (time.current < 1) {
            // 旋转动画，持续 1 秒
            setRotation([
                rotation[0] + delta * Math.PI * 2,
                rotation[1] + delta * Math.PI * 2,
                rotation[2] + delta * Math.PI * 2,
            ]);
            time.current += delta;
        } else {
            // 动画结束，显示最终点数
            switch (value) {
                case 1:
                    setRotation([0, 0, 0]);
                    break;
                case 2:
                    setRotation([0, Math.PI / 2, 0]);
                    break;
                case 3:
                    setRotation([Math.PI / 2, 0, 0]);
                    break;
                case 4:
                    setRotation([-Math.PI / 2, 0, 0]);
                    break;
                case 5:
                    setRotation([0, -Math.PI / 2, 0]);
                    break;
                case 6:
                    setRotation([Math.PI, 0, 0]);
                    break;
                default:
                    break;
            }
        }
    });

    // 创建骰子材质，显示点数
    const material = new THREE.MeshStandardMaterial({ color: '#ffffff' });
    const geometry = new THREE.BoxGeometry(1, 1, 1);

    // 添加点数（简单模拟）
    const dots = [];
    const dotMaterial = new THREE.MeshStandardMaterial({ color: '#000000' });
    const dotGeometry = new THREE.SphereGeometry(0.1, 32, 32);

    // 点数位置（仅示例，实际可优化）
    const dotPositions = {
        1: [[0, 0, 0.51]],
        2: [[-0.3, 0.3, 0.51], [0.3, -0.3, 0.51]],
        3: [[-0.3, 0.3, 0.51], [0, 0, 0.51], [0.3, -0.3, 0.51]],
        4: [[-0.3, 0.3, 0.51], [0.3, 0.3, 0.51], [-0.3, -0.3, 0.51], [0.3, -0.3, 0.51]],
        5: [[-0.3, 0.3, 0.51], [0.3, 0.3, 0.51], [0, 0, 0.51], [-0.3, -0.3, 0.51], [0.3, -0.3, 0.51]],
        6: [[-0.3, 0.3, 0.51], [0.3, 0.3, 0.51], [-0.3, 0, 0.51], [0.3, 0, 0.51], [-0.3, -0.3, 0.51], [0.3, -0.3, 0.51]],
    };

    if (value) {
        dotPositions[value].forEach((pos, idx) => {
            dots.push(
                <mesh key={idx} position={pos} geometry={dotGeometry} material={dotMaterial} />
            );
        });
    }

    return (
        <group rotation={rotation}>
            <mesh ref={mesh} geometry={geometry} material={material}>
                {dots}
            </mesh>
        </group>
    );
}

function Dice({ value }) {
    return (
        <div style={{ width: '100px', height: '100px', margin: '0 10px' }}>
            <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <DiceModel value={value} />
            </Canvas>
        </div>
    );
}

export default Dice;