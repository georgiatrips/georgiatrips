"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { MAP_PATHS } from "./mapPaths";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import DatePicker from "./components/DatePicker";
import { ALL_TOURS_SCHEDULE } from "./lib/toursData";
import { useAllTours } from "./lib/useAllTours";
import { groupDepartureDates } from "./lib/toursFirestore";
import { listPlaces } from "./lib/placesFirestore";
import { GEORGIA_REGIONS } from "./lib/placesMeta";
import { listPosts } from "./lib/postsFirestore";

const fetcher = (url) => fetch(url).then((r) => r.json());

const truncateText = (value, maxLength = 100) => {
  const text = String(value || "").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}...` : text;
};

// ============================================================
// CONFIG & STATIC DATA
// ============================================================
const WA_NUMBER = "995504220020";
const WA_LINK = `https://wa.me/${WA_NUMBER}`;

const IMAGES = {
  hero: "/hero.png",
  tbilisi: "/tbilisi.png",
  batumi: "/batumi.png",
  kakheti: "/kakheti.png",
  mestia: "/mestia.png",
  villa: "/villa.png",
  kazbegi: "https://images.unsplash.com/photo-1565008576549-57569a49371d?w=800&q=80",
  heli: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
  family: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80",
  gallery1: "https://images.unsplash.com/photo-1583484963886-cfe2bff2945f?w=700&q=75",
  gallery2: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=700&q=75",
  gallery3: "https://images.unsplash.com/photo-1540202404-d0c7fe46a087?w=700&q=75",
  gallery4: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=700&q=75",
  gallery5: "https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=700&q=75",
};

const HERO_SLIDES = [
  { image: "/hero.png", label: "Kazbegi, Georgia" },
  { image: "/tbilisi.png", label: "Tbilisi, Georgia" },
  { image: "/gudauri.png", label: "Gudauri, Georgia" },
  { image: "/mestia.png", label: "Svaneti, Georgia" },
  { image: "/batumi.png", label: "Batumi, Georgia" }
];

// Brand logo — uses the uploaded logo.png asset
const BrandLogo = ({ width = 48, height = 48, priority = false }) => (
  <Image
    src="/logo.png"
    alt="GeorgiaTrips ლოგო"
    width={width}
    height={height}
    priority={priority}
    className="brand-logo-img"
    style={{ width, height, objectFit: "contain" }}
  />
);

const STATS = [
  { value: 500, suffix: "+", label: "კმაყოფილი ტურისტი" },
  { value: 45, suffix: "+", label: "უნიკალური მარშრუტი" },
  { value: 12, suffix: "", label: "რეგიონი საქართველოში" },
  { value: 24, suffix: "/7", label: "მხარდაჭერა ნებისმიერ დროს" },
];

const FAQS = [
  {
    q: "როგორ დავჯავშნო ტური?",
    a: "აირჩიეთ სასურველი ტური და დააჭირეთ ღილაკს „დაჯავშნეთ“ — ავტომატურად გადახვალთ WhatsApp-ზე, სადაც ჩვენი კონსულტანტი 30 წუთში გიპასუხებთ. ასევე შეგიძლიათ საიტზე შეავსოთ დაჯავშნის ფორმა.",
  },
  {
    q: "შესაძლებელია თუ არა ინდივიდუალური მარშრუტის შედგენა?",
    a: "რა თქმა უნდა! ჩვენი გუნდი შეადგენს სრულად პერსონალიზებულ მარშრუტს თქვენი ინტერესების, ბიუჯეტისა და დროის მიხედვით — მთის თავგადასავლებიდან ღვინის ტურებამდე.",
  },
  {
    q: "რა შედის ტურის ფასში?",
    a: "სტანდარტულად ფასში შედის ტრანსპორტი კომფორტული ავტომობილით, პროფესიონალი გიდი და დაზღვევა. VIP პაკეტებში ემატება სასტუმრო, კვება და დამატებითი სერვისები — დეტალები დაზუსტდება ჯავშნისას.",
  },
  {
    q: "ხელმისაწვდომია თუ არა ჰალალ კვება?",
    a: "დიახ, ჩვენ ვთანამშრომლობთ ჰალალ სერტიფიცირებულ რესტორნებთან თბილისში, ბათუმსა და მთავარ ტურისტულ მიმართულებებზე. წინასწარ გვაცნობეთ და ყველაფერს მოვამზადებთ.",
  },
  {
    q: "რომელ ენებზე საუბრობენ გიდები?",
    a: "ჩვენი გიდები საუბრობენ ქართულ, ინგლისურ, რუსულ და არაბულ ენებზე. სხვა ენის საჭიროების შემთხვევაში წინასწარ შეგვატყობინეთ.",
  },
  {
    q: "შესაძლებელია თუ არა ჯავშნის გაუქმება?",
    a: "დიახ, ჯავშნის უფასო გაუქმება შესაძლებელია ტურის დაწყებამდე 48 საათით ადრე. დეტალური პირობები დამოკიდებულია ტურის ��იპზე და დაზუსტდება დაჯავშნისას.",
  },
];

// Animated counter that starts when it scrolls into view
const CountUp = ({ end, suffix = "", duration = 1800 }) => {
  const ref = useRef(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let rafId;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setValue(Math.round(eased * end));
          if (progress < 1) rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [end, duration]);

  return (
    <span ref={ref} className="stat-value">
      {value}
      <em>{suffix}</em>
    </span>
  );
};

const CATEGORIES = [
  {
    title: "ტურები საქართველოში",
    desc: "ყაზბეგი, ბათუმი, სვანეთი, კახეთი.",
    link: "#popular",
  },
  {
    title: "სასტუმროები",
    desc: "პრემიუმ სასტუმროები და რიზორტები.",
    link: "#hotels",
  },
  {
    title: "VIP სერვისი",
    desc: "ინდივიდუალური ტურები და ვილები.",
    link: "#booking",
  },
  {
    title: "ტრანსფერები",
    desc: "კომფორტული ტრანსპორტი 24/7.",
    link: "#booking",
  },
];

