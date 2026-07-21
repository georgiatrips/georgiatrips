import { notFound } from "next/navigation";
import { DOMESTIC_TOURS, getTourById } from "../../lib/tours-data";
import TourDetailClient from "./TourDetailClient";

// Pre-render every tour detail page at build time for instant navigation + SEO.
export function generateStaticParams() {
  return DOMESTIC_TOURS.map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const tour = getTourById(id);
  if (!tour) return { title: "ტური ვერ მოიძებნა | GeorgiaTrips" };

  const title = `${tour.title} | GeorgiaTrips`;
  const description = tour.desc;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: tour.img }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [tour.img],
    },
  };
}

export default async function TourDetailPage({ params }) {
  const { id } = await params;
  const tour = getTourById(id);
  if (!tour) notFound();

  // Structured data for rich search results.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: tour.title,
    description: tour.desc,
    image: tour.img,
    touristType: tour.type === "individual" ? "Individual" : "Group",
    offers: {
      "@type": "Offer",
      price: tour.price,
      priceCurrency: "GEL",
      availability: "https://schema.org/InStock",
    },
    provider: {
      "@type": "TravelAgency",
      name: "GeorgiaTrips",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: tour.rating,
      bestRating: "5",
      ratingCount: 38,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TourDetailClient tour={tour} />
    </>
  );
}
