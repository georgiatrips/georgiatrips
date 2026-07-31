"use client";

// ─────────────────────────────────────────────────────────────
// Firestore store for admin-created tours ("tours" collection).
// Documents are normalised into exactly the same shape the static
// ALL_TOURS array uses, so every existing page can render them
// without any extra mapping.
// ─────────────────────────────────────────────────────────────

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { DESTINATIONS } from "./toursData";

const TOURS_COLLECTION = "tours";

export const GEO_MONTH_NAMES = [
  "იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი",
  "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი",
];

export const TOUR_CATEGORIES = [
  { value: "popular", label: "პოპულარული" },
  { value: "nature", label: "ბუნება" },
  { value: "culture", label: "კულტურა & ისტორია" },
  { value: "taste", label: "გასტრონომია" },
  { value: "adventure", label: "თავგადასავალი" },
];

// ── Helpers ──────────────────────────────────────────────────

/** Turns a Georgian/latin title into a URL-safe slug used as the tour id. */
export function slugifyTitle(title) {
  const base = String(title || "")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  // Georgian letters survive in URLs but look noisy — transliterate them.
  const map = {
    ა: "a", ბ: "b", გ: "g", დ: "d", ე: "e", ვ: "v", ზ: "z", თ: "t", ი: "i",
    კ: "k", ლ: "l", მ: "m", ნ: "n", ო: "o", პ: "p", ჟ: "zh", რ: "r", ს: "s",
    ტ: "t", უ: "u", ფ: "f", ქ: "q", ღ: "gh", ყ: "y", შ: "sh", ჩ: "ch",
    ც: "ts", ძ: "dz", წ: "w", ჭ: "ch", ხ: "kh", ჯ: "j", ჰ: "h",
  };
  const latin = base.replace(/[\u10D0-\u10F0]/g, (ch) => map[ch] || "");
  return (latin.replace(/-+/g, "-").replace(/^-+|-+$/g, "") || "tour").slice(0, 60);
}

const pad2 = (n) => String(n).padStart(2, "0");

/** "2026-08-05" → { dd: "05", mm: "08" } */
function splitIso(iso) {
  const [y, m, d] = String(iso || "").split("-");
  return { yyyy: y, mm: m, dd: d };
}

export function isoToDDMM(iso) {
  const { dd, mm } = splitIso(iso);
  return dd && mm ? `${dd}.${mm}` : "";
}

export function isoToMMDD(iso) {
  const { dd, mm } = splitIso(iso);
  return dd && mm ? `${mm}.${dd}` : "";
}

export function formatGel(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Groups the admin-entered departure dates by month, keeping only
 * upcoming ones — the shape `getTourSchedule()` returns.
 * [{ monthName, monthIndex, dates: ["05.08"], seats: { "05.08": 12 } }]
 */
export function buildSchedule(departures = []) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const grouped = new Map();
  for (const entry of departures) {
    const iso = entry?.date;
    if (!iso) continue;
    const target = new Date(`${iso}T00:00:00`);
    if (isNaN(target.getTime()) || target <= today) continue;
    const monthIndex = target.getMonth();
    if (!grouped.has(monthIndex)) grouped.set(monthIndex, { dates: [], seats: {} });
    const bucket = grouped.get(monthIndex);
    const chip = `${pad2(target.getDate())}.${pad2(monthIndex + 1)}`;
    bucket.dates.push(chip);
    bucket.seats[chip] = Number(entry.seats) || 0;
  }

  return Array.from(grouped.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([monthIndex, bucket]) => ({
      monthName: GEO_MONTH_NAMES[monthIndex] || "",
      monthIndex,
      dates: bucket.dates.sort((a, b) => parseInt(a, 10) - parseInt(b, 10)),
      seats: bucket.seats,
    }));
}

/** Firestore document → tour object matching the static ALL_TOURS shape. */
export function normalizeTourDoc(docId, data = {}) {
  const departures = Array.isArray(data.departures) ? data.departures : [];
  const schedule = buildSchedule(departures);
  const gallery = Array.isArray(data.gallery) ? data.gallery.filter(Boolean) : [];
  const itinerary = Array.isArray(data.itinerary) ? data.itinerary.filter((s) => s?.title) : [];
  const destinationLabel =
    data.destinationLabel ||
    DESTINATIONS.find((d) => d.value === data.destination)?.label ||
    "საქართველო";

  // Free seats keyed by ISO date, used to cap the booking form
  const seatsByIso = {};
  for (const entry of departures) {
    if (entry?.date) seatsByIso[entry.date] = Number(entry.seats) || 0;
  }

  const priceGroupValue = formatGel(data.priceGroupValue);
  const pricePrivateValue = formatGel(data.pricePrivateValue);
  const priceVipValue = formatGel(data.priceVipValue);

  return {
    id: data.slug || docId,
    docId,
    isDynamic: true,
    title: data.title || "უსახელო ტური",
    desc: data.desc || "",
    duration: data.duration || "",
    durationHours: Number(data.durationHours) || 0,
    type: data.type === "multiday" ? "multiday" : "oneday",
    typeLabel: data.type === "multiday" ? "მრავალდღიანი" : "ერთდღიანი",
    location: data.location ? `📍 ${String(data.location).replace(/^📍\s*/, "")}` : `📍 ${destinationLabel}`,
    destination: data.destination || "",
    destinationLabel,
    minPeople: Number(data.minPeople) || 1,
    maxPeople: Number(data.maxPeople) || 0,
    hasGroup: !!data.hasGroup,
    hasPrivate: !!data.hasPrivate,
    hasVip: !!data.hasVip,
    priceGroupValue,
    pricePrivateValue,
    priceVipValue,
    priceGroup: data.hasGroup && priceGroupValue ? `₾${priceGroupValue}/კაცი` : "",
    pricePrivate: data.hasPrivate && pricePrivateValue ? `₾${pricePrivateValue}` : "",
    priceVip: data.hasVip && priceVipValue ? `₾${priceVipValue}` : "",
    badge: data.badge || "",
    category: data.category || "popular",
    img: data.cover || gallery[0] || "/batumi.png",
    gallery: gallery.length ? gallery : [],
    itinerary,
    highlights: itinerary.map((s) => s.title).filter(Boolean),
    departures,
    seatsByIso,
    schedule,
    // "MM.DD" list, the format the shared DatePicker + tour cards expect
    dates: departures.map((e) => isoToMMDD(e?.date)).filter(Boolean),
  };
}

// ── Reads ────────────────────────────────────────────────────

/** One-off fetch of every stored tour. */
export async function fetchTours() {
  const snap = await getDocs(query(collection(db, TOURS_COLLECTION), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => normalizeTourDoc(d.id, d.data()));
}

/** Realtime subscription. Returns the unsubscribe function. */
export function subscribeTours(onData, onError) {
  return onSnapshot(
    query(collection(db, TOURS_COLLECTION), orderBy("createdAt", "desc")),
    (snap) => onData(snap.docs.map((d) => normalizeTourDoc(d.id, d.data()))),
    (err) => onError?.(err)
  );
}

// ── Writes ───────────────────────────────────────────────────

export async function createTour(payload) {
  const ref = await addDoc(collection(db, TOURS_COLLECTION), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function saveTour(docId, payload) {
  await updateDoc(doc(db, TOURS_COLLECTION, docId), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

export async function removeTour(docId) {
  await deleteDoc(doc(db, TOURS_COLLECTION, docId));
}
