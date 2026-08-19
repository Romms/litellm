import { act, renderHook, waitFor } from "@testing-library/react";
import { withNuqsTestingAdapter, type UrlUpdateEvent } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";
import { useUrlTab } from "./useUrlTab";

const TABS = ["overview", "settings", "logs"] as const;

describe("useUrlTab", () => {
  it("returns the default tab when the URL has no param", () => {
    const { result } = renderHook(() => useUrlTab(TABS, "overview"), {
      wrapper: withNuqsTestingAdapter(),
    });
    expect(result.current[0]).toBe("overview");
  });

  it("reads the tab from the URL", () => {
    const { result } = renderHook(() => useUrlTab(TABS, "overview"), {
      wrapper: withNuqsTestingAdapter({ searchParams: "?tab=settings" }),
    });
    expect(result.current[0]).toBe("settings");
  });

  it("falls back to the default for an invalid URL value", () => {
    const { result } = renderHook(() => useUrlTab(TABS, "overview"), {
      wrapper: withNuqsTestingAdapter({ searchParams: "?tab=bogus" }),
    });
    expect(result.current[0]).toBe("overview");
  });

  it("writes the picked tab to the URL with a history push", async () => {
    const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
    const { result } = renderHook(() => useUrlTab(TABS, "overview"), {
      wrapper: withNuqsTestingAdapter({ onUrlUpdate }),
    });
    await act(async () => {
      result.current[1]("logs");
    });
    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled());
    const event = onUrlUpdate.mock.calls.at(-1)?.[0];
    expect(event?.searchParams.get("tab")).toBe("logs");
    expect(event?.options.history).toBe("push");
  });

  it("clears the param when returning to the default tab", async () => {
    const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
    const { result } = renderHook(() => useUrlTab(TABS, "overview"), {
      wrapper: withNuqsTestingAdapter({ searchParams: "?tab=logs", onUrlUpdate }),
    });
    await act(async () => {
      result.current[1]("overview");
    });
    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled());
    expect(onUrlUpdate.mock.calls.at(-1)?.[0].searchParams.has("tab")).toBe(false);
  });

  it("uses a custom param name when given", () => {
    const { result } = renderHook(() => useUrlTab(TABS, "overview", "view"), {
      wrapper: withNuqsTestingAdapter({ searchParams: "?view=logs" }),
    });
    expect(result.current[0]).toBe("logs");
  });
});
