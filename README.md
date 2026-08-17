# MessTrack 🥗

MessTrack is an offline-first, mobile-optimized PWA for tracking protein and calories from your weekly hostel/mess menu. It's built with React, Tailwind CSS v4, and Vite, and uses the Gemini AI API entirely within your browser to automatically match and estimate the nutritional value of your meals.

## Features

- **Privacy First (No Backend):** 100% of your data lives in your browser's IndexedDB. Your meals, menus, and custom foods never leave your device.
- **BYO API Key:** Gemini AI is used to parse menus and estimate macros. Your API key is stored locally in your browser and sent directly to Google—never to an intermediate server.
- **Apple Fitness Aesthetic:** Dark mode by default, large bold typography, and colorful, glowing activity rings.
- **PWA Ready:** Installable on iOS/Android as a standalone app with offline caching and safe-area insets.
- **Smart Suggestions:** Get automatic suggestions for which meals to eat from your menu to hit your protein and calorie targets.

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

## Using AI Features

To enable menu parsing and automatic nutrition estimation:
1. Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Open MessTrack and go to **Settings > API Key**.
3. Paste your key. It will be stored safely in your local IndexedDB.

*Note: You can still use the app perfectly fine without an API key by manually entering your meals and foods.*

## Tech Stack

- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS v4
- **State Management:** Zustand
- **Database:** idb (IndexedDB wrapper)
- **Icons:** Lucide React
- **Charts:** Recharts
- **PWA:** vite-plugin-pwa

## Exporting & Importing Data

Since there's no backend, you are responsible for your data. You can go to **Settings > Export** to download a complete JSON backup of your database, which can be restored via the **Import** button.
