"use client";

import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { WA_LINK } from "../lib/shared";
import "./hotels.css";

export default function HotelsPage() {
  return (
    <>
      <Navbar active="hotels" />

      <main className="htl-page">
        <section className="htl-hero">
          <div className="htl-hero-inner">
            <span className="htl-eyebrow">GeorgiaTrips · განთავსება</span>
            <h1>სასტუმროები საქართველოში</h1>
            <p>
              შერჩეული სასტუმროები, სასტუმრო სახლები და აპარტამენტები ტურების მარშრუტების
              გასწვრივ — მალე აქ იხილავთ სრულ კატალოგს ფასებით და თავისუფალი ნომრებით.
            </p>
          </div>
        </section>

        <div className="htl-body">
          <div className="htl-panel">
            <span className="htl-panel-icon" aria-hidden="true">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18" />
                <path d="M5 21V7l7-4 7 4v14" />
                <path d="M9 21v-6h6v6" />
                <path d="M9 10h.01M15 10h.01" />
              </svg>
            </span>
            <h2>სასტუმროების კატალოგი მზადების პროცესშია</h2>
            <p>
              ამ გვერდზე მალე დაემატება სასტუმროები — ლოკაცია, ფოტოგალერეა, ნომრების ტიპები
              და ფასები. სანამ კატალოგი გამოქვეყნდება, განთავსების დაჯავშნაში დახმარებას
              პირდაპირ გაგიწევთ ჩვენი გუნდი.
            </p>
            <div className="htl-cta-row">
              <a className="htl-btn primary" href={WA_LINK} target="_blank" rel="noopener noreferrer">
                დაგვიკავშირდით WhatsApp-ზე
              </a>
              <Link className="htl-btn ghost" href="/tours">
                ტურების ნახვა
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
