import { act, render } from "@testing-library/react";
import React from "react";
import { useXR } from "./useXR";

test("should not support xr", () => {
    let supported;

    function Component() {
        const xr = useXR();
        supported = xr.supported;
        return null;
    }

    render(<Component />);

    expect(supported).toBe(false);
});

test("should support xr", async () => {
    const promise = Promise.resolve(true);

    (navigator as any).xr = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        isSessionSupported: jest.fn(() => promise),
    };

    let supported;

    function Component() {
        const xr = useXR();
        supported = xr.supported;
        return null;
    }

    render(<Component />);

    await act(async () => {
        await promise;
    });

    expect(supported).toBe(true);
});

test("should listen to devicechange events", async () => {
    const promise = Promise.resolve(true);

    const xrMock = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        isSessionSupported: jest.fn(() => promise),
    };

    (navigator as any).xr = xrMock;

    function Component() {
        const xr = useXR();
        return null;
    }

    const { unmount } = render(<Component />);

    await act(async () => {
        await promise;
    });

    expect(xrMock.addEventListener.mock.calls.length).toBe(1);
    expect(xrMock.addEventListener.mock.calls[0][0]).toBe("devicechange");

    unmount();

    expect(xrMock.removeEventListener.mock.calls.length).toBe(1);
    expect(xrMock.removeEventListener.mock.calls[0][0]).toBe("devicechange");
});
