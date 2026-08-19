import { act, renderHook, waitFor } from "@testing-library/react";
import { withNuqsTestingAdapter, type UrlUpdateEvent } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";
import { useFillEnvVarsDeepLink, useServerDetailRouting } from "./serverDetailRouting";

describe("useServerDetailRouting", () => {
  it("openServer sets ?server= with a history push", async () => {
    const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
    const { result } = renderHook(() => useServerDetailRouting(), {
      wrapper: withNuqsTestingAdapter({ onUrlUpdate }),
    });
    await act(async () => {
      result.current.openServer("srv-1");
    });
    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled());
    const event = onUrlUpdate.mock.calls.at(-1)?.[0];
    expect(event?.searchParams.get("server")).toBe("srv-1");
    expect(event?.options.history).toBe("push");
  });

  it("restoreServer sets ?server= with a history replace", async () => {
    const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
    const { result } = renderHook(() => useServerDetailRouting(), {
      wrapper: withNuqsTestingAdapter({ onUrlUpdate }),
    });
    await act(async () => {
      result.current.restoreServer("srv-2");
    });
    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled());
    const event = onUrlUpdate.mock.calls.at(-1)?.[0];
    expect(event?.searchParams.get("server")).toBe("srv-2");
    expect(event?.options.history).toBe("replace");
  });

  it("close removes the server param", async () => {
    const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
    const { result } = renderHook(() => useServerDetailRouting(), {
      wrapper: withNuqsTestingAdapter({ searchParams: "?server=srv-1", onUrlUpdate }),
    });
    await act(async () => {
      result.current.close();
    });
    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled());
    const event = onUrlUpdate.mock.calls.at(-1)?.[0];
    expect(event?.searchParams.has("server")).toBe(false);
  });

  it("reads serverId from the query string", () => {
    const { result } = renderHook(() => useServerDetailRouting(), {
      wrapper: withNuqsTestingAdapter({ searchParams: "?server=srv-9" }),
    });
    expect(result.current.serverId).toBe("srv-9");
  });

  it("shows the fallback server from the first render and promotes it with a history replace", async () => {
    const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
    const adapterProps = { onUrlUpdate, hasMemory: true, resetUrlUpdateQueueOnMount: false };
    const { result } = renderHook(() => useServerDetailRouting("srv-oauth"), {
      wrapper: withNuqsTestingAdapter(adapterProps),
    });
    expect(result.current.serverId).toBe("srv-oauth");
    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled());
    const event = onUrlUpdate.mock.calls.at(-1)?.[0];
    expect(event?.searchParams.get("server")).toBe("srv-oauth");
    expect(event?.options.history).toBe("replace");
  });

  it("prefers the URL param over the fallback", () => {
    const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
    const { result } = renderHook(() => useServerDetailRouting("srv-fallback"), {
      wrapper: withNuqsTestingAdapter({ searchParams: "?server=srv-1", onUrlUpdate }),
    });
    expect(result.current.serverId).toBe("srv-1");
    expect(onUrlUpdate).not.toHaveBeenCalled();
  });
});

describe("useFillEnvVarsDeepLink", () => {
  it("captures the id and strips the param with a history replace", async () => {
    const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
    const adapterProps = {
      searchParams: "?fill_env_vars=srv-3",
      onUrlUpdate,
      hasMemory: true,
      resetUrlUpdateQueueOnMount: false,
    };
    const { result } = renderHook(() => useFillEnvVarsDeepLink(), {
      wrapper: withNuqsTestingAdapter(adapterProps),
    });
    await waitFor(() => expect(result.current.deepLinkServerId).toBe("srv-3"));
    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled());
    const event = onUrlUpdate.mock.calls.at(-1)?.[0];
    expect(event?.searchParams.has("fill_env_vars")).toBe(false);
    expect(event?.options.history).toBe("replace");
  });

  it("keeps other params when stripping fill_env_vars", async () => {
    const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
    const adapterProps = {
      searchParams: "?server=srv-1&fill_env_vars=srv-3",
      onUrlUpdate,
      hasMemory: true,
      resetUrlUpdateQueueOnMount: false,
    };
    renderHook(() => useFillEnvVarsDeepLink(), {
      wrapper: withNuqsTestingAdapter(adapterProps),
    });
    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled());
    const event = onUrlUpdate.mock.calls.at(-1)?.[0];
    expect(event?.searchParams.get("server")).toBe("srv-1");
    expect(event?.searchParams.has("fill_env_vars")).toBe(false);
  });

  it("clear resets the captured id", async () => {
    const { result } = renderHook(() => useFillEnvVarsDeepLink(), {
      wrapper: withNuqsTestingAdapter({ searchParams: "?fill_env_vars=srv-3", hasMemory: true }),
    });
    await waitFor(() => expect(result.current.deepLinkServerId).toBe("srv-3"));
    await act(async () => {
      result.current.clear();
    });
    expect(result.current.deepLinkServerId).toBeNull();
  });
});
