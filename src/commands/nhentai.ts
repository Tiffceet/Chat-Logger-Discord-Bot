import Command from '../interface/Command'
// import { SlashCommandBuilder } from '@discordjs/builders'
import {
	CacheType,
	ChannelType,
	ChatInputCommandInteraction,
	ColorResolvable,
	CommandInteraction,
	EmbedBuilder,
	Interaction,
	InteractionResponse,
	SlashCommandBuilder,
	TextChannel,
} from 'discord.js'
import fetch, { Response } from 'node-fetch'
import paginate from '../utils/paginate'
const nhentai: Command = {
	data: new SlashCommandBuilder()
		.setName('nhentai')
		.setDescription('Uh oh...')
		.addSubcommand((subcmd) =>
			subcmd
				.setName('search')
				.setDescription('As if you are searching on nhentai')
				.addStringOption((opt) =>
					opt
						.setName('keyword')
						.setDescription('Keyword')
						.setRequired(true)
				)
				.addStringOption((opt) =>
					opt
						.setName('sortby')
						.setDescription('Sort search result by...')
						.setRequired(false)
						.addChoices(
							{ name: 'Today', value: 'popular-today' },
							{ name: 'Week', value: 'popular-week' },
							{ name: 'All Time', value: 'popular' }
						)
				)
				.addStringOption((opt) =>
					opt
						.setName('page')
						.setDescription('Page of search result')
						.setRequired(false)
				)
		)
		.addSubcommand((subcmd) =>
			subcmd.setName('random').setDescription('Get random doujin')
		)
		.addSubcommand((subcmd) =>
			subcmd
				.setName('info')
				.setDescription('Get information on specific nuke code')
				.addStringOption((opt) =>
					opt
						.setName('nuke_code')
						.setDescription('6 digit, you know it')
						.setRequired(true)
				)
		)
		.addSubcommand((subcmd) =>
			subcmd
				.setName('read')
				.setDescription('Read it in public...')
				.addStringOption((opt) =>
					opt
						.setName('nuke_code')
						.setDescription('6 digit, you know it')
						.setRequired(true)
				)
				.addNumberOption((opt) =>
					opt.setName('page_num').setDescription('Page Number')
				)
		),
	execute: async (interaction: CommandInteraction) => {
		if (interaction.channel === null) {
			interaction.reply('Interaction dont come from a channel')
			return
		}
		// Allow command execution from DM
		if (
			!(interaction.channel as TextChannel).nsfw &&
            interaction.channel.type !== ChannelType.DM
		) {
			interaction.reply('AHEM! Please do this at nsfw channel thanks')
			return
		}
		await interaction.deferReply()
		if (!interaction.isChatInputCommand()) {
			interaction.reply('Not a chat input command')
		}
		const sub_cmd: string = (interaction as ChatInputCommandInteraction).options.getSubcommand()
		let random_flag = false
		switch (sub_cmd) {
			case 'info': {
				// try {
				// 	book = await nhentaiAPI.getBook(
				// 		interaction.options.get('nuke_code')?.value
				// 	)
				// } catch (e) {
				// 	interaction.editReply(
				// 		'You cant give me a code that doesnt exist and expect me to give you something :('
				// 	)
				// 	break
				// }
				const bookRequest = await fetch(
					`http://looz.servehttp.com:3000/nhentai/get?book=${
						interaction.options.get('nuke_code')?.value
					}`
				)
				const book = await bookRequest.json()

				if(typeof book.success !== 'undefined' && !book.success) {
					interaction.editReply(
						'Nhentai scrapper is dead temporarily. Try again later'
					)
					break
				}

				if (typeof book.data === 'undefined') {
					interaction.editReply(
						'You cant give me a code that doesnt exist and expect me to give you something :('
					)
					break
				}
				interaction.editReply({
					embeds: [nhentai.nhentai_info_embed(book)],
				})
				break
			}
			case 'search': {
				const query = encodeURIComponent(
					interaction.options.get('keyword')?.value as string
				)

				let search_url = `http://looz.servehttp.com:3000/nhentai/search?key=${query}`
				if (interaction.options.get('sortby')) {
					search_url +=
                        '&sortby=' + interaction.options.get('sortby')?.value
				}

				if (interaction.options.get('page')) {
					search_url +=
                        '&page=' + interaction.options.get('page')?.value
				}

				// const result = await nhentaiAPI.search(query)
				const resultResponse = await fetch(search_url)
				const result = await resultResponse.json()

				if(typeof result.success !== 'undefined' && !result.success) {
					interaction.editReply(
						'Nhentai scrapper is dead temporarily. Try again later'
					)
					break
				}

				if (result.data.length == 0) {
					interaction.editReply(
						'I could not understand your ~~fetish~~...'
					)
					break
				}

				const search_result_embeds: any = []
				for (let k = 0; k < result.data.length; k++) {
					search_result_embeds.push(
						nhentai.nhentai_info_embed(
							{ data: result.data[k] },
							'',
							true
						)
					)
				}

				let search_footer = 'Result {n} of {max}'
				if (interaction.options.get('sortby')) {
					search_footer +=
                        ' | Sort By: ' +
                        interaction.options.get('sortby')?.value
				}
				if (interaction.options.get('page')) {
					search_footer +=
                        ' | Page: ' + interaction.options.get('page')?.value
				}

				paginate(
					interaction,
					search_result_embeds,
					1,
					search_footer,
					['⏮️', '⬅️', '➡️', '⏭️'],
					300000,
					true
				)
				break
			}
			case 'random': {
				random_flag = true
			}
			case 'read': {
				// let book: any = {}
				// try {
				// 	book = await nhentaiAPI.getBook(
				// 		interaction.options.get('nuke_code')?.value
				// 	)
				// 	// console.log(book);
				// } catch (e) {
				// 	interaction.editReply('The nuke code is invalid')
				// 	break
				// 	// console.log(e);
				// }
				let bookRequest: Response | undefined = undefined
				if (random_flag) {
					bookRequest = await fetch(
						'http://looz.servehttp.com:3000/nhentai/random'
					)
				} else {
					bookRequest = await fetch(
						`http://looz.servehttp.com:3000/nhentai/get?book=${
							interaction.options.get('nuke_code')?.value
						}`
					)
				}
				const book = await bookRequest.json()

				if(typeof book.success !== 'undefined' && !book.success) {
					interaction.editReply(
						'Nhentai scrapper is dead temporarily. Try again later'
					)
					break
				}
                
				if (typeof book.data === 'undefined') {
					interaction.editReply(
						'You cant give me a code that doesnt exist and expect me to give you something :('
					)
					break
				}

				const max_page = book.data.total
				let page_num: any = 1

				try {
					page_num = interaction.options.get('page_num')?.value
					if (page_num > max_page) {
						page_num = max_page
					} else if (page_num <= 0) {
						page_num = 1
					}
				} catch (e) {
					page_num = 1
				}

				const book_embeds: Array<EmbedBuilder> = []

				for (let k = 0; k < max_page; k++) {
					book_embeds.push(
						nhentai.nhentai_read_embed(book, k + 1, true)
					)
				}

				paginate(
					interaction,
					book_embeds,
					page_num,
					'Page {n} of {max}',
					['⏮️', '⬅️', '➡️', '⏭️'],
					300000,
					true
				)
				break
			}
		}
	},
	initcap: (string: string): string => {
		return string.charAt(0).toUpperCase() + string.slice(1)
	},

	/**
     * Function that return a discord embed from a given book from nhentai api
     * @param {API.Book} book book object returned by the nhentai api
     * @param {number} page_num page to display
     * @param {boolean} rand_color (optional) set this to true to set embed to random color
     * @return {Discord.EmbedBuilder}
     */
	nhentai_read_embed: (book: any, page_num: number, rand_color = false) => {
		const embed = new EmbedBuilder()
		embed.setTitle(book.data.title)
		embed.setURL(`https://www.nhentai.net/g/${book.data.id}`)
		embed.setImage(book.data.image[page_num - 1])
		embed.setFooter({ text: `Page ${page_num} of ${book.data.total}` })
		if (rand_color) {
			embed.setColor(
				('#' +
                    Math.floor(Math.random() * 16777215).toString(16)) as ColorResolvable
			)
		}
		return embed
	},

	/**
     * Get nhentai info about the given nuke code
     * @param {API.Book} book Book objecr from nhentai API
     * @param {any} footer (optional) footer of the embed
     * @param {boolean} rand_color (optional) set this to true to set embed to random color
     * @return {Discord.EmbedBuilder}
     */
	nhentai_info_embed: (
		book: any,
		footer: string | null = null,
		rand_color = false
	) => {
		const embed = new EmbedBuilder()
		if (typeof book.data.title === 'object') {
			embed.setTitle(book.data.title.english)
		} else {
			embed.setTitle(book.data.title)
		}

		embed.setURL(book.source)
		if (typeof book.data.cover == 'string') {
			embed.setThumbnail(book.data.cover)
		} else {
			embed.setThumbnail(book.data.image[0])
		}

		const nuke = `Nuke code: ${book.data.id}\n\n`

		const tags = `Tags:\n${book.data.tags
			.map((e: any) => '`' + e + '`')
			.join(', ')}`
		if (rand_color) {
			embed.setColor(
				('#' +
                    Math.floor(Math.random() * 16777215).toString(16)) as ColorResolvable
			)
		}
		embed.setDescription(nuke + tags)
		if (footer) {
			embed.setFooter({ text: footer })
		}

		return embed
	},
}

export default nhentai
