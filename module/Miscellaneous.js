/**
 * To handle all Miscellaneous Command
 * @author Looz
 * @version 1.0
 */
const Discord = require("discord.js");
const fs = require("fs");
var Miscellaneous = {
	// =============================================================
	// DEFAULT MODULE MEMBER
    // _module_dependency: store the class instances to be used
    // _init: To initalise this module
    // _init_status: Is this module initialised?
	// _worker: to be executed when a command comes in
	// _import: to load the class instances needed by this module
	// =============================================================
    _module_dependency: {},
    _init: async function() {
        await Miscellaneous.reload_guild_prefix();
        Miscellaneous._init_status = true;
    },
    _init_status: false,
	_worker: function (origin, cmd_name, args) {
        if (origin == null) {
			return;
		}
		Miscellaneous[cmd_name](origin, args);
	},
	_import: function (dependency) {
		Miscellaneous._module_dependency = dependency;
    },
	// =============================================================
	// =============================================================

	// =============================================================
	// Local Variables/Constants of this module
	// =============================================================

	ualive_last_called_by: undefined,
	ualive_last_called_streak: 0,
	ualive_last_called_timestamp: undefined,
	ualive_status_msg: [
		"Yea, I'm here, lurking around, collecting data, bla bla bla.",
		"I know you miss me, I'm here",
		"Stop asking.",
		"I said stop",
		"I'm dead, happy now ?",
    ],
    DEFAULT_PREFIX: ".",
    guild_prefixes: {},

	// =============================================================
    
    // =============================================================
    // Other Functions
    // =============================================================
    reload_guild_prefix: async function (){
        let reloaded_prefixes = await Miscellaneous._module_dependency[
			"PinkFredorFirebase"
        ].retrieve_collection("guilds");
        
        if(typeof reloaded_prefixes != "undefined") {
            Miscellaneous.guild_prefixes = reloaded_prefixes;
        }
    },
    // =============================================================
    // =============================================================

	// =============================================================
	// Command functions
	// =============================================================

	/**
	 * To get help about the bot
	 * @param {Discord.Message} origin origin of the command caller
	 * @param {Array} args Arguments of this function
	 * [
	 *      command: string -- (optional) command you want specific help from
	 * ]
	 * @return {Discord.MessageEmbed} Discord Message Embed
	 */
	help: async function (origin = null, args = []) {
		// console.log(Miscellaneous._module_dependency);
		let help_desc = JSON.parse(fs.readFileSync("data/HelpDesc.json"));
		if (args[0]) {
			if (help_desc["command"][args[0]])
				origin.channel.send(
					new Discord.MessageEmbed().setTitle(args[0]).addFields(
						{
							name: "Description",
							value: `${help_desc["command"][args[0]].desc}`,
						},
						{
							name: "Usage",
							value: `${help_desc["command"][args[0]].usage}`,
						}
					)
                );
                return;
		}

		// Print help page instead if the help wanted was not command-specific
		origin.channel.send(
			new Discord.MessageEmbed()
				.setColor("#e9e9e9")
				.setTitle("Commands")
				.addFields(help_desc["help_page"])
				.setTimestamp()
				.setFooter(
					"https://github.com/Tiffceet/Chat-Logger-Discord-Bot"
				)
		);
	},
	/**
	 * Fun command, ask if the bot is alive
	 * @param {Discord.Message} origin origin of the command sender
	 * @param {*} args No args expected
	 */
	ualive: async function (origin = null, args = []) {
		let timeout_in_ms = 50000;

		if (
			Miscellaneous.ualive_last_called_by != origin.author.id ||
			Date.now() - Miscellaneous.ualive_last_called_timestamp >
				timeout_in_ms
		) {
			Miscellaneous.ualive_last_called_by = origin.author.id;
			Miscellaneous.ualive_last_called_streak = 0;
		}

		if (
			Miscellaneous.ualive_last_called_streak ==
			Miscellaneous.ualive_status_msg.length
		) {
			Miscellaneous.ualive_last_called_streak--;
		}
		origin.channel.send(
			Miscellaneous.ualive_status_msg[
				Miscellaneous.ualive_last_called_streak++
			]
		);
		Miscellaneous.ualive_last_called_timestamp = Date.now();
	},

	/**
	 * Change the prefix of the server
	 * @param {Discord.Message} origin origin of the command sender
	 * @param {Array} args Args of this function
	 * [
	 *      new_prefix: (optional) string new prefix for the server
	 * ]
	 */
	prefix: async function (origin = this.null, args = []) {

		let guilds_prefix = await Miscellaneous._module_dependency[
			"PinkFredorFirebase"
		].retrieve_collection("guilds");

		let g_prefix = guilds_prefix.find((e) => e.id == origin.guild.id);

		if (args.length == 0) {
			if (typeof guilds_prefix !== "undefined") {
				origin.channel.send(
					`The prefix for this server is \`${g_prefix.content.prefix}\``
				);
			} else {
				origin.channel.send(`The prefix for this server is \`.\``);
			}
			return;
		}

		let new_prefix = args[0];

		if (typeof g_prefix !== "undefined") {
			Miscellaneous._module_dependency[
				"PinkFredorFirebase"
			].update_document("guilds", origin.guild.id, {
				prefix: new_prefix,
				name: origin.guild.name,
			});
		} else {
			Miscellaneous._module_dependency["PinkFredorFirebase"].add_document(
				"guilds",
				origin.guild.id,
				{
					prefix: new_prefix,
					name: origin.guild.name,
				}
			);
        }
        origin.channel.send(
            `The prefix for this server had changed to \`${new_prefix}\``
        );

        Miscellaneous.reload_guild_prefix();
    }
	// =============================================================
	// =============================================================
};

module.exports = Miscellaneous;
