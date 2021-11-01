# Pinkfredor Discord Bot
General Purpose discord bot

## Demo Server
https://discord.gg/qPA9WxbBpM

## How to run this bot (For developers)
1. Install all dependencies
```
npm ci
```
2. Set required API keys as environment variable
- TOKEN (discord bot token)
- FIREBASE_PRIVATE_KEY (Google Firebase - Cloud firestore - where server prefixes are stored)
- MAL_CLIENT_SECRET (myanimelist API client secret)
- DRIVE_CLIENT_SECRET (Google Drive)
3. Run it
```
npm run dev
```