import { PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { startXRloop, XR } from "@react-three/xr";
import React from "react";

function App() {
    return (
        <Canvas frameloop="never" onCreated={({ gl }) => startXRloop(gl)}>
            <XR buttonVR={true}>
                <color attach="background" args={[1, 1, 1]} />
                <PerspectiveCamera makeDefault={true} position={[0, 1.5, 0]} />
                <gridHelper args={[100, 100]} />
                <ambientLight />
            </XR>
        </Canvas>
    );
}

export default App;
