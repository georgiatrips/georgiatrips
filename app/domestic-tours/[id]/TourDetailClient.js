"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import BookingModal from "../../components/BookingModal";

const INCLUDED_ITEMS = [
  { key: "guide", label: "პროფესიონალი ადგილობრივი გიდი" },
  { key: "transport", label: "კომფორტული ტრანსპორტი" },
  { key: "tickets", label: "ბილეთები და შესვლის საფასური" },
  { key: "pickup", label: "სასტუმროდან წამოყვანა და დაბრუნება" },
  { key: "food", label: "კვება მარშრუტის მიხედვით" },
  { key: "hotel", label: "განთავსება (ღამისთევა)" },
  { key: "water", label: "წყალი და მსუბუქი საკვები" },
  { key: "insurance", label: "სამოგზაურო დაზღვევა" },
];

function QuickInfo({ icon, label, value }) {
  return (
    <div className="td-quick-card">
      <span className="td-quick-icon" aria-hidden="true">{icon}</span>
      <span className="td-quick-label">{label}</span>
      <span className="td-quick-value">{value}</span>
    </div>
  );
}

export default function TourDetailClient({ tour }) {
  const [booking, setBooking] = useState(false);

  const durationLabel = tour.days === 1 ? "ერთდღიანი" : `${tour.days} დღე`;

  // Build a simple day-by-day itinerary for multi-day tours.
  const itinerary =
    tour.days > 1
      ? Array.from({ length: tour.days }, (_, i) => ({
          day: i + 1,
          title:
            i === 0
              ? "ჩამოსვლა და გაცნობითი ტური"
              : i === tour.days - 1
              ? "ბოლო დღე და დაბრუნება"
              : `აქტივობები — დღე ${i + 1}`,
          desc:
            i === 0
              ? `მოგზაურობის დაწყება ${tour.region}-ის მიმართულებით. გაცნობა მარშრუტთან, პირველი ღირსშესანიშნაობები და განთავსება.`
              : i === tour.days - 1
              ? "დილის თავისუფალი დრო, ბოლო ღირსშესანიშნაობების მონახულება და კომფორტული დაბრუნება."
              : `დღის სრული პროგრამა — ${tour.region}-ის მთავარი ღირსშესანიშნაობები, ადგილობრივი სამზარეულო და დასვენება.`,
        }))
      : [];

  const handleShare = async () => {
    const shareData = {
      title: tour.title,
      text: tour.desc,
      url: typeof window !== "undefined" ? window.location.href : "",
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.url);
        alert("ბმული დაკოპირდა");
      }
    } catch {
      /* user cancelled — no-op */
    }
  };

  return (
    <>
      <Navbar active="tours" />

      {/* ==================== HERO ==================== */}
      <header className="td-hero">
        <Image
          src={tour.img || "/placeholder.svg"}
          alt={tour.title}
          fill
          priority
          sizes="100vw"
          className="td-hero-img"
        />
        <div className="td-hero-overlay" />
        <div className="td-hero-content">
          <Link href="/domestic-tours" className="td-back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            ტურებზე დაბრუნება
          </Link>
          <div className="td-hero-badges">
            <span className={`td-type-badge ${tour.type}`}>
              {tour.type === "individual" ? "ინდივიდუალური" : "ჯგუფური"}
            </span>
            <span className="td-region-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
              {tour.region}
            </span>
          </div>
          <h1 className="td-hero-title">{tour.title}</h1>
        </div>
      </header>

      {/* ==================== MAIN ==================== */}
      <main className="td-main">
        <div className="td-inner">
          <div className="td-grid">
            {/* ---------- LEFT ---------- */}
            <div className="td-left">
              <div className="td-quick-info">
                <QuickInfo icon="⏱" label="ხანგრძლივობა" value={durationLabel} />
                <QuickInfo icon="🌤" label="სეზონი" value={tour.season} />
                <QuickInfo icon="👥" label="ჯგუფის ზომა" value={tour.people} />
                <QuickInfo icon="★" label="რეიტინგი" value={tour.rating.toFixed(1)} />
              </div>

              <section className="td-section">
                <h2 className="td-section-title">ტურის შესახებ</h2>
                <p className="td-text">{tour.longDesc || tour.desc}</p>
              </section>

              <section className="td-section">
                <h2 className="td-section-title">ტურის მთავარი მომენტები</h2>
                <ul className="td-highlights">
                  {tour.highlights.map((h) => (
                    <li key={h}>
                      <span className="td-highlight-dot" aria-hidden="true" />
                      {h}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="td-section">
                <h2 className="td-section-title">რა შედის ფასში</h2>
                <ul className="td-included">
                  {INCLUDED_ITEMS.map((item) => {
                    const inc = !!tour.included[item.key];
                    return (
                      <li key={item.key} className={inc ? "inc" : "exc"}>
                        <span className="td-inc-icon" aria-hidden="true">
                          {inc ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                          )}
                        </span>
                        <span>{item.label}</span>
                      </li>
                    );
                  })}
                </ul>
              </section>

              {itinerary.length > 0 && (
                <section className="td-section">
                  <h2 className="td-section-title">დღიური მარშრუტი</h2>
                  <div className="td-itinerary">
                    {itinerary.map((d) => (
                      <div className="td-itin-day" key={d.day}>
                        <div className="td-itin-marker">
                          <span className="td-itin-num">{d.day}</span>
                        </div>
                        <div className="td-itin-body">
                          <h4>{d.title}</h4>
                          <p>{d.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* ---------- RIGHT (booking sidebar) ---------- */}
            <aside className="td-sidebar">
              <div className="td-booking-card">
                <div className="td-price-row">
                  <span className="td-price">₾{tour.price}</span>
                  <span className="td-price-label">/ ადამიანზე</span>
                </div>

                <button className="td-book-btn" onClick={() => setBooking(true)}>
                  ტურის დაჯავშნა
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </button>

                <button className="td-share-btn" onClick={handleShare}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
                  გაზიარება
                </button>

                <ul className="td-features">
                  <li><span className="td-feat-check" aria-hidden="true">✓</span> ონლაინ დაჯავშნა</li>
                  <li><span className="td-feat-check" aria-hidden="true">✓</span> საუკეთესო ფასის გარანტია</li>
                  <li><span className="td-feat-check" aria-hidden="true">✓</span> უსაფრთხო და დაზღვეული</li>
                  <li><span className="td-feat-check" aria-hidden="true">✓</span> 24/7 მხარდაჭერა</li>
                </ul>

                <div className="td-contact">
                  <h4>გაქვს კითხვები?</h4>
                  <p>დაგვიკავშირდი პირდაპირ დამატებითი ინფორმაციისთვის</p>
                  <Link href="/#booking" className="td-contact-link">დაკავშირება</Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />

      {booking && <BookingModal tour={tour} onClose={() => setBooking(false)} />}
    </>
  );
}