const SECTIONS_DATA = [
  {
    id: "popular",
    title: "საქართველოს ტურისტული ად���ილები",
    tours: [
      {
        img: "https://images.unsplash.com/photo-1565008576549-57569a49371d?w=800&q=80",
        badge: "TOP 1 პოპულარული",
        priceGroup: "₾100/კაცი",
        pricePrivate: "₾500",
        dates: ["07.28", "07.31", "08.02"],
        title: "პრომეთეს მღვიმე, მარტვილის კანიონი & ცხელი წყლები",
        desc: "პრომეთეს მღვიმის საოცარი სტალაქტიტები, ნავით გასეირნება მარტვილში და თერმული წყლები.",
        duration: "14 საათი",
        location: "📍 ბათუმი, ჩაქვი, ქობულეთი",
      },
      {
        img: IMAGES.batumi,
        badge: "TOP 2 პოპულარული",
        priceGroup: "₾80/კაცი",
        pricePrivate: "₾400",
        dates: ["07.28", "07.29", "08.01"],
        title: "მთიანი აჭარის სრული ტური 1 დღეში",
        desc: "მახუნცეთის ჩანჩქერი, თამარის ისტორიული ხიდი, მირვეთის ხეობა და ქართული ტრადიციული სუფრა.",
        duration: "10 საათი",
        location: "📍 ბათუმიდან",
      },
    ],
  },
  {
    id: "nature",
    title: "მთის ტურები და ბუნება",
    tours: [
      {
        img: IMAGES.kazbegi,
        badge: "მთის ჰაერი",
        priceGroup: "₾170/კაცი",
        pricePrivate: "₾500",
        dates: ["07.27", "07.28", "07.30"],
        title: "ყაზბეგის მთები & გერგეთი",
        desc: "გერგეთის სამება, ულამაზესი ხედი მყინვარწვერ��ე და დაუვიწყარი ალპური ხეობები.",
        duration: "10 საათი",
        location: "📍 ბათუმი, თბილისი",
      },
      {
        img: "https://images.unsplash.com/photo-1540202404-d0c7fe46a087?w=700&q=75",
        badge: "ეკო ტური",
        priceGroup: "₾80/კაცი",
        pricePrivate: "₾250",
        dates: ["07.28", "07.30", "08.01"],
        title: "მტირალას ეროვნული პარკი",
        desc: "ევროპის ყველაზე ნოტიო პარკი — ტყის ბილიკები, ზიპლაინი და ტბაზე გასეირნება.",
        duration: "6 საათი",
        location: "📍 ბათუმი, ქობულეთი",
      },
    ],
  },
  {
    id: "culture",
    title: "ბათუმის ქალაქის ტური",
    tours: [
      {
        img: IMAGES.tbilisi,
        badge: "ისტორია & კულტურა",
        priceGroup: "₾150/კაცი",
        pricePrivate: "₾450",
        dates: ["07.27", "07.29", "07.31"],
        title: "თბილისის ძველი ქალაქი & მცხეთა",
        desc: "ნარიყალა, სვეტიცხოველი, ჯვრის მონასტერი და ძველი ქალაქის ისტორიული აბანოები.",
        duration: "8 საათი",
        location: "📍 თბილისიდან",
      },
      {
        img: IMAGES.mestia,
        badge: "UNESCO მემკვიდრეობა",
        priceGroup: "₾350/კაცი",
        pricePrivate: "₾950",
        dates: ["07.28", "08.01", "08.05"],
        title: "��ესტიის & უშგულის საიდუმლო",
        desc: "სვანური კოშკები, უშგულის ავთენტური სოფელი და საუკუნოვანი კულტურა.",
        duration: "24+ საათი",
        location: "📍 ზუგდიდი, მესტია",
      },
    ],
  },
  {
    id: "taste",
    title: "ღვინის პროგრამები",
    tours: [
      {
        img: IMAGES.kakheti,
        badge: "ღვინის სამშობლო",
        priceGroup: "₾180/კაცი",
        pricePrivate: "₾520",
        dates: ["07.29", "07.31", "08.03"],
        title: "კახეთის ღვინის მარშრუტი",
        desc: "სიღნაღი, ბოდბის მონასტერი, ქვევრის ღვინის დე��უსტაცია და ქართული სუფრა.",
        duration: "10 საათი",
        location: "📍 თბილისიდან",
      },
      {
        img: IMAGES.villa,
        badge: "ეთნო გასტრონომია",
        priceGroup: "₾90/კაცი",
        pricePrivate: "₾280",
        dates: ["07.27", "07.29", "07.31"],
        title: "მაჭახელას ხეობა & აჭარული სუფრა",
        desc: "ისტორიული ხიდები, ჩანჩქერები, აჭარული ხაჭაპური და ფოლკლორული შოუ.",
        duration: "7 საათი",
        location: "📍 ბათუმიდან",
      },
    ],
  },
  {
    id: "adventure",
    title: "ეგზოტიკური პარკები და ბუნება",
    tours: [
      {
        img: IMAGES.batumi,
        badge: "ალპური თავგადასავალი",
        priceGroup: "₾120/კაცი",
        pricePrivate: "₾350",
        dates: ["07.27", "07.28", "07.30"],
        title: "ხულო, მწვანე ტბა & გოდერძი",
        desc: "საბაგირო ხულოში, მწვანე ტბის ალპური სილამაზე და გოდერძის უღელტეხილი.",
        duration: "9 საათი",
        location: "📍 ბათუმი, ხულო",
      },
      {
        img: IMAGES.heli,
        badge: "ექსტრემალური",
        priceGroup: "₾1200/კაცი",
        pricePrivate: "₾3500",
        dates: ["07.28", "07.30", "08.04"],
        title: "კავკასიონის ვერტმფრენის ტური",
        desc: "კავკასიის მწვერვალები და მიუწვდომელი ხეობები ჩიტის ფრენის სიმაღლიდან.",
        duration: "4 საათი",
        location: "📍 სტეფანწმინდა",
      },
    ],
  },
  {
    id: "luxury",
    title: "ზღვაზე გასეირნება",
    tours: [
      {
        img: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80",
        badge: "5★ VIP ექსკ������ზივი",
        priceGroup: "₾800/კაცი",
        pricePrivate: "₾2200",
        dates: ["07.27", "07.29", "08.02"],
        title: "VIP ფუფუნების ვილები & რიზორტი",
        desc: "ექსკლუზიური დასვენება ��აუკეთესო ვილებში, პირადი მზარეულითა და ასისტენტით.",
        duration: "48+ საათი",
        location: "📍 ��აზბეგი, ბათუმი",
      },
      {
        img: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=700&q=75",
        badge: "VIP იახტ ტური",
        priceGroup: "₾450/კაცი",
        pricePrivate: "₾1300",
        dates: ["07.28", "07.31", "08.03"],
        title: "ბათუმის პრემიუმ სანაპირო & იახტა",
        desc: "გასეირნება კერძო იახტით შავ ზღვაზე, დელფინების ყურება და მზის ჩასვლა.",
        duration: "5 საათი",
        location: "📍 ბათუმის პორტი",
      },
    ],
  },
  {
    id: "seasons",
    title: "სეზონური ექსკურსიები",
    tours: [
      {
        img: HERO_SLIDES[2].image,
        badge: "სეზონური ჰაილაითი",
        priceGroup: "₾200/კაცი",
        pricePrivate: "₾580",
        dates: ["07.28", "07.29", "07.31"],
        title: "გუდაურის პანორამული ტური",
        desc: "პანორამული საბაგიროები, პარაპლანით ფრენა და ალპური პანორამა გუდაურში.",
        duration: "12 საათი",
        location: "📍 გუდაური",
      },
      {
        img: IMAGES.family,
        badge: "საოჯახო პაკეტი",
        priceGroup: "₾450/კაცი",
        pricePrivate: "₾1200",
        dates: ["07.27", "07.28", "07.31"],
        title: "საოჯახო სეზონური მოგზაურობა",
        desc: "სპეციალურად დაგეგმილი მშვიდი მარშრუტები ბავშვებთან ერთად კომფორტული მგზავრობით.",
        duration: "36+ საათი",
        location: "📍 ბათუმი, აჭარა",
      },
    ],
  },
];

// Map Firestore tourSection values → home page themed section ids
const FIREBASE_SECTION_TO_HOME = {
  "mountains-nature": "nature",
  "batumi-city": "culture",
  "wine": "taste",
  "exotic-parks": "adventure",
  "sea": "luxury",
  "seasonal": "seasons",
};


