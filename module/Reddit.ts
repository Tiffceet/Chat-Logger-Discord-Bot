import * as Discord from "discord.js";
import { ModuleInterface } from "./ModuleInterface";
import { RedditEmbedSettings } from "../interface/module/Reddit/RedditEmbedSettings";
const fetch = require("node-fetch");
export class Reddit implements ModuleInterface {
	constructor() {
		this._init_status = true;
	}
	_init_status: boolean = false;
	_worker(origin: Discord.Message, cmd_name: string, args: string[]) {
		if (origin == null) {
			return;
		}
		let reddit_name = this.command_reddit[cmd_name];
		if (typeof reddit_name === "undefined") {
			return;
		}
		this.send_reddit_post(origin, reddit_name);
	}

	command_reddit: Record<string, RedditEmbedSettings> = {
		tellajoke: { reddit_name: "ShortCleanFunny", include_image: false },
		scareme: { reddit_name: "TwoSentenceHorror", include_image: false },
		cursedfood: { reddit_name: "cursedfoods", include_image: true },
		food: { reddit_name: "Food", include_image: true }
	}

	// =============================================================
	// Other Functions
	// =============================================================
	/**
	 *  Send a random reddit post from a reddit page !
	 * @param {Discord.Message} origin origin of the command sender
	 * @param {RedditEmbedSettings} settings 
	 */
	async send_reddit_post(
		origin: Discord.Message,
		settings: RedditEmbedSettings
	) {
		let url = `https://www.reddit.com/r/${settings.reddit_name}/.json?sort=hot&t=week&limit=300`;
		let HTMLResponse = await fetch(url);
		let json_response = await HTMLResponse.json();

		try {
			let len = Math.floor(
				Math.random() * (json_response.data.children.length - 1)
			);

			let reddit_post = new Discord.MessageEmbed()
				.setTitle(json_response.data.children[len].data.title)
				.setDescription(json_response.data.children[len].data.selftext)
				.setColor("#" + ((Math.random() * 0xffffff) << 0).toString(16));

			if (settings.include_image) {
				reddit_post.setImage(json_response.data.children[len].data.url);
			}

			origin.channel.send(reddit_post);
		} catch (err) {
			console.log(err);
			origin.channel.send(
				`Error getting post from r/${settings.reddit_name}, contact Looz !`
			);
		}
	}
	// =============================================================
	// =============================================================
}