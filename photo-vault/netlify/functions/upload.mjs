import { getStore } from "@netlify/blobs";

// POST /api/upload — requires one of two passwords (env vars UPLOAD_PASSWORD_C
// / UPLOAD_PASSWORD_T) to match the X-Upload-Password header. Whichever one
// matches also tells us who uploaded the photo — there's no separate name
// field, the password itself carries that identity. Passwords live only in
// Netlify's environment variables; they're never shipped to the browser.
const UPLOADERS = {};
if (process.env.UPLOAD_PASSWORD_C) UPLOADERS[process.env.UPLOAD_PASSWORD_C] = "c";
if (process.env.UPLOAD_PASSWORD_T) UPLOADERS[process.env.UPLOAD_PASSWORD_T] = "t";

// 4.5MB, not because Blobs has a small size cap (it allows objects up to 5GB) —
// it's because Netlify Functions cap a single synchronous request body around
// 6MB, and this stays safely under that.
const MAX_BYTES = 4.5 * 1024 * 1024;

export default async (req) => {
  const password = req.headers.get("x-upload-password") || "";
  const uploader = UPLOADERS[password];
  if (!uploader) {
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
    metadata: { name, contentType, uploadedAt: Date.now(), dateTaken, uploader },
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
