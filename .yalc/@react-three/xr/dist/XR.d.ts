import * as React from 'react';
import { XRController } from './XRController';
import { Group, Matrix4, WebGLRenderer, XRFrame, XRHandedness, XRHitTestResult } from 'three';
export interface XRContextValue {
    controllers: XRController[];
    isPresenting: boolean;
    player: Group;
}
export declare function useHitTest(hitTestCallback: (hitMatrix: Matrix4, hit: XRHitTestResult) => void): void;
export declare function startXRloop(gl: WebGLRenderer): void;
interface XRProps {
    children: React.ReactNode;
    buttonVR?: boolean;
    buttonAR?: boolean;
    sessionInit?: any;
}
export declare function XR({ children, buttonVR, buttonAR, sessionInit }: XRProps): JSX.Element;
export declare const useXR: () => {
    hoverState: Record<XRHandedness, Map<import("three").Object3D, import("three").Intersection>>;
    addInteraction: (object: import("three").Object3D, eventType: import("./Interactions").XRInteractionType, handler: import("./Interactions").XRInteractionHandler) => any;
    removeInteraction: (object: import("three").Object3D, eventType: import("./Interactions").XRInteractionType, handler: import("./Interactions").XRInteractionHandler) => any;
    controllers: XRController[];
    isPresenting: boolean;
    player: Group;
};
export declare const useXRFrame: (callback: (time: DOMHighResTimeStamp, xrFrame: XRFrame) => void) => void;
export declare const useController: (handedness: XRHandedness) => XRController | undefined;
export {};
