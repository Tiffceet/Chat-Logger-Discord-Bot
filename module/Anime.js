/**
 * Handles all command related to anime
 */
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

	// =============================================================
	// =============================================================

	// =============================================================
	// Command functions
	// =============================================================

	anime: async function (origin, args = []) {
		// console.log(args.join(' '));
		let status = await this._module_dependency.MAL.query_anime(args.join(' '));
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
        
        if(anime_details.synopsis == null) {
            anime_details.synopsis = "?";
        }
        if(anime_details.start_date == null) {
            anime_details.start_date = "?";
        }
        if(anime_details.end_date == null) {
            anime_details.end_date = "?";
        }

        if(anime_details.synopsis.length > 1000) {
            anime_details.synopsis = anime_details.synopsis.substring(0, 1000) + "...";
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
				value: `${anime_details.start_date} to ${anime_details.end_date}`
			},
		];

		dme.addFields(embed_fields);
		origin.channel.send(dme);
	},

	// =============================================================
	// =============================================================
};

module.exports = Anime;
