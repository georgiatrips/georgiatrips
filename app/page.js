"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import useSWR from "swr";
import { MAP_PATHS } from "./mapPaths";

const fetcher = (url) => fetch(url).then((r) => r.json());

// ============================================================
// CONFIG & STATIC DATA
// ============================================================
const WA_NUMBER = "995555000000"; // Change to real WhatsApp number
const WA_LINK = `https://wa.me/${WA_NUMBER}`;

const IMAGES = {
  hero:     "/hero.png",
  tbilisi:  "/tbilisi.png",
  batumi:   "/batumi.png",
  kakheti:  "/kakheti.png",
  mestia:   "/mestia.png",
  villa:    "/villa.png",
  kazbegi:  "https://images.unsplash.com/photo-1565008576549-57569a49371d?w=800&q=80",
  heli:     "https://images.unsplash.com/photo-1601976903559-a0aadc42f8f0?w=800&q=80",
  family:   "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80",
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
    a: "დიახ, ჯავშნის უფასო გაუქმება შესაძლებელია ტურის დაწყებამდე 48 საათით ადრე. დეტალური პირობები დამოკიდებულია ტურის ტიპზე და დაზუსტდება დაჯავშნისას.",
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
    icon: "🏔️",
    title: "შიდა ტურები",
    desc: "საქართველოს ყველა კუთხე — ყაზბეგიდან ბათუმამდე, სვანეთიდან კახეთამდე.",
  },
  {
    icon: "✈️",
    title: "ტურები საზღვარგარეთ",
    desc: "ევროპა, აზია, ხმელთაშუა ზღვა — სრული ორგანიზებითა და ექსკლუზიური პირობებით.",
  },
  {
    icon: "💎",
    title: "პრემიუმ & VIP",
    desc: "კერძო ტურები, VIP ვილები, ვერტმფრენები — მხოლოდ უმაღლესი კლასი.",
  },
  {
    icon: "🚗",
    title: "ტრანსფერები",
    desc: "კომფორტული გადაადგილება ნებისმიერ მიმართულებით — 24/7, პრემიუმ ავტომობილებით.",
  },
];

const BATUMI_TOURS = [
  {
    img: IMAGES.batumi,
    badge: "მთიანი აჭარა",
    price: "₾120-დან",
    title: "ხულო, მწვანე ტბა და გოდერძი",
    desc: "აღმოაჩინეთ მაღალმთიანი აჭარის საოცრებები — გასეირნება საბაგიროთი ხულოში, მწვანე ტბის ალპური სილამაზე და გოდერძის უღელტეხილი.",
    duration: "1 დღე",
    people: "2-10 კაცი",
  },
  {
    img: IMAGES.villa,
    badge: "ეთნო ტური",
    price: "₾90-დან",
    title: "მაჭახელას ხეობა და აჭარული სუფრა",
    desc: "ისტორიული ხიდები, ჩანჩქერები, იარაღის მუზეუმი და ნამდვილი აჭარული სუფრა ფოლკლორული შოუთი და ცეკვებით ადგილობრივ ოჯახში.",
    duration: "1 დღე",
    people: "4-15 კაცი",
  },
  {
    img: "https://images.unsplash.com/photo-1540202404-d0c7fe46a087?w=700&q=75",
    badge: "ეკო ტური",
    price: "₾80-დან",
    title: "მტირალას ეროვნული პარკი",
    desc: "მოგზაურობა ევროპის ყველაზე ნოტიო პარკში — ტყის ბილიკები, ზიპლაინი, ტბაზე ნავით გასეირნება და ულამაზესი ხელუხლებელი ბუნება.",
    duration: "1 დღე",
    people: "2-12 კაცი",
  },
  {
    img: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=700&q=75",
    badge: "კულტურა & ბუნება",
    price: "₾70-დან",
    title: "ბოტანიკური ბაღი & ციხისძირი",
    desc: "მწვანე კონცხის ბოტანიკური ბაღი, პეტრას ციხის ისტორიული ნანგრევები და ულამაზესი პანორამული ხედები ზღვაზე ციხისძირიდან.",
    duration: "1 დღე",
    people: "2-15 კაცი",
  }
];

