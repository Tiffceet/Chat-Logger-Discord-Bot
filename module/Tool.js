/**
 * Handle all tools related command
 * @author Looz
 * @version 1.0
 */
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const { URLSearchParams } = require("url");
const Miscellaneous = require("./Miscellaneous");

var Tool = {
	// =============================================================
	// DEFAULT MODULE MEMBER
	// _module_dependency: store the class instances to be used
	// _init: To initalise this module
	// _init_status: Is this module initialised?
	// _worker: to be executed when a command comes in
	// _import: to load the class instances needed by this module
	// =============================================================
	_module_dependency: {},
	_init: async function () {
		Tool._init_status = true;
	},
	_init_status: false,
	_worker: function (origin, cmd_name, args) {
		if (origin == null) {
			return;
		}
		Tool[cmd_name](origin, args);
	},
	_import: function (dependency) {
		Tool._module_dependency = dependency;
	},
	// =============================================================
	// =============================================================

	// =============================================================
	// Command functions
	// =============================================================

	/**
	 * Roll a number !
	 * @param {Discord.Message} origin origin of the command sender
	 * @param {Array} args
	 * [
	 *  max: (optional) Number - Max number to roll (default 100)
	 * ]
	 */
	roll: async function (origin, args = []) {
		let min = 0;
		let max = 100;
		// extract number at the back if any
		if (args.length >= 1) {
			let substr = args[0];
			let convertedNum = parseInt(substr, 10);
			if (!isNaN(convertedNum)) {
				max = convertedNum;
			}
		}
		origin.channel.send(
			`<@${origin.author.id}> rolled a ${Math.floor(
				Math.random() * max - min
			)}`
		);
	},

	/**
	 * Pick a random person in discord server
	 * @param {Discord.Message} origin origin of the command sender
	 * @param {Array} args an array of options. Possible options: online, bot
	 */
	pick: async function (origin, args = []) {
		let memberList = origin.guild.members.cache.array().filter((mem) => {
			// if online arg is given
			let bool = true;
			if (args.includes("online")) {
				bool =
					(bool && mem.presence.status == "online") ||
					mem.presence.status == "idle";
			}

			if (!args.includes("bot")) {
				bool = bool && !mem.user.bot;
			}
			return bool;
        });
        if(memberList.length == 0) {
            origin.channel.send("It seems like there is no one to pick from, sad.");
            return;
        }
		let pickedUser =
			memberList[Math.floor(Math.random() * (memberList.length - 1))]
				.user;
		origin.channel.send(`${pickedUser.username}, you have been picked !`);
	},

	/**
	 * Unscramble a word
	 * @param {Discord.Message} origin origin of the command sender
	 * @param {Array} args
	 * [
	 *  word: string - word to unscramble
	 * ]
	 */
	unscramble: async function (origin, args = []) {
		if (args.length == 0) {
			Miscellaneous.help(origin, ["unscramble"]);
			return;
		}

		let word = args[0];

		const params = new URLSearchParams();
		params.append("letters", word);
		params.append("dictonary", "twl");
		params.append("repeat", "no");

		let HTMLResponse = await fetch(
			"https://wordunscrambler.me/unscramble",
			{
				method: "POST",
				body: params,
			}
		);

		let body = await HTMLResponse.text();

		let $ = cheerio.load(body);
		let unscrambled_words = [];
		let answers = $("div.result .list-wrapper ul").children();
		for (let i = 0; i < answers.length; i++) {
			if (
				answers[i].children[0].children[0].data.trim().length !=
				word.length
			) {
				continue;
			}
			unscrambled_words.push(
				answers[i].children[0].children[0].data.trim()
			);
		}
		if (unscrambled_words.length != 0) {
			origin.channel.send(
				"Possible word(s): " + unscrambled_words.join(", ")
			);
		} else {
			origin.channel.send(`Sorry but i could not unscramble ${word}`);
		}
	},

	// =============================================================
	// =============================================================
};

module.exports = Tool;
