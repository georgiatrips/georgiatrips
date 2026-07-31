"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { createTour, listTours, deleteTour } from "../lib/firestore";
import "./admin.css";

const GEO_MONTHS = [
  "იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი",
  "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი",
];

const DESTINATIONS = [
  { value: "batumi", label: "ბათუმი / აჭარა" },
  { value: "tbilisi", label: "თბილისი" },
  { value: "kazbegi", label: "ყაზბეგი" },
  { value: "gudauri", label: "გუდაური" },
  { value: "kakheti", label: "კახეთი" },
  { value: "svaneti", label: "სვანეთი" },
  { value: "imereti", label: "იმერეთი / ქუთაისი" },
  { value: "samegrelo", label: "სამეგრელო" },
  { value: "borjomi", label: "ბორჯომი / სამცხე" },
  { value: "other", label: "სხვა მიმართულება" },
];

const emptyLocation = () => ({ name: "", note: "", img: "" });

// "2026-08-14" → { day: "14", monthIndex: 7, label: "14 აგვისტო" }
function parseISO(iso) {
  const [y, m, d] = (iso || "").split("-");
  const monthIndex = parseInt(m, 10) - 1;
  return {
    year: y,
    day: d,
    monthIndex,
    monthName: GEO_MONTHS[monthIndex] || "",
    label: `${parseInt(d, 10)} ${GEO_MONTHS[monthIndex] || ""}`,
  };
}

function slugify(text) {
  const map = {
    ა: "a", ბ: "b", გ: "g", დ: "d", ე: "e", ვ: "v", ზ: "z", თ: "t", ი: "i", კ: "k",
    ლ: "l", მ: "m", ნ: "n", ო: "o", პ: "p", ჟ: "zh", რ: "r", ს: "s", ტ: "t", უ: "u",
    ფ: "f", ქ: "q", ღ: "gh", ყ: "y", შ: "sh", ჩ: "ch", ც: "ts", ძ: "dz", წ: "w",
    ჭ: "ch", ხ: "kh", ჯ: "j", ჰ: "h",
  };
  const latin = text
    .toLowerCase()
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("");
  return (
    latin
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || `tour-${Date.now()}`
  );
}

