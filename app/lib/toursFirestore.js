import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

import { getTourSectionLabel } from "./tourMeta";

const TOURS_COLLECTION = "tours";

const GEO_MONTH_NAMES = [
  "იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი",
  "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი",
];

/** Plain Georgian text for display; old Firestore docs may still use { ka: "..." } */
export function asLocalizedText(value) {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "object" && !Array.isArray(value)) {
    if (value.ka != null && typeof value.ka !== "object") return String(value.ka);
    const first = Object.values(value).find((v) => typeof v === "string" || typeof v === "number");
    return first != null ? String(first) : "";
  }
  return "";
}

export function firestoreErrorMessage(err) {
  const code = err?.code || "";
  if (code === "permission-denied" || String(err?.message || "").includes("permission")) {
    return (
      "Firestore-ის წესები არ იძლევა ჩაწერის უფლებას. Firebase Console → Firestore Database → Rules → " +
      "ჩასვით პროექტის firestore.rules შიგთავსი → Publish. ან ტერმინალში: firebase deploy --only firestore:rules"
    );
  }
  if (code === "failed-precondition" || String(err?.message || "").includes("index")) {
    return "Firestore ინდექსი სჭირდება — სცადეთ ხელახლა; სია client-ზე იწყება.";
  }
  return err?.message || "შეცდომა Firestore-თან";
}

export function buildTourSlug(title) {
  const base = asLocalizedText(title)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u10A0-\u10FF-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${base || "tour"}-${Date.now().toString(36)}`;
}

export async function createTour(tourData) {
  const payload = {
    ...tourData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, TOURS_COLLECTION), payload);
  return { id: ref.id, ...tourData };
}

export async function getFirestoreTourById(id) {
  if (!id) return null;
  const snap = await getDoc(doc(db, TOURS_COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function listFirestoreTours() {
  const snap = await getDocs(collection(db, TOURS_COLLECTION));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => {
      const ta = a.createdAt?.toMillis?.() ?? 0;
      const tb = b.createdAt?.toMillis?.() ?? 0;
      return tb - ta;
    });
}

export async function updateFirestoreTour(id, tourData) {
  await updateDoc(doc(db, TOURS_COLLECTION, id), {
    ...tourData,
    updatedAt: serverTimestamp(),
  });
}
export async function deleteFirestoreTour(id) {
  await deleteDoc(doc(db, TOURS_COLLECTION, id));
}

/** Group ISO dates + freeSeats into month schedule for UI */
export function groupDepartureDates(departureDates = []) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const grouped = new Map();

  for (const entry of departureDates) {
    const iso = typeof entry === "string" ? entry : entry?.date;
    if (!iso) continue;
    const [y, m, d] = iso.split("-").map(Number);
    if (!y || !m || !d) continue;
    const target = new Date(y, m - 1, d);
    target.setHours(0, 0, 0, 0);
    if (target < now) continue;

    const monthIndex = m - 1;
    if (!grouped.has(monthIndex)) grouped.set(monthIndex, []);
    grouped.get(monthIndex).push({
      chip: `${String(d).padStart(2, "0")}.${String(m).padStart(2, "0")}`,
      date: iso,
      freeSeats: typeof entry === "object" ? Number(entry.freeSeats) || 0 : 0,
    });
  }

  return Array.from(grouped.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([monthIndex, dates]) => ({
      monthName: GEO_MONTH_NAMES[monthIndex] || "",
      monthIndex,
      dates: dates.sort((a, b) => a.date.localeCompare(b.date)),
    }))
    .filter((g) => g.dates.length > 0);
}

/** Normalize Firestore tour into the shape used by tour detail / cards */
export function normalizeFirestoreTour(tour) {
  if (!tour) return null;
  const hasGroup = !!tour.hasGroup;
  const hasPrivate = !!tour.hasPrivate;
  const title = asLocalizedText(tour.title);
  const desc = asLocalizedText(tour.desc);
  const duration = asLocalizedText(tour.duration);
  const destLabel =
    asLocalizedText(tour.destinationLabel) || asLocalizedText(tour.destination) || "";
  const badgeRaw = asLocalizedText(tour.badge);
  const tourSection =
    typeof tour.tourSection === "string" ? tour.tourSection : tour.category || "";
  const tourSectionLabel =
    asLocalizedText(tour.tourSectionLabel) || getTourSectionLabel(tourSection);

  const itinerary = (Array.isArray(tour.itinerary) ? tour.itinerary : []).map((item) => ({
    placeId: typeof item?.placeId === "string" ? item.placeId : "",
    title: asLocalizedText(item?.title),
    desc: asLocalizedText(item?.desc),
    img: typeof item?.img === "string" ? item.img : asLocalizedText(item?.img),
  }));

  const gallery = (Array.isArray(tour.gallery) ? tour.gallery : [])
    .map((g) => (typeof g === "string" ? g : asLocalizedText(g)))
    .filter(Boolean);

  return {
    ...tour,
    id: tour.id,
    title,
    desc,
    duration,
    type: tour.type || "oneday",
    typeLabel: tour.type === "multiday" ? "მრავალდღიანი" : "ერთდღიანი",
    location: destLabel ? `📍 ${destLabel}` : "",
    destination: asLocalizedText(tour.destination) || (typeof tour.destination === "string" ? tour.destination : ""),
    destinationLabel: destLabel,
    priceGroup: hasGroup && tour.priceGroup != null ? `₾${tour.priceGroup}/კაცი` : null,
    pricePrivate: hasPrivate && tour.pricePrivate != null ? `₾${tour.pricePrivate}` : null,
    priceGroupNum: hasGroup ? Number(tour.priceGroup) || 0 : 0,
    pricePrivateNum: hasPrivate ? Number(tour.pricePrivate) || 0 : 0,
    groupMin: Number(tour.groupMin) || 1,
    groupMax: Number(tour.groupMax) || 18,
    privateGroupMin: Number(tour.privateGroupMin) || Number(tour.groupMin) || 1,
    privateGroupMax: Number(tour.privateGroupMax) || Number(tour.groupMax) || 18,
    hasGroup,
    hasPrivate,
    isVip: !!tour.isVip,
    isPopular: !!tour.isPopular,
    badge: badgeRaw || "ახალი ტური",
    tourSection,
    tourSectionLabel,
    img: (typeof tour.img === "string" && tour.img) || gallery[0] || "/hero.png",
    gallery,
    itinerary,
    departureDates: Array.isArray(tour.departureDates) ? tour.departureDates : [],
    dates: (tour.departureDates || []).map((e) => {
      const iso = typeof e === "string" ? e : e?.date;
      if (!iso) return null;
      const [, mm, dd] = iso.split("-");
      return `${mm}.${dd}`;
    }).filter(Boolean),
    category: tourSection || tour.category || "popular",
  };
}
