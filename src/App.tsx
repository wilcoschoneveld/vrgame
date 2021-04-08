import { PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { startXRloop, XR } from "@react-three/xr";
import React from "react";

function Table() {
    return (
        <mesh position={[1, 0.5, 0]}>
            <boxGeometry args={[0.5, 1, 2]} />
            <meshStandardMaterial color={"orange"} />
        </mesh>
    );
}

function App() {
    return (
        <Canvas frameloop="never" onCreated={({ gl }) => startXRloop(gl)}>
            <XR buttonVR={true}>
                <color attach="background" args={[1, 1, 1]} />
                <PerspectiveCamera makeDefault={true} position={[0, 1.5, 0]} />
                <gridHelper args={[10, 10]} />
                <ambientLight />
                <pointLight position={[10, 10, 10]} />
                <Table />
            </XR>
        </Canvas>
    );
}

export default App;
