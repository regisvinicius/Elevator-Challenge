import path from "path";
import { fileURLToPath } from "url";
import { mergeConfig } from "vite";
import base from "./vite.config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default mergeConfig(base, {
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
