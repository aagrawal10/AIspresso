# AIspresso Setup Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`

The dashboard will work immediately with **Hacker News** (no API keys required).

---

## API Configuration (Optional)

To enable Reddit and Twitter feeds, you'll need to configure API keys:

### 1. Copy environment file
```bash
cp .env.local.example .env.local
```

### 2. Reddit Setup

1. Go to [Reddit App Preferences](https://www.reddit.com/prefs/apps)
2. Click "Create App" or "Create Another App"
3. Choose "script" type
4. Add these values to `.env.local`:
   ```
   REDDIT_CLIENT_ID=your_reddit_client_id
   REDDIT_CLIENT_SECRET=your_reddit_client_secret
   REDDIT_USERNAME=your_reddit_username
   REDDIT_PASSWORD=your_reddit_password
   ```

### 3. Twitter Setup

1. Apply for [Twitter API access](https://developer.twitter.com/en/apply-for-access)
2. Create a new app and get your Bearer Token
3. Create Twitter Lists with the accounts you want to follow
4. Add these values to `.env.local`:
   ```
   TWITTER_BEARER_TOKEN=your_twitter_bearer_token
   TWITTER_LIST_IDS=123456789,987654321
   ```

To find Twitter List IDs:
- Go to your Twitter List
- Copy the URL: `https://twitter.com/i/lists/1234567890`
- The number at the end is your List ID

---

## Features

✅ **Hacker News** - Works immediately, no setup required
🔴 **Reddit** - Shows your home feed (requires API keys)
🔵 **Twitter** - Shows posts from your Lists (requires API keys)
📱 **Responsive** - Works on desktop and mobile
🎯 **Smart Tracking** - Only shows new posts since your last visit
💾 **Local Storage** - Remembers what you've seen
🔌 **Extensible** - Easy to add new sources

---

## Development Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
npm run typecheck # Run TypeScript checks
```

---

## Architecture

The app is built with a modular architecture that makes it easy to add new sources:

- **FeedFetcher** - Pluggable system for data sources
- **SeenTracker** - localStorage-based tracking
- **FeedMerger** - Combines and sorts posts from all sources
- **EmbedRenderer** - Official embeds where available

To add a new source, create a class implementing `FeedFetcherInterface` and register it in `page.tsx`.

---

## Troubleshooting

**No posts showing:**
- Check that at least Hacker News is working (doesn't need API keys)
- Check browser console for errors
- Try refreshing or clearing localStorage

**Reddit not working:**
- Verify your Reddit credentials in `.env.local`
- Make sure your Reddit account has some subscriptions/follows
- Check that username/password are correct (not your email)

**Twitter not working:**
- Verify your Bearer Token is valid
- Make sure your Twitter Lists exist and have content
- Check that List IDs are comma-separated numbers

**Build errors:**
- Run `npm run typecheck` to check for TypeScript issues
- Run `npm run lint` to check for ESLint issues