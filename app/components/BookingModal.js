"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { WA_LINK } from "../lib/shared";

// Detailed tour booking modal. Opens when a tour card's "დაჯავშნა" button is
// clicked. Collects contact + trip details, shows a live price summary, then
// hands the request off to WhatsApp with a fully formatted message.
export default function BookingModal({ tour, onClose }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    people: "",
    date: "",
    notes: "",
  });
  const [sent, setSent] = useState(false);
  const dialogRef = useRef(null);
  const firstFieldRef = useRef(null);

  const today = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // earliest bookable date = tomorrow
    return d.toISOString().split("T")[0];
  }, []);

  // Lock body scroll while open + focus first field.
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => firstFieldRef.current?.focus(), 60);
    return () => {
      document.body.style.overflow = "";
      clearTimeout(t);
    };
  }, []);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const peopleCount = Math.max(parseInt(form.people, 10) || 0, 0);
  const total = peopleCount > 0 ? peopleCount * tour.price : 0;

  const setField = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const dateLabel = form.date
    ? new Date(`${form.date}T00:00:00`).toLocaleDateString("ka-GE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  const handleSubmit = (e) => {
    e.preventDefault();
    const lines = [
      "გამარჯობა! მინდა დავაჯავშნო ტური 🏔️",
      "",
      `🗺️ ტური: ${tour.title}`,
      `📍 რეგიონი: ${tour.region}`,
      `⏱️ ხანგრძლივობა: ${tour.days === 1 ? "ერთდღიანი" : `${tour.days} დღე`}`,
      "",
      `👤 სახელი: ${form.name}`,
      `📞 ტელეფონი: ${form.phone}`,
      form.email ? `✉️ Email: ${form.email}` : null,
      `👥 ადამიანების რაოდენობა: ${peopleCount}`,
      `📅 სასურველი თარიღი: ${dateLabel}`,
      form.notes ? `📝 დამატებითი: ${form.notes}` : null,
      "",
      `💰 სავარაუდო ჯამი: ₾${total || tour.price}`,
    ].filter(Boolean);

    window.open(
      `${WA_LINK}?text=${encodeURIComponent(lines.join("\n"))}`,
      "_blank",
      "noopener,noreferrer"
    );
    setSent(true);
  };

  return (
    <div
      className="bm-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bm-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`დაჯავშნა — ${tour.title}`}
        ref={dialogRef}
      >
        <button className="bm-close" onClick={onClose} aria-label="დახურვა">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {/* Tour summary header */}
        <div className="bm-head">
          <div className="bm-thumb">
            <Image src={tour.img || "/placeholder.svg"} alt={tour.title} fill sizes="96px" />
          </div>
          <div className="bm-head-info">
            <span className={`bm-type ${tour.type}`}>
              {tour.type === "individual" ? "ინდივიდუალური" : "ჯგუფური"}
            </span>
            <h3 className="bm-title">{tour.title}</h3>
            <div className="bm-head-meta">
              <span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                {tour.region}
              </span>
              <span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                {tour.days === 1 ? "ერთდღიანი" : `${tour.days} დღე`}
              </span>
            </div>
          </div>
        </div>

        {sent ? (
          <div className="bm-success">
            <div className="bm-success-icon" aria-hidden="true">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h4>მოთხოვნა გაიგზავნა!</h4>
            <p>
              გადამისამართდით <strong>WhatsApp</strong>-ზე. თუ ფანჯარა არ გაიხსნა,
              დაგვიკავშირდით პირდაპირ და ჩვენ 24 საათში დაგიდასტურებთ ჯავშანს.
            </p>
            <button className="bm-submit" onClick={onClose}>
              დახურვა
            </button>
          </div>
        ) : (
          <form className="bm-form" onSubmit={handleSubmit}>
            <div className="bm-field">
              <label htmlFor="bm-name">სახელი და გვარი *</label>
              <input id="bm-name" ref={firstFieldRef} type="text" required value={form.name} onChange={setField("name")} placeholder="თქვენი სახელი" />
            </div>

            <div className="bm-row">
              <div className="bm-field">
                <label htmlFor="bm-phone">ტელეფონი *</label>
                <input id="bm-phone" type="tel" required value={form.phone} onChange={setField("phone")} placeholder="+995 5xx xx xx xx" />
              </div>
              <div className="bm-field">
                <label htmlFor="bm-email">Email</label>
                <input id="bm-email" type="email" value={form.email} onChange={setField("email")} placeholder="your@email.com" />
              </div>
            </div>

            <div className="bm-row">
              <div className="bm-field">
                <label htmlFor="bm-people">ადამიანების რაოდენობა *</label>
                <input id="bm-people" type="number" required min="1" max="50" value={form.people} onChange={setField("people")} placeholder="მაგ. 2" />
              </div>
              <div className="bm-field">
                <label htmlFor="bm-date">სასურველი თარიღი *</label>
                <input id="bm-date" type="date" required min={today} value={form.date} onChange={setField("date")} />
              </div>
            </div>

            <div className="bm-field">
              <label htmlFor="bm-notes">დამატებითი მოთხოვნები</label>
              <textarea id="bm-notes" rows={2} value={form.notes} onChange={setField("notes")} placeholder="კვების შეზღუდვები, სპეც. მოთხოვნები და ა.შ." />
            </div>

            {/* Live price summary */}
            <div className="bm-summary">
              <div className="bm-summary-row">
                <span>ფასი ადამიანზე</span>
                <strong>₾{tour.price}</strong>
              </div>
              <div className="bm-summary-row">
                <span>ადამიანების რაოდენობა</span>
                <strong>{peopleCount || "—"}</strong>
              </div>
              <div className="bm-summary-divider" />
              <div className="bm-summary-row bm-summary-total">
                <span>სავარაუდო ჯამი</span>
                <strong>₾{total || tour.price}</strong>
              </div>
            </div>

            <button type="submit" className="bm-submit">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12.003 2C6.477 2 2 6.477 2 12c0 1.989.574 3.842 1.563 5.406L2 22l4.682-1.528A9.956 9.956 0 0012.003 22C17.529 22 22 17.523 22 12S17.529 2 12.003 2zm0 18c-1.676 0-3.26-.455-4.627-1.247l-.331-.198-3.454 1.128 1.156-3.366-.215-.348A7.957 7.957 0 014.003 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z" />
              </svg>
              ჯავშნის გაგზავნა
            </button>
            <p className="bm-note">
              ჯავშნის დადასტურებას მიიღებთ WhatsApp-ზე ან Telegram-ზე 24 საათის განმავლობაში.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
