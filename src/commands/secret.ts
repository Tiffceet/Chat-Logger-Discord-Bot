import Command from '../interface/Command'
import { SlashCommandBuilder } from '@discordjs/builders'
import {
	CommandInteraction,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} from 'discord.js'
const secret: Command = {
	data: new SlashCommandBuilder().setName('secret').setDescription('Shh...'),
	execute: async (interaction: CommandInteraction) => {
		const img_url = 'https://i.imgur.com/PVZ5Ubz.jpg'

		const hehe = 'https://bitly.com/98K8eH'

		const action_row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setLabel('Accept')
				.setStyle(ButtonStyle.Link)
				.setURL(hehe)
		)

		const scam_embed = new EmbedBuilder()
			.setTitle('You\'ve been gifted a subscription!')
			.setDescription(
				'**Pinkfredor#7014** has gifted you nitro for **1 month**!'
			)
			// .setThumbnail(img_url)
			.setImage(img_url)
			.setFooter({ text: 'Expires in 48 hours' })

		interaction.reply({
			ephemeral: true,
			embeds: [scam_embed],
			components: [action_row],
		})
	},
}

export default secret
