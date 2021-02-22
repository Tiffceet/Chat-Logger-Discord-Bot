import * as Discord from "discord.js";
import { ModuleInterface } from "./ModuleInterface";
import { Miscellaneous } from "./Miscellaneous";
import { MAL } from "../class/MAL";
import { Util } from "../class/Util";
const { API } = require("nhentai-api");
const nhentaiAPI = new API();
export class Anime implements ModuleInterface {
	_init_status: boolean;
	MAL: MAL;
	constructor(MAL_instance: MAL) {
		this.MAL = MAL_instance;
		this._init_status = true;
	}

	_worker(origin: Discord.Message, cmd_name: string, args: string[]) {
		if (origin == null) {
			return;
		}
		(this as any)[cmd_name](origin, args);
	}

	// =============================================================
	// Other functions
	// =============================================================
	initcap(string: string): string {
		return string.charAt(0).toUpperCase() + string.slice(1);
	}

	/**
	 * Function that return a discord embed from a given book from nhentai api
	 * @param {API.Book} book book object returned by the nhentai api
	 * @param {number} page_num page to display
	 * @param {boolean} rand_color (optional) set this to true to set embed to random color
	 * @return {Discord.MessageEmbed}
	 */
	nhentai_read_embed(book: any, page_num: number, rand_color = false) {
		let embed = new Discord.MessageEmbed();
		embed.setTitle(book.title.english);
		embed.setURL(`https://www.nhentai.net/g/${book.id}`);
		embed.setImage(nhentaiAPI.getImageURL(book.pages[page_num - 1]));
		embed.setFooter(`Page ${page_num} of ${book.pages.length}`);
		if (rand_color) {
			embed.setColor(
				"#" + Math.floor(Math.random() * 16777215).toString(16)
			);
		}
		return embed;
	}

	/**
	 * Get nhentai info about the given nuke code
	 * @param {API.Book} book Book objecr from nhentai API
	 * @param {any} footer (optional) footer of the embed
	 * @param {boolean} rand_color (optional) set this to true to set embed to random color
	 * @return {Discord.MessageEmbed}
	 */
	nhentai_info_embed(
		book: any,
		footer: string | null = undefined,
		rand_color = false
	) {
		let embed = new Discord.MessageEmbed();
		embed.setTitle(book.title.english);
		embed.setURL(`https://www.nhentai.net/g/${book.id}`);
		embed.setThumbnail(nhentaiAPI.getImageURL(book.cover));

		let nuke = `Nuke code: ${book.id}\n\n`;

		let tags = `Tags:\n${book.tags
			.map((e: any) => "`" + e.name + "`")
			.join(", ")}`;
		if (rand_color) {
			embed.setColor(
				"#" + Math.floor(Math.random() * 16777215).toString(16)
			);
		}
		embed.setDescription(nuke + tags);
		if (typeof footer !== "undefined") {
			embed.setFooter(footer);
		}

		return embed;
	}

	// =============================================================
	// =============================================================

	// =============================================================
	// Command functions
	// =============================================================

