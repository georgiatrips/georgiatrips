"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { BrandLogo } from "../lib/shared";

// Full-screen branded loading overlay shown during client-side route
// transitions. It appears the instant an internal link is clicked and
// fades out once the destination route has rendered.
export default function RouteLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const prevPath = useRef(pathname);
  const safetyTimer = useRef(null);

  // Hide the overlay once the pathname actually changes (new page mounted).
  useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname;
      const t = setTimeout(() => setLoading(false), 280);
      return () => clearTimeout(t);
    }
  }, [pathname]);

  // Show the overlay immediately when an internal navigation begins.
  useEffect(() => {
    const onClick = (e) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      )
        return;

      const anchor = e.target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (
        !href ||
        anchor.target === "_blank" ||
        href.startsWith("http") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      )
        return;

      let url;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      // Ignore pure hash/anchor jumps on the current page.
      if (url.pathname === window.location.pathname) return;

      setLoading(true);
      clearTimeout(safetyTimer.current);
      // Safety net: never let the overlay get stuck.
      safetyTimer.current = setTimeout(() => setLoading(false), 3500);
    };

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      clearTimeout(safetyTimer.current);
    };
  }, []);

  return (
    <div
      className={`route-loader ${loading ? "active" : ""}`}
      role="status"
      aria-live="polite"
      aria-hidden={!loading}
    >
      <div className="route-loader-inner">
        <div className="route-loader-logo">
          <BrandLogo width={72} height={72} priority />
        </div>
        <span className="route-loader-word">
          <span className="route-loader-word-a">Georgia</span>
          <span className="route-loader-word-b">Trips</span>
        </span>
        <div className="route-loader-bar">
          <span />
        </div>
      </div>
    </div>
  );
}
