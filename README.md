# Pinkfredor Discord Bot
General Purpose discord bot

## Demo Server
https://discord.gg/qPA9WxbBpM

## Requirements
| Items | Version |
| ----- | ------- |
| npm   | ^8.1.0 |
| node  | ^17.0.1 |

## How to run this bot (For developers)
1. Install all dependencies
```
npm ci
```
2. Set environment variable

| Key      | Description |
| ----------- | ----------- |
| TOKEN      | Discord bot token       |
| CLIENT_ID   | Discord bot client_id        |
| CLIENT_SECRET   | Discord bot client_secret        |
| APPLICATION_ID   | Discord bot application id        |
| DEBUG_GUILD_ID   | Discord Server ID of the server you like to test this on        |
| DEBUG | Set this to non-empty value to run the bot in debug mode (Note: Bot runs in production mode by default) | 

3. Deploy the slash commands 

NOTE 1: If DEBUG is set, the commands will only be deployed to specified DEBUG_GUILD_ID

NOTE 2: Deploy is not possible if you did not install devDependencies
```
npm run deploy
```

4. Run the bot

Development:
```sh
# Choose one of these
npm run dev # Run nodemon
npm run debug # Run nodemon with --inspect flag
```
Production:
```sh
npm run build # Compiles source code
npm start # Run compiled files
```