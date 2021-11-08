import Command from '../interface/Command'
import {SlashCommandBuilder} from '@discordjs/builders'
import { ColorResolvable, MessageEmbed } from 'discord.js'
const { API } = require('nhentai-api')
const nhentaiAPI = new API()
const nhentai:Command = {
	data: new SlashCommandBuilder()
		.setName('nhentai')
		.setDescription('Uh oh...')
		.addSubcommand(subcmd=>subcmd
			.setName('search')
			.setDescription('Search on nhentai')
			.addStringOption(opt=>opt
				.setName('keyword')
				.setDescription('Keyword')
				.setRequired(true)))
		.addSubcommand(subcmd=>subcmd
			.setName('info')
			.setDescription('Get information on specific nuke code')
			.addStringOption(opt=>opt
				.setName('nuke_code')
				.setDescription('6 digit, you know it')
				.setRequired(true)))
		.addSubcommand(subcmd=>subcmd
			.setName('read')
			.setDescription('Read it in public...')
			.addStringOption(opt=>opt
				.setName('nuke_code')
				.setDescription('6 digit, you know it')
				.setRequired(true))),
	execute: async (interaction) => {
		const sub_cmd:string = interaction.options.getSubcommand()
		switch(sub_cmd) {
			case 'info': {
				let book = {}
				try {
					book = await nhentaiAPI.getBook(interaction.options.get('nuke_code')?.value)
				} catch (e) {
					interaction.reply('Invalid nuke code')
					break
				}
				interaction.reply({embeds: [nhentai.nhentai_info_embed(book)]})	
				break
			}
			case 'search':
				break
			case 'read':
				break
		}
		return true
	},
	initcap: (string: string): string => {
		return string.charAt(0).toUpperCase() + string.slice(1)
	},

	/**
	 * Function that return a discord embed from a given book from nhentai api
	 * @param {API.Book} book book object returned by the nhentai api
	 * @param {number} page_num page to display
	 * @param {boolean} rand_color (optional) set this to true to set embed to random color
	 * @return {Discord.MessageEmbed}
	 */
	nhentai_read_embed: (book: any, page_num: number, rand_color = false) => {
		const embed = new MessageEmbed()
		embed.setTitle(book.title.english)
		embed.setURL(`https://www.nhentai.net/g/${book.id}`)
		embed.setImage(nhentaiAPI.getImageURL(book.pages[page_num - 1]))
		embed.setFooter(`Page ${page_num} of ${book.pages.length}`)
		if (rand_color) {
			embed.setColor(
				('#' + Math.floor(Math.random() * 16777215).toString(16)) as ColorResolvable
			)
		}
		return embed
	},

	/**
	 * Get nhentai info about the given nuke code
	 * @param {API.Book} book Book objecr from nhentai API
	 * @param {any} footer (optional) footer of the embed
	 * @param {boolean} rand_color (optional) set this to true to set embed to random color
	 * @return {Discord.MessageEmbed}
	 */
	nhentai_info_embed: (
		book: any,
		footer: string | null = null,
		rand_color = false
	) => {
		const embed = new MessageEmbed()
		embed.setTitle(book.title.english)
		embed.setURL(`https://www.nhentai.net/g/${book.id}`)
		embed.setThumbnail(nhentaiAPI.getImageURL(book.cover))

		const nuke = `Nuke code: ${book.id}\n\n`

		const tags = `Tags:\n${book.tags
			.map((e: any) => '`' + e.name + '`')
			.join(', ')}`
		if (rand_color) {
			embed.setColor(
				('#' + Math.floor(Math.random() * 16777215).toString(16)) as ColorResolvable
			)
		}
		embed.setDescription(nuke + tags)
		if (footer) {
			embed.setFooter(footer)
		}

		return embed
	}
}

export default nhentai