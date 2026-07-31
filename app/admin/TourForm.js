"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DatePicker from "../components/DatePicker";
import { DESTINATIONS } from "../lib/toursData";
import {
  TOUR_CATEGORIES,
  buildSchedule,
  createTour,
  saveTour,
  slugifyTitle,
} from "../lib/toursStore";
import { uploadToCloudinary } from "../lib/cloudinary";

const EMPTY_FORM = {
  title: "",
  desc: "",
  type: "oneday",
  duration: "",
  durationHours: "",
  destination: "batumi",
  location: "",
  category: "popular",
  badge: "",
  minPeople: "2",
  maxPeople: "16",
  hasGroup: true,
  priceGroupValue: "",
  hasPrivate: false,
  pricePrivateValue: "",
  hasVip: false,
  priceVipValue: "",
  itinerary: [{ title: "", desc: "", img: "" }],
  gallery: [],
  cover: "",
  departures: [],
};

const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2" />
  </svg>
);

/** Fills the form with an existing tour when editing. */
function tourToForm(tour) {
  if (!tour) return { ...EMPTY_FORM, itinerary: [{ title: "", desc: "", img: "" }] };
  return {
    title: tour.title || "",
    desc: tour.desc || "",
    type: tour.type || "oneday",
    duration: tour.duration || "",
    durationHours: tour.durationHours ? String(tour.durationHours) : "",
    destination: tour.destination || "batumi",
    location: String(tour.location || "").replace(/^📍\s*/, ""),
    category: tour.category || "popular",
    badge: tour.badge || "",
    minPeople: String(tour.minPeople || 1),
    maxPeople: String(tour.maxPeople || ""),
    hasGroup: !!tour.hasGroup,
    priceGroupValue: tour.priceGroupValue ? String(tour.priceGroupValue) : "",
    hasPrivate: !!tour.hasPrivate,
    pricePrivateValue: tour.pricePrivateValue ? String(tour.pricePrivateValue) : "",
    hasVip: !!tour.hasVip,
    priceVipValue: tour.priceVipValue ? String(tour.priceVipValue) : "",
    itinerary: tour.itinerary?.length ? tour.itinerary.map((s) => ({ ...s })) : [{ title: "", desc: "", img: "" }],
    gallery: tour.gallery || [],
    cover: tour.img || "",
    departures: (tour.departures || []).map((d) => ({ ...d })),
  };
}

