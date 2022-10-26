import Command from '../interface/Command'
import * as fs from 'fs'
import {
	CommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from 'discord.js'
const help: Command = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Get help')
		.addStringOption((option) =>
			option
				.setName('command')
				.setDescription('Get description of specific command')
		),
	execute: async (interaction: CommandInteraction) => {
		const help_desc = JSON.parse(
			fs.readFileSync('data/HelpDesc.json').toString()
		)
		const default_help_embed = new EmbedBuilder()
			.setColor('#e9e9e9')
			.setTitle('Commands')
			.addFields(help_desc['help_page'])
			.setTimestamp()

		if (interaction.options.get('command')) {
			const arg = (interaction.options.get('command') as any)
				.value as any
			if (help_desc['command'][arg]) {
				const desc_embed = new EmbedBuilder().setTitle(arg).addFields(
					{
						name: 'Description',
						value: `${help_desc['command'][arg].desc}`,
					},
					{
						name: 'Usage',
						value: `${help_desc['command'][arg].usage}`,
					}
				)
				interaction.reply({ embeds: [desc_embed] })
				return
			}
		}

		interaction.reply({ embeds: [default_help_embed] })
	},
}

export default help
