"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import DatePicker from "../../components/DatePicker";
import { getTourById, getTourDetails, getTourSchedule, ALL_TOURS } from "../../lib/toursData";
import { WA_LINK, WA_NUMBER, PHONE_DISPLAY, TELEGRAM_HANDLE, TELEGRAM_LINK, INSTAGRAM_HANDLE, INSTAGRAM_LINK, FAQS } from "../../lib/shared";

export default function TourDetailPage() {
  const params = useParams();
  const tourId = params?.id || "promethe-martvili";

  const rawTour = getTourById(tourId);
  const tour = getTourDetails(rawTour);

  // Free-dates schedule for this specific tour, grouped by month
  const tourSchedule = getTourSchedule(rawTour?.id);

  // Similar tours list (excluding current tour)
  const similarTours = (ALL_TOURS || []).filter((t) => t.id !== rawTour?.id).slice(0, 3);

  // Most popular tours (category='popular', excluding current tour)
  const popularTours = (ALL_TOURS || []).filter((t) => t.category === "popular" && t.id !== rawTour?.id);

  // Upcoming free dates for the GROUP tour in "MM.DD" format (DatePicker format),
  // derived from the tour's schedule (same dates shown in the schedule section)
  const groupDatesMMDD = tourSchedule.flatMap((mGroup) =>
    mGroup.dates.map((d) => {
      const [dd, mm] = String(d).split(".");
      return `${mm}.${dd}`;
    })
  );
  const hasGroupDates = groupDatesMMDD.length > 0;

  // Form State
  const [selectedDate, setSelectedDate] = useState("");
  const [bookingName, setBookingName] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [bookingPeople, setBookingPeople] = useState("2");
  const [messengerPref, setMessengerPref] = useState("WhatsApp");
  const [bookingNotes, setBookingNotes] = useState("");
  // Tour type: "group" (fixed schedule dates) or "private" (any date)
  const [tourType, setTourType] = useState(hasGroupDates ? "group" : "private");

  // ---- Price calculation ----
  const parsePriceNumber = (str) => {
    const m = String(str || "").replace(/\s/g, "").match(/\d+/);
    return m ? parseInt(m[0], 10) : 0;
  };
  const groupUnitPrice = parsePriceNumber(tour?.priceGroup);
  const privateTotalPrice = parsePriceNumber(tour?.pricePrivate);
  const peopleCount = Math.max(1, parseInt(bookingPeople, 10) || 1);
  const totalPrice = tourType === "group" ? groupUnitPrice * peopleCount : privateTotalPrice;
  
  // Active Itinerary Accordion / Hover Stop state
  const [expandedStep, setExpandedStep] = useState(null);
  const [hoveredStop, setHoveredStop] = useState(null);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // VIP Details Tab State
  const [activeDetailTab, setActiveDetailTab] = useState("includes");

  // Lightbox State
  const [lightboxImgIndex, setLightboxImgIndex] = useState(null);

  // Mobile Sticky Booking Bar Observer State
  const [showMobileStickyBtn, setShowMobileStickyBtn] = useState(false);
  const bookingSidebarRef = useRef(null);

  // Auto-select nearest available date from today if not manually selected.
  // Only applies to GROUP tours — individual tours can pick any date.
  useEffect(() => {
    if (tourType === "group" && groupDatesMMDD.length > 0) {
      const findNearestDate = (dates) => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const currentYear = now.getFullYear();
        let closestDate = null;
        let minDiff = Infinity;

        for (const dateStr of dates) {
          const parts = dateStr.split(".");
          if (parts.length !== 2) continue;
          const month = parseInt(parts[0], 10) - 1;
          const day = parseInt(parts[1], 10);

          let target = new Date(currentYear, month, day);
          target.setHours(0, 0, 0, 0);

          if (target <= now) {
            continue;
          }

          const diff = target.getTime() - now.getTime();
          if (diff >= 0 && diff < minDiff) {
            minDiff = diff;
            closestDate = target;
          }
        }

        if (!closestDate) return "";
        const yyyy = closestDate.getFullYear();
        const mm = String(closestDate.getMonth() + 1).padStart(2, "0");
        const dd = String(closestDate.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
      };

      const nearest = findNearestDate(groupDatesMMDD);
      if (nearest) {
        setSelectedDate(nearest);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourId, tourType]);

  // When switching tour type, make sure the selected date is valid for group tours
  const handleTourTypeChange = (type) => {
    if (type === "group" && !hasGroupDates) return;
    setTourType(type);
    if (type === "group" && selectedDate) {
      // If currently selected date is not one of the group's free dates, clear it
      const [, mm, dd] = selectedDate.split("-");
      if (!groupDatesMMDD.includes(`${mm}.${dd}`)) {
        setSelectedDate("");
      }
    }
  };

  useEffect(() => {
    const sidebarElem = bookingSidebarRef.current;
    let isSidebarIntersecting = false;

    const checkStickyVisibility = () => {
      const isScrolledDown = window.scrollY > 100;
      setShowMobileStickyBtn(isScrolledDown && !isSidebarIntersecting);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isSidebarIntersecting = entry.isIntersecting;
        checkStickyVisibility();
      },
      { threshold: 0.15 }
    );

    if (sidebarElem) observer.observe(sidebarElem);
    window.addEventListener("scroll", checkStickyVisibility, { passive: true });
    checkStickyVisibility();

    return () => {
      if (sidebarElem) observer.unobserve(sidebarElem);
      window.removeEventListener("scroll", checkStickyVisibility);
      observer.disconnect();
    };
  }, []);

  const scrollToBooking = () => {
    if (bookingSidebarRef.current) {
      bookingSidebarRef.current.scrollIntoView({ behavior: "smooth" });
    } else {
      const elem = document.getElementById("mobile-booking-target");
      if (elem) elem.scrollIntoView({ behavior: "smooth" });
    }
  };

  const toggleStep = (idx) => {
    setExpandedStep(expandedStep === idx ? null : idx);
  };

  // Convert a "DD.MM" schedule chip into a "YYYY-MM-DD" value for the booking form
  const scheduleDateToIso = (chip) => {
    const [dd, mm] = String(chip).split(".");
    if (!dd || !mm) return "";
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const monthIndex = parseInt(mm, 10) - 1;
    const day = parseInt(dd, 10);
    let target = new Date(now.getFullYear(), monthIndex, day);
    target.setHours(0, 0, 0, 0);
    if (target <= now) return "";
    const yyyy = target.getFullYear();
    return `${yyyy}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const pickScheduleDate = (chip) => {
    const iso = scheduleDateToIso(chip);
    if (!iso) return;
    // Schedule chips are group-tour dates, so switch to group type
    setTourType("group");
    setSelectedDate(iso);
    scrollToBooking();
  };

  const handleBookingSubmit = (e) => {
    e.preventDefault();

    const msgLines = [
      `✈️ *GeorgiaTrips — ტურის ჯავშანი*`,
      `━━━━━━━━━━━━━━━━━━`,
      `📍 *ტური:* ${tour.title}`,
      `🎫 *ტურის ტიპი:* ${tourType === "group" ? "ჯგუფური ტური" : "ინდივიდუალური ტური"}`,
      `📅 *თარიღი:* ${selectedDate || "შეთანხმებით"}`,
      `👤 *სახელი:* ${bookingName.trim() || "მითითებული არ არის"}`,
      `📞 *ტელეფონი:* ${bookingPhone.trim() || "მითითებული არ არის"}`,
      `👥 *მოგზაურთა რაოდენობა:* ${bookingPeople} კაცი`,
      `💬 *კავშირის არხი:* ${messengerPref}`,
      tourType === "group" && groupUnitPrice
        ? `💰 *ფასი:* ₾${groupUnitPrice} × ${peopleCount} კაცი = *₾${totalPrice}*`
        : "",
      tourType === "private" && privateTotalPrice
        ? `💰 *ფასი:* *₾${totalPrice}* (მთელი ჯგუფისთვის)`
        : "",
      bookingNotes.trim() ? `📝 *შენიშვნა:* ${bookingNotes.trim()}` : ""
    ].filter(Boolean);

    const fullMessage = msgLines.join("\n");
    window.open(`${WA_LINK}?text=${encodeURIComponent(fullMessage)}`, "_blank");
  };

  const openLightbox = (index) => {
    setLightboxImgIndex(index);
  };

  const closeLightbox = () => {
    setLightboxImgIndex(null);
  };

  const prevLightboxImg = (e) => {
    e.stopPropagation();
    if (lightboxImgIndex !== null && tour.gallery) {
      setLightboxImgIndex((lightboxImgIndex - 1 + tour.gallery.length) % tour.gallery.length);
    }
  };

  const nextLightboxImg = (e) => {
    e.stopPropagation();
    if (lightboxImgIndex !== null && tour.gallery) {
      setLightboxImgIndex((lightboxImgIndex + 1) % tour.gallery.length);
    }
  };

  return (
    <div className="tour-page-wrapper">
      <Navbar active="tours" />

      {/* 1. HERO SHOWCASE SECTION — editorial media + overlapping info panel */}
      <section className="tdp-hero2">
        <div className="tdp-hero2-media">
          <Image
            src={tour.img || "/hero.png"}
            alt={tour.title}
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover" }}
          />
          <div className="tdp-hero2-scrim" />

          <div className="container tdp-hero2-topbar">
            <nav className="tdp-hero2-crumbs" aria-label="ნავიგაცია">
              <Link href="/">მთავარი</Link>
              <span className="sep">/</span>
              <Link href="/tours">ტურები</Link>
              <span className="sep">/</span>
              <span className="active">{tour.title}</span>
            </nav>

            <span className="tdp-hero2-badge">{tour.badge || "პოპულარული ტური"}</span>
          </div>

          <div className="container tdp-hero2-caption">
            <span className="tdp-hero2-kicker">{tour.typeLabel || "ერთდღიანი"} ექსკურსია</span>
            <h1 className="tdp-hero2-title">{tour.title}</h1>
          </div>
        </div>

        <div className="container">
          <div className="tdp-hero2-panel">
            <div className="tdp-hero2-facts">
              <div className="tdp-hero2-fact">
                <span className="fact-label">ხანგრძლივობა</span>
                <strong className="fact-value">{tour.duration || "1 დღე"}</strong>
              </div>
              <div className="tdp-hero2-fact">
                <span className="fact-label">მიმართულება</span>
                <strong className="fact-value">{(tour.location || "საქართველო").replace("📍", "").trim()}</strong>
              </div>
              <div className="tdp-hero2-fact">
                <span className="fact-label">ჯგუფი</span>
                <strong className="fact-value">1-18 კაცი</strong>
              </div>
              <div className="tdp-hero2-fact">
                <span className="fact-label">ფასი</span>
                <strong className="fact-value accent">{tour.priceGroup}</strong>
              </div>
            </div>

            <button type="button" className="tdp-hero2-cta" onClick={scrollToBooking}>
              დაჯავშნა
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* 2. MAIN CONTENT GRID SECTION */}
      <section className="tdp-main-section">
        <div className="container tdp-grid-layout">

          {/* LEFT COLUMN: Main Tour Details */}
          <div className="tdp-content-col">

            {/* SECTION 1: ABOUT EXCURSION */}
            <article className="tdp-card-block">
              <div className="tdp-card-header">
                <div>
                  <h2>ექსკურსიის შესახებ</h2>
                  <p className="subtitle">მოკლე მიმოხილვა და ძირითადი შთაბეჭდილებები</p>
                </div>
              </div>

              <div className="tdp-card-body">
                <p className="tdp-about-lead">{tour.desc}</p>
              </div>
            </article>

            {/* SECTION 2: ZIGZAG CONNECTED ROUTE MAP */}
            <article className="tdp-card-block">
              <div className="tdp-card-header">
                <div>
                  <h2>მარშრუტი & სანახავი ადგილები</h2>
                  <p className="subtitle">მიიტანეთ კურსორი წერტილზე დეტალებისა და ფოტოს სანახავად</p>
                </div>
              </div>

              <div className="tdp-card-body">
                <div className="tdp-zigzag-wrapper">
                  
                  {/* Dynamic Zigzag SVG Line Connecting Points 1->2->3->4->5->6 */}
                  <svg className="tdp-zigzag-svg-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                    <path
                      d="M 22 8 L 78 24 L 22 40 L 78 56 L 22 72 L 78 88"
                      fill="none"
                      stroke="url(#zigzagTrailGrad)"
                      strokeWidth="2.5"
                      strokeDasharray="4 3"
                    />
                    <defs>
                      <linearGradient id="zigzagTrailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#106da4" />
                        <stop offset="50%" stopColor="#29b2b7" />
                        <stop offset="100%" stopColor="#fab418" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Connected Zigzag Nodes List */}
                  <div className="tdp-zigzag-nodes-list">
                    {tour.itinerary && tour.itinerary.map((item, idx) => {
                      const stopImg = item.img || tour.gallery?.[idx % (tour.gallery?.length || 1)] || tour.img;
                      const isHovered = hoveredStop === idx;
                      const isRight = idx % 2 !== 0;

                      return (
                        <div
                          key={idx}
                          className={`tdp-zigzag-node-item ${isRight ? "pos-right" : "pos-left"} ${isHovered ? "is-active" : ""}`}
                          onMouseEnter={() => setHoveredStop(idx)}
                          onMouseLeave={() => setHoveredStop(null)}
                          onClick={() => {
                            const galIdx = tour.gallery?.indexOf(stopImg);
                            openLightbox(galIdx >= 0 ? galIdx : 0);
                          }}
                        >
                          {/* Circular Point Dot Button */}
                          <div className="tdp-zigzag-dot-btn">
                            <span className="zigzag-dot-ring" />
                            <span className="zigzag-dot-num">{idx + 1}</span>
                          </div>

                          {/* Short Label Beside Dot */}
                          <div className="tdp-zigzag-label">
                            <small>ლოკაცია #{idx + 1}</small>
                            <strong>{item.title}</strong>
                          </div>

                          {/* Hover Popover Tooltip Card */}
                          {isHovered && (
                            <div className="tdp-dot-hover-popover" onClick={(e) => e.stopPropagation()}>
                              <div className="popover-triangle" />
                              <div className="popover-content">
                                <span className="popover-tag">📍 ლოკაცია #{idx + 1}</span>
                                <h4>{item.title}</h4>
                                <p>{item.desc}</p>

                                <div className="popover-photo-box">
                                  <Image
                                    src={stopImg}
                                    alt={item.title}
                                    fill
                                    style={{ objectFit: "cover" }}
                                    sizes="300px"
                                  />
                                  <div className="popover-photo-overlay">
                                    <button
                                      type="button"
                                      className="btn-popover-zoom"
                                      onClick={() => {
                                        const galIdx = tour.gallery?.indexOf(stopImg);
                                        openLightbox(galIdx >= 0 ? galIdx : 0);
                                      }}
                                    >
                                      📸 ფოტოს დათვალიერება
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>
            </article>

            {/* SECTION 3: MINIMALIST & ORIGINAL EXCURSION DETAILS */}
            <article className="tdp-card-block tdp-minimalist-details-block">
              <div className="tdp-minimalist-header">
                <h2>ექსკურსიის დეტალები</h2>
              </div>

              <div className="tdp-minimalist-grid">
                {/* 1. Departure */}
                <div className="tdp-min-card">
                  <div className="tdp-min-icon-box">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div className="tdp-min-info">
                    <span className="tdp-min-label">გამგზავრება</span>
                    <strong className="tdp-min-value">{tour.departure || "ბათუმი"}</strong>
                  </div>
                </div>

                {/* 2. Departure time */}
                <div className="tdp-min-card">
                  <div className="tdp-min-icon-box">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div className="tdp-min-info">
                    <span className="tdp-min-label">გამგზავრების დრო</span>
                    <strong className="tdp-min-value">შეთანხმებით</strong>
                  </div>
                </div>

                {/* 3. Payment */}
                <div className="tdp-min-card">
                  <div className="tdp-min-icon-box">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="5" width="20" height="14" rx="3" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                  </div>
                  <div className="tdp-min-info">
                    <span className="tdp-min-label">გადახდა</span>
                    <strong className="tdp-min-value">გადახდა გამგზავრების დღეს ნაღდი ანგარიშსწორებით</strong>
                  </div>
                </div>
              </div>
            </article>

            {/* SECTION 4: THIS TOUR'S SCHEDULE & FREE DATES */}
            {tourSchedule.length > 0 ? (
              <article className="tdp-card-block tdp-schedule-block">
                <div className="tdp-card-header">
                  <div>
                    <h2>ამ ტურის განრიგი & თავისუფალი დღეები</h2>
                    <p className="subtitle">დააწკაპუნეთ თარიღზე — ის ავტომატურად აისახება ჯავშნის ფორმაში</p>
                  </div>
                </div>

                <div className="tdp-card-body">
                  <div className="tdp-schedule-months">
                    {tourSchedule.map((mGroup) => (
                      <div key={mGroup.monthName} className="tdp-schedule-month">
                        <span className="tdp-schedule-month-pill">{mGroup.monthName}</span>
                        <div className="tdp-schedule-days">
                          {mGroup.dates.map((d) => {
                            const iso = scheduleDateToIso(d);
                            const isActive = iso && iso === selectedDate;
                            return (
                              <button
                                key={d}
                                type="button"
                                className={`tdp-schedule-chip${isActive ? " is-active" : ""}`}
                                onClick={() => pickScheduleDate(d)}
                                title={`აირჩიეთ ${d} — ${tour.title}`}
                              >
                                {d}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="tdp-schedule-legend">
                    <span className="legend-item">
                      <i className="legend-dot free" /> თავისუფალი დღე
                    </span>
                    <span className="legend-item">
                      <i className="legend-dot picked" /> არჩეული თარიღი
                    </span>
                    <span className="legend-note">სხვა თარიღები — ინდივიდუალური ტურით, შეთანხმებით</span>
                  </div>
                </div>
              </article>
            ) : (
              <article className="tdp-card-block tdp-schedule-block">
                <div className="tdp-card-header">
                  <div>
                    <h2>ამ ტურის განრიგი & თავისუფალი დღეები</h2>
                  </div>
                </div>
                <div className="tdp-card-body">
                  <div className="tdp-no-schedule-box">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                      <line x1="9" y1="15" x2="15" y2="19" />
                      <line x1="15" y1="15" x2="9" y2="19" />
                    </svg>
                    <div>
                      <strong>ამ ტურისთვის ჯგუფური ტური ამჟამად არ არის დაგეგმილი</strong>
                      <p>თავისუფალი ჯგუფური თარიღები ვერ მოიძებნა. შეგიძლიათ დაჯავშნოთ ინდივიდუალური ტური ნებისმიერ თქვენთვის სასურველ დღეს.</p>
                    </div>
                  </div>
                </div>
              </article>
            )}

            {/* SECTION 5: PHOTO GALLERY */}
            {tour.gallery && tour.gallery.length > 0 && (
              <article className="tdp-card-block">
                <div className="tdp-card-header">
                  <div>
                    <h2>ფოტოგალერეა</h2>
                    <p className="subtitle">დააწკაპუნეთ ფოტოს გასადიდებლად</p>
                  </div>
                </div>

                <div className="tdp-card-body">
                  <div className="tdp-gallery-grid">
                    {tour.gallery.map((gImg, idx) => (
                      <div
                        key={idx}
                        className="tdp-gallery-item"
                        onClick={() => openLightbox(idx)}
                      >
                        <Image
                          src={gImg}
                          alt={`${tour.title} ფოტო ${idx + 1}`}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          style={{ objectFit: "cover" }}
                        />
                        <div className="gallery-zoom-badge">
                          <span>🔍 გაფართოება</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            )}



          </div>

          {/* RIGHT COLUMN: STICKY BOOKING & PRICING SIDEBAR */}
          <aside className="tdp-sidebar-col" ref={bookingSidebarRef} id="mobile-booking-target">
            <div className="tdp-sticky-card">
              
              {/* Pricing Banner Box */}
              <div className="tdp-price-box">
                <span className="price-header-label">ექსკურსიის ღირებულება</span>
                
                <div className="price-cards-stack">
                  {/* Group Tour Price */}
                  <button
                    type="button"
                    className={`price-tier-card group${tourType === "group" ? " is-selected" : ""}${!hasGroupDates ? " is-unavailable" : ""}`}
                    onClick={() => handleTourTypeChange("group")}
                    disabled={!hasGroupDates}
                    aria-pressed={tourType === "group"}
                  >
                    <div className="tier-info">
                      <strong>ჯგუფური ტური</strong>
                      <small>{hasGroupDates ? "ფიქსირებული განრიგი" : "ამჟამად არ არის დაგეგმილი"}</small>
                    </div>
                    <div className="tier-amount">{tour.priceGroup}</div>
                  </button>

                  {/* Private Tour Price */}
                  {tour.pricePrivate && (
                    <button
                      type="button"
                      className={`price-tier-card private${tourType === "private" ? " is-selected" : ""}`}
                      onClick={() => handleTourTypeChange("private")}
                      aria-pressed={tourType === "private"}
                    >
                      <div className="tier-info">
                        <strong>ინდივიდუალური ტური</strong>
                        <small>მხოლოდ თქვენი ჯგუფი</small>
                      </div>
                      <div className="tier-amount">{tour.pricePrivate}</div>
                    </button>
                  )}
                </div>


              </div>



              {/* High Conversion Booking Form */}
              <form className="tdp-booking-form" onSubmit={handleBookingSubmit}>
                <h3>ონლაინ ჯავშანი</h3>
                <p className="form-sub">შეავსეთ ფორმა და მყისიერად გადადით WhatsApp დასტურზე</p>

                <div className="tdp-form-group">
                  <label>თქვენი სახელი</label>
                  <input
                    type="text"
                    placeholder="მაგ: გიორგი"
                    value={bookingName}
                    onChange={(e) => setBookingName(e.target.value)}
                    required
                  />
                </div>

                <div className="tdp-form-group">
                  <label>ტურის ტიპი</label>
                  <div className="tdp-tour-type-switch" role="radiogroup" aria-label="ტურის ტიპის არჩევა">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={tourType === "group"}
                      className={`tdp-type-option${tourType === "group" ? " is-active" : ""}${!hasGroupDates ? " is-disabled" : ""}`}
                      onClick={() => handleTourTypeChange("group")}
                      disabled={!hasGroupDates}
                    >
                      <strong>ჯგუფური</strong>
                      <small>{groupUnitPrice ? `₾${groupUnitPrice}/კაცი` : "—"}</small>
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={tourType === "private"}
                      className={`tdp-type-option${tourType === "private" ? " is-active" : ""}`}
                      onClick={() => handleTourTypeChange("private")}
                    >
                      <strong>ინდივიდუალური</strong>
                      <small>{privateTotalPrice ? `₾${privateTotalPrice} სულ` : "შეთანხმებით"}</small>
                    </button>
                  </div>
                  {!hasGroupDates && (
                    <p className="tdp-no-group-note">
                      ამ ტურისთვის ჯგუფური ტური ამჟამად არ არის დაგეგმილი — შესაძლებელია მხოლოდ ინდივიდუალური ტურის დაჯავშნა.
                    </p>
                  )}
                </div>

                <div className="tdp-form-group">
                  <label>გამგზავრების თარიღი</label>
                  <DatePicker
                    value={selectedDate}
                    onChange={(dStr) => setSelectedDate(dStr)}
                    placeholder="აირჩიეთ თარიღი"
                    direction="down"
                    availableDates={tourType === "group" ? groupDatesMMDD : null}
                  />
                  {tourType === "private" && (
                    <p className="tdp-type-hint">ინდივიდუალური ტურისთვის ნებისმიერი დღე თავისუფალია</p>
                  )}
                </div>

                <div className="tdp-form-group">
                  <label>მოგზაურთა რაოდენობა (კაცი)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    placeholder="მაგ: 2"
                    value={bookingPeople}
                    onChange={(e) => setBookingPeople(e.target.value)}
                    required
                  />
                </div>

                <div className="tdp-form-group">
                  <label>ტელეფონი / WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="+995 5XX XX XX XX"
                    value={bookingPhone}
                    onChange={(e) => setBookingPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="tdp-form-group">
                  <label>სასურველი კავშირი</label>
                  <select
                    value={messengerPref}
                    onChange={(e) => setMessengerPref(e.target.value)}
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Viber">Viber</option>
                    <option value="Telegram">Telegram</option>
                    <option value="Direct Call">სატელეფონო ზარი</option>
                  </select>
                </div>

                <div className="tdp-form-group">
                  <label>დამატებითი შენიშვნა / კითხვა</label>
                  <textarea
                    rows={2}
                    placeholder="მაგ: სასტუმროს მისამართი..."
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                  />
                </div>

                {totalPrice > 0 && (
                  <div className="tdp-total-price-row">
                    <div className="total-price-label">
                      <span>ჯამური ღირებულება</span>
                      <small>
                        {tourType === "group"
                          ? `₾${groupUnitPrice} × ${peopleCount} კაცი`
                          : "ფიქსირებული ფასი მთელი ჯგუფისთვის"}
                      </small>
                    </div>
                    <strong className="total-price-amount">₾{totalPrice}</strong>
                  </div>
                )}

                <button type="submit" className="btn-tdp-submit">
                  <span>დაჯავშნა{totalPrice > 0 ? ` — ₾${totalPrice}` : ""}</span>
                </button>
              </form>

              {/* Direct Contacts Box */}
              <div className="tdp-direct-contacts">
                <p>ან დაგვიკავშირდით პირდაპირ:</p>
                <div className="contacts-btns-row">
                  <a
                    href={`${WA_LINK}?text=${encodeURIComponent(`გამარჯობა! მაინტერესებს ტური: "${tour.title}"`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="contact-btn wa"
                  >
                    <span>💬 WhatsApp</span>
                  </a>
                  <a href={`tel:${WA_NUMBER}`} className="contact-btn phone">
                    <span>📞 დარეკვა</span>
                  </a>
                </div>
              </div>

            </div>
          </aside>

        </div>
      </section>

      {/* ==================== SIMILAR TOURS SECTION ==================== */}
      {similarTours && similarTours.length > 0 && (
        <section className="similar-tours-section">
          <div className="similar-tours-container">
            <div className="similar-tours-header">
              <span className="similar-eyebrow">აღმოაჩინეთ სხვა მიმართულებები</span>
              <h2 className="similar-main-title">მსგავსი ტურები</h2>
            </div>
            <div className="similar-tours-grid">
              {similarTours.map((item) => (
                <Link
                  key={item.id}
                  href={`/tours/${item.id}`}
                  className="tb-card"
                  style={{ textDecoration: "none" }}
                >
                  <div className="tb-card-img-wrap">
                    <Image
                      src={item.img}
                      alt={item.title}
                      className="tb-card-img"
                      fill
                      style={{ objectFit: "cover" }}
                      loading="lazy"
                    />
                    {item.badge && <span className="tb-badge">{item.badge}</span>}
                    <div className="tb-overlay-right">
                      {item.pricePrivate && (
                        <div className="tb-price-tag tb-price-priv">
                          <small>ინდივიდუალური</small>
                          <strong>{item.pricePrivate}</strong>
                        </div>
                      )}
                      {item.priceGroup && (
                        <div className="tb-price-tag tb-price-group">
                          <small>ჯგუფში</small>
                          <strong>{item.priceGroup}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="tb-card-body">
                    <h3 className="tb-card-title">{item.title}</h3>
                    <p className="tb-card-annotation">{item.desc}</p>
                    <div className="tb-card-line"></div>
                    <div className="tb-card-facilities">
                      {item.duration && <span className="tb-facility-item">⏱ {item.duration}</span>}
                      {item.location && <span className="tb-facility-item">{item.location}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ==================== POPULAR TOURS SECTION ==================== */}
      {popularTours && popularTours.length > 0 && (
        <section className="similar-tours-section" style={{ borderTop: "1px solid #e2e8f0", background: "#f8fafc" }}>
          <div className="similar-tours-container">
            <div className="similar-tours-header">
              <span className="similar-eyebrow">ყველაზე მოთხოვნადი</span>
              <h2 className="similar-main-title">ყველაზე პოპულარული ტურები</h2>
            </div>
            <div className="similar-tours-grid">
              {popularTours.map((item) => (
                <Link
                  key={item.id}
                  href={`/tours/${item.id}`}
                  className="tb-card"
                  style={{ textDecoration: "none" }}
                >
                  <div className="tb-card-img-wrap">
                    <Image
                      src={item.img}
                      alt={item.title}
                      className="tb-card-img"
                      fill
                      style={{ objectFit: "cover" }}
                      loading="lazy"
                    />
                    {item.badge && <span className="tb-badge">{item.badge}</span>}
                    <div className="tb-overlay-right">
                      {item.pricePrivate && (
                        <div className="tb-price-tag tb-price-priv">
                          <small>ინდივიდუალური</small>
                          <strong>{item.pricePrivate}</strong>
                        </div>
                      )}
                      {item.priceGroup && (
                        <div className="tb-price-tag tb-price-group">
                          <small>ჯგუფში</small>
                          <strong>{item.priceGroup}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="tb-card-body">
                    <h3 className="tb-card-title">{item.title}</h3>
                    <p className="tb-card-annotation">{item.desc}</p>
                    <div className="tb-card-line"></div>
                    <div className="tb-card-facilities">
                      {item.duration && <span className="tb-facility-item">⏱ {item.duration}</span>}
                      {item.location && <span className="tb-facility-item">{item.location}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ==================== SPECIAL EXCURSIONS CONTACT BANNER ==================== */}
      <section className="tdp-promo-contact-section">
        <div className="tdp-promo-contact-container">
          <div className="tdp-promo-contact-card">
            <div className="tdp-promo-header">
              <span className="tdp-promo-badge">დაგვიკავშირდით</span>
              <h2 className="tdp-promo-title">
                დაგეგმეთ თქვენი დაუვიწყარი მოგზაურობა ჩვენთან ერთად
              </h2>
              <p className="tdp-promo-subtitle">
                მოგვწერეთ ნებისმიერ დროს
              </p>
            </div>

            <div className="tdp-promo-contact-grid">
              {/* WhatsApp */}
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="tdp-social-box wa-box"
              >
                <div className="tdp-social-icon wa-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884zm8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                  </svg>
                </div>
                <div className="tdp-social-details">
                  <span className="tdp-social-name">WhatsApp</span>
                  <strong className="tdp-social-val">{PHONE_DISPLAY}</strong>
                </div>
                <span className="tdp-social-arrow">→</span>
              </a>

              {/* Telegram */}
              <a
                href={TELEGRAM_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="tdp-social-box tg-box"
              >
                <div className="tdp-social-icon tg-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.25.38-.51 1.07-.78 4.18-1.82 6.97-3.02 8.37-3.61 3.99-1.66 4.82-1.95 5.36-1.96.12 0 .38.03.55.17.14.12.18.28.2.45-.02.07-.02.16-.04.29z" />
                  </svg>
                </div>
                <div className="tdp-social-details">
                  <span className="tdp-social-name">Telegram</span>
                  <strong className="tdp-social-val">{TELEGRAM_HANDLE}</strong>
                </div>
                <span className="tdp-social-arrow">→</span>
              </a>

              {/* Instagram */}
              <a
                href={INSTAGRAM_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="tdp-social-box ig-box"
              >
                <div className="tdp-social-icon ig-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                  </svg>
                </div>
                <div className="tdp-social-details">
                  <span className="tdp-social-name">Instagram</span>
                  <strong className="tdp-social-val">{INSTAGRAM_HANDLE}</strong>
                </div>
                <span className="tdp-social-arrow">→</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FAQ SECTION ==================== */}
      <section className="section" id="faq" style={{ borderTop: "1px solid #e2e8f0", background: "#ffffff" }}>
        <div className="section-inner">
          <div className="section-header">
            <span className="section-eyebrow">ხშირად დასმული კითხვები</span>
            <h2 className="section-title">გაქვთ კითხვა? ჩვენ გვაქვს პასუხი</h2>
            <p className="section-desc">ყველაფერი, რაც მოგზაურობის დაგეგმვამდე უნდა იცოდეთ</p>
            <div className="gold-line"></div>
          </div>
          <div className="faq-list">
            {FAQS.map((faq, idx) => (
              <div key={idx} className={`faq-item ${openFaqIndex === idx ? "open" : ""}`}>
                <button
                  type="button"
                  className="faq-question"
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  aria-expanded={openFaqIndex === idx}
                  aria-controls={`faq-answer-${idx}`}
                >
                  <span>{faq.q}</span>
                  <svg className="faq-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                <div className="faq-answer" id={`faq-answer-${idx}`}>
                  <div className="faq-answer-inner">
                    <p>{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LIGHTBOX MODAL */}
      {lightboxImgIndex !== null && tour.gallery && (
        <div className="tdp-lightbox-overlay" onClick={closeLightbox}>
          <div className="tdp-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="lb-close" onClick={closeLightbox}>✕</button>
            <button type="button" className="lb-nav lb-prev" onClick={prevLightboxImg}>‹</button>
            <div className="lb-image-wrapper">
              <Image
                src={tour.gallery[lightboxImgIndex]}
                alt="ფოტოს გაფართოება"
                width={1200}
                height={800}
                style={{ objectFit: "contain", maxHeight: "85vh", width: "auto" }}
              />
            </div>
            <button type="button" className="lb-nav lb-next" onClick={nextLightboxImg}>›</button>
            <div className="lb-counter">
              {lightboxImgIndex + 1} / {tour.gallery.length}
            </div>
          </div>
        </div>
      )}

      {/* STICKY MOBILE FLOATING BOOKING BAR */}
      {showMobileStickyBtn && (
        <div className="tdp-mobile-floating-bar">
          <div className="mobile-floating-price">
            <small>ფასი / 1 პირი</small>
            <strong>{tour.priceGroup || tour.price || "₾70"}</strong>
          </div>
          <button
            type="button"
            className="btn-mobile-floating-book"
            onClick={scrollToBooking}
          >
            დაჯავშნა
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
}
