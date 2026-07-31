import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./hotels.css";

export const metadata = {
  title: "სასტუმროები — GeorgiaTrips",
  description: "შერჩეული სასტუმროები და საცხოვრებელი პაკეტები საქართველოში — GeorgiaTrips.",
};

export default function HotelsPage() {
  return (
    <>
      <Navbar active="hotels" />

      <main className="htl-wrap">
        <header className="htl-head">
          <span className="htl-eyebrow">GeorgiaTrips</span>
          <h1 className="text-balance">სასტუმროები</h1>
          <p className="text-pretty">
            შერჩეული სასტუმროები და საცხოვრებელი პაკეტები საქართველოს საკურორტო ზონებში.
          </p>
        </header>

        <section className="htl-panel" aria-label="სასტუმროების სექცია">
          <div className="htl-panel-icon" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18M4 21V8l8-5 8 5v13M9 21v-6h6v6" />
            </svg>
          </div>
          <h2>სასტუმროები მალე დაემატება</h2>
          <p>ეს გვერდი მზადაა შევსებისთვის — სასტუმროების სია და დეტალები დაემატება მოგვიანებით.</p>
        </section>
      </main>

      <Footer />
    </>
  );
}
