import { render } from "@testing-library/react";
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
