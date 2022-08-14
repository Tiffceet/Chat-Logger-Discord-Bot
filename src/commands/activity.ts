import Command from '../interface/Command'
import { SlashCommandBuilder } from 'discord.js'
import fetch from 'node-fetch'
const activity: Command = {
	data: new SlashCommandBuilder()
		.setName('activity')
		.setDescription('Initiate a discord activity')
		.addStringOption((opt) =>
			opt
				.setName('activity_type')
				.setRequired(true)
				.setDescription('Activity to start')
				.addChoices(
					{ name: 'youtube', value: 'youtube' },
					{ name: 'youtubedev', value: 'youtubedev' },
					{ name: 'poker', value: 'poker' },
					{ name: 'betrayal', value: 'betrayal' },
					{ name: 'fishing', value: 'fishing' },
					{ name: 'chess', value: 'chess' },
					{ name: 'chessdev', value: 'chessdev' },
					{ name: 'lettertile', value: 'lettertile' },
					{ name: 'wordsnack', value: 'wordsnack' },
					{ name: 'doodlecrew', value: 'doodlecrew' },
					{ name: 'awkword', value: 'awkword' },
					{ name: 'spellcast', value: 'spellcast' },
					{ name: 'checkers', value: 'checkers' },
					{ name: 'puttparty', value: 'puttparty' },
				)
		),
	execute: async (interaction: any) => {
		if (interaction.channel.type === 'DM') {
			interaction.reply(
				'Do you even have friends lol, doing it in DM...\nIt only works in server'
			)
			return
		}
		await interaction.deferReply()
		const activity_type = interaction.options.get('activity_type')
			?.value as string
		if (typeof activity.application_id[activity_type] === 'undefined') {
			interaction.editReply('Invalid activity')
			return
		}
		if (!interaction.member.voice.channel) {
			interaction.editReply('Please join a voice channel first')
			return
		}
		const fetch_obj = await fetch(
			`https://discord.com/api/v8/channels/${interaction.member.voice.channel.id}/invites`,
			{
				method: 'POST',
				body: JSON.stringify({
					max_age: 86400,
					max_uses: 0,
					target_application_id:
                        activity.application_id[activity_type],
					target_type: 2,
					temporary: false,
					validate: null,
				}),
				headers: {
					Authorization: `Bot ${process.env.TOKEN}`,
					'Content-Type': 'application/json',
				},
			}
		)
		const res = await fetch_obj.json()
		const invite_link = `https://discord.gg/${res.code}`
		interaction.editReply(
			`${activity.application_name[activity_type]}: ${invite_link}`
		)
	},
	application_id: {
		youtube: '880218394199220334',
		youtubedev: '880218832743055411',
		poker: '755827207812677713',
		betrayal: '773336526917861400',
		fishing: '814288819477020702',
		chess: '832012774040141894',
		chessdev: '832012586023256104',
		lettertile: '879863686565621790',
		wordsnack: '879863976006127627',
		doodlecrew: '878067389634314250',
		awkword: '879863881349087252',
		spellcast: '852509694341283871',
		checkers: '832013003968348200',
		puttparty: '763133495793942528',
	},
	application_name: {
		youtube: 'Youtube Together',
		youtubedev: 'Youtube Together Dev',
		poker: 'Poker Night',
		betrayal: 'Betrayal',
		fishing: 'Fishington',
		chess: 'Chess in Park',
		chessdev: 'Chess in Park Dev',
		lettertile: 'Letter Tile',
		wordsnack: 'Word Snack',
		doodlecrew: 'Doodle Crew',
		awkword: 'Awkword',
		spellcast: 'SpellCast',
		checkers: 'Checkers',
		puttparty: 'Puttparty',
	},
}

export default activity
