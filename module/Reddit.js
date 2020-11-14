/**
 * Handle all commands that request reddit post
 * @author Looz
 * @version 1.0
 */
const Discord = require("discord.js");
const fetch = require("node-fetch");
var Reddit = {
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
		Reddit._init_status = true;
	},
	_init_status: false,
	_worker: function (origin, cmd_name, args) {
		if (origin == null) {
			return;
		}
		let reddit_name = Reddit.command_reddit[cmd_name];
		if (typeof reddit_name === "undefined") {
			return;
		}
		Reddit.send_reddit_post(origin, reddit_name, args);
	},
	_import: function (dependency) {
		Reddit._module_dependency = dependency;
	},
	// =============================================================
	// =============================================================

	// =============================================================
	// Module Variables
	// =============================================================
	command_reddit: {
		tellajoke: "ShortCleanFunny",
		scareme: "TwoSentenceHorror",
		cursedfood: "cursedfoods",
		food: "Food",
	},

	// =============================================================
	// Other Functions
	// =============================================================
	/**
	 *  Send a random reddit post from a reddit page !
	 * @param {Discord.Message} origin origin of the command sender
	 * @param {string} reddit_name reddit to fetch post from
	 * @param {boolean} include_image (optional) will send image if true
	 */
	send_reddit_post: async function (
		origin,
		reddit_name,
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
	},
	// =============================================================
	// =============================================================
};

module.exports = Reddit;
