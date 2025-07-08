/* eslint-disable no-undef */
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
    // Load env file based on `mode` in the current working directory.
    loadEnv(mode, process.cwd(), "");

    return {
        plugins: [react()],

        // Environment variables configuration
        define: {
            __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
        },

        // Resolve aliases
        resolve: {
            alias: {
                "@": resolve(__dirname, "./src"),
                "@components": resolve(__dirname, "./src/components"),
                "@contexts": resolve(__dirname, "./src/contexts"),
                "@hooks": resolve(__dirname, "./src/hooks"),
                "@utils": resolve(__dirname, "./src/utils"),
                "@config": resolve(__dirname, "./src/config"),
            },
        },

        // Build configuration
        build: {
            outDir: "dist",
            sourcemap: command === "serve",
            // Configure rollup options
            rollupOptions: {
                output: {
                    manualChunks: {
                        vendor: ["react", "react-dom", "react-router"],
                        ui: ["antd"],
                    },
                },
            },
        },

        // Server configuration
        server: {
            port: 3000,
            open: true,
            cors: true,
        },
    };
});

