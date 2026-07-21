import { Noto_Sans_Georgian, Noto_Serif_Georgian, Playfair_Display } from "next/font/google";
import "./globals.css";

const notoGeorgian = Noto_Sans_Georgian({
  variable: "--font-noto-georgian",
  subsets: ["georgian"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const notoSerifGeorgian = Noto_Serif_Georgian({
  variable: "--font-noto-serif-georgian",
  subsets: ["georgian"],
  weight: ["500", "600", "700", "800", "900"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0d233a",
};

export const metadata = {
  title: "GeorgiaTrips — პრემიუმ ტურები საქართველოში",
  description:
    "აღმოაჩინეთ კავკასიის სილამაზე ფუფუნებით და კომფორტით. პრემიუმ კლასის ტურები თბილისში, ბათუმში, ყაზბეგში, კახეთსა და სვანეთში — VIP სერვისით და 24/7 მხარდაჭერით.",
  keywords:
    "საქართველოს ტური, ტბილისი, ბათუმი, ყაზბეგი, კახეთი, სვანეთი, მგზავრობა, VIP ტურები, Georgia tours, travel Georgia",
  openGraph: {
    title: "GeorgiaTrips — პრემიუმ ტურები საქართველოში",
    description: "აღმოაჩინეთ კავკასიის სილამაზე ფუფუნებით და კომფორტით.",
    type: "website",
    locale: "ka_GE",
    siteName: "GeorgiaTrips",
    images: [{ url: "/hero.png", width: 1200, height: 630, alt: "საქართველოს მთები — GeorgiaTrips" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "GeorgiaTrips — პრემიუმ ტურები საქართველოში",
    description: "აღმოაჩინეთ კავკასიის სილამაზე ფუფუნებით და კომფორტით.",
    images: ["/hero.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "TravelAgency",
  name: "GeorgiaTrips",
  description: "პრემიუმ ტურები საქართველოში — VIP სერვისი, ტრანსფერები და ინდივიდუალური მარშრუტები.",
  areaServed: "GE",
  address: {
    "@type": "PostalAddress",
    addressLocality: "თბილისი",
    addressCountry: "GE",
  },
  telephone: "+995555000000",
  email: "info@georgiatrips.ge",
  priceRange: "₾₾-₾₾₾₾",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="ka"
      dir="ltr"
      className={`${notoGeorgian.variable} ${notoSerifGeorgian.variable} ${playfair.variable}`}
    >
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
