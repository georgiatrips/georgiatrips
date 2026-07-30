"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { BrandLogo, WA_LINK, WhatsAppIcon } from "../lib/shared";

export default function PostsPage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [likedPosts, setLikedPosts] = useState({});
  const [openCommentIndex, setOpenCommentIndex] = useState(null);
  const [commentInput, setCommentInput] = useState("");
  const [commentsMap, setCommentsMap] = useState({});

  const postsData = [
    {
      id: 1,
      category: "facebook",
      platformLabel: "Facebook პოსტი",
      author: "GeorgiaTrips",
      authorRole: "ოფიციალური გვერდი",
      avatar: "/logo.png",
      verified: true,
      timeTag: "2 საათის წინ",
      location: "📍 ყაზბეგი & გერგეთის სამება",
      title: "ზამთრისა და გაზაფხულის ჯადოსნური ხედები ყაზბეგში! 🏔️✨",
      content: `კავკასიონის უმაღლესი მწვერვალები და XIV საუკუნის გერგეთის სამების ტაძარი ზღვის დონიდან 2170 მეტრზე! 

ჩვენი დღევანდელი ჯგუფი ყაზბეგში იმყოფებოდა. სუფთა მთის ჰაერი, ულამაზესი პანორამული ხედები გუდაურის მონუმენტიდან და ნამდვილი მთის ხინკალი ფასანაურში.

გსურთ დაუვიწყარი შთაბეჭდილებები? დაჯავშნეთ ერთდღიანი ტური ყაზბეგში დღესვე! 🚙⛰️`,
      hashtags: "#GeorgiaTrips #Kazbegi #Gergeti #TravelGeorgia #GeorgiaTours",
      img: "https://images.unsplash.com/photo-1565008576549-57569a49371d?w=900&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1565008576549-57569a49371d?w=900&q=80",
        "/gudauri.png"
      ],
      initialLikes: 342,
      initialComments: 28,
      sharesCount: 14,
      tourLink: "/tours/kazbegi-gergeti",
      tourTitle: "ყაზბეგის მთები & გერგეთი"
    },
    {
      id: 2,
      category: "instagram",
      platformLabel: "Instagram კადრი",
      author: "GeorgiaTrips",
      authorRole: "ოფიციალური გვერდი",
      avatar: "/logo.png",
      verified: true,
      timeTag: "5 საათის წინ",
      location: "📍 მარტვილის კანიონი & პრომეთეს მღვიმე",
      title: "ზურმუხტისფერი მდინარე აბაშა და ნავით გასეირნება 🚣‍♂️🌿",
      content: `მარტვილის კანიონის ჯადოსნური ბუნება, ჩანჩქერები და პრომეთეს მიწისქვეშა მღვიმის საოცარი სტალაქტიტები!

ერთდღიანი ექსკურსია დასავლეთ საქართველოში: ბანაობა ნოკალაქევის ბუნებრივ თერმულ გოგირდის წყაროებში და იმერულ-მეგრული სუფრა.

გსურთ ჩვენთან ერთად მოგზაურობა? მოგვწერეთ WhatsApp-ში! 💚`,
      hashtags: "#MartviliCanyon #PrometheusCave #GeorgiaTrips #VisitGeorgia",
      img: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=900&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=900&q=80",
        "https://images.unsplash.com/photo-1583484963886-cfe2bff2945f?w=900&q=80"
      ],
      initialLikes: 518,
      initialComments: 45,
      sharesCount: 31,
      tourLink: "/tours/promethe-martvili",
      tourTitle: "პრომეთეს მღვიმე & მარტვილის კანიონი"
    },
    {
      id: 3,
      category: "article",
      platformLabel: "სტატია & ბლოგი",
      author: "GeorgiaTrips",
      authorRole: "სამოგზაურო ექსპერტი",
      avatar: "/logo.png",
      verified: true,
      timeTag: "გუშინ 14:20-ზე",
      location: "📍 ბათუმი & აჭარის მთები",
      title: "რატომ უნდა ეწვიოთ მთიან აჭარას 2026 წელს? 🌊🍷",
      content: `აჭარა მხოლოდ შავი ზღვის სანაპირო არ არის. ზღვის დონიდან რამდენიმე კილომეტრში იწყება ულამაზესი ალპური ხეობები, თამარ მეფის საუკუნოვანი ქვის ხიდები, მახუნცეთისა და მირვეთის ჩანჩქერები!

ჩვენს ტურში შედის ტრადიციული აჭარული სუფრა საოჯახო მარანში — ცოცხალი ფოლკლორული მუსიკით, სიმღერითა და აჭარული ხაჭაპურით.

წაიკითხეთ სრული გზამკვლევი და დაგეგმეთ თქვენი მოგზაურობა GeorgiaTrips-თან ერთად!`,
      hashtags: "#Batumi #Adjara #Machakhela #GeorgiaTrips #TasteGeorgia",
      img: "/batumi.png",
      gallery: ["/batumi.png", "/villa.png"],
      initialLikes: 289,
      initialComments: 19,
      sharesCount: 22,
      tourLink: "/tours/adjara-mountains",
      tourTitle: "მთიანი აჭარის სრული ტური"
    },
    {
      id: 4,
      category: "facebook",
      platformLabel: "Facebook პოსტი",
      author: "GeorgiaTrips",
      authorRole: "ოფიციალური გვერდი",
      avatar: "/logo.png",
      verified: true,
      timeTag: "2 დღის წინ",
      location: "📍 სიღნაღი, კახეთი",
      title: "კახეთის ღვინის მარშრუტი — სიყვარულის ქალაქი & ქვევრის ღვინო 🍇🍷",
      content: `კახეთი — ღვინის სამშობლო! სიღნაღის ისტორიული გალავანი, ბოდბის მონასტერი და ალაზნის ველის ულამაზესი ხედები.

ჩვენი ტურისტები ეწვივნენ 8000-წლოვანი ისტორიის მქონე ქვევრის მარანს, დააგემოვნეს რქაწითელი და საფერავი და მონაწილეობა მიიღეს შოთის პურის ცხობასა და ჩურჩხელის ამოვლებაში.

დაჯავშნეთ კახეთის ღვინის ტური საუკეთესო პირობებით! 🥂`,
      hashtags: "#Kakheti #Sighnaghi #GeorgianWine #GeorgiaTrips #WineTour",
      img: "/kakheti.png",
      gallery: ["/kakheti.png"],
      initialLikes: 412,
      initialComments: 33,
      sharesCount: 18,
      tourLink: "/tours/kakheti-wine",
      tourTitle: "კახეთის ღვინის მარშრუტი"
    },
    {
      id: 5,
      category: "instagram",
      platformLabel: "Instagram კადრი",
      author: "GeorgiaTrips",
      authorRole: "ოფიციალური გვერდი",
      avatar: "/logo.png",
      verified: true,
      timeTag: "3 დღის წინ",
      location: "📍 მესტია & უშგული, სვანეთი",
      title: "სვანეთის საუკუნოვანი კოშკები & შხარას მყინვარი 🏔️⚔️",
      content: `უშგული — ევროპის ყველაზე მაღალი მუდმივად დასახლებული სოფელი (2200მ) UNESCO-ს მსოფლიო მემკვიდრეობის სიაში!

სვანური კოშკები, უძველესი ტრადიციები, კუბდარი და შხარას მყინვარის სიდიადე. მრავალდღიანი ტური სვანეთში GeorgiaTrips-ის კომფორტული ტრანსპორტითა და პროფესიონალი გიდით.

შემოგვიერთდით შემდეგ ტურზე! 🛡️`,
      hashtags: "#Svaneti #Mestia #Ushguli #GeorgiaTrips #UnescoWorldHeritage",
      img: "/mestia.png",
      gallery: ["/mestia.png"],
      initialLikes: 678,
      initialComments: 52,
      sharesCount: 41,
      tourLink: "/tours/mestia-ushguli",
      tourTitle: "მესტიის & უშგულის ტური"
    }
  ];

  const filteredPosts = postsData.filter((post) => {
    if (activeFilter === "all") return true;
    return post.category === activeFilter;
  });

  const toggleLike = (id) => {
    setLikedPosts((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleAddComment = (postId, e) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    setCommentsMap((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), commentInput.trim()]
    }));

    setCommentInput("");
  };

  const copyToClipboardFallback = (text) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    }
    document.body.removeChild(textarea);
    return copied;
  };

  const handleShare = async (post) => {
    const url = window.location.href;
    let copied = false;

    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        copied = true;
      } catch {
        copied = false;
      }
    }

    if (!copied) {
      copied = copyToClipboardFallback(url);
    }

    if (copied) {
      alert(`პოსტის ბმული დაკოპირდა! გაუზიარეთ მეგობრებს: "${post.title}"`);
    } else {
      alert(`გაუზიარეთ პოსტი: ${post.title}\n${url}`);
    }
  };

  return (
    <div className="posts-page-wrapper">
      <Navbar active="posts" />

      {/* HERO SECTION */}
      <section className="posts-hero">
        <div className="posts-hero-bg">
          <Image
            src="/hero.png"
            alt="საქართველო ჩვენი თვალით"
            fill
            priority
            style={{ objectFit: "cover" }}
          />
          <div className="posts-hero-scrim" />
        </div>
        <div className="container posts-hero-content">
          <span className="posts-hero-eyebrow">თვალი ადევნეთ ჩვენს მოგზაურობას</span>
          <h1 className="posts-hero-title">საქართველო ჩვენი თვალით</h1>
          <p className="posts-hero-sub">
            აღმოაჩინეთ საქართველოს ულამაზესი ხედები, რეალური კადრები და დაუვიწყარი ემოციები ჩვენი სოციალური გვერდებიდან
          </p>
        </div>
      </section>

      {/* MAIN SOCIAL FEED CONTAINER */}
      <section className="section posts-feed-section">
        <div className="container posts-feed-container">
          {postsData.map((post) => {
            const isLiked = !!likedPosts[post.id];
            const currentLikes = post.initialLikes + (isLiked ? 1 : 0);
            const userComments = commentsMap[post.id] || [];
            const isCommentsOpen = openCommentIndex === post.id;

            return (
              <article key={post.id} className="facebook-post-card">
                {/* 1. POST HEADER */}
                <div className="fb-post-header">
                  <div className="fb-author-wrap">
                    <div className="fb-avatar">
                      <BrandLogo width={40} height={40} />
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

                {/* 2. POST BODY TEXT */}
                <div className="fb-post-body">
                  <h2 className="fb-post-title">{post.title}</h2>
                  <p className="fb-post-text">{post.content}</p>
                  <p className="fb-post-hashtags">{post.hashtags}</p>
                </div>

                {/* 3. POST MEDIA SHOWCASE */}
                {post.img && (
                  <div className="fb-post-media">
                    <img src={post.img} alt={post.title} className="fb-media-img" />
                  </div>
                )}

                {/* 4. REACTIONS & COUNTS BAR */}
                <div className="fb-reactions-bar">
                  <div className="fb-reactions-icons">
                    <span className="fb-icon-like">👍</span>
                    <span className="fb-icon-heart">❤️</span>
                    <span className="fb-icon-fire">🔥</span>
                    <span className="fb-reactions-count">{currentLikes}</span>
                  </div>

                  <div className="fb-counts-group">
                    <span className="fb-count-item">{post.initialComments + userComments.length} კომენტარი</span>
                    <span className="fb-dot">•</span>
                    <span className="fb-count-item">{post.sharesCount} გაზიარება</span>
                  </div>
                </div>

                {/* 5. ACTION BUTTONS BAR */}
                <div className="fb-action-btns">
                  <button
                    type="button"
                    className={`fb-action-btn ${isLiked ? "liked" : ""}`}
                    onClick={() => toggleLike(post.id)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={isLiked ? "#1877f2" : "none"} stroke={isLiked ? "#1877f2" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                    </svg>
                    <span>{isLiked ? "მოწონებულია" : "მოწონება"}</span>
                  </button>

                  <button
                    type="button"
                    className="fb-action-btn"
                    onClick={() => setOpenCommentIndex(isCommentsOpen ? null : post.id)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <span>კომენტარი</span>
                  </button>

                  <button
                    type="button"
                    className="fb-action-btn"
                    onClick={() => handleShare(post)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="5" r="3"/>
                      <circle cx="6" cy="12" r="3"/>
                      <circle cx="18" cy="19" r="3"/>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                    </svg>
                    <span>გაზიარება</span>
                  </button>
                </div>

                {/* 6. COMMENTS SECTION DROPDOWN */}
                {isCommentsOpen && (
                  <div className="fb-comments-box">
                    <form onSubmit={(e) => handleAddComment(post.id, e)} className="fb-comment-form">
                      <input
                        type="text"
                        placeholder="დაწერეთ კომენტარი..."
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        className="fb-comment-input"
                      />
                      <button type="submit" className="fb-comment-submit">გაგზავნა</button>
                    </form>

                    <div className="fb-comments-list">
                      <div className="fb-single-comment">
                        <strong>გიორგი მ.:</strong> ულამაზესი ხედებია! აუცილებლად უნდა წამოვიდეთ ამ ტურზე.
                      </div>
                      <div className="fb-single-comment">
                        <strong>ანა კ.:</strong> GeorgiaTrips-თან ერთად მოგზაურობა ყოველთვის საუკეთესოა! ❤️
                      </div>
                      {userComments.map((cText, cIdx) => (
                        <div key={cIdx} className="fb-single-comment user-comment">
                          <strong>თქვენ:</strong> {cText}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <Footer />
    </div>
  );
}
