// Firestore helpers for admin-managed tours
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAuLpaONrIUwnJJ3ycgzWWlSTiujotfo4U",
  authDomain: "georgiatripsge.firebaseapp.com",
  projectId: "georgiatripsge",
  storageBucket: "georgiatripsge.firebasestorage.app",
  messagingSenderId: "458133209260",
  appId: "1:458133209260:web:884340052c037e6fcd9f09",
  measurementId: "G-KVGPVEVHQ0",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);

const TOURS = "tours";

// ── Create ───────────────────────────────────────────────────
export async function createTour(data) {
  const ref = await addDoc(collection(db, TOURS), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// ── Read all (newest first) ──────────────────────────────────
export async function listTours() {
  try {
    const snap = await getDocs(query(collection(db, TOURS), orderBy("createdAt", "desc")));
    return snap.docs.map((d) => ({ docId: d.id, ...d.data() }));
  } catch {
    // Falls back to unordered read if the index/field is missing
    const snap = await getDocs(collection(db, TOURS));
    return snap.docs.map((d) => ({ docId: d.id, ...d.data() }));
  }
}

// ── Update ───────────────────────────────────────────────────
export async function updateTour(docId, data) {
  await updateDoc(doc(db, TOURS, docId), { ...data, updatedAt: serverTimestamp() });
}

// ── Delete ───────────────────────────────────────────────────
export async function deleteTour(docId) {
  await deleteDoc(doc(db, TOURS, docId));
}
