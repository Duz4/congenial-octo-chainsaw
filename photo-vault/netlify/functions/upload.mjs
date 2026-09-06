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

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const store = getStore({ name: "photos", consistency: "strong" });

  await store.set(id, buffer, {
    metadata: { name, contentType, uploadedAt: Date.now() },
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
