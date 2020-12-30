"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Anime = void 0;
const Discord = require("discord.js");
const Miscellaneous_1 = require("./Miscellaneous");
const { API } = require("nhentai-api");
const nhentaiAPI = new API();
class Anime {
    constructor(MAL_instance) {
        this.MAL = MAL_instance;
        this._init_status = true;
    }
    _worker(origin, cmd_name, args) {
        if (origin == null) {
            return;
        }
        this[cmd_name](origin, args);
    }
    initcap(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    async nhentai_read_embed(book, page_num, rand_color = false) {
        let embed = new Discord.MessageEmbed();
        embed.setTitle(book.title.english);
        embed.setURL(`https://www.nhentai.net/g/${book.id}`);
        embed.setImage(nhentaiAPI.getImageURL(book.pages[page_num - 1]));
        embed.setFooter(`Page ${page_num} of ${book.pages.length}`);
        if (rand_color) {
            embed.setColor("#" + Math.floor(Math.random() * 16777215).toString(16));
        }
        return embed;
    }
    nhentai_info_embed(book, footer = undefined, rand_color = false) {
        let embed = new Discord.MessageEmbed();
        embed.setTitle(book.title.english);
        embed.setURL(`https://www.nhentai.net/g/${book.id}`);
        embed.setThumbnail(nhentaiAPI.getImageURL(book.cover));
        let nuke = `Nuke code: ${book.id}\n\n`;
        let tags = `Tags:\n${book.tags
            .map((e) => "`" + e.name + "`")
            .join(", ")}`;
        if (rand_color) {
            embed.setColor("#" + Math.floor(Math.random() * 16777215).toString(16));
        }
        embed.setDescription(nuke + tags);
        if (typeof footer !== "undefined") {
            embed.setFooter(footer);
        }
        return embed;
    }
    async anime(origin, args = []) {
        if (args.length == 0) {
            new Miscellaneous_1.Miscellaneous().help(origin, ["anime"]);
            return;
        }
        let status = await this.MAL.query_anime(args.join(" "));
        if (!status.status) {
            origin.channel.send("It looks like I'm not weeb enough to know what is this...");
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
        if (typeof anime_details.start_season.year !== "undefined" &&
            typeof anime_details.start_season.season !== "undefined") {
            anime_details.start_season = `${this.initcap(anime_details.start_season.season)} ${anime_details.start_season.year}`;
        }
        else {
            anime_details.start_season = "?";
        }
        let anime_mean_score_label = `${anime_details.mean}`;
        if (anime_details.mean == null) {
            anime_mean_score_label = "?";
        }
        else {
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
        }
        else if (typeof anime_details.main_picture.medium !== "undefined") {
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
                value: anime_details.num_episodes == 0
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
                    : "-"}`,
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
    async nhentai(origin, args = []) {
        if (args.length == 0) {
            new Miscellaneous_1.Miscellaneous().help(origin, ["nhentai"]);
            return;
        }
        if (!origin.channel.nsfw) {
            origin.reply("Im not so sure if you really want to do that here...\nGo to NSFW channel if you will?");
            return;
        }
        let book = {};
        switch (args[0]) {
            case "info":
                if (args.length == 1) {
                    new Miscellaneous_1.Miscellaneous().help(origin, ["nhentai"]);
                    break;
                }
                book = {};
                try {
                    book = await nhentaiAPI.getBook(args[1]);
                }
                catch (e) {
                    origin.channel.send("The nuke code is invalid");
                    break;
                }
                let embed_send = this.nhentai_info_embed(book);
                origin.channel.send(embed_send);
                break;
            case "read":
                if (args.length == 1) {
                    new Miscellaneous_1.Miscellaneous().help(origin, ["nhentai"]);
                    break;
                }
                if (isNaN(Number(args[1]))) {
                    origin.channel.send("The nuke code is invalid");
                    break;
                }
                book = {};
                try {
                    book = await nhentaiAPI.getBook(args[1]);
                }
                catch (e) {
                    origin.channel.send("The nuke code is invalid");
                    break;
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
                    }
                    else if (page_num <= 0) {
                        page_num = 1;
                    }
                }
                catch (e) {
                    page_num = 1;
                }
                let timeout = 60000;
                let embed = await this.nhentai_read_embed(book, page_num, true);
                let msg = await origin.channel.send(embed);
                await msg.react("◀");
                await msg.react("▶");
                const prev = msg.createReactionCollector((reaction, user) => reaction.emoji.name === "◀", {
                    time: timeout,
                    dispose: true,
                });
                const next = msg.createReactionCollector((reaction, user) => reaction.emoji.name === "▶", {
                    time: timeout,
                    dispose: true,
                });
                prev.on("collect", async (r, u) => {
                    if (page_num <= 1) {
                        prev.resetTimer();
                        next.resetTimer();
                        r.users.remove(u.id);
                    }
                    embed = await this.nhentai_read_embed(book, --page_num, true);
                    msg.edit(embed);
                    prev.resetTimer();
                    next.resetTimer();
                    r.users.remove(u.id);
                });
                next.on("collect", async (r, u) => {
                    if (page_num >= max_page) {
                        next.resetTimer();
                        prev.resetTimer();
                        r.users.remove(u.id);
                        return;
                    }
                    embed = await this.nhentai_read_embed(book, ++page_num, true);
                    msg.edit(embed);
                    next.resetTimer();
                    prev.resetTimer();
                    r.users.remove(u.id);
                });
                break;
            case "search":
                if (args.length == 1) {
                    new Miscellaneous_1.Miscellaneous().help(origin, ["nhentai"]);
                    break;
                }
                let query = encodeURIComponent(args.slice(1).join(" "));
                let result = await nhentaiAPI.search(query);
                if (result.books.length == 0) {
                    origin.channel.send("I could not understand your ~~fetish~~...");
                    break;
                }
                let s_page_num = 0;
                let search_result_embed = await this.nhentai_info_embed(result.books[s_page_num], `Result ${s_page_num + 1} of ${result.books.length}`, true);
                let s_msg = await origin.channel.send(search_result_embed);
                let s_timeout = 60000;
                await s_msg.react("◀");
                await s_msg.react("▶");
                const s_prev = s_msg.createReactionCollector((reaction, user) => reaction.emoji.name === "◀", {
                    time: s_timeout,
                    dispose: true,
                });
                const s_next = s_msg.createReactionCollector((reaction, user) => reaction.emoji.name === "▶", {
                    time: s_timeout,
                    dispose: true,
                });
                s_prev.on("collect", async (r, u) => {
                    if (s_page_num <= 0) {
                        s_prev.resetTimer();
                        s_next.resetTimer();
                        r.users.remove(u.id);
                        return;
                    }
                    search_result_embed = await this.nhentai_info_embed(result.books[--s_page_num], `Result ${s_page_num + 1} of ${result.books.length}`, true);
                    s_msg.edit(search_result_embed);
                    s_prev.resetTimer();
                    s_next.resetTimer();
                    r.users.remove(u.id);
                });
                s_next.on("collect", async (r, u) => {
                    if (s_page_num >= result.books.length - 1) {
                        s_next.resetTimer();
                        s_prev.resetTimer();
                        r.users.remove(u.id);
                        return;
                    }
                    search_result_embed = await this.nhentai_info_embed(result.books[++s_page_num], `Result ${s_page_num + 1} of ${result.books.length}`, true);
                    s_msg.edit(search_result_embed);
                    s_next.resetTimer();
                    s_prev.resetTimer();
                    r.users.remove(u.id);
                });
                break;
        }
    }
}
exports.Anime = Anime;
//# sourceMappingURL=Anime.js.map