const SOCIAL_POSTS = [

  {
    platform: "instagram",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    username: "georgia_trips",
    location: "ყაზბეგი, საქართველო",
    img: "/hero.png",
    text: "Mountain magic at Gergeti Trinity Church. 🏔️✨ კავკასიონის მყინვარების ხედი ყოველთვის განსაკუთრებულია. #Kazbegi #GeorgiaTrips #TravelGeorgia",
    likes: "1,245",
    comments: "42",
    time: "2h ago"
  },
  {
    platform: "twitter",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    username: "Georgia Trips 🇬🇪",
    handle: "@GeorgiaTrips",
    img: "/tbilisi.png",
    text: "თბილისი ღამით — ისტორიისა და თანამედროვეობის საოცარი სინთეზი. ძველი ქალაქის ვიწრო ქუჩები, შუქები და დაუვიწყარი განწყობა! 🌌🍷",
    likes: "892",
    reposts: "124",
    replies: "18",
    time: "4h"
  },
  {
    platform: "threads",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    username: "georgia_trips",
    img: "/batumi.png",
    text: "დილა ბათუმის ბულვარში. შავი ზღვის სანაპირო, პალმები და დილის მზე. აჭარა ყოველთვის გველოდება! 🌊🌴☀️",
    likes: "512",
    replies: "29",
    time: "6h"
  },
  {
    platform: "bluesky",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    username: "Georgia Trips",
    handle: "@georgiatrips.bsky.social",
    img: "/kakheti.png",
    text: "კახეთის ვენახები და ტრადიციული ქვევრის ღვინის საიდუმლოებები. მოემზადეთ ნამდვილი ქართული სტუმართმოყვარეობისთვის! 🍇🍷🍂",
    likes: "420",
    reposts: "67",
    replies: "12",
    time: "1d ago"
  },
  {
    platform: "mastodon",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    username: "Georgia Trips",
    handle: "@georgiatrips@mastodon.travel",
    img: "/mestia.png",
    text: "სვანური კოშკები მესტიაში — საუკუნეების ისტორია და კავკასიის უმაღლესი მწვერვალები. ადგილი, სადაც დრო ჩერდება. 🏔️🛡️",
    likes: "310",
    boosts: "88",
    replies: "15",
    time: "2d"
  },
  {
    platform: "spill",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
    username: "georgia_trips",
    img: "/villa.png",
    text: "ექსკლუზიური VIP ვილა ყაზბეგში. გაიღვიძე მთების პანორამული ხედით და ისიამოვნე სრული კომფორტით. 💎🏔️☕",
    spills: "189",
    comments: "22",
    time: "3d"
  }
];

const WEATHER_DATA = {
  tbilisi: {
    name: "თბილისი",
    temp: "28°C",
    condition: "მზიანი",
    desc: "იდეა��ური ამინდია ძველ თბილისში სასეირნოდ და მყუდრო კაფეებში დროის გასატარებლად.",
    humidity: "42%",
    wind: "12 კმ/სთ",
    uv: "საშუალო (5)",
    forecast: [
      { day: "ხვალ", temp: "29°C", condition: "sun" },
      { day: "ზეგ", temp: "27°C", condition: "cloud-sun" },
      { day: "შემდეგ", temp: "28°C", condition: "sun" }
    ],
    icon: "sun"
  },
  batumi: {
    name: "ბათუმი",
    temp: "26°C",
    condition: "ნაწილობრივ ღრუბლიანი",
    desc: "ზღვის ნიავი და სასიამოვნო ტემპერატურა ბულვარში სასეირნოდ.",
    humidity: "75%",
    wind: "18 კმ/სთ",
    uv: "საშუალო (4)",
    forecast: [
      { day: "ხვალ", temp: "25°C", condition: "rain" },
      { day: "ზეგ", temp: "27°C", condition: "sun" },
      { day: "შემდეგ", temp: "28��C", condition: "sun" }
    ],
    icon: "cloud-sun"
  },
  kazbegi: {
    name: "ყაზბეგი",
    temp: "17°C",
    condition: "მზიანი",
    desc: "გრილი და სუფთა მთის ჰაერი, იდეალური პირობებია გერგეთის სამების მოსანახულებლად.",
    humidity: "35%",
    wind: "15 კმ/სთ",
    uv: "მაღალი (7)",
    forecast: [
      { day: "ხვალ", temp: "18°C", condition: "sun" },
      { day: "ზეგ", temp: "16°C", condition: "cloud-sun" },
      { day: "შემდეგ", temp: "15°C", condition: "storm" }
    ],
    icon: "sun"
  },
  mestia: {
    name: "მესტია",
    temp: "19°C",
    condition: "მცირე ღრუბელი",
    desc: "საუკეთესო დრო სვანეთის კოშკების დასათვალიერებლად და ლაშქრობებისთვის.",
    humidity: "50%",
    wind: "8 კმ/სთ",
    uv: "საშუალო (5)",
    forecast: [
      { day: "ხვალ", temp: "20°C", condition: "sun" },
      { day: "ზეგ", temp: "18°C", condition: "rain" },
      { day: "შემდეგ", temp: "17°C", condition: "sun" }
    ],
    icon: "cloud-sun"
  },
  gudauri: {
    name: "გუდაური",
    temp: "15°C",
    condition: "მზიანი",
    desc: "შესანიშნავი ამინდია პარაპლანით ფრენისა და ალპური ხედებით ტკბობისთვის.",
    humidity: "40%",
    wind: "22 კმ/სთ",
    uv: "ძალიან მაღალი (8)",
    forecast: [
      { day: "ხვალ", temp: "16°C", condition: "sun" },
      { day: "ზეგ", temp: "14°C", condition: "cloud-sun" },
      { day: "შემდეგ", temp: "13°C", condition: "rain" }
    ],
    icon: "sun"
  }
};

const ICONS = {
  wa: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12.003 2C6.477 2 2 6.477 2 12c0 1.989.574 3.842 1.563 5.406L2 22l4.682-1.528A9.956 9.956 0 0012.003 22C17.529 22 22 17.523 22 12S17.529 2 12.003 2zm0 18c-1.676 0-3.26-.455-4.627-1.247l-.331-.198-3.454 1.128 1.156-3.366-.215-.348A7.957 7.957 0 014.003 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z" />
    </svg>
  ),
  plane: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16l-5-5 2-8-6 4-3-3-3 3-3-4 2 8-5 5 8 1z" />
    </svg>
  ),
  clock: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  people: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  arrow: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  sun: (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fab418" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="weather-svg-sun">
      <circle cx="12" cy="12" r="5" fill="#fab418" fillOpacity="0.1" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  "cloud-sun": (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41" stroke="#fab418" />
      <circle cx="12" cy="12" r="4" stroke="#fab418" />
      <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" fill="var(--blue)" fillOpacity="0.1" stroke="var(--blue)" />
      <path d="M8 16a3 3 0 0 0 3-3H6.5A3 3 0 0 0 8 16z" fill="var(--blue)" />
    </svg>
  ),
  rain: (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="15" x2="12" y2="23" /><line x1="8" y1="17" x2="8" y2="21" /><line x1="16" y1="17" x2="16" y2="21" />
      <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" fill="var(--blue)" fillOpacity="0.1" />
    </svg>
  ),
  storm: (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" fill="var(--text-mute)" fillOpacity="0.1" stroke="var(--text-mute)" />
      <polyline points="13 12 9 17 12 17 10 22" stroke="#fab418" strokeWidth="2.5" fill="#fab418" />
    </svg>
  )
};

