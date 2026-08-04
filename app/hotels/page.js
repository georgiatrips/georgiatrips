"use client";

import Image from "next/image";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function HotelsPage() {
  return (
    <div className="hotels-page">
      <Navbar active="hotels" />

      <section className="hotels-hero">
        <div className="hotels-hero-bg">
          <Image
            src="/hero.png"
            alt="სასტუმროები საქართველოში"
            fill
            priority
            style={{ objectFit: "cover" }}
            sizes="100vw"
          />
        </div>
        <div className="hotels-hero-scrim" />
        <div className="hotels-hero-content">
          <span className="hotels-hero-eyebrow">მალე</span>
          <h1 className="hotels-hero-title">სასტუმროები</h1>
          <p className="hotels-hero-sub">
            აქ მალე გამოჩნდება შერჩეული სასტუმროები საქართველოში — დაგველოდეთ.
          </p>
        </div>
      </section>

      <section className="hotels-coming">
        <div className="container hotels-coming-inner">
          <div className="hotels-coming-card">
            <span className="hotels-coming-badge">მიმდინარეობს მომზადება</span>
            <h2>სასტუმროების კატალოგი მალე დაემატება</h2>
            <p>
              ამ გვერდზე მოგვიანებით გამოჩნდება სასტუმროების სია, ფილტრები და დაჯავშნის
              შესაძლებლობა. დიზაინი და კონტენტი ცალკე დაემატება.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
