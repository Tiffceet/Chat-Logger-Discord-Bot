import Command from '../interface/Command'
import {SlashCommandBuilder} from '@discordjs/builders'
import fetch from 'node-fetch'
const activity:Command = {
	data: new SlashCommandBuilder()
		.setName('activity')
		.setDescription('Initiate a discord activity')
		.addStringOption(opt=>opt
			.setName('activity_type')
			.setRequired(true)
			.setDescription('Activity to start')
			.addChoices([
				['youtube_together', 'youtube_together'],
				['watch_together_dev', 'watch_together_dev'],
				['fishington', 'fishington'],
				['chess_in_the_park', 'chess_in_the_park'],
				['chess_in_the_park_dev', 'chess_in_the_park_dev'],
				['betrayal', 'betrayal'],
				['doodlecrew', 'doodlecrew'],
				['wordsnacks', 'wordsnacks'],
				['lettertile', 'lettertile'],
				['poker_night', 'poker_night'],
			])),
	execute: async (interaction: any) => {
		await interaction.deferReply()
		const activity_type = interaction.options.get('activity_type')?.value as string
		if(typeof activity.application_id[activity_type] === 'undefined') {
			interaction.editReply('Invalid activity')
			return
		}
		if(!interaction.member.voice.channel) {
			interaction.editReply('Please join a voice channel first')
			return
		}
		const fetch_obj = await fetch(`https://discord.com/api/v8/channels/${interaction.member.voice.channel.id}/invites`, {
			method: 'POST',
			body: JSON.stringify({
				max_age: 86400,
				max_uses: 0,
				target_application_id: activity.application_id[activity_type],
				target_type: 2,
				temporary: false,
				validate: null
			}),
			headers: {
				'Authorization': `Bot ${process.env.TOKEN}`,
				'Content-Type': 'application/json'
			}
		})
		const res = await fetch_obj.json()
		const invite_link = `https://discord.gg/${res.code}`
		interaction.editReply(`${activity.application_name[activity_type]}: ${invite_link}`)
	},
	application_id: {
		'youtube_together': '755600276941176913',
		'watch_together_dev': '880218832743055411',
		'fishington': '814288819477020702',
		'chess_in_the_park': '832012774040141894',
		'chess_in_the_park_dev': '832012586023256104',
		'betrayal': '773336526917861400',
		'doodlecrew': '878067389634314250',
		'wordsnacks': '879863976006127627',
		'lettertile': '879863686565621790',
		'poker_night': '755827207812677713'
	},
	application_name: {
		'youtube_together': 'Youtube Together',
		'watch_together_dev': 'Watch Together Dev',
		'fishington': 'Fishington.io',
		'chess_in_the_park': 'Chess in the Park',
		'chess_in_the_park_dev': 'Chess in the Park Development',
		'betrayal': 'Betrayal.io',
		'doodlecrew': 'Doodle Crew',
		'wordsnacks': 'Word Snacks',
		'lettertile': 'Letter Tile',
		'poker_night': 'Poker Night'
	}
}

export default activity