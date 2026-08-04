"use client";

import { useMemo, useEffect, useState } from "react";
import { ALL_TOURS } from "./toursData";
import { listFirestoreTours, normalizeFirestoreTour } from "./toursFirestore";

/**
 * Returns ALL tours shown across the site:
 *  - Static curated ALL_TOURS (from toursData.js)
 *  - + Firestore tours added from the Admin panel
 *
 * Usage:
 *   const { allTours, firestoreTours, loading } = useAllTours();
 */
export function useAllTours() {
  const [firestoreTours, setFirestoreTours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const list = await listFirestoreTours();
        if (!cancelled) {
          setFirestoreTours(
            list.map((t) => normalizeFirestoreTour(t)).filter(Boolean)
          );
        }
      } catch (err) {
        console.error("Firestore tours load failed:", err);
        if (!cancelled) setFirestoreTours([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const allTours = useMemo(() => {
    const staticIds = new Set(ALL_TOURS.map((t) => t.id));
    const dynamic = firestoreTours.filter((t) => !staticIds.has(t.id));
    return [...ALL_TOURS, ...dynamic];
  }, [firestoreTours]);

  return { allTours, firestoreTours, loading };
}

