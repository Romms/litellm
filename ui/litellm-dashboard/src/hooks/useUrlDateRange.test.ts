import { act, renderHook, waitFor } from "@testing-library/react";
import { withNuqsTestingAdapter, type UrlUpdateEvent } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";
import { useUrlDateRange } from "./useUrlDateRange";

const DEFAULT_RANGE = {
  from: new Date("2026-08-19T00:00:00.000Z"),
  to: new Date("2026-08-26T00:00:00.000Z"),
};

describe("useUrlDateRange", () => {
  it("falls back to the caller's default when the URL has no params", () => {
    const { result } = renderHook(() => useUrlDateRange(DEFAULT_RANGE), {
      wrapper: withNuqsTestingAdapter(),
    });
    expect(result.current[0]).toEqual(DEFAULT_RANGE);
  });

  it("reads both bounds from the URL", () => {
    const { result } = renderHook(() => useUrlDateRange(DEFAULT_RANGE), {
      wrapper: withNuqsTestingAdapter({
        searchParams: "?from=2026-07-01T00:00:00.000Z&to=2026-07-15T12:30:00.000Z",
      }),
    });
    expect(result.current[0].from?.toISOString()).toBe("2026-07-01T00:00:00.000Z");
    expect(result.current[0].to?.toISOString()).toBe("2026-07-15T12:30:00.000Z");
  });

  it("keeps the default for a bound the URL omits", () => {
    const { result } = renderHook(() => useUrlDateRange(DEFAULT_RANGE), {
      wrapper: withNuqsTestingAdapter({ searchParams: "?from=2026-07-01T00:00:00.000Z" }),
    });
    expect(result.current[0].from?.toISOString()).toBe("2026-07-01T00:00:00.000Z");
    expect(result.current[0].to).toEqual(DEFAULT_RANGE.to);
  });

  it("ignores an unparseable bound rather than rendering an invalid date", () => {
    const { result } = renderHook(() => useUrlDateRange(DEFAULT_RANGE), {
      wrapper: withNuqsTestingAdapter({ searchParams: "?from=not-a-date&to=also-not-a-date" }),
    });
    expect(result.current[0]).toEqual(DEFAULT_RANGE);
  });

  it("writes a picked range to the URL as ISO timestamps with a history push", async () => {
    const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
    const { result } = renderHook(() => useUrlDateRange(DEFAULT_RANGE), {
      wrapper: withNuqsTestingAdapter({ onUrlUpdate }),
    });
    await act(async () => {
      result.current[1]({
        from: new Date("2026-06-01T00:00:00.000Z"),
        to: new Date("2026-06-30T23:59:00.000Z"),
      });
    });
    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled());
    const event = onUrlUpdate.mock.calls.at(-1)?.[0];
    expect(event?.searchParams.get("from")).toBe("2026-06-01T00:00:00.000Z");
    expect(event?.searchParams.get("to")).toBe("2026-06-30T23:59:00.000Z");
    expect(event?.options.history).toBe("push");
  });

  it("clears a bound the caller drops", async () => {
    const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
    const { result } = renderHook(() => useUrlDateRange(DEFAULT_RANGE), {
      wrapper: withNuqsTestingAdapter({
        searchParams: "?from=2026-07-01T00:00:00.000Z&to=2026-07-15T00:00:00.000Z",
        onUrlUpdate,
      }),
    });
    await act(async () => {
      result.current[1]({ from: new Date("2026-07-02T00:00:00.000Z"), to: undefined });
    });
    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled());
    const event = onUrlUpdate.mock.calls.at(-1)?.[0];
    expect(event?.searchParams.get("from")).toBe("2026-07-02T00:00:00.000Z");
    expect(event?.searchParams.has("to")).toBe(false);
  });
});
