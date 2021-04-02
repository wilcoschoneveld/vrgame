import React, { useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, advance } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";

function useXR(gl?: THREE.WebGLRenderer) {
  const [supported, setSupported] = useState(false);
  const xr = (navigator as any).xr;

  useEffect(() => {
    const checkForXRSupport = async () => {
      const supported = await xr.isSessionSupported("immersive-vr");
      setSupported(supported);
    };

    xr.addEventListener("devicechange", checkForXRSupport);

    checkForXRSupport();

    return () => xr.removeEventListener("devicechange", checkForXRSupport);
  }, []);

  const enterXR = useCallback(async () => {
    if (!gl) return;

    const session = await xr.requestSession("immersive-vr", {
      optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking"],
    });
    console.log("sessions started", session);

    await gl.xr.setSession(session);

    // This was previously managed by @react-three/fiber vr={true}
    gl.xr.enabled = true;
    gl.setAnimationLoop((timestamp) => advance(timestamp, true));
  }, [gl]);

  return { supported, enterXR };
}

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
