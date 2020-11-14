/**
 * Handle all commands that request an emote
 * @author Looz
 * @version 1.0
 */
// const Discord = require("discord.js");

const { DiscordAPIError } = require("discord.js");

// const fetch = require("node-fetch");
var Emotes = {
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
		Emotes._init_status = true;
	},
	_init_status: false,
	_worker: function (origin, cmd_name, args) {
		if (origin == null) {
			return;
		}

		let image_url = Emotes.command_imageurl[cmd_name];
		if (typeof image_url === "undefined") {
			return;
		}

		Emotes.send_image(origin, image_url);
	},
	_import: function (dependency) {
		Emotes._module_dependency = dependency;
	},
	// =============================================================
	// =============================================================

	// =============================================================
	// Module Variables
	// =============================================================

	command_imageurl: {
		smh: "https://media1.giphy.com/media/WrP4rFrWxu4IE/source.gif",
		doubt: "https://i.kym-cdn.com/entries/icons/facebook/000/023/021/e02e5ffb5f980cd8262cf7f0ae00a4a9_press-x-to-doubt-memes-memesuper-la-noire-doubt-meme_419-238.jpg",
		rekt: "https://media.giphy.com/media/vSR0fhtT5A9by/giphy.gif",
		confuse: "https://media.giphy.com/media/1X7lCRp8iE0yrdZvwd/giphy.gif",
	},

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
	send_image: async function (origin, url) {
		try {
			origin.channel.send("", {
				files: [url],
			});
		} catch (e) {
			console.log(e);
		}
	},

	// =============================================================
	// =============================================================
};

module.exports = Emotes;
