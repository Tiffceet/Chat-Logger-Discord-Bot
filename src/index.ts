import { Client, Intents } from 'discord.js'

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

// Login to Discord with your client's token
client.login(token)