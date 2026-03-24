# 🎬 ReelGuide AI

> AI-powered reel shooting guide — upload a walkthrough video, get a custom shot sequence, shoot your clips, and generate a pro reel.

**Live demo:** `https://yourusername.github.io/reelguide`

---

## 🏗️ Architecture

```
Browser (GitHub Pages)
    │
    ├── Gemini API        → AI video analysis + shot generation
    ├── Cloudinary        → Video/clip storage (free 25GB)
    └── MongoDB Atlas     → Sessions, jobs, reels (free 512MB)
```

No backend server needed. Everything runs serverlessly through official APIs.

---

## 🚀 Full Setup Guide (Step by Step)

### Step 1 — Fork & Clone

```bash
# Fork this repo on GitHub, then clone it
git clone https://github.com/YOURUSERNAME/reelguide.git
cd reelguide
```

---

### Step 2 — Get your Gemini API Key

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Click **Create API Key**
3. Copy the key (starts with `AIza...`)
4. Free tier: 15 requests/minute, 1M tokens/day — no billing needed

---

### Step 3 — Set up Cloudinary

1. Sign up free at [cloudinary.com](https://cloudinary.com) (25GB free)
2. From your Dashboard, note your **Cloud Name**
3. Go to **Settings → Upload → Upload Presets**
4. Click **Add upload preset**
5. Set **Signing Mode** to `Unsigned`
6. Set **Folder** to `reelguide`
7. Save — note the **Preset Name** (e.g. `reelguide_preset`)

---

### Step 4 — Set up MongoDB Atlas

1. Sign up free at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a **free M0 cluster** (512MB, always free)
3. Choose any region
4. Go to **App Services** (top nav)
5. Click **Create a New App**
6. Name it `reelguide`, link to your cluster
7. Go to **HTTPS Endpoints → Data API**
8. Enable the Data API
9. Copy your **App ID** (looks like `data-abcde`)
10. Go to **Authentication → API Keys**
11. Create a new API key — copy it
12. Go to **Rules → Collections**
13. Add these 4 collections with **Read & Write** permissions:
    - `sessions`
    - `jobs`
    - `reels`
    - `stats`

---

### Step 5 — Add GitHub Secrets

In your GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**

Add these 5 secrets:

| Secret Name | Where to get it |
|---|---|
| `GEMINI_API_KEY` | Step 2 |
| `CLOUDINARY_CLOUD_NAME` | Step 3 — Dashboard |
| `CLOUDINARY_UPLOAD_PRESET` | Step 3 — Preset name |
| `MONGODB_APP_ID` | Step 4 — App ID |
| `MONGODB_API_KEY` | Step 4 — API key |

---

### Step 6 — Enable GitHub Pages

1. Go to repo **Settings → Pages**
2. Source: **GitHub Actions**
3. Save

---

### Step 7 — Deploy

```bash
git add .
git commit -m "Initial deploy"
git push origin main
```

GitHub Actions will:
1. Inject your secrets into `config.js`
2. Build the site
3. Deploy to GitHub Pages

Your app will be live at: `https://YOURUSERNAME.github.io/reelguide`

---

## 📁 Project Structure

```
reelguide/
├── .github/
│   └── workflows/
│       └── deploy.yml          ← GitHub Actions (auto-deploy + inject secrets)
├── src/
│   ├── index.html              ← Main app HTML
│   ├── css/
│   │   └── style.css           ← All styles
│   └── js/
│       ├── config.js           ← Injected by GitHub Actions (DO NOT commit real keys)
│       ├── db.js               ← MongoDB Atlas Data API
│       ├── cloudinary.js       ← Cloudinary direct upload
│       ├── gemini.js           ← All Gemini AI calls
│       └── app.js              ← Main app logic & state
└── README.md
```

---

## 🔄 How It Works

```
User picks reel type
        ↓
Records overview walkthrough video
        ↓
Video → Cloudinary (stored)
Video → Gemini (analysed frame by frame)
Session → MongoDB (saved)
        ↓
Gemini returns personalised shot sequence
        ↓
User shoots each clip → uploads to Cloudinary
        ↓
User picks a song
        ↓
Gemini plans the edit (beat sync, transitions, colour grade)
Gemini writes caption + hashtags
Reel record → MongoDB (saved)
        ↓
User downloads clips + caption
```

---

## 🛠️ Local Development

For testing locally before pushing:

1. Copy `src/js/config.js` and fill in your real keys
2. Use Live Server (VS Code extension) or:

```bash
npx serve src
```

3. Open `http://localhost:3000`

> ⚠️ Never commit `config.js` with real keys. Add it to `.gitignore` locally.

---

## 🆓 Free Tier Limits

| Service | Free Limit |
|---|---|
| Gemini API | 15 req/min, 1M tokens/day |
| Cloudinary | 25GB storage, 25GB bandwidth/month |
| MongoDB Atlas | 512MB storage, shared cluster |
| GitHub Pages | Unlimited static hosting |

All free. No credit card needed for any of these.

---

## 🔒 Security Notes

- API keys are injected at build time by GitHub Actions — never exposed in the repo
- MongoDB Data API keys should have **read/write** access only to the `reelguide` database
- Cloudinary upload preset is **unsigned** (safe for client-side uploads)
- Rate limiting on Gemini: 15 req/min on free tier — app handles this gracefully

---

## 📱 Features

- ✅ 8 reel types (Nature, Shop, Funny, Food, Dance, Fashion, Motivation, Event)
- ✅ Real AI video analysis via Gemini 1.5 Flash
- ✅ Custom shot-by-shot guide based on YOUR actual video
- ✅ Per-clip upload to Cloudinary with progress bar
- ✅ Beat-matched edit plan via Gemini
- ✅ AI-generated Instagram caption + hashtags
- ✅ Session persistence via MongoDB
- ✅ Mobile-first responsive design
- ✅ Works entirely on GitHub Pages (no server)
