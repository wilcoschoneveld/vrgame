import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";

test("adds 1 + 2 to equal 3", () => {
    expect(1 + 2).toBe(3);
});

test("should render react", () => {
    render(<div>test</div>);
});

export {};
