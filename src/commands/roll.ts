import Command from '../interface/Command'
import {SlashCommandBuilder} from '@discordjs/builders'
const roll:Command = {
	data: new SlashCommandBuilder()
		.setName('roll')
		.setDescription('Roll a number between 0 to 100')
		.addNumberOption(opt=>opt
			.setName('max')
			.setDescription('Set a maximum amount'))
		.addNumberOption(opt=>opt
			.setName('min')
			.setDescription('Set a minimum')),
	execute: async(interaction:any) => {
		let min = 0
		let max = 100
		// extract number at the back if any
		if(interaction.options.get('max')) {
			max = interaction.options.get('max')?.value
		}
		if(interaction.options.get('min')) {
			min = interaction.options.get('min')?.value
		}
		interaction.reply(
			`<@${interaction.user.id}> rolled a ${Math.floor(
				Math.random() * max - min
			)}`
		)
	}
}

export default roll