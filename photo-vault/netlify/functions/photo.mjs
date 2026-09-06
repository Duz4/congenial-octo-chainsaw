import { getStore } from "@netlify/blobs";

// GET /api/photo?id=... — public, no password needed. Streams back the
// actual image bytes for one photo.
export default async (req) => {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return new Response("Missing id", { status: 400 });
  }

  const store = getStore({ name: "photos", consistency: "strong" });
  const result = await store.getWithMetadata(id, { type: "arrayBuffer" });

  if (!result) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(result.data, {
    headers: {
      "content-type": result.metadata?.contentType || "application/octet-stream",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
};

export const config = { path: "/api/photo", method: "GET" };
