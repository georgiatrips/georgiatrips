"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { GEORGIA_REGIONS } from "../lib/placesMeta";
import { listPlaces } from "../lib/placesFirestore";

function PlaceCard({ place }) {
  return (
    <Link href={`/places/${place.id}`} className="place-card">
      <div className="place-card-media">
        <Image src={place.img} alt={place.title} fill sizes="(max-width: 760px) 100vw, 33vw" style={{ objectFit: "cover" }} />
        <span className="place-card-region">{place.region}</span>
      </div>
      <div className="place-card-title"><h3>{place.title}</h3></div>
    </Link>
  );
}

export default function PlacesPage() {
  const [places, setPlaces] = useState([]);
  const [region, setRegion] = useState("all");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    listPlaces()
      .then((items) => active && setPlaces(items))
      .catch((err) => active && setError(err?.message || "ადგილების ჩატვირთვა ვერ მოხერხდა"))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const items = places.filter((place) => {
      if (region !== "all" && place.region !== region) return false;
      if (filter === "popular" && !place.isPopular) return false;
      return true;
    });
    if (filter === "new") {
      return [...items].sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    }
    return items;
  }, [places, region, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / 12));
  const visiblePlaces = filtered.slice((page - 1) * 12, page * 12);

  return (
    <div className="places-page">
      <Navbar active="places" />
      <main>
        <section className="places-intro">
          <div className="container places-intro-inner">
            <div>
              <span className="places-kicker">აღმოაჩინე საქართველო</span>
              <h1>ტურისტული ადგილები</h1>
              <p>მოკლე გზამკვლევი საქართველოს რეგიონებში დასამახსოვრებელი ადგილებისთვის.</p>
            </div>
          </div>
        </section>

        <section className="places-catalog-section">
          <div className="container">
            <div className="places-filter-bar" aria-label="ადგილების ფილტრები">
              <div className="places-filter-tabs">
                {[{ value: "all", label: "ყველა" }, { value: "new", label: "ახალი" }, { value: "popular", label: "პოპულარული" }].map((item) => (
                  <button key={item.value} type="button" className={filter === item.value ? "is-active" : ""} onClick={() => { setFilter(item.value); setPage(1); }}>{item.label}</button>
                ))}
              </div>
              <label className="places-region-select">
                <span>რეგიონი</span>
                <select value={region} onChange={(event) => { setRegion(event.target.value); setPage(1); }}>
                  <option value="all">ყველა რეგიონი</option>
                  {GEORGIA_REGIONS.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
            </div>

            {loading && <div className="places-state">იტვირთება...</div>}
            {!loading && error && <div className="places-state places-state-error">{error}</div>}
            {!loading && !error && filtered.length > 0 && <><div className="places-grid">{visiblePlaces.map((place) => <PlaceCard key={place.id} place={place} />)}</div><div className="catalog-pagination" aria-label="ადგილების გვერდები">{Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => <button key={number} type="button" className={page === number ? "is-active" : ""} onClick={() => setPage(number)}>{number}</button>)}</div></>}
            {!loading && !error && filtered.length === 0 && <div className="places-state"><h2>ადგილები ჯერ არ არის დამატებული</h2><p>სცადე სხვა რეგიონი ან ფილტრი.</p></div>}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}