export default function AdminPage() {
  // ── Basic info ─────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [about, setAbout] = useState("");
  const [tourType, setTourType] = useState("oneday");
  const [duration, setDuration] = useState("");
  const [destination, setDestination] = useState("batumi");
  const [departure, setDeparture] = useState("");
  const [minPeople, setMinPeople] = useState("2");
  const [maxPeople, setMaxPeople] = useState("16");

  // ── Pricing options (each independent) ─────────────────────
  const [hasGroup, setHasGroup] = useState(true);
  const [priceGroup, setPriceGroup] = useState("");
  const [hasPrivate, setHasPrivate] = useState(false);
  const [pricePrivate, setPricePrivate] = useState("");
  const [hasVip, setHasVip] = useState(false);
  const [priceVip, setPriceVip] = useState("");
  const [vipNote, setVipNote] = useState("");

  // ── Route ──────────────────────────────────────────────────
  const [locations, setLocations] = useState([emptyLocation()]);

  // ── Gallery ────────────────────────────────────────────────
  const [gallery, setGallery] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  // ── Group departure dates ──────────────────────────────────
  const [dateInput, setDateInput] = useState("");
  const [schedule, setSchedule] = useState([]); // [{ iso, seats, booked }]
  const [activeDate, setActiveDate] = useState("");

  // ── Saved tours ────────────────────────────────────────────
  const [saved, setSaved] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const rows = await listTours();
        if (mounted) setSaved(rows);
      } catch {
        if (mounted) setMessage({ type: "err", text: "ტურების ჩატვირთვა ვერ მოხერხდა" });
      } finally {
        if (mounted) setLoadingList(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Group toggle off → departure dates are irrelevant
  useEffect(() => {
    if (!hasGroup) {
      setSchedule([]);
      setActiveDate("");
      setDateInput("");
    }
  }, [hasGroup]);

  const maxSeats = Math.max(1, parseInt(maxPeople, 10) || 1);

  // ── Locations ──────────────────────────────────────────────
  const updateLocation = (index, key, value) =>
    setLocations((prev) => prev.map((l, i) => (i === index ? { ...l, [key]: value } : l)));

  const addLocation = (index) =>
    setLocations((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, emptyLocation());
      return next;
    });

  const removeLocation = (index) =>
    setLocations((prev) => (prev.length === 1 ? [emptyLocation()] : prev.filter((_, i) => i !== index)));

  // ── Cloudinary uploads ─────────────────────────────────────
  async function uploadFile(file) {
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "ატვირთვა ვერ მოხერხდა");
    return json;
  }

  async function handleGalleryFiles(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setMessage(null);
    try {
      for (const file of files) {
        const res = await uploadFile(file);
        setGallery((prev) => [...prev, { url: res.url, publicId: res.publicId }]);
      }
    } catch (err) {
      setMessage({ type: "err", text: err.message });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleLocationFile(index, event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadFile(file);
      updateLocation(index, "img", res.url);
    } catch (err) {
      setMessage({ type: "err", text: err.message });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  // ── Dates ──────────────────────────────────────────────────
  function addDate() {
    if (!dateInput) return;
    if (schedule.some((s) => s.iso === dateInput)) {
      setActiveDate(dateInput);
      setDateInput("");
      return;
    }
    setSchedule((prev) =>
      [...prev, { iso: dateInput, seats: maxSeats, booked: 0 }].sort((a, b) => a.iso.localeCompare(b.iso))
    );
    setActiveDate(dateInput);
    setDateInput("");
  }

  function removeDate(iso) {
    setSchedule((prev) => prev.filter((s) => s.iso !== iso));
    setActiveDate((prev) => (prev === iso ? "" : prev));
  }

  function updateDate(iso, key, value) {
    setSchedule((prev) =>
      prev.map((s) => (s.iso === iso ? { ...s, [key]: Math.max(0, parseInt(value, 10) || 0) } : s))
    );
  }

  const monthGroups = useMemo(() => {
    const groups = new Map();
    for (const slot of schedule) {
      const { monthIndex, monthName } = parseISO(slot.iso);
      if (!groups.has(monthIndex)) groups.set(monthIndex, { monthName, slots: [] });
      groups.get(monthIndex).slots.push(slot);
    }
    return Array.from(groups.entries()).sort((a, b) => a[0] - b[0]).map(([, g]) => g);
  }, [schedule]);

  const activeSlot = schedule.find((s) => s.iso === activeDate) || null;
  const activeFree = activeSlot ? Math.max(0, activeSlot.seats - activeSlot.booked) : 0;

  // ── Submit ─────────────────────────────────────────────────
  function validate() {
    if (!title.trim()) return "შეავსეთ ტურის სახელი";
    if (!about.trim()) return "შეავსეთ ექსკურსიის აღწერა";
    if (!duration.trim()) return "მიუთითეთ ხანგრძლივობა";
    if (!hasGroup && !hasPrivate && !hasVip) return "აირჩიეთ მინიმუმ ერთი ტურის ტიპი (ჯგუფური / ინდივიდუალური / VIP)";
    if (hasGroup && !priceGroup.trim()) return "შეავსეთ ჯგუფური ტურის ფასი";
    if (hasPrivate && !pricePrivate.trim()) return "შეავსეთ ინდივიდუალური ტურის ფასი";
    if (hasVip && !priceVip.trim()) return "შეავსეთ VIP ტურის ფასი";
    if (!locations.some((l) => l.name.trim())) return "დაამატეთ მინიმუმ ერთი ლოკაცია";
    const min = parseInt(minPeople, 10) || 0;
    const max = parseInt(maxPeople, 10) || 0;
    if (min < 1 || max < min) return "ჯგუფში ადამიანების რაოდენობა არასწორია";
    if (hasGroup && schedule.length === 0) return "ჯგუფური ტურისთვის აირჩიეთ გამგზავრების თარიღები";
    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const error = validate();
    if (error) {
      setMessage({ type: "err", text: error });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const destLabel = DESTINATIONS.find((d) => d.value === destination)?.label || "";
    const cleanLocations = locations
      .filter((l) => l.name.trim())
      .map((l) => ({ title: l.name.trim(), desc: l.note.trim(), img: l.img || gallery[0]?.url || "" }));

    const payload = {
      id: slugify(title),
      title: title.trim(),
      desc: about.trim(),
      duration: duration.trim(),
      type: tourType,
      typeLabel: tourType === "oneday" ? "ერთდღიანი" : "მრავალდღიანი",
      destination,
      destinationLabel: destLabel,
      location: departure.trim() ? `📍 ${departure.trim()}` : `📍 ${destLabel}`,
      departure: departure.trim(),
      minPeople: parseInt(minPeople, 10),
      maxPeople: maxSeats,
      hasGroup,
      hasPrivate,
      hasVip,
      priceGroup: hasGroup ? priceGroup.trim() : "",
      pricePrivate: hasPrivate ? pricePrivate.trim() : "",
      priceVip: hasVip ? priceVip.trim() : "",
      vipNote: hasVip ? vipNote.trim() : "",
      itinerary: cleanLocations,
      gallery: gallery.map((g) => g.url),
      galleryMeta: gallery,
      img: gallery[0]?.url || cleanLocations[0]?.img || "",
      schedule: hasGroup
        ? schedule.map((s) => ({ date: s.iso, seats: s.seats, booked: s.booked, free: Math.max(0, s.seats - s.booked) }))
        : [],
      dates: hasGroup
        ? schedule.map((s) => {
            const [, mm, dd] = s.iso.split("-");
            return `${mm}.${dd}`;
          })
        : [],
      published: true,
    };

    setSaving(true);
    setMessage(null);
    try {
      const docId = await createTour(payload);
      setSaved((prev) => [{ docId, ...payload }, ...prev]);
      setMessage({ type: "ok", text: "ტური წარმატებით დაემატა" });
      resetForm();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setMessage({ type: "err", text: `შენახვა ვერ მოხერხდა: ${err.message}` });
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setTitle("");
    setAbout("");
    setTourType("oneday");
    setDuration("");
    setDestination("batumi");
    setDeparture("");
    setMinPeople("2");
    setMaxPeople("16");
    setHasGroup(true);
    setPriceGroup("");
    setHasPrivate(false);
    setPricePrivate("");
    setHasVip(false);
    setPriceVip("");
    setVipNote("");
    setLocations([emptyLocation()]);
    setGallery([]);
    setSchedule([]);
    setActiveDate("");
    setDateInput("");
  }

  async function handleDelete(docId) {
    if (!window.confirm("ნამდვილად გსურთ ამ ტურის წაშლა?")) return;
    try {
      await deleteTour(docId);
      setSaved((prev) => prev.filter((t) => t.docId !== docId));
    } catch (err) {
      setMessage({ type: "err", text: `წაშლა ვერ მოხერხდა: ${err.message}` });
    }
  }

  return (
    <>
      <Navbar active="admin" />

      <main className="adm-wrap">
        <header className="adm-head">
          <div>
            <h1>ადმინის პანელი</h1>
            <p>ტურების დამატება, ფოტოგალერეა და ჯგუფური გამგზავრების განრიგის მართვა.</p>
          </div>
          <span className="adm-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2 4 6v6c0 5 3.4 9.3 8 10 4.6-.7 8-5 8-10V6l-8-4z" />
            </svg>
            შენახული ტურები: {saved.length}
          </span>
        </header>

        {message && <div className={`adm-alert ${message.type}`} role="status">{message.text}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {/* ── Basic info ─────────────────────────────────── */}
          <section className="adm-card">
            <h2>ტურის ძირითადი ინფორმაცია</h2>
            <p className="adm-hint">ტურის სახელი და ექსკურსიის აღწერა გამოჩნდება ტურის გვერდზე.</p>

            <div className="adm-grid">
              <div className="adm-field full">
                <label htmlFor="t-title">ტურის სახელი</label>
                <input id="t-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="მაგ. პრომეთეს მღვიმე & მარტვილის კანიონი" />
              </div>

              <div className="adm-field full">
                <label htmlFor="t-about">ექსკურსიის შესახებ</label>
                <textarea id="t-about" value={about} onChange={(e) => setAbout(e.target.value)} placeholder="მოკლედ აღწერეთ რას ნახავს მოგზაური ამ ექსკურსიაზე..." />
              </div>

              <div className="adm-field full">
                <label>ერთდღიანი თუ მრავალდღიანი</label>
                <div className="adm-seg">
                  <button type="button" className={tourType === "oneday" ? "on" : ""} onClick={() => setTourType("oneday")}>ერთდღიანი</button>
                  <button type="button" className={tourType === "multiday" ? "on" : ""} onClick={() => setTourType("multiday")}>მრავალდღიანი</button>
                </div>
              </div>

              <div className="adm-field">
                <label htmlFor="t-duration">ხანგრძლივობა</label>
                <input id="t-duration" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder={tourType === "oneday" ? "მაგ. 10 საათი" : "მაგ. 3 დღე / 2 ღამე"} />
              </div>

              <div className="adm-field">
                <label htmlFor="t-dest">მიმართულება</label>
                <select id="t-dest" value={destination} onChange={(e) => setDestination(e.target.value)}>
                  {DESTINATIONS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div className="adm-field full">
                <label htmlFor="t-departure">გამგზავრების ქალაქები (არასავალდებულო)</label>
                <input id="t-departure" value={departure} onChange={(e) => setDeparture(e.target.value)} placeholder="მაგ. ბათუმი, ჩაქვი, ქობულეთი" />
              </div>

              <div className="adm-field">
                <label htmlFor="t-min">ჯგუფში ადამიანების მინიმალური რაოდენობა</label>
                <input id="t-min" type="number" min="1" value={minPeople} onChange={(e) => setMinPeople(e.target.value)} />
              </div>

              <div className="adm-field">
                <label htmlFor="t-max">ჯგუფში ადამიანების მაქსიმალური რაოდენობა</label>
                <input id="t-max" type="number" min="1" value={maxPeople} onChange={(e) => setMaxPeople(e.target.value)} />
              </div>
            </div>
          </section>

          {/* ── Pricing ────────────────────────────────────── */}
          <section className="adm-card">
            <h2>ფასები & ტურის ტიპები</h2>
            <p className="adm-hint">მონიშნეთ მხოლოდ ის ტიპები, რომლებიც ხელმისაწვდომია — შეიძლება მხოლოდ ერთი იყოს (მაგ. მხოლოდ ჯგუფური).</p>

            <div className="adm-price-list">
              <div className={`adm-price-row ${hasGroup ? "on" : ""}`}>
                <label className="adm-check">
                  <input type="checkbox" checked={hasGroup} onChange={(e) => setHasGroup(e.target.checked)} />
                  ჯგუფური ტური
                </label>
                {hasGroup && (
                  <div className="adm-price-inputs">
                    <div className="adm-field">
                      <label htmlFor="p-group">ფასი ჯგუფური</label>
                      <input id="p-group" value={priceGroup} onChange={(e) => setPriceGroup(e.target.value)} placeholder="მაგ. ₾100/კაცი" />
                    </div>
                  </div>
                )}
              </div>

              <div className={`adm-price-row ${hasPrivate ? "on" : ""}`}>
                <label className="adm-check">
                  <input type="checkbox" checked={hasPrivate} onChange={(e) => setHasPrivate(e.target.checked)} />
                  ინდივიდუალური ტური
                </label>
                {hasPrivate && (
                  <div className="adm-price-inputs">
                    <div className="adm-field">
                      <label htmlFor="p-private">ფასი ინდივიდუალური</label>
                      <input id="p-private" value={pricePrivate} onChange={(e) => setPricePrivate(e.target.value)} placeholder="მაგ. ₾450 (მანქანაზე)" />
                    </div>
                  </div>
                )}
              </div>

              <div className={`adm-price-row ${hasVip ? "on" : ""}`}>
                <label className="adm-check">
                  <input type="checkbox" checked={hasVip} onChange={(e) => setHasVip(e.target.checked)} />
                  VIP ტური
                </label>
                {hasVip && (
                  <div className="adm-price-inputs">
                    <div className="adm-field">
                      <label htmlFor="p-vip">ფასი VIP</label>
                      <input id="p-vip" value={priceVip} onChange={(e) => setPriceVip(e.target.value)} placeholder="მაგ. ₾900 (პრემიუმ ავტომობილით)" />
                    </div>
                    <div className="adm-field">
                      <label htmlFor="p-vip-note">VIP სერვისის აღწერა</label>
                      <input id="p-vip-note" value={vipNote} onChange={(e) => setVipNote(e.target.value)} placeholder="მაგ. პრემიუმ ავტომობილი, პირადი გიდი, კვება" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ── Route ──────────────────────────────────────── */}
          <section className="adm-card">
            <h2>მარშრუტი &amp; სანახავი ადგილები</h2>
            <p className="adm-hint">მიიტანეთ კურსორი წერტილზე დეტალებისა და ფოტოს სანახავად — თითოეულ ლოკაციას შეგიძლიათ დაამატოთ აღწერა და ფოტო. ჩაწერეთ ლოკაცია და დააჭირეთ + ღილაკს შემდეგის დასამატებლად.</p>

            {locations.map((loc, index) => (
              <div className="adm-loc-row" key={index}>
                <span className="adm-loc-index">{index + 1}.</span>
                <div className="adm-loc-fields">
                  <input
                    value={loc.name}
                    onChange={(e) => updateLocation(index, "name", e.target.value)}
                    placeholder="ლოკაციის დასახელება"
                    aria-label={`ლოკაცია ${index + 1}`}
                  />
                  <input
                    value={loc.note}
                    onChange={(e) => updateLocation(index, "note", e.target.value)}
                    placeholder="დეტალები (გამოჩნდება კურსორის მიტანაზე)"
                    aria-label={`ლოკაცია ${index + 1} დეტალები`}
                  />
                </div>

                <label className="adm-icon-btn" title="ლოკაციის ფოტო" style={{ cursor: "pointer" }}>
                  {loc.img ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
                  )}
                  <input type="file" accept="image/*" hidden onChange={(e) => handleLocationFile(index, e)} />
                  <span className="sr-only">ლოკაციის ფოტოს ატვირთვა</span>
                </label>

                <button type="button" className="adm-icon-btn add" onClick={() => addLocation(index)} title="შემდეგი ლოკაციის დამატება" aria-label="ლოკაციის დამატება">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                </button>

                {locations.length > 1 && (
                  <button type="button" className="adm-icon-btn danger" onClick={() => removeLocation(index)} title="ლოკაციის წაშლა" aria-label="ლოკაციის წაშლა">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
            ))}
          </section>

          {/* ── Gallery ────────────────────────────────────── */}
          <section className="adm-card">
            <h2>ფოტოგალერეა</h2>
            <p className="adm-hint">ფოტოები ინახება Cloudinary-ში და იქიდან ჩაიტვირთება მომხმარებლისთვის. პირველი ფოტო გამოიყენება ტურის ქავერად.</p>

            <div className="adm-upload">
              <label className="adm-upload-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
                {uploading ? "იტვირთება..." : "ფოტოების არჩევა"}
                <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleGalleryFiles} disabled={uploading} />
              </label>
              <p className="adm-hint" style={{ marginTop: 10 }}>JPG / PNG / WEBP — მაქს. 10MB თითო ფაილი</p>
            </div>

            {gallery.length > 0 && (
              <div className="adm-thumbs">
                {gallery.map((g, i) => (
                  <div className="adm-thumb" key={g.publicId || i}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g.url} alt={`გალერეის ფოტო ${i + 1}`} />
                    <button
                      type="button"
                      className="adm-thumb-remove"
                      onClick={() => setGallery((prev) => prev.filter((_, idx) => idx !== i))}
                      aria-label="ფოტოს წაშლა"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Departure dates (group only) ───────────────── */}
          {hasGroup && (
            <section className="adm-card">
              <h2>გამგზავრების თარიღის არჩევა</h2>
              <p className="adm-hint">ეს განყოფილება მხოლოდ ჯგუფური ტურისთვისაა. აირჩიეთ თარიღები და დაარეგულირეთ თითოეულ დღეზე თავისუფალი ადგილები.</p>

              <div className="adm-date-add">
                <div className="adm-field">
                  <label htmlFor="t-date">გამგზავრების თარიღი</label>
                  <input id="t-date" type="date" value={dateInput} onChange={(e) => setDateInput(e.target.value)} />
                </div>
                <button type="button" className="adm-btn primary" onClick={addDate} disabled={!dateInput}>
                  თარიღის დამატება
                </button>
              </div>

              {schedule.length > 0 && (
                <div className="adm-schedule">
                  <h3>ამ ტურის განრიგი &amp; თავისუფალი დღეები</h3>

                  {monthGroups.map((group) => (
                    <div className="adm-month" key={group.monthName}>
                      <div className="adm-month-name">{group.monthName}</div>
                      <div className="adm-chips">
                        {group.slots.map((slot) => {
                          const free = Math.max(0, slot.seats - slot.booked);
                          return (
                            <span
                              key={slot.iso}
                              className={`adm-chip ${activeDate === slot.iso ? "on" : ""}`}
                              onClick={() => setActiveDate(slot.iso)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveDate(slot.iso); } }}
                            >
                              {parseISO(slot.iso).label}
                              <small>{free} ადგილი</small>
                              <button type="button" className="adm-chip-x" onClick={(e) => { e.stopPropagation(); removeDate(slot.iso); }} aria-label="თარიღის წაშლა">×</button>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {activeSlot && (
                    <div className="adm-seat-panel">
                      <div className="adm-seat-panel-head">
                        <strong>{parseISO(activeSlot.iso).label} — ადგილების მართვა</strong>
                        <span className={`adm-seat-free ${activeFree === 0 ? "none" : activeFree <= 3 ? "low" : ""}`}>
                          თავისუფალია {activeFree} ადგილი / {activeSlot.seats}
                        </span>
                      </div>
                      <div className="adm-grid">
                        <div className="adm-field">
                          <label htmlFor="s-seats">სულ ადგილები ამ დღეს</label>
                          <input id="s-seats" type="number" min="1" value={activeSlot.seats} onChange={(e) => updateDate(activeSlot.iso, "seats", e.target.value)} />
                        </div>
                        <div className="adm-field">
                          <label htmlFor="s-booked">დაჯავშნილი ადგილები</label>
                          <input id="s-booked" type="number" min="0" max={activeSlot.seats} value={activeSlot.booked} onChange={(e) => updateDate(activeSlot.iso, "booked", e.target.value)} />
                        </div>
                      </div>
                      <p className="adm-hint" style={{ marginTop: 10 }}>
                        ტურის დეტალებში „მოგზაურთა რაოდენობა (კაცი)“ ამ თარიღისთვის შეიზღუდება {activeFree} კაცამდე.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          <div className="adm-actions">
            <button type="button" className="adm-btn" onClick={resetForm} disabled={saving}>გასუფთავება</button>
            <button type="submit" className="adm-btn primary" disabled={saving || uploading}>
              {saving ? "ინახება..." : "ტურის დამატება"}
            </button>
          </div>
        </form>

        {/* ── Saved tours ──────────────────────────────────── */}
        <section className="adm-card" style={{ marginTop: 28 }}>
          <h2>დამატებული ტურები</h2>
          <p className="adm-hint">Firestore-ში შენახული ტურები.</p>

          {loadingList ? (
            <p className="adm-empty">იტვირთება...</p>
          ) : saved.length === 0 ? (
            <p className="adm-empty">ჯერ არ არის დამატებული ტური.</p>
          ) : (
            saved.map((t) => (
              <div className="adm-tour-row" key={t.docId}>
                <div className="adm-tour-thumb">
                  {t.img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.img} alt="" />
                  ) : null}
                </div>
                <div className="adm-tour-info">
                  <strong>{t.title}</strong>
                  <span>
                    {t.typeLabel} · {t.destinationLabel} · {t.duration}
                    {t.hasGroup && t.schedule?.length ? ` · ${t.schedule.length} გამგზავრება` : ""}
                  </span>
                </div>
                <button type="button" className="adm-icon-btn danger" onClick={() => handleDelete(t.docId)} aria-label="ტურის წაშლა">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}