export default function TourForm({ editing = null, onSaved, onCancelEdit }) {
  const [form, setForm] = useState(() => tourToForm(editing));
  const [newDate, setNewDate] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const topRef = useRef(null);

  useEffect(() => {
    setForm(tourToForm(editing));
    setStatus(null);
    if (editing) topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [editing]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  // ── Route stops ────────────────────────────────────────────
  const setStop = (index, key, value) =>
    setForm((f) => ({
      ...f,
      itinerary: f.itinerary.map((s, i) => (i === index ? { ...s, [key]: value } : s)),
    }));

  const addStop = () =>
    setForm((f) => ({ ...f, itinerary: [...f.itinerary, { title: "", desc: "", img: "" }] }));

  const removeStop = (index) =>
    setForm((f) => ({
      ...f,
      itinerary: f.itinerary.length > 1 ? f.itinerary.filter((_, i) => i !== index) : f.itinerary,
    }));

  // ── Cloudinary uploads ─────────────────────────────────────
  const handleGalleryUpload = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    setStatus(null);
    try {
      const urls = [];
      for (const file of Array.from(files)) {
        const { url } = await uploadToCloudinary(file, "georgiatrips/tours");
        urls.push(url);
      }
      setForm((f) => ({
        ...f,
        gallery: [...f.gallery, ...urls],
        cover: f.cover || urls[0] || "",
      }));
      setStatus({ type: "ok", text: `${urls.length} ფოტო აიტვირთა Cloudinary-ში.` });
    } catch (err) {
      setStatus({ type: "err", text: err.message || "ატვირთვა ვერ შესრულდა." });
    } finally {
      setUploading(false);
    }
  };

  const handleStopUpload = async (index, file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadToCloudinary(file, "georgiatrips/tours/stops");
      setStop(index, "img", url);
    } catch (err) {
      setStatus({ type: "err", text: err.message || "ატვირთვა ვერ შესრულდა." });
    } finally {
      setUploading(false);
    }
  };

  const removeGalleryImage = (url) =>
    setForm((f) => ({
      ...f,
      gallery: f.gallery.filter((u) => u !== url),
      cover: f.cover === url ? f.gallery.find((u) => u !== url) || "" : f.cover,
    }));

  // ── Departures (group tours only) ──────────────────────────
  const addDeparture = () => {
    if (!newDate) return;
    setForm((f) => {
      if (f.departures.some((d) => d.date === newDate)) return f;
      const seats = Number(f.maxPeople) || 10;
      const next = [...f.departures, { date: newDate, seats }].sort((a, b) => a.date.localeCompare(b.date));
      return { ...f, departures: next };
    });
    setNewDate("");
  };

  const setDepartureSeats = (date, seats) =>
    setForm((f) => ({
      ...f,
      departures: f.departures.map((d) => (d.date === date ? { ...d, seats } : d)),
    }));

  const removeDeparture = (date) =>
    setForm((f) => ({ ...f, departures: f.departures.filter((d) => d.date !== date) }));

  const schedulePreview = useMemo(() => buildSchedule(form.departures), [form.departures]);

  const formatIsoLabel = (iso) => {
    const d = new Date(`${iso}T00:00:00`);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("ka-GE", { day: "2-digit", month: "long", year: "numeric" });
  };

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setStatus({ type: "err", text: "ტურის სახელი აუცილებელია." });
      return;
    }
    if (!form.hasGroup && !form.hasPrivate && !form.hasVip) {
      setStatus({ type: "err", text: "მონიშნეთ მინიმუმ ერთი ფასის ტიპი (ჯგუფური / ინდივიდუალური / VIP)." });
      return;
    }
    if (form.hasGroup && form.departures.length === 0) {
      setStatus({ type: "err", text: "ჯგუფური ტურისთვის დაამატეთ მინიმუმ ერთი გამგზავრების თარიღი." });
      return;
    }

    setSaving(true);
    setStatus(null);

    const destinationLabel = DESTINATIONS.find((d) => d.value === form.destination)?.label || "";
    const payload = {
      slug: editing?.id || `${slugifyTitle(form.title)}-${Date.now().toString(36).slice(-4)}`,
      title: form.title.trim(),
      desc: form.desc.trim(),
      type: form.type,
      duration: form.duration.trim(),
      durationHours: Number(form.durationHours) || 0,
      destination: form.destination,
      destinationLabel,
      location: form.location.trim() || destinationLabel,
      category: form.category,
      badge: form.badge.trim(),
      minPeople: Number(form.minPeople) || 1,
      maxPeople: Number(form.maxPeople) || 0,
      hasGroup: form.hasGroup,
      priceGroupValue: form.hasGroup ? Number(form.priceGroupValue) || 0 : 0,
      hasPrivate: form.hasPrivate,
      pricePrivateValue: form.hasPrivate ? Number(form.pricePrivateValue) || 0 : 0,
      hasVip: form.hasVip,
      priceVipValue: form.hasVip ? Number(form.priceVipValue) || 0 : 0,
      itinerary: form.itinerary
        .filter((s) => s.title.trim())
        .map((s) => ({ title: s.title.trim(), desc: (s.desc || "").trim(), img: s.img || "" })),
      gallery: form.gallery,
      cover: form.cover || form.gallery[0] || "",
      departures: form.hasGroup
        ? form.departures.map((d) => ({ date: d.date, seats: Number(d.seats) || 0 }))
        : [],
    };

    try {
      if (editing?.docId) {
        await saveTour(editing.docId, payload);
        setStatus({ type: "ok", text: "ტური განახლდა." });
      } else {
        await createTour(payload);
        setStatus({ type: "ok", text: "ტური დაემატა და გამოჩნდა ტურების გვერდზე." });
        setForm(tourToForm(null));
      }
      onSaved?.();
    } catch (err) {
      setStatus({ type: "err", text: err.message || "შენახვა ვერ შესრულდა." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="adm-shell" onSubmit={handleSubmit} ref={topRef}>
      {/* 1. Basic info */}
      <section className="adm-card">
        <div className="adm-card-head">
          <span className="adm-step">1</span>
          <div>
            <h2>ძირითადი ინფორმაცია</h2>
            <span className="adm-hint">ტურის სახელი, აღწერა, ხანგრძლივობა და მიმართულება</span>
          </div>
        </div>
        <div className="adm-card-body">
          <div className="adm-field">
            <label htmlFor="tour-title">ტურის სახელი</label>
            <input
              id="tour-title"
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="მაგ: მთიანი აჭარის სრული ტური 1 დღეში"
              required
            />
          </div>

          <div className="adm-field">
            <label htmlFor="tour-desc">ექსკურსიის შესახებ</label>
            <textarea
              id="tour-desc"
              value={form.desc}
              onChange={(e) => set("desc", e.target.value)}
              placeholder="მოკლე მიმოხილვა: რას ნახავს მოგზაური, რა შედის ტურში..."
            />
          </div>

          <div className="adm-grid cols-2">
            <div className="adm-field">
              <label>ტურის ხანგრძლივობის ტიპი</label>
              <div className="adm-segment" role="radiogroup" aria-label="ერთდღიანი თუ მრავალდღიანი">
                <button
                  type="button"
                  role="radio"
                  aria-checked={form.type === "oneday"}
                  className={form.type === "oneday" ? "is-active" : ""}
                  onClick={() => set("type", "oneday")}
                >
                  ერთდღიანი
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={form.type === "multiday"}
                  className={form.type === "multiday" ? "is-active" : ""}
                  onClick={() => set("type", "multiday")}
                >
                  მრავალდღიანი
                </button>
              </div>
            </div>

            <div className="adm-field">
              <label htmlFor="tour-duration">ხანგრძლივობა</label>
              <input
                id="tour-duration"
                type="text"
                value={form.duration}
                onChange={(e) => set("duration", e.target.value)}
                placeholder={form.type === "oneday" ? "მაგ: 10 საათი" : "მაგ: 3 დღე / 2 ღამე"}
              />
              <small>ტექსტი, რომელიც ტურის ბარათზე გამოჩნდება</small>
            </div>
          </div>

          <div className="adm-grid cols-3">
            <div className="adm-field">
              <label htmlFor="tour-dest">მიმართულება</label>
              <select
                id="tour-dest"
                value={form.destination}
                onChange={(e) => set("destination", e.target.value)}
              >
                {DESTINATIONS.filter((d) => d.value !== "all").map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            <div className="adm-field">
              <label htmlFor="tour-location">გასვლის ადგილები</label>
              <input
                id="tour-location"
                type="text"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="მაგ: ბათუმი, ჩაქვი, ქობულეთი"
              />
            </div>

            <div className="adm-field">
              <label htmlFor="tour-hours">საათები (ფილტრისთვის)</label>
              <input
                id="tour-hours"
                type="number"
                min="0"
                value={form.durationHours}
                onChange={(e) => set("durationHours", e.target.value)}
                placeholder="მაგ: 10"
              />
            </div>
          </div>

          <div className="adm-grid cols-2">
            <div className="adm-field">
              <label htmlFor="tour-category">კატეგორია</label>
              <select
                id="tour-category"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
              >
                {TOUR_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="adm-field">
              <label htmlFor="tour-badge">ბეიჯი (არასავალდებულო)</label>
              <input
                id="tour-badge"
                type="text"
                value={form.badge}
                onChange={(e) => set("badge", e.target.value)}
                placeholder="მაგ: TOP პოპულარული"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Group size */}
      <section className="adm-card">
        <div className="adm-card-head">
          <span className="adm-step">2</span>
          <div>
            <h2>ადამიანების რაოდენობა ჯგუფში</h2>
            <span className="adm-hint">მინიმალური და მაქსიმალური რაოდენობა ერთ ჯგუფზე</span>
          </div>
        </div>
        <div className="adm-card-body">
          <div className="adm-grid cols-2">
            <div className="adm-field">
              <label htmlFor="min-people">მინიმალური რაოდენობა</label>
              <input
                id="min-people"
                type="number"
                min="1"
                value={form.minPeople}
                onChange={(e) => set("minPeople", e.target.value)}
              />
            </div>
            <div className="adm-field">
              <label htmlFor="max-people">მაქსიმალური რაოდენობა</label>
              <input
                id="max-people"
                type="number"
                min="1"
                value={form.maxPeople}
                onChange={(e) => set("maxPeople", e.target.value)}
              />
              <small>ახალი გამგზავრების თარიღს ავტომატურად მიენიჭება ეს რაოდენობა თავისუფალ ადგილებად</small>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Prices */}
      <section className="adm-card">
        <div className="adm-card-head">
          <span className="adm-step">3</span>
          <div>
            <h2>ფასები</h2>
            <span className="adm-hint">მონიშნეთ მხოლოდ ის ტიპები, რომლებიც ამ ტურისთვის მოქმედებს</span>
          </div>
        </div>
        <div className="adm-card-body">
          <div className="adm-tiers">
            <div className={`adm-tier${form.hasGroup ? " is-on" : ""}`} aria-disabled={!form.hasGroup}>
              <label className="adm-check">
                <input
                  type="checkbox"
                  checked={form.hasGroup}
                  onChange={(e) => set("hasGroup", e.target.checked)}
                />
                ჯგუფური ტური
              </label>
              <div className="adm-tier-price">
                <span className="adm-currency">₾</span>
                <input
                  className="adm-inline-input"
                  type="number"
                  min="0"
                  value={form.priceGroupValue}
                  onChange={(e) => set("priceGroupValue", e.target.value)}
                  disabled={!form.hasGroup}
                  placeholder="ფასი 1 კაცზე"
                  aria-label="ჯგუფური ფასი 1 კაცზე"
                />
              </div>
            </div>

            <div className={`adm-tier${form.hasPrivate ? " is-on" : ""}`} aria-disabled={!form.hasPrivate}>
              <label className="adm-check">
                <input
                  type="checkbox"
                  checked={form.hasPrivate}
                  onChange={(e) => set("hasPrivate", e.target.checked)}
                />
                ინდივიდუალური
              </label>
              <div className="adm-tier-price">
                <span className="adm-currency">₾</span>
                <input
                  className="adm-inline-input"
                  type="number"
                  min="0"
                  value={form.pricePrivateValue}
                  onChange={(e) => set("pricePrivateValue", e.target.value)}
                  disabled={!form.hasPrivate}
                  placeholder="ფასი ჯგუფზე"
                  aria-label="ინდივიდუალური ტურის ფასი"
                />
              </div>
            </div>

            <div className={`adm-tier vip${form.hasVip ? " is-on" : ""}`} aria-disabled={!form.hasVip}>
              <label className="adm-check">
                <input
                  type="checkbox"
                  checked={form.hasVip}
                  onChange={(e) => set("hasVip", e.target.checked)}
                />
                VIP ტური
              </label>
              <div className="adm-tier-price">
                <span className="adm-currency">₾</span>
                <input
                  className="adm-inline-input"
                  type="number"
                  min="0"
                  value={form.priceVipValue}
                  onChange={(e) => set("priceVipValue", e.target.value)}
                  disabled={!form.hasVip}
                  placeholder="VIP ფასი"
                  aria-label="VIP ტურის ფასი"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Route & stops */}
      <section className="adm-card">
        <div className="adm-card-head">
          <span className="adm-step">4</span>
          <div>
            <h2>მარშრუტი &amp; სანახავი ადგილები</h2>
            <span className="adm-hint">ჩაწერეთ ლოკაცია და დააჭირეთ + ღილაკს შემდეგი ლოკაციის დასამატებლად</span>
          </div>
        </div>
        <div className="adm-card-body">
          <div className="adm-rows">
            {form.itinerary.map((stop, index) => (
              <div className="adm-row" key={index}>
                <div className="adm-row-top">
                  <span className="adm-row-index">{index + 1}</span>
                  <input
                    type="text"
                    className="adm-inline-input"
                    value={stop.title}
                    onChange={(e) => setStop(index, "title", e.target.value)}
                    placeholder="ლოკაციის დასახელება — მაგ: მახუნცეთის ჩანჩქერი"
                    aria-label={`ლოკაცია ${index + 1}`}
                  />
                  {index === form.itinerary.length - 1 && (
                    <button
                      type="button"
                      className="adm-icon-btn add"
                      onClick={addStop}
                      title="შემდეგი ლოკაციის დამატება"
                      aria-label="შემდეგი ლოკაციის დამატება"
                    >
                      <PlusIcon />
                    </button>
                  )}
                  {form.itinerary.length > 1 && (
                    <button
                      type="button"
                      className="adm-icon-btn danger"
                      onClick={() => removeStop(index)}
                      title="ლოკაციის წაშლა"
                      aria-label={`ლოკაცია ${index + 1} — წაშლა`}
                    >
                      <TrashIcon />
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  className="adm-inline-input"
                  value={stop.desc || ""}
                  onChange={(e) => setStop(index, "desc", e.target.value)}
                  placeholder="დეტალები, რომელიც კურსორის მიტანისას გამოჩნდება"
                  aria-label={`ლოკაცია ${index + 1} — დეტალები`}
                />

                <div className="adm-row-media">
                  {stop.img ? (
                    <img className="adm-thumb" src={stop.img || "/placeholder.svg"} alt="" />
                  ) : (
                    <span className="adm-thumb" aria-hidden="true" />
                  )}
                  <label className="adm-upload">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleStopUpload(index, e.target.files?.[0])}
                    />
                    {stop.img ? "ფოტოს შეცვლა" : "ლოკაციის ფოტო"}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Gallery */}
      <section className="adm-card">
        <div className="adm-card-head">
          <span className="adm-step">5</span>
          <div>
            <h2>ფოტოგალერეა</h2>
            <span className="adm-hint">ფოტოები ინახება Cloudinary-ში და აქედან ჩაიტვირთება საიტზე</span>
          </div>
        </div>
        <div className="adm-card-body">
          <label className="adm-upload" style={{ alignSelf: "flex-start" }}>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleGalleryUpload(e.target.files)}
            />
            {uploading ? "იტვირთება..." : "ფოტოების ატვირთვა"}
          </label>

          {form.gallery.length > 0 ? (
            <div className="adm-gallery">
              {form.gallery.map((url) => (
                <div key={url} className={`adm-gallery-item${form.cover === url ? " is-cover" : ""}`}>
                  <img src={url || "/placeholder.svg"} alt="ტურის ფოტო" />
                  {form.cover === url && <span className="adm-cover-flag">მთავარი</span>}
                  <div className="adm-gallery-actions">
                    <button type="button" className="adm-mini-btn" onClick={() => set("cover", url)}>
                      მთავარი
                    </button>
                    <button type="button" className="adm-mini-btn danger" onClick={() => removeGalleryImage(url)}>
                      წაშლა
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="adm-empty">ჯერ არ არის ატვირთული ფოტოები.</p>
          )}
        </div>
      </section>

      {/* 6. Departures — group tours only */}
      {form.hasGroup && (
        <section className="adm-card">
          <div className="adm-card-head">
            <span className="adm-step">6</span>
            <div>
              <h2>გამგზავრების თარიღები &amp; თავისუფალი ადგილები</h2>
              <span className="adm-hint">მხოლოდ ჯგუფური ტურისთვის — მიუთითეთ თითოეულ თარიღზე თავისუფალი ადგილები</span>
            </div>
          </div>
          <div className="adm-card-body">
            <div className="adm-date-adder">
              <div className="adm-field">
                <label>აირჩიეთ გამგზავრების თარიღი</label>
                <DatePicker
                  value={newDate}
                  onChange={(d) => setNewDate(d)}
                  placeholder="აირჩიეთ თარიღი"
                  direction="down"
                />
              </div>
              <button
                type="button"
                className="adm-btn ghost"
                onClick={addDeparture}
                disabled={!newDate}
              >
                <PlusIcon /> თარიღის დამატება
              </button>
            </div>

            {form.departures.length > 0 && (
              <div className="adm-dep-list">
                {form.departures.map((dep) => (
                  <div className="adm-dep" key={dep.date}>
                    <span className="adm-dep-date">{formatIsoLabel(dep.date)}</span>
                    <div className="adm-dep-seats">
                      <label htmlFor={`seats-${dep.date}`}>თავისუფალი ადგილები</label>
                      <input
                        id={`seats-${dep.date}`}
                        type="number"
                        min="0"
                        value={dep.seats}
                        onChange={(e) => setDepartureSeats(dep.date, e.target.value)}
                      />
                      <button
                        type="button"
                        className="adm-icon-btn danger"
                        onClick={() => removeDeparture(dep.date)}
                        aria-label={`${dep.date} — წაშლა`}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {schedulePreview.length > 0 && (
              <div className="adm-preview">
                <h3>ამ ტურის განრიგი &amp; თავისუფალი დღეები</h3>
                {schedulePreview.map((month) => (
                  <div className="adm-preview-month" key={month.monthName}>
                    <span className="adm-month-pill">{month.monthName}</span>
                    <div className="adm-chips">
                      {month.dates.map((chip) => {
                        const seats = month.seats[chip] ?? 0;
                        return (
                          <span key={chip} className={`adm-chip${seats <= 0 ? " is-full" : ""}`}>
                            {chip} <b>{seats > 0 ? `${seats} ადგილი` : "ადგილები ამოიწურა"}</b>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Actions */}
      <div className="adm-actions">
        <button type="submit" className="adm-btn primary" disabled={saving || uploading}>
          {saving ? "ინახება..." : editing ? "ცვლილებების შენახვა" : "ტურის დამატება"}
        </button>
        {editing && (
          <button type="button" className="adm-btn ghost" onClick={() => onCancelEdit?.()}>
            რედაქტირების გაუქმება
          </button>
        )}
        {status && (
          <p className={`adm-status ${status.type === "ok" ? "ok" : "err"}`} role="status">
            {status.text}
          </p>
        )}
      </div>
    </form>
  );
}
