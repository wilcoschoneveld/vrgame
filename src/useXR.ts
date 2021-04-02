import { advance } from "@react-three/fiber";
import { useCallback, useEffect, useState } from "react";

export function useXR(gl?: THREE.WebGLRenderer) {
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
    }, [xr]);

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
    }, [gl, xr]);

    return { supported, enterXR };
}