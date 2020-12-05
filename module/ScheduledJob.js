var CronJob = require("cron").CronJob;
const fetch = require("node-fetch");
const cheerio = require("cheerio");
var RssParser = require("rss-parser");
const Discord = require("discord.js");
const fs = require("fs");
const path = require("path");

var rss_parser = new RssParser();

var ScheduledJob = {
	// =============================================================
	// DEFAULT MODULE MEMBER
	// _module_dependency: store the class instances to be used
	// _init: To initalise this module
	// _init_status: Is this module initialised?
	// _worker: to be executed when a command comes in
	// _import: to load the class instances needed by this module
	// =============================================================
	_module_dependency: {},
	_init: async function (dc_bot = undefined) {
		if (typeof dc_bot === "undefined") {
			return;
		}

		ScheduledJob.last_notification = await ScheduledJob._module_dependency[
			"PinkFredorFirebase"
		].retrieve_collection("notification");

		ScheduledJob.bot = dc_bot;

		for (let i = 0; i < ScheduledJob.jobs.length; i++) {
			ScheduledJob.jobs[i].start();
		}

		ScheduledJob._init_status = true;
	},
	_init_status: false,
	_worker: function (origin, cmd_name, args) {},
	_import: function (dependency) {
		ScheduledJob._module_dependency = dependency;
	},
	// =============================================================
	// =============================================================

	// =============================================================
	// Local Vars
	// =============================================================

	bot: null,
	last_notification: null,
	channels_notify_able: ["713527791932670003"],
	nico_user_ids: [18874531],

	// =============================================================
	// =============================================================

	// =============================================================
	// Custom Function
	// =============================================================

	jobs: [
		new CronJob(
			"* 0 */1 * * *",
			async function () {
				// console.log("Check for mafumafu niconico update every hour");
				if (!ScheduledJob._init_status) {
					return;
				}
				let HTMLResponse = await fetch(
					`https://www.nicovideo.jp/user/${ScheduledJob.nico_user_ids[0]}/video?rss=2.0&lang=ja-jp`
				);
				let text = await HTMLResponse.text();

				let feed = await rss_parser.parseString(text);

				if (
					feed.items[0].link ==
					ScheduledJob.last_notification.find(
						(e) => e.id == "mafumafu"
					).content.link
				) {
					return;
				}

				let $ = cheerio.load(feed.items[0].content);
				let thumbnail_url = $("img").attr("src");

				// Notify channel
				let channel = ScheduledJob.bot.channels.cache.get(
					ScheduledJob.channels_notify_able[0]
				);
				channel.send(`<Pinkfredor Debug:>`);
				channel.send(
					`<@246239361195048960>, mafumafu had a new upload !`
				);
				channel.send(
					new Discord.MessageEmbed()
						.setTitle(feed.items[0].title)
						.setURL(feed.items[0].link)
						.setImage(thumbnail_url)
						.setDescription(feed.items[0].contentSnippet)
				);

				// Update firebase
				await ScheduledJob._module_dependency[
					"PinkFredorFirebase"
				].update_document("notification", "mafumafu", {
					link: feed.items[0].link,
					date_notified: Date.now(),
				});

				ScheduledJob.last_notification = await ScheduledJob._module_dependency[
					"PinkFredorFirebase"
				].retrieve_collection("notification");
			},
			null,
			true,
			"America/Los_Angeles"
		),
		new CronJob(
			"* 0 */1 * * *",
			// Clean the tmp directory
			async function () {
				// console.log("Attempted file cleaning");
				const directory = "tmp";

				fs.readdir(directory, (err, files) => {
					if (err) throw err;

					for (const file of files) {
						fs.unlink(path.join(directory, file), (err) => {
							console.log(err);
						});
					}
				});
			},
			null,
			true,
			"America/Los_Angeles"
		),
	],

	// =============================================================
	// =============================================================
};

module.exports = ScheduledJob;
