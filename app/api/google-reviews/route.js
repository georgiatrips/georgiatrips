import { NextResponse } from "next/server";

// Revalidate the cached response every 6 hours
export const revalidate = 21600;

// ============================================================
// Google-დან მიმოხილვების წაკითხვა
//
// 1) Places API (New)  -> GOOGLE_PLACES_API_KEY (+ GOOGLE_PLACE_ID ან GOOGLE_PLACE_QUERY)
//    ყველაზე მარტივი გზა. აბრუნებს მაქს. 5 მიმოხილვას.
// 2) Places API (Legacy) -> იგივე გასაღები, თუ ძველი API აქვს ჩართული.
// 3) Business Profile API -> OAuth (CLIENT_ID + CLIENT_SECRET + REFRESH_TOKEN)
//    აბრუნებს ყველა მიმოხილვას, მაგრამ საჭიროა API-ს დამტკიცება Google-ისგან.
// ============================================================

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || "";
// შეიძლება იყოს place_id (ChIJ...) ან საძიებო ტექსტი
const PLACE_ID = process.env.GOOGLE_PLACE_ID || "";
const PLACE_QUERY = process.env.GOOGLE_PLACE_QUERY || "GeorgiaTrips Tbilisi";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN || "";

const looksLikePlaceId = (value) =>
  typeof value === "string" && /^(ChIJ|Ei|GhIJ|places\/)/.test(value.trim());

function formatRelativeTime(timestampSeconds) {
  if (!timestampSeconds) return "ახლახან";
  const diff = Date.now() - timestampSeconds * 1000;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (minutes < 1) return "ახლახან";
  if (minutes < 60) return `${minutes} წუთის წინ`;
  if (hours < 24) return `${hours} საათის წინ`;
  if (days < 7) return `${days} დღის წინ`;
  if (weeks < 5) return `${weeks} კვირის წინ`;
  if (months < 12) return `${months} თვის წინ`;
  return `${Math.floor(days / 365)} წლის წინ`;
}

const starWordToNumber = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};

function normalizeRating(rating) {
  if (typeof rating === "number") return Math.round(rating) || 5;
  if (typeof rating === "string") return starWordToNumber[rating] || Number(rating) || 5;
  return 5;
}

