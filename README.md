# Lumen — Blogging Platform

A complete blogging platform built with **React + Vite + JavaScript**.

It ships as a **single static deployment** — one `npm run build` produces a
self-contained `dist/` folder you can host anywhere (Netlify, Vercel, GitHub
Pages, S3, nginx…). There is no separate backend to run: all data persists in
`localStorage`, so the app works offline and out of the box.

## Features

| Area | What's included |
| --- | --- |
| **Posts** | Publish, edit and delete posts with a Markdown composer, live preview, tags, reading time, auto-generated slugs and an optional **cover image URL** with live preview |
| **Authentication** | Sign up, sign in, sign out, session persistence, password change, salted SHA-256 password hashing (Web Crypto with a fallback), form validation |
| **Comments** | Threaded discussion on every post, 500-char limit, delete your own (or any comment on your own post) |
| **Likes** | One like per user per post, toggled, with live counts |
| **Author profiles** | Public profile pages with bio, location, website, join date, post/like/comment stats and an inline bio editor |
| **Extras** | Feed search, tag filtering, sort by newest / most liked / most discussed, light–dark theme, "your posts" dashboard, cross-tab sync, seed demo content |

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
```

## Build & deploy (single deployment)

```bash
npm run build    # outputs static files to dist/
npm run preview  # serve the production build locally
```

Upload the contents of `dist/` to any static host. Because routing is
client-side, configure your host to rewrite all paths to `index.html`
(e.g. a `_redirects` file with `/*  /index.html  200` on Netlify).

## Demo accounts

Three seeded accounts let you explore immediately:

| Username | Password |
| --- | --- |
| `ada` | `demo1234` |
| `marcus` | `demo1234` |
| `priya` | `demo1234` |

The login page has a one-click **“Use the demo account”** button.

## Project structure

```
src/
├── main.jsx                 # entry: providers + router
├── App.jsx                  # routes and protected-route wrapper
├── components/
│   ├── Avatar.jsx           # colour-coded initial avatars
│   ├── Modal.jsx            # accessible confirmation dialog
│   ├── Navbar.jsx           # search, theme toggle, user menu
│   └── PostCard.jsx         # feed card + like/comment icons
├── data/seed.js             # demo users, posts, comments, likes
├── lib/
│   ├── auth.js              # hashing + validation
│   ├── markdown.js          # safe Markdown → HTML renderer
│   ├── storage.js           # localStorage persistence + sessions
│   └── utils.js             # ids, slugs, dates, reading time
├── pages/
│   ├── Home.jsx             # feed, search, tag + sort controls
│   ├── PostDetail.jsx       # article, likes, comment thread
│   ├── Editor.jsx           # create / edit composer
│   ├── AuthorProfile.jsx    # public profile + inline editing
│   ├── Dashboard.jsx        # manage your posts
│   ├── Settings.jsx         # password, theme, data reset
│   ├── Login.jsx / Register.jsx
│   ├── TagFeed.jsx / NotFound.jsx
├── store/
│   ├── StoreContext.jsx     # single source of truth for all data
│   └── ThemeContext.jsx     # light / dark theme
└── styles/index.css         # design system (CSS variables, both themes)
```

## Security notes

- Markdown is rendered through an escaping pipeline, so post content cannot
  inject HTML or scripts. Links only allow `http(s)` and `mailto`.
- Cover image URLs are validated: only `http://` and `https://` URLs are
  accepted (so `data:`, `javascript:` and similar are rejected), length is
  capped, and a failed load hides the image rather than showing a broken frame.
- Passwords are never stored in plain text; each account gets a unique salt
  and a SHA-256 hash via `crypto.subtle`, with a non-cryptographic fallback
  for non-secure contexts.
- This is a client-side app, so data lives in the browser of whoever is using
  it. It is ideal for personal or demo use; add a real API if you need shared
  multi-user data across devices.
