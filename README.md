# Aesthetic Study Space

A customizable digital study space: a draggable-widget desk (Pomodoro timer, clock, music player, to-do list, quotes), background/theme/sticker/ambient-sound stores, a creator marketplace for user-submitted themes, quests with coin rewards, and an admin dashboard — all wrapped in a real-time notification/banner system.

## Tech stack

- **React 18** + **TypeScript**, built with **Vite**
- **React Router 7** for routing
- **Chakra UI 3** for the Study Space UI, **Radix UI** + **Tailwind CSS 4** for the marketing site (shadcn-style components)
- **Framer Motion** (`motion`) for animation/drag interactions
- **react-i18next** for Vietnamese/English localization
- **axios** for API calls

## Getting started

```bash
npm i
npm run dev      # start the dev server
npm run build    # production build
```

### Environment variables

Create a `.env` (and optionally `.env.development` to override it locally) with:

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the backend API |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID (sign-in) |
| `VITE_CLOUDINARY_CLOUD_NAME` / `VITE_CLOUDINARY_UPLOAD_PRESET` | Cloudinary config for image/asset uploads |
| `VITE_UNSPLASH_ACCESS_KEY` | Unsplash API key (background image search) |
| `VITE_PUBLIC_BETA` | `true`/`false` — gates beta-only features |

## Project structure

```
src/
  app/
    pages/            top-level routed pages (Home, Login, StudySpace, Admin, Pricing, ...)
    components/
      StudySpace/      the study space itself
        widgets/         draggable desk widgets: Pomodoro, Clock, MusicPlayer, TodoList, Quote, StickyNote
        panels/          floating panels: Settings, Theme Store, Room Manager, Quests, Feedback, ...
        sections/        composition layer (toolbar, widgets, panels) wired to useStudySpace()
        ui/              shared building blocks (toolbar buttons, modals, context menu, ...)
      homepage/        marketing/landing page sections
      admin/           admin dashboard sections
    hooks/studyspace/  the app's core state (useStudySpace + per-feature hooks: pomodoro, clock, ambient sound, workspace autosave)
    context/           React contexts (auth, accent color, toolbar position, notification banners)
  services/            axios-based API clients, one per backend resource
  i18n/locales/        vi.json / en.json translation strings
  types/               shared TypeScript types (e.g. workspace layout config)
```

## Key features

- **Study Space**: a persistent, per-room workspace with draggable widgets (Pomodoro, Clock, Music Player, To-Do List, Sticky Notes, Quotes), custom backgrounds, stickers, ambient sound mixing, and visual effects. Layout auto-saves to the backend per room.
- **Aesthetic Store**: browse/purchase official and community themes, backgrounds, stickers, ambient sounds; a **Creator** flow lets users submit their own themes for admin review and sale.
- **Notification banners**: a unified, stacking banner system (top-right) covers the welcome greeting, new user notifications (e.g. creator theme approval/rejection, asset published), and quest-completion celebrations — with configurable volume/sound in Settings.
- **Quests**: daily/weekly/achievement missions with coin rewards, claimable from the Quests panel.
- **Pomodoro**: configurable focus/break/session counts, per-event chime sounds with independent volume, browser notifications, and Picture-in-Picture support.
- **Admin dashboard**: manage users, store assets, creator submissions, and notifications (`/admin`, admin-only route).
- **Auth**: email/password + Google OAuth, password reset flow, role-based route protection.
- **i18n**: full Vietnamese/English localization via `react-i18next`.

## Routes

| Path | Page |
|---|---|
| `/` | Landing page |
| `/login`, `/signup`, `/forgot-password`, `/reset-password` | Auth flows |
| `/space` | The Study Space (protected, non-admin) |
| `/admin` | Admin dashboard (protected, admin-only) |
| `/pricing`, `/about` | Marketing pages |
| `/payment/result` | Payment callback landing page |
