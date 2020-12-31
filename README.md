# Pinkfredor Discord Bot
General Purpose discord bot

## How to host this bot
1. Install typescript and ts-node
```
npm install typescript
npm install ts-node
```
2. Install all dependencies
```
npm install
```
3. Set required API keys as environment variable
- TOKEN (discord bot token)
- FIREBASE_PRIVATE_KEY (Google Firebase - Cloud firestore - where server prefixes are stored)
- MAL_CLIENT_SECRET (myanimelist API client secret)
4. Run it
```
ts-node src/index.ts
```
