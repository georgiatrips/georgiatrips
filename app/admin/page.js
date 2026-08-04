"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import DatePicker from "../components/DatePicker";
import { GEORGIA_REGIONS } from "../lib/placesMeta";
import { listPlaces } from "../lib/placesFirestore";
import { TOUR_BADGE_OPTIONS, TOUR_SECTIONS } from "../lib/tourMeta";
import PlaceManager from "./PlaceManager";
import ReviewManager from "./ReviewManager";
import { useAuth } from "../lib/AuthContext";
import {
  createTour,
  listFirestoreTours,
  deleteFirestoreTour,
  updateFirestoreTour,
  groupDepartureDates,
  asLocalizedText,
  firestoreErrorMessage,
} from "../lib/toursFirestore";

const emptyLocation = () => ({ placeId: "", search: "", title: "", desc: "", img: "" });

async function uploadToCloudinary(file) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "ატვირთვა ვერ მოხერხდა");
  return data.url;
}

export default function AdminPage() {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [type, setType] = useState("oneday");
  const [durationMode, setDurationMode] = useState("days");
  const [durationDays, setDurationDays] = useState("");
  const [durationNights, setDurationNights] = useState("");
  const [durationHours, setDurationHours] = useState("");
  const [destination, setDestination] = useState(GEORGIA_REGIONS[0]);
  const [groupMin, setGroupMin] = useState("1");
  const [groupMax, setGroupMax] = useState("18");
  const [privateGroupMin, setPrivateGroupMin] = useState("1");
  const [privateGroupMax, setPrivateGroupMax] = useState("18");
  const [hasGroup, setHasGroup] = useState(true);
  const [hasPrivate, setHasPrivate] = useState(true);
  const [priceGroup, setPriceGroup] = useState("");
  const [pricePrivate, setPricePrivate] = useState("");
  const [isVip, setIsVip] = useState(false);
  const [isPopular, setIsPopular] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(TOUR_BADGE_OPTIONS[0]);
  const [tourSection, setTourSection] = useState("");
  const [locations, setLocations] = useState([emptyLocation()]);
  const [availablePlaces, setAvailablePlaces] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [datePick, setDatePick] = useState("");
  const [departureDates, setDepartureDates] = useState([]);
  const [saving, setSaving] = useState(false);
  const [editingTourId, setEditingTourId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const { user } = useAuth() ?? {};
  const [existingTours, setExistingTours] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const destinationLabel = destination;

  useEffect(() => {
    let active = true;
    listPlaces()
      .then((items) => { if (active) setAvailablePlaces(items); })
      .catch((error) => console.error("Places ვერ ჩაიტვირთა", error));
    return () => { active = false; };
  }, []);


  const schedulePreview = groupDepartureDates(departureDates);

  const refreshList = async () => {
    if (!user) {
      setExistingTours([]);
      setLoadingList(false);
      return;
    }

    try {
      setLoadingList(true);
      const list = await listFirestoreTours();
      setExistingTours(list);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: firestoreErrorMessage(err) });
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (user === undefined) return;
    if (!user) {
      setExistingTours([]);
      setLoadingList(false);
      return;
    }

    refreshList();
  }, [user]);

  const updateLocation = (idx, field, value) => {
    setLocations((prev) =>
      prev.map((loc, i) => (i === idx ? { ...loc, [field]: value } : loc))
    );
  };

  const addLocation = () => setLocations((prev) => [...prev, emptyLocation()]);

  const selectPlaceForLocation = (idx, place) => {
    setLocations((prev) => prev.map((loc, i) => i === idx
      ? {
          ...loc,
          placeId: place.id,
          search: place.title,
          title: place.title,
          desc: place.desc || "",
          img: place.img || place.gallery?.[0] || "",
        }
      : loc
    ));
  };

  const removeLocation = (idx) => {
    setLocations((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
  };

  const handleLocationPhoto = async (idx, file) => {
    if (!file) return;
    try {
      setUploading(true);
      const url = await uploadToCloudinary(file);
      updateLocation(idx, "img", url);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try {
      setUploading(true);
      const urls = [];
      for (const file of files) {
        urls.push(await uploadToCloudinary(file));
      }
      setGallery((prev) => [...prev, ...urls]);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeGalleryImage = (idx) => {
    setGallery((prev) => prev.filter((_, i) => i !== idx));
  };

  const addDepartureDate = () => {
    if (!datePick) return;
    if (departureDates.some((d) => d.date === datePick)) {
      setMessage({ type: "error", text: "ეს თარიღი უკვე დამატებულია" });
      return;
    }
    const maxSeats = Math.max(1, parseInt(groupMax, 10) || 18);
    setDepartureDates((prev) =>
      [...prev, { date: datePick, freeSeats: maxSeats }].sort((a, b) =>
        a.date.localeCompare(b.date)
      )
    );
    setDatePick("");
    setMessage(null);
  };

  const updateFreeSeats = (date, seats) => {
    setDepartureDates((prev) =>
      prev.map((d) => (d.date === date ? { ...d, freeSeats: seats } : d))
    );
  };

  const removeDepartureDate = (date) => {
    setDepartureDates((prev) => prev.filter((d) => d.date !== date));
  };

  const resetForm = () => {
    setTitle("");
    setDesc("");
    setType("oneday");
    setDurationMode("days");
    setDurationDays("");
    setDurationNights("");
    setDurationHours("");
    setDestination(GEORGIA_REGIONS[0]);
    setGroupMin("1");
    setGroupMax("18");
    setPrivateGroupMin("1");
    setPrivateGroupMax("18");
    setHasGroup(true);
    setHasPrivate(true);
    setPriceGroup("");
    setPricePrivate("");
    setIsVip(false);
    setIsPopular(false);
    setIsPopular(false);
    setSelectedBadge(TOUR_BADGE_OPTIONS[0]);
    setTourSection("");
    setLocations([emptyLocation()]);
    setGallery([]);
    setDatePick("");
    setDepartureDates([]);
    setEditingTourId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!title.trim() || !desc.trim()) {
      setMessage({ type: "error", text: "ტურის სახელი და აღწერა სავალდებულოა" });
      return;
    }
    if (!hasGroup && !hasPrivate) {
      setMessage({ type: "error", text: "აირჩიეთ ჯგუფური და/ან ინდივიდუალური ტური" });
      return;
    }
    if (hasGroup && !priceGroup) {
      setMessage({ type: "error", text: "შეიყვანეთ ჯგუფური ფასი" });
      return;
    }
    if (hasPrivate && !pricePrivate) {
      setMessage({ type: "error", text: "შეიყვანეთ ინდივიდუალური ფასი" });
      return;
    }
    if (hasGroup && departureDates.length === 0) {
      setMessage({ type: "error", text: "ჯგუფური ტურისთვის დაამატეთ გამგზავრების თარიღები" });
      return;
    }

    const itinerary = locations
      .filter((l) => l.title.trim())
      .map((l) => ({
        placeId: l.placeId || "",
        title: l.title.trim(),
        desc: l.desc.trim(),
        img: l.img || "",
      }));

    if (itinerary.length === 0 || itinerary.some((location) => !location.placeId)) {
      setMessage({ type: "error", text: "აირჩიეთ მარშრუტის ყველა ლოკაცია Places-დან" });
      return;
    }
    if (!selectedBadge) {
      setMessage({ type: "error", text: "აირჩიეთ badge ტურისთვის" });
      return;
    }

    const sectionLabel =
      TOUR_SECTIONS.find((s) => s.value === tourSection)?.label || "";

    const minN = Math.max(1, parseInt(groupMin, 10) || 1);
    const maxN = Math.max(minN, parseInt(groupMax, 10) || minN);
    const privateMinN = Math.max(1, parseInt(privateGroupMin, 10) || 1);
    const privateMaxN = Math.max(privateMinN, parseInt(privateGroupMax, 10) || privateMinN);
    const durationValue = durationMode === "hours"
      ? `${Math.max(1, parseInt(durationHours, 10) || 1)} საათი`
      : `${Math.max(1, parseInt(durationDays, 10) || 1)} დღე / ${Math.max(0, parseInt(durationNights, 10) || 0)} ღამე`;

    const payload = {
      title: title.trim(),
      desc: desc.trim(),
      type,
      duration: durationValue,
      destination,
      destinationLabel,
      groupMin: minN,
      groupMax: maxN,
      privateGroupMin: privateMinN,
      privateGroupMax: privateMaxN,
      hasGroup,
      hasPrivate,
      priceGroup: hasGroup ? Number(priceGroup) : null,
      pricePrivate: hasPrivate ? Number(pricePrivate) : null,
      isVip,
      isPopular,
      itinerary,
      gallery,
      img: gallery[0] || itinerary[0]?.img || "/hero.png",
      departureDates: hasGroup
        ? departureDates.map((d) => ({
            date: d.date,
            freeSeats: Math.max(0, Number(d.freeSeats) || 0),
          }))
        : [],
      badge: selectedBadge,
      tourSection,
      tourSectionLabel: sectionLabel,
      category: tourSection,
    };

    try {
      setSaving(true);
      const created = editingTourId ? null : await createTour(payload);
      if (editingTourId) await updateFirestoreTour(editingTourId, payload);
      setMessage({ type: "success", text: editingTourId ? "ტური განახლებულია!" : `ტური შენახულია! ID: ${created.id}` });
      resetForm();
      await refreshList();
    } catch (err) {
      console.error(err);
      setMessage({
        type: "error",
        text: firestoreErrorMessage(err),
      });
    } finally {
      setSaving(false);
    }
  };

  const startTourEdit = (tour) => {
    setEditingTourId(tour.id);
    setTitle(asLocalizedText(tour.title)); setDesc(asLocalizedText(tour.desc));
    setType(tour.type || "oneday");
    const savedDuration = asLocalizedText(tour.duration);
    const durationNumbers = savedDuration.match(/\d+(?:[.,]\d+)?/g) || [];
    const isHours = savedDuration.includes("საათი");
    setDurationMode(isHours ? "hours" : "days");
    if (isHours) {
      setDurationHours(durationNumbers[0] || "");
      setDurationDays("");
      setDurationNights("");
    } else {
      setDurationDays(durationNumbers[0] || "");
      setDurationNights(durationNumbers[1] || "0");
      setDurationHours("");
    }
    setDestination(GEORGIA_REGIONS.includes(asLocalizedText(tour.destination)) ? asLocalizedText(tour.destination) : GEORGIA_REGIONS[0]);
    setGroupMin(String(tour.groupMin || 1)); setGroupMax(String(tour.groupMax || 18));
    setPrivateGroupMin(String(tour.privateGroupMin || tour.groupMin || 1));
    setPrivateGroupMax(String(tour.privateGroupMax || tour.groupMax || 18));
    setHasGroup(!!tour.hasGroup); setHasPrivate(!!tour.hasPrivate);
    setPriceGroup(tour.priceGroup ?? ""); setPricePrivate(tour.pricePrivate ?? "");
    setIsVip(!!tour.isVip); setIsPopular(!!tour.isPopular); setSelectedBadge(asLocalizedText(tour.badge) || TOUR_BADGE_OPTIONS[0]);
    setTourSection(tour.tourSection || tour.category || "");
    setLocations(Array.isArray(tour.itinerary) && tour.itinerary.length ? tour.itinerary.map((location) => ({ ...location, placeId: location.placeId || "", search: location.title || "" })) : [emptyLocation()]);
    setGallery(Array.isArray(tour.gallery) ? tour.gallery : []);
    setDepartureDates(Array.isArray(tour.departureDates) ? tour.departureDates : []);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!confirm("წავშალოთ ეს ტური?")) return;
    try {
      await deleteFirestoreTour(id);
      await refreshList();
    } catch (err) {
      setMessage({ type: "error", text: firestoreErrorMessage(err) });
    }
  };

  if (user === undefined) {
    return (
      <div className="admin-page">
        <Navbar active="admin" />
        <section className="admin-section">
          <div className="container admin-layout">
            <div className="admin-loading-state">
              <h2>სისტემასთან დაკავშირება...</h2>
              <p>დაიცადეთ, ვამოწმებთ თქვენს ანგარიშს.</p>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="admin-page">
        <Navbar active="admin" />
        <section className="admin-section">
          <div className="container admin-layout">
            <div className="admin-login-prompt">
              <h2>თქვენ ჯერ არ ხართ შესული</h2>
              <p>
                ეს გვერდი ხელმისაწვდომია მხოლოდ ავტორიზებული მომხმარებლებისთვის. შესვლა შეგიძლიათ ქვემოთ.
              </p>
              <Link href="/login" className="admin-btn-primary">
                შესვლა
              </Link>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="admin-page">
      <Navbar active="admin" />

      <section className="admin-hero">
        <div className="admin-hero-bg">
          <Image
            src="/hero.png"
            alt=""
            fill
            priority
            style={{ objectFit: "cover" }}
            sizes="100vw"
          />
        </div>
        <div className="admin-hero-scrim" />
        <div className="admin-hero-content">
          <span className="admin-hero-eyebrow">მართვა</span>
          <h1 className="admin-hero-title">ადმინ პანელი</h1>
          <p className="admin-hero-sub">დაამატეთ ახალი ტურები — ინახება Firebase Firestore-ში</p>
        </div>
      </section>

      <section className="admin-section">
        <div className="container admin-layout">
          <form className="admin-form" onSubmit={handleSubmit}>
            <header className="admin-form-header">
              <h2>{editingTourId ? "ტურის რედაქტირება" : "ტურის დამატება"}</h2>
              <p>შეავსეთ ველები და შეინახეთ. ფოტოები ინახება Cloudinary-ში.</p>
            </header>

            {message && (
              <div className={`admin-alert ${message.type}`} role="status">
                {message.text}
              </div>
            )}

            {/* Basic info */}
            <fieldset className="admin-fieldset">
              <legend>ძირითადი ინფორმაცია</legend>
              <div className="admin-field">
                <label htmlFor="tour-title">ტურის სახელი</label>
                <input
                  id="tour-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="მაგ: პრომეთეს მღვიმე & მარტვილის კანიონი"
                  required
                />
              </div>
              <div className="admin-field">
                <label htmlFor="tour-desc">ექსკურსიის შესახებ</label>
                <textarea
                  id="tour-desc"
                  rows={4}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="მოკლე აღწერა ტურის შესახებ..."
                  required
                />
              </div>
              <div className="admin-grid-2">
                <div className="admin-field">
                  <label>ტიპი</label>
                  <div className="admin-segment">
                    <button
                      type="button"
                      className={type === "oneday" ? "is-active" : ""}
                      onClick={() => setType("oneday")}
                    >
                      ერთდღიანი
                    </button>
                    <button
                      type="button"
                      className={type === "multiday" ? "is-active" : ""}
                      onClick={() => setType("multiday")}
                    >
                      მრავალდღიანი
                    </button>
                  </div>
                </div>
                <div className="admin-field">
                  <label htmlFor="tour-duration">ხანგრძლივობა</label>
                  <div className="admin-duration-mode admin-segment">
                    <button type="button" className={durationMode === "days" ? "is-active" : ""} onClick={() => setDurationMode("days")}>დღე / ღამე</button>
                    <button type="button" className={durationMode === "hours" ? "is-active" : ""} onClick={() => setDurationMode("hours")}>საათი</button>
                  </div>
                  {durationMode === "hours" ? (
                    <input id="tour-duration-hours" type="number" min="1" value={durationHours} onChange={(e) => setDurationHours(e.target.value)} placeholder="მაგ: 12" required />
                  ) : (
                    <div className="admin-inline-inputs">
                      <input id="tour-duration-days" type="number" min="1" value={durationDays} onChange={(e) => setDurationDays(e.target.value)} placeholder="დღე" required />
                      <span>/</span>
                      <input id="tour-duration-nights" type="number" min="0" value={durationNights} onChange={(e) => setDurationNights(e.target.value)} placeholder="ღამე" required />
                    </div>
                  )}                </div>
              </div>
              <div className="admin-grid-2">
                <div className="admin-field">
                  <label htmlFor="tour-dest">მიმართულება</label>
                  <select
                    id="tour-dest"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  >
                    {GEORGIA_REGIONS.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="admin-field">
                  <label>ჯგუფის ზომა (მინ / მაქს)</label>
                  <div className="admin-inline-inputs">
                    <input
                      type="number"
                      min="1"
                      value={groupMin}
                      onChange={(e) => setGroupMin(e.target.value)}
                      aria-label="მინიმუმი"
                    />
                    <span>—</span>
                    <input
                      type="number"
                      min="1"
                      value={groupMax}
                      onChange={(e) => setGroupMax(e.target.value)}
                      aria-label="მაქსიმუმი"
                    />
                  </div>
                </div>
              </div>

              <div className="admin-field">
                <label>ინდივიდუალური ტურის ჯგუფის ზომა (მინ / მაქს)</label>
                <div className="admin-inline-inputs">
                  <input type="number" min="1" value={privateGroupMin} onChange={(e) => setPrivateGroupMin(e.target.value)} aria-label="ინდივიდუალური მინიმუმი" />
                  <span>—</span>
                  <input type="number" min="1" value={privateGroupMax} onChange={(e) => setPrivateGroupMax(e.target.value)} aria-label="ინდივიდუალური მაქსიმუმი" />
                </div>
              </div>
              <label className="admin-check">
                <input
                  type="checkbox"
                  checked={isVip}
                  onChange={(e) => {
                    setIsVip(e.target.checked);
                    if (e.target.checked) setSelectedBadge("პრემიუმ ტური");
                  }}
                />
                <span>VIP ტური</span>
              </label>
            </fieldset>

            <fieldset className="admin-fieldset">
              <legend>Badge (ბარათზე და ტურის გვერდზე)</legend>
              <p className="admin-hint">აირჩიეთ ერთ-ერთი მზა badge — გამოჩნდება ტურის hero-ში და ბარათებზე.</p>
              <div className="admin-badge-grid">
                {TOUR_BADGE_OPTIONS.map((label) => (
                  <button
                    key={label}
                    type="button"
                    className={`admin-pick-chip${selectedBadge === label ? " is-active" : ""}`}
                    onClick={() => setSelectedBadge(label)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="admin-fieldset">
              <legend>ტურის კატეგორია</legend>
              <label className="admin-check admin-popular-tour-check">
                <input type="checkbox" checked={isPopular} onChange={(e) => setIsPopular(e.target.checked)} />
                <span>პოპულარული ტური — გამოჩნდეს მთავარ გვერდზე</span>
              </label>
              <p className="admin-hint">სად უნდა გამოჩნდეს ტური — აირჩიეთ შესაბამისი სექცია.</p>
              <div className="admin-section-grid">
                <button
                  type="button"
                  className={`admin-section-card${!tourSection ? " is-active" : ""}`}
                  onClick={() => setTourSection("")}
                >
                  კატეგორიის გარეშე
                </button>
                {TOUR_SECTIONS.map((sec) => (
                  <button
                    key={sec.value}
                    type="button"
                    className={`admin-section-card${tourSection === sec.value ? " is-active" : ""}`}
                    onClick={() => setTourSection(sec.value)}
                  >
                    {sec.label}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Pricing */}
            <fieldset className="admin-fieldset">
              <legend>ფასები</legend>
              <p className="admin-hint">შეგიძლიათ ჩართოთ მხოლოდ ერთი ტიპი — მაგ. მხოლოდ ჯგუფური.</p>
              <div className="admin-price-row">
                <label className="admin-check">
                  <input
                    type="checkbox"
                    checked={hasGroup}
                    onChange={(e) => setHasGroup(e.target.checked)}
                  />
                  <span>ჯგუფური ტური</span>
                </label>
                {hasGroup && (
                  <div className="admin-field admin-field-inline">
                    <label htmlFor="price-group">ფასი ჯგუფური (₾ / კაცი)</label>
                    <input
                      id="price-group"
                      type="number"
                      min="0"
                      value={priceGroup}
                      onChange={(e) => setPriceGroup(e.target.value)}
                      placeholder="100"
                    />
                  </div>
                )}
              </div>
              <div className="admin-price-row">
                <label className="admin-check">
                  <input
                    type="checkbox"
                    checked={hasPrivate}
                    onChange={(e) => setHasPrivate(e.target.checked)}
                  />
                  <span>ინდივიდუალური ტური</span>
                </label>
                {hasPrivate && (
                  <div className="admin-field admin-field-inline">
                    <label htmlFor="price-private">ფასი ინდივიდუალური (₾)</label>
                    <input
                      id="price-private"
                      type="number"
                      min="0"
                      value={pricePrivate}
                      onChange={(e) => setPricePrivate(e.target.value)}
                      placeholder="500"
                    />
                  </div>
                )}
              </div>
            </fieldset>

            {/* Route */}
            <fieldset className="admin-fieldset">
              <legend>მარშრუტი & სანახავი ადგილები</legend>
              <p className="admin-hint">
                მიიტანეთ კურსორი წერტილზე დეტალებისა და ფოტოს სანახავად — აქ დაამატეთ ლოკაციები.
              </p>
              {locations.map((loc, idx) => (
                <div key={idx} className="admin-location-card">
                  <div className="admin-location-head">
                    <strong>ლოკაცია #{idx + 1}</strong>
                    {locations.length > 1 && (
                      <button
                        type="button"
                        className="admin-btn-ghost"
                        onClick={() => removeLocation(idx)}
                      >
                        წაშლა
                      </button>
                    )}
                  </div>
                  <div className="admin-field admin-place-search-field">
                    <label>ადგილის მოძებნა</label>
                    <input
                      value={loc.search || ""}
                      onChange={(e) => updateLocation(idx, "search", e.target.value)}
                      placeholder="მოძებნეთ დამატებული ადგილი..."
                    />
                    {loc.search && !loc.placeId && (
                      <div className="admin-place-search-results">
                        {availablePlaces
                          .filter((place) => place.title.toLowerCase().includes(loc.search.toLowerCase()))
                          .slice(0, 6)
                          .map((place) => (
                            <button type="button" key={place.id} className="admin-place-search-result" onClick={() => selectPlaceForLocation(idx, place)}>
                              <span className="admin-place-result-thumb">
                                <Image src={place.img || place.gallery?.[0] || "/hero.png"} alt="" fill sizes="42px" style={{ objectFit: "cover" }} />
                              </span>
                              <span><strong>{place.title}</strong><small>{place.region}</small></span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                  {loc.placeId && (
                    <div className="admin-selected-place">
                      <div className="admin-selected-place-thumb">
                        <Image src={loc.img || "/hero.png"} alt={loc.title} fill sizes="72px" style={{ objectFit: "cover" }} />
                      </div>
                      <div>
                        <strong>{loc.title}</strong>
                        <p>{loc.desc}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <button type="button" className="admin-btn-add" onClick={addLocation}>
                + შემდეგი ლოკაცია
              </button>
            </fieldset>

            {/* Gallery */}
            <fieldset className="admin-fieldset">
              <legend>ფოტოგალერეა (Cloudinary)</legend>
              <div className="admin-field">
                <label htmlFor="gallery-upload">ფოტოების ატვირთვა</label>
                <input
                  id="gallery-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryUpload}
                  disabled={uploading}
                />
              </div>
              {uploading && <p className="admin-hint">იტვირთება...</p>}
              {gallery.length > 0 && (
                <div className="admin-gallery-grid">
                  {gallery.map((url, idx) => (
                    <div key={url} className="admin-gallery-item">
                      <Image src={url} alt="" fill sizes="120px" style={{ objectFit: "cover" }} />
                      <button
                        type="button"
                        className="admin-gallery-remove"
                        onClick={() => removeGalleryImage(idx)}
                        aria-label="წაშლა"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </fieldset>

            {/* Group departure dates */}
            {hasGroup && (
              <fieldset className="admin-fieldset">
                <legend>გამგზავრების თარიღები (ჯგუფური)</legend>
                <p className="admin-hint">
                  მხოლოდ ჯგუფური ტურისთვის. აირჩიეთ თარიღი და დააჭირეთ დამატებას, შემდეგ მიუთითეთ თავისუფალი ადგილები.
                </p>
                <div className="admin-date-add-row">
                  <DatePicker
                    value={datePick}
                    onChange={setDatePick}
                    placeholder="აირჩიეთ თარიღი"
                    direction="down"
                  />
                  <button type="button" className="admin-btn-add" onClick={addDepartureDate}>
                    + თარიღის დამატება
                  </button>
                </div>

                {schedulePreview.length > 0 && (
                  <div className="admin-schedule-preview">
                    <h3>ამ ტურის განრიგი & თავისუფალი დღეები</h3>
                    {schedulePreview.map((mGroup) => (
                      <div key={mGroup.monthName} className="admin-schedule-month">
                        <span className="admin-month-pill">{mGroup.monthName}</span>
                        <div className="admin-schedule-days">
                          {mGroup.dates.map((d) => {
                            const entry = departureDates.find((x) => x.date === d.date);
                            return (
                              <div key={d.date} className="admin-schedule-chip-edit">
                                <span className="chip-date">{d.chip}</span>
                                <label>
                                  თავისუფალი ადგილი
                                  <input
                                    type="number"
                                    min="0"
                                    max={groupMax || 99}
                                    value={entry?.freeSeats ?? 0}
                                    onChange={(e) =>
                                      updateFreeSeats(d.date, Number(e.target.value) || 0)
                                    }
                                  />
                                </label>
                                <button
                                  type="button"
                                  className="admin-btn-ghost"
                                  onClick={() => removeDepartureDate(d.date)}
                                >
                                  წაშლა
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </fieldset>
            )}

            <div className="admin-form-actions">
              <button type="submit" className="admin-btn-primary" disabled={saving || uploading}>
                {saving ? "ინახება..." : editingTourId ? "ცვლილებების შენახვა" : "ტურის შენახვა"}
              </button>
              <button type="button" className="admin-btn-ghost" onClick={resetForm}>
                გასუფთავება
              </button>
            </div>
          </form>

          <aside className="admin-sidebar">
            <h2>დამატებული ტურები</h2>
            {loadingList ? (
              <p className="admin-hint">იტვირთება...</p>
            ) : existingTours.length === 0 ? (
              <p className="admin-hint">ჯერ ტურები არ არის დამატებული.</p>
            ) : (
              <ul className="admin-tour-list">
                {existingTours.map((t) => (
                  <li key={t.id}>
                    <div>
                      <strong>{asLocalizedText(t.title)}</strong>
                      <small>{asLocalizedText(t.destinationLabel) || asLocalizedText(t.destination)}</small>
                      <Link href={`/tours/${t.id}`}>ნახვა →</Link>
                    </div>
                    <button type="button" className="admin-btn-ghost" onClick={() => startTourEdit(t)}>რედაქტირება</button>
                    <button type="button" className="admin-btn-ghost" onClick={() => handleDelete(t.id)}>
                      წაშლა
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </section>

      <section className="admin-section">
        <div className="container">
          <PlaceManager />
        </div>
      </section>

      <section className="admin-section">
        <div className="container">
          <ReviewManager />
        </div>
      </section>

      <Footer />
    </div>
  );
}

