import { Noto_Sans_Georgian, Playfair_Display } from "next/font/google";
import "./globals.css";

const notoGeorgian = Noto_Sans_Georgian({
  variable: "--font-noto-georgian",
  subsets: ["georgian"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["700", "800"],
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata = {
  title: "GeorgiaTrips — პრემიუმ ტურები საქართველოში",
  description: "აღმოაჩინეთ კავკასიის სილამაზე ფუფუნებით და კომფორტით. პრემიუმ კლასის მოგზაურობა საქართველოში.",
  keywords: "საქართველოს ტური, ტბილისი, ბათუმი, ყაზბეგი, კახეთი, სვანეთი, მგზავრობა, VIP ტურები",
  openGraph: {
    title: "GeorgiaTrips — პრემიუმ ტურები საქართველოში",
    description: "აღმოაჩინეთ კავკასიის სილამაზე ფუფუნებით და კომფორტით.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ka" dir="ltr" className={`${notoGeorgian.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  );
}
