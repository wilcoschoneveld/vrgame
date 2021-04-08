import { render } from "@testing-library/react";
import React from "react";

test("example", () => {
    function Component() {
        return null;
    }

    render(<Component />);

    expect(1 + 1).toBe(2);
});
