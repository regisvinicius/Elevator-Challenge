import "@testing-library/jest-dom/vitest";

// Radix UI Switch uses ResizeObserver
if (typeof ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
