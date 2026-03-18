import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TripForm } from "./trip-form";

afterEach(cleanup);

describe("TripForm", () => {
  it("calls onSubmit with valid pickup and destination", async () => {
    const onSubmit = vi.fn();
    render(<TripForm onSubmit={onSubmit} minFloor={0} maxFloor={10} />);

    await userEvent.clear(screen.getByTestId("pickup"));
    await userEvent.type(screen.getByTestId("pickup"), "2");
    await userEvent.clear(screen.getByTestId("destination"));
    await userEvent.type(screen.getByTestId("destination"), "7");
    await userEvent.click(screen.getByTestId("request-trip"));

    expect(onSubmit).toHaveBeenCalledWith(2, 7, undefined);
  });

  it("shows error when pickup below minFloor", async () => {
    const onSubmit = vi.fn();
    render(<TripForm onSubmit={onSubmit} minFloor={1} maxFloor={10} />);

    await userEvent.clear(screen.getByTestId("pickup"));
    await userEvent.type(screen.getByTestId("pickup"), "0");
    await userEvent.click(screen.getByTestId("request-trip"));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/Pickup must be 1–10/)).toBeInTheDocument();
  });

  it("shows error when destination above maxFloor", async () => {
    const onSubmit = vi.fn();
    render(<TripForm onSubmit={onSubmit} minFloor={0} maxFloor={5} />);

    await userEvent.clear(screen.getByTestId("destination"));
    await userEvent.type(screen.getByTestId("destination"), "9");
    await userEvent.click(screen.getByTestId("request-trip"));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/Destination must be 0–5/)).toBeInTheDocument();
  });

  it("includes isVip when includeVip is true", async () => {
    const onSubmit = vi.fn();
    render(
      <TripForm onSubmit={onSubmit} minFloor={0} maxFloor={10} includeVip />,
    );

    await userEvent.click(screen.getByTestId("vip"));
    await userEvent.click(screen.getByTestId("request-trip"));

    expect(onSubmit).toHaveBeenCalledWith(0, 10, true);
  });

  it("submit button is disabled when disabled prop is true", () => {
    render(<TripForm onSubmit={vi.fn()} minFloor={0} maxFloor={10} disabled />);

    expect(screen.getByTestId("request-trip")).toBeDisabled();
  });
});
