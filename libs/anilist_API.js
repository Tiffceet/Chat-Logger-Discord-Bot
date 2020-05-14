const fetch = require("node-fetch");
const fs = require("fs");
const Discord = require("discord.js");
module.exports = class AL_GraphQL_API {
	constructor() {}

	// anime_name for querying
	// message passed from discord bot
	anime_query(anime_name, message) {
		var query = `
query ($page: Int, $perPage: Int, $search: String, $media_type: MediaType, $desc_in_html: Boolean) {
    Page (page: $page, perPage: $perPage) {
        media (search: $search, type: $media_type) {
            title {
                romaji
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
			media_type: "ANIME", // this ensure it only query for anime
			desc_in_html: false, // this is dumb
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
				// log into a file for viewing
				// should be removed after this is done
				fs.writeFileSync("data.json", JSON.stringify(d), (err) => {
					console.log(err);
				});

				// If anime is not found
				if (d.data.Page.media.length == 0) {
					console.log("Anime not found");
					message.channel.send(
						`${anime_name} can't be found on AniList.`
					);
					return; // Note that this only stop this annoymous function, it doesnt stop anime_query()
				}
				// Lets assume anime is found and there are no shit first
				console.log("Success");

				// get first item found only
				// I might consider doing something like
				// if the first one is missing some info, then we try to use the next one, idk
				// Will do that in future
				let embd = this.prepare_embed(message, d.data.Page.media[0]);
				message.channel.send(embd);
			})
			.catch((err) => console.log(err));
	}

	// message object passed from discord bot
	// data is a js object
	prepare_embed(message, data) {
		data.description = data.description.replace(/<br>/g, "\n");
		return new Discord.MessageEmbed()
			.setTitle(`${data.title.romaji}`)
			.setURL(`${data.siteUrl}`)
			.setThumbnail(`${data.coverImage.extraLarge}`)
			.setColor("#" + ((Math.random() * 0xffffff) << 0).toString(16))
			.addFields(
				{
					name: "Format",
					value: `${data.format}`,
					inline: true,
				},
				{
					name: "Episodes",
					value: `${data.episodes} (${data.duration} min / ep)`,
					inline: true,
				},
				{
					name: "Status",
					value: `${
						data.status.charAt(0).toUpperCase() +
						data.status.slice(1).toLowerCase()
					}`,
					inline: true,
				},
				{
					name: "Season",
					value: `${
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
					value: `${data.genres.join(", ")}`,
					inline: true,
				},
				{
					name: "Description",
					value: `${
						data.description.length > 1000
							? data.description.substring(0, 1000) + "..."
							: data.description
					}`,
				},
				{
					name: "Release Date",
					value: `${data.startDate.year}-${data.startDate.month}-${data.startDate.day} to `,
				},
				{
					name: "Links",
					value: `${data.externalLinks
						.map((e) => `[${e.site}](${e.url})`)
						.join(" - ")}`,
				}
			);
	}
};
