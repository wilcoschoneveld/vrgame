import { PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import React, { useState } from "react";
import { useXR } from "../lib";

function App() {
    const [gl, setGL] = useState<THREE.WebGLRenderer>();
    const { supported, enterXR } = useXR();

    return (
        <>
            <Canvas onCreated={({ gl }) => setGL(gl)}>
                <color attach="background" args={[1, 1, 1]} />
                <PerspectiveCamera makeDefault={true} position={[0, 1.5, 0]} />
                <gridHelper args={[100, 100]} />
                <ambientLight />
            </Canvas>
            {supported && gl && (
                <button onClick={() => enterXR(gl)}>START VR</button>
            )}
        </>
    );
}

export default App;
