import { Client, Intents} from 'discord.js'
import * as commands from './commands'
if(process.env.DEBUG) {
	console.log('Application started in DEBUG mode')
	require('dotenv').config()
}
const token = process.env.TOKEN

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS] })


// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log('Ready!')
})

client.on('interactionCreate', async interaction => {
	if(!interaction.isCommand()) {
		return
	}
	const command = (commands as any)[interaction.commandName]
	if(!command) {
		return
	}
	
	try {
		await (command as any).execute(interaction)
	} catch (error) {
		console.error(error)
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true })
	}

})

// Login to Discord with your client's token
client.login(token)