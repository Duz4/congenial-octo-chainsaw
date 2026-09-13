// POST /api/verify-password — confirms a password without doing anything
// else. Used purely to decide whether to reveal delete buttons in the UI.
// It carries no special trust: the real upload/delete endpoints re-check the
// password themselves regardless of what this one says.
const UPLOADERS = {};
if (process.env.UPLOAD_PASSWORD_C) UPLOADERS[process.env.UPLOAD_PASSWORD_C] = "c";
if (process.env.UPLOAD_PASSWORD_T) UPLOADERS[process.env.UPLOAD_PASSWORD_T] = "t";

export default async (req) => {
  const password = req.headers.get("x-upload-password") || "";
  const uploader = UPLOADERS[password];
  if (!uploader) {
    return json({ error: "Incorrect password" }, 401);
  }
  return json({ ok: true, uploader });
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const config = { path: "/api/verify-password", method: "POST" };
