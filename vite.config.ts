import eslint from "@rollup/plugin-eslint";
import reactRefresh from "@vitejs/plugin-react-refresh";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        {
            ...eslint({ include: "src/**/*.+(ts|tsx)" }),
            enforce: "pre",
        },
        reactRefresh(),
    ],
});