const TOURS = [
  {
    img: IMAGES.tbilisi,
    badge: "ყველაზე პოპულარული",
    price: "₾150-დან",
    title: "თბილისის ქალაქური ტური",
    desc: "მეტეხიდან ნარიყალამდე — ისტორია, ძველი ქალაქის აბანოები, ქართული სამზარეულო და ულამაზესი ხედები.",
    duration: "1 დღე",
    people: "2-12 კაცი",
  },
  {
    img: IMAGES.batumi,
    badge: "ზღვა და დასვენება",
    price: "₾200-დან",
    title: "ბათუმის სანაპირო",
    desc: "შავი ზღვის სანაპირო, ულამაზესი ბულვარი, ბოტანიკური ბაღი და აჭარული ხაჭაპურის მასტერკლასი.",
    duration: "2 დღე",
    people: "2-8 კაცი",
  },
  {
    img: IMAGES.kazbegi,
    badge: "მთის ჰაერი",
    price: "₾170-დან",
    title: "ყაზბეგის მთები",
    desc: "გერგეთის სამება, ულამაზესი ხედი მყინვარწვერზე, დაუვიწყარი ხეობები და ავთენტური მთის ხინკალი.",
    duration: "1 დღე",
    people: "2-15 კაცი",
  },
  {
    img: IMAGES.kakheti,
    badge: "ღვინის სამშობლო",
    price: "₾180-დან",
    title: "კახეთის ღვინის ტური",
    desc: "სიღნაღი, ბოდბის მონასტერი, ტრადიციული ქვევრის ღვინის დეგუსტაცია და ქართული სუფრა კახურ მარანში.",
    duration: "1 დღე",
    people: "2-10 კაცი",
  },
  {
    img: IMAGES.mestia,
    badge: "საუკუნეების საიდუმლო",
    price: "₾350-დან",
    title: "მესტიის თავგადასავალი",
    desc: "სვანური კოშკები, უშგული — ევროპაში ყველაზე მაღალი დასახლება, უნიკალური კულტურა და მთის მწვერვალები.",
    duration: "3 დღე",
    people: "2-6 კაცი",
  },
  {
    img: IMAGES.villa,
    badge: "VIP ექსკლუზივი",
    price: "₾800-დან",
    title: "VIP ფუფუნების ვილები",
    desc: "ექსკლუზიური დასვენება საქართველოს საუკეთესო კურორტებზე, პერსონალური მზარეულითა და პირადი ასისტენტით.",
    duration: "3-7 დღე",
    people: "2-4 კაცი",
  },
  {
    img: IMAGES.heli,
    badge: "პანორამული ხედები",
    price: "₾1200-დან",
    title: "ვერტმფრენის ტურები",
    desc: "აღმოაჩინეთ კავკასიის მწვერვალები და მიუწვდომელი ხეობები ჩიტის ფრენის სიმაღლიდან.",
    duration: "ნახევარი დღე",
    people: "2-4 კაცი",
  },
  {
    img: IMAGES.family,
    badge: "საოჯახო",
    price: "₾450-დან",
    title: "საოჯახო პაკეტი",
    desc: "სპეციალურად დაგეგმილი მშვიდი მარშრუტები ბავშვებთან ერთად კომფორტული მგზავრობით.",
    duration: "5 დღე",
    people: "4-8 კაცი",
  },
];

const REVIEWS = [
  [
    {
      text: "GeorgiaTrips-ის VIP ტურმა მოლოდინს გადააჭარბა. კერძო მძღოლი და ვერტმფრენის ტური უმაღლესი დონის ი��ო. ნამდვილი ფუფუნება საქართველოში!",
      author: "ალი ალ-ფარაჯი",
      from: "დუბაი, არაბთა გაერთიანებული საამიროები",
      avatar: "A",
    },
    {
      text: "საუკეთესო ოჯახური შვებულება! გიდი ძალიან მეგობრული იყო, ბავშვებისთვის საინტერესო აქტივობებით. ჰალალ კვების ორგანიზება იყო იდეალური.",
      author: "ფატიმა ხალიდი",
      from: "რიადი, საუდის არაბეთი",
      avatar: "F",
    },
  ],
  [
    {
      text: "ყაზბეგის მთები და გერგეთის სამება საოცარი იყო. GeorgiaTrips-მა დაგვიგეგმა ულამაზესი ტური. მადლობა 24/7 მხარდაჭერისთვის!",
      author: "ომარ იასინი",
      from: "ქუვეითი",
      avatar: "O",
    },
    {
      text: "საუკეთესო სერვისი და პროფესიონალიზმი. კახეთის ტურით და ქართული სტუმართმოყვარეობით აღფრთოვანებულები დავრჩით.",
      author: "ლეილა მანსური",
      from: "კატარი",
      avatar: "L",
    },
  ],
];

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
    desc: "იდეალური ამინდია ძველ თბილისში სასეირნოდ და მყუდრო კაფეებში დროის გასატარებლად.",
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
      { day: "შემდეგ", temp: "28°C", condition: "sun" }
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
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12.003 2C6.477 2 2 6.477 2 12c0 1.989.574 3.842 1.563 5.406L2 22l4.682-1.528A9.956 9.956 0 0012.003 22C17.529 22 22 17.523 22 12S17.529 2 12.003 2zm0 18c-1.676 0-3.26-.455-4.627-1.247l-.331-.198-3.454 1.128 1.156-3.366-.215-.348A7.957 7.957 0 014.003 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"/>
    </svg>
  ),
  plane: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16l-5-5 2-8-6 4-3-3-3 3-3-4 2 8-5 5 8 1z"/>
    </svg>
  ),
  clock: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  people: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  arrow: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  sun: (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fab418" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="weather-svg-sun">
      <circle cx="12" cy="12" r="5" fill="#fab418" fillOpacity="0.1"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  ),
  "cloud-sun": (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41" stroke="#fab418"/>
      <circle cx="12" cy="12" r="4" stroke="#fab418"/>
      <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" fill="var(--blue)" fillOpacity="0.1" stroke="var(--blue)"/>
      <path d="M8 16a3 3 0 0 0 3-3H6.5A3 3 0 0 0 8 16z" fill="var(--blue)"/>
    </svg>
  ),
  rain: (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="15" x2="12" y2="23"/><line x1="8" y1="17" x2="8" y2="21"/><line x1="16" y1="17" x2="16" y2="21"/>
      <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" fill="var(--blue)" fillOpacity="0.1"/>
    </svg>
  ),
  storm: (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" fill="var(--text-mute)" fillOpacity="0.1" stroke="var(--text-mute)"/>
      <polyline points="13 12 9 17 12 17 10 22" stroke="#fab418" strokeWidth="2.5" fill="#fab418"/>
    </svg>
  )
};

