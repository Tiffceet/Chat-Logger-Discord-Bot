/**
 * Handles all command related to anime
 */
const Miscellaneous = require("./Miscellaneous");
const { API } = require("nhentai-api");
const nhentaiAPI = new API();
const Discord = require("discord.js");
var Anime = {
	// =============================================================
	// DEFAULT MODULE MEMBER
	// _module_dependency: store the class instances to be used
	// _init: To initalise this module
	// _init_status: Is this module initialised?
	// _worker: to be executed when a command comes in
	// _import: to load the class instances needed by this module
	// =============================================================
	_module_dependency: {},
	_init: async function () {
		Anime._init_status = true;
	},
	_init_status: false,
	_worker: function (origin, cmd_name, args) {
		if (origin == null) {
			return;
		}
		Anime[cmd_name](origin, args);
	},
	_import: function (dependency) {
		Anime._module_dependency = dependency;
	},
	// =============================================================
	// =============================================================

	// =============================================================
	// Other functions
	// =============================================================
	initcap: function (string) {
		if (typeof string !== "string") return "";
		return string.charAt(0).toUpperCase() + string.slice(1);
	},

	/**
	 * Function that return a discord embed from a given book from nhentai api
	 * @param {API.Book} book book object returned by the nhentai api
	 * @param {number} page_num page to display
	 * @return {Discord.MessageEmbed}
	 */
	nhentai_read_embed: function (book, page_num) {
		let embed = new Discord.MessageEmbed();
		embed.setTitle(book.title.english);
		embed.setImage(nhentaiAPI.getImageURL(book.pages[page_num - 1]));
		embed.setFooter(`Page ${page_num} of ${book.pages.length}`);
		return embed;
	},

	// =============================================================
	// =============================================================

	// =============================================================
	// Command functions
	// =============================================================

	anime: async function (origin, args = []) {
		if (args.length == 0) {
			Miscellaneous.help(origin, ["anime"]);
			return;
		}

		let status = await this._module_dependency.MAL.query_anime(
			args.join(" ")
		);
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
			anime_details.start_season = `${Anime.initcap(
				anime_details.start_season.season
			)} ${anime_details.start_season.year}`;
		} else {
			anime_details.start_season = "?";
		}

		if (anime_details.mean == null) {
			anime_details.mean = "?";
		} else {
			anime_details.mean =
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
				value: anime_details.mean,
				inline: true,
			},
			{
				name: "Genres",
				value: `${
					anime_details.genres.length != 0
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
	},
	nhentai: async function (origin, args = []) {
		if (args.length == 0) {
			return;
		}

		switch (args[0]) {
			case "info":
				if (args.length == 1) {
					Miscellaneous.help(origin, ["nhentai"]);
					break;
				}
				break;
			case "read":
				if (args.length == 1) {
					Miscellaneous.help(origin, ["nhentai"]);
					break;
				}

				if (isNaN(args[1])) {
					origin.channel.send("The nuke code is invalid");
					break;
				}

				let book = {};
				try {
                    book = await nhentaiAPI.getBook(args[1]);
                    nhentaiAPI.search();
					console.log(book);
				} catch (e) {
					origin.channel.send("The nuke code is invalid");
					break;
					// console.log(e);
				}

				let page_num = 1;

				let max_page = book.pages.length + 1;

				let timeout = 5 * 60000;

				let embed = Anime.nhentai_read_embed(book, page_num);

				let msg = await origin.channel.send(embed);
				await msg.react("◀");
				await msg.react("▶");

				const prev = msg.createReactionCollector(
					(reaction, user) => reaction.emoji.name === "◀",
					{
						time: timeout,
					}
				);
				const next = msg.createReactionCollector(
					(reaction, user) => reaction.emoji.name === "▶",
					{
						time: timeout,
					}
				);
				prev.on("collect", (r) => {
					if (page_num <= 1) return;
					embed = Anime.nhentai_read_embed(book, --page_num);
					msg.edit(embed);
				});
				next.on("collect", (r) => {
					if (page_num >= max_page) return;
					embed = Anime.nhentai_read_embed(book, ++page_num);
					msg.edit(embed);
				});
				break;
		}
	},

	// =============================================================
	// =============================================================
};

module.exports = Anime;
