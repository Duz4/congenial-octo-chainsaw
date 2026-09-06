import { getStore } from "@netlify/blobs";

// POST /api/delete-photo — requires the same password as uploading.
export default async (req) => {
  const password = req.headers.get("x-upload-password") || "";
  if (password !== process.env.UPLOAD_PASSWORD) {
    return json({ error: "Incorrect password" }, 401);
  }

  let id = "";
  try {
    const body = await req.json();
    id = body?.id || "";
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  if (!id) {
    return json({ error: "Missing id" }, 400);
  }

  const store = getStore({ name: "photos", consistency: "strong" });
  await store.delete(id);

  return json({ ok: true });
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const config = { path: "/api/delete-photo", method: "POST" };
