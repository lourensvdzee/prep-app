# Prep Inventory App - Setup Guide

## Overview

This app connects to your Google Sheet and displays your prep inventory with status indicators:
- 🔴 **Expired** - past expiration date
- 🟠 **Expiring Soon** - alert date reached
- 🟢 **OK** - before alert date

## Prerequisites

- Node.js 18+ installed
- A Google account
- Your prep inventory Google Sheet

---

## Step 1: Prepare Your Google Sheet

Your sheet should have these columns (names are flexible):

| Column | Required | Description |
|--------|----------|-------------|
| Name | Yes | Product name |
| Amount | Yes | Quantity with unit |
| Edeka | No | Shop info (read-only display) |
| Denns | No | Shop info (read-only display) |
| Rewe | No | Shop info (read-only display) |
| THT | Yes | Expiration date (DD.MM.YYYY) |
| Alert | No | Alert date (DD.MM.YYYY) |

**Get your Sheet ID:**
Open your Google Sheet. The URL looks like:
```
https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
```
Copy the `1qLP9o9aK43LStmczlygbweZdn2vx1jy0TFg6CeinP-E` part.

---

## Step 2: Set Up Google Apps Script

1. **Go to** [script.google.com](https://script.google.com)

2. **Create a new project:**
   - Click "New Project"
   - Name it "Prep Inventory API"

3. **Copy the code:**
   - Open `google-apps-script/Code.gs` from this project
   - Paste it into the script editor (replace everything)

4. **Configure your Sheet ID:**
   - Find this line near the top:
     ```javascript
     const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
     ```
   - Replace `YOUR_SPREADSHEET_ID_HERE` with your actual Sheet ID

5. **Test the script:**
   - Click the function dropdown (shows "myFunction")
   - Select `testGetAll`
   - Click "Run"
   - Grant permissions when prompted
   - Check the execution log - you should see your inventory data

6. **Deploy as Web App:**
   - Click "Deploy" → "New deployment"
   - Click the gear icon → "Web app"
   - Configure:
     - Description: "Prep Inventory API"
     - Execute as: **Me**
     - Who has access: **Anyone**
   - Click "Deploy"
   - **Copy the Web App URL** (looks like `https://script.google.com/macros/s/.../exec`)

---

## Step 3: Set Up the Frontend

1. **Install dependencies:**
   ```bash
   cd prep-app
   npm install
   ```

2. **Create your `.env` file:**
   ```bash
   cp .env.example .env
   ```

3. **Add your API URL:**
   Edit `.env` and paste your Google Apps Script URL:
   ```
   VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_ID/exec
   ```

4. **Test locally:**
   ```bash
   npm run dev
   ```
   Open http://localhost:5173 in your browser.

---

## Step 4: Deploy to Vercel

1. **Create a Vercel account** at [vercel.com](https://vercel.com)

2. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

3. **Deploy:**
   ```bash
   vercel
   ```
   Follow the prompts. When asked about environment variables, add:
   - Name: `VITE_GOOGLE_SCRIPT_URL`
   - Value: Your Google Apps Script URL

4. **Get your production URL:**
   After deployment, Vercel gives you a URL like `your-app.vercel.app`

---

## Step 5: Install on iPhone (PWA)

1. **Open Safari** on your iPhone
2. **Go to your Vercel URL** (e.g., `your-app.vercel.app`)
3. **Tap the Share button** (square with arrow)
4. **Scroll down and tap** "Add to Home Screen"
5. **Name it** "Prep" (or whatever you like)
6. **Tap "Add"**

The app now appears on your home screen and works like a native app!

---

## PWA Icons

The placeholder icon files in `/public` need to be replaced with actual images:
- `pwa-192x192.png` - 192x192 pixels
- `pwa-512x512.png` - 512x512 pixels
- `apple-touch-icon.png` - 180x180 pixels
- `favicon.ico` - 32x32 pixels

You can create simple icons using any image editor or online tool like:
- [favicon.io](https://favicon.io/)
- [realfavicongenerator.net](https://realfavicongenerator.net/)

---

## Updating the App

### When you change the Google Sheet structure:
1. Update `google-apps-script/Code.gs` if column names changed
2. In Google Apps Script, create a **new deployment** (not edit existing)
3. Update `VITE_GOOGLE_SCRIPT_URL` with the new URL

### When you change the frontend:
```bash
vercel --prod
```

---

## Troubleshooting

### "CORS error" or "Failed to fetch"
- Make sure your Google Apps Script is deployed with "Anyone" access
- Check that the URL in `.env` ends with `/exec` (not `/dev`)

### Data doesn't update
- Google Apps Script caches responses. Create a new deployment to clear cache
- Check that your Sheet ID is correct

### App doesn't work offline
- The service worker caches API responses for 24 hours
- First load must be online to cache the data

### Status colors wrong
- Check your date format is DD.MM.YYYY
- Alert date should be before expiration date

---

## Future Enhancements

The codebase is structured to easily add:

1. **Notifications** - Add a notification service in `src/notifications.ts`
2. **CRUD operations** - API functions already exist in `src/api.ts`
3. **Categories** - Add a category column and grouping
4. **Multiple locations** - Add a location column
5. **Days of autonomy** - Add calculation based on daily consumption

---

## Project Structure

```
prep-app/
├── google-apps-script/
│   └── Code.gs              # Google Apps Script backend
├── public/
│   └── *.png                # PWA icons
├── src/
│   ├── components/
│   │   ├── ItemCard.tsx     # Individual item display
│   │   ├── StatusSection.tsx # Status group (OK/Expiring/Expired)
│   │   └── Summary.tsx      # Summary cards at top
│   ├── api.ts               # API calls + caching
│   ├── utils.ts             # Date parsing, status calculation
│   ├── types.ts             # TypeScript interfaces
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Entry point
│   └── index.css            # All styles
├── .env.example             # Environment variable template
├── vite.config.ts           # Vite + PWA configuration
└── SETUP.md                 # This file
```
