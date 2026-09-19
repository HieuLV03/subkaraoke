
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    base: "/",

    resolve: {
        alias: {
            "@": "/src",
        },
    },

    plugins: [
        react(),
    ],

    optimizeDeps: {
        exclude: [
            "@ffmpeg/ffmpeg",
            "@ffmpeg/util",
        ],
    },

    worker: {
        format: "es",
    },
});
