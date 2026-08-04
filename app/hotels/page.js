"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { listHotels } from "../lib/hotelsFirestore";

function HotelCard({ hotel }) {
  const [activePhoto, setActivePhoto] = useState(0);
  const photos = hotel.gallery.length > 0 ? hotel.gallery : ["/hero.png"];
  const current = photos[Math.min(activePhoto, photos.length - 1)];

  return (
    <article className="hotel-card">
      <div className="hotel-card-media">
        <Image
          src={current || "/placeholder.svg"}
          alt={hotel.name}
          fill
          sizes="(max-width: 900px) 100vw, 440px"
          style={{ objectFit: "cover" }}
        />
        {hotel.isFeatured && <span className="hotel-badge">რეკომენდებული</span>}
        {hotel.rating && (
          <span className="hotel-rating" aria-label={`რეიტინგი ${hotel.rating} 10-დან`}>
            {hotel.rating}
          </span>
        )}

        {photos.length > 1 && (
          <div className="hotel-thumbs">
            {photos.map((photo, index) => (
              <button
                key={photo}
                type="button"
                className={`hotel-thumb ${index === activePhoto ? "active" : ""}`}
                onClick={() => setActivePhoto(index)}
                aria-label={`ფოტო ${index + 1}`}
              >
                <Image src={photo || "/placeholder.svg"} alt="" fill sizes="56px" style={{ objectFit: "cover" }} />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="hotel-card-body">
        <div className="hotel-card-head">
          <h3 className="hotel-card-title">{hotel.name}</h3>
          {hotel.city && (
            <span className="hotel-card-city">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {hotel.city}
            </span>
          )}
        </div>

        <p className="hotel-card-desc">{hotel.desc}</p>

        <div className="hotel-card-footer">
          {hotel.priceFrom ? (
            <div className="hotel-price">
              <span className="hotel-price-label">ფასი დან</span>
              <strong className="hotel-price-value">{hotel.priceFrom}</strong>
            </div>
          ) : (
            <span />
          )}

          {hotel.bookingUrl && (
            <a
              href={hotel.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hotel-book-btn"
            >
              დაჯავშნა
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M7 17L17 7M17 7H9M17 7v8" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export default function HotelsPage() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    listHotels()
      .then((items) => {
        if (active) setHotels(items);
      })
      .catch((error) => console.error("Failed to load hotels", error))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return hotels;
    return hotels.filter(
      (hotel) =>
        hotel.name.toLowerCase().includes(term) ||
        hotel.city.toLowerCase().includes(term) ||
        hotel.desc.toLowerCase().includes(term)
    );
  }, [hotels, query]);

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
          <span className="hotels-hero-eyebrow">განთავსება</span>
          <h1 className="hotels-hero-title">სასტუმროები</h1>
          <p className="hotels-hero-sub">
            შერჩეული სასტუმროები საქართველოში — აირჩიე სასურველი და დაჯავშნე პირდაპირ
            Booking.com-ზე.
          </p>
        </div>
      </section>

      <section className="hotels-list-section">
        <div className="hotels-list-inner">
          <div className="hotels-toolbar">
            <div className="hotels-toolbar-info">
              <h2 className="hotels-toolbar-title">ხელმისაწვდომი სასტუმროები</h2>
              <p className="hotels-toolbar-count">
                {loading ? "იტვირთება..." : `${filtered.length} სასტუმრო`}
              </p>
            </div>
            <div className="hotels-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="მოძებნე სასტუმრო ან ქალაქი"
                aria-label="სასტუმროს ძებნა"
              />
            </div>
          </div>

          {loading ? (
            <div className="hotels-grid">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="hotel-card hotel-card-skeleton" aria-hidden="true">
                  <div className="hotel-card-media" />
                  <div className="hotel-card-body">
                    <span className="skeleton-line skeleton-line-lg" />
                    <span className="skeleton-line" />
                    <span className="skeleton-line skeleton-line-sm" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="hotels-grid">
              {filtered.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>
          ) : (
            <div className="hotels-coming-card">
              <span className="hotels-coming-badge">ცარიელია</span>
              <h2>{hotels.length === 0 ? "სასტუმროები ჯერ არ არის დამატებული" : "ვერაფერი მოიძებნა"}</h2>
              <p>
                {hotels.length === 0
                  ? "სასტუმროების დამატება ხდება ადმინ პანელიდან — სახელი, აღწერა, ფოტოები და Booking.com-ის ლინკი."
                  : "სცადე სხვა საძიებო სიტყვა."}
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
