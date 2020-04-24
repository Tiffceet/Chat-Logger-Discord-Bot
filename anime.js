const fetch = require("node-fetch");
const cheerio = require("cheerio");
const Discord = require("discord.js");
module.exports = class anilist {
	constructor() {}

	// return object
	anime_query(anime_name) {
		var query = `
query ($id: Int, $page: Int, $perPage: Int, $search: String) {
  Page (page: $page, perPage: $perPage) {
    pageInfo {
      total
      currentPage
      lastPage
      hasNextPage
      perPage
    }
    media (id: $id, search: $search) {
      id
      title {
        romaji
      }
    }
  }
}
`;

		var variables = {
			search: `${anime_name}`,
			page: 1,
			perPage: 9,
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
			.then((d) => (this.final_query = d))
			.catch((err) => console.log(err));
	}

	fetch_anime_info(anime_id) {
        let url = `https://anilist.co/anime/${anime_id}`;
        // console.log(url);
		fetch(url)
			.then((r) => r.text())
			.then((body) => {
				try {
					let $ = cheerio.load(body);

					// Get external links
					// only get links if there are any
					let raw_links = [];
					let real_links = [];
					if ($("div.external-links")[0]) {
						raw_links = $("div.external-links")[0].children;
						for (let i = 0; i < raw_links.length; i++) {
							if (raw_links[i].name == "a") {
								real_links.push(
									"[" +
										raw_links[i].children[0].data.trim() +
										"](" +
										raw_links[i].attribs.href +
										")"
								);
							}
						}
					}

                    // Get anime status ans season from side bar
                    // Temp Note: side bar might always exist, so if the sidebar doesnt exist, it might mean the url doesnt exist
					let raw_sidebar_data = $(".data")[0].children;
					let anime_season = "-";
					let anime_status = "-";
					for (let i = 0; i < raw_sidebar_data.length; i++) {
						if (
							raw_sidebar_data[i].attribs &&
							raw_sidebar_data[i].attribs.class == "data-set"
						) {
							if (
								raw_sidebar_data[i].children[0].children[0]
									.data == "Season"
							) {
								anime_season = raw_sidebar_data[
									i
								].children[2].children[0].data.trim();
								continue;
							}
							if (
								raw_sidebar_data[i].children[0].children[0]
									.data == "Status"
							) {
								anime_status = raw_sidebar_data[
									i
								].children[2].children[0].data.trim();
								continue;
							}
						}
					}

					let page_json = $('script[type="application/ld+json"]')[0]
						.children[0].data;
					// console.log(page_json);
					let raw_data = JSON.parse(page_json);
					// console.log(raw_data);
					let anime_title = raw_data.mainEntity.name;
					let anime_format = raw_data.mainEntity["@type"];
					let anime_episodes =
						raw_data.mainEntity.numberOfEpisodes +
						" ( " +
						raw_data.mainEntity.timeRequired.substring(
							2,
							raw_data.mainEntity.timeRequired.length
						) +
						" per episode )";
					// let anime_status = raw_data.mainEntity.
					let anime_image_url = raw_data.mainEntity.image;
					let anime_desc = raw_data.mainEntity.description;
					let anime_dates =
						raw_data.mainEntity.startDate +
						" to " +
						raw_data.mainEntity.endDate;
					let anime_rating =
						raw_data.mainEntity.aggregateRating.ratingValue +
						" / 100";
					let anime_genres = raw_data.mainEntity.genre.join(", ");
					this.anime_embed = new Discord.MessageEmbed()
						.setTitle(anime_title)
						.setURL(url)
						.setColor("#da522e")
						.setThumbnail(anime_image_url)
						.addFields(
							{
								name: "Format",
								value: `${anime_format}`,
								inline: true,
							},
							{
								name: "Episodes",
								value: `${anime_episodes}`,
								inline: true,
							},
							{
								name: "Status",
								value: `${anime_status}`,
								inline: true,
							},
							{
								name: "Season",
								value: `${anime_season}`,
								inline: true,
							},
							{
								name: "Average Score",
								value: `${anime_rating}`,
								inline: true,
							},
							{
								name: "Genres",
								value: `${anime_genres}`,
								inline: true,
							},
							{
								name: "Description",
								value: `${
									anime_desc.length > 1000
										? anime_desc.substring(0, 1019) + "..."
										: anime_desc
								}`,
							},
							{
								name: "Release Date",
								value: `${anime_dates}`,
							},
							{
								name: "Links",
								value: `${
									real_links.length != 0
										? real_links.join(" - ")
										: "-"
								}`,
							}
						);
				} catch (err) {
					console.log(err);
				}
			});
	}
};
