import { Client, GatewayIntentBits, InteractionType, Partials } from 'discord.js'
import * as commands from './commands'
if (process.env.DEBUG) {
	console.log('Application started in DEBUG mode')
	require('dotenv').config()
}
const token = process.env.TOKEN

// Create a new client instance
// Discord Gateaway Intents: https://discord.com/developers/docs/topics/gateway#gateway-intents
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.DirectMessageReactions,
	],
	partials: [Partials.Channel],
})

// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log('Ready!')
})

client.on('interactionCreate', async (interaction) => {
	if (!(interaction.type === InteractionType.ApplicationCommand)) {
		return
	}
	const command = (commands as any)[interaction.commandName]
	if (!command) {
		return
	}

	try {
		await (command as any).execute(interaction)
	} catch (error) {
		console.error(error)
	}
})

// Login to Discord with your client's token
client.login(token)
