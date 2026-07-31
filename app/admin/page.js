"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import TourForm from "./TourForm";
import { useDynamicTours } from "../lib/useDynamicTours";
import { removeTour } from "../lib/toursStore";
import "./admin.css";

export default function AdminPage() {
  const { tours, loading, error } = useDynamicTours();
  const [editing, setEditing] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const handleDelete = async (tour) => {
    if (!window.confirm(`წავშალოთ ტური "${tour.title}"?`)) return;
    setBusyId(tour.docId);
    try {
      await removeTour(tour.docId);
      if (editing?.docId === tour.docId) setEditing(null);
    } catch (err) {
      window.alert(err.message || "წაშლა ვერ შესრულდა.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <Navbar active="admin" />

      <main className="adm-page">
        <div className="adm-shell">
          <header className="adm-header">
            <div>
              <h1>ადმინის პანელი</h1>
              <p>
                დაამატეთ ახალი ტური, ატვირთეთ ფოტოგალერეა Cloudinary-ში და მართეთ
                ჯგუფური გამგზავრებების თავისუფალი ადგილები. შენახული ტური მაშინვე გამოჩნდება
                ტურების გვერდზე.
              </p>
            </div>
            <span className="adm-header-badge">
              {loading ? "იტვირთება..." : `${tours.length} დამატებული ტური`}
            </span>
          </header>

          {error && (
            <div className="adm-card">
              <div className="adm-card-body">
                <p className="adm-status err">
                  Firestore-თან კავშირი ვერ დამყარდა: {error.message}
                </p>
              </div>
            </div>
          )}
        </div>

        <TourForm
          editing={editing}
          onSaved={() => setEditing(null)}
          onCancelEdit={() => setEditing(null)}
        />

        <div className="adm-shell" style={{ marginTop: 28 }}>
          <section className="adm-card">
            <div className="adm-card-head">
              <span className="adm-step">•</span>
              <div>
                <h2>დამატებული ტურები</h2>
                <span className="adm-hint">რედაქტირებისთვის აირჩიეთ ტური — ფორმა ავტომატურად შეივსება</span>
              </div>
            </div>
            <div className="adm-card-body">
              {loading ? (
                <p className="adm-empty">იტვირთება...</p>
              ) : tours.length === 0 ? (
                <p className="adm-empty">ჯერ არ დაგიმატებიათ ტური. შეავსეთ ზემოთ მოცემული ფორმა.</p>
              ) : (
                <div className="adm-tour-list">
                  {tours.map((tour) => (
                    <article className="adm-tour-item" key={tour.docId}>
                      <img src={tour.img || "/placeholder.svg"} alt="" />
                      <div className="adm-tour-meta">
                        <strong>{tour.title}</strong>
                        <span>
                          {tour.typeLabel}
                          {tour.duration ? ` · ${tour.duration}` : ""}
                          {tour.destinationLabel ? ` · ${tour.destinationLabel}` : ""}
                          {tour.hasGroup ? ` · ჯგუფური ${tour.priceGroup}` : ""}
                          {tour.hasPrivate ? ` · ინდივიდუალური ${tour.pricePrivate}` : ""}
                          {tour.hasVip ? ` · VIP ${tour.priceVip}` : ""}
                          {tour.departures?.length ? ` · ${tour.departures.length} გამგზავრება` : ""}
                        </span>
                      </div>
                      <div className="adm-tour-actions">
                        <Link className="adm-btn ghost" href={`/tours/${tour.id}`}>
                          ნახვა
                        </Link>
                        <button type="button" className="adm-btn ghost" onClick={() => setEditing(tour)}>
                          რედაქტირება
                        </button>
                        <button
                          type="button"
                          className="adm-btn ghost"
                          onClick={() => handleDelete(tour)}
                          disabled={busyId === tour.docId}
                          style={{ color: "#dc2626" }}
                        >
                          {busyId === tour.docId ? "იშლება..." : "წაშლა"}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
