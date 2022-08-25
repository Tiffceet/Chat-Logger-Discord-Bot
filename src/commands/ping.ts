import Command from '../interface/Command'
import {SlashCommandBuilder} from '@discordjs/builders'
import { CommandInteraction } from 'discord.js'
const ping:Command = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Check if the bot is alive'),
	async execute(interaction: CommandInteraction) {
		await interaction.reply('Ping your head a, ping')
	},
}

export default ping