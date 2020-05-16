const fetch = require("node-fetch");
const fs = require("fs");
const Discord = require("discord.js");
module.exports = class AL_GraphQL_API {
	constructor() {
		this.ANILIST_PROFILE_PATH = "data/anilistProfile.json";
	}

	first_cap(str) {
		if (!str || str.length == 0) return;
		if (str.length == 1) return str.toUpperCase();
		return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
	}

	// this is also profile linking
	link(user_name, message) {
		let query = `
query ($search: String) {
    User (search: $search) {
        id
        name
        siteUrl
    }
}
`;

		let variables = {
			search: `${user_name}`,
		};

		let url = "https://graphql.anilist.co",
			options = {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				body: JSON.stringify({
					query: query,
					variables: variables,
				}),
			};

		fetch(url, options)
			.then((r) => r.json())
			.then((d) => {
				// this.user_activity_query(d.data.User.id, message);
				let profiles = fs.existsSync(this.ANILIST_PROFILE_PATH)
					? JSON.parse(fs.readFileSync(this.ANILIST_PROFILE_PATH))
					: { data: [] };
				let prof = undefined;
				if (
					(prof = profiles.data.find(
						(e) => e.discord_id == message.author.id
					))
				) {
					message.channel.send(
						new Discord.MessageEmbed().setDescription(
							`Sorry, but you already linked to [${prof.AL_NAME}](${prof.siteUrl})`
						)
					);
					return;
				}

				if (!d.data.User.id) {
					message.channel.send(
						`There are no such user named ${user_name}`
					);
					return;
				}

				profiles.data.push({
					discord_id: message.author.id,
					AL_ID: d.data.User.id,
					AL_NAME: d.data.User.name,
					siteUrl: d.data.User.siteUrl,
				});
				fs.writeFileSync(
					this.ANILIST_PROFILE_PATH,
					JSON.stringify(profiles),
					(err) => {
						console.log(err);
					}
				);
				message.channel.send(
					new Discord.MessageEmbed()
						.setTitle("Anilist profile linking")
						.setDescription(
							`You have been linked to [${d.data.User.name}](${d.data.User.siteUrl})`
						)
				);
			})
			.catch((err) => console.log(err));
	}

	unlink(discord_id) {
		let profiles = fs.existsSync(this.ANILIST_PROFILE_PATH)
			? JSON.parse(fs.readFileSync(this.ANILIST_PROFILE_PATH))
			: {
					data: [],
			  };
		let prof = undefined;
		if (!(prof = profiles.data.find((e) => e.discord_id == discord_id))) {
			return false; // return false if there are no previous link
		}
		let new_profiles = { data: [] };
		for (let x = 0; x < profiles.data.length; x++) {
			if (profiles.data[x].discord_id == discord_id) {
				continue;
			}
			new_profiles.data.push(profiles.data[x]);
		}
		fs.writeFileSync(
			this.ANILIST_PROFILE_PATH,
			JSON.stringify(new_profiles),
			(err) => {
				console.log(err);
			}
		);
		return true;
	}

	find_linked_anilist_profile(discord_id) {
		if (!fs.existsSync(this.ANILIST_PROFILE_PATH)) return;
		return JSON.parse(fs.readFileSync(this.ANILIST_PROFILE_PATH)).data.find(
			(e) => e.discord_id == discord_id
		);
	}

	// anime_name for querying
	// message passed from discord bot
	anime_query(anime_name, message, isHentai, isManga) {
		var query = `
query ($page: Int, $perPage: Int, $search: String, $media_type: MediaType, $desc_in_html: Boolean, $genre_fil: [String]) {
    Page (page: $page, perPage: $perPage) {
        media (search: $search, type: $media_type, ${
			isHentai ? "genre_in: $genre_fil" : "genre_not_in: $genre_fil"
		}) {
            title {
                romaji
            }
            tags {
                name
                rank
                isGeneralSpoiler
                isMediaSpoiler
            }
            format
            status
            description(asHtml: $desc_in_html)
            startDate {
                year
                month
                day
            }
            endDate {
                year
                month
                day
            }
            season
            seasonYear
            episodes
            chapters
            duration
            averageScore
            genres
            siteUrl
            coverImage {
                extraLarge
            }
            externalLinks {
                site
                url
            }
        }
    }
}
`;

		var variables = {
			search: `${anime_name}`,
			page: 1, // first page
			perPage: 9, // further pagination is future? idk
			media_type: isManga ? "MANGA" : "ANIME",
			desc_in_html: false, // this is dumb
			genre_fil: "Hentai",
		};

		var url = "https://graphql.anilist.co",
			options = {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				body: JSON.stringify({
					query: query,
					variables: variables,
				}),
			};

		fetch(url, options)
			.then((r) => r.json())
			.then((d) => {
				// // log into a file for viewing
				// // should be removed after this is done
				// fs.writeFileSync("data.json", JSON.stringify(d), (err) => {
				// 	console.log(err);
				// });

				// If anime is not found
				if (d.data.Page.media.length == 0) {
					message.channel.send(
						`${anime_name} can't be found on AniList.`
					);
					return; // Note that this only stop this annoymous function, it doesnt stop anime_query()
				}

				// get first item found only
				// I might consider doing something like
				// if the first one is missing some info, then we try to use the next one, idk
				// Will do that in future
				let embd = this.prepare_anime_embed(
					d.data.Page.media[0],
					isManga
				);
				message.channel.send(embd);
			})
			.catch((err) => console.log(err));
	}

	user_activity_query(user_id, message) {
		let query = `
query ($userid: Int, $page: Int, $perPage: Int, $sort_direction: [ActivitySort]) {
    User (id: $userid) {
        name
        siteUrl
    }
    Page (page: $page, perPage: $perPage) {
        activities (userId: $userid, sort: $sort_direction) {
            __typename
            ... on ListActivity {
                createdAt
                status
                progress
                type
                media {
                    siteUrl
                    title {
                        romaji
                    }
                    episodes
                    chapters
                    volumes
                }
            }
        }
    }
}
`;

		let variables = {
			userid: `${user_id}`,
			page: 1,
			perPage: 10,
			sort_direction: "ID_DESC",
		};

		let url = "https://graphql.anilist.co",
			options = {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				body: JSON.stringify({
					query: query,
					variables: variables,
				}),
			};

		fetch(url, options)
			.then((r) => r.json())
			.then((d) => {
				// fs.writeFileSync("data.json", JSON.stringify(d), (err) => {
				// 	console.log(err);
				// });
				let embd = this.prepare_activities_embed(
					d.data.User.name,
					d.data.User.siteUrl,
					d.data.Page.activities
				);
				message.channel.send(embd);
			})
			.catch((err) => console.log(err));
	}

	activity_classification(data) {
		if (data.type == "ANIME_LIST") {
			switch (data.status) {
				case "watched episode":
				case "rewatched episode":
					return (
						this.first_cap(data.status) +
						" - " +
						data.progress +
						" of " +
						data.media.episodes
					);
				case "plans to watch":
				case "paused watching":
				case "dropped":
					return this.first_cap(data.status);
				case "completed":
					return (
						"Completed - " +
						data.media.episodes +
						" of " +
						data.media.episodes
					);
				default:
					return "Unknown Status";
			}
		} else if (data.type == "MANGA_LIST") {
			switch (data.status) {
				case "read chapter":
				case "reread chapter":
					return (
						this.first_cap(data.status) +
						" - " +
						data.progress +
						" of " +
						data.media.chapters
					);
				case "plans to read":
				case "paused reading":
				case "dropped":
					return this.first_cap(data.status);
				case "completed":
					return (
						"Completed - " +
						data.media.chapters +
						" of " +
						data.media.chapters
					);
				default:
					return "Unknown Status";
			}
		}
	}

	// prepare embed for user recent activities
	prepare_activities_embed(user_name, user_site_url, data) {
		let desc = "";

		// for each recent activities received
		for (let i = 0; i < data.length; i++) {
			if (data[i].__typename != "ListActivity") {
				continue;
			}
			if (
				data[i].type == null ||
				(data[i].type != "MANGA_LIST" && data[i].type != "ANIME_LIST")
			) {
				continue;
			}
			if (data[i].media.episodes == null) {
				data[i].media.episodes = "?";
			}
			if (data[i].media.chapters == null) {
				data[i].media.chapters = "?";
			}

			// print title
			desc += `[${data[i].media.title.romaji}](${
				data[i].media.siteUrl
			}) [\`${new Date(data[i].createdAt * 1000)
				.toString()
				.split(" ")
				.slice(0, 4)
				.join(" ")}\`]\n`;

			if (data[i].progress != null) {
				if (data[i].progress.indexOf("-") > -1) {
					data[i].progress = data[i].progress.slice(
						data[i].progress.indexOf("-") + 2
					);
				}
			} else {
				data[i].progress = "?";
			}
			desc += this.activity_classification(data[i]) + "\n\n";
		}
		return new Discord.MessageEmbed()
			.setTitle(`${user_name}'s AniList history`)
			.setURL(`${user_site_url}`)
			.setColor("#" + ((Math.random() * 0xffffff) << 0).toString(16))
			.setDescription(desc);
	}

	// Prepare embed for anime query
	// message object passed from discord bot
	// data is a MediaType js object <-- refer to AniList GraphQL Reference Doc
	prepare_anime_embed(data, isManga) {
		data.description = data.description.replace(/<br>/g, "\n");
		if (data.chapters == null) {
			data.chapters = "?";
		}
		if (data.episodes == null) {
			data.episodes = "?";
		}
		return new Discord.MessageEmbed()
			.setTitle(`${data.title.romaji}`)
			.setURL(`${data.siteUrl}`)
			.setThumbnail(`${data.coverImage.extraLarge}`)
			.setColor("#" + ((Math.random() * 0xffffff) << 0).toString(16))
			.addFields(
				{
					name: "Format",
					value: `${data.format} `,
					inline: true,
				},
				{
					name: isManga ? "Chapters" : "Episodes",
					value: isManga
						? `${data.chapters}`
						: `${data.episodes} (${data.duration} min / ep)`,
					inline: true,
				},
				{
					name: "Status",
					value: `${
						data.status.charAt(0).toUpperCase() +
						data.status.slice(1).toLowerCase()
					} `,
					inline: true,
				},
				{
					name: "Season",
					value: isManga
						? "?"
						: `${
								data.season.charAt(0).toUpperCase() +
								data.season.slice(1).toLowerCase()
						  } ${data.seasonYear}`,
					inline: true,
				},
				{
					name: "Average Score",
					value: `${data.averageScore}%`,
					inline: true,
				},
				{
					name: "Genres",
					value: `${
						data.genres.length != 0 ? data.genres.join(", ") : "-"
					}`,
					inline: true,
				},
				{
					name: "Description",
					value: `${
						data.description.length != 0
							? data.description.length > 1000
								? data.description.substring(0, 1000) + "..."
								: data.description
							: "-"
					}`,
				},
				{
					name: "Tags",
					value: `${
						data.tags.length == 0
							? "-"
							: data.tags
									.filter((e) => {
										// remove spoiler tags
										return (
											!e.isGeneralSpoiler &&
											!e.isMediaSpoiler
										);
									})
									.map((e) => e.name + " - " + e.rank + "%")
									.join("\n")
					}`,
				},
				{
					name: "Release Date",
					value:
						`${data.startDate.year}-${data.startDate.month}-${data.startDate.day} to ` +
						(data.endDate.year == null
							? `?`
							: `${data.endDate.year}-${data.endDate.month}-${data.endDate.day}`),
				},
				{
					name: "Links",
					value: `${
						data.externalLinks.length != 0
							? data.externalLinks
									.map((e) => `[${e.site}](${e.url})`)
									.join(" - ")
							: "-"
					}`,
				}
			);
	}
};
