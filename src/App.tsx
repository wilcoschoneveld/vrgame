import { PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import React, { useState } from "react";
import { useXR } from "./useXR";

function App() {
  const [gl, setGL] = useState<THREE.WebGLRenderer>();
  const { supported, enterXR } = useXR(gl);

  return (
    <>
      <Canvas onCreated={({ gl }) => setGL(gl)}>
        <color attach="background" args={[1, 1, 1]} />
        <PerspectiveCamera makeDefault={true} position={[0, 1.5, 0]} />
        <gridHelper args={[100, 100]} />
        <ambientLight />
      </Canvas>
      {supported && <button onClick={() => enterXR()}>START VR</button>}
    </>
  );
}

export default App;
