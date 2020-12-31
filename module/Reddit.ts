import * as Discord from "discord.js";
import { ModuleInterface } from "./ModuleInterface";
const fetch = require("node-fetch");
export class Reddit implements ModuleInterface {
    constructor() {
        this._init_status = true;
    }
    _init_status: boolean = false;
    _worker (origin: Discord.Message, cmd_name: string, args: string[]) {
        if (origin == null) {
			return;
		}
		let reddit_name = this.command_reddit[cmd_name];
		if (typeof reddit_name === "undefined") {
			return;
		}
		this.send_reddit_post(origin, reddit_name);
    }

    command_reddit: Record<string, string> = {
		tellajoke: "ShortCleanFunny",
		scareme: "TwoSentenceHorror",
		cursedfood: "cursedfoods",
		food: "Food",
	}

	// =============================================================
	// Other Functions
	// =============================================================
	/**
	 *  Send a random reddit post from a reddit page !
	 * @param {Discord.Message} origin origin of the command sender
	 * @param {string} reddit_name reddit to fetch post from
	 * @param {boolean} include_image (optional) will send image if true
	 */
	async send_reddit_post (
		origin:Discord.Message,
		reddit_name:string,
		include_image = false
	) {
		let url = `https://www.reddit.com/r/${reddit_name}/.json?sort=hot&t=week&limit=300`;
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
            
            if(include_image) {
                reddit_post.setImage(json_response.data.children[len].data.url);
            }

			origin.channel.send(reddit_post);
		} catch (err) {
			console.log(err);
			origin.channel.send(
				`Error getting post from r/${reddit_name}, contact Looz !`
			);
		}
	}
	// =============================================================
	// =============================================================
}