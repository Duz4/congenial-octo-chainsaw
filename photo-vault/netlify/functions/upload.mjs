import { getStore } from "@netlify/blobs";

// POST /api/upload — requires the UPLOAD_PASSWORD env var to match the
// X-Upload-Password header. The password lives only in Netlify's
// environment variables; it is never shipped to the browser.
const MAX_BYTES = 4.5 * 1024 * 1024; // Netlify Blobs caps values at 5MB

export default async (req) => {
  const password = req.headers.get("x-upload-password") || "";
  if (password !== process.env.UPLOAD_PASSWORD) {
    return json({ error: "Incorrect password" }, 401);
  }

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    return json({ error: "Only image uploads are allowed" }, 400);
  }

  const buffer = await req.arrayBuffer();
  if (buffer.byteLength === 0) {
    return json({ error: "Empty file" }, 400);
  }
  if (buffer.byteLength > MAX_BYTES) {
    return json({ error: "Photo is too large" }, 413);
  }

  let name = "photo";
  const rawName = req.headers.get("x-file-name");
  if (rawName) {
    try {
      name = decodeURIComponent(rawName);
    } catch {
      // keep default name if header was malformed
    }
  }

  // dateTaken comes from the photo's EXIF data (extracted client-side, since
  // Netlify Blobs stores whatever bytes we send and canvas already stripped
  // EXIF out of the actual image). Validate it's a sane timestamp before
  // trusting it — malformed EXIF shouldn't be able to send bad data through.
  let dateTaken = null;
  const rawDateTaken = req.headers.get("x-date-taken");
  if (rawDateTaken) {
    const parsed = Number(rawDateTaken);
    const oneDayMs = 24 * 60 * 60 * 1000;
    if (Number.isFinite(parsed) && parsed > 0 && parsed < Date.now() + oneDayMs) {
      dateTaken = parsed;
    }
  }

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const store = getStore({ name: "photos", consistency: "strong" });

  await store.set(id, buffer, {
    metadata: { name, contentType, uploadedAt: Date.now(), dateTaken },
  });

  return json({ ok: true, id });
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const config = { path: "/api/upload", method: "POST" };
