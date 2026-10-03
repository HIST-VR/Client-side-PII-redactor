import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HINT_HIDE_MS, Hint } from "./Hint";

describe("Hint", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows a custom tooltip and does not set title", () => {
    render(
      <Hint text="Each span becomes [IBAN].">
        <button type="button">Placeholder</button>
      </Hint>,
    );
    const button = screen.getByRole("button", { name: "Placeholder" });
    expect(button).not.toHaveAttribute("title");
    fireEvent.mouseOver(button);
    expect(screen.getByRole("tooltip")).toHaveTextContent("Each span becomes [IBAN].");
    fireEvent.mouseOut(button);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("hides on scroll", () => {
    render(
      <Hint text="hint">
        <button type="button">Mask</button>
      </Hint>,
    );
    fireEvent.mouseOver(screen.getByRole("button", { name: "Mask" }));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    fireEvent.scroll(window);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("hides a touch hint on a timer", () => {
    vi.useFakeTimers();
    render(
      <Hint text="hint">
        <button type="button">Mask</button>
      </Hint>,
    );
    fireEvent.pointerDown(screen.getByRole("button", { name: "Mask" }), { pointerType: "touch" });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(HINT_HIDE_MS);
    });
    expect(screen.queryByRole("tooltip")).toBeNull();
  });
});