export default function Home() {
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toursDropdownOpen, setToursDropdownOpen] = useState(false);
  const [mobilToursOpen, setMobilToursOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [activeLang, setActiveLang] = useState("KA");
  const [activeCurrency, setActiveCurrency] = useState("GEL");
  const [activeReviewSlide, setActiveReviewSlide] = useState(0);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
  const [showAllSocial, setShowAllSocial] = useState(false);
  const [activeMapRegion, setActiveMapRegion] = useState(null);
  const [activeWeatherTab, setActiveWeatherTab] = useState("tbilisi");
  const [openFaq, setOpenFaq] = useState(0);

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

    // Review Slider Auto Play
    const interval = setInterval(() => {
      setActiveReviewSlide((prev) => (prev + 1) % REVIEWS.length);
    }, 5000);

    // Hero Background Slider Auto Play (10s)
    const heroInterval = setInterval(() => {
      setCurrentHeroSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 10000);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearInterval(interval);
      clearInterval(heroInterval);
    };
  }, []);

  // Scroll-reveal animation for all sections
  useEffect(() => {
    const targets = document.querySelectorAll(
      ".section-header, .categories-grid, .why-wrap, .booking-wrap, .weather-wrap, .map-wrap, .reviews-slider, .social-feed-grid, .stats-grid, .faq-list, .batumi-section-header, .intl-header"
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
      <nav className={`nav ${navScrolled ? "scrolled" : ""}`}>
        {/* Logo */}
        <a href="#home" className="nav-logo" aria-label="GeorgiaTrips — მთავარი">
          <BrandLogo priority />
          <span className="nav-wordmark">
            <span className="nav-wordmark-georgia">Georgia</span>
            <span className="nav-wordmark-trips">Trips</span>
          </span>
        </a>

        {/* Desktop Links */}
        <ul className="nav-links">
          <li><a href="#home">მთავარი</a></li>
          <li
            className="nav-dropdown-wrap"
            onMouseEnter={() => setToursDropdownOpen(true)}
            onMouseLeave={() => setToursDropdownOpen(false)}
          >
            <button className="nav-dropdown-trigger" aria-haspopup="true" aria-expanded={toursDropdownOpen}>
              ტურები
              <svg className={`nav-chevron ${toursDropdownOpen ? "open" : ""}`} width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {toursDropdownOpen && (
              <div className="nav-dropdown">
                <a href="#tours" className="nav-dropdown-item">შიდა ტურები</a>
                <a href="#international" className="nav-dropdown-item">საერთაშორისო ტურები</a>
              </div>
            )}
          </li>
          <li><a href="#batumi-tours">ტრანსპორტი</a></li>
          <li><a href="#why">სტატიები</a></li>
          <li><a href="#home">ჩვენ შესახებ</a></li>
          <li><a href="#booking">კონტაქტი</a></li>
        </ul>

        {/* Right Side Controls */}
        <div className="nav-right">
          {/* Language Switcher */}
          <div className="nav-control-wrap" onMouseEnter={() => setLangDropdownOpen(true)} onMouseLeave={() => setLangDropdownOpen(false)}>
            <button className="nav-control-btn" aria-label="ენის შეცვლა">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              <span>{activeLang}</span>
              <svg className={`nav-chevron ${langDropdownOpen ? "open" : ""}`} width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {langDropdownOpen && (
              <div className="nav-dropdown nav-dropdown-sm">
                {["KA", "EN", "RU", "AR"].map(lang => (
                  <button key={lang} className={`nav-dropdown-item ${activeLang === lang ? "active" : ""}`} onClick={() => { setActiveLang(lang); setLangDropdownOpen(false); }}>
                    {lang}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Currency Switcher */}
          <div className="nav-control-wrap" onMouseEnter={() => setCurrencyDropdownOpen(true)} onMouseLeave={() => setCurrencyDropdownOpen(false)}>
            <button className="nav-control-btn" aria-label="ვალუტის შეცვლა">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v12M9 8h4.5a2.5 2.5 0 0 1 0 5H9m0 0h4.5a2.5 2.5 0 0 1 0 5H9"/>
              </svg>
              <span>{activeCurrency}</span>
              <svg className={`nav-chevron ${currencyDropdownOpen ? "open" : ""}`} width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {currencyDropdownOpen && (
              <div className="nav-dropdown nav-dropdown-sm">
                {["GEL", "USD", "EUR", "AED"].map(cur => (
                  <button key={cur} className={`nav-dropdown-item ${activeCurrency === cur ? "active" : ""}`} onClick={() => { setActiveCurrency(cur); setCurrencyDropdownOpen(false); }}>
                    {cur}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Login Button */}
          <a href="#booking" className="nav-login-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            შესვლა
          </a>
        </div>

        {/* Mobile Hamburger */}
        <button 
          className="nav-hamburger" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="მენიუ"
          aria-expanded={mobileMenuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Mobile Navigation Dropdown */}
        <div className={`nav-mobile ${mobileMenuOpen ? "open" : ""}`}>
          <a href="#home" onClick={() => setMobileMenuOpen(false)}>მთავარი</a>
          <div className="nav-mobile-dropdown">
            <button className="nav-mobile-section-btn" onClick={() => setMobilToursOpen(!mobilToursOpen)}>
              ტურები
              <svg className={`nav-chevron ${mobilToursOpen ? "open" : ""}`} width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {mobilToursOpen && (
              <div className="nav-mobile-sub">
                <a href="#tours" onClick={() => setMobileMenuOpen(false)}>შიდა ტურები</a>
                <a href="#international" onClick={() => setMobileMenuOpen(false)}>საერთაშორისო ტურები</a>
              </div>
            )}
          </div>
          <a href="#batumi-tours" onClick={() => setMobileMenuOpen(false)}>ტრანსპორტი</a>
          <a href="#why" onClick={() => setMobileMenuOpen(false)}>სტატიები</a>
          <a href="#home" onClick={() => setMobileMenuOpen(false)}>ჩვენ შესახებ</a>
          <a href="#booking" onClick={() => setMobileMenuOpen(false)}>კონტაქტი</a>
          <div className="nav-mobile-controls">
            <div className="nav-mobile-ctrl-row">
              <span>ენა:</span>
              {["KA", "EN", "RU", "AR"].map(lang => (
                <button key={lang} className={`nav-mobile-ctrl-btn ${activeLang === lang ? "active" : ""}`} onClick={() => setActiveLang(lang)}>{lang}</button>
              ))}
            </div>
            <div className="nav-mobile-ctrl-row">
              <span>ვალუტა:</span>
              {["GEL", "USD", "EUR", "AED"].map(cur => (
                <button key={cur} className={`nav-mobile-ctrl-btn ${activeCurrency === cur ? "active" : ""}`} onClick={() => setActiveCurrency(cur)}>{cur}</button>
              ))}
            </div>
          </div>
          <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
            {ICONS.wa} WhatsApp-ზე მოგვწერეთ
          </a>
        </div>
      </nav>

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
            <span>✦</span>
            <span>Georgia Trips — Travel Company</span>
          </div>
          
          <h1 className="hero-title">
            აღმოაჩინეთ<br/>
            <em>საქართველო</em>
          </h1>

          <p className="hero-sub">
            კავკასიონის მთებიდან შავი ზღვის სანაპირომდე — შექმენით თქვენი
            დაუვიწყარი მოგზაურობა ჩვენთან ერთად.
          </p>

          <div className="hero-locations">
            <span className="hero-loc-tag">🏔️ ყაზბეგი</span>
            <span className="hero-loc-divider"></span>
            <span className="hero-loc-tag">🏖️ ბათუმი</span>
            <span className="hero-loc-divider"></span>
            <span className="hero-loc-tag">🏛️ თბილისი</span>
            <span className="hero-loc-divider"></span>
            <span className="hero-loc-tag">🍇 კახეთი</span>
            <span className="hero-loc-divider"></span>
            <span className="hero-loc-tag">🏔️ სვანეთი</span>
          </div>

          <div className="hero-buttons">
            <a href="#booking" className="btn-primary">
              {ICONS.plane}
              <span>დაგეგმეთ მოგზაურობა</span>
            </a>
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
              {ICONS.wa}
              <span>WhatsApp-ზე მოგვწერეთ</span>
            </a>
          </div>
        </div>

        <div className="hero-location-badge">
          <span className="loc-pin">📍</span>
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

        <div className="hero-scroll-hint">
          <span>გადაახვიე</span>
        </div>
      </section>

      {/* ==================== STATS BAND ==================== */}
      <section className="stats-band" aria-label="სტატისტიკა">
        <div className="stats-grid">
          {STATS.map((stat, idx) => (
            <div key={idx} className="stat-item">
              <CountUp end={stat.value} suffix={stat.suffix} />
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== TOUR CATEGORIES ==================== */}
      <section className="section" id="categories">
        <div className="section-inner">
          <div className="section-header">
            <span className="section-eyebrow">ჩვენი სერვისები</span>
            <h2 className="section-title">მიმართულებები და მომსახურება</h2>
            <p className="section-desc">საქართველოს ულამაზესი კუთხეები, საზღვარგარეთის ეგზოტიკური ტურები და პრემიუმ კლასის ტრანსფერები თქვენი კომფორტისთვის.</p>
            <div className="gold-line"></div>
          </div>
          <div className="categories-grid">
            {CATEGORIES.map((cat, idx) => (
              <div
                key={idx}
                className="category-card"
                onClick={() => document.querySelector("#booking")?.scrollIntoView({ behavior: "smooth" })}
              >
                <div className="category-icon">{cat.icon}</div>
                <h3 className="category-title">{cat.title}</h3>
                <p className="category-desc">{cat.desc}</p>
                <span className="category-cta">დაჯავშნეთ {ICONS.arrow}</span>
                <div className="category-glow"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== BATUMI TOURS SECTION ==================== */}
      <section className="batumi-section" id="batumi-tours">
        <div className="batumi-section-header">
          <div>
            <span className="section-eyebrow">🌊 აჭარის მიმართულება</span>
            <h2 className="batumi-section-title">ბათუმი & რეგიონის ტურები</h2>
          </div>
          <p className="batumi-section-sub">ზღვა, მთა, ხეობები — ერთ რეგიონში</p>
        </div>

        <div className="batumi-carousel-outer">
          <button
            className="batumi-nav batumi-nav-prev"
            aria-label="წინა"
            onClick={() => document.getElementById('batumi-track').scrollBy({ left: -400, behavior: 'smooth' })}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>

          <div className="batumi-track" id="batumi-track">
            {BATUMI_TOURS.map((tour, idx) => (
              <article key={idx} className="batumi-cin-card" onClick={() => handleBookNow(tour.title, tour.price)}>
                <Image src={tour.img} alt={tour.title} className="batumi-cin-img" fill style={{objectFit:"cover"}} />
                <div className="batumi-cin-overlay" />
                <span className="batumi-cin-badge">{tour.badge}</span>
                <div className="batumi-cin-body">
                  <div className="batumi-cin-meta">
                    <span>⏱ {tour.duration}</span>
                    <span>·</span>
                    <span>{tour.people}</span>
                  </div>
                  <h3 className="batumi-cin-title">{tour.title}</h3>
                  <p className="batumi-cin-desc">{tour.desc}</p>
                  <div className="batumi-cin-footer">
                    <span className="batumi-cin-price">{tour.price}</span>
                    <span className="batumi-cin-cta">დაჯავშნეთ {ICONS.arrow}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <button
            className="batumi-nav batumi-nav-next"
            aria-label="შემდეგი"
            onClick={() => document.getElementById('batumi-track').scrollBy({ left: 400, behavior: 'smooth' })}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>
      </section>

      {/* ==================== FEATURED TOURS SECTION ==================== */}
      <section className="tours-section" id="tours">
        {/* Batumi cinematic banner strip */}
        <div className="tours-hero-strip">
          <Image src={IMAGES.hero} alt="საქართველო" fill className="tours-strip-img" style={{objectFit:"cover"}} />
          <div className="tours-strip-overlay" />
          <div className="tours-strip-text">
            <span className="tours-strip-eyebrow">ჩვენი ტურები</span>
            <h2 className="tours-strip-title">პოპულარული მარშრუტები</h2>
            <p className="tours-strip-desc">აირჩიეთ სასურველი ტური და დაიწყეთ დაუვიწყარი მოგზაურობა</p>
          </div>
        </div>

        {/* Carousel */}
        <div className="tours-carousel-wrap">
          <button
            className="carousel-nav carousel-prev"
            aria-label="წინა"
            onClick={() => {
              document.getElementById('tours-track').scrollBy({ left: -380, behavior: 'smooth' });
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>

          <div className="tours-track" id="tours-track">
            {TOURS.map((tour, idx) => (
              <article key={idx} className="tour-card">
                <div className="tour-card-img-wrap">
                  <Image
                    src={tour.img}
                    alt={tour.title}
                    className="tour-card-img"
                    width={400}
                    height={260}
                    loading="lazy"
                  />
                  <span className="tour-card-badge">{tour.badge}</span>
                  <span className="tour-card-price">{tour.price}</span>
                </div>
                <div className="tour-card-body">
                  <div className="tour-card-meta">
                    <span className="tour-meta-item">{ICONS.clock} {tour.duration}</span>
                    <span className="tour-meta-item">{ICONS.people} {tour.people}</span>
                  </div>
                  <h3 className="tour-card-title">{tour.title}</h3>
                  <p className="tour-card-desc">{tour.desc}</p>
                  <div className="tour-card-footer">
                    <div className="tour-rating">★★★★★</div>
                    <button className="btn-book" onClick={() => handleBookNow(tour.title, tour.price)}>
                      დაჯავშნეთ {ICONS.arrow}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <button
            className="carousel-nav carousel-next"
            aria-label="შემდეგი"
            onClick={() => {
              document.getElementById('tours-track').scrollBy({ left: 380, behavior: 'smooth' });
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>
      </section>

      {/* ==================== INTERNATIONAL TOURS SECTION ==================== */}
      <section className="intl-section" id="international">
        <div className="intl-inner">
          <div className="intl-header">
            <div>
              <span className="section-eyebrow">✈️ გლობალური მიმართულებები</span>
              <h2 className="intl-title">ტურები საზღვარგარეთ</h2>
            </div>
            <p className="intl-subtitle">მოგზაურობა სრული ორგანიზებით — ავიაბილეთები, პრემიუმ სასტუმროები და გიდი</p>
          </div>

          <div className="intl-carousel-wrap">
            <button
              className="intl-nav intl-prev"
              aria-label="წინა"
              onClick={() => {
                document.getElementById('intl-track').scrollBy({ left: -380, behavior: 'smooth' });
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>

            <div className="intl-track" id="intl-track">
              {[
                {
                  img: "https://images.unsplash.com/photo-1499856871958-5b9357976b82?w=800&q=80",
                  city: "პარიზი",
                  country: "საფრანგეთი",
                  tag: "პოპულარული",
                  price: "₾1,800-დან",
                  desc: "ეიფელის კოშკი, ლუვრი, მონმარტი და რომანტიკული ვახშამი სენაზე.",
                },
                {
                  img: "https://images.unsplash.com/photo-1520175480921-4edfa2983e0f?w=800&q=80",
                  city: "დუბაი",
                  country: "არაბეთის საემიროები",
                  tag: "VIP ექსკლუზივი",
                  price: "₾2,200-დან",
                  desc: "ბურჯ ხალიფა, უდაბნოს საფარი, დასვენება ჯუმეირას სანაპიროზე.",
                },
                {
                  img: "https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=800&q=80",
                  city: "ლონდონი",
                  country: "დიდი ბრიტანეთი",
                  tag: "კულტურული",
                  price: "₾1,950-დან",
                  desc: "ბიგ ბენი, ტაუერის ხიდი, ბუკინჰემის სასახლე და მუზეუმები.",
                },
                {
                  img: "https://images.unsplash.com/photo-1555992336-03a23c7b20ee?w=800&q=80",
                  city: "სანტორინი",
                  country: "საბერძნეთი",
                  tag: "დასვენება",
                  price: "₾1,400-დან",
                  desc: "ცისფერი გუმბათები, ეგეოსის ზღვის ულამაზესი მზის ჩასვლა.",
                },
                {
                  img: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&q=80",
                  city: "სტამბული",
                  country: "თურქეთი",
                  tag: "ისტორიული",
                  price: "₾900-დან",
                  desc: "ბოსფორის კრუიზი, აია-სოფია, ლურჯი მეჩეთი და დიდი ბაზარი.",
                },
              ].map((dest, idx) => (
                <article
                  key={idx}
                  className="intl-card"
                  onClick={() => handleBookNow(`${dest.city} — ${dest.country}`, dest.price)}
                >
                  <div className="intl-card-img-wrap">
                    <Image src={dest.img} alt={dest.city} fill className="intl-card-img" style={{objectFit:"cover"}} />
                    <span className="intl-card-tag">{dest.tag}</span>
                    <span className="intl-card-price">{dest.price}</span>
                  </div>
                  <div className="intl-card-body">
                    <h3 className="intl-card-city">{dest.city}</h3>
                    <p className="intl-card-desc">{dest.desc}</p>
                    <div className="intl-card-footer">
                      <span className="intl-card-country">📍 {dest.country}</span>
                      <span className="intl-card-cta">დაჯავშნეთ {ICONS.arrow}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <button
              className="intl-nav intl-next"
              aria-label="შემდეგი"
              onClick={() => {
                document.getElementById('intl-track').scrollBy({ left: 380, behavior: 'smooth' });
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* ==================== WHY GEORGIA SECTION ==================== */}
      <section className="section" id="why">
        <div className="section-inner">
          <div className="why-wrap">
            <div className="why-visual">
              <div className="why-img-main">
                <Image src={IMAGES.hero} alt="საქართველო" width={550} height={480} loading="lazy" />
              </div>
              <div className="why-img-accent">
                <Image src={IMAGES.tbilisi} alt="თბილისი" width={180} height={180} loading="lazy" />
              </div>
              <div className="why-badge-float">
                <div className="badge-icon">🏆</div>
                <div className="badge-text">
                  <strong>500+ კმაყოფილი</strong>
                  <span>ტურისტი წელს</span>
                </div>
              </div>
            </div>
            <div className="why-content">
              <div className="section-header">
                <span className="section-eyebrow">რატომ საქართველო?</span>
                <h2 className="section-title">კავკასიის ჯადოსნური ქვეყანა</h2>
                <p className="section-desc">ეს ქვეყანა გთავაზობს ყველაფერს — ისტორიას, ბუნებას, ღვინოს და გამორჩეულ სტუმართმოყვარეობას.</p>
                <div className="gold-line"></div>
              </div>
              <div className="why-features">
                {[
                  { icon: "✈️", title: "უვიზო რეჟიმი", desc: "მოგზაურობა უვიზოდ ბევრი ქვეყნის მოქალაქისთვის — სწრაფი და მარტივი." },
                  { icon: "🛡️", title: "უსაფრთხო ქვეყანა", desc: "სტატისტიკურად ერთ-ერთი ყველაზე უსაფრთხო და მეგობრული ქვეყანა ევროპაში." },
                  { icon: "🍽️", title: "ჰალალ საკვები ხელმისაწვდომია", desc: "უგემრიელესი ჰალალ სამზარეულო თბილისში, ბათუმსა და კურორტებზე." },
                  { icon: "🕐", title: "24/7 მხარდაჭერა", desc: "ჩვენი გუნდი მზადაა დაგეხმაროთ ნებისმიერ დროს ნებისმიერ საკითხზე." },
                  { icon: "💎", title: "ლუქს კლასის სერვისები", desc: "კერძო ვილებიდან დაწყებული, ვერტმფრენის ტურებით დასრულებული." }
                ].map((item, idx) => (
                  <div key={idx} className="why-feature">
                    <div className="why-feature-icon">{item.icon}</div>
                    <div className="why-feature-text">
                      <h4>{item.title}</h4>
                      <p>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== GALLERY SECTION (SOCIAL MEDIA FEED) ==================== */}
      <section className="section gallery-bg" id="gallery">
        <div className="section-inner">
          <div className="section-header">
            <span className="section-eyebrow">სოციალური მედია</span>
            <h2 className="section-title">საქართველო ჩვენი ობიექტივით</h2>
            <p className="section-desc">გაეცანით ჩვენს მოგზაურობებს სოციალური ქსელებიდან — რეალური კადრები და ემოციები</p>
            <div className="gold-line"></div>
          </div>
          
          <div className={`social-feed-grid ${showAllSocial ? "show-all" : ""}`}>
            {SOCIAL_POSTS.map((post, idx) => (
              <article key={idx} className={`social-post-card social-${post.platform}`}>
                {/* Post Header */}
                <div className="sp-header">
                  <div className="sp-avatar-wrap">
                    <img src={post.avatar} alt={post.username} className="sp-avatar" />
                  </div>
                  <div className="sp-user-info">
                    <div className="sp-username-row">
                      <span className="sp-username">{post.username}</span>
                      {post.platform !== "instagram" && <span className="sp-verified">✓</span>}
                    </div>
                    <span className="sp-meta-sub">
                      {post.handle ? post.handle : post.location}
                    </span>
                  </div>
                  <div className="sp-platform-badge">
                    <BrandLogo width={26} height={26} />
                  </div>
                </div>

                {/* Post Content */}
                <div className="sp-content">
                  <p className="sp-text">{post.text}</p>
                  <div className="sp-img-wrap" onClick={() => setLightboxImage({ src: post.img, title: post.username })}>
                    <Image 
                      src={post.img} 
                      alt={post.username} 
                      width={400} 
                      height={300} 
                      style={{ objectFit: "cover" }} 
                      className="sp-image" 
                    />
                  </div>
                </div>

                {/* Post Footer */}
                <div className="sp-footer">
                  <div className="sp-actions">
                    {/* Like */}
                    <button className="sp-action-btn sp-like-btn">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                      <span>{post.likes}</span>
                    </button>
                    {/* Comment */}
                    <button className="sp-action-btn sp-comment-btn">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                      <span>{post.comments || post.replies || "12"}</span>
                    </button>
                    {/* Share */}
                    <button className="sp-action-btn sp-share-btn">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"/>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                      <span>გაზიარება</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="social-feed-more-wrap">
            <button 
              className="social-feed-more-btn" 
              onClick={() => setShowAllSocial(!showAllSocial)}
            >
              {showAllSocial ? "მეტის დამალვა" : "მეტის ჩვენება"}
              <svg 
                className={showAllSocial ? "rotate-180" : ""} 
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
          </div>
        </div>
      </section>
      
      {/* Lightbox Modal */}
      {lightboxImage && (
        <div className="lightbox" onClick={() => setLightboxImage(null)}>
          <button className="lightbox-close" onClick={() => setLightboxImage(null)}>✕</button>
          <img src={lightboxImage.src} alt={lightboxImage.title} className="lightbox-img" />
        </div>
      )}


      {/* ==================== GEORGIA MAP SECTION ==================== */}
      <section className="section map-section" id="map">
        <div className="section-inner">
          <div className="section-header">
            <span className="section-eyebrow">ინტერაქტიური რუკა</span>
            <h2 className="section-title">საქართველოს რეგიონები</h2>
            <p className="section-desc">გაეცანი საქართველოს ყველა კუთხეს — გადაიტანე კურსორი რეგიონზე</p>
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
                  { id: "GE-MM", name: "მცხეთა-მთიანეთი", desc: "ყაზბეგი, გერგეთი, ჯვარი", color: "#29b2b7" },
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
                  { id: "GE-KK", name: "ქვემო ქართლი", desc: "მრავალფეროვანი კულტურა" },
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

      {/* ==================== REVIEWS SECTION ==================== */}
      <section className="section reviews-bg" id="reviews">
        <div className="section-inner">
          <div className="section-header">
            <span className="section-eyebrow">ჩვენი სტუმრები ამბობენ</span>
            <h2 className="section-title">მიმოხილვები</h2>
            <p className="section-desc">ნახე, რას ამბობენ ჩვენი სტუმრები ახლო აღმოსავლეთიდან</p>
            <div className="gold-line"></div>
          </div>
          <div className="reviews-slider">
            <div className="reviews-track" style={{ transform: `translateX(-${activeReviewSlide * 100}%)` }}>
              {REVIEWS.map((slide, sIdx) => (
                <div key={sIdx} className="review-slide">
                  {slide.map((r, rIdx) => (
                    <div key={rIdx} className="review-card">
                      <div className="review-stars">★★★★★</div>
                      <p className="review-text">“{r.text}”</p>
                      <div className="review-author">
                        <div className="review-avatar">{r.avatar}</div>
                        <div className="review-author-info">
                          <strong>{r.author}</strong>
                          <span>{r.from}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="reviews-controls">
            <button className="slider-btn" onClick={() => setActiveReviewSlide((prev) => (prev - 1 + REVIEWS.length) % REVIEWS.length)}>‹</button>
            <div className="slider-dots">
              {REVIEWS.map((_, i) => (
                <button 
                  key={i} 
                  className={`slider-dot ${i === activeReviewSlide ? "active" : ""}`}
                  onClick={() => setActiveReviewSlide(i)}
                ></button>
              ))}
            </div>
            <button className="slider-btn" onClick={() => setActiveReviewSlide((prev) => (prev + 1) % REVIEWS.length)}>›</button>
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
                    <path d="M6 9l6 6 6-6"/>
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

      {/* ==================== BOOKING FORM ==================== */}
      <section className="section" id="booking">
        <div className="section-inner">
          <div className="booking-wrap">
            <div className="booking-info">
              <div className="section-header">
                <span className="section-eyebrow">მოგზაურობის დაჯავშნა</span>
                <h2 className="section-title">დაიწყეთ თქვენი საოცნებო მოგზაურობა</h2>
                <p className="section-desc">შეავსეთ ფორმა და ჩვენი კონსულტანტი 30 წუთში WhatsApp-ის საშუალებით დაგიკავშირდებათ.</p>
                <div className="gold-line"></div>
              </div>
              <div className="booking-highlights">
                <div className="booking-highlight">პასუხი 30 წუთში</div>
                <div className="booking-highlight">უფასო კონსულტაცია</div>
                <div className="booking-highlight">ინდივიდუალური ტური</div>
                <div className="booking-highlight">სრული 24/7 მხარდაჭერა</div>
                <div className="booking-highlight">ფასი ბიუჯეტის მიხედვით</div>
              </div>
            </div>
            <div className="booking-form-wrap">
              <h3 className="form-title">გაგზავნეთ მოთხოვნა</h3>
              <p className="form-subtitle">WhatsApp-ის საშუალებით 30 წუთში დაგიკავშირდებით</p>
              <form onSubmit={handleFormSubmit}>
                <div className="form-grid">
                  <div className="form-row">
                    <label htmlFor="f-name">სახელი და გვარი *</label>
                    <input 
                      type="text" 
                      id="f-name" 
                      placeholder="გიორგი მაისურაძე" 
                      required 
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="form-row">
                    <label htmlFor="f-country">ქვეყანა</label>
                    <input 
                      type="text" 
                      id="f-country" 
                      placeholder="საქართველო" 
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-row">
                    <label htmlFor="f-date-from">გამგზავრების თარიღი *</label>
                    <input 
                      type="date" 
                      id="f-date-from" 
                      required 
                      value={formData.dateFrom}
                      onChange={(e) => setFormData({ ...formData, dateFrom: e.target.value })}
                    />
                  </div>
                  <div className="form-row">
                    <label htmlFor="f-date-to">დაბრუნების თარიღი</label>
                    <input 
                      type="date" 
                      id="f-date-to" 
                      value={formData.dateTo}
                      onChange={(e) => setFormData({ ...formData, dateTo: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <label htmlFor="f-people">მოგზაურთა რაოდენობა *</label>
                  <input 
                    type="text"
                    id="f-people" 
                    placeholder="მაგ: 3 კაცი"
                    required
                    value={formData.people}
                    onChange={(e) => setFormData({ ...formData, people: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <label htmlFor="f-budget">ბიუჯეტი (ერთ კაცზე) *</label>
                  <input 
                    type="text"
                    id="f-budget" 
                    placeholder="მაგ: ₾500 - ₾1,000"
                    required
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <label htmlFor="f-notes">დამატებითი ინფორმაცია</label>
                  <textarea 
                    id="f-notes" 
                    placeholder="კონკრეტული მოთხოვნები, ტურის კატეგორია, სასურველი ენა..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  ></textarea>
                </div>

                <button type="submit" className="btn-submit-wa">
                  {ICONS.wa} <span>გაგზავნა WhatsApp-ით</span>
                </button>
              </form>
            </div>
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
          <path d="M12 19V5M5 12l7-7 7 7"/>
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
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-grid">
            {/* Brand Column */}
            <div className="footer-brand">
              <div className="brand-name">
                <BrandLogo />
                Georgia<span style={{color:"var(--teal)"}}>Trips</span>
              </div>
              <p>პრემიუმ ტურები საქართველოში — ყველა ტიპის მოგზაურისთვის. კომფორტი, ფუფუნება, ემოცია.</p>
              <div className="footer-socials">
                <a href="#" className="social-link" aria-label="Facebook">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="16" height="16">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="social-link" aria-label="Instagram">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="16" height="16">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                  </svg>
                </a>
                <a href={WA_LINK} className="social-link" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="16" height="16">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884zm8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Tours Column */}
            <div className="footer-col">
              <h4 className="footer-col-title">შიდა ტურები</h4>
              <ul className="footer-links">
                <li><a href="#tours">თბილისი</a></li>
                <li><a href="#batumi-tours">ბათუმი & აჭარა</a></li>
                <li><a href="#tours">ყაზბეგი</a></li>
                <li><a href="#tours">კახეთი</a></li>
                <li><a href="#tours">სვანეთი / მესტია</a></li>
                <li><a href="#tours">VIP ტურები</a></li>
              </ul>
            </div>

            {/* Services Column */}
            <div className="footer-col">
              <h4 className="footer-col-title">სერვისები</h4>
              <ul className="footer-links">
                <li><a href="#international">საერთაშორისო ტურები</a></li>
                <li><a href="#batumi-tours">ტრანსპორტი / ტრანსფერი</a></li>
                <li><a href="#why">სტატიები</a></li>
                <li><a href="#home">ჩვენ შესახებ</a></li>
                <li><a href="#reviews">მიმოხილვები</a></li>
                <li><a href="#booking">კონტაქტი</a></li>
              </ul>
            </div>

            {/* Contact Column */}
            <div className="footer-col">
              <h4 className="footer-col-title">კონტაქტი</h4>
              <div className="footer-contact-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.94a16 16 0 0 0 6.06 6.06l1.05-1.06a2 2 0 0 1 2.11-.45c.9.362 1.84.617 2.81.7A2 2 0 0 1 21.9 16.1z"/></svg>
                +995 555 000 000
              </div>
              <div className="footer-contact-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                info@georgiatrips.ge
              </div>
              <div className="footer-contact-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                თბილისი, საქართველო
              </div>
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="footer-wa-btn">
                {ICONS.wa}
                WhatsApp-ზე დაგვიკავშირდით
              </a>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="footer-bottom">
            <p>© 2026 GeorgiaTrips. ყველა უფლება დაცულია. <a href="#">კონფიდენციალურობა</a> · <a href="#">წესები</a></p>
            <p>დამზადებულია სიყვარულით საქართველოში</p>
          </div>
        </div>
      </footer>
    </>
  );
}
