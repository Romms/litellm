import { parseAsIsoDateTime, useQueryStates } from "nuqs";
import { useCallback, useMemo } from "react";

import type { DateRangePickerValue } from "@/components/shared/date_picker_types";

/**
 * Date range stored in the URL (?from=&to= as ISO timestamps) so a shared link
 * reports the same window the sender was looking at. The params stay absent
 * while the range is the caller's default, which is a moving target (e.g. "the
 * last 7 days") and so cannot be compared against a fixed param value.
 */
export function useUrlDateRange(
  defaultRange: DateRangePickerValue,
): readonly [DateRangePickerValue, (value: DateRangePickerValue) => void] {
  const [range, setRange] = useQueryStates({ from: parseAsIsoDateTime, to: parseAsIsoDateTime }, { history: "push" });

  const value = useMemo(
    () => ({ from: range.from ?? defaultRange.from, to: range.to ?? defaultRange.to }),
    [range.from, range.to, defaultRange.from, defaultRange.to],
  );

  const onChange = useCallback(
    (next: DateRangePickerValue) => {
      void setRange({ from: next.from ?? null, to: next.to ?? null });
    },
    [setRange],
  );

  return [value, onChange] as const;
}
