import { describe, it, expect } from "vitest";
import { formatDuration, cn } from "~/lib/utils";

describe("formatDuration", () => {
  it("should format duration in days", () => {
    const start = new Date("2025-01-01T00:00:00");
    const end = new Date("2025-01-06T00:00:00");

    const result = formatDuration(start, end);

    expect(result).toContain("5");
    expect(result.toLowerCase()).toContain("day");
  });

  it("should format duration in months", () => {
    const start = new Date("2025-01-01T00:00:00");
    const end = new Date("2025-03-01T00:00:00");

    const result = formatDuration(start, end);

    expect(result).toContain("2");
    expect(result.toLowerCase()).toContain("month");
  });

  it("should handle same day with hours", () => {
    const start = new Date("2025-01-01T09:00:00");
    const end = new Date("2025-01-01T17:00:00");

    const result = formatDuration(start, end);

    expect(result).toContain("8");
    expect(result.toLowerCase()).toContain("hour");
  });

  it("should handle short durations", () => {
    const start = new Date("2025-01-01T10:00:00");
    const end = new Date("2025-01-01T10:30:00");

    const result = formatDuration(start, end);

    expect(result).toContain("30");
    expect(result.toLowerCase()).toContain("minute");
  });
});

describe("cn utility", () => {
  it("should merge class names", () => {
    const result = cn("class1", "class2");
    expect(result).toBe("class1 class2");
  });

  it("should handle conditional classes", () => {
    const result = cn("base", false && "hidden", true && "visible");
    expect(result).toBe("base visible");
  });

  it("should handle undefined values", () => {
    const result = cn("base", undefined, null, "other");
    expect(result).toBe("base other");
  });

  it("should merge tailwind classes correctly", () => {
    const result = cn("px-2 py-1", "px-4");
    expect(result).toBe("py-1 px-4");
  });
});
