import Command from '../interface/Command'
import { ColorResolvable, EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import fetch from 'node-fetch'
const inspireme:Command = {
	data: new SlashCommandBuilder()
		.setName('inspireme')
		.setDescription('Seek Inspiration from AI generated quotes'),
	execute: async (interaction) => {
		await interaction.deferReply()
		const url = 'https://inspirobot.me/api?generate=true'
		const HTMLResponse = await fetch(url)
		const img_url = await HTMLResponse.text()
		const inspiration_embed = new EmbedBuilder()
			.setTitle('InspiroBot')
			.setURL('https://inspirobot.me/')
			.setColor(('#' + ((Math.random() * 0xffffff) << 0).toString(16)) as ColorResolvable)
			.setImage(img_url)

		interaction.editReply({embeds: [inspiration_embed]})
	}
}

export default inspireme