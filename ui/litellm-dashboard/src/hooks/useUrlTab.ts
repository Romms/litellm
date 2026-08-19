import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useCallback } from "react";

export interface UseUrlTabOptions<T extends string> {
  tabs: readonly T[];
  defaultTab: T;
  /** Query param name. Defaults to "tab". */
  paramName?: string;
  // false keeps the param in the URL when the default tab is picked; required
  // when defaultTab is computed from props, since clearing the param would
  // otherwise snap back to that dynamic default. Defaults to true.
  clearOnDefault?: boolean;
}

/**
 * Page-level tab selection stored in the URL (?tab= by default) so tab views
 * are shareable and survive refresh. Invalid values fall back to defaultTab,
 * and the default keeps the URL clean (nuqs clears params at their default).
 */
export function useUrlTab<T extends string>({
  tabs,
  defaultTab,
  paramName = "tab",
  clearOnDefault = true,
}: UseUrlTabOptions<T>): readonly [T, (value: string) => void] {
  const [tab, setTab] = useQueryState(
    paramName,
    parseAsStringLiteral(tabs).withDefault(defaultTab).withOptions({ history: "push", clearOnDefault }),
  );

  const onTabChange = useCallback(
    (value: string) => {
      const next = (tabs as readonly string[]).includes(value) ? (value as T) : defaultTab;
      void setTab(next);
    },
    [tabs, defaultTab, setTab],
  );

  return [tab, onTabChange] as const;
}
