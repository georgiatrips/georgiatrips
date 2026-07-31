"use client";

// Browser-side helper: asks our API for a signature, then uploads the
// file directly to Cloudinary and returns the delivered image URL.
export async function uploadToCloudinary(file, folder = "georgiatrips/tours") {
  const signRes = await fetch("/api/cloudinary/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder }),
  });

  if (!signRes.ok) {
    const info = await signRes.json().catch(() => ({}));
    throw new Error(info.error || "Cloudinary-ის ხელმოწერა ვერ მივიღეთ");
  }

  const { cloudName, apiKey, timestamp, signature, folder: signedFolder } = await signRes.json();

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);
  form.append("folder", signedFolder);

  const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });

  const data = await uploadRes.json();
  if (!uploadRes.ok || !data.secure_url) {
    throw new Error(data?.error?.message || "ფოტოს ატვირთვა ვერ შესრულდა");
  }

  return { url: data.secure_url, publicId: data.public_id };
}
