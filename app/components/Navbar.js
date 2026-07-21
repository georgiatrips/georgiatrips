"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BrandLogo, WA_LINK, WhatsAppIcon } from "../lib/shared";

// Shared site navigation. `active` highlights the current top-level item.
// Supported active values: "home" | "tours" | "transport" | "posts" | "about" | "contact"
export default function Navbar({ active = "home" }) {
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toursDropdownOpen, setToursDropdownOpen] = useState(false);
  const [mobilToursOpen, setMobilToursOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [activeLang, setActiveLang] = useState("KA");
  const [activeCurrency, setActiveCurrency] = useState("GEL");

  useEffect(() => {
    const handleScroll = () => setNavScrolled(window.scrollY > 50);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`nav ${navScrolled ? "scrolled" : ""}`}>
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
        <li><Link href="/#home">მთავარი</Link></li>
        <li
          className="nav-dropdown-wrap"
          onMouseEnter={() => setToursDropdownOpen(true)}
          onMouseLeave={() => setToursDropdownOpen(false)}
        >
          <button
            className={`nav-dropdown-trigger ${active === "tours" ? "active" : ""}`}
            aria-haspopup="true"
            aria-expanded={toursDropdownOpen}
          >
            ტურები
            <svg className={`nav-chevron ${toursDropdownOpen ? "open" : ""}`} width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {toursDropdownOpen && (
            <div className="nav-dropdown">
              <Link href="/domestic-tours" className="nav-dropdown-item">შიდა ტურები</Link>
              <Link href="/international-tours" className="nav-dropdown-item">საერთაშორისო ტურები</Link>
            </div>
          )}
        </li>
        <li><Link href="/#batumi-tours">ტრანსპორტი</Link></li>
        <li><Link href="/#why">სტატიები</Link></li>
        <li><Link href="/#home">ჩვენ შესახებ</Link></li>
        <li><Link href="/#booking">კონტაქტი</Link></li>
      </ul>

      {/* Right Side Controls */}
      <div className="nav-right">
        {/* Language Switcher */}
        <div className="nav-control-wrap" onMouseEnter={() => setLangDropdownOpen(true)} onMouseLeave={() => setLangDropdownOpen(false)}>
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
        <div className="nav-control-wrap" onMouseEnter={() => setCurrencyDropdownOpen(true)} onMouseLeave={() => setCurrencyDropdownOpen(false)}>
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

        {/* Login Button */}
        <Link href="/#booking" className="nav-login-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
          შესვლა
        </Link>
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
        <Link href="/#home" onClick={() => setMobileMenuOpen(false)}>მთავარი</Link>
        <div className="nav-mobile-dropdown">
          <button className="nav-mobile-section-btn" onClick={() => setMobilToursOpen(!mobilToursOpen)}>
            ტურები
            <svg className={`nav-chevron ${mobilToursOpen ? "open" : ""}`} width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {mobilToursOpen && (
            <div className="nav-mobile-sub">
              <Link href="/domestic-tours" onClick={() => setMobileMenuOpen(false)}>შიდა ტურები</Link>
              <Link href="/international-tours" onClick={() => setMobileMenuOpen(false)}>საერთაშორისო ტურები</Link>
            </div>
          )}
        </div>
        <Link href="/#batumi-tours" onClick={() => setMobileMenuOpen(false)}>ტრანსპორტი</Link>
        <Link href="/#why" onClick={() => setMobileMenuOpen(false)}>სტატიები</Link>
        <Link href="/#home" onClick={() => setMobileMenuOpen(false)}>ჩვენ შესახებ</Link>
        <Link href="/#booking" onClick={() => setMobileMenuOpen(false)}>კონტაქტი</Link>
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
        <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
          <WhatsAppIcon /> WhatsApp-ზე მოგვწერეთ
        </a>
      </div>
    </nav>
  );
}
