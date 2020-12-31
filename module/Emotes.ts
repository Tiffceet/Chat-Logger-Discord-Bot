import * as Discord from "discord.js";
import { ModuleInterface } from "./ModuleInterface";

export class Emotes implements ModuleInterface{
    constructor() {
        this._init_status = true;
    }
    _init_status: boolean = false;
    _worker(origin: Discord.Message, cmd_name: string, args: string[]) {
        let image_url = this.command_imageurl[cmd_name];
		if (typeof image_url === "undefined") {
			return;
		}

		this.send_image(origin, image_url);
    };
    
    command_imageurl:Record<string, string> = {
		smh: "https://media1.giphy.com/media/WrP4rFrWxu4IE/source.gif",
		doubt: "https://i.kym-cdn.com/entries/icons/facebook/000/023/021/e02e5ffb5f980cd8262cf7f0ae00a4a9_press-x-to-doubt-memes-memesuper-la-noire-doubt-meme_419-238.jpg",
		rekt: "https://media.giphy.com/media/vSR0fhtT5A9by/giphy.gif",
		confuse: "https://media.giphy.com/media/1X7lCRp8iE0yrdZvwd/giphy.gif",
	}

	// =============================================================
	// =============================================================

	// =============================================================
	// Other function
	// =============================================================

	/**
	 * Send an image to the origin
	 * @param {Discord.Message} origin Origin of the command
	 * @param {string} url image url
	 */
    async send_image (origin:Discord.Message, url:string) {
		try {
			origin.channel.send("", {
				files: [url],
			});
		} catch (e) {
			console.log(e);
		}
	}
}