import { getStore } from "@netlify/blobs";

// GET /api/photos — public, no password needed. Returns metadata only
// (id, name, uploadedAt) so the gallery can render quickly; the actual
// image bytes are fetched per-photo from /api/photo.
export default async () => {
  const store = getStore({ name: "photos", consistency: "strong" });
  const { blobs } = await store.list();

  const photos = await Promise.all(
    blobs.map(async ({ key }) => {
      const result = await store.getMetadata(key);
      const meta = result?.metadata || {};
      return {
        id: key,
        name: meta.name || "photo",
        uploadedAt: meta.uploadedAt || 0,
        dateTaken: meta.dateTaken || null,
        uploader: meta.uploader || null,
      };
    })
  );

  // Sort by the date the photo was actually taken when we have it (from
  // EXIF), falling back to upload time for photos where we don't.
  photos.sort((a, b) => (b.dateTaken || b.uploadedAt) - (a.dateTaken || a.uploadedAt));

  return new Response(JSON.stringify(photos), {
    headers: { "content-type": "application/json" },
  });
};

export const config = { path: "/api/photos", method: "GET" };
