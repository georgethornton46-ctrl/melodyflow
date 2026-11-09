"use client";
import { useCallback, useEffect, useState } from "react";
import type { SheetView } from "./types";

export function useSheets() {
  const [sheets, setSheets] = useState<SheetView[] | null>(null);
  const [error, setError] = useState(false);
  const load = useCallback(async () => {
    setError(false);
    try {
      const r = await fetch("/api/sheets", { cache: "no-store" });
      if (!r.ok) throw new Error();
      setSheets((await r.json()).sheets);
    } catch {
      setError(true);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  return { sheets, setSheets, error, reload: load };
}
