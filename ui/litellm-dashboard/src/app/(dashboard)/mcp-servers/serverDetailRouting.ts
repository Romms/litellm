import { parseAsString, useQueryState } from "nuqs";
import { useCallback, useEffect, useState } from "react";

export interface ServerDetailRouting {
  serverId: string | null;
  openServer: (id: string) => void;
  restoreServer: (id: string) => void;
  close: () => void;
}

export function useServerDetailRouting(fallbackServerId: string | null = null): ServerDetailRouting {
  const [server, setServer] = useQueryState("server", parseAsString.withOptions({ history: "push" }));

  // A fallback (e.g. the server restored after an OAuth redirect) is shown from
  // the first render and promoted into the URL without a history entry.
  useEffect(() => {
    if (fallbackServerId && !server) {
      void setServer(fallbackServerId, { history: "replace" });
    }
  }, [fallbackServerId, server, setServer]);

  const openServer = useCallback(
    (id: string) => {
      void setServer(id);
    },
    [setServer],
  );

  // For post-OAuth-redirect restores: reflect the reopened server in the URL
  // without adding a history entry the back button would step through.
  const restoreServer = useCallback(
    (id: string) => {
      void setServer(id, { history: "replace" });
    },
    [setServer],
  );

  const close = useCallback(() => {
    void setServer(null);
  }, [setServer]);

  return { serverId: server ?? fallbackServerId, openServer, restoreServer, close };
}

export interface FillEnvVarsDeepLink {
  deepLinkServerId: string | null;
  clear: () => void;
}

/**
 * Deep-link via ?fill_env_vars=<server_id> — the link users follow from the
 * friendly error the proxy returns when a per-user var is missing. The id is
 * captured into state and the param stripped (history replace) so a refresh
 * doesn't reopen the modal.
 */
export function useFillEnvVarsDeepLink(): FillEnvVarsDeepLink {
  const [param, setParam] = useQueryState("fill_env_vars", parseAsString);
  const [serverId, setServerId] = useState<string | null>(param);

  useEffect(() => {
    if (!param) return;
    void setParam(null, { history: "replace" });
  }, [param, setParam]);

  const clear = useCallback(() => {
    setServerId(null);
  }, []);

  return { deepLinkServerId: serverId, clear };
}
