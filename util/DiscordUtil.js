/**
 * Class to provide utility function for discord bot
 */
const Discord = require("discord.js");
module.exports = class DiscordUtil {
	/**
	 * Wait for user to response
	 * @param {Discord.Message} origin message origin
	 * @param {string} authorid who to wait for (expecting discord user id)
	 * @param {string} timeout (optional) default is 1 minute
	 * @return {Promise<string>} return user's response if any, throws error if user didnt response in time
	 */
	static async wait4Msg(origin, author_id, timeout = 60000) {
		let input = await origin.channel.awaitMessages(
			(m) => m.author.id === author_id,
			{
				max: 1,
				time: timeout,
				errors: ["time"],
			}
		);

		let response = input.get(input.keyArray()[0]).content;
		return response;
	}

	/**
	 * Function to send paginated content
	 * @param {Discord.Message} origin
	 * @param {Array} pages page of content to send
	 * @param {number} page_count amount of pages
	 * @param {number} start_page (optional) which page to display on call. Default to first page
	 * @param {string} footer (optional) Default to "Page {n} of {max}", only display if page is a Discord.MessageEmbed, set to null to prevent this function overwritting existing footer
	 * @param {Array} emojiList (optional) default to ["⏮️", "⬅️", "➡️", "⏭️"]
	 * @param {number} timeout (optional) default to 10 minute
	 * @return {Promise<Function>} returns a function that can be used to modify the pages passed in
	 * @example
	 * function(new_page)
	 */
	static async paginated(
		origin,
		pages,
		page_count,
		start_page = 1,
		footer = "Page {n} of {max}",
		emojiList = ["⏮️", "⬅️", "➡️", "⏭️"],
		timeout = 600000
	) {
		if (page_count == 0) {
			throw new Error("No pages to display");
		}
		if (typeof pages[start_page - 1] === "undefined") {
			start_page = 1;
		}

        const applyFooter = (item, cur, max) => {
			if (footer) {
				item.setFooter(
					footer.replace("{n}", cur).replace("{max}", max)
				);
			}
		};

        applyFooter(pages[start_page-1], start_page, page_count);
		let sent_msg = await origin.channel.send(pages[start_page - 1]);

		let page_num = start_page;

		for (let i = 0; i < emojiList.length; i++) {
			await sent_msg.react(emojiList[i]);
		}

		const prevALL = sent_msg.createReactionCollector(
			(reaction, user) => reaction.emoji.name === emojiList[0],
			{
				time: timeout,
				dispose: true,
			}
		);
		const prev = sent_msg.createReactionCollector(
			(reaction, user) => reaction.emoji.name === emojiList[1],
			{
				time: timeout,
				dispose: true,
			}
		);
		const next = sent_msg.createReactionCollector(
			(reaction, user) => reaction.emoji.name === emojiList[2],
			{
				time: timeout,
				dispose: true,
			}
		);
		const nextALL = sent_msg.createReactionCollector(
			(reaction, user) => reaction.emoji.name === emojiList[3],
			{
				time: timeout,
				dispose: true,
			}
		);

		const resetAllTimer = () => {
			prevALL.resetTimer();
			prev.resetTimer();
			next.resetTimer();
			nextALL.resetTimer();
		};


		prevALL.on("collect", async (r, u) => {
            resetAllTimer();
			r.users.remove(u.id);
			if (page_num == 1) {
				return;
			}
            page_num = 1;
            applyFooter(pages[0], 1, page_count);
			sent_msg.edit(pages[0]);
		});

		prev.on("collect", async (r, u) => {
			resetAllTimer();
			r.users.remove(u.id);
			if (page_num <= 1) {
				return;
            }
            applyFooter(pages[--page_num - 1], page_num, page_count);
			sent_msg.edit(pages[page_num - 1]);
		});

		next.on("collect", async (r, u) => {
			resetAllTimer();
			r.users.remove(u.id);
			if (page_num >= page_count) {
				return;
            }
            applyFooter(pages[++page_num - 1], page_num, page_count);
			sent_msg.edit(pages[page_num - 1]);
		});
		nextALL.on("collect", async (r, u) => {
			resetAllTimer();
			r.users.remove(u.id);
			if (page_num >= page_count) {
				return;
			}
            page_num = page_count;
            applyFooter(pages[page_num - 1], page_count, page_count);
			sent_msg.edit(pages[page_num - 1]);
		});
		return function (new_page) {
			pages = new_page;
		};
	}
};
