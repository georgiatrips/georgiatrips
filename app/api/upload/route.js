import crypto from "crypto";

// Signed Cloudinary upload. The browser posts a file here, the server signs it
// with the private API secret so the credentials never reach the client.
export async function POST(request) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return Response.json({ error: "Cloudinary კონფიგურაცია არ არის დაყენებული" }, { status: 500 });
  }

  let incoming;
  try {
    incoming = await request.formData();
  } catch {
    return Response.json({ error: "ფაილის წაკითხვა ვერ მოხერხდა" }, { status: 400 });
  }

  const file = incoming.get("file");
  if (!file || typeof file === "string") {
    return Response.json({ error: "ფაილი არ არის მოწოდებული" }, { status: 400 });
  }

  const MAX_BYTES = 10 * 1024 * 1024;
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "ფაილი ძალიან დიდია (მაქს. 10MB)" }, { status: 400 });
  }
  if (!String(file.type || "").startsWith("image/")) {
    return Response.json({ error: "დასაშვებია მხოლოდ სურათები" }, { status: 400 });
  }

  const folder = "georgiatrips/tours";
  const timestamp = Math.round(Date.now() / 1000);
  const signature = crypto
    .createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  const body = new FormData();
  body.append("file", file, file.name || "upload");
  body.append("api_key", apiKey);
  body.append("timestamp", String(timestamp));
  body.append("folder", folder);
  body.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return Response.json(
      { error: json?.error?.message || "Cloudinary-ზე ატვირთვა ვერ მოხერხდა" },
      { status: 502 }
    );
  }

  return Response.json({
    url: json.secure_url,
    publicId: json.public_id,
    width: json.width,
    height: json.height,
  });
}
