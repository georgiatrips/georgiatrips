"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { getPlace, listPlaces } from "../../lib/placesFirestore";

function SmallPlaceCard({ place }) {
  return <Link href={`/places/${place.id}`} className="place-mini-card"><div className="place-mini-media"><Image src={place.img} alt={place.title} fill sizes="180px" style={{ objectFit: "cover" }} /></div><div><span>{place.region}</span><h3>{place.title}</h3></div></Link>;
}

export default function PlaceDetailPage() {
  const { id } = useParams();
  const [place, setPlace] = useState(null);
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([getPlace(id), listPlaces()]).then(([item, items]) => { setPlace(item); setAll(items); }).finally(() => setLoading(false));
  }, [id]);

  const similar = useMemo(() => place ? all.filter((item) => item.id !== place.id && item.region === place.region).slice(0, 3) : [], [all, place]);
  const popular = useMemo(() => place ? all.filter((item) => item.id !== place.id && item.isPopular).slice(0, 3) : [], [all, place]);

  if (loading) return <><Navbar active="places" /><main className="place-detail-state">იტვირთება...</main><Footer /></>;
  if (!place) return <><Navbar active="places" /><main className="place-detail-state"><h1>ადგილი ვერ მოიძებნა</h1><Link href="/places">ადგილების ნახვა</Link></main><Footer /></>;

  return (
    <div className="places-page">
      <Navbar active="places" />
      <main>
        <section className="place-detail-hero">
          <Image src={place.img} alt={place.title} fill priority sizes="100vw" style={{ objectFit: "cover" }} />
          <div className="place-detail-overlay" />
          <div className="container place-detail-hero-content">
            <Link href="/places" className="place-back-link">← ყველა ადგილი</Link>
            <span className="places-kicker">{place.region}</span>
            <h1>{place.title}</h1>
          </div>
        </section>

        <section className="place-detail-body">
          <div className="container place-detail-layout">
            <article className="place-detail-main">
              <div className="place-detail-copy"><span className="places-kicker">ადგილის შესახებ</span><h2>ერთი ადგილი, ბევრი შთაბეჭდილება</h2><p>{place.desc}</p></div>
              {place.gallery?.length > 0 && <div className="place-gallery">{place.gallery.map((image, index) => <Image key={`${image}-${index}`} src={image} alt={`${place.title} ${index + 1}`} width={900} height={600} />)}</div>}
            </article>
            <aside className="place-detail-aside"><div className="place-fact"><span>რეგიონი</span><strong>{place.region}</strong></div><div className="place-fact"><span>სტატუსი</span><strong>{place.isPopular ? "პოპულარული ადგილი" : "აღმოსაჩენი ადგილი"}</strong></div><Link href="/places" className="place-aside-action">სხვა ადგილების ნახვა <span>→</span></Link></aside>
          </div>
        </section>

        {similar.length > 0 && <section className="place-related"><div className="container"><div className="place-related-head"><div><span className="places-kicker">ამავე რეგიონში</span><h2>მსგავსი ადგილები</h2></div><Link href={`/places?region=${encodeURIComponent(place.region)}`}>ყველას ნახვა →</Link></div><div className="place-mini-grid">{similar.map((item) => <SmallPlaceCard key={item.id} place={item} />)}</div></div></section>}
        {popular.length > 0 && <section className="place-related place-related-muted"><div className="container"><div className="place-related-head"><div><span className="places-kicker">რჩეული</span><h2>ყველაზე პოპულარული</h2></div></div><div className="place-mini-grid">{popular.map((item) => <SmallPlaceCard key={item.id} place={item} />)}</div></div></section>}
      </main>
      <Footer />
    </div>
  );
}