import * as api from "@/api/elevator-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { type ReactNode, Suspense } from "react";
import { describe, expect, it, vi } from "vitest";
import { ApiHealthProvider, useApiHealth } from "./api-health";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ApiHealthProvider>
        <Suspense fallback={null}>{children}</Suspense>
      </ApiHealthProvider>
    </QueryClientProvider>
  );

  return { queryClient, wrapper };
}

describe("useApiHealth", () => {
  it("returns isOnline true when health succeeds", async () => {
    vi.spyOn(api, "getHealth").mockResolvedValue({
      status: "ok",
      timestamp: new Date().toISOString(),
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useApiHealth(), { wrapper });

    await vi.waitFor(() => {
      expect(result.current.isOnline).toBe(true);
    });
  });

  it("returns isOnline false when health fails", async () => {
    vi.spyOn(api, "getHealth").mockRejectedValue(new Error("Network error"));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useApiHealth(), { wrapper });

    await vi.waitFor(() => {
      expect(result.current.isOnline).toBe(false);
    });
  });

  it("returns isOnline false when status is not ok", async () => {
    vi.spyOn(api, "getHealth").mockResolvedValue({
      status: "degraded",
      timestamp: new Date().toISOString(),
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useApiHealth(), { wrapper });

    await vi.waitFor(() => {
      expect(result.current.isOnline).toBe(false);
    });
  });
});
