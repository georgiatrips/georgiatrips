"use client";
import React, { useState, useEffect, useRef } from "react";

const GEO_MONTHS = [
  "იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი",
  "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"
];
const GEO_DAYS_SHORT = ["ორ", "სამ", "ოთ", "ხუთ", "პარ", "შაბ", "კვ"];

export default function DatePicker({
  value,
  onChange,
  placeholder = "თარიღი",
  direction = "down",
  availableDates = null,
  variant = "form"
}) {
  const today = new Date();
  const [selected, setSelected] = useState(value ? new Date(value) : null);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (value) {
      if (typeof value === "string" && value.includes("-")) {
        const parts = value.split("-");
        if (parts.length === 3) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          const d = parseInt(parts[2], 10);
          const dateObj = new Date(y, m, d);
          if (!isNaN(dateObj.getTime())) {
            setSelected(dateObj);
            setViewYear(y);
            setViewMonth(m);
          }
        }
      } else {
        const parsed = new Date(value);
        if (!isNaN(parsed.getTime())) {
          setSelected(parsed);
          setViewYear(parsed.getFullYear());
          setViewMonth(parsed.getMonth());
        }
      }
    } else {
      setSelected(null);
    }
  }, [value]);

  // Close on click outside
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  
  const firstDayOfMonth = (y, m) => {
    const d = new Date(y, m, 1).getDay();
    return d === 0 ? 6 : d - 1;
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(v => v - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(v => v + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const selectDay = (dayObj) => {
    const d = new Date(dayObj.year, dayObj.month, dayObj.day);
    setSelected(d);
    const mm = String(dayObj.month + 1).padStart(2, "0");
    const dd = String(dayObj.day).padStart(2, "0");
    const formatted = `${dayObj.year}-${mm}-${dd}`;
    if (onChange) onChange(formatted);
    setOpen(false);
  };

  const isToday = (dayObj) =>
    today.getDate() === dayObj.day && 
    today.getMonth() === dayObj.month && 
    today.getFullYear() === dayObj.year;

  const isSelected = (dayObj) =>
    selected && 
    selected.getDate() === dayObj.day && 
    selected.getMonth() === dayObj.month && 
    selected.getFullYear() === dayObj.year;

  const isPast = (dayObj) => {
    const d = new Date(dayObj.year, dayObj.month, dayObj.day);
    d.setHours(0, 0, 0, 0);
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return d <= t;
  };

  // Check if a day is in availableDates (format "MM.DD")
  const isAvailable = (dayObj) => {
    if (!availableDates || availableDates.length === 0) return true;
    const mm = String(dayObj.month + 1).padStart(2, "0");
    const dd = String(dayObj.day).padStart(2, "0");
    const iso = `${dayObj.year}-${mm}-${dd}`;
    return availableDates.includes(iso) || availableDates.includes(`${mm}.${dd}`);
  };

  const isDisabled = (dayObj) => !isAvailable(dayObj) || isPast(dayObj);

  const displayValue = selected
    ? variant === "hero"
      ? `${selected.getDate()} ${GEO_MONTHS[selected.getMonth()]}`
      : `${selected.getDate()} ${GEO_MONTHS[selected.getMonth()]} ${selected.getFullYear()}`
    : placeholder;

  const getCalendarCells = () => {
    const cells = [];
    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;

    const daysInPrev = daysInMonth(prevYear, prevMonth);
    const daysInCurr = daysInMonth(viewYear, viewMonth);
    const offset = firstDayOfMonth(viewYear, viewMonth);

    // Prev month adjacent days
    for (let i = offset - 1; i >= 0; i--) {
      cells.push({
        day: daysInPrev - i,
        isCurrentMonth: false,
        month: prevMonth,
        year: prevYear
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurr; d++) {
      cells.push({
        day: d,
        isCurrentMonth: true,
        month: viewMonth,
        year: viewYear
      });
    }

    // Next month adjacent days
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      cells.push({
        day: d,
        isCurrentMonth: false,
        month: nextMonth,
        year: nextYear
      });
    }

    return cells;
  };

  const cells = getCalendarCells();

  return (
    <div className={`dp-wrap dp-wrap--${variant}`} ref={wrapRef}>
      <button
        type="button"
        className={`dp-trigger dp-trigger--${variant} ${open ? "dp-trigger--open" : ""}`}
        onClick={() => setOpen(o => !o)}
        aria-label="კალენდრის გახსნა"
      >
        <span className={`dp-icon-shell dp-icon-shell--${variant}`} aria-hidden="true">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`dp-icon dp-icon--${variant}`}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </span>
        <span className={`dp-trigger-value${!selected ? " dp-trigger-value--placeholder" : ""}`}>{displayValue}</span>
        <svg className={`dp-chevron dp-chevron--${variant}`} width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className={`dp-popover dp-popover--${variant} ${direction === "up" ? "dp-popover--up" : ""}`}>
          {/* Header */}
          <div className="dp-header">
            <button type="button" className="dp-nav-btn" onClick={prevMonth} aria-label="წინა თვე">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <span className="dp-month-label">{GEO_MONTHS[viewMonth]} {viewYear}</span>
            <button type="button" className="dp-nav-btn" onClick={nextMonth} aria-label="შემდეგი თვე">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>

          {/* Weekday labels */}
          <div className="dp-weekdays">
            {GEO_DAYS_SHORT.map(d => (
              <span key={d} className="dp-weekday">{d}</span>
            ))}
          </div>

          {/* Days grid */}
          <div className="dp-grid">
            {cells.map((cell, idx) => (
              <button
                key={idx}
                type="button"
                className={[
                  "dp-day",
                  !cell.isCurrentMonth ? "dp-day--outside" : "",
                  isToday(cell) ? "dp-day--today" : "",
                  isSelected(cell) ? "dp-day--selected" : "",
                  isDisabled(cell) ? "dp-day--past" : "",
                  cell.isCurrentMonth && !isDisabled(cell) ? "dp-day--available" : "",
                ].filter(Boolean).join(" ")}
                onClick={() => !isDisabled(cell) && selectDay(cell)}
                disabled={isDisabled(cell)}
                aria-label={`${cell.day} ${GEO_MONTHS[cell.month]} ${cell.year}`}
              >
                {cell.day}
              </button>
            ))}
          </div>

          {/* Footer actions */}
          <div className="dp-footer">
            <button type="button" className="dp-today-btn" onClick={() => {
              const tObj = { day: today.getDate(), month: today.getMonth(), year: today.getFullYear() };
              setViewYear(tObj.year);
              setViewMonth(tObj.month);
              // Only select today if it is an available (free) date and not disabled
              if (!isDisabled(tObj)) {
                selectDay(tObj);
              }
            }}>
              დღეს
            </button>
            <button type="button" className="dp-clear-btn" onClick={() => {
              setSelected(null);
              if (onChange) onChange("");
              setOpen(false);
            }}>
              გასუფთავება
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
