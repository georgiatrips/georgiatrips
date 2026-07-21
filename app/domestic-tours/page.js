"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BookingModal from "../components/BookingModal";

// ============================================================
// DOMESTIC TOURS DATA
// type: "individual" | "group"   /   days: number (1 = one-day)
// ============================================================
const DOMESTIC_TOURS = [
  {
    id: "tbilisi-city",
    img: "/tbilisi.png",
    title: "თბილისის ქალაქური ტური",
    region: "თბილისი",
    desc: "მეტეხიდან ნარიყალამდე — ისტორია, ძველი ქალაქის აბანოები, ქართული სამზარეულო და ულამაზესი ხედები.",
    price: 150,
    days: 1,
    type: "group",
    people: "2-12 კაცი",
    rating: 4.9,
    highlights: ["ნარიყალას ციხე", "აბანოთუბანი", "მშრალი ხიდის ბაზრობა"],
  },
  {
    id: "kazbegi-mountains",
    img: "/hero.png",
    title: "ყაზბეგის მთები & გერგეთი",
    region: "ყაზბეგი",
    desc: "გერგეთის სამება, ულამაზესი ხედი მყინვარწვერზე, დაუვიწყარი ხეობები და ავთენტური მთის ხინკალი.",
    price: 170,
    days: 1,
    type: "group",
    people: "2-15 კაცი",
    rating: 5.0,
    highlights: ["გერგეთის სამება", "ჟინვალის წყალსაცავი", "ანანურის ციხე"],
  },
  {
    id: "kakheti-wine",
    img: "/kakheti.png",
    title: "კახეთის ღვინის ტური",
    region: "კახეთი",
    desc: "სიღნაღი, ბოდბის მონასტერი, ტრადიციული ქვევრის ღვინის დეგუსტაცია და ქართული სუფრა კახურ მარანში.",
    price: 180,
    days: 1,
    type: "group",
    people: "2-10 კაცი",
    rating: 4.8,
    highlights: ["სიღნაღი", "ბოდბის მონასტერი", "ღვინის დეგუსტაცია"],
  },
  {
    id: "mtskheta-half",
    img: "/tbilisi.png",
    title: "მცხეთა — ძველი დედაქალაქი",
    region: "მცხეთა",
    desc: "ჯვრის მონასტერი, სვეტიცხოვლის საკათედრო ტაძარი და ორი მდინარის შესართავის პანორამა.",
    price: 90,
    days: 1,
    type: "individual",
    people: "1-4 კაცი",
    rating: 4.7,
    highlights: ["ჯვრის მონასტერი", "სვეტიცხოველი", "შიომღვიმე"],
  },
  {
    id: "batumi-coast",
    img: "/batumi.png",
    title: "ბათუმის სანაპირო & ბულვარი",
    region: "ბათუმი / აჭარა",
    desc: "შავი ზღვის სანაპირო, ულამაზესი ბულვარი, ბოტანიკური ბაღი და აჭარული ხაჭაპურის მასტერკლასი.",
    price: 200,
    days: 2,
    type: "group",
    people: "2-8 კაცი",
    rating: 4.9,
    highlights: ["ბულვარი", "ბოტანიკური ბაღი", "ალფავიტის კოშკი"],
  },
  {
    id: "svaneti-adventure",
    img: "/mestia.png",
    title: "მესტიის თავგადასავალი",
    region: "სვანეთი",
    desc: "სვანური კოშკები, უშგული — ევროპაში ყველაზე მაღალი დასახლება, უნიკალური კულტურა და მთის მწვერვალები.",
    price: 350,
    days: 3,
    type: "group",
    people: "2-6 კაცი",
    rating: 5.0,
    highlights: ["სვანური კოშკები", "უშგული", "ჭალაადის მყინვარი"],
  },
  {
    id: "gudauri-ski",
    img: "/gudauri.png",
    title: "გუდაური — ალპური თავგადასავალი",
    region: "გუდაური",
    desc: "თხილამურები, პარაპლანით ფრენა და ალპური პანორამა კავკასიონის მთებზე, სრული კომფორტით.",
    price: 240,
    days: 2,
    type: "individual",
    people: "1-4 კაცი",
    rating: 4.8,
    highlights: ["საბაგირო", "პარაპლანი", "ყაზბეგის ხედი"],
  },
  {
    id: "adjara-mountains",
    img: "/villa.png",
    title: "მთიანი აჭარა — ხულო & გოდერძი",
    region: "აჭარა",
    desc: "აღმოაჩინეთ მაღალმთიანი აჭარის საოცრებები — საბაგირო ხულოში, მწვანე ტბა და გოდერძის უღელტეხილი.",
    price: 120,
    days: 1,
    type: "group",
    people: "2-10 კაცი",
    rating: 4.7,
    highlights: ["ხულოს საბაგირო", "მწვანე ტბა", "გოდერძი"],
  },
  {
    id: "borjomi-nature",
    img: "/kakheti.png",
    title: "ბორჯომი & ბაკურიანი",
    region: "სამცხე-ჯავახეთი",
    desc: "ცნობილი მინერალური წყლის პარკი, რომანოვების სასახლე და მწვანე ტყეები ბაკურიანში.",
    price: 110,
    days: 1,
    type: "group",
    people: "2-12 კაცი",
    rating: 4.6,
    highlights: ["ცენტრალური პარკი", "მინერალური წყალი", "ბაკურიანი"],
  },
  {
    id: "vip-private",
    img: "/villa.png",
    title: "VIP ინდივიდუალური ტური",
    region: "მთელი საქართველო",
    desc: "სრულად პერსონალიზებული მარშრუტი პირადი გიდით, პრემიუმ ავტომობილითა და ექსკლუზიური სერვისით.",
    price: 800,
    days: 5,
    type: "individual",
    people: "1-4 კაცი",
    rating: 5.0,
    highlights: ["პირადი გიდი", "პრემიუმ ტრანსპორტი", "მოქნილი გრაფიკი"],
  },
  {
    id: "racha-lechkhumi",
    img: "/mestia.png",
    title: "რაჭის ხეობები",
    region: "რაჭა",
    desc: "შაორის წყალსაცავი, ნიკორწმინდის ტაძარი, ულამაზესი ხეობები და ავთენტური რაჭული სამზარეულო.",
    price: 280,
    days: 2,
    type: "individual",
    people: "1-5 კაცი",
    rating: 4.8,
    highlights: ["შაორი", "ნიკორწმინდა", "ბარაკონი"],
  },
  {
    id: "family-package",
    img: "/hero.png",
    title: "საოჯახო პაკეტი",
    region: "მრავალი რეგიონი",
    desc: "სპეციალურად დაგეგმილი მშვიდი მარშრუტები ბავშვებთან ერთად, კომფორტული მგზავრობითა და დასვენებით.",
    price: 450,
    days: 5,
    type: "group",
    people: "4-8 კაცი",
    rating: 4.9,
    highlights: ["ბავშვებზე მორგებული", "დასვენება", "აქტივობები"],
  },
];

