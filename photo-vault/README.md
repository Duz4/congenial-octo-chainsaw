# Photo Vault

Anyone with the link can view the gallery. Adding or deleting a photo needs a password. Built as static HTML + Netlify Functions + Netlify Blobs — no database to set up.

## What's in here

```
photo-vault/
├── index.html                      the whole front end
├── netlify/functions/
│   ├── photos.mjs                  GET  /api/photos       – list all photos (public)
│   ├── photo.mjs                   GET  /api/photo?id=..  – serve one image (public)
│   ├── upload.mjs                  POST /api/upload       – add a photo (password required)
│   └── delete-photo.mjs            POST /api/delete-photo – remove a photo (password required)
├── package.json                    one dependency: @netlify/blobs
├── netlify.toml                    tells Netlify where the functions live
└── robots.txt                      asks search engines not to index the gallery
```

Photos are stored in **Netlify Blobs**, Netlify's built-in object storage. Nothing to provision — it comes with the site.

## 1. Push it to a Git repo and import it

Functions need a real build step, so use GitHub/GitLab/Bitbucket + Netlify's "Import an existing project" flow rather than the plain drag-and-drop deploy — drag-and-drop is meant for static files only and isn't a reliable way to get the `netlify/functions` folder built.

```bash
cd photo-vault
git init
git add .
git commit -m "photo vault"
```

Push that to a new GitHub repo, then in Netlify: **Add new site → Import an existing project**, pick the repo. Leave the build command blank and set the publish directory to `.` — `netlify.toml` handles the rest.

(Prefer not to use Git? `npx netlify-cli deploy --prod` from inside this folder also works and builds functions correctly — unlike raw drag-and-drop.)

## 2. Set the password

In the Netlify dashboard: **Site configuration → Environment variables → Add a variable**

- Key: `UPLOAD_PASSWORD`
- Value: whatever you want the upload password to be
- Tick "Contains secret values"

This is the actual fix for what you asked about: the password now lives only in Netlify's environment variables and is checked server-side in the upload/delete functions — it's never in any file that ships to the browser. **Trigger a redeploy after adding it**, since env vars only apply to deploys that happen after they're set.

## 3. Use it

Open the site — the gallery loads with no login. Click **Add photos**, enter the password, and drop in some images. Deleting a photo asks for the password too (it remembers it for the rest of your visit after the first successful use).

## Good to know

- **Photos are grouped by the day they were taken**, read from each photo's EXIF data (JPEG only) before it's compressed for upload — not the day it was uploaded. If a photo has no EXIF (PNGs, screenshots, or a phone that strips it), it falls back to grouping by upload date instead, so nothing goes ungrouped.
- **The save button** on each photo uses the native share sheet on phones (the "Save Image" option there is the closest a website can get to a real camera-roll save — see the earlier conversation on why a one-tap bulk save isn't possible from a browser). On desktop, or if the share sheet isn't available, it falls back to a normal file download.
- **The gallery is public to anyone with the link.** There's no view-only login wall, exactly as you asked for — so treat the URL itself as the thing to keep private if these photos shouldn't be public. `robots.txt` and a `noindex` tag keep it out of search engines, but that's obscurity, not real access control.
- **Photos are resized in the browser** before upload (long edge capped at 1600px, JPEG ~85% quality), both so pages load faster and to stay under Netlify Blobs' 5MB-per-file limit.
- **It's one shared password, not accounts.** Fine for a family or friend group; not built for anything sensitive. If you ever want real per-person logins, that's a bigger step up and I'm happy to help wire that up.
