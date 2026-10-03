import { entity, EntityType } from "@ua-pii/core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HighlightedText } from "./HighlightedText";

describe("HighlightedText", () => {
  it("marks a phone span", () => {
    const text = "тел. +380671112233";
    const phone = entity(EntityType.PHONE, 5, text.length, "+380671112233");
    render(<HighlightedText text={text} entities={[phone]} locale="uk" empty="empty" />);
    const mark = screen.getByText("+380671112233");
    expect(mark.tagName).toBe("MARK");
    expect(mark.getAttribute("title")).toMatch(/Телефон/);
  });
});
