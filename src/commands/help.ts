import Command from '../interface/Command'
import {SlashCommandBuilder} from '@discordjs/builders'
import * as fs from 'fs'
import { MessageEmbed } from 'discord.js'
const help:Command = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Get help')
		.addStringOption(
			option=>option
				.setName('command')
				.setDescription('Get description of specific command')
		),
	execute: async(interaction) => {
		const help_desc = JSON.parse(
			fs.readFileSync('data/HelpDesc.json').toString()
		)
		const default_help_embed = new MessageEmbed()
			.setColor('#e9e9e9')
			.setTitle('Commands')
			.addFields(help_desc['help_page'])
			.setTimestamp()

		if(interaction.options.get('command')) {
			const arg = (interaction.options.get('command') as any).value as any
			if (help_desc['command'][arg]) {
				const desc_embed = 
					new MessageEmbed().setTitle(arg).addFields(
						{
							name: 'Description',
							value: `${help_desc['command'][arg].desc}`,
						},
						{
							name: 'Usage',
							value: `${help_desc['command'][arg].usage}`,
						}
					)
				interaction.reply({embeds: [desc_embed]})
			}
		}
        
		interaction.reply({embeds:[default_help_embed]})
	}
}

export default help