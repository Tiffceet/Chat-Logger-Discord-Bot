"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Reddit = void 0;
const Discord = require("discord.js");
const fetch = require("node-fetch");
class Reddit {
    constructor() {
        this._init_status = false;
        this.command_reddit = {
            tellajoke: "ShortCleanFunny",
            scareme: "TwoSentenceHorror",
            cursedfood: "cursedfoods",
            food: "Food",
        };
        this._init_status = true;
    }
    _worker(origin, cmd_name, args) {
        if (origin == null) {
            return;
        }
        let reddit_name = this.command_reddit[cmd_name];
        if (typeof reddit_name === "undefined") {
            return;
        }
        this.send_reddit_post(origin, reddit_name);
    }
    async send_reddit_post(origin, reddit_name, include_image = false) {
        let url = `https://www.reddit.com/r/${reddit_name}/.json?sort=hot&t=week&limit=300`;
        let HTMLResponse = await fetch(url);
        let json_response = await HTMLResponse.json();
        try {
            let len = Math.floor(Math.random() * (json_response.data.children.length - 1));
            let reddit_post = new Discord.MessageEmbed()
                .setTitle(json_response.data.children[len].data.title)
                .setDescription(json_response.data.children[len].data.selftext)
                .setColor("#" + ((Math.random() * 0xffffff) << 0).toString(16));
            if (include_image) {
                reddit_post.setImage(json_response.data.children[len].data.url);
            }
            origin.channel.send(reddit_post);
        }
        catch (err) {
            console.log(err);
            origin.channel.send(`Error getting post from r/${reddit_name}, contact Looz !`);
        }
    }
}
exports.Reddit = Reddit;
//# sourceMappingURL=Reddit.js.map