import { useThree } from "@react-three/fiber";
import { useLayoutEffect } from "react";
import ReactDOM from "react-dom";
import { useXR } from "./useXR";

interface XRProps {
    renderOverlay: (props: ReturnType<typeof useXR>) => React.ReactElement;
    overlayContainer: () => HTMLElement;
}

export function XR({ renderOverlay, overlayContainer }: XRProps) {
    const gl = useThree((state) => state.gl);
    const xr = useXR(gl);

    useLayoutEffect(() => {
        ReactDOM.render(
            renderOverlay(xr),
            overlayContainer()
        );
    }, [xr]);

    return null;
}