export default function Home() {
  const [navScrolled, setNavScrolled] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
  const [showAllSocial, setShowAllSocial] = useState(false);
  const [activeMapRegion, setActiveMapRegion] = useState(null);
  const [activeWeatherTab, setActiveWeatherTab] = useState("tbilisi");
  const [openFaq, setOpenFaq] = useState(0);

  const [popTourSlide, setPopTourSlide] = useState(0);
  const [places, setPlaces] = useState([]);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    let active = true;
    listPlaces()
      .then((items) => { if (active) setPlaces(items); })
      .catch((error) => console.error("Failed to load places for homepage", error));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    listPosts()
      .then((items) => { if (active) setPosts(items.slice(0, 6)); })
      .catch((error) => console.error("Failed to load posts for homepage", error));
    return () => { active = false; };
  }, []);

  const popularPlaces = useMemo(() => places.filter((place) => place.isPopular).slice(0, 2), [places]);
  const latestPlaces = useMemo(() => [...places].sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
    const bTime = b.createdAt?.toMillis?.() || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
    return bTime - aTime;
  }).slice(0, 6), [places]);

  // Static tours + Firestore tours added from Admin panel
  const { allTours, firestoreTours } = useAllTours();

  const popularTours = useMemo(() => firestoreTours.filter((tour) => tour.isPopular), [firestoreTours]);
  const popularTourPairs = useMemo(() => {
    const pairs = [];
    for (let i = 0; i < popularTours.length; i += 2) {
      pairs.push(popularTours.slice(i, i + 2));
    }
    return pairs;
  }, [popularTours]);

  // Merge Admin-added (Firestore) tours into the matching themed sections
  const dynamicSections = useMemo(() => {
    if (firestoreTours.length === 0) return SECTIONS_DATA;
    return SECTIONS_DATA.map((sec) => {
      if (sec.id === "popular") return sec;
      const dynamicTours = firestoreTours.filter(
        (t) => FIREBASE_SECTION_TO_HOME[t.category] === sec.id
      );
      if (dynamicTours.length === 0) return sec;
      return { ...sec, tours: [...sec.tours, ...dynamicTours] };
    });
  }, [firestoreTours]);

  // Add group tours created in the admin panel to the public schedule.
  // Their departure dates are stored as ISO dates in Firestore, so convert
  // them to the same month/date shape as the curated schedule entries.
  const scheduleTours = useMemo(() => {
    const firestoreScheduleTours = firestoreTours
      .filter((tour) => tour.hasGroup && tour.departureDates?.length > 0)
      .map((tour) => ({
        id: tour.id,
        title: tour.title,
        priceGroup: tour.priceGroup || tour.pricePrivate || "",
        priceNote: tour.hasPrivate ? "ინდივიდუალური ტურის ვარიანტიც ხელმისაწვდომია" : "",
        locationShort: tour.destinationLabel || tour.destination || "",
        desc: tour.desc,
        months: groupDepartureDates(tour.departureDates).map((month) => ({
          ...month,
          dates: month.dates.map((date) => date.chip),
        })),
      }))
      .filter((tour) => tour.months.length > 0);

    return [...ALL_TOURS_SCHEDULE, ...firestoreScheduleTours];
  }, [firestoreTours]);

  useEffect(() => {
    if (popularTourPairs.length < 2) return undefined;
    const popTourInterval = setInterval(() => {
      setPopTourSlide((prev) => (prev + 1) % popularTourPairs.length);
    }, 3500);
    return () => clearInterval(popTourInterval);
  }, [popularTourPairs.length]);

  const router = useRouter();
  const [heroDestination, setHeroDestination] = useState("all");
  const [heroDate, setHeroDate] = useState("");
  const [heroFormat, setHeroFormat] = useState("all");

  const allAvailableDates = useMemo(() => {
    const datesSet = new Set();
    allTours.forEach((t) => {
      if (t.dates) t.dates.forEach((d) => datesSet.add(d));
      if (t.departureDates) t.departureDates.forEach((entry) => {
        const iso = typeof entry === "string" ? entry : entry?.date;
        if (iso) datesSet.add(iso);
      });
    });
    return Array.from(datesSet);
  }, [allTours]);

  const handleHeroSearch = (e) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (heroDestination && heroDestination !== "all") params.set("destination", heroDestination);
    if (heroFormat && heroFormat !== "all") params.set("format", heroFormat);
    if (heroDate) params.set("date", heroDate);
    const qStr = params.toString();
    router.push(`/tours${qStr ? `?${qStr}` : ""}`);
  };

  // Live weather — refreshes every 15 min, falls back to static data
  const { data: weatherResp, isLoading: weatherLoading } = useSWR("/api/weather", fetcher, {
    refreshInterval: 900000,
    revalidateOnFocus: false,
  });
  const weatherData = weatherResp?.data || WEATHER_DATA;
  const isLiveWeather = Boolean(weatherResp?.data);

  const [formData, setFormData] = useState({
    name: "",
    country: "",
    dateFrom: "",
    dateTo: "",
    people: "",
    budget: "",
    notes: ""
  });


  useEffect(() => {
    const handleScroll = () => {
      setNavScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Hero Background Slider Auto Play (10s)
    const heroInterval = setInterval(() => {
      setCurrentHeroSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 10000);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearInterval(heroInterval);
    };
  }, []);


  // Scroll-reveal animation for all sections
  useEffect(() => {
    const targets = document.querySelectorAll(
      ".section-header, .categories-grid, .why-wrap, .booking-wrap, .weather-wrap, .map-wrap, .social-feed-grid, .stats-grid, .faq-list, .batumi-section-header, .intl-header"
    );

    targets.forEach((el) => el.classList.add("reveal"));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");

            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleBookNow = (tourTitle, tourPrice) => {
    const msg = `გამარჯობა! მინდა დავაჯავშნო ტური: *${tourTitle}* (${tourPrice})`;
    window.open(`${WA_LINK}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
  };

  const handleTourClick = (tour) => {
    const id = tour.id || allTours.find((t) => t.title === tour.title)?.id || "promethe-martvili";
    router.push(`/tours/${id}`);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const { name, country, dateFrom, dateTo, people, budget, notes } = formData;
    const msg = [
      "✈️ *GeorgiaTrips — ახალი ჯავშანი*",
      "",
      `👤 სახელი: ${name}`,
      country ? `🌍 ქვეყანა: ${country}` : "",
      dateFrom ? `📅 გამგზავრება: ${dateFrom}` : "",
      dateTo ? `📅 დაბრუნება: ${dateTo}` : "",
      `👥 მოგზაურები: ${people}`,
      `💰 ბიუჯეტი: ${budget}`,
      notes ? `📝 შენიშვნა: ${notes}` : ""
    ].filter(Boolean).join("\n");

    window.open(`${WA_LINK}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      {/* ==================== NAVIGATION ==================== */}
      <Navbar active="home" />

      {/* ==================== HERO — CINEMATIC ==================== */}
      <section className="hero" id="home">
        {HERO_SLIDES.map((slide, idx) => (
          <div
            key={idx}
            className={`hero-bg ${idx === currentHeroSlide ? "loaded active" : ""}`}
            style={{ backgroundImage: `url('${slide.image}')` }}
          ></div>
        ))}

        <div className="hero-content">
          <div className="hero-badge">
            <span>Georgia Trips — Travel Company</span>
          </div>

          <h1 className="hero-title">
            აღმოაჩინეთ<br />
            <em>საქართველო</em>
          </h1>

          <div className="hero-locations">
            <span className="hero-loc-tag">ყ���ზბეგი</span>
            <span className="hero-loc-divider"></span>
            <span className="hero-loc-tag">თბილისი</span>
            <span className="hero-loc-divider"></span>
            <span className="hero-loc-tag featured">ბათუმი</span>
            <span className="hero-loc-divider"></span>
            <span className="hero-loc-tag">კახეთი</span>
            <span className="hero-loc-divider"></span>
            <span className="hero-loc-tag">სვანეთი</span>
          </div>

          {/* Minimalist Quick Search Widget */}
          <div className="hero-search-bar">
            <div className="hero-search-field">
              <span className="hero-search-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
              </span>
              <div className="hero-search-input-wrap">
                <label>მიმართულება</label>
                <select
                  className="hero-search-select"
                  value={heroDestination}
                  onChange={(e) => setHeroDestination(e.target.value)}
                >
                  <option value="all">ყველა რეგიონი</option>
                  {GEORGIA_REGIONS.map((region) => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="hero-search-divider" />

            <div className="hero-search-field">
              <span className="hero-search-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </span>
              <div className="hero-search-input-wrap">
                <label>თარიღი</label>
                <DatePicker
                  value={heroDate}
                  onChange={(d) => setHeroDate(d)}
                  availableDates={allAvailableDates}
                  variant="hero"
                />
              </div>
            </div>

            <div className="hero-search-divider" />

            <div className="hero-search-field">
              <span className="hero-search-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </span>
              <div className="hero-search-input-wrap">
                <label>ტურის ფორმატი</label>
                <select
                  className="hero-search-select"
                  value={heroFormat}
                  onChange={(e) => setHeroFormat(e.target.value)}
                >
                  <option value="all">ყველა ფორმატი</option>
                  <option value="individual">ინდივიდუალური ტური</option>
                  <option value="group">ჯგუფური ტური</option>
                </select>
              </div>
            </div>

            <button type="button" onClick={handleHeroSearch} className="hero-search-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <span>ძებნა</span>
            </button>
          </div>
        </div>

        <div className="hero-location-badge">
          <span className="loc-pin">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--yellow)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
          </span>
          <span className="loc-text">{HERO_SLIDES[currentHeroSlide].label}</span>
        </div>

        <div className="hero-dots" role="tablist" aria-label="სლაიდები">
          {HERO_SLIDES.map((slide, idx) => (
            <button
              key={idx}
              className={`hero-dot ${idx === currentHeroSlide ? "active" : ""}`}
              onClick={() => setCurrentHeroSlide(idx)}
              aria-label={slide.label}
              aria-selected={idx === currentHeroSlide}
              role="tab"
            />
          ))}
        </div>
      </section>

      {/* ==================== ABOUT / INTRO SECTION ==================== */}
      <section className="about-section" id="about" aria-label="ჩვენ შესახებ">
        <div className="about-inner">

          {/* Left — Photo */}
          <div className="about-photo-wrap">
            <div className="about-photo-frame">
              <Image
                src="/profile.png"
                alt="GeorgiaTrips — პროფესიონალი სამოგზაურო კომპანია საქართველოში"
                fill
                style={{ objectFit: "cover", objectPosition: "center 35%" }}
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
            <div className="about-photo-accent" aria-hidden="true">GeorgiaTrips</div>
          </div>

          {/* Right — Text content */}
          <div className="about-text">
            <span className="about-eyebrow">გაიცანით GeorgiaTrips</span>
            <h2 className="about-heading">
              საქართველოს ტურები —<br />
              თქვენი სიამოვნება, ჩვენი პასუხისმგებლობა
            </h2>

            <p className="about-desc">
              GeorgiaTrips — პროფესიონალი სამოგზაურო კომპანია, რომელიც გთავაზობთ
              ინდივიდუალურ და ჯგუფურ ტურებს საქართველოს ულამაზეს კუთხეებში: ყაზბეგი,
              სვანეთი, ბათუმი, კახეთი, თბილისი და სხვა. ჩვენი მიზანია — თითოეულ
              მოგზაურს შევუქმნათ დაუვიწყარი გამოცდილება.
            </p>
            <p className="about-desc">
              ჩვენი გამოცდილი გიდები, კომფორტული ტრანსპორტი და ყოველი მომსახურება
              შერჩეულია ისე, რომ სამოგზაურო გეგმის ყველა დეტალი მოქნილი, უსა��რთხო
              და სასიამოვნო იყოს — დაწყებული ტრანსფერიდან, დამთავრებული ექსკლუზიური
              VIP პაკეტებამდე.
            </p>

            <ul className="about-checks" aria-label="ჩვენი უპირატესობები">
              <li><span className="about-check-icon" aria-hidden="true">✓</span>მრავალწლიანი გამოცდილება ტურისტული მარშრუტების ორგანიზებაში</li>
              <li><span className="about-check-icon" aria-hidden="true">✓</span>ლიცენზირებული გიდები და პროფესიონალი მძღოლები</li>
              <li><span className="about-check-icon" aria-hidden="true">✓</span>მოქნილი განრიგი — ინდივიდუალური და ჯგუფური ტურები</li>
              <li><span className="about-check-icon" aria-hidden="true">✓</span>24/7 მხარდაჭერა მოგზაურობის მთელ პერიოდში</li>
            </ul>

            <div className="about-socials" aria-label="სოციალური ქსელები">
              <a
                href="https://www.facebook.com/people/Georgia-Trips/61588059054976/"
                target="_blank"
                rel="noopener noreferrer"
                className="about-social-link about-social-fb"
                aria-label="Facebook — Georgia Trips"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                Facebook
              </a>
              <a
                href="https://www.instagram.com/georgiatrips.ge/"
                target="_blank"
                rel="noopener noreferrer"
                className="about-social-link about-social-ig"
                aria-label="Instagram — georgiatrips.ge"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
                Instagram
              </a>
              <a
                href="https://api.whatsapp.com/send/?phone=995504220020&text&type=phone_number&app_absent=0"
                target="_blank"
                rel="noopener noreferrer"
                className="about-social-link about-social-wa"
                aria-label="WhatsApp — +995 504 22 00 20"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
                WhatsApp
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* ==================== TOUR CATEGORIES ==================== */}
      <section className="section" id="categories">
        <div className="section-inner">
          <div className="section-header">
            <span className="section-eyebrow">ჩვენი სერვისები</span>
            <h2 className="section-title">მიმართულებები და მომსახურება</h2>
            <div className="gold-line"></div>
          </div>
          <div className="categories-grid">
            {CATEGORIES.map((cat, idx) => (
              <div
                key={idx}
                className="category-card"
                onClick={() => document.querySelector(cat.link)?.scrollIntoView({ behavior: "smooth" })}
              >
                <span className="cat-num">0{idx + 1}</span>
                <h3 className="category-title">{cat.title}</h3>
                <p className="category-desc">{cat.desc}</p>
                <div className="cat-arrow">→</div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ==================== THEMED TOUR SECTIONS ==================== */}
      <div className="themed-sections-container">
        {dynamicSections.map((sec) =>
          sec.id === "popular" ? (
            <section key={sec.id} className="popular-destinations-section" id={sec.id}>
              <div className="popular-destinations-inner">
                {/* Section Header */}
                <div className="popular-destinations-header">
                  <span className="pop-eyebrow">ყველაზე მოთხოვნადი</span>
                  <h2 className="pop-main-title"><span className="teal-accent">საქართველოს ტურისტული</span> ადგილები</h2>
                </div>

                <div className="pop-content-layout pop-layout-swapped">
                  {/* Left Column: Asymmetrical/Staggered Cards */}
                  <div className="pop-cards-col">
                    <div className="pop-cards-wrapper">
                      {popularPlaces.map((place, index) => (
                        <a key={place.id} href={"/places/" + place.id} className={"pop-card" + (index === 1 ? " pop-card-staggered" : "")}>
                          <div className="pop-card-img-wrap">
                            <Image src={place.img} alt={place.title} fill sizes="(max-width: 768px) 100vw, 30vw" style={{ objectFit: "cover" }} loading="lazy" />
                            <div className="pop-card-badge">TOP {index + 1} პოპულარული</div>
                            <div className="pop-card-gradient"></div>
                            <div className="pop-card-footer-info">
                              <h4 className="pop-card-title">{place.title}</h4>
                              <span className="pop-card-sub">{place.region || "საქართველო"}</span>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>

                    <div className="pop-dots">
                      <span className="pop-dot active"></span>
                    </div>
                  </div>

                  {/* Right Column: Information & Attractions Grid */}
                  <div className="pop-info-col">
                    <p className="pop-description">
                      საუკეთესო ერთდღიანი ტურები ბათუმიდან. აირჩიეთ სასიამოვნო ლოკაციები — ბათუმის სიახლოვეს მდებარე ბუნება, ჩანჩქერები და <span style={{color:'#29b2b7'}}>ბათუმის სანაპირო</span>. მოინახულეთ მთები, <span style={{color:'#29b2b7'}}>ჩანჩქერები</span> და <span style={{color:'#29b2b7'}}>პლაჟები</span> — ბათუმი თქვენს შვებულებას დაუვიწყარს გახდის.
                    </p>

                    <div className="pop-attractions-grid">
                      {latestPlaces.map((place) => (
                        <a key={place.id} href={"/places/" + place.id} className="pop-attraction-item">
                          <span className="pop-name">{place.title}</span>
                          <span className="pop-pin" aria-hidden="true">📍</span>
                        </a>
                      ))}
                    </div>

                    <a href="/places" className="pop-all-btn">
                      ყველა ლოკაცია <span>→</span>
                    </a>
                  </div>
                </div>

                {/* Popular Tours Auto-Sliding 2-Card Pair Carousel */}
                <div className="pop-tours-grid-wrapper">
                  <div className="pop-grid-header-row">
                    <div className="pop-grid-header">
                      <h3 className="pop-grid-title">პოპულარული <span className="teal-accent">ტურები</span></h3>
                      <p className="pop-grid-subtitle">ყველაზე მოთხოვნადი ექსკურსიები საქართველოს მასშტაბით</p>
                    </div>

                    <div className="pop-tour-slider-dots">
                      {popularTourPairs.map((_, idx) => (
                        <button
                          key={idx}
                          className={`pop-tour-dot ${idx === popTourSlide ? "active" : ""}`}
                          onClick={() => setPopTourSlide(idx)}
                          aria-label={`სლაიდი ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="mini-cards-slider-container">
                    <div
                      className="mini-cards-slider-track"
                      style={{ transform: `translateX(-${popTourSlide * 100}%)` }}
                    >
                      {popularTourPairs.map((pair, pIdx) => (
                        <div key={pIdx} className="mini-cards-pair-slide">
                          {pair.map((tour) => (
                            <article
                              key={tour.id}
                              className="pop-fc"
                              onClick={() => handleTourClick(tour)}
                            >
                              {/* Full-bleed Image */}
                              <Image
                                src={tour.img}
                                alt={tour.title}
                                fill
                                style={{ objectFit: "cover" }}
                                sizes="(max-width: 768px) 100vw, 50vw"
                                loading="lazy"
                                className="pop-fc-img"
                              />

                              {/* Dark gradient overlay */}
                              <div className="pop-fc-gradient" />

                              {/* Top row: badge + dates */}
                              <div className="pop-fc-top">
                                <span className="pop-fc-badge">{tour.badge}</span>
                                <div className="pop-fc-dates">
                                  {tour.dates?.slice(0, 3).map((d, i) => (
                                    <span key={i} className="pop-fc-date">{d}</span>
                                  ))}
                                </div>
                              </div>

                              {/* Bottom overlay body */}
                              <div className="pop-fc-body">
                                <div className="pop-fc-meta">
                                  <span>⏱ {tour.duration}</span>
                                  <span className="pop-fc-dot">•</span>
                                  <span>{tour.location}</span>
                                </div>
                                <h3 className="pop-fc-title">{tour.title}</h3>
                                <p className="pop-fc-desc">{tour.desc}</p>
                                <div className="pop-fc-footer">
                                  <div className="pop-fc-prices">
                                    {tour.priceGroup && (
                                      <div className="pop-fc-price-item">
                                        <small>ჯგუფში</small>
                                        <strong>{tour.priceGroup}</strong>
                                      </div>
                                    )}
                                    {tour.pricePrivate && (
                                      <div className="pop-fc-price-item">
                                        <small>ინდივ.</small>
                                        <strong>{tour.pricePrivate}</strong>
                                      </div>
                                    )}
                                  </div>
                                  <button className="pop-fc-btn">დაჯავშნა →</button>
                                </div>
                              </div>
                            </article>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <section key={sec.id} className="themed-tours-section" id={sec.id}>
              <div className="themed-section-header">
                <h2 className="themed-section-title">{sec.title}</h2>
              </div>

              <div className="themed-tours-grid">
                {sec.tours.map((tour, idx) => (
                  <article
                    key={idx}
                    className="tb-card"
                    onClick={() => handleTourClick(tour)}
                  >
                    <div className="tb-card-img-wrap">
                      <Image
                        src={tour.img}
                        alt={tour.title}
                        className="tb-card-img"
                        fill
                        style={{ objectFit: "cover" }}
                        loading="lazy"
                      />
                      <span className="tb-badge">{tour.badge}</span>
                      <div className="tb-overlay-right">
                        {tour.pricePrivate && (
                          <div className="tb-price-tag tb-price-priv">
                            <small>ინდივიდუალური</small>
                            <strong>{tour.pricePrivate}</strong>
                          </div>
                        )}
                        {tour.priceGroup && (
                          <div className="tb-price-tag tb-price-group">
                            <small>ჯგუფში</small>
                            <strong>{tour.priceGroup}</strong>
                          </div>
                        )}
                        {tour.dates && tour.dates.length > 0 && (
                          <div className="tb-dates-row">
                            {tour.dates.slice(0, 4).map((d, i) => (
                              <span key={i} className="tb-date-chip">{d}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="tb-card-body">
                      <h3 className="tb-card-title">{tour.title}</h3>
                      <p className="tb-card-annotation">{tour.desc}</p>
                      <div className="tb-card-line"></div>
                      <div className="tb-card-facilities">
                        <span className="tb-facility-item">⏱ {tour.duration}</span>
                        <span className="tb-facility-item">{tour.location || "📍 ბათუმიდან"}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )
        )}
      </div>
      {/* ==================== TOUR SCHEDULE & FREE DATES SECTION ==================== */}
      <section className="tour-schedule-section" id="schedule">
        <div className="section-inner">
          <div className="themed-section-header schedule-header">
            <span className="schedule-eyebrow">თავისუფალი თარიღების განრიგი</span>
            <h2 className="themed-section-title">ტურების განრიგი & თავისუფალი დღეები</h2>
            <p className="schedule-subdesc">
              დაგეგმეთ თქვენი მოგზაურობა წინასწ��რ — იხილეთ ტურების უახლოესი თავისუფალი თარიღები და დააჭირეთ დასაჯავშნად.
            </p>
          </div>

          <div className="schedule-list-container">
            {scheduleTours.map((item) => (
              <article key={item.id} className="schedule-card-row">
                <h3 className="schedule-tour-title" onClick={() => handleTourClick(item)}>
                  {item.title}
                </h3>
                <div className="schedule-tour-price">
                  <strong>{item.priceGroup}</strong>, <span>{item.priceNote}</span>
                </div>
                <p className="schedule-tour-desc">{truncateText([item.locationShort, item.desc].filter(Boolean).join(". "))}</p>

                <div className="schedule-months-flex">
                  {item.months.map((mGroup, mIdx) => (
                    <div key={mIdx} className="schedule-month-block">
                      <span className="schedule-month-pill">{mGroup.monthName}</span>
                      <div className="schedule-days-grid">
                        {mGroup.dates.map((d, dIdx) => (
                          <button
                            key={dIdx}
                            className="schedule-day-chip"
                            onClick={() => handleBookNow(`${item.title} (${d})`, item.priceGroup)}
                            title={`დაჯავშნეთ ${item.title} — ${d}`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== TRANSPORT SECTION ==================== */}
      <section className="transport-section" id="batumi-tours">
        <div className="container transport-hero">
          <div className="transport-slider-wrapper">
            <button
              className="slider-arrow slider-arrow-left"
              id="transport-prev"
              aria-label="Previous"
              onClick={() => {
                const el = document.getElementById('transport-photos-grid');
                if (el) el.scrollBy({ left: -300, behavior: 'smooth' });
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <div className="transport-photos-row" id="transport-photos-grid">
              <a href="#booking" onClick={() => handleBookNow("ტრანსპორტი: ავტომობილი 1", "₾50-დან")} className="transport-photo transport-photo-1">
                <img src="1car.webp" onError={(e) => { e.currentTarget.src = "/car1.png"; }} alt="GeorgiaTrips Transport 1" />
              </a>
              <a href="#booking" onClick={() => handleBookNow("ტრანსპორტი: ავტომობილი 2", "₾90-დან")} className="transport-photo transport-photo-2">
                <img src="2car.webp" onError={(e) => { e.currentTarget.src = "/car2.png"; }} alt="GeorgiaTrips Transport 2" />
              </a>
              <a href="#booking" onClick={() => handleBookNow("ტრანსპორტი: ავტომობილი 3", "₾180-დან")} className="transport-photo transport-photo-3">
                <img src="3car.webp" onError={(e) => { e.currentTarget.src = "/car3.png"; }} alt="GeorgiaTrips Transport 3" />
              </a>
              <a href="#booking" onClick={() => handleBookNow("ტრანსპორტი: ავტომობილი 4", "₾220-დან")} className="transport-photo transport-photo-4">
                <img src="4car.webp" onError={(e) => { e.currentTarget.src = "/car4.png"; }} alt="GeorgiaTrips Transport 4" />
              </a>
            </div>
            <button
              className="slider-arrow slider-arrow-right"
              id="transport-next"
              aria-label="Next"
              onClick={() => {
                const el = document.getElementById('transport-photos-grid');
                if (el) el.scrollBy({ left: 300, behavior: 'smooth' });
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </section>


      {/* ==================== GALLERY SECTION (FIREBASE POSTS) ==================== */}
      <section className="section gallery-bg" id="gallery">
        <div className="section-inner">
          <div className="section-header">
            <span className="section-eyebrow">თვალი ადევნეთ ჩვენს მოგზაურობას</span>
            <h2 className="section-title">საქართველო ჩვენი თვალით</h2>
            <p className="section-desc">აღმოაჩინეთ საქართველოს ულამაზესი ხედები, რეალური კადრები და დაუვიწყარი ემოციები ჩვენი სოციალური გვერდებიდან</p>
            <div className="gold-line"></div>
          </div>

          {posts.length > 0 ? (
            <div className="posts-home-grid">
              {posts.map((post) => (
                <article key={post.id} className="facebook-post-card">
                  <div className="fb-post-header">
                    <div className="fb-author-wrap">
                      <div className="fb-avatar">
                        {post.avatar ? <img src={post.avatar} alt="" className="posts-author-avatar" /> : <BrandLogo width={40} height={40} />}
                      </div>
                      <div className="fb-author-info">
                        <div className="fb-name-row">
                          <strong className="fb-author-name">{post.author}</strong>
                          {post.verified && <span className="fb-verified-badge" title="დამოწმებული ოფიციალური გვერდი">✓</span>}
                        </div>
                        <div className="fb-meta-row">
                          <span className="fb-time">{post.timeTag}</span>
                          <span className="fb-dot">•</span>
                          <span className="fb-public-icon" title="საჯარო პოსტი">🌐</span>
                          <span className="fb-dot">•</span>
                          <span className="fb-location-tag">{post.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="fb-post-body">
                    <p className="fb-post-text">{post.content && post.content.length > 100 ? post.content.slice(0, 100) + "..." : post.content}</p>
                    {post.hashtags && <p className="fb-post-hashtags">{post.hashtags}</p>}
                    {post.feeling && <span className="post-feeling-badge">{post.feeling}</span>}
                  </div>

                  {post.img && (
                    <div className="fb-post-media">
                      <img src={post.img} alt={post.title} className="fb-media-img" />
                    </div>
                  )}

                  <div className="fb-reactions-bar">
                    <div className="fb-reactions-icons">
                      <svg className="fb-like-summary-icon" width="18" height="18" viewBox="0 0 24 24" fill="#29b2b7" stroke="#29b2b7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                      </svg>
                      <span className="fb-reactions-count">{post.initialLikes}</span>
                    </div>
                    <div className="fb-counts-group">
                      <span className="fb-count-item">{(post.comments || []).length} კომენტარი</span>
                      <span className="fb-dot">•</span>
                      <span className="fb-count-item">{post.sharesCount} გაზიარება</span>
                    </div>
                  </div>

                  <div className="fb-action-btns">
                    <a href="/posts" className="fb-action-btn">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                      </svg>
                      <span>მოწონება</span>
                    </a>
                    <a href="/posts" className="fb-action-btn">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                      <span>კომენტარი</span>
                    </a>
                    <a href="/posts" className="fb-action-btn">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3"/>
                        <circle cx="6" cy="12" r="3"/>
                        <circle cx="18" cy="19" r="3"/>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                      </svg>
                      <span>გაზიარება</span>
                    </a>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="posts-empty-state" style={{ margin: "0 auto" }}>
              <h2>სტატიები მალე დაემატება</h2>
              <p>თვალი ადევნეთ ჩვენს ახალ მოგზაურობის ისტორიებს.</p>
            </div>
          )}

          <div className="social-feed-more-wrap">
            <a href="/posts" className="social-feed-more-btn" style={{ textDecoration: "none" }}>
              ყველას ნახვა
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </a>
          </div>
        </div>
      </section>


      {/* ==================== GEORGIA MAP SECTION ==================== */}
      <section className="section map-section" id="map">

        <div className="section-inner">
          <div className="section-header">
            <span className="section-eyebrow">ინტერაქტიური რუკა</span>
            <h2 className="section-title">საქართველოს რეგიონები & მიმართულებები</h2>
            <p className="section-desc">გაეცანით საქართველოს ულამაზეს კუთხეებს — მიიტანეთ კურსორი სასურველ რეგიონზე დეტალების სანახავად</p>
            <div className="gold-line"></div>
          </div>
          <div className="map-wrap">
            <div className="map-svg-wrap">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 820 430"
                className="georgia-map-svg"
              >
                {[
                  { id: "GE-AB", name: "აფხაზეთი", desc: "მდინარე ენგურიდან შავ ზღვამდე", color: "#29b2b7" },
                  { id: "GE-AJ", name: "აჭარა", desc: "ბათუმი, შავი ზღვა, მთები", color: "#fab418" },
                  { id: "GE-GU", name: "გურია", desc: "მწვანე მიდამოები დასავლეთ საქართველოში", color: "#29b2b7" },
                  { id: "GE-IM", name: "იმერეთი", desc: "ქუთაისი, ისტორიული ცენტრი", color: "#106da4" },
                  { id: "GE-KA", name: "კახეთი", desc: "ქართული ღვინის სამეფო", color: "#fab418" },
                  { id: "GE-KK", name: "ქვემო ქართლი", desc: "მრავალფეროვანი კულტურა", color: "#106da4" },
                  { id: "GE-MM", name: "მცხეთა-მთიანეთი", desc: "ყაზბეგი, გერგეთი, ჯ���არი", color: "#29b2b7" },
                  { id: "GE-RL", name: "რაჭა-ლეჩხუმი", desc: "მთიანი სილამაზე", color: "#106da4" },
                  { id: "GE-SJ", name: "სამცხე-ჯავახეთი", desc: "ვარძია, ბორჯომი", color: "#29b2b7" },
                  { id: "GE-SK", name: "შიდა ქართლი", desc: "გორი, ქართული ვაკე", color: "#fab418" },
                  { id: "GE-SZ", name: "სამეგრელო-ზემო სვანეთი", desc: "მესტია, სვანური კოშკები", color: "#106da4" },
                  { id: "GE-TB", name: "თბილისი", desc: "საქართველოს დედაქალაქი", color: "#fab418" },
                ].map((region) => (
                  <path
                    key={region.id}
                    id={region.id}
                    d={MAP_PATHS[region.id]}
                    className={`map-region${activeMapRegion === region.id ? " map-region-active" : ""}`}
                    style={{ "--region-color": region.color }}
                    onMouseEnter={() => setActiveMapRegion(region.id)}
                    onMouseLeave={() => setActiveMapRegion(null)}
                    onClick={() => setActiveMapRegion(activeMapRegion === region.id ? null : region.id)}
                  />
                ))}
              </svg>
              {/* Region tooltip panel */}
              {activeMapRegion && (() => {
                const regions = [
                  { id: "GE-AB", name: "აფხაზეთი", desc: "მდინარე ენგურიდან შავ ზღვამდე" },
                  { id: "GE-AJ", name: "აჭარა", desc: "ბათუმი, შავი ზღვა, მთები" },
                  { id: "GE-GU", name: "გურია", desc: "მწვანე მხარე დასავლეთ საქართველოში" },
                  { id: "GE-IM", name: "იმერეთი", desc: "ქუთაისი, ისტორიული ცენტრი" },
                  { id: "GE-KA", name: "კახეთი", desc: "ქართული ღვინის სამეფო" },
                  { id: "GE-KK", name: "ქვემო ����რთლი", desc: "მრავალფეროვანი კულტურა" },
                  { id: "GE-MM", name: "მცხეთა-მთიანეთი", desc: "ყაზბეგი, გერგეთი, ჯვარი" },
                  { id: "GE-RL", name: "რაჭა-ლეჩხუმი", desc: "მთიანი სილამაზე" },
                  { id: "GE-SJ", name: "სამცხე-ჯავახეთი", desc: "ვარძია, ბორჯომი" },
                  { id: "GE-SK", name: "შიდა ქართლი", desc: "გორი, ქართული ვაკე" },
                  { id: "GE-SZ", name: "სამეგრელო-ზემო სვანეთი", desc: "მესტია, სვანური კოშკები" },
                  { id: "GE-TB", name: "თბილისი", desc: "საქართველოს დედაქალაქი" },
                ];
                const r = regions.find(x => x.id === activeMapRegion);
                return r ? (
                  <div className="map-tooltip">
                    <span className="map-tooltip-name">{r.name}</span>
                    <span className="map-tooltip-desc">{r.desc}</span>
                  </div>
                ) : null;
              })()}
            </div>
            {/* Region legend chips */}
            <div className="map-legend">
              {[
                { id: "GE-AB", name: "აფხაზეთი" },
                { id: "GE-AJ", name: "აჭარა" },
                { id: "GE-GU", name: "გურია" },
                { id: "GE-IM", name: "იმერეთი" },
                { id: "GE-KA", name: "კახეთი" },
                { id: "GE-KK", name: "ქვემო ქართლი" },
                { id: "GE-MM", name: "მცხეთა-მთიანეთი" },
                { id: "GE-RL", name: "რაჭა-ლეჩხუმი" },
                { id: "GE-SJ", name: "სამცხე-ჯავახეთი" },
                { id: "GE-SK", name: "შიდა ქართლი" },
                { id: "GE-SZ", name: "სამეგრელო-ზემო სვანეთი" },
                { id: "GE-TB", name: "თბილისი" },
              ].map((r) => (
                <button
                  key={r.id}
                  className={`map-chip${activeMapRegion === r.id ? " map-chip-active" : ""}`}
                  onMouseEnter={() => setActiveMapRegion(r.id)}
                  onMouseLeave={() => setActiveMapRegion(null)}
                  onClick={() => setActiveMapRegion(activeMapRegion === r.id ? null : r.id)}
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FAQ SECTION ==================== */}
      <section className="section" id="faq">
        <div className="section-inner">
          <div className="section-header">
            <span className="section-eyebrow">ხშირად დასმული კითხვები</span>
            <h2 className="section-title">გაქვთ კითხვა? ჩვენ გვაქვს პასუხი</h2>
            <p className="section-desc">ყველაფერი, რაც მოგზაურობის დაგეგმვამდე უნდა იცოდეთ</p>
            <div className="gold-line"></div>
          </div>
          <div className="faq-list">
            {FAQS.map((faq, idx) => (
              <div key={idx} className={`faq-item ${openFaq === idx ? "open" : ""}`}>
                <button
                  className="faq-question"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  aria-expanded={openFaq === idx}
                  aria-controls={`faq-answer-${idx}`}
                >
                  <span>{faq.q}</span>
                  <svg className="faq-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                <div className="faq-answer" id={`faq-answer-${idx}`}>
                  <div className="faq-answer-inner">
                    <p>{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ==================== WEATHER SECTION ==================== */}
      <section className="section weather-section" id="weather">
        <div className="section-inner">
          <div className="section-header">
            <span className="section-eyebrow">მოგზაურთა გზამკვლევი</span>
            <h2 className="section-title">ამინდის პროგნოზი</h2>
            <p className="section-desc">შეიტყვეთ მიმდინარე ამინდი და პროგნოზი საქართველოს მთავარ ტურისტულ მიმართულებებში</p>
            <div className="gold-line"></div>
            <div className={`weather-live-badge ${isLiveWeather ? "on" : ""}`}>
              <span className="weather-live-dot" aria-hidden="true"></span>
              {weatherLoading
                ? "ცოცხალი მონაცემების ჩატვირთვა..."
                : isLiveWeather
                  ? "ცოცხალი მონაცემები — Open-Meteo"
                  : "მიახლოებითი მონაცემები"}
            </div>
          </div>

          <div className="weather-wrap">
            {/* Location selector tabs */}
            <div className="weather-tabs">
              {Object.keys(weatherData).map((key) => (
                <button
                  key={key}
                  className={`weather-tab-btn ${activeWeatherTab === key ? "active" : ""}`}
                  onClick={() => setActiveWeatherTab(key)}
                >
                  {weatherData[key].name}
                </button>
              ))}
            </div>

            {/* Weather Dashboard Card */}
            {(() => {
              const current = weatherData[activeWeatherTab];
              return (
                <div className="weather-dashboard">
                  <div className="weather-main-card">
                    <div className="weather-main-header">
                      <div className="weather-main-icon">
                        {ICONS[current.icon]}
                      </div>
                      <div className="weather-main-temp-row">
                        <span className="weather-main-temp">{current.temp}</span>
                        <span className="weather-main-cond">{current.condition}</span>
                      </div>
                    </div>
                    <p className="weather-main-desc">{current.desc}</p>

                    <div className="weather-metrics">
                      <div className="weather-metric">
                        <span className="metric-label">ტენიანობა</span>
                        <span className="metric-val">{current.humidity}</span>
                      </div>
                      <div className="weather-metric">
                        <span className="metric-label">ქარი</span>
                        <span className="metric-val">{current.wind}</span>
                      </div>
                      <div className="weather-metric">
                        <span className="metric-label">UV ინდექსი</span>
                        <span className="metric-val">{current.uv}</span>
                      </div>
                    </div>
                  </div>

                  <div className="weather-forecast-side">
                    <h4 className="forecast-title">3 დღის პროგნოზი</h4>
                    <div className="forecast-list">
                      {current.forecast.map((f, fIdx) => (
                        <div key={fIdx} className="forecast-row">
                          <span className="forecast-day">{f.day}</span>
                          <span className="forecast-icon">{ICONS[f.condition]}</span>
                          <span className="forecast-temp">{f.temp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* ==================== BACK TO TOP ==================== */}
      <button
        className={`back-to-top ${navScrolled ? "visible" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="დაბრუნება თავში"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>

      {/* ==================== FLOATING WHATSAPP BUTTON ==================== */}
      <div className="floating-wa">
        <span className="floating-wa-tooltip">მოგვწერეთ WhatsApp-ზე</span>
        <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="floating-wa-btn">
          {ICONS.wa}
        </a>
      </div>

      {/* ==================== FOOTER ==================== */}
      <Footer />
    </>
  );
}
