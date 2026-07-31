"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "../lib/shared";
import { useAuth } from "../lib/AuthContext";

// Shared site navigation. `active` highlights the current top-level item.
// Supported active values: "home" | "tours" | "transport" | "posts" | "about" | "contact"
export default function Navbar({ active = "home" }) {
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [activeLang, setActiveLang] = useState("KA");
  const [activeCurrency, setActiveCurrency] = useState("GEL");
  const { user, logOut } = useAuth() ?? {};
  const router = useRouter();

  const displayName =
    user?.displayName ||
    user?.email?.split("@")[0] ||
    null;

  // Hover-intent: keep a dropdown open briefly after the cursor leaves the
  // trigger so it doesn't close while moving toward the menu items.
  const closeTimers = useRef({});
  const openDropdown = (setter) => {
    Object.values(closeTimers.current).forEach(clearTimeout);
    closeTimers.current = {};
    setter(true);
  };
  const scheduleClose = (key, setter) => {
    clearTimeout(closeTimers.current[key]);
    closeTimers.current[key] = setTimeout(() => setter(false), 220);
  };

  // Pages with a dark full-width hero can afford a fully transparent navbar
  // at the very top; light pages keep the solid background for readability.
  const [hasHero, setHasHero] = useState(false);

  useEffect(() => {
    setHasHero(!!document.querySelector(".hero, .tours-page-hero, .transfers-hero, .posts-hero, .tdp-hero2"));
    const handleScroll = () => setNavScrolled(window.scrollY > 50);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isTransparent = hasHero && !navScrolled && !mobileMenuOpen;

  return (
    <nav className={`nav ${navScrolled || mobileMenuOpen ? "scrolled" : ""} ${isTransparent ? "transparent" : ""}`}>
      {/* Logo */}
      <Link href="/" className="nav-logo" aria-label="GeorgiaTrips — მთავარი">
        <BrandLogo priority />
        <span className="nav-wordmark">
          <span className="nav-wordmark-georgia">Georgia</span>
          <span className="nav-wordmark-trips">Trips</span>
        </span>
      </Link>

      {/* Desktop Links */}
      <ul className="nav-links">
        <li><Link href="/">მთავარი</Link></li>
        <li><Link href="/tours" className={active === "tours" ? "active" : ""}>ტურები</Link></li>
        <li><Link href="/transfers" className={active === "transfers" || active === "transport" ? "active" : ""}>ტრანსპორტი</Link></li>
        <li><Link href="/posts" className={active === "posts" || active === "articles" ? "active" : ""}>სტატიები</Link></li>
      </ul>

      {/* Right Side Controls */}
      <div className="nav-right">
        {/* Language Switcher */}
        <div className="nav-control-wrap" onMouseEnter={() => openDropdown(setLangDropdownOpen)} onMouseLeave={() => scheduleClose("lang", setLangDropdownOpen)}>
          <button className="nav-control-btn" aria-label="ენის შეცვლა">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span>{activeLang}</span>
            <svg className={`nav-chevron ${langDropdownOpen ? "open" : ""}`} width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {langDropdownOpen && (
            <div className="nav-dropdown nav-dropdown-sm">
              {["KA", "EN", "RU", "AR"].map((lang) => (
                <button key={lang} className={`nav-dropdown-item ${activeLang === lang ? "active" : ""}`} onClick={() => { setActiveLang(lang); setLangDropdownOpen(false); }}>
                  {lang}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Currency Switcher */}
        <div className="nav-control-wrap" onMouseEnter={() => openDropdown(setCurrencyDropdownOpen)} onMouseLeave={() => scheduleClose("currency", setCurrencyDropdownOpen)}>
          <button className="nav-control-btn" aria-label="ვალუტის შეცვლა">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 6v12M9 8h4.5a2.5 2.5 0 0 1 0 5H9m0 0h4.5a2.5 2.5 0 0 1 0 5H9" />
            </svg>
            <span>{activeCurrency}</span>
            <svg className={`nav-chevron ${currencyDropdownOpen ? "open" : ""}`} width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {currencyDropdownOpen && (
            <div className="nav-dropdown nav-dropdown-sm">
              {["GEL", "USD", "EUR", "AED"].map((cur) => (
                <button key={cur} className={`nav-dropdown-item ${activeCurrency === cur ? "active" : ""}`} onClick={() => { setActiveCurrency(cur); setCurrencyDropdownOpen(false); }}>
                  {cur}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User / Login Button */}
        {user ? (
          <div
            className="nav-control-wrap"
            onMouseEnter={() => openDropdown(setUserDropdownOpen)}
            onMouseLeave={() => scheduleClose("user", setUserDropdownOpen)}
          >
            <button className="nav-login-btn nav-user-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</span>
              <svg className={`nav-chevron ${userDropdownOpen ? "open" : ""}`} width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {userDropdownOpen && (
              <div className="nav-dropdown" style={{ right: 0, left: "auto", minWidth: 160 }}>
                <button className="nav-dropdown-item" onClick={() => { router.push("/login"); setUserDropdownOpen(false); }}>
                  პროფილი
                </button>
                <button
                  className="nav-dropdown-item"
                  onClick={async () => { await logOut?.(); setUserDropdownOpen(false); router.push("/"); }}
                  style={{ color: "#f87171" }}
                >
                  გასვლა
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className="nav-login-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            შესვლა
          </Link>
        )}
      </div>

      {/* Mobile Hamburger */}
      <button
        className="nav-hamburger"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="მენიუ"
        aria-expanded={mobileMenuOpen}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Mobile Navigation Dropdown */}
      <div className={`nav-mobile ${mobileMenuOpen ? "open" : ""}`}>
        <Link href="/" onClick={() => setMobileMenuOpen(false)}>მთავარი</Link>
        <Link href="/tours" onClick={() => setMobileMenuOpen(false)}>ტურები</Link>
        <Link href="/transfers" onClick={() => setMobileMenuOpen(false)}>ტრანსპორტი</Link>
        <Link href="/posts" onClick={() => setMobileMenuOpen(false)}>სტატიები</Link>
        <div className="nav-mobile-controls">
          <div className="nav-mobile-ctrl-row">
            <span>ენა:</span>
            {["KA", "EN", "RU", "AR"].map((lang) => (
              <button key={lang} className={`nav-mobile-ctrl-btn ${activeLang === lang ? "active" : ""}`} onClick={() => setActiveLang(lang)}>{lang}</button>
            ))}
          </div>
          <div className="nav-mobile-ctrl-row">
            <span>ვალუტა:</span>
            {["GEL", "USD", "EUR", "AED"].map((cur) => (
              <button key={cur} className={`nav-mobile-ctrl-btn ${activeCurrency === cur ? "active" : ""}`} onClick={() => setActiveCurrency(cur)}>{cur}</button>
            ))}
          </div>
        </div>
        {user ? (
          <div className="nav-mobile-user">
            <div className="nav-mobile-user-info">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              <span>{displayName}</span>
            </div>
            <div className="nav-mobile-user-actions">
              <Link href="/login" className="nav-mobile-user-btn" onClick={() => setMobileMenuOpen(false)}>
                პროფილი
              </Link>
              <button
                className="nav-mobile-user-btn nav-mobile-logout"
                onClick={async () => { await logOut?.(); setMobileMenuOpen(false); router.push("/"); }}
              >
                გასვლა
              </button>
            </div>
          </div>
        ) : (
          <Link href="/login" className="nav-mobile-login" onClick={() => setMobileMenuOpen(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            შესვლა / რეგისტრაცია
          </Link>
        )}
      </div>
    </nav>
  );
}
