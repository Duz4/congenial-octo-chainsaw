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
      };
    })
  );

  photos.sort((a, b) => b.uploadedAt - a.uploadedAt);

  return new Response(JSON.stringify(photos), {
    headers: { "content-type": "application/json" },
  });
};

export const config = { path: "/api/photos", method: "GET" };
