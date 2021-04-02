import { PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import React from "react";
import { XR } from "./XR";

function App() {
  return (
    <>
      <Canvas>
        <XR
          overlayContainer={() => document.getElementById("overlay")!}
          renderOverlay={({ supported, enterXR }) =>
            supported ? (
              <button onClick={enterXR}>VR</button>
            ) : (
              <span>VR not supported</span>
            )
          }
        />
        <color attach="background" args={[1, 1, 1]} />
        <PerspectiveCamera makeDefault={true} position={[0, 1.5, 0]} />
        <gridHelper args={[100, 100]} />
        <ambientLight />
      </Canvas>
      <div id="overlay"></div>
    </>
  );
}

export default App;
