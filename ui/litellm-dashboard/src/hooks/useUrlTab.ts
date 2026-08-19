import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useCallback } from "react";

/**
 * Page-level tab selection stored in the URL (?tab= by default) so tab views
 * are shareable and survive refresh. Invalid values fall back to defaultTab,
 * and the default keeps the URL clean (nuqs clears params at their default).
 */
export function useUrlTab<T extends string>(
  tabs: readonly T[],
  defaultTab: T,
  paramName: string = "tab",
): readonly [T, (value: string) => void] {
  const [tab, setTab] = useQueryState(
    paramName,
    parseAsStringLiteral(tabs).withDefault(defaultTab).withOptions({ history: "push" }),
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
