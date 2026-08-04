"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import DatePicker from "../components/DatePicker";
import { DESTINATIONS } from "../lib/toursData";
import { useAllTours } from "../lib/useAllTours";
import { WA_LINK } from "../lib/shared";

function ToursPageContent() {
  const searchParams = useSearchParams();

  const [selectedDestination, setSelectedDestination] = useState("all");
  const [selectedType, setSelectedType] = useState("all"); // "all" | "oneday" | "multiday"
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("all"); // "all" | "individual" | "group"
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [showMobileFilterTrigger, setShowMobileFilterTrigger] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const handleScroll = () => setShowMobileFilterTrigger(window.scrollY > 260);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Static tours + Firestore tours added from Admin panel
  const { allTours } = useAllTours();

  const allAvailableDates = useMemo(() => {
    const datesSet = new Set();
    allTours.forEach((t) => {
      if (t.dates) t.dates.forEach((d) => datesSet.add(d));
      if (t.departureDates) t.departureDates.forEach((entry) => {
        const iso = typeof entry === "string" ? entry : entry?.date;
        if (iso) datesSet.add(iso);
      });
    });
    return Array.from(datesSet);
  }, [allTours]);

  // Sync state with URL Search Params on mount or when URL changes
  useEffect(() => {
    const dest = searchParams.get("destination");
    const fmt = searchParams.get("format");
    const dt = searchParams.get("date");

    if (dest) setSelectedDestination(dest);
    if (fmt) setSelectedFormat(fmt);
    if (dt) setSelectedDate(dt);
  }, [searchParams]);

  // Filtering Logic
  const filteredTours = useMemo(() => {
    return allTours.filter((tour) => {
      // 1. Destination filter
      if (selectedDestination !== "all" && tour.destination !== selectedDestination) {
        return false;
      }

      // 2. Type filter (oneday / multiday)
      if (selectedType !== "all" && tour.type !== selectedType) {
        return false;
      }

      // 3. Tour Format filter (individual / group)
      if (selectedFormat === "individual" && !(tour.hasPrivate ?? Boolean(tour.pricePrivate))) {
        return false;
      }
      if (selectedFormat === "group" && !(tour.hasGroup ?? Boolean(tour.priceGroup))) {
        return false;
      }

      // 4. Date filter
      if (selectedDate) {
        const parts = selectedDate.split("-");
        if (parts.length === 3) {
          const mmdd = `${parts[1]}.${parts[2]}`;
          const hasExactDepartureDate = tour.departureDates?.some((entry) => {
            const iso = typeof entry === "string" ? entry : entry?.date;
            return iso === selectedDate;
          });
          const hasMatchingLegacyDate = tour.dates?.includes(mmdd);
          if (!hasExactDepartureDate && !hasMatchingLegacyDate) {
            return false;
          }
        }
      }

      // 5. Search query
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const inTitle = tour.title.toLowerCase().includes(q);
        const inDesc = tour.desc.toLowerCase().includes(q);
        const inLoc = tour.location.toLowerCase().includes(q);
        if (!inTitle && !inDesc && !inLoc) return false;
      }

      return true;
    });
  }, [selectedDestination, selectedType, selectedFormat, selectedDate, searchQuery, allTours]);

  useEffect(() => { setCurrentPage(1); }, [selectedDestination, selectedType, selectedFormat, selectedDate, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredTours.length / 12));
  const visibleTours = filteredTours.slice((currentPage - 1) * 12, currentPage * 12);

  const resetFilters = () => {
    setSelectedDestination("all");
    setSelectedType("all");
    setSelectedDate("");
    setSelectedFormat("all");
    setSearchQuery("");
  };

  const handleBookNow = (tourTitle) => {
    const message = encodeURIComponent(`გამარჯობა! მსურს ტურის დაჯავშნა: "${tourTitle}"`);
    window.open(`${WA_LINK}?text=${message}`, "_blank");
  };

  const hasActiveFilters = selectedDestination !== "all" || selectedType !== "all" || selectedFormat !== "all" || selectedDate || searchQuery;

  return (
    <>
      <Navbar active="tours" />

      {/* Hero Banner Section */}
      <header className="tours-page-hero">
        <div className="tours-hero-bg">
          <Image
            src="/hero.png"
            alt="ყველა ტური საქართველოში"
            fill
            priority
            style={{ objectFit: "cover" }}
          />
          <div className="tours-hero-overlay"></div>
        </div>
        <div className="tours-hero-content">
          <span className="tours-hero-badge">აირჩიეთ თქვენი მოგზაურობა</span>
          <h1 className="tours-hero-title">ყველაზე პოპულარული ტურები საქართველოში</h1>
          <p className="tours-hero-desc">
            ერთდღიანი და მრავალდღიანი დაუვიწყარი თავგადასავლები ბათუმში, ყაზბეგსა და მთელს საქართველოში.
          </p>
        </div>
      </header>

      {/* Main Content with Filter Bar and Tour Cards Grid */}
      <section className="tours-catalog-section">
        <div className="tours-catalog-inner">

          {/* Mobile Filter Trigger Button */}
          {showMobileFilterTrigger && <div className="mobile-filter-bar-wrap">
            <button
              className="mobile-filter-trigger-btn"
              onClick={() => setMobileFilterOpen(true)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              <span>ფილტრების გახსნა</span>
              {hasActiveFilters && <span className="mobile-filter-dot" />}
            </button>
          </div>}

          {/* Backdrop Overlay for Mobile Drawer */}
          {mobileFilterOpen && (
            <div className="mobile-filter-backdrop" onClick={() => setMobileFilterOpen(false)} />
          )}

          {/* Filter Bar Panel */}
          <aside className={"tours-filter-panel " + (mobileFilterOpen ? "mobile-open " : "") + (showMobileFilterTrigger ? "mobile-scrolled" : "")}>
            <div className="filter-panel-header">
              <h3>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                ტურების ფილტრი
              </h3>
              <div className="filter-header-actions">
                {hasActiveFilters && (
                  <button className="btn-reset-filters" onClick={resetFilters}>
                    გასუფთავება
                  </button>
                )}
                <button className="btn-close-mobile-filter" onClick={() => setMobileFilterOpen(false)} aria-label="დახურვა">
                  ✕
                </button>
              </div>
            </div>

            <div className="filter-form-grid">
              {/* Search input */}
              <div className="filter-group filter-group-full">
                <label htmlFor="filter-search">საძიებო სიტყვა</label>
                <div className="filter-input-wrap">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    id="filter-search"
                    type="text"
                    placeholder="ძებნა (მაგ: ყაზბეგი, მარტვილი...)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* 1. Destination Filter */}
              <div className="filter-group">
                <label htmlFor="filter-destination">რეგიონი</label>
                <div className="filter-select-wrap">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  <select
                    id="filter-destination"
                    value={selectedDestination}
                    onChange={(e) => setSelectedDestination(e.target.value)}
                  >
                    {DESTINATIONS.map((dest) => (
                      <option key={dest.value} value={dest.value}>
                        {dest.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 2. Tour Type Filter (One-day / Multi-day) */}
              <div className="filter-group">
                <label htmlFor="filter-type">ხანგრძლივობა / ტიპი</label>
                <div className="filter-select-wrap">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                  <select
                    id="filter-type"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                  >
                    <option value="all">ყველა ტიპი</option>
                    <option value="oneday">ერთდღიანი ტურები</option>
                    <option value="multiday">მრავალდღიანი ტურები</option>
                  </select>
                </div>
              </div>

              {/* 3. Custom DatePicker Filter — direction="up" so calendar opens upwards! */}
              <div className="filter-group">
                <label>გამგზავრების თარიღი</label>
                <DatePicker
                  value={selectedDate}
                  onChange={(dateStr) => setSelectedDate(dateStr)}
                  placeholder="აირჩიეთ თარიღი"
                  direction="up"
                  availableDates={allAvailableDates}
                  variant="filter"
                />
              </div>

              {/* 4. Tour Format Filter (Individual / Group) */}
              <div className="filter-group">
                <label htmlFor="filter-format">ტურის ფორმატი</label>
                <div className="filter-select-wrap">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <select
                    id="filter-format"
                    value={selectedFormat}
                    onChange={(e) => setSelectedFormat(e.target.value)}
                  >
                    <option value="all">ყველა ფორმატი</option>
                    <option value="individual">ინდივიდუალური ტური</option>
                    <option value="group">ჯგუფური ტური</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Mobile apply button */}
            <button className="btn-apply-mobile-filter" onClick={() => setMobileFilterOpen(false)}>
              შედეგების ჩვენება ({filteredTours.length})
            </button>
          </aside>

          {/* Results Summary & Cards Grid */}
          <div className="tours-results-wrap">
            <div className="tours-results-header">
              <h2>
                მოიძებნა <strong>{filteredTours.length}</strong> ტური
              </h2>
              {hasActiveFilters ? (
                <div className="active-filter-tags">
                  {selectedDestination !== "all" && (
                    <span className="filter-tag">
                      {DESTINATIONS.find((d) => d.value === selectedDestination)?.label}
                      <button onClick={() => setSelectedDestination("all")}>✕</button>
                    </span>
                  )}
                  {selectedType !== "all" && (
                    <span className="filter-tag">
                      {selectedType === "oneday" ? "ერთდღიანი" : "მრავალდღიანი"}
                      <button onClick={() => setSelectedType("all")}>✕</button>
                    </span>
                  )}
                  {selectedFormat !== "all" && (
                    <span className="filter-tag">
                      {selectedFormat === "individual" ? "ინდივიდუალური" : "ჯგუფური"}
                      <button onClick={() => setSelectedFormat("all")}>✕</button>
                    </span>
                  )}

                </div>
              ) : null}
            </div>

            {filteredTours.length > 0 ? (
              <>
              <div className="tours-grid-catalog">
                {visibleTours.map((tour) => (
                  <Link key={tour.id} href={`/tours/${tour.id}`} className="tb-card" style={{ textDecoration: "none" }}>
                    <div className="tb-card-img-wrap">
                      <Image src={tour.img} alt={tour.title} className="tb-card-img" fill style={{ objectFit: "cover" }} loading="lazy" />
                      <span className="tb-badge">{tour.badge || tour.destinationLabel || tour.destination || "საქართველო"}</span>
                      <div className="tb-overlay-right">
                        {tour.pricePrivate && <div className="tb-price-tag tb-price-priv"><small>ინდივიდუალური</small><strong>{tour.pricePrivate}</strong></div>}
                        {tour.priceGroup && <div className="tb-price-tag tb-price-group"><small>ჯგუფში</small><strong>{tour.priceGroup}</strong></div>}
                        {tour.dates?.length > 0 && <div className="tb-dates-row">{tour.dates.slice(0, 4).map((date, index) => <span key={index} className="tb-date-chip">{date}</span>)}</div>}
                      </div>
                    </div>
                    <div className="tb-card-body">
                      <h3 className="tb-card-title">{tour.title}</h3>
                      <p className="tb-card-annotation">{tour.desc}</p>
                      <div className="tb-card-line" />
                      <div className="tb-card-facilities">
                        <span className="tb-facility-item">⏱ {tour.duration}</span>
                        <span className="tb-facility-item">{tour.location || "📍 ბათუმიდან"}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="catalog-pagination" aria-label="ტურების გვერდები">{Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => <button key={number} type="button" className={currentPage === number ? "is-active" : ""} onClick={() => setCurrentPage(number)}>{number}</button>)}</div>
              </>
            ) : (
              <div className="tours-empty-state">
                <div className="empty-icon">🏔️</div>
                <h3>ტური ვერ მოიძებნა</h3>
                <p>სამწუხაროდ მითითებული ფილტრებით ტური ვერ მოიძებნა. სცადეთ ფილტრების შეცვლა ან გასუფთავება.</p>
                <button className="btn-empty-reset" onClick={resetFilters}>
                  ყველა ფილტრის გასუფთავება
                </button>
              </div>
            )}
          </div>

        </div>
      </section>

      <Footer />
    </>
  );
}

export default function ToursPage() {
  return (
    <Suspense fallback={<div style={{ padding: "4rem", textAlign: "center", color: "#0d233a" }}>ჩატვირთვა...</div>}>
      <ToursPageContent />
    </Suspense>
  );
}