// ------------------------------------------------------------
// 1) Places API (New) — https://places.googleapis.com/v1
// ------------------------------------------------------------
async function fetchPlacesNewReviews(diagnostics) {
  if (!PLACES_API_KEY) {
    diagnostics.push("Places API (New): GOOGLE_PLACES_API_KEY არ არის დაყენებული");
    return null;
  }

  try {
    let placeId = looksLikePlaceId(PLACE_ID) ? PLACE_ID.replace(/^places\//, "") : "";

    // თუ place_id არ გვაქვს — მოვძებნოთ სახელით
    if (!placeId) {
      const searchRes = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": PLACES_API_KEY,
          "X-Goog-FieldMask": "places.id,places.displayName,places.rating,places.userRatingCount",
        },
        body: JSON.stringify({ textQuery: PLACE_ID || PLACE_QUERY, languageCode: "en" }),
        signal: AbortSignal.timeout(10000),
      });
      const searchData = await searchRes.json();

      if (!searchRes.ok || !searchData.places?.length) {
        diagnostics.push(
          `Places API (New) search: ${searchData?.error?.message || "ადგილი ვერ მოიძებნა"}`
        );
        return null;
      }
      placeId = searchData.places[0].id;
    }

    const detailsRes = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=en`,
      {
        headers: {
          "X-Goog-Api-Key": PLACES_API_KEY,
          "X-Goog-FieldMask":
            "id,displayName,rating,userRatingCount,googleMapsUri,reviews",
        },
        signal: AbortSignal.timeout(10000),
      }
    );
    const details = await detailsRes.json();

    if (!detailsRes.ok) {
      diagnostics.push(`Places API (New) details: ${details?.error?.message || detailsRes.status}`);
      return null;
    }
    if (!details.reviews?.length) {
      diagnostics.push("Places API (New): ამ ადგილს მიმოხილვები არ აქვს");
      return null;
    }

    return {
      source: "places-new",
      placeId: details.id,
      placeName: details.displayName?.text || "",
      rating: details.rating || null,
      totalReviews: details.userRatingCount || null,
      googleMapsUri: details.googleMapsUri || "",
      reviews: details.reviews.map((review) => {
        const seconds = review.publishTime
          ? Math.floor(new Date(review.publishTime).getTime() / 1000)
          : null;
        return {
          googleReviewId: review.name || `${review.authorAttribution?.displayName}_${seconds}`,
          name: review.authorAttribution?.displayName || "სტუმარი",
          rating: normalizeRating(review.rating),
          text: review.originalText?.text || review.text?.text || "",
          time: review.relativePublishTimeDescription || formatRelativeTime(seconds),
          originalTimestamp: seconds,
          avatar: review.authorAttribution?.photoUri || "",
          relativeTime: review.relativePublishTimeDescription || "",
        };
      }),
    };
  } catch (err) {
    diagnostics.push(`Places API (New) შეცდომა: ${err.message}`);
    return null;
  }
}

// ------------------------------------------------------------
// 2) Places API (Legacy) — maps.googleapis.com
// ------------------------------------------------------------
async function fetchPlacesLegacyReviews(diagnostics) {
  if (!PLACES_API_KEY) return null;

  try {
    let placeId = looksLikePlaceId(PLACE_ID) ? PLACE_ID.replace(/^places\//, "") : "";

    if (!placeId) {
      const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
        PLACE_ID || PLACE_QUERY
      )}&inputtype=textquery&fields=place_id,name&key=${PLACES_API_KEY}`;
      const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(10000) });
      const searchData = await searchRes.json();

      if (searchData.status !== "OK" || !searchData.candidates?.length) {
        diagnostics.push(
          `Places API (Legacy) search: ${searchData.status}${
            searchData.error_message ? ` — ${searchData.error_message}` : ""
          }`
        );
        return null;
      }
      placeId = searchData.candidates[0].place_id;
    }

    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews,url&reviews_sort=newest&key=${PLACES_API_KEY}`;
    const detailsRes = await fetch(detailsUrl, { signal: AbortSignal.timeout(10000) });
    const detailsData = await detailsRes.json();

    if (detailsData.status !== "OK" || !detailsData.result?.reviews?.length) {
      diagnostics.push(
        `Places API (Legacy) details: ${detailsData.status}${
          detailsData.error_message ? ` — ${detailsData.error_message}` : ""
        }`
      );
      return null;
    }

    return {
      source: "places-legacy",
      placeId,
      placeName: detailsData.result.name || "",
      rating: detailsData.result.rating || null,
      totalReviews: detailsData.result.user_ratings_total || null,
      googleMapsUri: detailsData.result.url || "",
      reviews: detailsData.result.reviews.map((review) => ({
        googleReviewId: `${review.author_name}_${review.time}`,
        name: review.author_name || "სტუმარი",
        rating: normalizeRating(review.rating),
        text: review.text || "",
        time: review.relative_time_description || formatRelativeTime(review.time),
        originalTimestamp: review.time || null,
        avatar: review.profile_photo_url || "",
        relativeTime: review.relative_time_description || "",
      })),
    };
  } catch (err) {
    diagnostics.push(`Places API (Legacy) შეცდომა: ${err.message}`);
    return null;
  }
}

// ------------------------------------------------------------
// 3) Business Profile API (OAuth) — ყველა მიმოხილვა
// ------------------------------------------------------------
async function getAccessToken() {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
    signal: AbortSignal.timeout(10000),
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(tokenData.error_description || tokenData.error || "access_token ვერ მივიღეთ");
  }
  return tokenData.access_token;
}

async function fetchBusinessProfileReviews(diagnostics) {
  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    diagnostics.push("Business Profile: OAuth მონაცემები არ არის დაყენებული");
    return null;
  }

  try {
    const accessToken = await getAccessToken();
    const authHeaders = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    // ანგარიში
    const accountsRes = await fetch(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      { headers: authHeaders, signal: AbortSignal.timeout(10000) }
    );
    const accountsData = await accountsRes.json();
    if (!accountsData.accounts?.length) {
      diagnostics.push(
        `Business Profile accounts: ${accountsData?.error?.message || "ანგარიში ვერ მოიძებნა"}`
      );
      return null;
    }
    const accountName = accountsData.accounts[0].name; // accounts/123
    const accountId = accountName.split("/").pop();

    // ლოკაცია (სწორი endpoint: mybusinessbusinessinformation)
    const locationsRes = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title&pageSize=100`,
      { headers: authHeaders, signal: AbortSignal.timeout(10000) }
    );
    const locationsData = await locationsRes.json();
    if (!locationsData.locations?.length) {
      diagnostics.push(
        `Business Profile locations: ${locationsData?.error?.message || "ლოკაცია ვერ მოიძებნა"}`
      );
      return null;
    }
    const locationId = locationsData.locations[0].name.split("/").pop();

    // მიმოხილვები (მხოლოდ v4 API აბრუნებს reviews-ს)
    const all = [];
    let pageToken = "";
    do {
      const url = new URL(
        `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews`
      );
      url.searchParams.set("pageSize", "50");
      if (pageToken) url.searchParams.set("pageToken", pageToken);

      const reviewsRes = await fetch(url, {
        headers: authHeaders,
        signal: AbortSignal.timeout(10000),
      });
      const reviewsData = await reviewsRes.json();

      if (!reviewsRes.ok) {
        diagnostics.push(
          `Business Profile reviews: ${reviewsData?.error?.message || reviewsRes.status}`
        );
        break;
      }
      if (reviewsData.reviews?.length) all.push(...reviewsData.reviews);
      pageToken = reviewsData.nextPageToken || "";
    } while (pageToken && all.length < 200);

    if (!all.length) {
      diagnostics.push("Business Profile: მიმოხილვები ვერ მოიძებნა");
      return null;
    }

    return {
      source: "business-profile",
      reviews: all.map((review) => {
        const seconds = review.createTime
          ? Math.floor(new Date(review.createTime).getTime() / 1000)
          : null;
        return {
          googleReviewId: review.reviewId || review.name,
          name: review.reviewer?.displayName || "სტუმარი",
          rating: normalizeRating(review.starRating),
          text: review.comment || "",
          time: formatRelativeTime(seconds),
          originalTimestamp: seconds,
          avatar: review.reviewer?.profilePhotoUrl || "",
          relativeTime: formatRelativeTime(seconds),
        };
      }),
    };
  } catch (err) {
    diagnostics.push(`Business Profile შეცდომა: ${err.message}`);
    return null;
  }
}

