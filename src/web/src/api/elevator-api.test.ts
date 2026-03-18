import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getEnterpriseStatus,
  getHealth,
  getSingleStatus,
  requestElevator,
} from "./elevator-api";

describe("elevator-api", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getHealth", () => {
    it("parses valid health response", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "ok", timestamp: "2025-01-01T00:00:00Z" }),
      } as Response);

      const result = await getHealth();

      expect(result).toEqual({
        status: "ok",
        timestamp: "2025-01-01T00:00:00Z",
      });
    });

    it("throws on HTTP error", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      } as Response);

      await expect(getHealth()).rejects.toThrow(
        "HTTP 500: Internal Server Error",
      );
    });

    it("throws on invalid JSON shape", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ foo: "bar" }),
      } as Response);

      await expect(getHealth()).rejects.toThrow();
    });
  });

  describe("getSingleStatus", () => {
    it("parses valid single status", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ floor: 3, state: "Idle" }),
      } as Response);

      const result = await getSingleStatus();

      expect(result).toEqual({ floor: 3, state: "Idle" });
    });
  });

  describe("getEnterpriseStatus", () => {
    it("parses state from number (0 = Idle)", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 1,
            type: 0,
            currentFloor: 2,
            state: 0,
            pendingRequestCount: 0,
            targetFloors: [],
            allowedFloors: [0, 1, 2, 3],
          },
        ],
      } as Response);

      const result = await getEnterpriseStatus();

      expect(result).toHaveLength(1);
      expect(result[0]?.state).toBe("Idle");
    });

    it("parses state from string", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 1,
            type: "Local",
            currentFloor: 2,
            state: "Maintenance",
            pendingRequestCount: 0,
            targetFloors: [],
            allowedFloors: [0, 1, 2, 3],
          },
        ],
      } as Response);

      const result = await getEnterpriseStatus();

      expect(result[0]?.state).toBe("Maintenance");
    });
  });

  describe("requestElevator", () => {
    it("sends correct body", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({ ok: true } as Response);

      await requestElevator(2, "Up");

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/elevator/single/request"),
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ floor: 2, direction: "Up" }),
        }),
      );
    });
  });
});
