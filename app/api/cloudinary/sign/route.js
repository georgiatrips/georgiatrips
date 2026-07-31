import crypto from "crypto";

// Returns a short-lived signature so the browser can upload straight to
// Cloudinary without ever seeing the API secret.
export async function POST(request) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return Response.json(
      { error: "Cloudinary არ არის კონფიგურირებული (CLOUDINARY_* ცვლადები)." },
      { status: 500 }
    );
  }

  let folder = "georgiatrips/tours";
  try {
    const body = await request.json();
    if (body?.folder && /^[\w/-]+$/.test(body.folder)) folder = body.folder;
  } catch {
    // no body — use the default folder
  }

  const timestamp = Math.round(Date.now() / 1000);

  // Signature = sha1(sorted params + api_secret)
  const toSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = crypto.createHash("sha1").update(toSign + apiSecret).digest("hex");

  return Response.json({ cloudName, apiKey, timestamp, folder, signature });
}
