import Command from '../interface/Command'
import {SlashCommandBuilder} from '@discordjs/builders'
const ping:Command = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	async execute(interaction) {
		await interaction.reply('Pong!')
	},
}

export default ping