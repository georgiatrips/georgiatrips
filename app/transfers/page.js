"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import DatePicker from "../components/DatePicker";
import { WA_LINK, WA_NUMBER, PHONE_DISPLAY, WhatsAppIcon } from "../lib/shared";

export default function TransfersPage() {
  const [selectedVehicle, setSelectedVehicle] = useState("მინივენი (6 მგზავრი)");
  const [pickupLoc, setPickupLoc] = useState("");
  const [dropoffLoc, setDropoffLoc] = useState("");
  const [transferDate, setTransferDate] = useState("");
  const [passengerCount, setPassengerCount] = useState("2");
  const [contactPhone, setContactPhone] = useState("");
  const [notes, setNotes] = useState("");

  const fleet = [
    {
      id: "sedan",
      name: "სედანი",
      subtitle: "კომფორტული სედანი",
      capacity: "მაქსიმუმ 3 მგზავრი",
      paxNum: 3,
      price: "₾80-დან",
      img: "1car.webp",
      fallbackImg: "/car1.png",
      badge: "ეკონომი & კომფორტი",
      features: ["კონდიციონერი", "3x ჩემოდანი", "უფასო Wi-Fi & წყალი", "გამოცდილი მძღოლი"]
    },
    {
      id: "minivan",
      name: "მინივენი",
      subtitle: "საოჯახო & ჯგუფური",
      capacity: "მაქსიმუმ 6 მგზავრი",
      paxNum: 6,
      price: "₾130",
      img: "2car.webp",
      fallbackImg: "/car2.png",
      badge: "ყველაზე მოთხოვნადი",
      features: ["ორმაგი კონდიციონერი", "6x ჩემოდანი", "კომფორტული სავარძლები", "გამოცდილი მძღოლი"]
    },
    {
      id: "vito",
      name: "ვიტო",
      subtitle: "Mercedes-Benz Vito / V-Class",
      capacity: "მაქსიმუმ 7 მგზავრი",
      paxNum: 7,
      price: "₾160-დან",
      img: "3car.webp",
      fallbackImg: "/car3.png",
      badge: "VIP პრემიუმი",
      features: ["VIP ტყავის სალონი", "კლიმატკონტროლი", "7x ჩემოდანი", "დიდი საბარგული"]
    },
    {
      id: "sprinter",
      name: "სპრინტერი",
      subtitle: "Mercedes-Benz Sprinter",
      capacity: "მაქსიმუმ 16 მგზავრი",
      paxNum: 16,
      price: "₾250-დან",
      img: "4car.webp",
      fallbackImg: "/car4.png",
      badge: "დიდი ჯგუფებისთვის",
      features: ["ტურისტული სავარძლები", "მაღალი ჭერი", "დიდი საბარგული", "აუდიო-ვიდეო სისტემა"]
    },
    {
      id: "bus",
      name: "ავტობუსი",
      subtitle: "Luxury Tourist Coach",
      capacity: "მაქსიმუმ 40 მგზავრი",
      paxNum: 40,
      price: "₾500-დან",
      img: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80",
      fallbackImg: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80",
      badge: "დიდი დელეგაციები",
      features: ["პანორამული ფანჯრები", "მიკროფონი & TV", "მაქსიმალური ტევადობა", "VIP მომსახურება"]
    }
  ];

  const airportTransfers = [
    {
      city: "თბილისი",
      title: "თბილისის აეროპორტი (TBS) ↔ სასტუმრო / ქალაქი",
      desc: "24/7 დახვედრა აეროპორტში სახელიანი აბრით, ბარგის მიშველება და პირდაპირი კომფორტული ტრანსფერი სასტუმრომდე.",
      price: "₾60-დან",
      icon: "🛫"
    },
    {
      city: "ბათუმი",
      title: "ბათუმის აეროპორტი (BUS) ↔ სასტუმრო / ქალაქი",
      desc: "მყისიერი ტრანსფერი ბათუმის აეროპორტიდან ბათუმის, ქობულეთისა და ჩაქვის სასტუმროებამდე.",
      price: "₾50-დან",
      icon: "🌊"
    },
    {
      city: "ქუთაისი",
      title: "ქუთაისის აეროპორტი (KUT) ↔ სასტუმრო / თბილისი / ბათუმი",
      desc: "24/7 დახვედრა ქუთაისის საერთაშორისო აეროპორტში და ტრანსფერი ნებისმიერ ქალაქში.",
      price: "₾90-დან",
      icon: "✈️"
    }
  ];

  const intercityRoutes = [
    { from: "თბილისი", to: "ბათუმი / აჭარა", price: "₾300-დან", duration: "5-6 საათი" },
    { from: "თბილისი", to: "ყაზბეგი / გუდაური", price: "₾200-დან", duration: "3 საათი" },
    { from: "ბათუმი", to: "ქუთაისი / მარტვილი", price: "₾180-დან", duration: "2.5 საათი" },
    { from: "თბილისი", to: "კახეთი (სიღნაღი)", price: "₾180-დან", duration: "2 საათი" },
    { from: "ბათუმი", to: "სვანეთი (მესტია)", price: "₾350-დან", duration: "5 საათი" },
    { from: "ქუთაისი", to: "თბილისი", price: "₾220-დან", duration: "3.5 საათი" }
  ];

  const handleVehicleBook = (vName) => {
    setSelectedVehicle(vName);
    const elem = document.getElementById("transfer-booking-form");
    if (elem) elem.scrollIntoView({ behavior: "smooth" });
  };

  const handleTransferSubmit = (e) => {
    e.preventDefault();
    const lines = [
      `🚗 *GeorgiaTrips — ტრანსპორტის & ტრანსფერის ჯავშანი*`,
      `━━━━━━━━━━━━━━━━━━`,
      `🚘 *ავტომობილი:* ${selectedVehicle}`,
      `📍 *საიდან:* ${pickupLoc.trim() || "მითითებული არ არის"}`,
      `🏁 *სად:* ${dropoffLoc.trim() || "მითითებული არ არის"}`,
      `📅 *თარიღი:* ${transferDate || "შეთანხმებით"}`,
      `👥 *მგზავრები:* ${passengerCount} კაცი`,
      `📞 *ტელეფონი:* ${contactPhone.trim() || "მითითებული არ არის"}`,
      notes.trim() ? `📝 *შენიშვნა:* ${notes.trim()}` : ""
    ].filter(Boolean);

    window.open(`${WA_LINK}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank");
  };

  return (
    <div className="transfers-page-wrapper">
      <Navbar active="transfers" />

      {/* HERO SECTION */}
      <section className="transfers-hero">
        <div className="transfers-hero-bg">
          <Image
            src="/hero.png"
            alt="პრემიუმ ტრანსპორტი & ტრანსფერები საქართველოში"
            fill
            priority
            style={{ objectFit: "cover" }}
          />
          <div className="transfers-hero-scrim" />
        </div>
        <div className="container transfers-hero-content">
          <span className="transfers-hero-badge">✦ პრემიუმ ავტოპარკი & ტრანსფერები</span>
          <h1 className="transfers-hero-title">კომფორტული მგზავრობა საქართველოში</h1>
          <p className="transfers-hero-sub">
            აეროპორტის დახვედრა 24/7, საქალაქთაშორისო ტრანსფერები და ინდივიდუალური ავტომობილების იჯარა გამოცდილ მძღოლთან ერთად.
          </p>
          <div className="transfers-hero-pills">
            <span className="th-pill">🚗 სედანი & SUV</span>
            <span className="th-pill">🚐 მინივენი & ვიტო</span>
            <span className="th-pill">🚌 სპრინტერი & ავტობუსი</span>
            <span className="th-pill">🛫 24/7 აეროპორტი</span>
          </div>
        </div>
      </section>

      {/* SECTION 1: VEHICLE FLEET & SERVICES */}
      <section className="section transfers-fleet-section" id="fleet">
        <div className="container">
          <div className="section-header" style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <span className="section-eyebrow">ავტოპარკი & მომსახურება</span>
            <h2 className="section-title">აირჩიეთ სასურველი ავტომობილი</h2>
            <p className="section-desc">ყველა ტიპის ავტომობილი პროფესიონალ მძღოლთან ერთად</p>
            <div className="gold-line" />
          </div>

          <div className="fleet-grid">
            {fleet.map((car) => (
              <article key={car.id} className="fleet-card">
                <div className="fleet-card-media">
                  <img
                    src={car.img}
                    onError={(e) => { e.currentTarget.src = car.fallbackImg; }}
                    alt={car.name}
                    className="fleet-card-img"
                  />
                  <span className="fleet-badge">{car.badge}</span>
                  <div className="fleet-pax-tag">
                    <span>👥 {car.capacity}</span>
                  </div>
                </div>

                <div className="fleet-card-body">
                  <div className="fleet-card-header">
                    <div>
                      <h3 className="fleet-card-title">{car.name}</h3>
                      <span className="fleet-card-sub">{car.subtitle}</span>
                    </div>
                    <div className="fleet-card-price">{car.price}</div>
                  </div>

                  <ul className="fleet-features-list">
                    {car.features.map((feat, fIdx) => (
                      <li key={fIdx}>
                        <span className="feat-check">✓</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    className="btn-fleet-book"
                    onClick={() => handleVehicleBook(`${car.name} (${car.capacity})`)}
                  >
                    <span>დაჯავშნა</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2: AIRPORT TRANSFERS */}
      <section className="section transfers-airports-section" id="airports">
        <div className="container">
          <div className="section-header" style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <span className="section-eyebrow">24/7 ტრანსფერები</span>
            <h2 className="section-title">აეროპორტის დახვედრა & ტრანსფერები</h2>
            <p className="section-desc">თბილისის, ბათუმისა და ქუთაისის აეროპორტები</p>
            <div className="gold-line" />
          </div>

          <div className="airports-grid">
            {airportTransfers.map((item, idx) => (
              <div key={idx} className="airport-card">
                <div className="airport-icon-wrap">
                  <span className="airport-icon">{item.icon}</span>
                </div>
                <div className="airport-info">
                  <span className="airport-city-pill">{item.city}</span>
                  <h3 className="airport-card-title">{item.title}</h3>
                  <p className="airport-card-desc">{item.desc}</p>
                </div>
                <div className="airport-card-footer">
                  <span className="airport-price">{item.price}</span>
                  <button
                    type="button"
                    className="btn-airport-book"
                    onClick={() => handleVehicleBook(`აეროპორტი: ${item.title}`)}
                  >
                    დაჯავშნა
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: PRIVATE INTERCITY ROUTES */}
      <section className="section transfers-routes-section" id="routes">
        <div className="container">
          <div className="section-header" style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <span className="section-eyebrow">კერძო ტრანსფერები</span>
            <h2 className="section-title">საქალაქთაშორისო მარშრუტები</h2>
            <p className="section-desc">პირდაპირი კომფორტული მგზავრობა საქართველოს ნებისმიერ ქალაქში</p>
            <div className="gold-line" />
          </div>

          <div className="routes-grid">
            {intercityRoutes.map((route, idx) => (
              <div key={idx} className="route-card">
                <div className="route-cities">
                  <strong>{route.from}</strong>
                  <span className="route-arrow">➔</span>
                  <strong>{route.to}</strong>
                </div>
                <div className="route-meta">
                  <span className="route-time">⏱ {route.duration}</span>
                  <span className="route-price">{route.price}</span>
                </div>
                <button
                  type="button"
                  className="btn-route-book"
                  onClick={() => {
                    setPickupLoc(route.from);
                    setDropoffLoc(route.to);
                    handleVehicleBook(`კერძო ტრანსფერი: ${route.from} ➔ ${route.to}`);
                  }}
                >
                  დაჯავშნა
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: TRANSFER BOOKING FORM */}
      <section className="section transfers-booking-section" id="transfer-booking-form">
        <div className="container" style={{ maxWidth: "780px" }}>
          <div className="transfers-form-card">
            <div className="transfers-form-header">
              <h2>ონლაინ ტრანსფერის ჯავშანი</h2>
              <p>შეავსეთ მონაცემები და მყისიერად გადადით WhatsApp დასტურზე</p>
            </div>

            <form onSubmit={handleTransferSubmit} className="transfers-form-grid">


              <div className="tf-row">
                <div className="tf-group">
                  <label>აყვანის მისამართი (საიდან)</label>
                  <input
                    type="text"
                    placeholder="მაგ: თბილისის აეროპორტი..."
                    value={pickupLoc}
                    onChange={(e) => setPickupLoc(e.target.value)}
                    required
                    className="tf-input"
                  />
                </div>

                <div className="tf-group">
                  <label>ჩასვლის მისამართი (სად)</label>
                  <input
                    type="text"
                    placeholder="მაგ: ბათუმი, სასტუმრო..."
                    value={dropoffLoc}
                    onChange={(e) => setDropoffLoc(e.target.value)}
                    required
                    className="tf-input"
                  />
                </div>
              </div>

              <div className="tf-row">
                <div className="tf-group">
                  <label>მგზავრობის თარიღი</label>
                  <DatePicker
                    value={transferDate}
                    onChange={(dStr) => setTransferDate(dStr)}
                    placeholder="აირჩიეთ თარიღი"
                    direction="down"
                  />
                </div>

                <div className="tf-group">
                  <label>მგზავრთა რაოდენობა</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={passengerCount}
                    onChange={(e) => setPassengerCount(e.target.value)}
                    required
                    className="tf-input"
                  />
                </div>
              </div>

              <div className="tf-group">
                <label>ტელეფონის ნომერი / WhatsApp</label>
                <input
                  type="tel"
                  placeholder="+995 5XX XX XX XX"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  required
                  className="tf-input"
                />
              </div>

              <div className="tf-group">
                <label>დამატებითი შენიშვნა (ფრენის ნომერი, ბარგი...)</label>
                <textarea
                  rows={2}
                  placeholder="მაგ: ფრენის ნომერი TK382, 3 ჩემოდანი..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="tf-input"
                />
              </div>

              <button type="submit" className="btn-tf-submit">
                <span>დაჯავშნა</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
