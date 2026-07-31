"use client";

import { useEffect, useState } from "react";
import { subscribeTours } from "./toursStore";

/**
 * Realtime list of the tours created in the admin panel.
 * Returns { tours, loading, error } — pages merge these with the
 * static ALL_TOURS array.
 */
export function useDynamicTours() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeTours(
      (list) => {
        if (!active) return;
        setTours(list);
        setLoading(false);
      },
      (err) => {
        if (!active) return;
        setError(err);
        setLoading(false);
      }
    );
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  return { tours, loading, error };
}
