import { PerspectiveCamera } from "@react-three/drei";
import { VRCanvas } from "@react-three/xr";
import React from "react";

function App() {
    return (
        <VRCanvas>
            <color attach="background" args={[1, 1, 1]} />
            <PerspectiveCamera makeDefault={true} position={[0, 1.5, 0]} />
            <gridHelper args={[100, 100]} />
            <ambientLight />
        </VRCanvas>
    );
}

export default App;