	async anime(origin: Discord.Message, args: Array<string> = []) {
		if (args.length == 0) {
			new Miscellaneous().help(origin, ["anime"]);
			return;
		}

		let status = await this.MAL.query_anime(args.join(" "));
		if (!status.status) {
			origin.channel.send(
				"It looks like I'm not weeb enough to know what is this..."
			);
			return;
		}

		let anime_details = status.anime_details;

		switch (anime_details.status) {
			case "finished_airing":
				anime_details.status = "Finished Airing";
				break;
			case "currently_airing":
				anime_details.status = "Currently Airing";
				break;
			case "not_yet_aired":
				anime_details.status = "Not yet aired";
				break;
		}

		if (
			typeof anime_details.start_season.year !== "undefined" &&
			typeof anime_details.start_season.season !== "undefined"
		) {
			anime_details.start_season = `${this.initcap(
				anime_details.start_season.season
			)} ${anime_details.start_season.year}`;
		} else {
			anime_details.start_season = "?";
		}

		let anime_mean_score_label: string = `${anime_details.mean}`;
		if (anime_details.mean == null) {
			anime_mean_score_label = "?";
		} else {
			anime_mean_score_label =
				anime_details.mean +
				` (scored by ${anime_details.num_list_users} users)`;
		}

		if (anime_details.synopsis == null) {
			anime_details.synopsis = "?";
		}
		if (anime_details.start_date == null) {
			anime_details.start_date = "?";
		}
		if (anime_details.end_date == null) {
			anime_details.end_date = "?";
		}

		if (anime_details.synopsis.length > 1000) {
			anime_details.synopsis =
				anime_details.synopsis.substring(0, 1000) + "...";
		}

		let dme = new Discord.MessageEmbed()
			.setTitle(`${anime_details.title}`)
			.setURL(`https://myanimelist.net/anime/${anime_details.id}`)
			.setColor("#" + ((Math.random() * 0xffffff) << 0).toString(16));

		if (typeof anime_details.main_picture.large !== "undefined") {
			dme.setThumbnail(`${anime_details.main_picture.large}`);
		} else if (typeof anime_details.main_picture.medium !== "undefined") {
			dme.setThumbnail(`${anime_details.main_picture.medium}`);
		}

		let embed_fields = [
			{
				name: "Format",
				value: `${anime_details.media_type} `,
				inline: true,
			},
			{
				name: "Episodes",
				value:
					anime_details.num_episodes == 0
						? "?"
						: anime_details.num_episodes,
				inline: true,
			},
			{
				name: "Status",
				value: anime_details.status,
				inline: true,
			},
			{
				name: "Season",
				value: anime_details.start_season,
				inline: true,
			},
			{
				name: "Score",
				value: anime_mean_score_label,
				inline: true,
			},
			{
				name: "Genres",
				value: `${anime_details.genres.length != 0
					? anime_details.genres.map((e) => e.name).join(", ")
					: "-"
					}`,
				inline: true,
			},
			{
				name: "Synopsis",
				value: anime_details.synopsis,
			},
			{
				name: "Release Date",
				value: `${anime_details.start_date} to ${anime_details.end_date}`,
			},
		];

		dme.addFields(embed_fields);
		origin.channel.send(dme);
	}

	async nhentai(origin: Discord.Message, args: Array<string> = []) {
		if (args.length == 0) {
			new Miscellaneous().help(origin, ["nhentai"]);
			return;
		}

		if (!(<Discord.TextChannel | Discord.NewsChannel>origin.channel).nsfw) {
			origin.reply(
				"Im not so sure if you really want to do that here...\nGo to NSFW channel if you will?"
			);
			return;
		}

		let book: any = {};
		switch (args[0]) {
			case "info":
				if (args.length == 1) {
					new Miscellaneous().help(origin, ["nhentai"]);
					break;
				}
				book = {};
				try {
					book = await nhentaiAPI.getBook(args[1]);
				} catch (e) {
					origin.channel.send("The nuke code is invalid");
					break;
					// console.log(e);
				}

				let embed_send = this.nhentai_info_embed(book);
				origin.channel.send(embed_send);

				break;
			case "read":
				if (args.length == 1) {
					new Miscellaneous().help(origin, ["nhentai"]);
					break;
				}

				if (isNaN(Number(args[1]))) {
					origin.channel.send("The nuke code is invalid");
					break;
				}

				book = {};
				try {
					book = await nhentaiAPI.getBook(args[1]);
					// console.log(book);
				} catch (e) {
					origin.channel.send("The nuke code is invalid");
					break;
					// console.log(e);
				}

				let max_page = book.pages.length;
				let page_num = 1;

				try {
					page_num = parseInt(args[2]);
					if (isNaN(page_num)) {
						throw new Error();
					}
					if (page_num > max_page) {
						page_num = max_page;
					} else if (page_num <= 0) {
						page_num = 1;
					}
				} catch (e) {
					page_num = 1;
				}				

				let book_embeds: Array<Discord.MessageEmbed> = [];

				for (let k = 0; k < max_page; k++) {
					book_embeds.push(this.nhentai_read_embed(book, k + 1, true));
				}

				Util.paginated(origin, book_embeds, max_page, page_num, `Page {n} of {max} | @${origin.author.tag}`, ["⏮️", "⬅️", "➡️", "⏭️"], 300000);
				break;
			case "search":
				if (args.length == 1) {
					new Miscellaneous().help(origin, ["nhentai"]);
					break;
				}

				let query = encodeURIComponent(args.slice(1).join(" "));

				let result = await nhentaiAPI.search(query);

				if (result.books.length == 0) {
					origin.channel.send(
						"I could not understand your ~~fetish~~..."
					);
					break;
				}

				let s_page_num = 0;

				let search_result_embeds: Array<Discord.MessageEmbed> = [];
				for (let k = 0; k < result.books.length; k++) {
					search_result_embeds.push(this.nhentai_info_embed(result.books[k], "", true));
				}

				Util.paginated(origin, search_result_embeds, result.books.length, 1, `Result {n} of {max} | @${origin.author.tag}`, ["⏮️", "⬅️", "➡️", "⏭️"], 300000);

				break;
		}
	}
}
