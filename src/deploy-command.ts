import * as commands from './commands'
if(process.env.DEBUG) {
	require('dotenv').config()
}

const { Routes } = require('discord-api-types/v9')
const { REST } = require('@discordjs/rest')
const token = process.env.TOKEN as string
const clientId = process.env.CLIENT_ID as string
const guildId = process.env.DEBUG_GUILD_ID as string

const rest = new REST({ version: '9' }).setToken(token)

const deploy = async () => {
	const cmd_body:any = []
	const cmd = Object.keys(commands)
	cmd.forEach((e:any)=>{
		cmd_body.push((commands as any)[e].data.toJSON())
	})
	try {
		console.log('Started refreshing application (/) commands.')
		// console.log(commands)
		if (process.env.DEBUG) {
			console.log('Deploying to DEBUG server...')
			await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
				body: cmd_body,
			})
		} else {
			await rest.put(Routes.applicationCommands(clientId), {
				body: cmd_body,
			})
		}

		console.log('Successfully reloaded application (/) commands.')
	} catch (error) {
		console.error(error)
	}
}

deploy()