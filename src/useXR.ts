import { advance } from "@react-three/fiber";
import { useCallback, useEffect, useState } from "react";
import { Navigator } from "three";

export function useXR() {
    const [supported, setSupported] = useState(false);
    const xr = (navigator as Navigator).xr;

    useEffect(() => {
        if (!xr) {
            return;
        }

        const checkForXRSupport = async () => {
            const supported = await xr.isSessionSupported("immersive-vr");
            setSupported(supported);
        };

        xr.addEventListener("devicechange", checkForXRSupport);

        checkForXRSupport();

        return () => xr.removeEventListener("devicechange", checkForXRSupport);
    }, [xr]);

    const enterXR = useCallback(
        async (gl: THREE.WebGLRenderer) => {
            if (!xr) {
                return;
            }

            const session = await xr.requestSession("immersive-vr", {
                optionalFeatures: [
                    "local-floor",
                    "bounded-floor",
                    "hand-tracking",
                ],
            });

            await gl.xr.setSession(session);

            // This was previously managed by @react-three/fiber vr={true}
            gl.xr.enabled = true;
            gl.setAnimationLoop((timestamp) => advance(timestamp, true));
        },
        [xr]
    );

    return { supported, enterXR };
}
