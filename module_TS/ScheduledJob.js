"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduledJob = void 0;
const Discord = require("discord.js");
var CronJob = require('cron').CronJob;
const fetch = require("node-fetch");
const cheerio = require("cheerio");
var RssParser = require("rss-parser");
var rss_parser = new RssParser();
class ScheduledJob {
    constructor(firestore_instance, dc_bot) {
        this._init_status = false;
        this.channels_notify_able = ["713527791932670003"];
        this.nico_user_ids = [18874531];
        this.jobs = [
            new CronJob("* 0 */1 * * *", async function () {
                if (!this._init_status) {
                    return;
                }
                let HTMLResponse = await fetch(`https://www.nicovideo.jp/user/${this.nico_user_ids[0]}/video?rss=2.0&lang=ja-jp`);
                let text = await HTMLResponse.text();
                let feed = await rss_parser.parseString(text);
                if (feed.items[0].link ==
                    this.last_notification.find((e) => e.id == "mafumafu").content.link) {
                    return;
                }
                let $ = cheerio.load(feed.items[0].content);
                let thumbnail_url = $("img").attr("src");
                let channel = this.bot.channels.cache.get(this.channels_notify_able[0]);
                channel.send(`<Pinkfredor Debug:>`);
                channel.send(`<@246239361195048960>, mafumafu had a new upload !`);
                channel.send(new Discord.MessageEmbed()
                    .setTitle(feed.items[0].title)
                    .setURL(feed.items[0].link)
                    .setImage(thumbnail_url)
                    .setDescription(feed.items[0].contentSnippet));
                await this.firestore_instance.update_document("notification", "mafumafu", {
                    link: feed.items[0].link,
                    date_notified: Date.now(),
                });
                this.last_notification = await this.firestore_instance.retrieve_collection("notification");
            }, null, true, "America/Los_Angeles"),
        ];
        this.firestore_instance = firestore_instance;
        this._init_status = true;
        this.last_notification = firestore_instance.retrieve_collection("notification");
        this.bot = dc_bot;
        for (let i = 0; i < this.jobs.length; i++) {
            this.jobs[i].start();
        }
        this._init_status = true;
    }
    _worker(origin, cmd_name, args) {
    }
}
exports.ScheduledJob = ScheduledJob;
//# sourceMappingURL=ScheduledJob.js.map