const TYPE_TABS = [
  { key: "all", label: "ყველა ტიპი" },
  { key: "individual", label: "ინდივიდუალური" },
  { key: "group", label: "ჯგუფური" },
];

const DURATION_TABS = [
  { key: "all", label: "ნებისმიერი ხანგრძლივობა" },
  { key: "one", label: "ერთდღიანი" },
  { key: "multi", label: "მრავალდღიანი" },
];

const SORT_OPTIONS = [
  { key: "recommended", label: "რეკომენდებული" },
  { key: "price-asc", label: "ფასი: დაბლიდან მაღლა" },
  { key: "price-desc", label: "ფასი: მაღლიდან დაბლა" },
  { key: "rating", label: "რეიტინგით" },
];

// Reusable premium filter dropdown (custom styled <select> replacement).
function FilterDropdown({ icon, options, value, onChange, ariaLabel }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find((o) => o.key === value) || options[0];

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={`dt-dd ${open ? "open" : ""}`} ref={ref}>
      <button
        type="button"
        className="dt-dd-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="dt-dd-icon">{icon}</span>
        <span className="dt-dd-value">{selected.label}</span>
        <svg className="dt-dd-caret" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ul className="dt-dd-menu" role="listbox" aria-label={ariaLabel}>
          {options.map((o) => (
            <li key={o.key} role="option" aria-selected={o.key === value}>
              <button
                type="button"
                className={`dt-dd-option ${o.key === value ? "active" : ""}`}
                onClick={() => {
                  onChange(o.key);
                  setOpen(false);
                }}
              >
                {o.label}
                {o.key === value && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const TypeIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);
const DurationIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
);
const SortIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18M6 12h12M10 18h4" /></svg>
);

const StarRating = ({ value }) => {
  const full = Math.round(value);
  return (
    <span className="dt-rating" aria-label={`რეიტინგი ${value} 5-დან`}>
      {"★".repeat(full)}
      {"☆".repeat(5 - full)}
      <span className="dt-rating-num">{value.toFixed(1)}</span>
    </span>
  );
};

export default function DomesticToursPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [duration, setDuration] = useState("all");
  const [sort, setSort] = useState("recommended");
  const [bookingTour, setBookingTour] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = DOMESTIC_TOURS.filter((t) => {
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.region.toLowerCase().includes(q) ||
        t.desc.toLowerCase().includes(q);
      const matchesType = type === "all" || t.type === type;
      const matchesDuration =
        duration === "all" ||
        (duration === "one" && t.days === 1) ||
        (duration === "multi" && t.days > 1);
      return matchesSearch && matchesType && matchesDuration;
    });

    const sorted = [...list];
    if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    else if (sort === "rating") sorted.sort((a, b) => b.rating - a.rating);
    return sorted;
  }, [search, type, duration, sort]);

  const activeFilterCount =
    (type !== "all" ? 1 : 0) +
    (duration !== "all" ? 1 : 0) +
    (sort !== "recommended" ? 1 : 0) +
    (search ? 1 : 0);

  const resetFilters = () => {
    setSearch("");
    setType("all");
    setDuration("all");
    setSort("recommended");
  };

  return (
    <>
      <Navbar active="tours" />

      {/* ==================== PAGE HERO ==================== */}
      <header className="dt-hero">
        <div className="dt-hero-overlay" />
        <div className="dt-hero-content">
          <span className="dt-eyebrow">აღმოაჩინე საქართველო</span>
          <h1 className="dt-hero-title">შიდა ტურები</h1>
          <p className="dt-hero-desc">
            ერთდღიანი და მრავალდღიანი, ინდივიდუალური თუ ჯგუფური — იპოვე შენთვის სრულყოფილი
            მოგზაურობა საქართველოს ულამაზეს კუთხეებში.
          </p>
          <nav className="dt-breadcrumb" aria-label="ნავიგაცია">
            <Link href="/">მთავარი</Link>
            <span className="dt-sep">›</span>
            <span>ტურები</span>
            <span className="dt-sep">›</span>
            <span className="dt-current">შიდა ტურები</span>
          </nav>
        </div>
      </header>

      {/* ==================== SEARCH & FILTERS ==================== */}
      <section className="dt-section">
        <div className="dt-inner">
          <div className="section-header dt-section-header">
            <span className="section-eyebrow">მოძებნე</span>
            <h2 className="section-title">იპოვე შენი ტური</h2>
            <p className="section-desc">
              გამოიყენე ძიება და ფილტრები, რომ სწრაფად იპოვო შენს დროსა და ინტერესებზე მორგებული ტური.
            </p>
            <div className="gold-line" />
          </div>

          {/* Search + filter toolbar */}
          <div className="dt-toolbar">
            <div className="dt-search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="მოძებნე ტური, რეგიონი ან მიმართულება..."
                aria-label="ტურის ძიება"
              />
              {search && (
                <button className="dt-search-clear" onClick={() => setSearch("")} aria-label="ძიების გასუფთავება">✕</button>
              )}
            </div>

            <div className="dt-toolbar-filters">
              <FilterDropdown icon={TypeIcon} options={TYPE_TABS} value={type} onChange={setType} ariaLabel="ტურის ტიპი" />
              <FilterDropdown icon={DurationIcon} options={DURATION_TABS} value={duration} onChange={setDuration} ariaLabel="ტურის ხანგრძლივობა" />
              <FilterDropdown icon={SortIcon} options={SORT_OPTIONS} value={sort} onChange={setSort} ariaLabel="დახარისხება" />
            </div>
          </div>

          {/* Result count */}
          <div className="dt-results-row">
            <span className="dt-result-count">
              ნაპოვნია <strong>{filtered.length}</strong> ტური
            </span>
            {activeFilterCount > 0 && (
              <button className="dt-reset" onClick={resetFilters}>ფილტრების გასუფთავება</button>
            )}
          </div>

          {/* Tour grid */}
          {filtered.length > 0 ? (
            <div className="dt-grid" role="list">
              {filtered.map((tour) => (
                <article className="dt-card" key={tour.id} role="listitem">
                  <div className="dt-card-img-wrap">
                    <Image
                      src={tour.img || "/placeholder.svg"}
                      alt={tour.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="dt-card-img"
                    />
                    <span className={`dt-type-badge ${tour.type}`}>
                      {tour.type === "individual" ? "ინდივიდუალური" : "ჯგუფური"}
                    </span>
                    <span className="dt-price-badge">₾{tour.price}-დან</span>
                  </div>
                  <div className="dt-card-body">
                    <div className="dt-card-meta">
                      <span className="dt-meta-item">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        {tour.days === 1 ? "ერთდღიანი" : `${tour.days} დღე`}
                      </span>
                      <span className="dt-meta-item">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                        {tour.people}
                      </span>
                      <span className="dt-meta-item dt-meta-region">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                        {tour.region}
                      </span>
                    </div>
                    <h3 className="dt-card-title">{tour.title}</h3>
                    <p className="dt-card-desc">{tour.desc}</p>
                    <ul className="dt-highlights">
                      {tour.highlights.map((h) => (
                        <li key={h}>{h}</li>
                      ))}
                    </ul>
                    <div className="dt-card-footer">
                      <StarRating value={tour.rating} />
                      <button
                        className="dt-book-btn"
                        onClick={() => setBookingTour(tour)}
                      >
                        დაჯავშნა
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="dt-empty">
              <div className="dt-empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
              </div>
              <h3>ტური ვერ მოიძებნა</h3>
              <p>სცადე სხვა საძიებო სიტყვა ან შეცვალე ფილტრები.</p>
              <button className="dt-reset" onClick={resetFilters}>ფილტრების გასუფთავება</button>
            </div>
          )}
        </div>
      </section>

      {/* ==================== WHY BOOK WITH US ==================== */}
      <section className="dt-why">
        <div className="dt-inner">
          <div className="section-header">
            <span className="section-eyebrow" style={{ color: "var(--teal)" }}>რატომ ჩვენ</span>
            <h2 className="section-title" style={{ color: "var(--white)" }}>რატომ დაჯავშნო GeorgiaTrips-თან</h2>
            <div className="gold-line" style={{ background: "linear-gradient(90deg, var(--yellow), transparent)" }} />
          </div>
          <div className="dt-why-grid">
            {[
              { icon: "🏔️", title: "ადგილობრივი გიდები", desc: "პროფესიონალი გიდები, რომლებიც შენს ენაზე საუბრობენ და საქართველოს ისტორიას იცნობენ." },
              { icon: "🚐", title: "კომფორტული ტრანსპორტი", desc: "თანამედროვე, კონდიცირებული ავტომობილები ყველა მარშრუტისთვის, უსაფრთხოების უმაღლესი დონით." },
              { icon: "💰", title: "საუკეთესო ფასები", desc: "გამჭვირვალე ფასები დამალული გადასახადების გარეშე და შესანიშნავი შეთავაზებები." },
              { icon: "🔒", title: "უსაფრთხო მოგზაურობა", desc: "ყველა ტური მოიცავს დაზღვევასა და სწრაფ დახმარებას საჭიროების შემთხვევაში." },
            ].map((item) => (
              <div className="dt-why-card" key={item.title}>
                <div className="dt-why-icon">{item.icon}</div>
                <h4>{item.title}</h4>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />

      {bookingTour && (
        <BookingModal tour={bookingTour} onClose={() => setBookingTour(null)} />
      )}
    </>
  );
}