export async function GET() {
  const diagnostics = [];

  // ყველა მიმოხილვა (OAuth) > Places New > Places Legacy
  let result = await fetchBusinessProfileReviews(diagnostics);
  if (!result) result = await fetchPlacesNewReviews(diagnostics);
  if (!result) result = await fetchPlacesLegacyReviews(diagnostics);

  if (!result) {
    // 200 + ცარიელი სია, რომ საიტი არ გატყდეს — მიზეზი diagnostics-შია
    return NextResponse.json(
      {
        data: { reviews: [], source: "none" },
        configured: Boolean(PLACES_API_KEY || REFRESH_TOKEN),
        error: "google_reviews_unavailable",
        message:
          "Google-ის მიმოხილვები ვერ ჩამოიტვირთა. დააყენე GOOGLE_PLACES_API_KEY და GOOGLE_PLACE_ID (ან GOOGLE_PLACE_QUERY).",
        diagnostics,
        updatedAt: new Date().toISOString(),
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }

  const reviews = result.reviews
    .filter((review) => review.text?.trim())
    .sort((a, b) => (b.originalTimestamp || 0) - (a.originalTimestamp || 0));

  return NextResponse.json(
    {
      data: {
        reviews,
        source: result.source,
        placeId: result.placeId || null,
        placeName: result.placeName || null,
        rating: result.rating ?? null,
        totalReviews: result.totalReviews ?? reviews.length,
        googleMapsUri: result.googleMapsUri || null,
      },
      configured: true,
      diagnostics,
      updatedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=43200",
      },
    }
  );
}
