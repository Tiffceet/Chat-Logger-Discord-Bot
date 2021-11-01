import { REST } from '@discordjs/rest'
const { Routes } = require('discord-api-types/v9')

const token = process.env.TOKEN as string
const commands: any[] = []

// Place your client and guild ids here
const clientId = process.env.CLIENT_ID as string
const guildId = process.env.DEBUG_GUILD_ID as string

const rest = new REST({ version: '9' }).setToken(token);

(async () => {
	try {
		console.log('Started refreshing application (/) commands.')

		if (process.env.DEBUG) {
			await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
				body: commands,
			})
		} else {
			await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
				body: commands,
			})
		}

		console.log('Successfully reloaded application (/) commands.')
	} catch (error) {
		console.error(error)
	}
})()
